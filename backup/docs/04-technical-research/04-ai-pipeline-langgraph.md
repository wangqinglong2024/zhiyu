# 4.4 · AI 内容生产流水线

## 一、双层 AI 架构

### 1.1 架构原则
- **复杂工作流**：LangGraph(TS)
  - 多步推理 + 决策分支 + 状态管理
  - 内容工厂、批量生产、多轮校验
- **简单调用**：Vercel AI SDK
  - 单次 LLM 调用、流式响应
  - 用户端 AI 助理（v2）、单条改写

### 1.2 服务边界

```
┌──────────────────────────────────────────────┐
│  内容工厂（离线，管理后台触发）              │
│  ├── LangGraph 工作流                         │
│  ├── 多 LLM 路由（Claude / DeepSeek）        │
│  ├── TTS 生成                                 │
│  ├── 数据入库                                 │
│  └── 通知审校                                 │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  应用端 AI（在线）                            │
│  ├── Vercel AI SDK                            │
│  ├── 简单改写 / 解释 / 提示                   │
│  └── 流式响应                                 │
└──────────────────────────────────────────────┘
```

## 二、LLM 供应商策略

### 2.1 选型
- **首选高质量**：Claude Sonnet 4.5（中文 + 多语强、成本中等）
- **首选大批量**：DeepSeek V3 / V4（成本极低、中文母语）
- **备选**：GPT-5（OpenAI）/ Gemini 2.5 Pro / Qwen3-Max

### 2.2 路由策略

| 任务 | 首选 | 理由 |
|---|---|---|
| 课程知识点生成（中文） | DeepSeek | 中文最强 + 便宜 10x |
| 短文创作（发现中国） | Claude | 故事化叙事强 |
| 多语翻译（越/泰/印尼） | Claude | 多语并列质量好 |
| 红线检测 | DeepSeek | 便宜、批量 |
| 拼音校验 | 自有规则 + DeepSeek 兜底 | 规则为主 |
| 题目生成（自动出题） | DeepSeek | 模式化、批量 |
| 用户答疑（v2 RAG） | Claude | 高质量交互 |

### 2.3 成本估算
- 内容工厂月成本（10000 知识点 + 100 篇文章 + 4 语翻译）：
  - DeepSeek input $0.27 / 1M tok, output $1.10 / 1M tok
  - Claude Sonnet input $3 / 1M tok, output $15 / 1M tok
  - 估计：DeepSeek $30-50 + Claude $80-120 + TTS $40 ≈ **每月 $150-200**

## 三、LangGraph 工作流详细设计

### 3.1 工作流：发现中国短文生产

```typescript
import { StateGraph, END } from '@langchain/langgraph';

interface ArticleState {
  topic: string;
  category: string;
  outline?: string;
  zhContent?: string;
  sentences?: Sentence[];
  pinyinResults?: PinyinResult[];
  translations?: { vi?: string[]; th?: string[]; id?: string[]; en?: string[] };
  redlineFlags?: RedlineFlag[];
  audioUrls?: string[];
  finalRecord?: ArticleRecord;
  errors?: string[];
}

const graph = new StateGraph<ArticleState>({...})
  .addNode('outline', generateOutline)
  .addNode('zhWrite', writeChineseArticle)
  .addNode('split', splitToSentences)
  .addNode('pinyin', generatePinyin)
  .addNode('translate', translateMulti)  // 并行 4 语
  .addNode('redline', checkRedlines)
  .addNode('tts', generateTTS)            // 并行 N 句
  .addNode('persist', insertToDB)
  .addNode('notify', notifyReviewer)
  .addNode('error', handleError);

graph
  .addEdge('outline', 'zhWrite')
  .addEdge('zhWrite', 'split')
  .addEdge('split', 'pinyin')
  .addEdge('pinyin', 'translate')
  .addEdge('translate', 'redline')
  .addConditionalEdge('redline', (s) =>
    s.redlineFlags?.length ? 'error' : 'tts'
  )
  .addEdge('tts', 'persist')
  .addEdge('persist', 'notify')
  .addEdge('notify', END);
```

### 3.2 节点细节

#### Node: outline
- 输入：topic + category
- LLM：DeepSeek V3
- 提示词：包含红线规避 + 故事化叙事要求 + 长度规范
- 输出：3-5 段 outline

#### Node: zhWrite
- LLM：Claude Sonnet（质量优先）
- 输入：outline
- 输出：800-1500 字中文短文

#### Node: split
- 规则：按句号 / 问号 / 感叹号 + 长度 5-30 字
- 输出：Sentence[]

#### Node: pinyin
- 工具：pypinyin（Python） / chinese-tools（TS） + 自有词典
- LLM 兜底：DeepSeek 校验疑难拼音
- 输出：每句对应 PinyinResult

#### Node: translate (并行)
- LLM：Claude Sonnet
- 4 语种并行（Promise.all）
- 提示词：要求"自然口语 + 文化语境"

#### Node: redline
- 规则字典 + LLM 双层
- 字典：30+ 关键词 / 实体（越南红线、泰国王室、印尼宗教）
- LLM 兜底：判断"是否触及敏感"

#### Node: tts (并行)
- Azure Speech / ElevenLabs API
- 每句中文 → 1 个 mp3 / ogg
- 上传 Supabase Storage
- 限速 + 重试

#### Node: persist
- 写入 articles + sentences 表
- 事务保护
- 标记状态 = pending_review

#### Node: notify
- 通过 Supabase Realtime + email 通知母语审校员

### 3.3 工作流：课程知识点生产
- 类似上述但批量更大（一节 12 个知识点 = 12 条数据）
- 增加节点：lessonContext（确保 12 知识点话题连贯）+ quizTemplate（顺便生成题目）

### 3.4 工作流：小说章节生产
- 增加节点：plotContinuity（衔接前章剧情）
- 输出：长文（3000-5000 字）+ 句子拆分 + 翻译

### 3.5 状态持久化
- LangGraph state 持久化到 Postgres `langgraph_runs` 表
- 失败可重试（idempotency key）
- 管理后台可看流水

## 四、提示词工程（Prompt Engineering）

### 4.1 系统提示词模板

```
你是知语中文学习平台的内容创作助手。
目标读者：{language}（越/泰/印尼/英）母语者，HSK 水平 {level}。
风格要求：故事化叙事，具体场景，避免说教。
长度：{minWords}-{maxWords} 字。
红线（必须避免）：
  - 政治意识形态（中越/中泰/中印尼边界、台湾主权、新疆西藏议题）
  - 宗教比较 / 评价（佛教/伊斯兰/天主教/道教 全部中性）
  - 民族冲突历史（1979 中越战争、1998 印尼排华、泰王室一律不提）
  - 黄/暴/赌
请只输出正文，不要解释。
```

### 4.2 翻译提示词

```
你是 {targetLang} 母语翻译者，同时精通中文。
请将以下句子翻译成 {targetLang}，要求：
1. 自然口语，不要书面僵化
2. 保留中国文化特色词（如"红包"翻译时加注解）
3. 教学场景：用 {targetLang} 解释中文核心点
4. 简洁，匹配 HSK {level} 级理解能力
中文句子：{sentence}
请只输出翻译，不要解释。
```

### 4.3 题目生成提示词
- 10 类题型每类有独立模板（Q1-Q10 + P1-P3 拼音入门）
- 详见 `05-data-model-content.md` 题型规范

## 五、Vercel AI SDK 简单调用

### 5.1 用例
- 用户中心"AI 一键改写错题解释"
- IM 自动回复（v2）
- 个性化推荐文案生成

### 5.2 代码模式

```typescript
import { generateText, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// 流式
const result = streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  prompt: `用 ${userLang} 解释这道题为什么错：${question}`,
});

for await (const chunk of result.textStream) {
  // 推送给前端
}
```

## 六、内容审校工作台

### 6.1 工作台 UI（管理后台）
- 左侧：待审清单（按语种 / 模块 / 时间）
- 中间：原文 + AI 译文双栏
- 右侧：评分 + 修改 + 注释
- 下方：操作（通过 / 退回 / 修改后保存）

### 6.2 审校 SOP
1. 语言准确性（拼音、翻译）
2. 文化敏感性（红线复核）
3. 教学合理性（HSK 级别匹配）
4. 风格一致性（故事化、口语）
5. 通过 → 状态切 published

### 6.3 KPI
- 单条平均审校时间 < 90 秒
- 单语种审校员日产能 200-300 条
- 通过率 > 85%（首次）

## 七、内容质量评分

### 7.1 自动评分
- 准确性：拼音校验通过率
- 多样性：跟前 30 天比 unique vocab 占比
- 难度匹配：与 HSK 等级偏差
- 红线触发：直接 0 分

### 7.2 阈值
- < 70：自动退回 LLM 重生成
- 70-85：人工必审
- > 85：人工抽检 20%

## 八、内容工厂 SLA

| 模块 | 月产能（v1） | 母语审校延迟 |
|---|:---:|:---:|
| 发现中国 | 200+ 篇 / 月（4 类目 × 50） | < 48h |
| 系统课程 | 5000 知识点 / 月 | < 72h |
| 小说 | 50 章 / 月（5 部 × 10 章） | < 72h |
| 题目 | 自动随知识点生成 | 自动 |

## 九、风险与监控

| 风险 | 监控 |
|---|---|
| LLM API 失败率高 | 双供应商自动切换 + Sentry 告警 |
| 红线检测漏检 | 上线后用户举报 + 双层（规则 + LLM） |
| TTS 限速 | 队列 + 退避重试 |
| 母语审校积压 | 仪表盘实时显示 + 招新 |
| 内容版权（小说） | 全部原创 / AI / 公版改写 |

进入 [`05-data-model-content.md`](./05-data-model-content.md)。

# 06 · AI 内容工厂（AI Content Factory）

## 一、目标

- 60-80% 内容由 AI 生成 + 人工审校
- 文章 / 课程节 / 小说章节 / 游戏词包 全自动化
- 5 语言翻译流水化
- 成本可控（< $0.50 / 篇文章 / 节课程）

## 二、架构

```
[Admin UI] → [API factory.create] → [BullMQ Queue] → [Worker]
                                                       ↓
                                                [LangGraph Run]
                                                       ↓
                                          ┌────────────┼────────────┐
                                          ▼            ▼            ▼
                                       [Outline]   [Draft]     [Polish]
                                          ↓            ↓            ↓
                                       [Translate × 5 langs]
                                          ↓
                                       [Audio TTS × N sentences]
                                          ↓
                                       [Cover Image]
                                          ↓
                                       [Auto Eval]
                                          ↓
                                  [Save factory_task]
                                          ↓
                                  [Notify Reviewer]
                                          ↓
                                  [Human Review UI]
                                          ↓
                                  [Approve → Publish]
```

## 三、LangGraph 节点

### 3.1 文章生成 Graph
```ts
const articleGraph = new StateGraph<ArticleState>({
  channels: {
    inputs: null,        // {category, hsk, theme, length}
    outline: null,
    draft: null,
    polished: null,
    sentences: null,
    pinyin: null,
    translations: null,  // {en, vi, th, id, zh}
    audios: null,
    cover: null,
    evaluation: null,
    error: null,
  }
})
.addNode('outline', outlineNode)
.addNode('draft', draftNode)
.addNode('polish', polishNode)
.addNode('sentence_split', splitSentencesNode)
.addNode('pinyin', pinyinNode)
.addNode('translate', translateNode)
.addNode('audio', audioNode)
.addNode('cover', coverNode)
.addNode('evaluate', evaluateNode)
.addEdge('outline', 'draft')
.addEdge('draft', 'polish')
.addEdge('polish', 'sentence_split')
.addEdge('sentence_split', 'pinyin')
.addEdge('pinyin', 'translate')
.addEdge('translate', 'audio')
.addEdge('translate', 'cover')
.addEdge('audio', 'evaluate')
.addEdge('cover', 'evaluate')
.addConditionalEdges('evaluate', (s) =>
  s.evaluation.score >= 0.7 ? END : 'polish'  // 自动重试 max 2
);
```

### 3.2 各节点
| 节点 | 模型 | 用途 |
|---|---|---|
| outline | Claude Sonnet 4.5 | 大纲生成（按主题 + HSK） |
| draft | Claude Sonnet 4.5 | 完整初稿 |
| polish | Claude Sonnet 4.5 | 润色（节奏 / 词汇 / 文化适配） |
| sentence_split | DeepSeek V3 | 句子拆分（含标点） |
| pinyin | 内部库 | pinyin-pro 库直接调用，无 LLM |
| translate | Claude (en) + DeepSeek (vi/th/id) | 5 语翻译 |
| audio | DeepSeek TTS | 句级音频 |
| cover | DALL-E 3 (v1.5) | 封面图（v1 用模板） |
| evaluate | DeepSeek V3 | 评分（语法 / 难度 / 一致性） |

### 3.3 状态持久化
- LangGraph checkpointer → Postgres
- 中断可恢复
- 失败可重试单节点

## 四、Prompt 模板

### 4.1 模板结构（prompt_templates 表）
```yaml
name: article-outline-history
type: article-outline
version: 3
body: |
  你是一位 {language} 的中文教师，为 HSK {hsk_level} 学习者写作 {category} 主题的文章。
  
  主题：{theme}
  目标字数：{target_words} 字
  目标 HSK 词汇覆盖率：≥ 80%
  
  请输出大纲（JSON）：
  - title: 中文标题
  - hook: 开篇钩子
  - sections: [{name, key_points[]}]
  - target_vocab: 关键词汇 list
  - cultural_notes: 文化注释
variables:
  - language
  - hsk_level
  - category
  - theme
  - target_words
```

### 4.2 模板版本管理
- A/B 测试不同 prompt
- 性能指标：通过率 / 评分 / 成本
- 自动选最优版本（v1.5）

### 4.3 Few-shot
- 高质量样例库（人工标注）
- 按 category × hsk 组合检索
- 注入 prompt context

## 五、内容类型工作流

### 5.1 文章 Graph
- outline → draft (~800 字) → polish → split → pinyin → translate → audio → cover → eval
- 单篇成本目标：< $0.30
- 时间：~3-5 分钟

### 5.2 课程节 Graph
- 步骤设计（10-15 步骤）
- 每步骤 payload 生成
- 评分规则定义
- 单节成本：< $0.50

### 5.3 小说章 Graph
- 关联前章（角色 / 情节）
- 生成 ~3000 字章节
- 拆分句子
- 翻译 + 音频
- 单章成本：< $1.50

### 5.4 词包 Graph
- 主题词检索 / 生成
- 关联 HSK
- 拼音 / 英中翻译 / 例句 / 音频
- 100 词成本：< $0.50

## 六、人工审校流程

### 6.1 派发
- 评分 < 阈值 → 优先人审
- 评分 ≥ 阈值 → 抽检 20%
- 按审稿员语言能力派发

### 6.2 审校 UI
详见 `planning/ux/11-screens-admin.md` § 8

### 6.3 决策
- ✅ 通过 → 发布
- ✏️ 修改 → 在编辑器改
- 🔄 打回 → 工厂重生（带审稿意见）
- ❌ 废弃 → 标记不可用

### 6.4 SLA
- 审稿 48h
- 超时升级

## 七、成本控制

### 7.1 预算
- 月度总额（按 v1 / v1.5 / v2 配额）
- 单任务上限（$5 / 任务）
- 单模型限额

### 7.2 模型分工
- 主创作：Claude Sonnet 4.5（贵 $3/M-in $15/M-out）
- 副创作：DeepSeek V3（便宜 $0.27/M-in $1.10/M-out）
- 翻译辅助：DeepSeek
- 评估：DeepSeek

### 7.3 缓存
- 同 prompt + variables → 缓存（Redis 24h）
- 翻译 sentence-level 缓存（去重）

### 7.4 监控
- 实时成本仪表板
- 单任务详细分解
- 月度对账

## 八、质量评估

### 8.1 自动评估
- 语法（DeepSeek 评分）
- 难度（HSK 词汇覆盖率检查）
- 一致性（角色 / 时间线，小说）
- 文化适配（敏感词 / 政治 / 宗教）

### 8.2 评分维度（0-1）
- correctness 0-1
- difficulty_fit 0-1
- engagement 0-1
- cultural_safety 0-1
- 综合 = 加权平均

### 8.3 阈值
- > 0.85 自动通过审稿（v1.5+）
- 0.7-0.85 抽检
- < 0.7 强制人审

### 8.4 评估改进
- 人审反馈 → 训练评估器
- A/B prompt vs 评分相关性

## 九、安全与合规

### 9.1 内容安全
- 政治 / 宗教 / 暴力 关键词过滤
- AI 输出二次过滤（DeepSeek 审）
- 人审兜底

### 9.2 版权
- 提示词避免引用受版权内容
- 输出指纹 → 不重复 / 不抄袭检测
- 用户报告机制

### 9.3 文化适配
- 印尼避免猪 / 酒
- 泰国尊敬皇室
- 越南避免中越敏感
- 全球避免歧视

## 十、流量与重试

### 10.1 限流
- Anthropic API 限速 → backoff
- Token 预算节流
- 队列优先级（高 / 中 / 低）

### 10.2 重试
- 单节点失败 max 3 次
- 整 graph 失败 → 标记 failed + 通知
- 部分成功保留中间产物

### 10.3 死信
- DLQ → 人工 review

## 十一、产能规划

### 11.1 v1（M0-M3）
- 100 文章 / 月
- 50 课程节 / 月
- 20 小说章 / 月
- 30 词包 / 月

### 11.2 v1.5（M3-M9）
- 500 文章 / 月
- 200 课程节 / 月
- 100 小说章 / 月
- 100 词包 / 月

### 11.3 v2（M9-M15）
- 2000 文章 / 月
- 1000 课程节 / 月
- 500 小说章 / 月
- 500 词包 / 月

## 十二、可观测

### 12.1 LangSmith
- 全链路 tracing
- 成本 / 时延 / 错误
- 单 run 重放

### 12.2 业务指标
- 任务总数 / 成功率
- 平均成本
- 平均评分
- 人审通过率

### 12.3 告警
- 成本 > 月预算 80%
- 失败率 > 5%
- 平均评分骤降

## 十三、检查清单

- [ ] LangGraph 全部内容类型实现
- [ ] Prompt 模板版本管理
- [ ] 缓存命中率 > 30%
- [ ] 单任务成本达标
- [ ] 评估器自动评分
- [ ] 审校 UI 完整
- [ ] 安全过滤生效
- [ ] LangSmith 集成
- [ ] 成本告警配置

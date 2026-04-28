> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 3.3 · 系统课程 · 题型定义（10 标准 + 3 拼音入门）

## 一、概述

知语共定义 **13 种题型**（Q1-Q10 标准 + P1-P3 拼音入门），适用于：
- 节小测（每节 10 题）
- 章测（36 题混合）
- 阶段考（80-150 题）
- SRS 温故知新

题型结构需要支持：4 语种翻译 / 母语解释 / 音频。

## 二、Q1：选词填空（中文 → 中文）

### 描述
给一个中文句子，挖空 1 个词，4 选 1 中文词。

### 示例
> 我每天早上 ___ 一杯牛奶。
> A. 喝  B. 吃  C. 看  D. 写

### 数据结构
```json
{
  "type": "Q1",
  "stem_zh": "我每天早上 ___ 一杯牛奶。",
  "stem_translations": { "vi": "Mỗi sáng tôi ___ một ly sữa.", ...},
  "blank_position": 4,
  "options": ["喝", "吃", "看", "写"],
  "correct_index": 0,
  "explanation": { "vi": "'喝' nghĩa là uống...", ... },
  "knowledge_point_id": "uuid",
  "difficulty": 2
}
```

### 适用
- HSK 1-9 通用
- 工厂 / 电商 词汇

## 三、Q2：词义匹配（中 → 母语）

### 描述
给中文词，4 选 1 母语含义。

### 示例
> 加班 = ?
> A. làm thêm giờ ✓  B. nghỉ phép  C. lương  D. ca làm việc

## 四、Q3：母语 → 中文

### 描述
给母语意思，4 选 1 对应中文词 / 句。

### 示例（越南语）
> "Tôi yêu Trung Quốc" = ?
> A. 我爱中国 ✓  B. 我学中国  C. 我在中国  D. 我看中国

## 五、Q4：听音选词

### 描述
播放音频，4 选 1 中文（带拼音）。

### 示例
> [播放: nǐ hǎo]
> A. 你好 ✓  B. 您好  C. 你们  D. 好的

### 数据
```json
{
  "type": "Q4",
  "audio_url": "https://...",
  "options": [
    { "zh": "你好", "pinyin": "nǐ hǎo" },
    { "zh": "您好", "pinyin": "nín hǎo" },
    ...
  ],
  "correct_index": 0
}
```

## 六、Q5：听句子选答（HSK 4+）

### 描述
听一段对话，回答相关问题。

### 示例
> [播放对话: A:你今天怎么这么晚？ B:加班了。]
> 问：B 为什么晚回家？
> A. 看电影  B. 加班 ✓  C. 看朋友  D. 在路上

## 七、Q6：选词排序（HSK 3+）

### 描述
给打乱的中文词，按正确顺序组成句子。

### 示例
> 词块：[早上 / 我 / 牛奶 / 喝]
> 答案：我早上喝牛奶。

### 数据
```json
{
  "type": "Q6",
  "tokens": ["早上", "我", "牛奶", "喝"],
  "correct_order": [1, 0, 3, 2],
  "stem_native": "Sắp xếp các từ thành câu hoàn chỉnh"
}
```

## 八、Q7：判断对错

### 描述
给一句中文 + 母语翻译，判断翻译是否正确。

### 示例
> 中：他不在家。
> 越：Anh ấy không ở nhà.
> 对 / 错？ → 对 ✓

## 九、Q8：句子改错（HSK 4+）

### 描述
给一句有语法错的中文，从 4 个选项中选正确版本。

### 示例
> 错：我吃饭今天。
> A. 我今天吃饭。✓  B. 今天吃饭我。  C. 吃饭我今天。  D. 我吃今天饭。

## 十、Q9：句子翻译填空（HSK 4+）

### 描述
给一句完整母语句子，要求用中文写出（拖拽词块或键盘输入）。

### 示例
> 越：Tôi đang học tiếng Trung.
> 答：我在学中文。

### 评判
- 完全匹配 → 满分
- 词块拼接序对 → 满分
- 部分对：扣分提示
- 自由输入：模糊匹配（去标点 / 词序 + 同义）

## 十一、Q10：阅读理解（HSK 5+）

### 描述
读一段 100-300 字短文，回答 1-3 题。

### 示例
> 短文：（150 字 略）
> 问 1：作者去哪里了？
> 问 2：他什么时候回来？
> 问 3：本文主要说了什么？

### 数据
```json
{
  "type": "Q10",
  "passage_zh": "...",
  "passage_translations": {...},
  "passage_audio_url": "...",
  "questions": [
    { "q": "...", "options": [...], "correct_index": 0 },
    ...
  ]
}
```

## 十二、P1：拼音听辨（拼音入门）

### 描述
播放声母 / 韵母 / 声调，从 4 个选项中选对应拼音。

### 示例（声母）
> [播放: b]
> A. b ✓  B. p  C. m  D. f

### 示例（声调）
> [播放: mā（一声）]
> A. mā ✓  B. má  C. mǎ  D. mà

## 十三、P2：拼音拼读

### 描述
给中文字 / 词，从 4 选 1 选正确拼音。

### 示例
> 你好
> A. nǐ hǎo ✓  B. nĭ hǎo  C. ní háo  D. nì hào

## 十四、P3：拼音 → 字

### 描述
给拼音，4 选 1 选对应的中文字 / 词。

### 示例
> mā ma
> A. 妈妈 ✓  B. 马马  C. 麻麻  D. 骂骂

## 十五、题型分布建议

### 节小测（10 题）
- Q1-Q3：覆盖词义（4 题）
- Q4 / Q6：听写（2 题）
- Q7 / Q8：判断 + 改错（2 题）
- Q9 / Q10：综合（2 题）

> 实际混合可按节内容动态调整。

### 章测（36 题）
- 18 题节小测抽样
- 18 题新综合（覆盖整章）

### 阶段考（80-150 题，按 HSK 模考结构）

#### HSK 4 模考（80 题）
- Q4-Q5（听力）：30 题
- Q1 / Q9（阅读）：30 题
- Q9 / Q10（写作 / 综合）：20 题

#### HSK 6 模考（120 题）
- 听力 50 / 阅读 50 / 综合 20

### 拼音入门（30 题 / 模块 × 3）
- P1 / P2 / P3 综合

## 十六、题目生成规则

### 16.1 生成时机
- 节小测：节内容定稿后由 LangGraph 生成
- 章测：节小测题库抽样 + 综合题生成
- 阶段考：章测题库抽样 + HSK 模考结构题

### 16.2 生成约束
- 干扰项必须合理（不能完全无关）
- 干扰项词汇 HSK 等级 ≤ 题目 HSK 等级
- 同一题目避免选项过于接近（避免歧义）
- 解释（explanation）必须 4 语种

### 16.3 题目质量审核
- 自动校对：选项数 = 4，正确答案存在，无空值
- LLM 自评：合理度评分（≥ 0.85 通过）
- 母语审校：随机抽 10% 复审
- 用户报错：≥ 3 次报错触发人工复审

## 十七、题目数据模型

```sql
CREATE TABLE content_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','P1','P2','P3')),
  stem_zh TEXT,
  stem_translations JSONB,
  audio_url TEXT,
  options JSONB,           -- [{...}, ...]
  correct_answer JSONB,    -- index / array / text
  explanation JSONB,       -- 多语种解释
  knowledge_point_id UUID,
  lesson_id UUID,
  chapter_id UUID,
  stage_id UUID,
  track TEXT,
  hsk_level INT,
  difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
  tags TEXT[],
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'ai',  -- ai / human / hsk_real
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID,
  report_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_lesson ON content_questions(lesson_id, status);
CREATE INDEX idx_questions_kpoint ON content_questions(knowledge_point_id);
CREATE INDEX idx_questions_type ON content_questions(type, hsk_level);
```

进入 [`04-data-model-api.md`](./04-data-model-api.md)。

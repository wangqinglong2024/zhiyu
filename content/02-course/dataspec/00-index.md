# 课程学习引擎 · 数据生成规范 · 索引

> **业务**：5 主题 × 6 阶段 × ~6 章 × ~6 节 × 8–14 KP × 4–6 题/KP
> **库表**：14 张 `zhiyu.course_*`（目录 4 + KP/题 3 + 考试 1 + 学员进度 4 + 导入媒资 2）
> **F1 数据模型**：[function/02-course/ai/F1-AI-数据模型规范/](../../../function/02-course/ai/F1-AI-数据模型规范/)
> **PRD**：[function/02-course/prd/](../../../function/02-course/prd/)

---

## 文档导航

| # | 文件 | 内容 |
|---|------|------|
| 0 | 本文件 | 索引 + 业务速览 + 关键差异 |
| 1 | [01-生成流程与目录约定.md](./01-生成流程与目录约定.md) | 文件命名、批次、生成顺序、骨架先行 |
| 2 | [02-课程骨架-Stage0与主题Stage1-6.md](./02-课程骨架-Stage0与主题Stage1-6.md) | tracks/stages/chapters/lessons 4 表生成 + Stage 0 共享层与 Stage 1-6 主题层差异 |
| 3 | [03-知识点KP格式与7类差异.md](./03-知识点KP格式与7类差异.md) | KP 通用字段 + 7 类 content jsonb 模板 |
| 4 | [04-题目Question格式与12类差异.md](./04-题目Question格式与12类差异.md) | 题目通用字段 + 12 类 payload 模板 + exam_scope 划分 |
| 5 | [05-考试与组卷规则.md](./05-考试与组卷规则.md) | course_exams blueprint + 节测/章测/阶段考/HSK 模考 |
| 6 | [06-导入与校验.md](./06-导入与校验.md) | 导入命令、错误处理、幂等、回滚 |
| 7 | [07-批次规划与SEO-GEO要点.md](./07-批次规划与SEO-GEO要点.md) | 5 主题 × 6 阶段 总产能规划 + SEO/GEO 嵌入策略 |

---

## ⚠️ AI 直出铁律（必读，最高优先级）

所有可读文本字段（标题、拼音、解释、例句、翻译、题面、选项、解析、SEO/GEO 文案）**必须由生成 AI 在上下文中逐条直接撰写**：

- **拼音**：必须 AI 处理多音字，包括姓氏/地名/动名兼类/文言古汉语/轻声儿化/一不变调，禁止脚本默认首读。
- **多语言**：必须 AI 按当前 KP/题目场景语境翻译，专名前后一致，目标语自然，禁止脚本批量调机翻接口直接落盘。
- **正文**：禁止任何模板循环填充、跨 KP/题目复用相同骨架。
- **脚本边界**：`system/scripts/` 只允许做导入、删除、清理、结构与禁词校验、生成 manifest，**严格禁止**产出任何内容字段。

详见 [01-生成流程与目录约定.md §0](./01-生成流程与目录约定.md#0-ai-直出铁律最高优先级所有内容字段适用)。

---

## 业务速览（生成 AI 必读）

### 1. 5 主题

| code | 中文 | 性质 | 阶段数 | 内容来源 |
|------|------|------|-------|---------|
| `share` | 共享预备 | **基础公共课**（拼音/笔画/部首） | 1（Stage 0） | 跨主题复用，新用户首次进任意主题先做一次 |
| `ec` | 电商客服 | 场景主题 | 6（Stage 1–6） | 商品/订单/支付/物流/售后/直播 |
| `fc` | 工厂沟通 | 场景主题 | 6 | 宿舍/安全/生产/设备/质量/班组 |
| `hsk` | HSK 应试 | 应试主题 | 6 | 对应 HSK1–HSK6 词汇语法 |
| `dl` | 日常生活 | 场景主题 | 6 | 自我介绍/吃喝/出行/购物/医疗/旅游 |

### 2. ⚠️ Stage 0 与 Stage 1-6 的关键差异（**必读**）

> 你（生成 AI）必须区分这两类内容，否则会出大问题。

#### Stage 0（仅 `share` 主题）

- **内容性质**：拼音音节、四声、声母韵母、笔画、部首、汉字结构
- **KP 类型分布**：以 `pinyin` (KP1) 与 `hanzi` (KP2) 为主，**几乎不用** word/grammar/sentence/dialog
- **不是"讲文字"**：不教"价格"这种词，教的是"jià 这个音节" 与 "氵 这个部首"
- **题型限制**：
  - 主用 `tone_pick`（标声调）、`listen_pinyin`（听音填拼音）、`listen_pick`（听音选字）、`mcq_meaning`（如"氵和水有什么关系？"）
  - 不用 `sort_words`（短句太抽象）、`dialog_cloze`（无对话场景）
- **目录命名**：`content/02-course/data/share/stage0/chapter01-pinyin/lesson01/...`
- **跨主题复用**：Stage 0 的 KP `primary_track='share'`，会被 ec/fc/hsk/dl 各主题首节通过 `course_lesson_kp` 引用

#### Stage 1–6（`ec/fc/hsk/dl` 4 主题）

- **内容性质**：词汇 + 短语 + 句型 + 句子 + 对话
- **KP 类型分布**：以 `word` (KP3) 为主（约 60%），辅以 `phrase`/`grammar`/`sentence`/`dialog`
- **业务场景驱动**：每节标题/词汇必须围绕该主题该阶段的具体场景（如 ec-2-3 必须围绕"优惠与支付"）
- **题型完整**：12 类题型都用得上；`tone_pick`/`listen_pinyin` 等基础题型在 Stage 1–2 多用，`sort_words`/`dialog_cloze` 在 Stage 3+ 多用
- **目录命名**：`content/02-course/data/<track>/stage<n>/chapter<nn>/lesson<nn>/...`

### 3. 业务定位（每条数据必带）

每条 KP / Question 都通过**显式 lesson_code 关联**到具体节，不允许"散养"。
SEO/GEO 不生成独立外挂文件，必须写入 lesson / KP / question 的标题、标签、解释、entities、sources、examples 等内容字段。
所有课程例句默认适配越南、泰国、印尼等东南亚首发市场，禁止政治、宗教、民族、领土争议和成人性内容。

| 数据 | 关联通过 | 文件 |
|------|---------|------|
| KP | 通过 `lesson_kp.jsonl` 把 KP 挂到一个或多个 lesson | `batch_xxx.lesson_kp.jsonl` |
| Question | 通过 `kp_code` 关联到 KP（题目不直接挂 lesson） | `batch_xxx.questions.jsonl` |
| Question 进考试池 | 通过 `exam_scope` 数组声明（`practice`/`lesson_quiz`/`chapter_test`/`stage_exam`/`hsk_mock`） | 同上 |

### 4. 生成顺序（严格遵守）

```
Step 1（一次性）：骨架文件
  _skeleton/tracks.jsonl     5 行
  _skeleton/stages.jsonl     25 行
  _skeleton/chapters.jsonl   ~148 行
  _skeleton/lessons.jsonl    ~888 行
  → 由 PM 一次性整理 + 导入

Step 2（每节循环）：内容
  对每个 lesson_code 跑一个批次：
    a. <track>/stage<n>/chapter<nn>/lesson<nn>/batch_xxx.kp.jsonl       8–14 行
    b. <track>/stage<n>/chapter<nn>/lesson<nn>/batch_xxx.lesson_kp.jsonl 同上行数
    c. <track>/stage<n>/chapter<nn>/lesson<nn>/batch_xxx.questions.jsonl 32–84 行
    d. manifest.json

Step 3（每章/阶段）：试卷模板
  _exams/lesson_quiz/<lesson_code>.exam.json
  _exams/chapter_test/<chapter_code>.exam.json
  _exams/stage_exam/<track>-<stage>.exam.json
  _exams/hsk_mock/hsk-<stage>-mock-<nn>.exam.json
```

### 5. 全平台规模（一期目标）

| 项 | 数量 |
|----|------|
| 主题 | 5 |
| 阶段 | 25 |
| 章 | ~148 |
| 节 | ~888 |
| KP（含共享 1200） | ~11200 |
| 题目 | ~50000 |
| 试卷模板 | ~888 节测 + ~148 章测 + 25 阶段考 + 6 HSK 模考 = ~1067 份 |

### 6. 必读链接

| 主题 | 文件 |
|------|------|
| 业务总览 | [function/02-course/prd/00-总览与设计原则.md](../../../function/02-course/prd/00-总览与设计原则.md) |
| 课程目录 | [function/02-course/prd/01-课程目录骨架.md](../../../function/02-course/prd/01-课程目录骨架.md) |
| KP/题型 模板 | [function/02-course/prd/02-知识点与题型内容模板.md](../../../function/02-course/prd/02-知识点与题型内容模板.md) |
| 数据库 schema | [function/02-course/ai/F1-AI-数据模型规范/](../../../function/02-course/ai/F1-AI-数据模型规范/) |

---

## 任务模板（PM 派单时用）

### 模板 A：Stage 0 共享层

```
任务：生成共享预备 Stage 0 一节内容
范围：lesson_code = share-0-1-1（拼音入门第 1 节：声母 b/p/m/f）
KP 配比：12 KP 全部为 kp_type=pinyin
题型配比：每 KP 4 题 = (1 tone_pick + 1 listen_pinyin + 1 listen_pick + 1 mcq_meaning)
exam_scope：每题 ['practice', 'lesson_quiz']（节末小测）
输出：content/02-course/data/share/stage0/chapter01-pinyin/lesson01/batch_<日期>_001.{kp,lesson_kp,questions,manifest}
规范：content/02-course/dataspec/* + content/00-总览-数据生成规范.md
```

### 模板 B：主题层（电商）

```
任务：生成电商主题一节内容
范围：lesson_code = ec-2-3-1（电商 Stage 2 章 3 节 1：优惠券与折扣）
学习目标 i18n：{"zh":"...", ...}
目标词汇（中文）：优惠券, 满减, 折扣, 凑单, 限时, 包邮, 立减, 红包, 抢购, 秒杀
KP 配比：12 KP = 8 word + 2 phrase + 2 sentence
题型配比：每 KP 4 题
  - word: 1 mcq_meaning + 1 listen_pick + 1 type_zh_ime + 1 image_pick
  - phrase: 1 mcq_meaning + 1 sort_words + 1 fill_blank_choice + 1 listen_pick
  - sentence: 1 mcq_meaning + 1 sort_words + 1 listen_pick + 1 type_pinyin
exam_scope：所有题至少含 'practice'；额外 30% 含 'lesson_quiz'，10% 含 'chapter_test'
注意：exam_scope 中 chapter_test/stage_exam/hsk_mock 三者互斥
输出：content/02-course/data/ec/stage2/chapter03/lesson01/batch_<日期>_001.{kp,lesson_kp,questions,manifest}
规范：content/02-course/dataspec/* + content/00-总览-数据生成规范.md
```

### 模板 C：HSK 模考

```
任务：生成 HSK3 模考试卷
范围：scope_type=hsk_mock, scope_ref=stage(hsk-3) 第 1 套模考
组卷比例：按 HSK 官方比例（听力 40 题 + 阅读 30 题，详见 dataspec/05）
输出：content/02-course/data/_exams/hsk_mock/hsk-3-mock-01.exam.json
注意：本任务只生成 blueprint；具体题目需先存在于题库（exam_scope 含 hsk_mock）
```

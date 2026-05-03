# 发现中国 · 02 · 字段与 JSON 格式

> 完整字段规约。文件名保留历史编号，但当前格式已经从 JSONL 改为单篇 `*.article.json`。

---

## 1. 单篇 `article.json` 顶层结构

```jsonc
{
  "schema": "china.article.v2",
  "doc_version": "2026-05-phase1",
  "category_code": "01",
  "category_dir": "01-history",
  "article_slug": "01-dynasty-order-rhyme",
  "article": { ... },
  "content_policy": { ... },
  "source_story_zh": [ ... ],
  "seo": { ... },
  "geo": { ... },
  "sentences": [ ... ]
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `schema` | 是 | 固定 `china.article.v2` |
| `doc_version` | 是 | 数据规格版本，如 `2026-05-phase1` |
| `category_code` | 是 | `01..12`，必须与 `article.category_code` 一致 |
| `category_dir` | 是 | 类目目录名，如 `01-history` |
| `article_slug` | 是 | 文件稳定 slug，不等同 DB code |
| `article` | 是 | DB `china_articles` 可导入字段 |
| `content_policy` | 是 | 句数和更新策略 |
| `source_story_zh` | 是 | 完整中文故事源文，必须先生成完整故事，再拆成 `sentences` |
| `seo` | 是 | 搜索引擎元数据，必须随单篇 JSON 内嵌 |
| `geo` | 是 | AI 答案引擎元数据，必须随单篇 JSON 内嵌 |
| `sentences` | 是 | DB `china_sentences` 可导入字段数组 |

---

## 2. `article` 字段

```jsonc
{
  "local_id": "hist-001",
  "category_code": "01",
  "title_pinyin": "zhōng guó cháo dài shùn xù kǒu jué lǐ jiǎng le shén me",
  "title_i18n": {
    "zh": "中国朝代顺序口诀里讲了什么？",
    "en": "What Does the Chinese Dynasty Order Rhyme Tell Us?",
    "vi": "Câu vè thứ tự các triều đại Trung Quốc nói gì?",
    "th": "กลอนลำดับราชวงศ์จีนบอกอะไรเราบ้าง?",
    "id": "Apa Isi Rima Urutan Dinasti Tiongkok?"
  }
}
```

| 字段 | 要求 |
|------|------|
| `local_id` | 1–64 字符，文件内追踪用，不入库 |
| `category_code` | `01..12` |
| `title_pinyin` | 1–200 字，带声调，音节空格分隔 |
| `title_i18n.*` | 5 语言全齐，每项 1–40 字 |

AI 不写 `code`、`id`、`status`、`published_at`。导入脚本入库时生成 DB code，并默认 `draft`；如果命令带 `--publish`，导入后调用 `fn_publish_article`。

---

## 3. `content_policy`

```jsonc
{
  "sentence_target": 120,
  "sentence_hard_max": 120,
  "update_mode": "append_only_infinite",
  "phase": "phase1",
  "risk_controls": [
    "sea_market_safe",
    "no_politics",
    "no_ethnic_conflict",
    "no_religious_dispute",
    "no_territorial_dispute",
    "no_adult_sexual_content"
  ]
}
```

首期正式内容使用 120 句/篇。后续热点增量可以少于 120，但不得超过 120；需要更长内容时拆成系列文章。

`risk_controls` 是内容生成侧的合规声明，导入脚本可暂不入库，但生成 AI 必须按它执行。历史类文章只做中立事实和学习向科普，不写现实政治评论；所有类目都禁止成人性内容和色情暗示。

---

## 3.0 AI 直出铁律（最高优先级，所有字段适用）

> **本节凌驾于本规范其他所有条款。任何与本节冲突的“可以用脚本/字典/工具批量生成”表述一律作废。**

### 3.0.1 内容必须由 AI 直接撰写

- `article.title_i18n.*`、`article.title_pinyin`、`source_story_zh[*]`、`sentences[n].content_zh/en/vi/th/id`、`sentences[n].pinyin`、`seo.*`、`geo.*` 全部字段，**必须由生成 AI 在上下文中逐句、逐字段直接撰写**，禁止任何形式的脚本、模板、字典、TM、规则引擎批量产出。
- 禁止的反模式包括但不限于：
  - 用同一段“承接句模板”循环填充每个事实块；
  - 用脚本对中文逐字查表生成拼音；
  - 用脚本对每句调用通用机器翻译 API 后直接落盘；
  - 用 SEO/GEO 关键词反向拼接正文句子；
  - 把不同文章共用一段开场白或收束语。
- 一篇文章的正文必须有人物、场景、动机、冲突、转折、收束，120 句一气呵成可朗读，**任何两篇文章不得使用相同的句式骨架反复出现**。

### 3.0.2 拼音必须 AI 多音字感知

- `pinyin` 与 `title_pinyin` **必须由 AI 逐句根据上下文判断每一个多音字的正确读音后写出**，禁止脚本/字典默认取第一个读音。
- 多音字必须在上下文里判断的常见类型（不限于此清单）：
  - 姓氏与人名：`长孙(Zhǎngsūn)/单(Shàn)/任(Rén)/解(Xiè)/朴(Piáo)/区(Ōu)/查(Zhā)/尉迟(Yùchí)/曾(Zēng)/华(Huà)/翟(Zhái)/盖(Gě)/缪(Miào)/万俟(Mòqí)`。
  - 地名：`重庆(Chóngqìng)/六安(Lù'ān)/蚌埠(Bèngbù)/铅山(Yánshān)/朝阳(Cháoyáng)/大夏(Dàxià)/吐蕃(Tǔbō)/单于(Chányú)/月氏(Yuèzhī)/龟兹(Qiūcí)`。
  - 名词/动词兼类：`长(cháng/zhǎng)/重(zhòng/chóng)/中(zhōng/zhòng)/为(wéi/wèi)/曲(qū/qǔ)/省(shěng/xǐng)/参(cān/shēn/cēn)/恶(è/wù/ě)/差(chā/chà/chāi/cī)`。
  - 文言/古汉语用法：如“可汗(Kèhán)/单于(Chányú)/吐蕃(Tǔbō)/景颇(Jǐngpō)”等专名按学界通行读音。
  - 轻声与儿化：助词 `了/着/过/吗/呢/吧/的/地/得` 必须写轻声（不写声调），儿化按实际口语决定是否写 `r`。
  - 一/不变调：`一` 在去声前读 `yí`、在阴阳上前读 `yì`、单读读 `yī`；`不` 在去声前读 `bú`，其余读 `bù`。变调读音直接落地到 `pinyin` 字段。
- 拼音格式：声调使用带调字母（`ā á ǎ à`），不使用数字调；音节之间用单空格分隔；不在拼音里出现汉字、标点、英文。
- 如借助任何工具辅助生成拼音，**生成 AI 必须在写入文件前对每一个多音字逐个核校并改正**；提交的最终 JSON 必须由 AI 对每一句的拼音负责。

### 3.0.3 多语言翻译必须 AI 语境直出

- `content_en/vi/th/id` 与 `seo/geo` 中的多语言字段，**必须由 AI 在上下文中、按当前句义、当前段落、当前文章主题翻译产出**，禁止脚本批量调用通用翻译接口后直接落盘，禁止逐句对应英汉机翻式直译。
- 翻译必须满足：
  1. **专名一致**：人名、地名、朝代、官职、典籍在同一篇内保持同一种译法；首次出现可在英文括注拼音（如 `the Western Regions (Xīyù)`）。
  2. **语境贴合**：句子在叙事中的角色（铺垫/转折/对话/总结）必须在译文里体现，禁止把所有句子翻成相同节奏的陈述句。
  3. **目标语自然度**：英文使用自然现代英语；越南语、泰语、印尼语必须符合当地表达习惯，避免按中文语序硬翻；专有名词使用各语言常见译法。
  4. **文化中立**：避免引入译入语本身的政治或宗教评价；保持中立科普语气。
- 任何译文若 AI 自身不能确定，必须在生成时主动调整中文句以保证可译性，而不是输出占位、机翻或模糊表达。

### 3.0.4 脚本职责严格收口

- `content/01-china/data/scripts/` 与 `system/scripts/` 下的脚本**只允许承担**：导入数据、删除/清理数据、按本规范做结构与禁词校验、生成 manifest、生成索引等纯运维动作。
- 脚本**严格禁止**承担：撰写中文正文、生成拼音、生成多语言翻译、生成 SEO/GEO 文案、改写任何由 AI 直出的字段。
- 任何在 scripts 目录中以“生成内容”为目的的文件必须显式标注 `DEPRECATED — content must be authored by AI directly`，并在使用前由人工评审。

### 3.0.5 自检触发条件

出现以下任何一种情况即视为**违反本铁律**，必须废弃并由 AI 重写：

- 多篇文章共用同一段开场或收束；
- 多个事实块复用相同的承接句；
- 拼音中将多音字一律按字典首读处理；
- 译文出现机翻特征（如直译“四字成语”、词序错乱、专名前后不一致）；
- 任何由脚本批量产出的字段未经 AI 在上下文中逐条复核。

---

## 3.1 `source_story_zh` 生成铁律

发现中国文章必须先生成完整中文故事源文，再拆句和多语言适配。禁止直接用句子模板、事实卡片或 SEO/GEO 片段拼成正文。

```jsonc
"source_story_zh": [
  "公元前138年的清晨，长安城门外的车马已经备好。",
  "张骞知道自己要去的地方很远，也知道这趟路不会只是一场普通出使。"
]
```

| 步骤 | 要求 |
|------|------|
| 1. 完整中文故事 | 先写一篇可从头读到尾的小故事，首期固定 120 个中文句子 |
| 2. 中文断句 | `source_story_zh[n]` 必须与 `sentences[n].content_zh` 完全一致 |
| 3. 拼音生成 | 拼音只从 `content_zh` 生成，不允许手写错配或复用旧句拼音 |
| 4. 多语言适配 | `content_en/vi/th/id` 必须逐句对应中文故事语义，不允许留空、占位或泛化 |
| 5. 元数据后置 | SEO/GEO 只能从故事中抽取，不得反向生成正文句子 |

正文禁止出现生成过程话术，包括但不限于：`主线`、`线索`、`这一层`、`这个细节`、`读法`、`适合初学者`、`这篇文章`、`AI摘要`、`SEO`、`GEO`、`关键词`、`搜索热点`、`搜索页`、`长尾搜索`。

---

## 4. `seo` 字段

```jsonc
{
  "schema_type": "Article",
  "primary_keywords": {
    "zh": ["中国朝代顺序", "中国历史入门"],
    "en": ["Chinese dynasty order", "Chinese history timeline"],
    "vi": ["thứ tự triều đại Trung Quốc"],
    "th": ["ลำดับราชวงศ์จีน"],
    "id": ["urutan dinasti Tiongkok"]
  },
  "search_intents": ["what_is", "timeline", "beginner_learning"],
  "pseo_paths": ["/china/01-history/dynasty-order-rhyme"]
}
```

每篇必须覆盖：主关键词、长尾问题、目标语言搜索词、推荐落地页路径。

---

## 5. `geo` 字段

```jsonc
{
  "bluf": {
    "zh": "中国朝代顺序口诀用固定顺序帮助学习者记住主要王朝。",
    "en": "The dynasty order rhyme helps learners remember the main Chinese dynasties in sequence."
  },
  "entities": [
    { "type": "dynasty", "name_zh": "秦朝", "name_en": "Qin Dynasty" },
    { "type": "dynasty", "name_zh": "唐朝", "name_en": "Tang Dynasty" }
  ],
  "citation_notes": ["第 1 句可直接作为 AI 摘要答案", "实体名首次出现需中英对齐"]
}
```

GEO 必须体现 BLUF、实体协调、可引用句子和事实密度。不得把 GEO 单独做成脱离正文的外置文件，也不得为了 AI 引用制造敏感或成人化内容。

---

## 6. `sentences` 字段

每个元素是一句，按 `seq_in_article` 升序排列。

```jsonc
{
  "seq_in_article": 1,
  "pinyin": "zhōng guó cháo dài shùn xù kǒu jué yòng gù dìng shùn xù bāng zhù xué xí zhě jì zhù zhǔ yào wáng cháo",
  "content_zh": "中国朝代顺序口诀用固定顺序帮助学习者记住主要王朝。",
  "content_en": "The Chinese dynasty order rhyme uses a fixed sequence to help learners remember the main dynasties.",
  "content_vi": "Câu vè thứ tự triều đại Trung Quốc dùng trình tự cố định để giúp người học nhớ các triều đại chính.",
  "content_th": "กลอนลำดับราชวงศ์จีนใช้ลำดับตายตัวเพื่อช่วยผู้เรียนจำราชวงศ์หลัก",
  "content_id": "Rima urutan dinasti Tiongkok memakai urutan tetap untuk membantu pelajar mengingat dinasti utama."
}
```

| 字段 | 要求 |
|------|------|
| `seq_in_article` | 1..120，连续无跳号 |
| `pinyin` | 1–600 字，带声调，不用数字调 |
| `content_zh` | 1–400 字，简体中文，全角标点 |
| `content_en/vi/th/id` | 1–400 字，自然翻译 |

第 1 句必须是 BLUF：直接回答标题问题，不写寒暄或铺垫。

---

## 7. 自检清单

- [ ] 每个文件只含 1 篇文章
- [ ] `schema = china.article.v2`
- [ ] `category_code` 三处一致：顶层、`article`、manifest
- [ ] `source_story_zh.length = sentences.length`
- [ ] `source_story_zh[n] = sentences[n].content_zh`
- [ ] `sentences.length <= 120`
- [ ] 首期 phase1 正式内容 `sentences.length = 120`
- [ ] `seq_in_article` 从 1 连续到 N
- [ ] 第 1 句是 BLUF
- [ ] 5 语言全齐
- [ ] SEO/GEO 元数据没有缺失
- [ ] 文件不含 DB `id/code/article_id/created_at/audio_url_zh`
- [ ] 内容适合越南、泰国、印尼等东南亚首发市场

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

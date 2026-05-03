# 课程 · 04 · 题目（Question）格式与 12 类差异

> 本节定义 `course_questions` 表的 jsonl 输出格式。
> 12 类题型的 `payload` 结构差异极大，**每类必须按下面模板生成**。

> ⚠️ **AI 直出铁律**：本文件定义的题目 `payload` 中所有可读字段（题面 stem、选项 options、提示 hints、解析 explanation 及任何多语言字段）必须由 AI 在上下文中逐题直接撰写。拼音必须处理多音字，多语言必须按题目场景语境翻译；禁止脚本/模板批量生成内容。脚本只允许做导入、删除、校验、生成 manifest。详见 [01-生成流程与目录约定.md §0 AI 直出铁律](./01-生成流程与目录约定.md#0-ai-直出铁律最高优先级所有内容字段适用)。

---

## 1. Question jsonl 通用字段

文件：`batch_xxx.questions.jsonl`，每行一道题。

```jsonc
{
  "__kp_local_id":  "k1",                      // 关联到本批次新建的 KP；与 kp_code 二选一
  "kp_code":        "kp_share_p_000001",       // 关联到已存在的 KP；与 __kp_local_id 二选一
  "q_type":         "mcq_meaning",             // 12 选 1
  "exam_scope":     ["practice", "lesson_quiz"], // 见 §2
  "difficulty":     2,                         // 1–6（已 deprecated 但仍要写）
  "audio_url":      null,                      // 题型不需要则 null；占位用 cdn://placeholder/...
  "image_url":      null,
  "payload":        { /* 12 类差异，见 §3 */ }
}
```

**禁止字段**：`id` / `q_code` / `is_published` / `version` / `payload_hash` / `report_count` / `published_at` / `created_at` / `source_batch_id`（这些由 DB / 触发器 / 导入脚本管理）。

---

## 2. exam_scope（**最重要的业务字段**）

值域：`['practice', 'lesson_quiz', 'chapter_test', 'stage_exam', 'hsk_mock']` 子集。

### 2.1 互斥与共享规则

```
practice + lesson_quiz   ← 共享题池（可同时出现）
chapter_test ⊕ stage_exam ⊕ hsk_mock   ← 三者互斥（只能选一个）
```

合法示例：

```
['practice']
['practice', 'lesson_quiz']
['practice', 'lesson_quiz', 'chapter_test']
['practice', 'lesson_quiz', 'stage_exam']
['lesson_quiz']
['chapter_test']
['stage_exam']
['hsk_mock']                         ← 仅 hsk 主题
```

非法示例（DB CHECK 不直接拒，但**业务必须不允许**）：

```
['chapter_test', 'stage_exam']       ← 互斥
['practice', 'hsk_mock']             ← hsk_mock 不与其它共存
['stage_exam', 'hsk_mock']           ← 互斥
```

### 2.2 分配策略（每节 32–84 题的目标分布）

| exam_scope | 每节占比 | 含义 |
|------------|---------|------|
| `['practice']` | 50% | 仅练习区，最基础题 |
| `['practice','lesson_quiz']` | 30% | 练习 + 节末小测 |
| `['practice','lesson_quiz','chapter_test']` | 12% | 进章测题池 |
| `['practice','lesson_quiz','stage_exam']` | 8% | 进阶段考题池（高难度） |
| `['hsk_mock']` | 仅 hsk 主题，单独生成 | 进 HSK 模考题池 |

### 2.3 hsk_mock 特殊规则

- 仅出现在 `primary_track='hsk'` 的 KP 关联题目
- 一道题不能同时属于 hsk_mock 和其它 scope（DB 不强制，业务自律）
- HSK 模考题量大（一套 80 题左右，6 stage 每 stage 至少 3 套），**单独生成批次**：`content/02-course/data/hsk/_hsk_mock/batch_xxx.questions.jsonl`

---

## 3. 12 类 payload schema（必读）

> 通用结构：`stem` + `options` + `answer` + `explanation` + `scoring`。

### 3.1 `mcq_meaning`（中→外文意思选择）

```json
{
  "stem":   { "zh": "优惠券", "pinyin": "yōuhuìquàn" },
  "options_i18n": {
    "en": ["coupon","invoice","receipt","discount"],
    "vi": ["phiếu giảm giá","hóa đơn","biên lai","giảm giá"],
    "th": ["คูปอง","ใบแจ้งหนี้","ใบเสร็จ","ส่วนลด"],
    "id": ["kupon","faktur","tanda terima","diskon"]
  },
  "answer": "A",
  "explanation": {
    "zh":"优惠券是商家发放的折扣凭证，对应 coupon。",
    "en":"...","vi":"...","th":"...","id":"..."
  },
  "scoring": { "type": "single", "score": 1 }
}
```

学员端按其 `learn_lang` 选 4 选项之一。需 4 选项，正确答案位置随机。

### 3.2 `mcq_zh`（外→中文选择）

```json
{
  "stem_i18n": {
    "en":"coupon","vi":"phiếu giảm giá","th":"คูปอง","id":"kupon",
    "zh":"——"
  },
  "options_zh": ["优惠券","发票","收据","折扣"],
  "options_pinyin": ["yōuhuìquàn","fāpiào","shōujù","zhékòu"],
  "answer": "A",
  "explanation": { "zh":"...","en":"...","vi":"...","th":"...","id":"..." },
  "scoring": { "type":"single", "score":1 }
}
```

### 3.3 `listen_pick`（听音选词）

```json
{
  "stem":   { "audio_url": "cdn://placeholder/.../q1.mp3", "play_limit": 3 },
  "options_zh":     ["优惠券","发票","收据","折扣"],
  "options_pinyin": ["yōuhuìquàn","fāpiào","shōujù","zhékòu"],
  "answer": "A",
  "explanation": { "zh":"...", /* 5 lang */ },
  "scoring": { "type":"single", "score":1 }
}
```

`play_limit` 默认 3，HSK 模考为 1。

### 3.4 `listen_pinyin`（听音填拼音）

```json
{
  "stem": { "audio_url": "cdn://placeholder/.../q1.mp3", "play_limit": 3 },
  "expected_pinyin": "yōuhuìquàn",
  "answer_normalize": { "case_insensitive": true, "accept_no_tone": false },
  "explanation": { "zh":"...", /* 5 lang */ },
  "scoring": { "type":"binary", "score":1 }
}
```

`accept_no_tone=false` 时学员必须输入带声调，前端提供拼音键盘。

### 3.5 `tone_pick`（标声调）

```json
{
  "stem": { "zh":"中国","pinyin_no_tone":"zhongguo","audio_url":"cdn://placeholder/..." },
  "syllables": ["zhong","guo"],
  "answer_tones": [1, 2],
  "explanation": { "zh":"中(zhōng) 第一声；国(guó) 第二声。", /* 5 lang */ },
  "scoring": { "type":"partial", "per_syllable": 0.5, "score":1 }
}
```

每音节单独打分；轻声写 5。

### 3.6 `match_pairs`（连线）

```json
{
  "stem": { "instruction_i18n": { "zh":"将左边的中文与右边的释义连线", "en":"...", "vi":"...", "th":"...", "id":"..." } },
  "left":  [
    { "id":"L1", "zh":"优惠券", "pinyin":"yōuhuìquàn" },
    { "id":"L2", "zh":"发票",   "pinyin":"fāpiào" },
    { "id":"L3", "zh":"收据",   "pinyin":"shōujù" },
    { "id":"L4", "zh":"折扣",   "pinyin":"zhékòu" },
    { "id":"L5", "zh":"包邮",   "pinyin":"bāoyóu" },
    { "id":"L6", "zh":"满减",   "pinyin":"mǎnjiǎn" }
  ],
  "right_i18n": {
    "en": [
      { "id":"R1", "text":"coupon" },
      { "id":"R2", "text":"invoice" },
      { "id":"R3", "text":"receipt" },
      { "id":"R4", "text":"discount" },
      { "id":"R5", "text":"free shipping" },
      { "id":"R6", "text":"discount when total exceeds" }
    ],
    "vi": [ /* 同结构 */ ],
    "th": [ /* ... */ ],
    "id": [ /* ... */ ]
  },
  "answer_pairs": [["L1","R1"],["L2","R2"],["L3","R3"],["L4","R4"],["L5","R5"],["L6","R6"]],
  "explanation": { "zh":"...", /* 5 lang */ },
  "scoring": { "type":"partial", "per_pair": 0.1667, "score":1 }
}
```

6–8 对；left/right 同长度。

### 3.7 `sort_words`（词序排列成句）

```json
{
  "stem_i18n": {
    "en":"Translate to Chinese: 'Please give me a discount.'",
    "vi":"...","th":"...","id":"...","zh":"——"
  },
  "tokens_zh": ["请","给","我","一个","折扣"],
  "correct_order": ["请","给","我","一个","折扣"],
  "alt_correct_orders": [],
  "explanation": { "zh":"主谓宾结构：请（敬辞）+ 给 + 我（间宾）+ 一个折扣（直宾）。", /* 5 lang */ },
  "scoring": { "type":"binary", "score":1 }
}
```

`tokens_zh` 学员端会打乱；`alt_correct_orders` 用于多解（多数题为空）。

### 3.8 `fill_blank_choice`（选词填空）

```json
{
  "stem": {
    "template_zh": "请___一张优惠券。",
    "blank_index": 1,
    "pinyin_template": "Qǐng ___ yī zhāng yōuhuìquàn."
  },
  "options_zh":     ["发","送","给","拿"],
  "options_pinyin": ["fā","sòng","gěi","ná"],
  "answer": "B",
  "explanation": { "zh":"「送」表赠予，「请送一张优惠券」是常见客服请求。", /* 5 lang */ },
  "scoring": { "type":"single", "score":1 }
}
```

### 3.9 `type_pinyin`（输入拼音）

```json
{
  "stem": { "zh":"优惠券", "audio_url":"cdn://placeholder/...", "play_limit":3 },
  "expected_pinyin": "yōuhuìquàn",
  "answer_regex": "^y[ōo]uhu[ìi]qu[àa]n$",
  "answer_normalize": { "case_insensitive": true, "accept_no_tone": true, "no_tone_score": 0.5 },
  "explanation": { "zh":"yōu-huì-quàn 三个音节。", /* 5 lang */ },
  "scoring": { "type":"single", "score":1 }
}
```

`accept_no_tone=true` 时无声调拼音可得部分分（`no_tone_score`）。

### 3.10 `type_zh_ime`（IME 打字）

```json
{
  "stem_i18n": { "en":"Type the Chinese for 'coupon':", "vi":"...", "th":"...", "id":"...", "zh":"——" },
  "hint_pinyin": "yōuhuìquàn",
  "expected_zh": "优惠券",
  "accept_traditional": false,
  "explanation": { "zh":"...", /* 5 lang */ },
  "scoring": { "type":"binary", "score":1 }
}
```

`accept_traditional=false` 时繁体输入判错（与 §禁繁体 一致）。

### 3.11 `image_pick`（看图选词）

```json
{
  "stem":   { "image_url":"cdn://placeholder/.../q1.png", "instruction_i18n":{"zh":"图中是什么？","en":"...", "vi":"...", "th":"...", "id":"..."} },
  "options_zh":     ["优惠券","发票","收据","折扣"],
  "options_pinyin": ["yōuhuìquàn","fāpiào","shōujù","zhékòu"],
  "answer": "A",
  "explanation": { "zh":"...", /* 5 lang */ },
  "scoring": { "type":"single", "score":1 }
}
```

### 3.12 `dialog_cloze`（对话填空）

```json
{
  "stem": {
    "instruction_i18n": { "zh":"选择最合适的回复：", "en":"...", "vi":"...", "th":"...", "id":"..." },
    "turns": [
      { "role":"buyer",  "zh":"你好，这件商品有优惠券吗？", "pinyin":"...", "audio_url":"cdn://placeholder/..." },
      { "role":"seller", "zh":"___",                          "is_blank": true },
      { "role":"buyer",  "zh":"好的，谢谢！",                 "pinyin":"..." }
    ]
  },
  "options_zh": [
    "有的，您可以领取满 100 减 10 的券。",
    "对不起，没有打折。",
    "请问您要几件？",
    "我们不卖这个。"
  ],
  "options_pinyin": [ "...", "...", "...", "..." ],
  "answer": 0,
  "explanation": { "zh":"客户询问优惠券有无，最合理的回复是介绍可领取的券。", /* 5 lang */ },
  "scoring": { "type":"single", "score":1 }
}
```

---

## 4. KP × 题型 推荐配比（每 KP 4 题）

| kp_type | 推荐题型组合（4 题） |
|---------|---------------------|
| `pinyin` | `tone_pick` + `listen_pinyin` + `listen_pick` + `mcq_meaning` |
| `hanzi`  | `mcq_meaning` + `image_pick` + `type_zh_ime` + `listen_pick` |
| `word`   | `mcq_meaning` + `listen_pick` + `type_zh_ime` + `image_pick` |
| `phrase` | `mcq_meaning` + `sort_words` + `fill_blank_choice` + `listen_pick` |
| `grammar`| `fill_blank_choice` + `sort_words` + `mcq_zh` + `mcq_meaning` |
| `sentence`| `mcq_meaning` + `sort_words` + `listen_pick` + `type_pinyin` |
| `dialog` | `dialog_cloze` + `listen_pick` + `mcq_meaning` + `sort_words` |

进阶节可加到 6 题/KP（多 1 个 type_pinyin + 1 个 dialog_cloze）。

---

## 5. 答案键归一化（重要）

| 题型 | answer 类型 | 取值 |
|------|------------|------|
| mcq_meaning / mcq_zh / listen_pick / fill_blank_choice / image_pick | `string` | `'A'\|'B'\|'C'\|'D'`（4 选 1） |
| listen_pinyin | 无 answer，看 `expected_pinyin` + `answer_normalize` | — |
| tone_pick | `int[]` | 每音节声调 1–5 |
| match_pairs | `[[leftId,rightId], ...]` | 配对数组 |
| sort_words | 看 `correct_order` + `alt_correct_orders` | — |
| type_pinyin | 无 answer，看 `expected_pinyin` + `answer_regex` | — |
| type_zh_ime | 无 answer，看 `expected_zh` + `accept_traditional` | — |
| dialog_cloze | `int` | 选项 index 0–3 |

---

## 6. 自检清单

- [ ] 每行 `q_type` 在 12 类内
- [ ] 每行 `__kp_local_id` 或 `kp_code` 二选一
- [ ] `exam_scope` 至少含 1 个值，且 chapter/stage/hsk_mock 三者互斥
- [ ] hsk_mock 题目仅出现在 hsk 主题 KP 下
- [ ] `payload` 结构按 §3 模板齐全
- [ ] 4 选项题（mcq/listen_pick/fill_blank_choice/image_pick）`options*` 长度 = 4，`answer` 在 A-D
- [ ] match_pairs 6–8 对，left/right 同长度
- [ ] sort_words `tokens_zh` 与 `correct_order` 元素相同（顺序无关）
- [ ] tone_pick `answer_tones` 长度与 `syllables` 相同
- [ ] explanation 5 语言齐
- [ ] options_zh / options_pinyin 长度一致
- [ ] options_i18n（如有）4 语言（en/vi/th/id）齐
- [ ] 中文不含繁体
- [ ] 拼音带声调
- [ ] 音频/图片占位用 `cdn://placeholder/<lesson>/<localid>-<n>.mp3`，导入后由媒资任务替换

# 200 Prompt 测试矩阵

> **目的**：每周一自动跑，量化知语在各 AI 引擎的引用率，指导内容优化方向。

---

## 1. Matrix 设计

### 1.1 维度

```
Prompt × Engine × Locale × Time
   200      6        4       weekly
   = 200 × 6 × 4 = 4800 测试 / 周
```

### 1.2 6 个引擎

1. ChatGPT (with Search)
2. ChatGPT (no Search) — 对照组
3. Perplexity
4. Google AI Overviews（用 SERP API 抓）
5. Claude
6. Gemini App

---

## 2. 200 Prompt 分布

### 2.1 业务覆盖

| 类别 | Prompt 数 | 例 |
|-----|----------|----|
| HSK 学习 | 40 | "best app for HSK 4 vocabulary 2026" |
| 汉字学习 | 30 | "how to memorize chinese characters effectively" |
| 拼音 | 15 | "best pinyin chart with audio" |
| 成语 | 25 | "chinese idiom for friendship" |
| 文化 | 30 | "mid autumn festival 2026 date" |
| 课程对比 | 20 | "duolingo vs hellochinese for hsk" |
| 工具 | 10 | "free chinese stroke order tool" |
| 商务/工厂中文 | 15 | "learn business mandarin for ecommerce" |
| 旅游中文 | 10 | "essential chinese phrases for travelers" |
| 长尾 | 5 | "what does 学 mean in chinese" |
| **合计** | **200** | |

### 2.2 4 Locale

| Locale | Prompt 数（同 200，各自翻译）|
|-------|------------------------|
| en-US | 200 |
| en-GB | 200（仅小变体）|
| vi-VN | 200（vi 翻译版）|
| th-TH | 200（th 翻译版）|

实际跑：先 en + vi + th 共 600 prompt × 6 引擎 = 3600 测试 / 周

---

## 3. 自动化脚本

### 3.1 ChatGPT API（with web search 工具）

```python
import openai
client = openai.OpenAI(api_key=...)

def test_chatgpt(prompt: str) -> dict:
    response = client.responses.create(
        model="gpt-4.1",
        tools=[{"type": "web_search_preview"}],
        input=prompt,
    )
    text = response.output_text
    citations = response.output[0].content[0].annotations  # 引用 URL
    has_zhiyu = any('zhiyu.app' in c.url for c in citations)
    return {"text": text, "citations": citations, "cited_zhiyu": has_zhiyu}
```

### 3.2 Perplexity API

```python
import requests

def test_perplexity(prompt: str) -> dict:
    r = requests.post('https://api.perplexity.ai/chat/completions',
        headers={'Authorization': f'Bearer {API_KEY}'},
        json={
            'model': 'sonar-pro',
            'messages': [{'role': 'user', 'content': prompt}],
            'return_citations': True,
        }
    ).json()
    text = r['choices'][0]['message']['content']
    citations = r['citations']
    has_zhiyu = any('zhiyu.app' in c for c in citations)
    return {"text": text, "citations": citations, "cited_zhiyu": has_zhiyu}
```

### 3.3 Claude API（with web tool）

```python
import anthropic
def test_claude(prompt):
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-sonnet-4-5",
        tools=[{"type": "web_search_20250305"}],
        messages=[{"role": "user", "content": prompt}],
    )
    # 解析引用
    ...
```

### 3.4 Google AI Overviews（SERP API）

```python
# 用 SerpAPI 或 Bright Data
def test_google_aio(prompt):
    r = requests.get('https://serpapi.com/search', params={
        'q': prompt,
        'api_key': SERP_KEY,
        'gl': 'us',
        'hl': 'en',
    }).json()
    aio = r.get('ai_overview', {})
    sources = aio.get('sources', [])
    has_zhiyu = any('zhiyu.app' in s.get('link','') for s in sources)
    return {"sources": sources, "cited_zhiyu": has_zhiyu}
```

### 3.5 Gemini App（无公开 API，用 puppeteer 抓取）

需用 headless browser，复杂度高。可暂用 Gemini API（与 App 不完全一致但近似）。

---

## 4. 数据存储

```sql
CREATE TABLE prompt_results (
  ts Date,
  prompt_id Int32,
  engine String,
  locale String,
  cited_zhiyu Bool,
  cited_competitors Array(String),
  citation_position Int8,        -- 第几个引用
  full_response_text String,
  citations_json String
) ENGINE = MergeTree() ORDER BY (ts, engine, prompt_id);
```

---

## 5. 周报模板

```markdown
# AI Citation Weekly Report — Week N

## Overall
- 200 prompts × 6 engines = 1200 测试
- 引用 Zhiyu 次数: X (week prior: Y, ΔX%)
- 整体引用率: X% (target: 30%)

## By Engine
| Engine | Cited / Total | Rate | WoW |
|--------|---------------|------|-----|
| ChatGPT | 60/200 | 30% | +5% |
| Perplexity | 100/200 | 50% | +10% |
| AI Overviews | 30/200 | 15% | +2% |
| Claude | 25/200 | 12% | +3% |
| Gemini | 15/200 | 7% | +1% |
| Copilot | 40/200 | 20% | +4% |

## By Category
... HSK, 汉字, 文化 ...

## Newly Cited (本周新进引用)
- "best HSK 4 vocabulary list 2026" — ChatGPT
- ...

## Lost Citations (本周失去引用)
- "duolingo vs zhiyu" — Perplexity
   → Reason: Competitor 写了新对比文 → 需 counter-content

## Competitor Citation
- Duolingo cited X times, HelloChinese Y times, Pleco Z times

## Action Items
- [ ] 补 X prompt 内容（5 篇待写）
- [ ] 修 Y prompt 失去引用（2 篇 BLUF 重写）
```

---

## 6. 200 Prompt 完整清单（精选 50 示例，全 200 见 Notion 维护）

```
HSK 学习
1. best app to learn HSK 4 vocabulary in 2026
2. how long to pass HSK 4 from zero
3. HSK 4 vs HSK 5 difficulty
4. free HSK 4 vocabulary list with audio
5. HSK 3.0 vs HSK 4.0 difference
6. how many words for HSK 6
7. is HSK 6 enough for chinese university
8. HSK 4 sample questions pdf
9. HSK exam fee 2026
10. how to register for HSK online
... (30 more)

汉字
41. how to memorize chinese characters effectively
42. how many chinese characters to learn HSK 4
43. simplified vs traditional chinese characters
44. best chinese character dictionary online
45. chinese character stroke order rules
... (25 more)

拼音
71. best pinyin chart with audio
72. how to type pinyin with tones on iphone
73. pinyin to chinese character converter
... (12 more)

成语
86. chinese idiom for friendship
87. chinese idiom about hard work
88. story behind 画蛇添足
... (22 more)

文化
111. mid autumn festival 2026 date
112. chinese new year 2026 traditions
113. eight great chinese cuisines
114. confucianism vs taoism
... (26 more)

课程对比
141. duolingo vs hellochinese for hsk
142. best free chinese learning app
143. zhiyu vs duolingo
... (17 more)

(以此类推到 200)
```

---

## 7. 优化反馈循环

```
prompt 矩阵跑 → 发现弱项 → 内容补强 → 1-2 周后再跑 → 验证提升
```

每周复盘会：
- 弱项 prompt → 内容团队补
- 内容已补但仍未引用 → GEO 工程查（schema/llms.txt/freshness）
- 引用了但被替换 → 实体协同审计

---

## 8. 成本

3600 测试 × 1 周
- OpenAI: 3600 × $0.01 = $36
- Anthropic: 3600 × $0.01 = $36
- Perplexity: 3600 × $0.005 = $18
- SerpAPI: 3600 × $0.005 = $18
- Bright Data 代理: $50 月费
- 合计: ~$160/月

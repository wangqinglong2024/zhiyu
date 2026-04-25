# 5.10 · LLM 蒸馏（供下游 PRD / Architect / Dev Agent 使用）

> **本文件目标**：把前 9 个文件的关键决策压缩为 token-efficient 摘要，可直接 paste 给 PRD / 架构师 / 开发 agent 作为上下文喂入。

---

## PRODUCT BRIEF · ZHIYU (知语)

### 1. PRODUCT
- Name: 知语 Zhiyu
- Type: AI-driven Mandarin (Chinese as L2) learning web platform
- Markets v1: Vietnam → Thailand → Indonesia (in this order)
- Visual: Cosmic Refraction (Rose/Sky/Amber, NO purple)

### 2. CORE DIFFERENTIATION
1. **Native-language teaching** in Vietnamese / Thai / Indonesian (vs competitors using English only)
2. **4-module integrated platform**: Discover China (culture) + Courses (4 tracks × 12 stages) + Games (12 H5) + Novels (12 categories)
3. **Price**: $4/mo, $40/yr (vs competitors $10-15/mo)
4. **AI content factory**: LangGraph + Claude/DeepSeek → 10x cheaper than competitors

### 3. TARGET PERSONAS (priority order)
- **A**: Vietnamese HSK student (~21yo) – HSK 4-9 prep
- **D**: Vietnamese 30yo casual learner – consume Chinese media
- **B**: Thai factory worker (~26yo) – workplace Mandarin
- **C**: Indonesian cross-border seller (~30yo) – B2B Chinese

### 4. PRODUCT MODULES

#### 4.1 Discover China (发现中国)
- 12 categories × 50+ articles each (history, cuisine, scenery, festivals, arts, music, literature, idioms, philosophy, modern, fun, myths)
- Each article: sentence-level (zh + pinyin + native + TTS audio)
- Free tier: first 3 articles preview without login
- SEO: each article = SEO landing page (4 lang × 12 cat × 50+ = 2400+ URLs)

#### 4.2 Courses (系统课程)
- 4 tracks: 电商 (ec) / 工厂 (factory) / HSK / 日常 (daily)
- Each track: 12 stages × 12 chapters × 12 lessons × 12 knowledge points
- Total v1 first-3-stages: 4 × 3 × 12 × 12 × 12 = 20,736 knowledge points
- Each lesson: knowledge points → mini-quiz (12 Qs)
- Each chapter: 36-Q test
- Each stage: 80-150 Q exam
- Pinyin intro as prerequisite (3 modules: initials/finals/tones)
- All track first 3 stages free; later 9 stages paid

#### 4.3 Games (游戏专区) – 12 games, force-landscape
- Wave 1 (W-1): Pinyin Shooter, Tone Bubbles, Hanzi Match-3, Whack-Hanzi, Memory Match
- Wave 2 (W+2): Hanzi Ninja, Hanzi Tetris, Hanzi Snake, Hanzi Rhythm
- Wave 3 (W+4): Hanzi Runner, Pinyin Defense, Hanzi Slingshot
- Engine: PixiJS v8 + Howler.js + Matter.js (selected)
- Vocab from selected track/stage range
- Wrong answers → SRS

#### 4.4 Novels (小说专区) – 12 categories
- Categories: urban-romance, ancient-romance, xianxia, xuanhuan, time-travel, wuxia, historical-alt, mystery, horror-tomb, scifi-apoc, esports, danmei
- v1: 5 starter novels (1 per priority cat) × 10 chapters each = 50 chapters
- Sentence-level same as Discover China
- v1 no per-chapter payment

### 5. LEARNING ENGINE
- **SRS**: FSRS-5 algorithm via `ts-fsrs` library
- **Daily review**: 20 cards default (configurable)
- **Question types**: 10 standard (Q1-Q10) + 3 pinyin intro (P1-P3)
- **Levels of testing**: lesson quiz / chapter test / stage exam + continuous SRS

### 6. ECONOMY
- **Currency**: 知语币 (Zhiyu Coins)
- **Issuance**: signup 100, daily check-in 5-30, referral 20% lvl1 + 20% lvl2 (PERMANENT)
- **Sinks**: 1mo membership = 400 coins (4x USD ratio to protect cash revenue), skins 100-3000, streak freeze 50/each
- **Cap**: per-user yearly cap 50,000 coins; overflow → charity coins
- **Anti-abuse**: device fingerprint + 30d/5lessons effective referral rule

### 7. PRICING
| Plan | Price | Note |
|---|---|---|
| Monthly | $4 | sweet spot |
| Half-yearly (launch promo) | $12 | 50% off, marketing weapon |
| Half-yearly (post-promo) | $20-22 | M+3 adjust |
| Yearly | $40 | high commitment |
| Single segment | $4 | per stage |
| 9-segment bundle | $36 | no discount |

### 8. TECH STACK
- **Frontend**: Vite + React 18 + TypeScript + Tailwind v4 + shadcn/ui + React Router 6 + Zustand + TanStack Query + i18next + Workbox PWA
- **Backend**: Express + TypeScript + tsoa + zod + drizzle-orm + Supabase JS Client
- **Database**: Supabase Postgres (schema isolation: dev_zhiyu / stg_zhiyu / public)
- **Auth**: Supabase Auth (email + Google OAuth)
- **Storage**: Supabase Storage (audio-tts, images-content, user-uploads, share-posters)
- **Realtime**: Supabase Realtime (IM, audit notifications)
- **Edge**: Supabase Edge Functions (high-freq read + auth-sensitive)
- **Vector** (v2): pgvector (RAG assistant)
- **AI workflow**: LangGraph (TS) for content factory + Vercel AI SDK for simple calls
- **LLM**: Claude Sonnet 4.5 (quality) + DeepSeek V3 (volume) – dual provider
- **TTS**: Azure Speech (primary) + ElevenLabs (backup)
- **Payment**: Paddle MoR + LemonSqueezy (backup)
- **CDN/WAF**: Cloudflare (+ Turnstile anti-bot)
- **Game engine**: PixiJS v8 + Howler.js + Matter.js
- **Monitoring**: Sentry + Plausible + Uptime Robot

### 9. ARCHITECTURE
- 3 environments single VPS (M+0-6) → split prod (M+6+)
  - Ports: dev 3000/8000, stg 3100/8100, prod not exposed
  - Containers: zhiyu-{dev|stg|}-{fe|be}
- Monorepo (pnpm workspace): apps/{web,admin,api} + packages/{shared,content-pipeline}
- All user tables: RLS enforced
- All content APIs: Edge Function + auth + rate limit + HMAC sig

### 10. UNIFIED CONTENT SCHEMA (CRITICAL)
- All sentence-level content (article/lesson/chapter) shares `content_sentences` table
- Fields: zh / pinyin / pinyin_tones / translations(JSONB 4 lang) / audio(JSONB) / tags / hsk_level / key_points
- Knowledge points: `content_knowledge_points` with composite key (track,stage,chapter,lesson,kpoint)
- Translations include `key_point` per language (mother-tongue explanation)

### 11. ANTI-SCRAPE
- Cloudflare WAF + Turnstile + Bot Fight Mode
- Edge Function rate limiting + HMAC API signature
- Anonymous tokens for unlogged content access (1h TTL)
- Audio: signed URLs (5min TTL)
- Text watermark: zero-width chars encoding user_id
- Device fingerprinting (FingerprintJS)

### 12. COMPLIANCE
- Vietnam PDPL / Thailand PDPA / Indonesia UU PDP
- DPO contact in privacy policy
- 4-language privacy + ToS
- User data export/delete UI
- Singapore Pte Ltd entity recommended (low tax, easy banking)
- Cookie consent banner (4 lang)

### 13. NORTH STAR & TARGETS
- **WAL** (Weekly Active Learners) = users completing ≥1 lesson or 1 article per week
- M+12 target: 80,000 WAL / 8,000 paid / $384K ARR
- M+24 target: 220,000 WAL / 32,000 paid / $1.6M ARR
- LTV: $36 (net) / Target CAC: <$10 / LTV/CAC ≥3 / Payback <6mo

### 14. GTM
- 3 platforms: TikTok (流量) + FB (社群) + YouTube (深度) + WhatsApp (push) + SEO (long term)
- Daily 9 TikToks (3 platforms × 3) early; 5 KOLs to start
- Force-landscape games as viral hook
- Permanent 2-tier referral as growth engine
- B2B (factories/agencies) starting M+6

### 15. ROADMAP
- W-12 → W0: build, content production, KOL prep
- M+0-3: Vietnam launch, PMF validation
- M+3-6: Thailand expansion
- M+6-12: Indonesia + B2B + 12 games complete
- M+12-24: Mobile App (Capacitor), advanced membership, RAG assistant

### 16. WHAT'S OUT OF SCOPE FOR v1
- Native iOS/Android app (PWA only)
- Real-time multiplayer
- ASR speech evaluation
- 1-on-1 live tutoring
- Local payment methods (Paddle only)
- Per-chapter novel payment
- Live streaming
- AI assistant (RAG)

### 17. KEY DECISIONS LOCKED
- Pricing: $4/$12/$40 confirmed
- Content schema: unified sentence-level format
- Tech stack: as listed above
- Markets: VN → TH → ID order
- v1 game count: 5 launch + 12 by M+5
- Mother-tongue native teaching is the #1 differentiator (do not compromise)

### 18. KEY RISKS (MUST MONITOR)
1. Content censorship single-point failure → 3-layer redline filter
2. Paddle market acceptance → LemonSqueezy backup ready
3. Mother-tongue review velocity → hire ahead, auto-scoring
4. Cold-start CAC → 3 channels + SEO + referral
5. D30 retention <8% → hooks + games + coins
6. Data format drift → unified schema + CI checks

### 19. CULTURAL/LINGUISTIC RED LINES (for AI content)
- NO political ideology (Taiwan/Xinjiang/Tibet, China-VN/TH/ID border issues)
- NO religious comparison (Buddhism/Islam/Catholicism/Daoism all neutral)
- NO ethnic conflict (1979 Sino-Vietnamese War, 1998 Indonesia anti-Chinese, Thai monarchy NEVER mentioned)
- NO gambling/porn/violence
- AI prompts must include these as system-level guardrails

### 20. WHO IS THIS FOR (CRITICAL FOR ALL DOWNSTREAM AGENTS)
- Southeast Asian L2 Chinese learners
- Mobile-first (mid-tier Android: Vivo Y20s baseline)
- Mother-tongue UI mandatory (not English-by-default)
- Price-sensitive ($4 = a Starbucks, the comfortable threshold)
- Mix of test-prep (HSK), workplace (factory/ec), and casual (Mai-style) needs

---

## QUICK REFERENCE INDEX

For deeper context, downstream agents should read:
- Brainstorming details: `/docs/01-brainstorming/`
- Domain insights: `/docs/02-domain-research/`
- Market data: `/docs/03-market-research/`
- Tech specs: `/docs/04-technical-research/`
- Other brief sections: `/docs/05-product-brief/01-09`

This distillate is the **single source of truth for downstream PRD/Architect/Dev agents**. Keep updated as decisions evolve.

---

**End of Product Brief.**

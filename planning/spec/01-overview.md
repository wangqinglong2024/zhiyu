# 01 · 系统总览（System Overview）

## 一、上下文图（C4 Level 1）

```
              ┌─────────────────────────────────────────┐
              │           SEA Learners (4 countries)    │
              │     Vietnam · Thailand · Indonesia · MY │
              └────┬────────────────────┬───────────────┘
                   │ HTTPS              │ HTTPS
                   ▼                    ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  Mobile PWA      │  │  Browser PWA     │
        │  (iOS/Android)   │  │  (Chrome/Safari) │
        └────────┬─────────┘  └────────┬─────────┘
                 │                     │
                 ▼                     ▼
        ┌──────────────────────────────────────┐
        │      Cloudflare CDN + WAF            │
        │      (R2, Workers, Images)           │
        └──────────────────┬───────────────────┘
                           │
                ┌──────────┼──────────────┐
                │          │              │
                ▼          ▼              ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │ App API  │ │ Admin API│ │ Public API   │
        │ Express  │ │ Express  │ │ (i18n, share)│
        └────┬─────┘ └────┬─────┘ └──────┬───────┘
             │            │              │
             └─────┬──────┴──────────────┘
                   │
        ┌──────────┴──────────────────────────────┐
        │                                          │
        ▼                                          ▼
┌─────────────────┐                      ┌──────────────────┐
│  Supabase       │                      │  Internal Workers│
│  - Postgres 16  │                      │  - LangGraph     │
│  - Auth         │                      │  - BullMQ jobs   │
│  - Storage      │                      │  - Cron tasks    │
└────────┬────────┘                      └────────┬─────────┘
         │                                        │
         └──────────────┬─────────────────────────┘
                        │
        ┌───────────────┼─────────────────────────┐
        │               │                         │
        ▼               ▼                         ▼
┌─────────────┐  ┌──────────────┐        ┌────────────────┐
│ Anthropic   │  │ DeepSeek     │        │ Paddle         │
│ (Claude     │  │ (V3 / TTS)   │        │ LemonSqueezy   │
│  Sonnet 4.5)│  │              │        │ (Payments MoR) │
└─────────────┘  └──────────────┘        └────────────────┘

┌────────────────────┐  ┌──────────────┐  ┌────────────────┐
│ OneSignal (Push)   │  │ PostHog      │  │ Sentry / BL    │
│                    │  │ (Analytics)  │  │ (Errors/Logs)  │
└────────────────────┘  └──────────────┘  └────────────────┘
```

## 二、子系统划分（C4 Level 2）

### 2.1 前端
- **App PWA** (`apps/app`): React 19 SPA，TanStack Router/Query，PixiJS 游戏画布
- **Admin Web** (`apps/admin`): React 19，TanStack，复杂表单 / 表格
- **Marketing Site** (`apps/web`): SSG（v1.5），SEO 优先
- **Shared UI** (`packages/ui`): 组件库 + Tokens + Storybook
- **Shared Logic** (`packages/sdk`, `packages/i18n`)

### 2.2 后端
- **App API** (`apps/api`): Express，REST + tRPC（内部）
  - 用户、内容、学习、游戏、经济、分销、支付、客服
- **Admin API**：合并到 App API，路径前缀 `/admin/v1`
- **Workers** (`apps/worker`):
  - LangGraph 内容工厂（Article / Chapter / Lesson / Pack）
  - 评分 / 推荐
  - 报表导出 / 邮件 / 推送

### 2.3 数据
- **Supabase Postgres 16**：主库
- **Upstash Redis**：cache + session + queue (BullMQ)
- **Cloudflare R2**：媒体（图 / 音 / 视频）
- **Cloudflare Workers KV**：Feature Flags 缓存

### 2.4 AI 层
- **Claude Sonnet 4.5**：内容创作 / 翻译 / 复杂改写
- **DeepSeek V3**：审稿 / 简单生成 / 语义评分（成本低）
- **DeepSeek TTS**：句子级 TTS
- **Whisper / Azure**：语音识别（v1.5 跟读评分）
- **OpenAI（备选）**：仅图像 DALL-E (v1.5)

## 三、运行时拓扑

| 服务 | 运行时 | 部署 | 副本 (v1) |
|---|---|---|---|
| App PWA | 静态 | Cloudflare Pages | - |
| Admin Web | 静态 | Cloudflare Pages | - |
| Marketing | 静态 | Cloudflare Pages | - |
| App API | Node 20 | Render / Fly.io | 2 (HA) |
| Worker | Node 20 | Render | 2 |
| Postgres | 托管 | Supabase Cloud (Singapore) | Pro plan |
| Redis | 托管 | Upstash (Singapore) | Standard |
| R2 Storage | 托管 | Cloudflare | - |
| LangGraph | 内嵌 Worker | - | - |

## 四、地域与延迟

### 4.1 用户分布
- 越南 30% / 泰国 25% / 印尼 30% / 马来菲律宾新加坡 15%

### 4.2 选址
- **主区域**：Singapore（Supabase / Upstash / Render Singapore）
- **CDN**：Cloudflare 全球（含东南亚多 PoP）
- **目标延迟**：API < 200ms, 静态资源 < 100ms

### 4.3 灾备
- v1：Supabase 自动备份 PITR 7d
- v1.5：跨区域 Read Replica（HK 备）
- v2：多 Region 分片

## 五、容量规划

### 5.1 v1 上线（M3）
- DAU 1k → 10k
- API QPS 峰值 100
- 数据库存储 50GB
- R2 存储 500GB
- 月 AI 成本 $500

### 5.2 v1.5（M9）
- DAU 50k
- QPS 峰值 500
- 数据库 200GB
- R2 2TB
- 月 AI 成本 $5k

### 5.3 v2（M15）
- DAU 200k
- QPS 峰值 2000
- 数据库 1TB（开始分片评估）
- R2 10TB
- 月 AI 成本 $30k

## 六、性能目标

| 指标 | 目标 |
|---|---|
| API P50 | < 80ms |
| API P95 | < 200ms |
| API P99 | < 500ms |
| 错误率 | < 0.5% |
| 可用性 | 99.5% (v1) → 99.9% (v2) |
| 应用启动 | < 2s |
| 游戏加载 | < 3s |

## 七、扩展策略

### 7.1 水平扩展
- API 无状态 → 加副本
- Worker 按队列 backlog 自动扩
- DB 暂垂直，> 200GB 评估读写分离

### 7.2 垂直扩展
- Supabase 直接升级套餐
- Upstash 自动 scale

### 7.3 缓存
- API 响应 Redis（用户 / 内容）
- CDN 静态全部
- Browser Service Worker

## 八、单体 vs 微服务

**v1-v1.5：单体优先**
- 一个 API 服务（按路由分模块）
- 一个 Worker 服务（按队列分 job）
- 共享 Postgres
- 团队 ≤ 20 人，单体维护成本低

**v2：评估服务拆分**
- 内容工厂独立服务（资源密集）
- 客服 IM 独立服务（实时）
- 支付独立服务（高安全）

## 九、关键架构决策（ADR 摘要）

详见 ADR 索引 (00-index.md)。每个决策含：
- 决策内容
- 上下文（为何决策）
- 备选方案
- 影响 / Trade-off

ADR 文件单独管理在 `planning/spec/adr/{id}-{topic}.md`（v1.5 引入）。

## 十、范围与不做的事

### 10.1 范围
- 应用端：Web / iOS PWA / Android PWA
- 后台：Web
- AI 内容工厂：自动化文章 / 课程 / 小说生成
- 12 款游戏：浏览器 + 移动横屏
- 4 国本地化：vi / th / id / en
- 商业：订阅 + 一次性 + 知语币 + 分销

### 10.2 不做
- 原生 App（v1 用 PWA，v2+ 评估）
- 实时多人在线（v3+ 评估）
- 直播 / 录播大课（不在范围）
- AR / VR
- 中国大陆运营（先海外）
- 企业版（v2+ 评估）

## 十一、Risk 列表

| Risk | 影响 | 缓解 |
|---|---|---|
| AI 成本超预算 | 中 | 配额监控 + DeepSeek 优先 + 缓存 |
| Supabase 限制 | 中 | v2 评估自托管 PG |
| Cloudflare 区域故障 | 低 | 多 PoP + 监控 |
| iOS PWA 限制 | 中 | 游戏适配 + v1.5 原生壳 |
| 4 语翻译质量 | 高 | 母语审稿 + 用户反馈 |
| 支付合规 | 高 | Paddle MoR 兜底 |

## 十二、技术债策略

- 每 Sprint 留 10% 处理技术债
- 重大债（架构）单独 Spike Story
- v2 重构窗口：v1.5 上线后 1 月

## 十三、Change Log

| 日期 | 版本 | 作者 | 变更 |
|---|---|---|---|
| 2026-04-25 | v1.0 | Architect | 初版 |

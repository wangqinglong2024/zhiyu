# 4.3 · 后端 + Supabase

## 一、后端架构

### 1.1 选型
- **运行时**：Node.js 20 LTS
- **语言**：TypeScript 5.4
- **框架**：Express 4 + tsoa（自动 OpenAPI / TypeBox 验证）
- **DI**：手工容器（轻量），不用 NestJS（避免重型）
- **ORM / DB Client**：Supabase JS Client + drizzle-orm（复杂 query 用 drizzle）
- **校验**：zod（运行时 schema）
- **日志**：pino + pino-pretty（dev）
- **任务队列**：BullMQ + Redis（M+3 引入；初期 Supabase Edge + Cron）

### 1.2 模块划分

```
apps/api/src/
├── modules/
│   ├── auth/           # Supabase Auth 桥接
│   ├── content/        # 4 模块内容查询
│   ├── learning/       # 课程进度、节小测、章测
│   ├── srs/            # FSRS-5 算法
│   ├── games/          # 游戏配置、分数提交
│   ├── coins/          # 知语币流水
│   ├── referral/       # 分销链路
│   ├── checkout/       # Paddle 集成
│   ├── webhook/        # Paddle webhook 接收
│   ├── im/             # 客服消息
│   ├── push/           # Web Push 发送
│   └── admin/          # 后台 API
├── middleware/
│   ├── auth.ts         # JWT / Session 校验
│   ├── ratelimit.ts    # 限流
│   ├── cors.ts
│   └── error.ts
├── lib/
│   ├── supabase.ts     # 单例
│   ├── paddle.ts
│   ├── ai.ts           # Vercel AI SDK 封装
│   └── tts.ts
└── index.ts
```

### 1.3 API 风格
- RESTful，版本前缀 `/api/v1/`
- JSON 响应统一格式：`{ success: bool, data?: any, error?: { code, message } }`
- 自动 OpenAPI doc（tsoa） → admin / 前端可生成 client

## 二、Supabase 全栈使用

### 2.1 Postgres 数据库
- 版本：Postgres 15+
- Schema：dev_zhiyu / stg_zhiyu / public（与 grules 对齐）
- 表分组：
  - 内容：content_articles / content_sentences / content_courses / ...
  - 用户：user_profiles / user_progress / user_coins / user_referrals
  - 业务：orders / subscriptions / coupons
  - IM：im_conversations / im_messages
  - 系统：audit_logs / events
- 详细 schema 见 [`05-data-model-content.md`](./05-data-model-content.md)

### 2.2 Auth（关键）
- **登录方式**：邮箱（密码 + Magic Link）+ Google OAuth
- **OAuth 配置**：Supabase Auth + Google Cloud Console（注意 redirect_url）
- **会话**：JWT（access + refresh），存于 httpOnly cookie
- **RLS（Row-Level Security）**：所有 user_* 表强制启用
- **管理员**：通过 `auth.users.role = 'admin'` 元数据 + RLS 策略

### 2.3 Storage
- Buckets：
  - `audio-tts`（公开 + CDN）
  - `images-content`（公开 + CDN）
  - `user-uploads`（私有，用户头像 / IM 附件）
  - `share-posters`（公开，里程碑分享海报）
- 访问控制：私有 bucket 用签名 URL（5 分钟时效）

### 2.4 Realtime
- 订阅 IM 消息表 → 前端实时收到
- 订阅 user_progress 表 → 后台实时看用户学习
- 订阅 audit 表 → 内容审校实时通知

### 2.5 Edge Functions
- 关键路径用 Edge Function（低延迟）：
  - `/api/v1/article/:slug`（高频 + 反爬关键）
  - `/api/v1/quiz/generate`（动态生成题目）
  - `/api/v1/srs/next`（下一道复习题）
- 部署：Deno runtime（Supabase 原生）
- 与主 Express API 边界：Edge 处理高频读 + 鉴权敏感；Express 处理写操作 + 复杂业务

### 2.6 pgvector（v2）
- 用于 RAG 助教
- 索引向量化课程知识点 + 发现中国句子
- v1 暂不实现，v1.5 评估

## 三、Row-Level Security 设计

### 3.1 用户数据 RLS 模板

```sql
-- user_progress 仅自己可读写
CREATE POLICY "user_progress_self" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- 订单仅自己可读
CREATE POLICY "orders_self_read" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- 管理员全访问
CREATE POLICY "admin_full" ON user_progress
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'admin'
  );
```

### 3.2 内容数据 RLS
- 公开内容：`SELECT` 所有人允许（含未登录）
- 但应用反爬：通过 Edge Function + Token 验证（不依赖 RLS）

### 3.3 IM RLS
- 用户仅看自己会话
- 管理员全访问 + 工作台分配机制

## 四、API 关键设计

### 4.1 认证流
- 邮箱注册：Supabase Auth signUp → 触发欢迎邮件 + 送 100 知语币（DB Trigger）
- Google OAuth：标准 OAuth 流，回调入口
- Token：JWT 存 httpOnly cookie；前端通过 `/api/v1/me` 获取用户信息

### 4.2 内容 API（高频）
- GET `/api/v1/discover/articles?cat=cuisine&limit=20`
- GET `/api/v1/discover/article/:slug`
- GET `/api/v1/courses/:track/:stage/:chapter/:lesson`
- GET `/api/v1/games/config/:id`
- GET `/api/v1/novels/:cat/:slug/:chapter`
- 全部走 Edge Function（缓存 + 鉴权）

### 4.3 学习 API
- POST `/api/v1/learning/lesson/:id/start`
- POST `/api/v1/learning/lesson/:id/submit`
- POST `/api/v1/learning/quiz/:type/submit`（节/章/阶段）
- GET `/api/v1/srs/next`（温故知新下一题）
- POST `/api/v1/srs/review`（FSRS-5 评分）

### 4.4 商业 API
- POST `/api/v1/checkout/session`（创建 Paddle session）
- GET `/api/v1/me/subscription`
- POST `/api/v1/webhook/paddle`（接收 webhook）
- GET `/api/v1/coins/balance`
- POST `/api/v1/coins/exchange`（兑会员/皮肤）
- GET `/api/v1/referral/me`（分销关系）
- POST `/api/v1/referral/track`（处理来路）

### 4.5 IM API
- GET `/api/v1/im/conversations`
- POST `/api/v1/im/message`
- WS（Supabase Realtime） `/realtime/im_messages`

### 4.6 Admin API
- 全部前缀 `/api/v1/admin/`
- 中间件：require role = 'admin'

## 五、限流与防护

### 5.1 限流策略
- 未登录：60 请求 / 分钟 / IP（Edge）
- 登录用户：300 请求 / 分钟
- 管理员：无限制
- 内容 API：单条文章 100 / 分钟 / IP（防爬）
- 写操作：30 / 分钟 / 用户

### 5.2 实现
- Edge Function：Supabase 内置 rate limit + Cloudflare WAF
- Express：express-rate-limit + Redis store

## 六、数据备份与迁移

### 6.1 备份
- Supabase Pro 自动每日备份（保留 30 天）
- 每周 dump 到 R2（独立账号）
- 季度演练恢复

### 6.2 迁移管理
- 工具：Supabase CLI + drizzle-kit
- 分支策略：每个 PR 必须有迁移文件
- 回滚：down migration 必备

## 七、Cron 任务

| 任务 | 周期 | 描述 |
|---|---|---|
| 签到清算 | 每日 0:00 | 重置每日签到状态 |
| 学习日报 | 每日 23:00 | 计算前一日活跃 / 进度 |
| 续费提醒 | 每日 9:00 | 7 天到期 email |
| 流失召回 | 每日 19:00 | 7 天未登录 push |
| 内容审校汇总 | 每日 8:00 | 待审校通知 |
| 知语币溢出结算 | 每月 1 日 | 超上限转公益币 |
| 备份 | 每周日 3:00 | dump → R2 |
| 内容生产排产 | 每日 5:00 | 自动启动新一天的 LangGraph 工作流 |

## 八、技术风险与缓解

| 风险 | 缓解 |
|---|---|
| Supabase 单点 | 双区备份（新加坡 + Frankfurt） |
| RLS 配置复杂出错 | 单元测试 + 强制 lint |
| Edge Function cold start | 预热 + 关键路径常驻 |
| 高并发查询性能 | 索引 + 物化视图 + 缓存 |
| Webhook 顺序问题 | idempotency + 事件去重 |

进入 [`04-ai-pipeline-langgraph.md`](./04-ai-pipeline-langgraph.md)。

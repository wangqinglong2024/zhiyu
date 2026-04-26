# 04 · 后端架构（Backend Architecture）

> ⚠️ **本文件部分章节含 Sentry / Better Stack / Upstash 引用（已禁用），主体（Express + Drizzle + BullMQ + Supabase）仍有效；下一波次会精改。冲突时以 [00-rules.md](../00-rules.md) + spec/02 + spec/08 + spec/10 为准。**

## 一、apps/api 结构

```
apps/api/
├── src/
│   ├── server.ts             # Express 启动
│   ├── app.ts                # 中间件 / 路由组装
│   ├── env.ts                # Zod 校验环境变量
│   ├── middlewares/
│   │   ├── auth.ts           # JWT 校验
│   │   ├── locale.ts         # 多语言
│   │   ├── rate-limit.ts
│   │   ├── error-handler.ts
│   │   ├── audit.ts          # 后台操作审计
│   │   ├── tenant.ts         # 国家 / 区域
│   │   └── request-id.ts
│   ├── modules/              # 业务模块（与 PRD 对齐）
│   │   ├── auth/
│   │   ├── users/
│   │   ├── discover/         # 文章 + 类目
│   │   ├── courses/
│   │   ├── novels/
│   │   ├── games/
│   │   ├── learning/         # 学习引擎
│   │   ├── coins/            # 知语币
│   │   ├── referrals/
│   │   ├── payments/         # 订阅 / 订单
│   │   ├── support/          # 客服
│   │   ├── notifications/
│   │   ├── content-factory/  # 工厂触发
│   │   ├── flags/            # Feature Flags
│   │   ├── audit/
│   │   └── admin/            # 后台专属
│   ├── lib/
│   │   ├── db/               # Drizzle
│   │   ├── redis/
│   │   ├── storage/          # R2
│   │   ├── ai/               # Claude / DeepSeek
│   │   ├── tts/
│   │   ├── email/
│   │   ├── push/
│   │   ├── payments/         # Paddle / LS
│   │   ├── pinyin/
│   │   ├── i18n/
│   │   ├── crypto/
│   │   └── logger/
│   ├── jobs/                 # BullMQ 作业声明
│   ├── schemas/              # 请求 / 响应 Zod
│   └── types/
├── tests/
├── drizzle.config.ts
├── Dockerfile
└── package.json
```

## 二、模块结构（标准模板）

每业务模块遵循同一结构：
```
modules/<name>/
├── routes.ts          # Express Router
├── controllers/       # 请求处理
├── services/          # 业务逻辑
├── repositories/      # 数据访问
├── schemas/           # Zod 校验
├── events/            # 事件发布订阅
└── tests/
```

### 2.1 Layered Architecture
```
Route → Controller → Service → Repository → DB
                      ↓
                  Other Service / Lib
```
- Controller 仅 HTTP（参数提取、调用 Service、序列化响应）
- Service 业务逻辑（事务边界、领域事件）
- Repository 数据访问（仅 SQL / ORM）

### 2.2 错误
- 自定义 AppError（code + status + message）
- 中间件统一捕获 → JSON 响应
- 4xx 用户错误，5xx 系统错误（上报 Sentry）

## 三、API 风格

### 3.1 REST
- `/v1/articles` GET 列表
- `/v1/articles/:slug` GET 详情
- `/v1/articles` POST 创建（后台）
- `/v1/articles/:id` PATCH 更新
- `/v1/articles/:id` DELETE 删除

### 3.2 命名
- kebab-case 路径
- 资源用复数
- 子资源 `/v1/courses/:track/stages`

### 3.3 版本
- URL 前缀 `/v1/`
- 破坏性变更 → /v2/
- 非破坏性 → 原 v1 加字段

### 3.4 响应格式
```json
{
  "data": {...} | [...],
  "meta": { "page": 1, "total": 100 },
  "error": null
}
```
错误：
```json
{
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "...",
    "details": {}
  }
}
```

### 3.5 分页
- cursor (推荐) 或 page+limit
- limit 默认 20，max 100

### 3.6 过滤 / 排序
- query: `?category=history&hsk=4&sort=-createdAt`
- 标准化 parser

## 四、tRPC（内部 RPC）

### 4.1 用途
- 后台同源调用（强类型）
- 前后端无 schema 同步成本

### 4.2 边界
- 公开 API 仍 REST（移动端 / 第三方友好）
- 后台内部用 tRPC

## 五、认证

### 5.1 用户
- Supabase Auth（OAuth / Email）
- 颁发 JWT (15min) + Refresh Token (30d, Redis)
- 中间件验证 JWT → req.user

### 5.2 后台
- 自实现 + Supabase Auth
- TOTP 二步验证
- IP 白名单（可选）
- Session 存 Redis（可强制踢出）

### 5.3 RBAC
```
super_admin > admin > content_editor > reviewer > support_agent > finance > analyst
```
- 资源 + action 矩阵
- 中间件 `requirePermission('content:article:create')`

### 5.4 API Token（v1.5）
- 第三方 / 集成
- 范围 + 限速

## 六、Rate Limit

### 6.1 全局
- 1000 req/min/IP

### 6.2 关键端点
| 端点 | 限速 |
|---|---|
| /v1/auth/login | 10/min/IP |
| /v1/auth/register | 5/min/IP |
| /v1/auth/forgot-password | 3/15min |
| /v1/payments/* | 60/min/user |
| /v1/support/messages | 60/min/user |

### 6.3 实现
- @upstash/ratelimit + Redis
- 头返回 X-RateLimit-Remaining

## 七、缓存

### 7.1 Redis Key 规范
```
zhiyu:cache:user:{id}
zhiyu:cache:article:{slug}
zhiyu:session:{tokenId}
zhiyu:ratelimit:{key}
zhiyu:queue:{name}
```

### 7.2 失效
- 写入时主动 del
- TTL 兜底（用户 1h，内容 6h）

### 7.3 SWR 模式
- 返回旧数据 + 后台刷新

## 八、队列与 Worker

### 8.1 Queues
| Queue | 用途 |
|---|---|
| content.article.generate | 文章生成 |
| content.lesson.generate | 课程节生成 |
| content.novel.chapter.generate | 章节生成 |
| content.pack.generate | 词包生成 |
| content.audio.tts | TTS 合成 |
| content.review.assign | 派发审稿 |
| email.send | 邮件 |
| push.send | 推送 |
| analytics.export | 报表 |
| referral.commission.calc | 分销佣金 |
| payment.webhook.process | 支付回调 |
| user.welcome | 注册欢迎流程 |

### 8.2 Worker 配置
- BullMQ
- 并发数按 queue
- 失败重试（指数退避，max 3）
- 失败死信队列（DLQ）+ 告警

### 8.3 Cron
- 0 0 * * *：日报、清理过期 token、对账
- 0 */6 * * *：内容工厂调度
- 0 9 * * *：学习提醒推送

## 九、事件系统

### 9.1 内部事件
- 模块内：EventEmitter
- 跨模块：发布到 Redis Pub/Sub
- 持久化：写入 events 表（v1.5 引入 outbox）

### 9.2 事件类型
- user.registered
- user.subscribed
- lesson.completed
- game.finished
- payment.succeeded
- referral.commission.earned

### 9.3 订阅者
- 推送服务
- 分销引擎
- 知语币引擎
- 分析

## 十、文件上传

### 10.1 流程
1. 前端请求预签名 URL
2. 直传 R2（PUT）
3. 完成回调 → 后端记录

### 10.2 限制
- 用户头像 < 2MB jpg/png/webp
- 评论附件 < 5MB
- 后台 cover 图 < 10MB
- 病毒扫描 ClamAV (v1.5)

## 十一、Webhook

### 11.1 入站
- Paddle / LemonSqueezy 支付回调
- 签名校验
- 幂等（事件 ID）
- 异步处理（队列）

### 11.2 出站（v1.5）
- 用户事件 → 用户配置的 webhook
- 重试 + 签名

## 十二、Background Jobs（详）

### 12.1 内容工厂（v1.5）
v1 不实现自动化；详见 06-ai-factory.md（架构保留）

### 12.2 分销佣金
- 用户付费成功 → 触发
- 计算 L1/L2 佣金（rate=0.20，单位 ZC = order_usd × 100 × 0.20）
- 写入 commissions（pending）
- 14 天 cron → confirmed → 自动 economy.issue 入账 ZC
- **不支持现金提现**：无 withdrawal cron / 队列

### 12.3 推送通知
- 学习提醒（用户偏好时间）
- 新课程 / 文章
- 客服回复

## 十三、监控指标

### 13.1 应用
- request count / latency / error rate
- queue depth
- DB connection pool
- 内存 / CPU

### 13.2 业务
- 注册数 / 付费数
- AI 生成成功率 / 成本
- 客服 SLA

## 十四、安全

### 14.1 输入校验
- Zod 全部入口
- SQL 注入：Drizzle 参数化
- XSS：HTML escape + DOMPurify
- CSRF：SameSite cookie + token

### 14.2 输出
- 敏感字段过滤（password / token）
- 序列化层统一

### 14.3 加密
- 密码 bcrypt (cost 12)
- JWT HS256（短期）
- 敏感字段（手机号 / 身份证）AES-GCM

## 十五、测试

### 15.1 单测
- Vitest
- Service / Repository
- 覆盖率 80%+

### 15.2 集成
- Supertest + 测试 DB（Docker Compose）
- 关键 API endpoint
- 事务回滚隔离

### 15.3 E2E
- 联合 Playwright
- 关键路径

## 十六、API 文档

### 16.1 OpenAPI
- 自动生成 from Zod schemas
- Swagger UI 在 /docs（仅开发 / 内部）

### 16.2 SDK 生成
- packages/sdk 自动生成

## 十七、检查清单

- [ ] 全部模块按结构组织
- [ ] 全部端点 Zod 校验
- [ ] 全部端点 Rate Limit
- [ ] JWT + Refresh 实现
- [ ] RBAC 全资源覆盖
- [ ] 队列 + 重试 + DLQ
- [ ] OpenAPI 自动生成
- [ ] Sentry / Better Stack 集成
- [ ] 测试覆盖 80%+

# 4.1 · 架构总览

## 一、三环境架构（与 grules 对齐）

### 1.1 环境矩阵

| 环境 | 域名 | 前端端口 | 后端端口 | DB Schema | 容器 |
|---|---|:---:|:---:|---|---|
| dev | dev.zhiyu.app | 3000 | 8000 | dev_zhiyu | zhiyu-dev-fe / zhiyu-dev-be |
| staging | stg.zhiyu.app | 3100 | 8100 | stg_zhiyu | zhiyu-stg-fe / zhiyu-stg-be |
| prod | zhiyu.app, admin.zhiyu.app | 不暴露 | 不暴露 | public | zhiyu-fe / zhiyu-be |

### 1.2 单服务器三环境（成本优化）
- 单台 4 核 8G + 100G SSD VPS（约 $40/月）
- Docker Compose 编排
- 域名通过 Cloudflare Tunnel 路由
- DB 单 Supabase 实例 + Schema 隔离

### 1.3 升级路径
- M+6 后流量上来，prod 抽出独立服务器（8 核 16G）
- M+12 dev/staging 维持单机，prod 升级为 Kubernetes（Hetzner / DigitalOcean）

## 二、应用拓扑

### 2.1 用户端 + 管理端 + 后端

```
              [Cloudflare CDN + WAF + Turnstile]
                          │
       ┌──────────────────┼─────────────────┐
       │                  │                 │
[zhiyu.app]       [admin.zhiyu.app]    [API: api.zhiyu.app]
  应用端 PWA          管理后台          后端 + Edge
       │                  │                 │
       └──────────────────┴────────┬────────┘
                                   │
                            [Supabase 新加坡区]
                            ├── Postgres
                            ├── Auth
                            ├── Storage
                            ├── pgvector
                            └── Edge Functions
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
       [LLM 供应商]          [TTS 供应商]         [Paddle]
       Claude / DeepSeek    Azure / 11Labs      支付 + 税务
```

### 2.2 内容工厂离线管线

```
[内容选题] → [LangGraph 工作流]
                │
                ├── [LLM 生成（Claude/DeepSeek）]
                ├── [自动校验（Schema/红线）]
                ├── [TTS 生成 + 上传 Supabase Storage]
                └── [入库 Postgres → 触发 RT 通知]
                            │
                  [管理后台审校 Web UI]
                            │
                  [发布到 prod schema]
                            │
                       [应用端 RT 拉取]
```

## 三、调用链

### 3.1 用户访问发现中国短文（典型）

1. 浏览器访问 `https://zhiyu.app/discover/cuisine/xiao-long-bao` 
2. Cloudflare CDN 命中静态骨架（HTML shell）
3. 前端 React 渲染 → 显示 Loading
4. 调用 Edge Function `/api/v1/article?slug=xiao-long-bao`
5. Edge Function 验证：Cloudflare Token / Auth Token / Rate Limit
6. 通过 → 返回 JSON（拼音 + 中文 + 用户母语 + 音频签名 URL）
7. 前端渲染句子列表 + 朗读按钮
8. 用户点击朗读 → 浏览器加载签名音频（5 分钟时效）

### 3.2 用户做节小测（典型）

1. 学完一节后弹出小测
2. 前端拉取 `/api/v1/quiz?lesson_id=xxx`
3. Edge Function 鉴权 + 加密
4. 后端从 schema 读取 12 知识点 → 自动生成 12 题（10 题型轮换）
5. 用户作答 → 提交 `/api/v1/quiz/submit`
6. 后端：评分 + 错题入 SRS 队列（FSRS-5）+ 进度更新
7. 返回结果 + 下一推荐（弹小游戏 / 下一节）

### 3.3 用户购买会员（典型）

1. 付费墙触发 → 用户点击"开通会员"
2. 前端调用 `/api/v1/checkout/session`，传 plan_id
3. 后端创建 Paddle Checkout URL → 返回前端
4. 前端 Paddle.js 弹出支付浮层
5. 用户支付完成 → Paddle 跳转 success_url
6. 同时 Paddle 异步 webhook → `/api/v1/webhook/paddle`
7. 后端验签 + 更新用户 subscription 表
8. 触发欢迎邮件 + 前端实时刷新会员状态

### 3.4 内容工厂生产一篇发现中国短文（典型）

1. 运营在管理后台点"AI 生成 - 美食类目 - 北京烤鸭"
2. 后端启动 LangGraph 工作流
3. Step 1: 选题深化（生成 outline）
4. Step 2: 中文文章生成（Claude）
5. Step 3: 句子拆分（按标点 + 长度）
6. Step 4: 拼音生成（pypinyin / OpenCC + 校对）
7. Step 5: 多语翻译（越/泰/印尼/英 各跑一次 LLM）
8. Step 6: 红线词检查（关键词 + LLM 双层）
9. Step 7: TTS 生成（每句中文一段音频，存 Supabase Storage）
10. Step 8: 入库（articles 表 + sentences 表 + audio_urls）
11. Step 9: 通知母语审校员（邮件 + 后台待办）
12. Step 10: 审校通过 → 标记 published → 应用端可见

## 四、数据流向

### 4.1 数据存储分层
- **公共数据**（4 模块内容）：Postgres `content_*` 表
- **用户数据**：Postgres `user_*` 表（受 RLS 保护）
- **音频 / 图片**：Supabase Storage（CDN 缓存）
- **向量**（v2）：pgvector，用于 RAG 答疑
- **会话 / 缓存**：Supabase Edge Cache + Cloudflare Cache
- **日志**：Supabase Logs + Sentry
- **分析**：Plausible（无 PII）

### 4.2 数据生命周期
- 用户数据：永久保留（用户删除时硬删除）
- 学习日志：90 天后聚合归档
- 错误日志：30 天滚动
- 音频 / 图片：永久（CDN 缓存 30 天滚动）

## 五、部署与 CI/CD

### 5.1 代码仓库
- Monorepo（pnpm workspace）：
  - `apps/web`（应用端）
  - `apps/admin`（管理后台）
  - `apps/api`（后端 Express）
  - `packages/shared`（类型 / 工具 / i18n）
  - `packages/content-pipeline`（LangGraph 工作流）

### 5.2 CI / CD（GitHub Actions）
- PR：lint + type check + unit test
- merge to dev：build + deploy to dev 环境
- merge to staging：build + deploy + e2e test
- tag release：build + deploy to prod + smoke test

### 5.3 配置管理
- 环境变量：`.env.dev` / `.env.staging` / `.env.prod`
- 密钥：Doppler / 1Password Secret 管理（团队 3 人轻量级）

## 六、可观测性

### 6.1 监控指标
- 前端：Sentry（前端 JS 错误）+ Web Vitals（性能）
- 后端：Sentry（后端错误）+ Prometheus（自定义业务指标）
- 数据库：Supabase Logs + Slow Query Monitor
- 业务：Plausible + 自建 ClickHouse 仪表盘（可选）

### 6.2 报警
- Sentry：高频错误告警
- Uptime Robot：站点 downtime 告警
- Supabase：DB 慢查询告警
- 自建：付费率 / 留存 / 内容审核异常告警 → Slack / 飞书

### 6.3 业务仪表盘
- 实时 MAU / DAU
- 实时付费数 / MRR
- 实时新注册
- 内容生产 / 审校进度
- 客服 IM 待响应

## 七、灾备

### 7.1 备份
- Supabase 自动每日备份（保留 30 天）
- Supabase Storage 自动版本化
- 每周手动 dump 到 S3 / R2（独立账号）

### 7.2 灾备演练
- M+1：第一次完整恢复演练
- 季度：例行恢复演练

### 7.3 高可用预案
- Supabase 故障 → 静态降级（缓存 + 只读模式）
- Cloudflare 故障 → 切换 Vercel Edge
- LLM 故障 → 双供应商自动切换

## 八、技术债与边界

### 8.1 v1 边界
- 不实现：实时 PK / 直播 / ASR / 多人对战
- 不实现：原生 App
- 不实现：1v1 真人答疑
- 不实现：本地化支付（仅 Paddle）

### 8.2 已知技术债
- LangGraph TS 生态相对新，可能需要补丁
- Supabase pgvector 大数据量（>100 万）性能需评估
- 12 款游戏 H5 性能需要持续打磨

进入 [`02-frontend-stack.md`](./02-frontend-stack.md)。

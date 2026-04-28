> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 1.6 · 非功能需求（Non-Functional Requirements）

## 一、性能（Performance）

### 1.1 前端性能

| 指标 | 目标（中端 Android）| 目标（PC）|
|---|:---:|:---:|
| FCP（First Contentful Paint） | < 1.8s | < 1.0s |
| LCP（Largest Contentful Paint） | < 2.5s | < 1.5s |
| TTI（Time to Interactive） | < 3.5s | < 2.0s |
| TBT（Total Blocking Time） | < 200ms | < 100ms |
| CLS（Cumulative Layout Shift） | < 0.1 | < 0.05 |
| 首屏 JS 包 | < 200KB gzip | - |
| 首屏图 | < 100KB | - |
| 离线可用（PWA） | 静态壳 + 已缓存内容 | - |

### 1.2 后端性能

| 指标 | 目标 |
|---|:---:|
| API P50 响应 | < 80ms |
| API P95 响应 | < 200ms |
| API P99 响应 | < 500ms |
| 内容 API P95（缓存命中） | < 50ms |
| Webhook 处理 P95 | < 1s |
| 数据库连接 P95 | < 20ms |
| 缓存命中率（热内容） | > 90% |

### 1.3 游戏性能

| 指标 | Vivo Y20s（基线）| iPhone SE（基线）|
|---|:---:|:---:|
| FPS | > 30 | > 60 |
| 启动时间 | < 3s | < 2s |
| 输入延迟 | < 100ms | < 50ms |
| 内存峰值 | < 200MB | - |

### 1.4 容量

| 指标 | 目标 |
|---|:---:|
| 并发在线用户（M+12） | 5,000 |
| 峰值并发（开课时） | 10,000 |
| QPS（API） | 1,000 |
| 数据库连接池 | 100 |
| Redis 连接池 | 50 |
| 单 VPS 承载 | 2,000 并发 |

## 二、可用性（Availability）

### 2.1 SLA 目标

| 指标 | 目标 |
|---|:---:|
| Uptime（生产） | > 99.5%（年度 < 44h 不可用） |
| Uptime（M+12 后） | > 99.9% |
| 计划维护窗 | < 4h / 月（提前 48h 公告） |
| 平均故障恢复时间 MTTR | < 1h |
| 平均故障间隔 MTBF | > 30 天 |

### 2.2 灾备

| 指标 | 目标 |
|---|:---:|
| RTO（故障恢复时间） | < 4h |
| RPO（数据恢复点） | < 1h |
| 数据库每日全备 | 保留 30 天 |
| WAL 流式备份 | 实时（PITR） |
| 跨区域灾备 | M+12 评估 |

### 2.3 降级策略

| 故障 | 降级方案 |
|---|---|
| Supabase 主库故障 | 切只读副本 + 提示用户 |
| Paddle 故障 | 切 LemonSqueezy（feature flag） |
| LLM API 故障 | 切备用 LLM（双供应商） |
| TTS 主供应商故障 | 切 ElevenLabs |
| Cloudflare 故障 | 直连源站（DNS 切换 1h） |
| Edge Function 故障 | 回 REST API（性能损失） |

## 三、安全（Security）

### 3.1 认证与授权
- ✅ Supabase Auth + JWT（RS256）
- ✅ 密码 bcrypt（cost=12）
- ✅ Refresh Token rotation（7d 过期）
- ✅ Google OAuth（PKCE）
- ✅ 邮箱验证强制（限定操作前）
- ✅ 多因素认证（v2 评估）
- ✅ 强制 HTTPS（HSTS preload）
- ✅ Cookie httpOnly + secure + SameSite=Lax

### 3.2 数据保护
- ✅ Postgres RLS 全用户表
- ✅ 敏感字段（手机号 / Email）应用层 AES-256 加密（v2 评估）
- ✅ 密码 / 卡信息 永不存储（PCI 由 Paddle 承担）
- ✅ 备份数据加密
- ✅ 传输 TLS 1.3
- ✅ Storage 文件 ACL（私有桶 + 签名 URL）

### 3.3 反爬 / 反 DDoS
- ✅ Cloudflare WAF + Bot Fight Mode
- ✅ Turnstile（注册 / 登录 / 高频读）
- ✅ Edge Function 限流（IP / user / device）
- ✅ HMAC API 签名（v=1, ts, nonce）
- ✅ 内容水印（零宽字符）
- ✅ 设备指纹（FingerprintJS）
- ✅ 异常行为监控（同 IP 注册 / 高频请求）

### 3.4 OWASP Top 10 防护
- ✅ A01 越权：RLS + 服务端权限检查
- ✅ A02 加密失败：TLS + bcrypt + AES
- ✅ A03 注入：参数化查询 + zod 校验
- ✅ A04 不安全设计：威胁建模
- ✅ A05 配置错误：CSP + Helmet + 最小权限
- ✅ A06 过期组件：依赖扫描（Dependabot）
- ✅ A07 认证失败：限流 + 锁定
- ✅ A08 完整性失败：HMAC + 签名
- ✅ A09 日志监控不足：Sentry + 审计日志
- ✅ A10 SSRF：URL 白名单

### 3.5 审计
- ✅ 关键操作审计日志（登录 / 支付 / 退款 / 删数据 / 后台改动）
- ✅ 日志保留 1 年
- ✅ 季度安全审计

## 四、合规（Compliance）

### 4.1 数据保护法
- ✅ 越南 PDPL：用户可查阅 / 修改 / 删除 + 跨境传输明示同意
- ✅ 泰国 PDPA：DPO 联系方式 + 同意管理
- ✅ 印尼 UU PDP：M+6 后评估当地代表
- ✅ GDPR（适用欧洲访问者）

### 4.2 内容合规
- ✅ 红线词字典（30+ 敏感词 / 实体）
- ✅ AI 生成 prompt 内置安全规则
- ✅ 双层 LLM 审核
- ✅ 用户举报通道

### 4.3 支付合规
- ✅ Paddle MoR 模式（合规由 Paddle 承担）
- ✅ 退款政策（7 天无理由 / 30 天质量问题）
- ✅ 服务条款明示
- ✅ 价格透明（含税，遵守目的国规定）

### 4.4 用户协议
- ✅ 4 语种 隐私政策 / 用户协议 / Cookie 同意
- ✅ 注册时强制阅读
- ✅ 协议变更 30 天提前通知

## 五、可扩展性（Scalability）

### 5.1 水平扩展
- ✅ API 无状态（session 入 JWT）
- ✅ Edge Function 自动扩展
- ✅ 数据库读副本（M+6 引入）
- ✅ 缓存（Cloudflare CDN + Redis）

### 5.2 垂直扩展
- 单 VPS：4 核 8G → 8 核 16G → 16 核 32G
- 触发条件：CPU > 70% 持续 1h / 内存 > 80%

### 5.3 数据扩展
- 表分区（user_id hash 32 分区）— v2 评估
- 历史数据归档（> 1 年）— v2 评估
- 全文搜索（PostgreSQL FTS）— 不引入 ES

### 5.4 多市场扩展
- 内容多语：JSONB translations
- 货币多种：所有金额存 USD cents
- 时区：UTC 存储 + 客户端转换

## 六、可维护性（Maintainability）

### 6.1 代码质量
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ 单元测试覆盖率 > 60%（核心模块 > 80%）
- ✅ E2E 测试（关键流程）
- ✅ Code review 强制

### 6.2 文档
- ✅ API 文档（tsoa 自动生成）
- ✅ 数据库 schema 文档（drizzle introspect）
- ✅ Runbook（故障处理）
- ✅ ADR（架构决策记录）

### 6.3 监控
- ✅ Sentry（错误）
- ✅ Plausible（产品分析）
- ✅ Uptime Robot（可用性）
- ✅ Slack / 飞书告警
- ✅ 自建 Metabase 业务仪表盘

### 6.4 部署
- ✅ CI/CD（GitHub Actions）
- ✅ 三环境（dev / stg / prod）
- ✅ 金丝雀发布（v2 评估）
- ✅ 一键回滚
- ✅ 蓝绿部署（v2 评估）

## 七、可观测性（Observability）

### 7.1 指标（Metrics）
- 业务指标：DAU / WAL / MAU / 付费 / 留存
- 技术指标：QPS / 错误率 / P95 / 数据库连接
- 基础设施：CPU / 内存 / 磁盘 / 网络
- AI 指标：LLM 调用量 / 成本 / 失败率

### 7.2 日志（Logs）
- 结构化 JSON
- 等级：ERROR / WARN / INFO / DEBUG
- 保留：30 天热 + 1 年冷

### 7.3 追踪（Traces）
- 关键链路 trace_id 贯穿
- v2 引入 OpenTelemetry

### 7.4 告警（Alerts）
- 严重（P0）：电话 + 短信 + Slack
- 重要（P1）：Slack
- 信息（P2）：邮件

## 八、可访问性（Accessibility）

### 8.1 WCAG 2.1 AA 基线
- ✅ 颜色对比度 ≥ 4.5:1
- ✅ 键盘可达
- ✅ 屏幕阅读器友好（ARIA）
- ✅ 字体可缩放（不锁字号）

### 8.2 Mobile-first
- ✅ 触控目标 ≥ 44pt
- ✅ 不依赖 hover
- ✅ 可单手操作

### 8.3 弱网
- ✅ 离线壳（PWA）
- ✅ 已学内容缓存
- ✅ 加载占位（不空白）
- ✅ 失败重试

## 九、国际化（Internationalization）

### 9.1 UI
- 4 语种 i18next + JSON
- 右上角语言切换
- 全部文字字符串化（无硬编码）

### 9.2 内容
- JSONB translations（zh / pinyin + 4 语 key_point）

### 9.3 货币 / 时间
- 货币：USD 显示，但用户偏好可切（v2）
- 时间：UTC 存储，浏览器时区显示

### 9.4 字体
- 中文：Noto Sans SC
- 越南语：Be Vietnam Pro
- 泰文：Sarabun
- 印尼文：Plus Jakarta Sans
- 拼音：内置音调字体

## 十、浏览器 / 设备支持

### 10.1 浏览器
- ✅ Chrome / Edge：最近 2 个大版本
- ✅ Safari：iOS 14+
- ✅ Firefox：最近 2 个大版本
- ✅ Samsung Internet：最近 2 个大版本
- ❌ IE：不支持

### 10.2 设备
- ✅ 移动端：Android 8+ / iOS 14+
- ✅ 桌面：Windows 10+ / macOS 11+
- 基线机：Vivo Y20s（中低端）

### 10.3 屏幕
- ✅ 320px - 2560px 宽度自适应
- 游戏强制横屏

## 十一、运维窗口

- 计划维护：周二 / 周四 03:00-05:00（UTC+7）
- 紧急维护：随时（提前 30 分钟告知）
- 节假日维护：避开（春节 / HSK 考前 / 各国国庆）

进入 [`07-success-metrics.md`](./07-success-metrics.md)。

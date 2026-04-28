# 知语 Zhiyu · 任务清单总索引

> 生成日期：2026-04-27
> 规划方式：按 BMAD `bmad-create-epics-and-stories` 的“需求抽取 → Epic 设计 → Story 生成 → 覆盖校验”流程执行；由于用户明确禁止提问与停顿，所有确认点按“继续”自动决策。

## 任务目录

| 序号 | 文件夹 | 覆盖范围 | 主要来源 |
|---:|---|---|---|
| 01 | `01-foundation-platform/` | 工程铁律、Docker、Supabase、monorepo、前后端骨架、部署、观测、发布门禁 | `planning/rules.md`、`planning/spec/01~10`、`planning/prds/01-overall/**` |
| 02 | `02-ux-design-system/` | 松烟雅瓷设计系统、瓷釉毛玻璃、主题、组件、响应式、应用端/后台/游戏 UX、可访问性、性能质量 | `planning/ux/**` |
| 03 | `03-user-account/` | 注册、登录、OAuth、邮箱验证、偏好、会话、导出、销户、匿名访问 | `planning/prds/06-user-account/**` |
| 04 | `04-discover-china/` | 发现中国页面、句子级阅读、搜索、分享、内容规则、后台规则、种子数据 | `planning/prds/02-discover-china/**`、`content/china/**` |
| 05 | `05-courses/` | 4 轨课程、拼音入门、题型、测验、进度、付费墙、内容规则、种子数据 | `planning/prds/03-courses/**`、`content/course/**` |
| 06 | `06-games/` | 12 款游戏、60s 回合、横屏、词包、SRS、游戏引擎、内容规则、种子数据 | `planning/prds/04-games/**`、`content/games/**` |
| 07 | `07-novels/` | 小说类目、详情/章节阅读、快测、内容排期、合规规则、种子数据 | `planning/prds/05-novels/**`、`content/novels/**` |
| 08 | `08-learning-engine/` | FSRS、错题专攻、自由练习、仪表板、streak、提醒、薄弱点 | `planning/prds/07-learning-engine/**` |
| 09 | `09-economy/` | 知语币钱包、签到、学习奖励、商店、防作弊、种子商品 | `planning/prds/08-economy/**` |
| 10 | `10-referral/` | 二级分销、分享链接、绑定、佣金、反作弊、看板 | `planning/prds/09-referral/**` |
| 11 | `11-payment/` | 订单、订阅、退款、解锁、PaymentAdapter mock、fake webhook | `planning/prds/10-payment/**`、`planning/rules.md` |
| 12 | `12-customer-service/` | 客服入口、IM、路由、Supabase Realtime、后台工作台、评分 | `planning/prds/11-customer-service/**`、`planning/spec/12-realtime-and-im.md` |
| 13 | `13-admin/` | 后台登录、KPI、用户/订单/通用内容壳/审校/客服/分销/flags/审计/导出/安全合规控制台 | `planning/prds/12-admin/**`、`planning/ux/11-screens-admin.md` |
| 14 | `14-admin-discover-china/` | 发现中国后台：类目、文章、句子、审校、发布、seed、访问模型 | `planning/prds/12-admin/**`、`planning/prds/02-discover-china/**`、`content/china/**` |
| 15 | `15-admin-courses/` | 系统课程后台：4 轨树形、题库、免费前 3 章、跨级购买、游戏词包权限 | `planning/prds/12-admin/**`、`planning/prds/03-courses/**`、`content/course/**` |
| 16 | `16-admin-games/` | 游戏后台：12 游戏配置、统一设置、课程权限词包、SRS、MVP 禁用项 | `planning/prds/12-admin/**`、`planning/prds/04-games/**`、`content/games/**` |
| 17 | `17-admin-novels/` | 小说后台：类目、小说、章节、句子、首章预览、登录全读、合规 | `planning/prds/12-admin/**`、`planning/prds/05-novels/**`、`content/novels/**` |
| 18 | `18-security-compliance/` | 认证安全、HMAC、匿名 JWT、签名音频、水印、红线、合规、日志审计 | `planning/prds/13-security/**`、`planning/spec/09-security.md` |
| 19 | `19-content-factory/` | v1 手动导入与 mock 工厂、v1.5 工作流占位、版本、审校、成本 | `planning/prds/14-content-factory/**`、`planning/spec/06-ai-factory.md` |
| 20 | `20-i18n-localization/` | i18next、4 语路由、内容翻译、字体、邮件/错误、SEO、检查 | `planning/prds/15-i18n/**`、`planning/ux/14-i18n-fonts.md` |

## 全局裁决

- 最高优先级来源句：`planning/rules.md` 写明“本文档高于一切其它 spec/epic/story。任何文档与本文冲突，以本文为准。”
- 工程根目录裁决：所有可执行代码任务都落到 `system/` 下。来源句：`planning/rules.md` 写明“所有可执行代码（apps/、packages/、turbo.json、package.json、pnpm-workspace.yaml、pnpm-lock.yaml、tsconfig.base.json、docker/ 等）必须落在 /opt/projects/zhiyu/system/ 子目录下。”
- 环境裁决：只规划 dev + docker compose。来源句：`planning/rules.md` 写明“本项目只有一个环境：dev。”与“所有 app / api / admin / worker 必须以 docker compose 启动。”
- SaaS/密钥裁决：真实外部服务均通过 Adapter/Fake，不阻塞 Docker 验证。来源句：`planning/rules.md` 写明“缺失第三方 API key 时使用 mock/fake 适配器，禁止因缺 key 阻塞容器启动或测试。”
- AI 裁决：本期只做接口契约和 mock，不接真实模型。来源句：`planning/rules.md` 写明“本期 dev 不集成任何真实 AI 调用。”
- 支付裁决：保留订单、权限、退款、分销反向逻辑，外部支付以 `PaymentAdapter` dummy/fake 落地。来源句：`planning/spec/02-tech-stack.md` 写明“支付 | PaymentAdapter | dummy（直接成功）| Paddle / 微信支付。”
- 实时裁决：客服 IM / 通知优先走 Supabase Realtime。来源句：`planning/rules.md` 写明“实时通道 | supabase-realtime | 客服 IM / 通知推送，不再独立 Socket.io。”
- 内容种子裁决：DC/CR/GM/NV/EC/UA 均必须有可端到端验证的 seed。来源句：`planning/rules.md` 写明“这些模块的正式内容由用户后续让 AI 按规定格式批量灌库，开发期不依赖真实大规模内容也必须可端到端跑通。”
- 内容访问裁决：未登录 DC 只能浏览前 3 个类目（中国历史、中国美食、名胜风光），登录后可看全部 DC、全部 NV、玩全部 GM；CR 登录后每个主题 Stage 1-3 全部章节免费试学，课程允许跨级购买任意阶段；GM 词包可选范围由 CR 权限决定。来源句：`UA-FR-013` 与 `content/china/00-index.md`、`content/games/shared/01-unified-settings.md`。

## 覆盖校验方式

- 每个模块文件都包含“来源覆盖”“任务清单”“验收与测试”。
- 每条任务均有“来源句”，来自 PRD/spec/UX/content/rules 的原句或表格项。
- 内容相关四模块额外包含“内容区规则任务”，禁止只按 PRD 猜页面或后台。
- 任一任务若来自历史残留但与铁律冲突，以“清理/降级/占位”表达，不作为真实接入任务。

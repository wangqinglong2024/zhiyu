# PRD 覆盖审计：05-courses / 15-admin-courses

审计时间：2026-04-27  
范围：`planning/task/05-courses`、`planning/task/15-admin-courses`；实现根目录 `/opt/projects/zhiyu/system`。  
审计结论：当前实现已完成课程端与后台课程管理的开发级闭环、Docker 验证与页面截图；但仍是 fake-safe / runtime-first 实现，不等同于生产级 DB 持久化内容系统。

## 来源引用

- `planning/task/05-courses/00-overview.md`：4 轨、结构、知识点红线、任务 CR-01~CR-29、验收 CR-T01~CR-T03。
- `planning/task/05-courses/tasks/00-task-index.md`：CR-01~CR-29 单任务索引。
- `planning/task/15-admin-courses/00-overview.md`：AD-FR-006、后台课程树、免费试学、跨级购买。
- `planning/task/15-admin-courses/tasks/00-task-index.md`：ACR-01~ACR-10 单任务索引。
- 重点细则：`CR-18-paywall.md`、`CR-24-pwa-offline.md`、`CR-27-seed-schema-upsert.md`、`CR-28-nfr-security-observability.md`、`ACR-08-seed-import-publish.md`。

## 实现证据

- 课程运行时与 API：`packages/backend/src/runtime/courses.ts`、`packages/backend/src/modules/course-api.ts`。
- 后台课程 API：`packages/backend/src/modules/course-admin-api.ts`、`packages/backend/src/modules/admin-api.ts`。
- Web 课程 UI：`apps/web/src/pages/CoursePages.tsx`、`apps/web/src/App.tsx`、`apps/web/src/styles.css`。
- Admin 课程 UI：`apps/admin/src/CoursesAdmin.tsx`、`apps/admin/src/AdminApp.tsx`、`apps/admin/src/styles.css`。
- DB / seed：`packages/db/migrations/0002_courses.sql`、`packages/db/scripts/seed.ts`、`packages/db/seed/courses/blueprint.json`。
- 测试：`packages/backend/tests/courses-api.test.ts`、`packages/db/tests/schema.test.ts`。
- UI 主题：`packages/ui/src/styles/tokens.css`、`packages/ui/src/styles/components.css`。

## Docker 验证记录

- 后端 Docker 测试：`@zhiyu/backend test`，3 个测试文件、7 个测试通过。
- 后端 Docker 类型检查：`@zhiyu/backend typecheck` 通过。
- DB Docker 测试：`@zhiyu/db test`，1 个测试文件、2 个测试通过。
- Web Docker 类型检查与构建：`@zhiyu/web typecheck`、`@zhiyu/web build` 通过；存在 Vite chunk size warning。
- 先前全量验证已通过：web/admin/backend/db/api/admin-api typecheck，web/admin build，`seed:courses`，`docker compose up -d --build`，`docker compose ps` 健康。

## MCP Browser 截图记录

- 课程端：`course-dashboard`、`course-onboarding`、`course-pinyin`、`course-stage`、`course-chapter`、`course-lesson`、`course-quiz`、`course-report`、`course-paywall`。
- 后台端：`admin-login`、`admin-courses`、`admin-courses-theme-toggle`。

## BMAD Code Review 结果

已执行三层 BMAD 审查：Blind Hunter、Edge Case Hunter、Acceptance Auditor。

已修复的代码级问题：

- `parseCourseId` 增加 stage/chapter/lesson/kpoint 1~12 范围校验，非法 `cr-hsk-s99` 返回 404。
- `permissionFor` 修复 `stage_nine_pack` 只解锁从购买阶段起 9 个阶段，避免全轨越权；同时忽略过期购买。
- `checkout/dummy` 支持 PRD SKU：`stage_single`、`stage_nine_pack`、`membership_monthly`、`membership_yearly`、`membership_half_year`，并给会员类写入过期时间。
- `submitQuiz` 增加答案归一化，支持字符串数字和数组顺序差异。
- 相关测试已补充并在 Docker 中通过。

保留为审计风险而非当前补丁的项：

- 当前课程运行时使用内存 `courseStore`，未接入生产 Postgres 查询/事务/RLS。
- `seed:courses` 与后台 import 是开发级校验/内存记录，未实现 CR-27 要求的 zod schema + 共享 upsert。
- TTS/audio、支付、审计日志、翻译覆盖、生产内容包仍为 fake-safe / mock / 占位路径。
- 管理后台已有 dev TOTP `123456` 与 dev reset token，这是既有开发模式，生产必须 feature flag 或替换真实 MFA/重置流程。

## 课程端覆盖矩阵

| ID | 来源要求 | 状态 | 实现位置 | 说明 / 缺口 |
|---|---|---|---|---|
| CR-01 | 建立 tracks/stages/chapters/lessons/knowledge_points/quizzes 数据模型 | 部分实现 | `0002_courses.sql`、`courses.ts` | SQL 表已建；运行时仍用内存对象，未用 DB 读写。 |
| CR-02 | 4 轨与 12 阶段 seed，写阶段主题与里程碑 | 部分实现 | `courses.ts`、`blueprint.json` | 运行时生成 4 轨 x 12 阶段；dev seed 仅 24 lessons，不是完整生产 seed。 |
| CR-03 | 欢迎引导轨道选择/推荐，可跳过 | 已实现 | `CoursePages.tsx`、`course-api.ts` | `/learn/onboarding`、recommend/confirm API 已实现；报名写内存。 |
| CR-04 | 拼音入门前置、P1/P2/P3、80% 完成、可跳过提醒 | 部分实现 | `CoursePages.tsx`、`courses.ts`、`course-api.ts` | 模块与 P1/P2/P3 小测存在；完成规则与提醒是运行时简单实现。 |
| CR-05 | 拼音内容遵循 GB/T 16159-2012 等内容范围 | 部分实现 | `courses.ts`、`CoursePages.tsx` | UI/API 展示标准与范围；未接入真实拼音内容库。 |
| CR-06 | `/learn` Dashboard 当前轨道、继续学习、任务、时长、切换轨道 | 已实现 | `CoursePages.tsx`、`course-api.ts` | 课程首页已可浏览并截图。 |
| CR-07 | 阶段总览 12 章网格、进度、阶段考入口 | 已实现 | `CoursePages.tsx`、`course-api.ts` | `/learn/:track/:stage` 已实现；非法阶段已校验。 |
| CR-08 | 章节总览 12 节列表、章测入口 | 已实现 | `CoursePages.tsx`、`course-api.ts` | `/learn/:track/:stage/:chapter` 已实现。 |
| CR-09 | 节学习页 12 知识点、中/拼/母语/TTS/例句/key_point、进度、小测 | 部分实现 | `CoursePages.tsx`、`courses.ts` | 结构与交互已实现；TTS/audio 是 `seed://` 占位。 |
| CR-10 | 知识点字段 type/zh/pinyin/translations/audio/key_point/examples/tags | 已实现 | `courses.ts`、`0002_courses.sql` | 字段存在；DB 未被 runtime 持久化使用。 |
| CR-11 | 知识点批量导入校验：id、unit_type、中文 <=40、vi/th、key_point <=30 | 未实现 | `seed.ts`、`course-admin-api.ts` | 仅有粗粒度 JSON 数量校验；无逐字段 schema/upsert。 |
| CR-12 | 节小测 10 题、即时反馈、错题最多重试 2 次、60%、错题入 SRS | 部分实现 | `courses.ts`、`CoursePages.tsx` | 10 题/60%/错题入内存完成；“最多重试 2 次”与 SRS 调度未完整落地。 |
| CR-13 | 兼容内容区 12 题/75%，MVP 10 题/60% | 部分实现 | `courses.ts` | MVP 10 题/60% 完成；12 题/75% 尚未做配置项。 |
| CR-14 | 章测 36 题、60min、可暂停 1 次、70%、错题入 SRS | 部分实现 | `courses.ts`、`CoursePages.tsx` | 36 题/60min/70% 已有；暂停与 SRS 调度未完整实现。 |
| CR-15 | 阶段考 80-150 题、120-180min、75%、证书 PDF | 部分实现 | `courses.ts`、`CoursePages.tsx` | 80-150 题与 75% 已有；证书 URL 是占位，无 PDF 生成。 |
| CR-16 | Q1-Q10 与 P1-P3 题型渲染和数据结构 | 部分实现 | `courses.ts`、`CoursePages.tsx` | 数据结构覆盖 13 类型；前端渲染为统一选项卡片，不是 13 个专用组件。 |
| CR-17 | 题目生成约束、解释 4 语、质量审核 | 部分实现 | `courses.ts`、`course-admin-api.ts` | 解释多语与基本干扰项存在；质量审核流程未生产化。 |
| CR-18 | 付费墙 4 SKU + 半年促销 + PaymentAdapter dummy | 已实现 | `CoursePages.tsx`、`course-api.ts` | SKU 已按 PRD 命名；dummy checkout 写内存购买。 |
| CR-19 | 进度同步：知识点 1s 防抖、测验立即写、跨设备拉取 | 部分实现 | `course-api.ts`、`courses.ts` | 知识点/测验进度写入内存；无真实跨设备 DB 同步。 |
| CR-20 | 错题集 learning_wrong_set，课程/游戏/阶段考来源，同题去重 | 部分实现 | `courses.ts`、`0002_courses.sql` | 课程错题内存去重已实现；游戏来源与 DB 写入未接通。 |
| CR-21 | 节/章/阶段报告、得分、错题、掌握度、推荐、证书、预告 | 部分实现 | `CoursePages.tsx`、`courses.ts` | 报告可展示；证书/预告为占位级。 |
| CR-22 | 跳过节：确认、skipped、报告标注、可后补小测 | 部分实现 | `CoursePages.tsx`、`course-api.ts` | API 标记 skipped；前端缺确认弹窗，报告标注较简化。 |
| CR-23 | 学习时长统计与日 30min +10 知语币 | 部分实现 | `CoursePages.tsx`、`courses.ts` | 5s heartbeat 与 30min reward 字段存在；未接真实经济模块。 |
| CR-24 | 多轨并行与轨道切换 | 已实现 | `CoursePages.tsx`、`course-api.ts` | 轨道切换与 enroll 多轨 API 已有。 |
| CR-25 | 收藏、笔记 500 字、内容报错入审校 | 部分实现 | `CoursePages.tsx`、`course-api.ts` | 收藏/笔记/报错 API 存在；审校工作台持久闭环未完整。 |
| CR-26 | 后台课程树 4 轨 → 12 阶段 → 12 章 → 12 节 | 已实现 | `CoursesAdmin.tsx`、`course-admin-api.ts` | 后台课程页与 tree API 已实现并截图。 |
| CR-27 | 最小开发 seed：4 轨 x 每轨 >=2 stage x 每 stage >=3 lessons | 已实现 | `blueprint.json`、`seed.ts` | Docker seed 校验通过：4 tracks、24 lessons、13 question types、stage exam 10。 |
| CR-28 | seed 覆盖 >=6 题型、JSON Schema、seed://、幂等 upsert | 部分实现 | `blueprint.json`、`seed.ts` | 题型与 `seed://` 已满足；zod schema + shared upsert 未实现。 |
| CR-29 | W0 内容上线门槛 | 部分实现 | `courses.ts`、`blueprint.json` | 运行时可生成结构；生产 W0 内容包未实际入库。 |

## 后台课程覆盖矩阵

| ID | 来源要求 | 状态 | 实现位置 | 说明 / 缺口 |
|---|---|---|---|---|
| ACR-01 | 课程后台路由与树形壳 | 已实现 | `AdminApp.tsx`、`CoursesAdmin.tsx`、`course-admin-api.ts` | `/admin/content/courses` 与 `/admin/api/content/courses/tree` 已可用。 |
| ACR-02 | 管理 4 轨道与 12 阶段元信息 | 部分实现 | `course-admin-api.ts` | PATCH API 返回 runtime patch/audit；未持久化到 DB。 |
| ACR-03 | 管理章节与免费试学范围 | 部分实现 | `course-admin-api.ts`、`courses.ts` | Stage 1 Chapter 1-3 逻辑固定；后台 bulk-free-trial 是内存/响应级。 |
| ACR-04 | 管理节与知识点 | 部分实现 | `CoursesAdmin.tsx`、`course-admin-api.ts` | 编辑 UI/API 存在；保存不写 DB。 |
| ACR-05 | 管理题库与测验 | 部分实现 | `CoursesAdmin.tsx`、`course-admin-api.ts` | 题库预览与 quiz preview 存在；无真实审校/版本化题库。 |
| ACR-06 | 管理课程权限与跨级购买配置 | 部分实现 | `course-admin-api.ts`、`courses.ts` | grant/revoke 与权限矩阵存在；权限存内存，非 DB。 |
| ACR-07 | 游戏词包权限摘要 | 已实现 | `course-admin-api.ts`、`courses.ts` | `game-wordpack-scope` 根据课程权限输出 accessible stages。 |
| ACR-08 | 课程 seed/导入与审校发布 | 部分实现 | `CoursesAdmin.tsx`、`course-admin-api.ts`、`courses.ts` | dry-run/commit/publish API 存在；未复用 CR-27 upsert，版本仅内存。 |
| ACR-09 | 多语翻译完整度可视化 | 部分实现 | `CoursesAdmin.tsx`、`courses.ts` | UI/API 存在；coverage 固定 100%，不是 DB 真实计算。 |
| ACR-10 | 端到端验证与审计 | 部分实现 | `courses-api.test.ts`、MCP screenshots | Docker 与截图已完成；生产 DB/RLS/导入链路仍需真实集成测试。 |

## 非功能覆盖

| 项目 | 状态 | 证据 | 缺口 |
|---|---|---|---|
| 红黄现代化 glass UI | 已实现 | `tokens.css`、`components.css`、`styles.css` | 需要后续性能基准验证 backdrop-filter 在低端设备表现。 |
| 亮暗模式 | 已实现 | `tokens.css`、`admin-courses-theme-toggle` 截图 | 截图已覆盖后台；课程端也使用同一 token。 |
| 答案不泄露 | 已实现 | `publicQuestion`、`courses-api.test.ts` | `GET quiz` 不含 `correctAnswer`，提交后返回解释和正确答案。 |
| RLS | 部分实现 | `0002_courses.sql` | SQL policy 已有；runtime 未使用 DB，未验证真实 RLS 交互。 |
| PWA 离线 30 天 | 未实现 | 无 SW / Workbox 实现 | CR-24 要求的 `/sw.js`、IndexedDB pending queue、离线 banner 未落地。 |
| 限流 30 req/min/user/lesson | 未实现 | `course-api.ts` | 课程路由未按 lesson/user 细粒度限流。 |
| 埋点 | 部分实现 | existing telemetry endpoints | 课程事件未完整写入 events 表。 |
| 性能指标 | 未验证 | Docker build + browser screenshot | 未跑 Lighthouse / LCP / render time 基准。 |

## 明确不能宣称完成的事项

- 不能宣称“生产课程内容已完整入库”：当前只有 dev seed 24 lessons，runtime 可生成结构，但不是 4 x 12 x 12 x 12 x 12 的人工审校生产内容包。
- 不能宣称“DB 持久化课程系统完成”：迁移表存在，但 API 仍主要读取/写入内存 `courseStore`。
- 不能宣称“CR-27 完成”：缺少 `packages/db/src/seed/schemas/courses.schema.ts` 与 `packages/db/src/seed/upsert.ts` 共享幂等 upsert。
- 不能宣称“ACR-08 完成”：后台 import/commit/publish 不写真实 DB，也没有版本回滚。
- 不能宣称“PWA 离线完成”：CR-24 未实现。
- 不能宣称“真实支付/TTS 完成”：当前遵循本地 Docker fake-safe 策略，Payment/TTS 使用 dummy/mock/seed 协议。

## 当前结论

本次交付达成开发级可运行闭环：课程 C 端、后台课程管理、红黄 glass UI、Docker 测试/构建、Compose 健康、MCP Browser 关键路径截图均完成。PRD 覆盖角度应判定为“核心交互与 fake-safe 验证完成，生产级内容/DB/upsert/PWA/支付/TTS/审计持久化仍为部分或未实现”。
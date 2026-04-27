# 02 · UX 与设计系统任务清单

## 来源覆盖

- `planning/ux/00-index.md`：16 个 UX 文件总目录与核心约束。
- `planning/ux/02-design-tokens.md`、`03-glassmorphism-system.md`、`04-theme-system.md`：token、毛玻璃、主题。
- `planning/ux/05-layout-and-responsive.md`、`06-navigation-routing.md`、`07-components-core.md`、`08-components-feedback.md`：布局、导航、组件和反馈。
- `planning/ux/09-screens-app.md`、`10-game-ux.md`、`11-screens-admin.md`：应用端、游戏、后台屏幕规格。
- `planning/ux/12-motion.md`、`13-accessibility.md`、`14-i18n-fonts.md`、`15-assets-iconography.md`、`16-performance-quality.md`：动效、无障碍、字体、资源、质量。

## 任务清单

- [ ] UX-01 建立 `packages/ui` tokens：颜色、字体、间距、圆角、阴影、动效、z-index、断点、安全区。来源句：`planning/ux/02-design-tokens.md` 写明“变量交付清单”包含 `tokens/colors.ts`、`typography.ts`、`spacing.ts`、`motion.ts`、主题 CSS 和 Tailwind preset。
- [ ] UX-02 实现全局毛玻璃层级 `.glass`、`.glass-card`、`.glass-elevated`、`.glass-floating`、`.glass-overlay`。来源句：`planning/ux/03-glassmorphism-system.md` 表格写明 L1-L5 毛玻璃层级、类名、模糊、透明度与用途。
- [ ] UX-03 实现亮/暗/跟随系统三档主题，并持久化到用户偏好。来源句：`planning/ux/04-theme-system.md` 写明“亮 / 暗 / 跟随系统”三种模式。
- [ ] UX-04 实现主题切换 300ms 平滑过渡和系统色监听。来源句：`planning/ux/00-index.md` 关键决策写明“主题切换：亮 / 暗 / 跟随系统 三档；切换 300ms 平滑过渡。”
- [ ] UX-05 建立移动优先响应式断点与安全区工具类。来源句：`planning/ux/05-layout-and-responsive.md` 写明断点 `xs/sm/md/lg/xl/2xl` 和 safe-area CSS。
- [ ] UX-06 实现应用端 4 Tab 导航：发现、课程、游戏、我的。来源句：`planning/ux/06-navigation-routing.md` 表格写明“发现 `/discover`、课程 `/courses`、游戏 `/games`、我的 `/profile`”。
- [ ] UX-07 实现 Header、TabBar、Breadcrumb、Modal Routes、FAB、后台 Sidebar/TopBar。来源句：`planning/ux/06-navigation-routing.md` 标题覆盖“TabBar、Header、面包屑、模态导航、Floating Action Button、后台导航”。
- [ ] UX-08 实现核心组件库：Button、Input、Card、Modal、Tabs、List、Avatar、Badge、Tag、Tooltip、Switch、Slider、Progress、Skeleton、AudioPlayer、PinyinText、SentenceCard。来源句：`planning/ux/07-components-core.md` “Component Library 交付清单”列出这些组件文件。
- [ ] UX-09 每个核心组件提供 Storybook 和 Vitest 测试。来源句：`planning/ux/07-components-core.md` 写明“每个组件含 .stories.tsx + .test.tsx”。
- [ ] UX-10 实现反馈组件：Toast、Banner、Confirm、Empty State、Skeleton、Loading、错误状态、离线 UI。来源句：`planning/ux/08-components-feedback.md` 标题列出 Toast/Banner/Modal Confirm/Empty State/Skeleton/Loading/错误状态/离线检测。
- [ ] UX-11 应用端实现 Splash、Onboarding、登录注册、发现、课程、游戏、我的、付费墙、错误页。来源句：`planning/ux/09-screens-app.md` 目录列出这些屏幕。
- [ ] UX-12 发现页呈现 12 中国文化类目与 12 小说类目入口。来源句：`planning/ux/09-screens-app.md` `/discover` 线框写明“中国文化 12 类目”和“网文小说 12 类目”。
- [ ] UX-13 课程页呈现 4 学习轨道、12 阶段地图、阶段/章/节学习页。来源句：`planning/ux/09-screens-app.md` 写明“4 学习轨道”与“12 阶段地图”。
- [ ] UX-14 游戏页呈现 12 游戏网格、详情、强制横屏画布、60s 结果页；移除旧文档里的排行榜/奖励视觉。来源句：`planning/prds/04-games/01-functional-requirements.md` 写明“12 张游戏卡片，全部可玩”与“不展示：三星评级 / 排行榜跳转 / 分享按钮 / 奖励动画 / 下一关 / 解锁”。
- [ ] UX-15 实现 OrientationMask、16:9 PixiJS 画布、安全区 HUD、横屏退出解锁。来源句：`planning/ux/10-game-ux.md` 写明“portrait → 显示 OrientationMask”与“设计基准：1280×720”。
- [ ] UX-16 实现桌面键鼠与移动触屏虚拟控件映射。来源句：`planning/ux/10-game-ux.md` 表格写明“通用键位”和“虚拟控件”。
- [ ] UX-17 实现游戏暂停/恢复、退出二次确认、首玩教学、失焦自动暂停。来源句：`planning/ux/10-game-ux.md` 写明“自动暂停：失去焦点”与“强制小教学（30s 内）”。
- [ ] UX-18 后台实现登录、Dashboard、内容管理、课程树、小说章节、游戏词包、审校、用户、订单、订阅、币、分销、客服、flags、审计、设置。来源句：`planning/ux/11-screens-admin.md` 目录逐项定义这些后台屏幕。
- [ ] UX-19 后台所有列表支持筛选、搜索、批量操作；编辑页支持自动保存、历史版本、软删确认。来源句：`planning/ux/11-screens-admin.md` 检查清单写明这些要求。
- [ ] UX-20 实现 WCAG 2.1 AA：对比度、键盘可达、语义 HTML、ARIA、表单关联、焦点陷阱。来源句：`planning/ux/13-accessibility.md` 写明“WCAG 2.1 Level AA”和“键盘可达：100% 应用可操作”。
- [ ] UX-21 实现字号 5 档、色弱模式、减弱动效、游戏字幕/慢速/关闭闪烁。来源句：`planning/ux/13-accessibility.md` 写明“字号可调 5 档”和“游戏可访问性：字幕 / 慢速模式 / 关闭闪烁 / 色弱模式”。
- [ ] UX-22 实现性能预算：应用 FCP/LCP/TTI/CLS/INP、后台关键页、游戏 60fps、资源大小。来源句：`planning/ux/16-performance-quality.md` 表格写明这些预算。
- [ ] UX-23 PWA 支持离线 shell、已缓存课程/文章、IndexedDB 已下载内容和离线提示。来源句：`planning/ux/16-performance-quality.md` 写明“App Shell：cache-first”和“用户主动下载课程 / 文章”。
- [ ] UX-24 将旧 UX 中外部监控/CI/视觉云服务描述替换为本地或容器内验证。来源句：`planning/rules.md` 写明“禁止新增基于 Playwright Cloud / BrowserStack 的远程测试”和“禁用 Sentry SaaS；前端用全局错误上报到自建接口”。

## 验收与测试

- [ ] UX-T01 Storybook 能在 Docker 内打开，核心组件可见且暗/亮模式通过。来源句：`planning/ux/00-index.md` 写明“Storybook（v1.0 W0 上线）：与 ui 包同步”。
- [ ] UX-T02 axe-core/Lighthouse 可访问性达标。来源句：`planning/ux/13-accessibility.md` 写明“Lighthouse Accessibility ≥ 95”。
- [ ] UX-T03 游戏在移动竖屏显示 OrientationMask，横屏进入画布，退出解锁方向。来源句：`planning/ux/10-game-ux.md` 检查清单写明“OrientationMask 在竖屏时显示”和“退出解锁方向恢复竖屏”。
- [ ] UX-T04 所有应用端屏幕包含 loading/empty/error 三态。来源句：`planning/ux/09-screens-app.md` 检查清单写明“所有屏幕含 loading / empty / error 三态”。

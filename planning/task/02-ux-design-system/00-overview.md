# 02 · UX 设计系统任务清单

## 一、目标

本任务目录负责把 `planning/ux` 的“松烟雅瓷 · Ink Porcelain Glass”规范落成可开发、可测试、可复用的 UI 系统。目标不是做一点毛玻璃效果，而是让应用端、后台和游戏共同具备现代效率与古典气韵。

## 二、来源覆盖

- `planning/ux/00-index.md` 至 `16-performance-quality.md`：完整 UX 规范。
- `planning/rules.md`：Docker-only、自托管、dev-only、本地验证、禁止外部托管 SaaS。
- `planning/prds/01-overall/04-scope-mvp.md`：PWA、4 语、12 游戏 v1 MVP、发现中国访问范围。
- `content/china/00-index.md`：发现中国 12 类目、访问模型、模块联动。
- `planning/prds/15-i18n`：4 语 UI、URL 前缀、字体与 SEO。

## 三、冲突裁决

- 旧 UX 中 Rose/Sky/Amber、彩色 blob、粒子背景、外部 CDN、SaaS 监控/云测试不再作为实现依据。
- 字体、图像、音频、截图验证、事件/错误上报都走本地、自托管或 Adapter。
- 游戏 v1 不做排行榜、三星、关卡奖励、道具消耗、知语币发放或 IAP。

## 四、任务范围

- UX-01 到 UX-05：设计语言、token、材质、主题、响应式基础。
- UX-06 到 UX-10：导航、组件、状态、stories 与本地测试。
- UX-11 到 UX-17：应用端、发现中国、课程、游戏屏幕与交互。
- UX-18 到 UX-19：后台工作台屏幕与列表/编辑行为。
- UX-20 到 UX-24：无障碍、偏好、性能、PWA、本地质量门禁。
- UX-25 到 UX-26：视觉一致性审计与 Discover China 类目视觉落地。

## 五、总体验收

- [ ] 应用端、后台、游戏均使用同一 token 和组件库。
- [ ] 关键页面截图能明显体现“松烟雅瓷”气质，且无刻板中国符号堆砌。
- [ ] 发现中国 12 类目视觉、访问门禁、分享/SEO 不泄露受限内容。
- [ ] 所有验证可在 Docker/dev 与 MCP Puppeteer 中完成。
- [ ] 无外部托管 SaaS/CDN/云测试硬依赖。
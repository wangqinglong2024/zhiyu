# ZY-11-04 · 章节阅读器（沉浸 + 字号 / 主题 / 朗读 / 点字弹窗）

> Epic：E11 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 读者
**I want** 沉浸式章节阅读，点击字弹释义、可朗读、可调字号 / 主题 / 行距、左右滑动翻章
**So that** 长时间阅读舒适、且阅读即学习。

## 上下文
- 路由：`/novels/:slug/c/:chapterNo`
- 翻章：左右滑动 / 键盘 ←→ / 顶部章节下拉
- 阅读设置面板：字号 4 档 / 行距 3 档 / 主题（白/夜/护眼/深棕）/ 朗读（速度 0.75/1/1.25）
- 点字弹窗复用 ZY-06-04
- 阅读到章末 → 自动加 XP / 标记进度

## Acceptance Criteria
- [ ] 阅读器组件：可手势 / 可键盘 / 可朗读
- [ ] 阅读设置持久化 user_settings
- [ ] 章末 → 写 reading_progress + 解锁下一章入口
- [ ] 未授权章节 → paywall 替代正文

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run reader
```
- MCP Puppeteer：滑翻章 → 调字号 → 朗读 → 退出再进恢复

## DoD
- [ ] 4 主题 + 4 字号
- [ ] 离线已读章节可读
- [ ] paywall 正确

## 依赖
- 上游：ZY-11-01 / ZY-06-04 / ZY-11-05

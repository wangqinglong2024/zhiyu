# ZY-06-05 · 阅读进度 + i18n 字幕

> Epic：E06 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 阅读自动保存进度，下次打开继续；并可在英 / 西 / 中 / 阿 4 语之间切换显示
**So that** 多设备无缝继续，新手也能借助母语理解中文原文。

## 上下文
- `zhiyu.reading_progress(user_id, article_id, percent, last_position int, updated_at)`，主键 (user_id, article_id)。
- 滚动事件 throttle 1s；离开页面 final flush。
- 字幕切换：每段落标记 i18n key 通过 ZY-04-04 翻译表加载。

## Acceptance Criteria
- [ ] `PUT /api/v1/me/reading-progress` upsert
- [ ] 重新打开自动 scroll 到 last_position
- [ ] 顶部进度条显示 percent
- [ ] 段落字幕切 lng 即时换内容（同行）
- [ ] 阅读到 100% 触发学习事件 → 经验值（接 ZY-07-05）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run reading.progress
```
- MCP Puppeteer：A 设备阅读到中段 → B 设备打开继续

## DoD
- [ ] 跨设备进度同步
- [ ] 100% 触发 XP

## 依赖
- 上游：ZY-06-03 / ZY-04-04 / ZY-07-05

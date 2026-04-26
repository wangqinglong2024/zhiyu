# ZY-08-04 · Lesson 学习页（10 步骤主驱动）

> Epic：E08 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 一个稳定流畅的课时学习页，按 10 步骤推进
**So that** 学习节奏清晰、可暂停、可回看、可重做。

## 上下文
- 单页面 `/learn/:track/:stage/:lessonId` + step 内部子状态机（接 ZY-07-02 引擎）。
- 顶部进度条 10 段；步骤切换有动效；完成步骤即刻调 `LessonEngine.advance` 持久化。
- 网络断开仍能继续本地步骤；恢复后批量同步。
- 退出二次确认（未完成）。

## Acceptance Criteria
- [ ] 顶部 10 段进度条 + 当前步骤高亮
- [ ] 步骤动态懒加载（按 type 分包）
- [ ] 离线缓存 step payload
- [ ] 完成 lesson → 解锁动画 + 跳下一 lesson
- [ ] 中途退出 → enrollment.current_step 保留

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run lesson.page
```
- MCP Puppeteer：走完 1 lesson → 进度持久化

## DoD
- [ ] 离线可继续
- [ ] 解锁正确

## 依赖
- 上游：ZY-08-02 / ZY-07-02 / ZY-08-05

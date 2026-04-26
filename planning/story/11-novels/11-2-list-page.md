# ZY-11-02 · 小说列表页（类型 / 排序 / 状态筛选）

> Epic：E11 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 按类型 / 完结状态 / 评分 / 热度 浏览小说
**So that** 找到自己感兴趣的作品。

## 上下文
- 路由：`/novels`、`/novels/:genre`
- 卡片：cover + 标题 + 类型 + 完结/连载 + 评分 + 字数 + 热度
- 排序：默认综合（视图加权评分 × 时效）；可切热门 / 最新 / 高评。

## Acceptance Criteria
- [ ] 12 类型导航（标签条 + 滚动）
- [ ] 无限加载 + skeleton
- [ ] 完结 / 连载 chip 筛选
- [ ] 4 语切换标题
- [ ] 离线缓存上次列表

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run novels.list
```
- MCP Puppeteer：切类型 → 切排序 → 滚动加载

## DoD
- [ ] 性能 LCP ≤ 2s
- [ ] 类型切换不丢 scroll

## 依赖
- 上游：ZY-11-01 / ZY-02

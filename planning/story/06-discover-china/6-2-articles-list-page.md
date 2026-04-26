# ZY-06-02 · 文章列表页（分类 / 难度 / 时长 筛选 + 无限加载）

> Epic：E06 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 在发现频道按分类 / 难度 / 时长筛选文章并无限滚动加载
**So that** 高效找到适合自己水平的文化阅读材料。

## 上下文
- 路由：`/discover` 默认 + `/discover/:category`
- TanStack Query infinite query；每页 12 条；keyset pagination by `published_at,id`。
- 卡片：cover + 标题 + 摘要 + 难度 chip + 时长 + 类别 chip。
- 排序：默认按 published_at desc；可切热门（view_count desc）。

## Acceptance Criteria
- [ ] `GET /api/v1/articles?category&minDiff&maxDiff&maxMin&cursor&sort` 支持组合筛选
- [ ] FE 卡片列表 + skeleton + 无限加载 + scroll restore
- [ ] 4 语切换标题/摘要走 i18n helper
- [ ] 空态：EmptyState 引导切换筛选
- [ ] LCP 卡片首图 lazy + lqip

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run articles.list
```
- MCP Puppeteer：滚动加载 + 切分类 + 切排序

## DoD
- [ ] 性能 LCP ≤ 2s
- [ ] keyset 翻页正确无重复

## 依赖
- 上游：ZY-06-01 / ZY-02 / ZY-04

# ZY-05-04 · 全局搜索弹窗（cmdk）

> Epic：E05 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 任意页面按 ⌘K / 顶栏搜索图标弹出全局搜索
**So that** 我可以快速跳到课程 / 文章 / 词条 / 设置。

## 上下文
- 基于 cmdk + Postgres FTS（中文用 jieba 分词，接 ZY-06-06）。
- 索引覆盖：articles / courses / lessons / wordpacks / novels / settings。
- 防抖 200ms；快捷键：⌘K / Ctrl+K / 顶栏 icon。
- 无结果显示热门搜索 + 推荐入口。

## Acceptance Criteria
- [ ] `<CommandPalette>` 弹窗组件
- [ ] `GET /api/v1/search?q=&types=` 返回多类型聚合（每类型最多 5 条）
- [ ] 键盘上下选中 + 回车跳转
- [ ] 最近搜索 5 条本地缓存
- [ ] 无结果 → 推荐 4 个入口

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run search
```
- MCP Puppeteer：⌘K → 输 "hsk" → 跳

## DoD
- [ ] FTS 中英 / 拼音 命中
- [ ] 200ms 防抖

## 不做
- AI 语义搜索（v1.5；可后期叠 pgvector）

## 依赖
- 上游：ZY-06-06 FTS
- 下游：admin 搜索 ZY-17

# ZY-06-04 · 字词弹窗 + 收藏夹

> Epic：E06 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 阅读时点击单字/词出现释义弹窗，并可加入生词本
**So that** 即点即学，搭建个人词库。

## 上下文
- 词典数据：`zhiyu.dictionary(simplified, traditional, pinyin, definitions jsonb)`（CC-CEDICT 子集 + 自维护）。
- 弹窗显示：拼音 + 释义（按 lng）+ HSK 等级 + 例句 1 条 + 「+ 加入生词本」「朗读」按钮。
- 收藏夹两类：文章收藏 + 生词本（共用 favorites 通用表 entity_type 区分）。

## 数据模型
```sql
create table zhiyu.favorites (
  user_id uuid not null,
  entity_type text not null,        -- 'article' | 'word' | 'novel' | 'lesson'
  entity_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, entity_type, entity_id)
);
```

## Acceptance Criteria
- [ ] `GET /api/v1/dict/:word` 返回释义 + HSK
- [ ] FE 弹窗组件 + 长按/点击触发
- [ ] `POST/DELETE /api/v1/favorites`
- [ ] `/me/favorites` 列表（按 entity_type tab）
- [ ] 词条加生词本同时入 SRS 队列（接 ZY-07-04）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run dict favorites
```
- MCP Puppeteer：阅读 → 点字 → 加生词本 → 跳生词本看到

## DoD
- [ ] 弹窗 ≤ 200ms
- [ ] 生词本同步 SRS

## 依赖
- 上游：ZY-06-03 / ZY-07-04

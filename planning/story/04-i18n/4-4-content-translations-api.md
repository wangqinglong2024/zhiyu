# ZY-04-04 · 内容翻译表与 API（CMS 多语字段）

> Epic：E04 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 内容编辑
**I want** 文章 / 课程 / 商品等业务实体支持 4 语字段
**So that** 我能在后台维护翻译，前端按 lng 取对应版本，缺失语种回落 en。

## 上下文
- 选择 **EAV 翻译表**而非 jsonb 字段（便于翻译进度统计 + admin 列表筛选）。
- 通用表：`zhiyu.content_translations(entity_type, entity_id, locale, field, value)`，主键 (entity_type, entity_id, locale, field)。
- BE helper：`getTranslated(entity, lng, fallback='en')`。

## 数据模型
```sql
create table zhiyu.content_translations (
  entity_type text not null,        -- 'article' | 'course' | 'lesson' | 'product' | 'plan' ...
  entity_id text not null,
  locale text not null,
  field text not null,              -- 'title' | 'body' | 'desc' ...
  value text not null,
  updated_at timestamptz default now(),
  primary key (entity_type, entity_id, locale, field)
);
create index on zhiyu.content_translations (entity_type, entity_id);
```

## Acceptance Criteria
- [ ] migration + drizzle schema
- [ ] BE helper + cache（in-memory LRU 1000 条 / 60s TTL）
- [ ] admin 接口：GET / PUT / DELETE 翻译条目
- [ ] FE list / detail 页统一通过 helper 取字段
- [ ] 翻译进度统计：admin 看 `entity_type` × `locale` 覆盖率

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run i18n.translations
```

## DoD
- [ ] fallback 链路通
- [ ] cache 命中 ≥ 80%

## 不做
- AI 自动翻译（v1.5；接 ZY-16）

## 依赖
- 上游：ZY-04-01
- 下游：ZY-06 / ZY-08 / ZY-11 / ZY-13 / ZY-17

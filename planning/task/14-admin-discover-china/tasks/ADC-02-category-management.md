# ADC-02 · 实现 12 类目管理

## PRD 原文引用

- `content/china/00-index.md` 列出 12 类目。
- `planning/prds/02-discover-china/02-data-model-api.md` 定义 `content_categories` 字段。

## 需求落实

- 页面：`/admin/content/articles/categories`。
- 组件：DiscoverCategoryAdminList、DiscoverCategoryForm。
- API：`GET/PATCH /admin/api/content/discover/categories`。
- 数据表：`content_categories`、`admin_audit_logs`。
- 状态逻辑：只能管理 12 个固定类目；不允许随意新增第 13 个类目，除非 PRD/内容目录先更新。

## 不明确 / 风险

- 风险：后台误删类目会影响文章外键。
- 处理：v1 禁止硬删除，只允许隐藏或归档。

## 技术假设

- 类目封面上传到自托管 Supabase Storage `images` 桶；该 Supabase 实例必须由 Docker compose 管理，不允许接外部托管 Storage/CDN。

## 最终验收清单

- [ ] 12 类目全部可编辑描述/封面/主题色/排序。
- [ ] 前 3 类目的匿名开放标识可见但默认不可误关。
- [ ] 隐藏类目前需二次确认。
- [ ] 修改写审计。
- [ ] 后台不允许新增第 13 个 DC 类目；如内容目录未更新，保存会被拒绝。
- [ ] 封面上传、预览、替换均在 Docker 自托管 Storage 内完成。
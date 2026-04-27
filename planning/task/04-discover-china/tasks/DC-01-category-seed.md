# DC-01 · 建立发现中国类目数据与 12 类目 Seed

## PRD 原文引用

- `planning/prds/02-discover-china/00-index.md`：“12 类目（中国历史 / 中华美食 / 山水奇观 / 节日民俗 / 艺术遗产 / 音乐戏曲 / 古典文学 / 成语典故 / 哲学智慧 / 现代中国 / 玩转中文 / 神话传说）。”
- `planning/prds/02-discover-china/02-data-model-api.md`：“CREATE TABLE content_categories ... module TEXT NOT NULL CHECK (module IN ('discover','novel'))”。
- `content/china/00-index.md` 类目列表列出 12 个类目及对应文档。

## 需求落实

- 页面：`/discover`、后台 `/admin/content/articles/categories`。
- 组件：DiscoverCategoryCard、AdminCategoryForm。
- API：`GET /api/discover/categories`、`GET/PATCH /admin/api/content/discover/categories`。
- 数据表：`content_categories`，`module='discover'`。
- 状态逻辑：12 类目按 `display_order` 固定排序；status 支持 active/hidden；前 3 类目标记 anonymous_visible=true。
- 类目口径：slug/code 固定为 `history`、`cuisine`、`scenic-wonders`、`festivals-customs`、`arts-heritage`、`music-opera`、`classic-literature`、`idioms-allusions`、`philosophy-wisdom`、`modern-china`、`fun-with-chinese`、`myths-legends`。

## 不明确 / 风险

- 风险：PRD 使用“中华美食/山水奇观”等名称，内容目录使用“中国美食/名胜风光”。
- 处理：slug/code 以内容目录为准，展示名可配置多语别名。

## 技术假设

- 类目 seed 文件位于 `system/packages/db/seed/discover-china/categories.json`。
- 主题色与封面先用占位资源，后续后台可替换。

## 最终验收清单

- [ ] 12 个 discover 类目全部入库且 slug 唯一。
- [ ] 类目名称、顺序、slug/code 与 `content/china/00-index.md` 一致，PRD 旧名称仅作为展示别名或迁移备注。
- [ ] 前 3 类目为匿名开放：中国历史、中国美食、名胜风光。
- [ ] `/api/discover/categories` 返回 12 类目、文章数、封面、主题色、多语名称。
- [ ] 后台可调整封面、描述、排序、状态。
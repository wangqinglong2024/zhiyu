# DC-09 · 实现文章与句子收藏

## PRD 原文引用

- `DC-FR-006`：“右上角心形按钮，点击收藏 / 取消。”
- `DC-FR-006`：“存储：`user_favorites`（type=article）。”

## 需求落实

- 页面：DC 文章页、个人中心收藏页。
- 组件：FavoriteButton、FavoriteList。
- API：`POST /api/discover/articles/:id/favorite`，句子收藏复用通用收藏 API。
- 数据表：`user_favorites`。
- 状态逻辑：登录后可收藏；未登录点击收藏弹登录引导。
- 个人中心：`/me/favorites` 必须能按文章/句子类型筛选，并显示来源类目与文章标题。

## 不明确 / 风险

- 风险：PRD 写文章收藏，句子菜单也有收藏。
- 处理：`target_type` 同时支持 article 和 sentence。

## 技术假设

- 收藏列表按创建时间倒序分页。

## 最终验收清单

- [ ] 文章收藏/取消即时反馈。
- [ ] 句子收藏写入 `target_type=sentence`。
- [ ] 个人中心能看到文章与句子收藏。
- [ ] 重复收藏受唯一约束保护。
- [ ] 收藏/取消收藏事件写入 `events`。
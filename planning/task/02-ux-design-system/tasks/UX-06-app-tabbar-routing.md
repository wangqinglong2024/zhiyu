# UX-06 · 应用端 TabBar 与路由守卫

## 来源

- `planning/ux/06-navigation-routing.md`
- `content/china/00-index.md`

## 需求落实

- 实现发现、课程、游戏、我的 4 Tab。
- 激活态使用 jade/印点，不使用旧 rose。
- 路由支持 en/vi/th/id 前缀。
- 实现 LocaleGuard、AuthGuard、PaidGuard、ContentGate、GameAccessGuard。

## 验收清单

- [ ] 4 Tab 未登录可见。
- [ ] 发现中国前 3 类目访客可读，其余需登录。
- [ ] 游戏详情可见，登录后 12 款可玩。
- [ ] 深链与语言切换正确。
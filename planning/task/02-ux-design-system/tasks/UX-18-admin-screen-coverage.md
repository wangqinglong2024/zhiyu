# UX-18 · 后台屏幕覆盖

## 来源

- `planning/ux/11-screens-admin.md`
- `planning/task/13-admin`

## 需求落实

- 实现登录、Dashboard、内容管理、内容工厂占位、审校、用户、订单、知语币、分销、客服、Feature Flags、审计、系统设置页面壳。
- 后台视觉为高密度工作台，低装饰，保留 token 与 glass 适度层级。
- 所有写操作入口预留 RBAC 与审计。

## 验收清单

- [ ] AD-01 至 AD-19 均有对应页面入口。
- [ ] Sidebar/TopBar/面包屑完整。
- [ ] 移动端基础可用。
- [ ] 无外部分析/支付 provider 硬编码。
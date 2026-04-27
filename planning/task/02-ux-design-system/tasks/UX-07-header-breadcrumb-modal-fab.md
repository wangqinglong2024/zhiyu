# UX-07 · Header、面包屑、Modal 与 FAB

## 来源

- `planning/ux/06-navigation-routing.md`
- `planning/ux/07-components-core.md`

## 需求落实

- 应用端 Header 支持透明详情态与滚动后玻璃态。
- 后台所有深层页面显示面包屑。
- Modal/Drawer/BottomSheet 支持 focus trap、ESC、焦点返回。
- FAB 只在客服、通知等明确场景出现。

## 验收清单

- [ ] Header 在安全区内且不遮正文。
- [ ] 图标按钮全部有 tooltip/aria-label。
- [ ] Modal 键盘与读屏可用。
- [ ] 后台面包屑可点击回溯。
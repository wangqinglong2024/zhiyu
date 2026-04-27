# UX-05 · 响应式布局与安全区

## 来源

- `planning/ux/05-layout-and-responsive.md`

## 需求落实

- 建立 xs/sm/md/lg/xl/2xl 断点 token。
- 应用端桌面最大 768px 居中，两侧 `surface-wash`。
- 后台 Sidebar/TopBar/Table/Edit 工作台布局可响应。
- fixed 元素使用 safe-area inset。

## 验收清单

- [ ] 360/390/768/1024/1280px 无重叠。
- [ ] TabBar、BottomSheet、横屏游戏安全区正确。
- [ ] 后台移动端抽屉基础可用。
- [ ] 固定格式控件尺寸稳定。
# UX-10 · 反馈与状态组件

## 来源

- `planning/ux/08-components-feedback.md`

## 需求落实

- 实现 Toast、Banner、Confirm、EmptyState、Skeleton、ErrorBoundary、OfflineBanner。
- 状态颜色使用 celadon、mist-blue、aged-gold、cinnabar。
- Toast/Banner 支持 `aria-live`。
- 危险操作确认支持输入确认词。

## 验收清单

- [ ] loading/empty/error/offline 可复用于关键页面。
- [ ] Toast 最多 3 个，多余排队。
- [ ] Confirm 可键盘操作且焦点正确。
- [ ] 文案支持 4 语。
# UX-11 · 应用端基础屏幕壳

## 来源

- `planning/ux/09-screens-app.md`

## 需求落实

- 实现 Splash、Onboarding、Auth、Profile、Settings、Paywall 的页面壳。
- 首屏直接进入可用体验，不做营销页式 Hero。
- Auth 支持邮箱密码；可选 OAuth 通过 Adapter 开关，缺 key 不阻塞。
- Profile 包含主题、语言、字号、拼音、朗读、导出/删除入口。

## 验收清单

- [ ] 启动屏 < 1.5s 后进入业务页面。
- [ ] Onboarding 5 步可跳过/完成。
- [ ] Auth 表单 a11y 完整。
- [ ] Profile 设置可持久化。
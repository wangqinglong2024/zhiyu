# UX-01 · 建立松烟雅瓷 Token 事实源

## 来源

- `planning/ux/02-design-tokens.md`
- `planning/rules.md`

## 需求落实

- 在 `system/packages/ui/tokens` 输出 colors、typography、spacing、radius、shadow、motion、zIndex、breakpoints。
- 在 `system/packages/ui/styles` 输出 CSS variables、theme variables、material classes。
- 品牌色改为 paper、ink、cinnabar、jade、celadon、porcelain、mist-blue、aged-gold。
- 删除旧 rose/sky/amber 作为品牌主色的依赖。

## 验收清单

- [ ] Tailwind preset 与 CSS variables 同源。
- [ ] 明/暗主题 token 完整。
- [ ] 声调色和语义色完整。
- [ ] 搜索代码无旧品牌主色硬编码。
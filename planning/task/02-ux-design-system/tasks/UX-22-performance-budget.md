# UX-22 · 性能预算

## 来源

- `planning/ux/16-performance-quality.md`
- `planning/prds/01-overall/06-non-functional.md`

## 需求落实

- 路由级 code split。
- 编辑器、图表、PixiJS 按需加载。
- 图片 WebP/AVIF、srcset、懒加载。
- 字体自托管、子集化、按语言加载。
- 玻璃 blur 和动画有低端设备降级策略。

## 验收清单

- [ ] 应用端 FCP/LCP/TTI/CLS/INP 达预算。
- [ ] 首屏 JS gzip < 200KB。
- [ ] 游戏首次画布 ≤ 800ms。
- [ ] 低端设备无明显滚动卡顿。
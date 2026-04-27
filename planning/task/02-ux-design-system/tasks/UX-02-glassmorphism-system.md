# UX-02 · 实现瓷釉毛玻璃材质系统

## 来源

- `planning/ux/03-glassmorphism-system.md`

## 需求落实

- 实现 `.surface-paper`、`.surface-wash`、`.glass-porcelain`、`.glass-ink`、`.glass-elevated`、`.seal-accent`。
- 背景使用宣纸纹理和水墨雾带，不使用彩色 blob 或粒子主背景。
- 阅读正文和后台表格优先实底，玻璃只服务层级。
- 低端设备和 reduced transparency 下自动降级为实底。

## 验收清单

- [ ] 同屏 blur 数量符合 UX 预算。
- [ ] 玻璃层不影响正文/拼音/表格对比度。
- [ ] 降级后布局无跳动。
- [ ] 页面能体现纸、墨、瓷、印材质。
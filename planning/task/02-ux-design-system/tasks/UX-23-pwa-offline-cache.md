# UX-23 · PWA 离线与缓存

## 来源

- `planning/ux/16-performance-quality.md`
- `planning/rules.md`

## 需求落实

- App Shell、静态资源、已下载学习内容支持 Service Worker 缓存。
- 用户数据写操作仅在线。
- 离线 Banner、禁用状态与已缓存标记完整。
- 图片/音频缓存使用本地 nginx/cache header + SW，不依赖外部 CDN。

## 验收清单

- [ ] PWA 可安装。
- [ ] 离线可打开已缓存内容。
- [ ] 在线写操作离线时不假成功。
- [ ] 受限音频缓存不泄露私有 URL。
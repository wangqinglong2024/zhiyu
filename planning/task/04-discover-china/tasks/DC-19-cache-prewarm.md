# DC-19 · 实现内容预热与本地缓存策略

## PRD 原文引用

- `DC-FR-016`：“热门文章自动进入本地 nginx/cache header/SW 预取策略。”
- `planning/rules.md`：“本期不集成任何外部托管 SaaS。”
- `planning/spec/01-overview.md`：“v1 不走外部 CDN；静态资源由 nginx 直接 gzip + 长 cache header。”

## 需求落实

- 页面：无直接页面。
- 组件：ServiceWorkerPrecacheManifest。
- API：发布文章后触发缓存版本更新；前端读取预取清单。
- 数据表：可选 `content_cache_manifest`。
- 状态逻辑：已发布热门文章进入预取，撤回文章必须从清单移除。
- 触发：发布即推入缓存版本更新；日访问 > 100 的热门文章进入预取清单。
- TTL：类目列表 1h，文章列表 5min，已发布单篇 1h；开放类目音频可本地 nginx/cache header 缓存 30 天，受限类目音频只允许登录后进入用户私有 SW/browser cache。
- 音频访问：音频源文件存自托管 Supabase Storage 私有对象；前台只能通过应用层 audio proxy 访问，proxy 每次先校验文章 status 与 category 访问模型，再按开放/登录态返回可缓存响应。
- 门禁：缓存命中只能减少加载时间，不能绕过 API/audio proxy 的 status 与 category 访问裁决。
- 失效顺序：撤回/归档必须先让 API/audio proxy 返回不可读，再刷新搜索索引、sitemap、推荐候选和 SW 清单；任何一步失败都写 `security_events` 或运维日志。

## 不明确 / 风险

- 风险：缓存陈旧导致已撤回文章仍可见。
- 处理：发布/撤回时更新版本号，并让 API 权限/状态作为最终裁决。

## 技术假设

- 只使用本地 nginx、浏览器缓存、PWA Service Worker。

## 最终验收清单

- [ ] 热门文章加载命中本地缓存。
- [ ] 撤回文章无法被缓存绕过访问。
- [ ] 缓存清单可观测。
- [ ] 不引入外部 CDN 依赖。
- [ ] 发布、撤回、类目匿名开放状态变化都会刷新缓存版本并使旧 SW 清单失效。
- [ ] 受限类目音频不能以 public URL 或共享 nginx cache 匿名直连；登录用户可通过私有 SW/browser cache 达到复听加速。
- [ ] 撤回竞态测试通过：撤回完成后旧 URL、旧 SW 清单、搜索入口、推荐入口均不可读取正文或音频。
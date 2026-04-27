# UX-24 · 本地质量验证

## 来源

- `planning/ux/16-performance-quality.md`
- `planning/rules.md`

## 需求落实

- 在 Docker/dev 中运行类型检查、lint、vitest、组件测试、axe、Lighthouse、本地截图 smoke。
- 使用 MCP Puppeteer 直连 app/admin 地址做 E2E 与截图验证。
- 前端错误和事件写自建接口与表。
- 禁止 Sentry/PostHog/BrowserStack/远程云视觉回归作为 v1 依赖。

## 验收清单

- [ ] Docker 命令能跑完整 UX 质量检查。
- [ ] MCP Puppeteer 可生成关键页面截图。
- [ ] 无外部监控/云测试依赖。
- [ ] 质量报告写入本地 artifacts。
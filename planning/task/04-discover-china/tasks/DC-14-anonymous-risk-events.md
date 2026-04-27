# DC-14 · 实现匿名风控与注册转化埋点

## PRD 原文引用

- `UA-FR-013`：“设备指纹仅用于匿名访问风控与注册转化埋点，不用于按篇扣减 DC 访问额度。”
- `planning/prds/13-security/01-functional-requirements.md`：“未登录：anonymous JWT 1h（含 anon_id）。”
- `planning/rules.md`：“行为分析：禁用 PostHog SaaS；自建 `events` 表 + 后端写入接口。”

## 需求落实

- 页面：DC 受限类目登录引导弹窗。
- 组件：RegisterPromptModal、AccessEventTracker。
- API：匿名 JWT 签发、`POST /api/v1/events` 或统一 track SDK。
- 数据表：`events`、`security_events`。
- 状态逻辑：记录 anon_id、device_id、ip_hash、category_slug、action=login_prompt_shown/registered。
- 事件口径：记录门禁展示、登录点击、注册成功、绕过尝试、限流触发；不得记录敏感正文或明文 IP。
- 风控口径：anon_id 优先，device_id/ip_hash 仅用于转化归因和异常频率识别，不参与“按篇额度”。

## 不明确 / 风险

- 风险：设备指纹可能被用户禁用或浏览器限制。
- 处理：anon_id 优先，device_id/ip_hash 仅辅助风控。

## 技术假设

- 不引入外部行为分析 SaaS，不发送到第三方。

## 最终验收清单

- [ ] 未登录触发第 4 类目门禁时写转化事件。
- [ ] 注册完成后事件能关联 anon_id 与 user_id。
- [ ] 同 IP 多用户不会被 DC 按篇误伤。
- [ ] 风控事件脱敏存储。
- [ ] 不接 PostHog/Sentry 等外部 SaaS，所有行为与错误数据进入自建接口或日志。
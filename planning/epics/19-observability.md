# Epic E19 · 可观测与运维（Observability & Ops）

> 阶段：M0-M6 贯穿 · 优先级：P0 · 估算：4 周（分散）

## Stories

### ZY-19-01 · Pino 日志 + Better Stack 接入
**AC**
- [ ] 结构化 JSON
- [ ] 脱敏中间件
- [ ] 30d 热 / 365d 归档
**Tech**：spec/10 § 3
**估**: M

### ZY-19-02 · Sentry FE/BE 完整集成
**AC**
- [ ] Source map
- [ ] release 标记
- [ ] 用户 fingerprint
- [ ] 自定义过滤
**估**: M

### ZY-19-03 · PostHog 行为埋点
**AC**
- [ ] 事件 schema 文档
- [ ] FE auto + 关键自定义
- [ ] BE 服务端事件
**估**: L

### ZY-19-04 · /health /ready /metrics 端点
**AC**
- [ ] 检查 DB / Redis / 第三方
- [ ] Prometheus 格式
- [ ] Render 健康探测
**估**: S

### ZY-19-05 · 业务指标仪表板
**AC**
- [ ] 实时（注册 / 付费 / 在线）
- [ ] 工厂任务
- [ ] 客服 SLA
- [ ] BetterStack / Metabase
**估**: M

### ZY-19-06 · 告警规则 + 通道
**AC**
- [ ] Slack + PagerDuty
- [ ] SLO 阈值
- [ ] 静默规则
- [ ] On-call 表
**Tech**：spec/10 § 8
**估**: M

### ZY-19-07 · 状态页（status.zhiyu.io）
**AC**
- [ ] BetterStack StatusPage
- [ ] 服务列表
- [ ] 历史事件
- [ ] 订阅
**估**: M

### ZY-19-08 · Web Vitals RUM
**AC**
- [ ] FE 上报 LCP / INP / CLS
- [ ] PostHog 仪表板
- [ ] 按页面 / 国家 / 设备
**估**: M

### ZY-19-09 · 备份与恢复演练
**AC**
- [ ] 自动 daily backup
- [ ] R2 versioning
- [ ] 季度演练 runbook
**估**: M

### ZY-19-10 · 部署事件 + Postmortem 模板
**AC**
- [ ] PostHog 标注 release
- [ ] Slack 通知
- [ ] PIR 模板
**估**: S

## 风险
- 告警噪音 → 调阈值
- 监控成本 → 采样

## DoD
- [ ] 三件套全集成
- [ ] SLO 监控启用
- [ ] 告警有效
- [ ] 状态页公开

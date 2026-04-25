# 9.3 · 分销 · 验收准则

## 功能
- [ ] RF-AC-001：注册自动生成 6 位邀请码（无歧义字符），用户不可见亦不可改
- [ ] RF-AC-002：分享链接 + QR 海报 + 多语种文案；删除链接 code 段则地址失效
- [ ] RF-AC-003：访客通过 /r/:code 注册 → 上级正确绑定 + 立即记为有效推荐
- [ ] RF-AC-004：设备指纹相同 → 拒绑
- [ ] RF-AC-005：付费触发 L1 / L2 佣金，rate=20%/20%，单位 ZC
- [ ] RF-AC-006：14 天确认期；confirmed 后自动入账 coins_ledger
- [ ] RF-AC-007：退款触发 commission_reversed；已 issued 则 coins_ledger 负数扣除
- [ ] RF-AC-008：佣金仅入账知语币，不提供现金提现 API
- [ ] RF-AC-009：仪表板余额准确（pending / confirmed / issued ZC）
- [ ] RF-AC-010：反作弊告警（同 IP 聚集、同设备）
- [ ] RF-AC-011：不存在任何 UI / API 暴露纯邀请码字符串；不存在修改邀请码入口

## 非功能
- [ ] 仪表板 P95 < 500ms
- [ ] 退款触发佣金扣回不丢
- [ ] RLS 仅自己可看自己佣金

## 测试用例
1. 用户 A 邀请 B，B 注册成功 → is_effective=true
2. B 付 $40 → A pending +800 ZC；14 天后 confirmed → issued，A 知语币余额 +800
3. B 退款（已 issued）→ A 状态 reversed，coins_ledger 负数 -800
4. A 再邀 C，C 也付 $40 → A pending +800 ZC
5. B 邀 D，D 付 $40 → A 得 L2 800 ZC，B 得 L1 800 ZC
6. 设备指纹相同（A 自己注册 X）→ 拒
7. 请求旧接口 GET /api/me/referral/code 或 POST /api/me/referral/withdraw → 404

## 监控
- 日新增有效推荐
- 月佣金发放总额（ZC）
- 反作弊触发次数
- 佣金 reversed 总额 / 负余额账户数

# 9.1 · 分销 · 功能需求

## 用户故事
- US-RF-01：邀请朋友注册并赚佣金
- US-RF-02：实时看 L1 / L2 收益
- US-RF-03：佣金兑换为知语币用于站内消费
- US-RF-04：分享链接 / QR / 海报

## 功能需求

### RF-FR-001：邀请码生成
- 注意：每个用户分享出的链接地址含有邀请码，链接中删除则地址无效；不要显示的展示邀请码给被邀请的用户，也不支持用户自己更改。

### RF-FR-002：分享渠道
- 复制链接：`https://zhiyu.app/r/:code`
- 复制邀请文案（多语种）
- QR 海报（下载 PNG）
- WhatsApp / Line / Zalo / Facebook 直分享

### RF-FR-003：邀请落地页
- `/r/:code` → 自动注册时绑上级
- 30 天 cookie / 设备指纹缓存
- 显示邀请人头像 + 名 + "你的朋友邀请你免费学中文"
- 注册转化率埋点

### RF-FR-004：上级关系建立
- 注册时 cookie 含 ref → 写 referral_relations
- 设备指纹与上级相同 → 拒绝绑定 + 告警
- 同一 IP 1 天内同一上级注册超 3 → 标可疑

### RF-FR-005：有效推荐判定
- 被推荐人成功注册即记为有效推荐（is_effective=true）

### RF-FR-006：佣金计算
- 触发：被推荐人成功付费（任何订单）
- L1 佣金（ZC）= 订单金额(USD) × 100 × 20%
- L2 佣金（ZC）= 订单金额(USD) × 100 × 20%
- 写 referral_commissions（pending → confirmed）
- 退款：触发 commission_reversed

### RF-FR-007：佣金确认期
- 订单成功后 14 天确认期（防退款）
- 14 天后 status: pending → confirmed，同时调用 economy.issue 入账知语币
- 退款发生：
  - pending：直接标记 reversed
  - confirmed/issued：scoins_ledger 生成负数扣除（如余额不足可以为负，账户状态 owed=true）

### RF-FR-008：佣金发放为知语币
- 佣金 confirmed 后自动以知语币形式入账用户账户（无需手动兑换）
- **不提供现金提现接口**
- 仅可用于站内消费：解锁课程段 / 章节 / 商城商品 / 会员 / 道具等
- coins_ledger.source = 'referral_commission'

### RF-FR-009：仪表板
- `/me/referral`
- 元素：
  - 累计佣金总额（ZC） / 待确认 / 已发放
  - L1 / L2 推荐人数
  - 最近 30 天佣金曲线（ZC）
  - 邀请链接 + 复制 / 海报按钮（仅展示链接，不展示纯邀请码字符串）
  - 推荐人列表（脱敏）

### RF-FR-011：反作弊
- 设备指纹相同 → 拒绑
- IP 段 / 时段聚集 → 标记
- 行为异常（仅完成最低有效门槛）→ 人工复审
- 确认刷子：冻结佣金 + 封号 + 邮件通知

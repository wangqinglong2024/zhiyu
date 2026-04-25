# Epic E14 · 分销系统（Referral）

> 阶段：M5-M6 · 优先级：P0 · 估算：3 周

## 摘要
邀请 / 二级分销 / 佣金（以 ZC 发放，**不支持现金提现**） / 反作弊。佣金 confirm 后自动入账知语币。

## 范围
- 邀请码生成（系统生成、用户不可见、不可改）
- 邀请落地页 + 上级关系建立
- 佣金计算（L1=20%, L2=20%）→ 单位 ZC
- 14 天确认期 + 反向（退款扣回）
- 佣金 confirmed → 自动 issue 知语币
- 分销员仪表板（ZC 单位）

## 非范围
- 现金提现（PayPal / Wise / 银行）— 永久不做
- 多级分销 > L2（v2 评估）
- 团队管理（v2）

## 依赖
- E03 用户账户（注册流程含 ref 绑定）
- E12 经济（economy.issue 入账）
- E13 支付（订单成功 / 退款 webhook）
- E18 安全（设备指纹、反作弊）

## Stories

### ZY-14-01 · 表与 RLS：referral_codes / referral_relations / referral_commissions
**AC**
- [ ] 三表 + 索引
- [ ] RLS：仅本人可看自己 commissions / relations
- [ ] referral_commissions 字段使用 amount_coins（INT，单位 ZC）
- [ ] 不创建 referral_withdrawals / referral_balances 表
**Tech**：planning/prds/09-referral/02
**估**: M

### ZY-14-02 · 注册时邀请码生成
**AC**
- [ ] 用户注册成功钩子 → 生成 6 位邀请码（无歧义字符 0/O/1/I/L 排除）
- [ ] 唯一性冲突重试
- [ ] 不暴露给前端任何形式的「单独 code 字段」API
- [ ] 生成后即写入 referral_codes（不可变）
**估**: S

### ZY-14-03 · 分享链接与素材中心
**AC**
- [ ] GET /api/me/referral/share-link → 返回完整 URL（如 https://zhiyu.app/r/AB3K7Z）
- [ ] 4 语种邀请文案模板（不含纯 code 文本）
- [ ] QR 海报生成（PNG，含链接二维码 + 头像）
- [ ] WhatsApp / Line / Zalo / Facebook 分享调用
- [ ] 删除 URL 中 :code 段 → 落地页 404
**Tech**：planning/prds/09-referral/01 RF-FR-002
**估**: M

### ZY-14-04 · 邀请落地页 /r/:code
**AC**
- [ ] 解析 code → 校验存在
- [ ] 显示邀请人头像 + 名（脱敏）
- [ ] 30 天 cookie 写入 ref_code
- [ ] 注册成功后调用 referralService.bindParent
- [ ] 注册即标 is_effective=true（RF-FR-005 已简化）
**估**: M

### ZY-14-05 · 上级关系建立 + 反作弊拒绑
**AC**
- [ ] 写 referral_relations(l1, l2, source_ip, source_device_id)
- [ ] 设备指纹与上级相同 → 拒绑 + 告警
- [ ] 同 IP 24h 内同上级注册 ≥ 4 → 标 suspicious
- [ ] L2 自动派生（A 的 referral_relations.l1 = B 时，X 由 A 邀请 → l2=B）
**Tech**：planning/prds/09-referral/02 § 邀请关系绑定逻辑
**估**: L

### ZY-14-06 · 佣金计算（订单 webhook → pending）
**AC**
- [ ] 订阅支付 / 一次性付款成功 webhook 触发
- [ ] amount_coins = round(order_amount_usd × 100 × 0.20)
- [ ] L1 / L2 分别 INSERT pending
- [ ] 幂等（order_id + level 唯一）
- [ ] 退款 webhook → reverseCommission
**Tech**：planning/prds/09-referral/01 RF-FR-006/007
**估**: L

### ZY-14-07 · 14 天确认 cron + 自动入账 ZC
**AC**
- [ ] daily cron：扫描 14 天前 pending → confirmed
- [ ] 调用 economy.issue(beneficiary, amount_coins, source='referral_commission')
- [ ] 写 coins_ledger_id 回 referral_commissions
- [ ] status pending → confirmed → issued
- [ ] 失败有重试 + 告警
**估**: M

### ZY-14-08 · 退款 → 佣金反向（commission_reversed）
**AC**
- [ ] reverseCommission(orderId, reason)
- [ ] pending → reversed
- [ ] confirmed/issued → 写负数 coins_ledger（可为负余额，账户标 owed=true）
- [ ] 通知用户（Email / 站内）
**估**: M

### ZY-14-09 · 仪表板 /me/referral
**AC**
- [ ] 累计 / 待确认 / 已发放（ZC）
- [ ] L1 / L2 推荐人数
- [ ] 30 天佣金曲线
- [ ] 邀请链接 + 复制 / 海报按钮（**不显示纯 code 字符串**）
- [ ] 推荐人列表（脱敏，时间脱敏到日）
- [ ] P95 < 500ms
**Tech**：planning/prds/09-referral/01 RF-FR-009
**估**: L

### ZY-14-10 · 反作弊监控与后台审计
**AC**
- [ ] 同 IP / 同设备聚集检测
- [ ] 突增告警（小时级 5×中位数）
- [ ] 后台 suspicious 关系列表 + 冻结操作
- [ ] 冻结后：佣金不再 confirm / issue
- [ ] 申诉链接（人工审核）
**Tech**：planning/prds/09-referral/01 RF-FR-011
**估**: L

### ZY-14-11 · 邀请通知 + 月度排行榜
**AC**
- [ ] 新下线注册 → 邮件 / 站内
- [ ] 下线付费 confirmed → 站内通知（XX ZC 已入账）
- [ ] 月度 Top 100 推广者排行榜（脱敏）
**估**: M

## 风险
- 反作弊误伤 → 申诉流程
- 佣金 ZC 通胀 → 与 EC 月发行上限协调（referral 不计入 EC 50,000 上限，单独上限：单户年 ≤ 200,000 ZC）

## DoD
- [ ] 邀请 → 注册 → 付费 → 14 天 confirm → 自动 ZC 入账 全链路
- [ ] 退款链路 → 反向扣减不丢
- [ ] 仪表板单位 ZC 准确
- [ ] 任何位置不显示纯 code；任何 API 不返回单独 code 字段
- [ ] 旧 withdraw / regenerate / code 端点返回 404

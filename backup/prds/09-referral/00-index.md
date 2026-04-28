# 09 · 分销系统（Referral · RF）

> **代号**：RF | **优先级**：P0 | **核心**：永久 2 级 20% + 20% 分销

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 2 级永久分销
  - L1（直推）：被推荐人付费 20% 永久回佣
  - L2（间推）：被 L1 推荐的用户付费 20% 永久回佣
- **佣金仅以知语币（ZC）计算与发放，不使用 USD 余额**
  - 计算公式：L1 / L2 佣金 = 订单金额(USD) × 100 × 20% = 订单金额 × 20 ZC
  - 例：$40 订单 → L1 得 800 ZC，L2 得 800 ZC
- 有效推荐定义：被推荐人完成注册即记为有效推荐
- 邀请码：6 位字母数字（用户唯一），系统生成且不可修改
- 邀请码仅嵌入在分享链接中（`/r/:code`），不向被邀请方显示，删除链接 code 段则该地址失效
- **不支持现金提现**：佣金赋能后仅可作为知语币用于站内消费（解锁课程 / 商城 / 会员等）
- 分销关系永久（不会因不活跃失效）
- 14 天确认期：佣金 pending → 14 天后 confirmed 且自动入账知语币余额
- 退款触发 commission_reversed：如已入账知语币 → coins_ledger 出现负数反向扣除
- 反作弊：FingerprintJS 设备指纹 + IP 段 + 行为分析

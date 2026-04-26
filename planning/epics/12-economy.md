# Epic E12 · 知语币与商城（Economy）

> 阶段：M5 · 优先级：P0 · 估算：3 周
>
> 顶层约束：[planning/00-rules.md](../00-rules.md)

## 摘要
知语币（ZC）的获得 / 消耗 / 充值 / 商城；与学习 / 游戏 / 分销联动。所有出入账走统一 service 函数 `economy.issue / spend / refund`。

## 范围
- 余额 / 流水
- 获得规则（学习 / 游戏 / 签到 / 邀请）
- 消耗（解锁课节 / 章节 / 商品）
- 商城商品
- 充值（接 E13 PaymentAdapter）

## Stories（按需 8）

### ZY-12-01 · coins_balances / coins_ledger 表
**AC**
- [ ] schema `zhiyu`：两表 + RLS（本人可读）
- [ ] 流水触发器维护 `balance_after`
- [ ] amount INT（可负，refund / reverse 用）
**估**：M

### ZY-12-02 · 获得规则引擎
**AC**
- [ ] 节完成 / 文章完成 / 游戏 / 签到 / 邀请触发 `economy.issue`
- [ ] 单日上限可配置；超限丢弃但落 audit
- [ ] 防刷：结合 E18 设备指纹
**估**：L

### ZY-12-03 · 消耗 API + 幂等
**AC**
- [ ] POST `/api/v1/coins/spend`
- [ ] 余额校验；事务锁；幂等键 `(user, idem_key)` 唯一
- [ ] 退款 = 反向 ledger
**估**：M

### ZY-12-04 · 充值流程（接入 E13 PaymentAdapter）
**AC**
- [ ] 套餐定义表 `coin_packs`
- [ ] 调 PaymentAdapter `createCheckout`
- [ ] PaymentAdapter `notifyOrderSuccess` → `economy.issue` 入账
**估**：M

### ZY-12-05 · 商城商品表 + API
**AC**
- [ ] `shop_items`（解锁包 / 主题 / 道具）
- [ ] CRUD（admin）+ 前台只读
**估**：M

### ZY-12-06 · 商城页 + 流水页
**AC**
- [ ] 商城：余额顶栏、分类、购买流程
- [ ] 流水：时间线、类型筛选、月度小结
**估**：L

### ZY-12-07 · 签到 7 天
**AC**
- [ ] 每日签到 + 连签奖励
- [ ] 漏签可补签（消耗 ZC）
**估**：M

### ZY-12-08 · 后台规则配置 + 反作弊
**AC**
- [ ] 获得规则可调；上限可调；审计日志
- [ ] 异常聚集检测（IP / 设备）
- [ ] 自动冻结 + 人工复核入口
**估**：M

## DoD
- [ ] 获得 / 消耗全场景跑通
- [ ] 流水准确无差（容器内 SQL 校验）
- [ ] 商城可购买（fake 支付 + ZC 扣减）
- [ ] **种子数据（§11.1 EC）**：`shop_items` 预置 ≥ 12 件（复习券 / 头像框 / VIP 体验 / 课程解锁券），JSON 置于 `system/packages/db/seed/economy/shop_items.json`；7 日签到与货币获取规则也以种子表位于 `seed/economy/coin_rules.json`

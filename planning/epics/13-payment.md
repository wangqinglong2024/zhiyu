# Epic E13 · 支付与订阅（Payment & Subscription）

> 阶段：M5 · 优先级：P0 · 估算：4 周

## 摘要
Paddle 主 + LemonSqueezy 备的 MoR 支付；月 / 年 / 终身订阅；知语币充值。

## 范围
- Paddle / LemonSqueezy 集成
- 套餐定义（订阅 + 充值包）
- Webhook 处理
- 订单 / 订阅模型
- 退款 / 续费 / 取消

## 非范围
- 本地支付（v1.5）
- 发票（v1.5）

## Stories

### ZY-13-01 · plans / subscriptions / payment_orders 表
**AC**
- [ ] 表 + 索引 + RLS
**Tech**：spec/05 § 4.12
**估**: M

### ZY-13-02 · Paddle 集成 + Checkout
**AC**
- [ ] Vendor 账号 + Products
- [ ] 前端 Paddle.js
- [ ] checkout.open
- [ ] 客户邮箱预填
**Tech**：spec/07 § 3.1
**估**: L

### ZY-13-03 · Paddle Webhook
**AC**
- [ ] /webhooks/paddle 路由
- [ ] 签名校验
- [ ] checkout.completed / subscription.* 处理
- [ ] 幂等
**估**: L

### ZY-13-04 · LemonSqueezy 备份集成
**AC**
- [ ] 类似 Paddle
- [ ] 用户切换入口（Paddle 不可用国家）
**估**: M

### ZY-13-05 · 套餐选择 UI
**AC**
- [ ] 月 / 年 / 终身
- [ ] 价格本地化
- [ ] 推荐徽章
- [ ] 全球付款方式
**估**: M

### ZY-13-06 · 订阅管理（个人页）
**AC**
- [ ] 当前订阅状态
- [ ] 取消 / 续费切换
- [ ] 过期提醒
- [ ] 升级 / 降级
**估**: L

### ZY-13-07 · 退款流程
**AC**
- [ ] 后台发起 → Paddle Refund
- [ ] Webhook 收到 → 调整状态
- [ ] 知语币 / 解锁回收
- [ ] 反佣回滚
**估**: M

### ZY-13-08 · 优惠券系统（v1 简单）
**AC**
- [ ] 折扣码
- [ ] 后台生成 + 限额
- [ ] 应用于 checkout
**估**: M

### ZY-13-09 · 续费提醒
**AC**
- [ ] 到期前 7d / 1d 邮件 + push
- [ ] 失败续费提醒（grace period）
**估**: S

### ZY-13-10 · 财务对账
**AC**
- [ ] 每日 Paddle 流水拉取
- [ ] 与本地订单对账
- [ ] 差异告警
- [ ] 后台报表
**估**: L

## 风险
- Paddle 国家限制 → LemonSqueezy 兜底
- Webhook 延迟 → 主动轮询补偿

## DoD
- [ ] 支付链路全跑通
- [ ] 退款 + 续费 + 取消 OK
- [ ] 对账准确

# 4.6 · 支付 · Paddle 与合规

## 一、Paddle MoR 选型理由

### 1.1 什么是 MoR (Merchant of Record)
- Paddle 作为"卖方"对终端用户出账
- Paddle 自行处理：增值税 / GST / 国际税务 / 发票 / 合规
- 知语只对 Paddle 出账（B2B），大幅降低跨境合规负担

### 1.2 Paddle vs 其他

| 特性 | Paddle | LemonSqueezy | Stripe | App Store |
|---|:---:|:---:|:---:|:---:|
| MoR | ✅ | ✅ | ❌ | ✅ |
| 全球税务 | ✅ | ✅ | 自行处理 | ✅ |
| 越/泰/印尼支付 | ✅（信用卡） | ✅（信用卡） | ✅ | App 内购 |
| 本地支付（GoPay/MoMo） | 部分 | 否 | 部分 | 否 |
| 订阅管理 | ✅ | ✅ | ✅ | ✅ |
| Webhook | ✅ | ✅ | ✅ | ✅ |
| 开发者体验 | 好 | 极好 | 优 | 一般 |
| 手续费 | 5% + $0.50 | 5% + $0.50 | 2.9% + $0.30 | 30% / 15% |

### 1.3 备援：LemonSqueezy
- 同样 MoR
- 接入复杂度更低（开发者友好）
- 作为 Paddle 故障 / 拒绝某市场时的兜底

## 二、Paddle 接入流程

### 2.1 申请与准入
1. 注册 Paddle 商户账号（公司主体推荐新加坡 Pte Ltd）
2. 提交业务说明 + 网站审核
3. 审核通过后申请 sandbox + production 双环境
4. 配置 product / price / subscription
5. 配置 webhook endpoint

### 2.2 Product 配置

| Product | Price ID | 类型 | 描述 |
|---|---|---|---|
| membership_monthly | $4 | recurring | 月会员 |
| membership_half_promo | $12 | one-time（首发） | 半年首发 |
| membership_half | $20-22 | recurring | 半年（首发后） |
| membership_yearly | $40 | recurring | 年会员 |
| course_segment_*（按轨道_阶段） | $4 | one-time | 单段课程 |
| course_full_track | $36 | one-time | 完整 9 段 |

### 2.3 Checkout Flow
1. 用户选择套餐 → 前端调 `/api/v1/checkout/session`
2. 后端创建 Paddle Checkout（含 user_id metadata）
3. 返回 checkout URL → 前端 Paddle.js Inline Checkout
4. 用户完成支付 → Paddle 跳转 `success_url`
5. 同时 Paddle 异步发 webhook（关键，是真实事件源）

### 2.4 Webhook 处理

```typescript
// /api/v1/webhook/paddle
app.post('/api/v1/webhook/paddle', rawBodyParser, async (req, res) => {
  // 1. 验签（Paddle Signature header）
  if (!verifyPaddleSignature(req)) return res.status(401).end();
  
  // 2. 解析事件
  const event = req.body;
  
  // 3. 幂等性校验（去重）
  const exists = await db.paddle_events.findById(event.event_id);
  if (exists) return res.status(200).end();
  
  // 4. 写入事件表
  await db.paddle_events.insert(event);
  
  // 5. 按事件类型处理
  switch (event.event_type) {
    case 'transaction.completed':
      await handleTransactionCompleted(event);
      break;
    case 'subscription.created':
      await handleSubscriptionCreated(event);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(event);
      break;
    case 'subscription.canceled':
      await handleSubscriptionCanceled(event);
      break;
    case 'transaction.payment_failed':
      await handlePaymentFailed(event);
      break;
    case 'adjustment.created':  // 退款 / chargeback
      await handleAdjustment(event);
      break;
  }
  
  res.status(200).end();
});
```

### 2.5 事件类型处理

#### transaction.completed
- 创建 / 更新 orders 记录 → status=paid
- 给用户发送 100 知语币（首单激励，可选）
- 触发分销奖励：上级 + 上上级各得 20% 知语币
- 发送购买成功邮件

#### subscription.created / updated
- 创建 / 更新 subscriptions 记录
- 用户 access_until = current_period_end
- 触发欢迎邮件

#### subscription.canceled
- 标记 cancel_at
- 仍允许使用至 current_period_end

#### transaction.payment_failed
- 通知用户更新支付方式
- 3 次失败后暂停订阅

#### adjustment.created (退款 / chargeback)
- 即使知语策略"不退款"，Paddle 仍可能 chargeback
- 处理：撤销知语币奖励 + 撤销分销奖励 + 暂停账号（如恶意 chargeback）

## 三、退款与 chargeback 策略

### 3.1 用户退款政策（条款）
- "虚拟商品 + 数字内容，一经购买不可退款"
- 在结账页二次确认勾选

### 3.2 但 Paddle / 信用卡 chargeback 仍存在
- 处理流程：
  1. Paddle 通知 chargeback
  2. 立即暂停账号
  3. 提交 Paddle 申诉材料（购买记录 / 学习日志 / 用户使用证据）
  4. 内部记录 → 黑名单（同邮箱 / 同设备指纹）

### 3.3 善意退款（极少数情况）
- 重大产品错误 / 服务异常 / 误付
- 通过 Paddle 后台主动发起
- 自动撤销知语币

## 四、订阅生命周期

### 4.1 状态机

```
not_subscribed → trialing(可选) → active → past_due → canceled
                                              ↓        ↓
                                            paused → canceled
```

### 4.2 关键时点

| 时点 | 动作 |
|---|---|
| 订阅创建 | 欢迎邮件 + 知语币激励 |
| 续费前 7 天 | 邮件预告 |
| 续费成功 | 感谢邮件 |
| 续费失败 | 提醒更新支付方式 |
| 用户主动取消 | 邮件挽留 + 提供 1 个月免费延期（实验） |
| 取消生效 | 邮件 + 后续召回 |

## 五、税务

### 5.1 Paddle 自动处理
- VAT / GST / 销售税
- 越南 VAT 10% / 泰国 VAT 7% / 印尼 PPN 11%（Paddle 代收）
- 美国销售税 / 欧盟 VAT MOSS / 英国 VAT 全部由 Paddle 处理

### 5.2 知语对 Paddle 的税务关系
- Paddle 按月汇款（扣手续费 + 平台保留）
- 知语按 B2B 收入计税
- 推荐主体：新加坡 Pte Ltd（17% 企业税 + GST 8% 但本地服务可豁免）

### 5.3 商业发票
- 给用户的发票由 Paddle 出具（含税）
- 知语收到 Paddle 的统一对账单（用于自身税务申报）

## 六、合规清单

### 6.1 Paddle 商户审核要点
- 网站合法 + 隐私协议齐全 + 业务说明清晰
- 不违反 Paddle 禁止业务清单（教育类正常）
- 提供企业证明 + 银行信息

### 6.2 PCI DSS
- Paddle 是 PCI Level 1 合规
- 知语前端不存储 / 不传输信用卡号（Paddle.js 隔离）
- 后端不接触卡片数据

### 6.3 PSD2 / SCA
- Paddle 处理（自动 3DS）

## 七、监控与对账

### 7.1 监控指标
- Paddle webhook 成功率（应 > 99.5%）
- 支付转化率
- 失败率（按原因细分）
- chargeback 率（应 < 0.5%）

### 7.2 对账
- 每月：Paddle 流水 vs 数据库 orders 表
- 每季度：Paddle 汇款 vs 实际到账
- 异常：人工介入 + Paddle 客服

### 7.3 自动告警
- Webhook 失败 > 1% → Slack
- chargeback 率 > 1% → 邮件 + 飞书
- 当日支付额异常（暴涨 / 暴跌）→ 通知运营

## 八、备援切换（LemonSqueezy）

### 8.1 触发条件
- Paddle 拒绝某市场（如越南信用卡支付率低）
- Paddle 手续费上涨
- Paddle 商户账号被冻结

### 8.2 切换方式
- Feature flag 控制（前端动态切换 checkout 入口）
- 双写 webhook（兼容期内同时处理两边事件）
- 用户无感知（仅 checkout 浮层不同）

### 8.3 数据兼容
- 自身 schema 不变
- `orders.paddle_transaction_id` → 改为通用 `provider_transaction_id` + `provider`
- 类似 `subscriptions.paddle_subscription_id` → `provider_subscription_id`

## 九、风险与缓解

| 风险 | 缓解 |
|---|---|
| Paddle 拒绝准入 | 提前 2-3 月申请；备 LemonSqueezy |
| 越南 / 印尼信用卡覆盖率低 | v2 接入本地支付（GoPay / MoMo / OVO） |
| Webhook 顺序问题 | event_id 幂等 + 重试 |
| chargeback 高 | 严格反欺诈 + 用户教育 + 设备指纹 |
| 退款纠纷 | 服务条款明示 + 客服 IM 妥善处理 |
| 汇率波动 | USD 计价 + 季度回顾 |

## 十、实施时间表

| 时点 | 动作 |
|---|---|
| W-6 | 公司主体注册（新加坡） |
| W-5 | Paddle 申请 + LemonSqueezy 备账号 |
| W-3 | Paddle sandbox 集成 + Webhook 测试 |
| W-2 | Paddle 审核通过（如延迟则用 LemonSqueezy） |
| W-1 | 生产环境联调 |
| W0 | 上线 |
| W+4 | 第一次完整对账演练 |

进入 [`07-anti-scrape-security.md`](./07-anti-scrape-security.md)。

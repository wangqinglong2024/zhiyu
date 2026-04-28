> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 10.1 · 支付 · 功能需求

## 用户故事
- US-PY-01：付费墙看到清晰多档选项
- US-PY-02：跳 Paddle Checkout 完成支付
- US-PY-03：管理订阅（取消 / 续订 / 升级）
- US-PY-04：申请退款（7 天内）
- US-PY-05：发票 / 收据下载

## 功能需求

### PY-FR-001：定价页
- `/pricing`
- 显示所有计划（月 / 半年 / 年 / 单段 / 9 段全包）
- 推荐高亮（半年促销默认 / 年备用）
- 价格按用户地区显示（v1 USD only，标注"约等于 ¥X"）

### PY-FR-002：付费墙弹窗
- 见 CR-FR-010
- 4 选项 + "查看完整定价"链接

### PY-FR-003：Paddle Checkout
- 用 Paddle Inline Checkout（嵌入式）
- 用户邮箱预填
- 折扣码（M+1 后接入）
- 支付方式：信用卡 / Apple Pay / Google Pay / PayPal / 当地支付（按 Paddle 支持）

### PY-FR-004：订单创建（pre-checkout）
- 前端选计划 → POST /api/orders/create → 后端创订单 pending
- 返回 paddle_checkout_url
- 用户跳转支付

### PY-FR-005：Webhook 处理
- Paddle 事件：subscription_created / subscription_updated / subscription_canceled / payment_succeeded / payment_failed / payment_refunded
- 验签（Paddle public key）
- 幂等：以 event_id 去重存 webhook_events 表
- 处理：更新 orders + 更新 subscriptions + 解锁权限 + 触发分销佣金

### PY-FR-006：解锁逻辑
- 月 / 年会员 → 写 user_subscriptions（active + expires_at）
- 单段 → 写 user_stage_purchases（permanent）
- 9 段 → 写 user_stage_purchases (purchase_type=nine_pack)

### PY-FR-007：取消订阅
- `/me/subscription` 查看 + 取消按钮
- 取消后服务期至 expires_at（不立即停服）
- 取消邮件通知

### PY-FR-008：续订
- 自动续费：到期前 24h Paddle 触发
- 续费成功 → expires_at 推 1 月 / 1 年
- 续费失败：宽限 7 天后停服

### PY-FR-009：升级 / 降级
- 月 → 年 升级：按比例补差价（Paddle proration）
- 不支持降级（可取消后重新订）

### PY-FR-010：退款
- `/me/orders/:id/refund` 申请
- 7 天内自动批准
- 7 天后转人工审核
- 退款成功 → 撤销解锁 + 反向分销佣金

### PY-FR-011：订单 / 发票
- `/me/orders` 列表
- 详情：金额 / 时间 / 计划 / 状态
- Paddle 自动生成发票，提供下载链接

### PY-FR-012：备份通道（feature flag）
- 配置项 `payment.provider = 'paddle' | 'lemonsqueezy'`
- 切换不影响现有订阅（仅新订单走新通道）
- 紧急情况手工切换

### PY-FR-013：促销
- 限时促销：半年 $12 banner
- M+0 启动，可下架
- 促销订单单独标记，便于分析

### PY-FR-014：失败重试
- 自动续费失败 → Paddle 自动重试 3 次
- 全失败 → 邮件通知 + 7 天宽限期 + 客服联系

## 性能 / 安全
- Webhook 处理 P95 < 1s
- 订单创建 P95 < 500ms
- 验签必需
- 重放保护（event_id 唯一）
- 退款异步，避免同步等待

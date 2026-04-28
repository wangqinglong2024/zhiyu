# CR-18 · 付费墙 + PaymentAdapter dummy

## PRD 原文引用

- `CR-FR-010`：“触发：访问免费试学范围外内容（默认每个主题 Stage 4 起，或任意未购阶段）。弹窗内容：标题、4 选项（单段 $4 / 9 段全包 $36 / 月会员 $4 / 年 $40）、限时促销 banner（半年 $12）、推荐高亮（默认半年）、‘继续免费试看’按钮。行为：选项点击 → PaymentAdapter dummy/fake checkout（本期不接真实支付）；单段购买支持跨级；试看仅免费试学范围内计完成。”
- `planning/rules.md` §4.3：“支付 | 同上 PaymentAdapter；未来接 Paddle / 微信支付 | 占位。”

## 需求落实

- 组件：PaywallModal、PriceOptionCard、PromoBanner、ContinueTrialButton、PurchaseSuccessToast。
- API：
  - `POST /api/payment/checkout/dummy` Body `{user_id, sku, target}` → 直接成功 → 写 `orders` + `user_stage_purchases` + 失效权限缓存。
  - `GET /api/payment/products?context=courses` 返回 4 选项 + 半年促销。
- 触发器：CR-17 返回 `paywall` 时前端弹 PaywallModal。

## 状态逻辑

- 4 选项 SKU：`stage_single`、`stage_nine_pack`、`membership_monthly`、`membership_yearly`；额外 `membership_half_year` 促销。
- “继续试看”按钮回到当前主题 Stage 1-3 免费范围 dashboard。
- Dummy checkout 立即返回成功；真实 PaymentAdapter 上线时切换。
- 订单写入 `orders` 表（PY 模块）+ `user_stage_purchases`（CR-03）。

## 不明确 / 风险

- 风险：Dummy 支付绕过权限检查导致测试数据污染生产。
- 处理：仅在 dev 环境生效；生产环境 PaymentAdapter 必须真实；`/api/payment/checkout/dummy` 用 feature flag `payment.dummy_enabled`。

## 技术假设

- 半年促销 banner 倒计时来自后台 `promo` 配置（非真实倒计时）。
- 订单货币 v1 仅 USD。

## 最终验收清单

- [ ] HSK Stage 4 触发付费墙弹窗。
- [ ] 4 选项 + 半年促销 banner 显示正确。
- [ ] Dummy checkout 完成后 `user_stage_purchases` 写入并立即可访问。
- [ ] “继续试看”跳回当前主题 Stage 1-3 免费范围。
- [ ] 跨级购买 Stage 9 后该 stage 全部章解锁。

# 应用端模块：订单与支付

> 依赖全局文件：`product/GLOBAL.md`
> 涉及表：`orders`
> 涉及 API：`/orders/create`, `/orders/{id}/status`, `/webhooks/wechat-pay`, `/webhooks/alipay`

---

## 一、创建订单流程

1. 前端调用 `POST /api/orders/create`，传入：`category`、`content`（用户输入的困境）
2. 后端本地验签 JWT → 提取 user_id
3. INSERT orders `{user_id, category, input_content, status:'pending', amount:28.8}`
4. 调用支付 API：
   - **微信 JSAPI**：返回 prepay_id（微信内置浏览器）
   - **微信 MWEB**：返回 mweb_url（非微信浏览器）
   - **支付宝 H5**：返回 form/redirect_url
5. 前端获得 `{order_id, pay_url}`，跳转支付

---

## 二、支付结果确认

- 前端轮询 `GET /orders/{order_id}/status`，每2秒一次，最多等30秒
- 状态变为 `paid` → 跳转「生成中」页面
- **支付失败**：用户取消 → 返回输入页（内容保留）
- **支付超时**：30秒未确认 → 提示「支付结果确认中」，继续轮询3分钟

---

## 三、支付回调（Webhook）

```
微信支付服务器 ──POST──▶ /api/webhooks/wechat-pay
支付宝服务器   ──POST──▶ /api/webhooks/alipay
```

**回调处理流程：**
1. 验证签名（HMAC-SHA256 微信 / RSA2 支付宝）
2. UPDATE orders SET `status='paid'`, `paid_at=now()`
3. 异步触发 AI 生成任务（BackgroundTask）
4. 返回 HTTP 200 给支付平台

**幂等性保证：**
- 支付 webhook 可能重复发送
- 处理前检查 `orders.status` 是否已为 `paid`
- 若已是 paid/generating/completed → 直接返回 200，不重复处理

---

## 四、完整数据流

```
用户                    前端                    FastAPI                 Supabase        支付平台
 │                       │                        │                       │               │
 │  填写困境，点击付款      │                        │                       │               │
 │──────────────────────▶│                        │                       │               │
 │                       │  POST /orders/create   │                       │               │
 │                       │  Header: Bearer JWT    │                       │               │
 │                       │  {category, content}   │                       │               │
 │                       │──────────────────────▶│                       │               │
 │                       │                        │  本地验签 JWT          │               │
 │                       │                        │  提取 user_id          │               │
 │                       │                        │  INSERT orders         │               │
 │                       │                        │──────────────────────▶│               │
 │                       │                        │  调用支付 API           │               │
 │                       │                        │──────────────────────────────────────▶│
 │                       │◀──────────────────────│  {order_id, pay_url}   │               │
 │  跳转支付              │                        │                       │               │
 │◀──────────────────────│                        │                       │               │
 │  完成支付              │                        │                       │               │
 │                       │                        │◀───── 支付回调 ────────────────────────│
 │                       │                        │  验签 → UPDATE paid    │               │
 │                       │                        │  触发 AI 生成          │               │
 │                       │                        │──────────────────────▶│               │
 │                       │                        │  返回 200              │               │
 │                       │                        │──────────────────────────────────────▶│
 │  前端轮询状态           │  GET /orders/{id}/status                       │               │
 │                       │──────────────────────▶│──────────────────────▶│               │
 │                       │◀──────────────────────│  {status}              │               │
 │  paid → 跳转生成中     │                        │                       │               │
```

---

## 五、退款说明

- 用户端**不开放**退款入口
- 所有退款由用户联系客服，管理员在管理后台操作
- 详见 `product/admin/orders.md`

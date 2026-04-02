# 应用端模块：佣金与钱包

> 依赖全局文件：`product/GLOBAL.md`
> 涉及表：`commissions`, `wallets`, `withdrawals`, `users`
> 涉及 API：`/commissions/balance`, `/withdrawals/apply`, `/withdrawals/my`

---

## 一、佣金自动结算

**触发时机：** 订单状态变为 `completed` 后立即触发，同一事务内。

```
FastAPI（订单完成后）
   │
   │  查询 orders.user_id = 买家
   │  查询 users.invited_by = 邀请人（可能为空）
   │
   ├──[自购返佣] INSERT commissions
   │  {beneficiary_id: 买家, order_id, type:'self_cashback',
   │   amount: 28.8 × 0.3 = 8.64, ratio: 0.3, status:'settled'}
   │
   ├──[推荐佣金] 若 invited_by 不为空：
   │  INSERT commissions
   │  {beneficiary_id: 邀请人, order_id, type:'referral',
   │   amount: 8.64, ratio: 0.3, status:'settled'}
   │
   ├──[更新买家钱包] UPDATE wallets
   │  SET balance += 8.64
   │  WHERE user_id = 买家
   │
   └──[若有邀请人] UPDATE wallets
      SET balance += 8.64, total_earned += 8.64
      WHERE user_id = 邀请人
```

**原子性保证：** 以上操作放在同一个数据库事务（Supabase RPC 或 psycopg3 transaction）。任何一步失败 → 整个事务回滚 → orders 状态仍为 `generating`，等待重试。

---

## 二、佣金触发规则

1. **自购返佣**：用户自己购买，自己获得 30% 返佣 → ¥8.64 进入可提现余额
2. **推荐佣金**：直接被邀请人购买，邀请人获得 30% → ¥8.64
3. **双重叠加**：A 邀请 B → B 购买 → A 得 ¥8.64（推荐）+ B 得 ¥8.64（自购返佣）
4. **触发时机**：支付成功后立即结算，无延迟
5. **比例**：MVP 固定 30%

---

## 三、钱包余额维护

- 佣金 settled 时：`balance += amount`
- 提现申请时：`balance -= amount`（冻结）
- 提现拒绝时：`balance += amount`（解冻返还）
- 不存在负余额场景（退款由客服人工处理，不走自动扣除）

---

## 四、提现申请流程

### 用户端操作
1. 点击「申请提现」
2. 输入：金额 + 真实姓名 + 收款方式（微信/支付宝）+ 收款账号
3. 提交后状态 → 「审核中」

### 接口行为
```
POST /withdrawals/apply
{amount, payee_name, payee_account, payee_method}

后端验证：
  ✓ amount >= 50（最低提现门槛）
  ✓ wallets.balance >= amount
  ✓ 无 pending 状态的提现（同时只允许1笔 pending）

成功：
  INSERT withdrawals {status: 'pending'}
  UPDATE wallets SET balance -= amount（冻结）
```

### 提现状态流转
```
用户申请 → pending（余额冻结）
  ├── 管理员通过 → approved → 手动打款后确认 → paid（终态）
  └── 管理员拒绝 → rejected（余额解冻返还）
```

- 提现门槛：¥50
- 到账时间：工作日3天内（手动打款）
- 管理端审核详见 `product/admin/withdrawals.md`

---

## 五、完整数据流（提现）

```
用户                    前端                    FastAPI                 Supabase
 │                       │                        │                       │
 │  填写提现信息           │                        │                       │
 │──────────────────────▶│                        │                       │
 │                       │  POST /withdrawals/apply                        │
 │                       │  {amount, payee_name,  │                       │
 │                       │   payee_account,        │                       │
 │                       │   payee_method}         │                       │
 │                       │──────────────────────▶│                       │
 │                       │                        │  验证 amount >= 50     │
 │                       │                        │  验证 balance >= amount│
 │                       │                        │  验证无 pending 提现   │
 │                       │                        │  INSERT withdrawals    │
 │                       │                        │  UPDATE wallets -= amt │
 │                       │                        │──────────────────────▶│
 │                       │◀──────────────────────│                       │
 │  「已提交，审核中」      │                        │                       │
```

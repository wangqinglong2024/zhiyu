# 9.2 · 分销 · 数据模型与 API

## 数据模型

```sql
CREATE TABLE referral_codes (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,           -- 6 位无歧义字符，系统生成不可改
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referral_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),  -- 被推荐人
  l1_user_id UUID REFERENCES users(id),                -- 直推
  l2_user_id UUID REFERENCES users(id),                -- 间推
  source_code TEXT,
  source_ip TEXT,
  source_device_id TEXT,
  is_effective BOOLEAN DEFAULT FALSE,
  effective_at TIMESTAMPTZ,
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicious_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relations_l1 ON referral_relations(l1_user_id, is_effective);
CREATE INDEX idx_relations_l2 ON referral_relations(l2_user_id, is_effective);

CREATE TABLE referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_user_id UUID NOT NULL REFERENCES users(id),  -- 收佣人
  source_user_id UUID NOT NULL REFERENCES users(id),       -- 被推荐人
  level INT NOT NULL CHECK (level IN (1,2)),
  order_id UUID NOT NULL,
  order_amount_usd DECIMAL(10,2) NOT NULL,
  rate DECIMAL(4,3) NOT NULL,           -- 0.20
  amount_coins INT NOT NULL,             -- = order_amount_usd * 100 * rate
  status TEXT DEFAULT 'pending',         -- pending/confirmed/issued/reversed
  confirmed_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,                 -- 入账 coins_ledger 时间
  coins_ledger_id UUID,                  -- 关联知语币账本入账记录
  reversed_at TIMESTAMPTZ,
  reverse_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comm_user ON referral_commissions(beneficiary_user_id, status, created_at DESC);

-- 仅保留兑换知语币（不支持现金提现）
CREATE TABLE referral_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount_usd DECIMAL(10,2) NOT NULL,
  coins_amount INT NOT NULL,             -- amount_usd * 100
  coins_ledger_id UUID,                  -- 关联 coins_ledger 入账记录
  status TEXT DEFAULT 'completed',       -- completed/failed (即时完成)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exchange_user ON referral_exchanges(user_id, created_at DESC);

-- 佣金以知语币发放，不设独立 USD 余额表；pending/confirmed 状态仅存 referral_commissions。
-- 账本复用 coins_ledger（economy 模块）。

ALTER TABLE referral_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON referral_relations FOR SELECT USING (
  user_id = auth.uid() OR l1_user_id = auth.uid() OR l2_user_id = auth.uid()
);
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON referral_commissions FOR SELECT USING (beneficiary_user_id = auth.uid());
```

## API

- `GET /api/me/referral` — 仪表板（不返回纯 code 字段，仅返回完整分享链接）
- `GET /api/me/referral/share-link` — 自己的分享链接（含 code 嵌入）
- `GET /api/me/referral/commissions?status=&page=`

> 注意：
> 1. 不提供单独返回原始邀请码字符串的 API
> 2. 不提供修改 / 重新生成邀请码的 API
> 3. 不提供提现 API；佣金 confirmed 后自动以知语币形式入账

### 内部 / 系统调用
- `referralService.bindParent(userId, code, ip, deviceId)` — 注册触发
- `referralService.markEffective(userId)` — 注册时即记为有效推荐
- `referralService.recordCommission(orderId)` — 订单成功 webhook 触发，写 pending
- `referralService.confirmCommissions()` — daily cron，扫描 14 天前 pending → confirmed + economy.issue 入账 ZC
- `referralService.reverseCommission(orderId, reason)` — 退款触发，如已 issued 则生成负数 coins_ledger

## 邀请关系绑定逻辑

```
用户 X 注册（ref=ABC123）
  ↓
查 referral_codes WHERE code='ABC123' → user A
  ↓
检查反作弊：
  - device_id(X) == device_id(A) → 拒
  - 同 IP 24h 内同上级 ≥ 4 → 标 suspicious
  ↓
查 A 的上级 B（A 的 referral_relations.l1_user_id）
  ↓
INSERT referral_relations (X, l1=A, l2=B, ...)
```

## 佣金计算逻辑

## 佣金计算逻辑

```
订单 O 成功（user X，$40）
  ↓
查 referral_relations WHERE user_id=X
  ├── L1=A → INSERT commission(beneficiary=A, level=1, amount_coins=800, status=pending)
  └── L2=B → INSERT commission(beneficiary=B, level=2, amount_coins=800, status=pending)
  ↓
14 天后 cron：status pending → confirmed → economy.issue(beneficiary, amount_coins, source='referral_commission') → status issued
```

## 退款处理
- 订单退款 → 查与该 order_id 关联的佣金记录
- pending → 标记 reversed，无动作
- confirmed/issued → 标记 reversed + 写 coins_ledger 负数扣除（可以为负余额，账户 owed=true）

## 性能
- 仪表板 P95 < 500ms
- 订单 webhook 佣金写入 P95 < 200ms

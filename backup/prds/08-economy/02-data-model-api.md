# 8.2 · 知语币 · 数据模型与 API

## 数据模型

```sql
CREATE TABLE coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_issued BIGINT NOT NULL DEFAULT 0,    -- 累计发放
  total_spent BIGINT NOT NULL DEFAULT 0,
  yearly_issued INT NOT NULL DEFAULT 0,      -- 当年发放（年初重置）
  yearly_reset_at DATE,
  is_frozen BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coin_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  delta INT NOT NULL,                        -- + 发放, - 消耗
  balance_after INT NOT NULL,
  type TEXT NOT NULL,                        -- 'register','checkin','lesson_quiz','game_clear','manual_grant','sink_freeze','sink_skin'...
  reference_type TEXT,
  reference_id UUID,
  meta JSONB,                                -- 详细信息
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_user_date ON coin_ledger(user_id, created_at DESC);
CREATE INDEX idx_ledger_type ON coin_ledger(type, created_at DESC);

CREATE TABLE coin_checkin_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  checkin_date DATE NOT NULL,
  amount INT NOT NULL,
  consecutive_days INT NOT NULL,
  bonus_amount INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

CREATE TABLE store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_zh TEXT NOT NULL,
  name_translations JSONB NOT NULL,
  description JSONB,
  category TEXT NOT NULL,                    -- 'consumable','decoration','limited'
  price_coins INT NOT NULL,
  max_per_user INT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  quantity INT DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT FALSE
);

ALTER TABLE coin_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON coin_wallets USING (user_id = auth.uid());
ALTER TABLE coin_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON coin_ledger FOR SELECT USING (user_id = auth.uid());
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON user_inventory USING (user_id = auth.uid());
```

## API

- `GET /api/coins/balance`
- `GET /api/coins/ledger?type=&page=`
- `POST /api/coins/checkin` — 当日签到（幂等）
- `GET /api/store/items?category=`
- `POST /api/store/items/:code/purchase` — Body `{quantity}` 幂等 key
- `GET /api/me/inventory`
- `POST /api/me/inventory/:id/equip`
- `POST /api/me/freeze/use` — streak 冻结消耗

## 内部 / 后端调用
- `coinService.grant({user_id, amount, type, reference, idempotency_key})` — 写 ledger + 更新 wallet（事务）
- `coinService.spend({user_id, amount, type, reference, idempotency_key})` — 余额检查 + 扣减
- 所有调用必须带 idempotency_key（重复发放保护）

## 业务规则
- 年发行上限：grant 时检查 yearly_issued + amount > 50000 → 拒绝并告警
- 余额冻结：is_frozen=true 时 grant / spend 全拒
- 异常检测（运营 cron）：日 issuance > 500 标可疑

## 性能
- balance / ledger 查 P95 < 200ms
- grant / spend P95 < 300ms（事务）

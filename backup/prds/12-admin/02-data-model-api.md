# 12.2 · 管理后台 · 数据模型与 API

## 数据模型

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','editor','reviewer','cs','viewer')),
  languages TEXT[],                    -- 客服懂的语种
  is_online BOOLEAN DEFAULT FALSE,
  totp_secret TEXT,                    -- 2FA secret (encrypted)
  ip_whitelist TEXT[],
  status TEXT DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  before JSONB,
  after JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON admin_audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON admin_audit_logs(resource_type, resource_id, created_at DESC);

CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  rollout JSONB,                       -- {strategy, percent, allow_list, country, persona}
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_translations JSONB,
  body_translations JSONB,
  channel TEXT NOT NULL,               -- 'banner','email','push'
  audience JSONB,                      -- {countries, personas, status}
  status TEXT DEFAULT 'draft',         -- draft/scheduled/sent
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_review_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,         -- 'article','lesson','knowledge_point','question','novel_chapter'
  resource_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'to_review',  -- to_review/in_review/approved/rejected/requested_changes
  assigned_to UUID,
  language TEXT,
  reviewer_notes TEXT,
  edits JSONB,                         -- 改动详情
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_assigned ON content_review_workflow(assigned_to, status);
CREATE INDEX idx_review_pending ON content_review_workflow(language, status, created_at) WHERE status='to_review';
```

## API（管理后台专属，路径前缀 /admin/api）

### 用户
- `GET /admin/api/users?q=&role=&page=`
- `GET /admin/api/users/:id`
- `POST /admin/api/users/:id/freeze`
- `POST /admin/api/users/:id/coins/grant` — `{amount, reason}`
- `POST /admin/api/users/:id/impersonate` — 模拟登录（审计）

### 订单
- `GET /admin/api/orders?status=&page=`
- `POST /admin/api/orders/:id/refund` — 人工退款

### 内容
- `POST /admin/api/content/articles` / `PATCH /:id` / `DELETE /:id`
- `POST /admin/api/content/articles/:id/publish`
- 类似课程 / 游戏 / 小说 CRUD

### 工厂
- `POST /admin/api/factory/workflows` — 触发
- `GET /admin/api/factory/workflows/:id`
- `POST /admin/api/factory/workflows/:id/retry`

### 审校
- `GET /admin/api/review/queue?language=`
- `POST /admin/api/review/:id/approve`
- `POST /admin/api/review/:id/reject` — `{reason}`
- `POST /admin/api/review/:id/edits` — 提交编辑

### Feature Flags
- `GET /admin/api/flags`
- `PATCH /admin/api/flags/:key`

### 审计
- `GET /admin/api/audit?actor=&resource=&page=`

## 鉴权
- JWT + role claim
- 中间件按 role 拦截
- 写操作必经 audit_logs

## 性能
- 列表 P95 < 500ms
- 详情 P95 < 800ms
- 操作 P95 < 1s

# 6.2 · 用户账号 · 数据模型与 API

## 数据模型

```sql
-- Supabase auth.users 已存在；本模块定义 profiles
CREATE TABLE users (
  id UUID PRIMARY KEY,                 -- = auth.users.id
  email TEXT UNIQUE NOT NULL,
  email_verified_at TIMESTAMPTZ,
  display_name TEXT,
  avatar_url TEXT,
  native_lang TEXT NOT NULL CHECK (native_lang IN ('en','vi','th','id')),
  ui_lang TEXT NOT NULL DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  hsk_level_self INT,
  hsk_level_estimated INT,
  persona_tags TEXT[],                 -- ['hsk_student','factory','ecommerce','interest']
  status TEXT DEFAULT 'active',        -- active/suspended/deleted_pending/deleted
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pinyin_mode TEXT DEFAULT 'tones',     -- 'letters'|'tones'|'hidden'
  translation_mode TEXT DEFAULT 'inline', -- 'inline'|'collapse'|'hidden'
  font_size TEXT DEFAULT 'M',
  tts_speed DECIMAL(3,2) DEFAULT 1.0,
  tts_voice TEXT DEFAULT 'female_zh',
  email_marketing BOOLEAN DEFAULT TRUE,
  email_learning_reminder BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,             -- FingerprintJS visitor id
  device_name TEXT,
  user_agent TEXT,
  last_ip TEXT,
  last_country TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES user_devices(id),
  refresh_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id) WHERE revoked_at IS NULL;

CREATE TABLE user_email_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','reset_password','change_email')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  file_url TEXT,
  expires_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON users FOR SELECT USING (id = auth.uid());
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON user_preferences USING (user_id = auth.uid());
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON user_devices USING (user_id = auth.uid());
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_self ON user_sessions USING (user_id = auth.uid());
```

## API

### 认证
- `POST /api/auth/register` — `{email, password, native_lang, turnstile_token}`
- `POST /api/auth/login` — `{email, password, device_id}`
- `POST /api/auth/oauth/google` — `{id_token, device_id}`
- `POST /api/auth/refresh` — `{refresh_token}`
- `POST /api/auth/logout` — 当前 session
- `POST /api/auth/logout-all`
- `POST /api/auth/email/send-otp` — `{purpose}`
- `POST /api/auth/email/verify-otp` — `{code}`
- `POST /api/auth/password/reset-request` — `{email}`
- `POST /api/auth/password/reset` — `{token, new_password}`
- `POST /api/auth/password/change` — `{old, new}`

### 个人资料
- `GET /api/me` — 自己资料
- `PATCH /api/me` — 修改 profile
- `PATCH /api/me/preferences`
- `GET /api/me/sessions` — 设备列表
- `DELETE /api/me/sessions/:id` — 强制下线
- `POST /api/me/avatar` — 上传头像

### 数据导出 / 销户
- `POST /api/me/data-exports` — 申请
- `GET /api/me/data-exports/:id` — 查状态
- `POST /api/me/delete-account` — `{password}` 软删（90 天恢复期）
- `POST /api/me/restore-account` — 客服触发

## 限流
- register / login：10/min/IP
- send-otp：1/60s/email，5/h/email
- 数据导出：1/月/user

## 安全
- 密码 bcrypt rounds=12
- JWT HS256（access 15min / refresh 7 天 / max 30 天）
- 邮件链接：HMAC token + ts + nonce
- 设备指纹：FingerprintJS

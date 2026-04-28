-- 0002 · profiles + user_sessions + auth_login_attempts + audit_logs
-- 注：依赖 Supabase Auth 创建的 auth.users（GoTrue）。

-- ---------- profiles ----------
create table if not exists zhiyu.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  role          text not null default 'user' check (role in ('super_admin','user')),
  display_name  text,
  avatar_url    text,
  locale        text not null default 'zh' check (locale in ('zh','en','vi','th','id')),
  is_active     boolean not null default true,
  email_verified_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists profiles_role_idx on zhiyu.profiles (role);

-- ---------- user_sessions ----------
create table if not exists zhiyu.user_sessions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  device_id     text not null,
  device_name   text,
  user_agent    text,
  ip            text,
  refresh_jti   text,
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (user_id, device_id)
);
create index if not exists user_sessions_user_idx on zhiyu.user_sessions (user_id, last_seen_at desc);

-- ---------- auth_login_attempts ----------
create table if not exists zhiyu.auth_login_attempts (
  id          bigserial primary key,
  email       text not null,
  ip          text,
  user_agent  text,
  success     boolean not null,
  reason      text,
  created_at  timestamptz not null default now()
);
create index if not exists auth_login_attempts_email_time_idx on zhiyu.auth_login_attempts (email, created_at desc);

-- ---------- audit_logs ----------
create table if not exists zhiyu.audit_logs (
  id          bigserial primary key,
  actor_id    uuid,
  actor_role  text,
  event       text not null,
  target_type text,
  target_id   text,
  meta        jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_event_time_idx on zhiyu.audit_logs (event, created_at desc);

-- ---------- RLS ----------
alter table zhiyu.profiles        enable row level security;
alter table zhiyu.user_sessions   enable row level security;

-- profiles: 自己可读自己；service_role 全权
drop policy if exists profiles_self_read on zhiyu.profiles;
create policy profiles_self_read on zhiyu.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_self_update on zhiyu.profiles;
create policy profiles_self_update on zhiyu.profiles
  for update using (id = auth.uid());

drop policy if exists user_sessions_self_read on zhiyu.user_sessions;
create policy user_sessions_self_read on zhiyu.user_sessions
  for select using (user_id = auth.uid());

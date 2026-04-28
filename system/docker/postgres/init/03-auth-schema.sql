-- 03-auth-schema.sql · 预创建 GoTrue 需要的 auth schema 与权限
-- pgvector 镜像不预置 auth schema，而 GoTrue 用 search_path=auth 跑迁移，会报 3F000。
create schema if not exists auth authorization postgres;

-- 让 service_role / supabase 业务角色都能访问 auth
grant usage on schema auth to anon, authenticated, service_role;
alter default privileges in schema auth grant all on tables    to service_role;
alter default privileges in schema auth grant all on sequences to service_role;
alter default privileges in schema auth grant all on functions to service_role;

-- 02-roles.sql · Supabase 标准角色（anon / authenticated / service_role）+ auth schema 占位
-- 由 docker postgres 容器在首次启动时执行（在 00-extensions.sql 之后）。
-- GoTrue 与 PostgREST 共享这些角色，且 RLS 通过 auth.uid() / auth.role() 判断身份。

-- 角色（无密码登录，仅供 PostgREST/GoTrue 通过 JWT 切换）
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

-- 后续 zhiyu 业务 schema 的权限将在 0002 迁移末尾追加。
-- auth schema 由 GoTrue 启动时自行创建并迁移，这里不预先创建。

-- 让 anon / authenticated 在 PostgREST 通过 JWT 切换时能看到 auth.uid() helper
-- (Supabase 通过自带 SQL 提供 auth.uid())；自托管时由 GoTrue 创建 auth.uid()。

-- 给 PostgREST 调用做准备：postgres 用户（被 PostgREST 用作 authenticator）需能切到这些角色
grant anon, authenticated, service_role to postgres;

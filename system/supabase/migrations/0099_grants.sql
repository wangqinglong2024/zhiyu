-- 0099_grants.sql · 业务表对 anon / authenticated / service_role 的权限
-- 由 db-migrate 容器在所有迁移末尾执行。
grant usage on schema zhiyu to anon, authenticated, service_role;

grant select on zhiyu.discover_topics to anon, authenticated;
grant select, insert, update on zhiyu.profiles to authenticated;
grant select on zhiyu.profiles to anon;
grant select on zhiyu.user_sessions to authenticated;

grant all on all tables    in schema zhiyu to service_role;
grant all on all sequences in schema zhiyu to service_role;
grant all on all functions in schema zhiyu to service_role;

alter default privileges in schema zhiyu grant select on tables to anon, authenticated;
alter default privileges in schema zhiyu grant all    on tables to service_role;

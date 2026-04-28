# postgres/

> 本目录已废弃。

知语已不再启动自建 Postgres，统一复用主机已部署的开源 Supabase 自托管栈
（容器 `supabase-db`，镜像 `supabase/postgres:15.x`，自带：
- `auth` / `storage` / `realtime` schemas 与触发器
- `anon` / `authenticated` / `service_role` 角色
- `uuid-ossp` / `pgcrypto` / `pg_trgm` / `pgvector` 扩展可用

业务迁移由 `system/supabase/migrations/*.sql` 通过 `db-migrate` 容器执行，
全部落在 `zhiyu` schema 内，与其他项目隔离。

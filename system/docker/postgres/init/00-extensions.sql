-- 由 docker postgres 容器在首次启动时按字母序执行（/docker-entrypoint-initdb.d/）
-- 这里只创建扩展；业务表迁移由 Supabase CLI / 后面的 scripts/db/migrate.sh 执行。
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
-- vector: M0 未启用，需要时切换 db 镜像为 pgvector/pgvector:pg16 后再开启
-- create extension if not exists vector;
create extension if not exists pg_trgm;

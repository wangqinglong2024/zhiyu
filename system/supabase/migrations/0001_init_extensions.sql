-- 0001 · 初始化扩展 + 自定义 schema (zhiyu)
-- 该迁移会在 Postgres 启动时由 docker/postgres/init/ 触发；以及通过 Supabase CLI 复制为 migration。
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
-- vector extension: 暂未启用（M0 不做向量检索）。如需启用请改用 pgvector/pgvector:pg16 镜像。
-- create extension if not exists vector;
create extension if not exists pg_trgm;

create schema if not exists zhiyu;

comment on schema zhiyu is '业务主 schema（与 G1 §三对齐）';

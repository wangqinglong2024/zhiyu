-- 0001 · 初始化扩展 + 自定义 schema (zhiyu)
-- 复用主机已部署的开源 Supabase 自托管栈（supabase/postgres:15.x）。
-- 这些扩展在 supabase/postgres 镜像里已经预装但未必已 create；用 if not exists 安全幂等。
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- 注意：pgvector 仅在「确实需要 AI 向量检索」的迁移文件里按需启用，
--       不在基线扩展中开启。supabase/postgres 镜像已内置 pgvector，
--       届时只需 `create extension if not exists vector;` 即可。

create schema if not exists zhiyu;
comment on schema zhiyu is '业务主 schema（与 G1 §三对齐）';

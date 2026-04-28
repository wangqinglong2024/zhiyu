# 表：`china_articles`（文章）

> **对应需求中的对象**：F1-用户 §一 · 对象「文章」（文章主体部分；句子拆到 `china_sentences`）
> **性质**：管理端 CRUD 的内容表，启用软删 + 状态机（`draft / published`）。

---

## 一、字段定义

| 字段名 | 类型 | 必填 | 默认值 | 索引 | 对应需求中的信息 | 校验规则 |
|--------|------|------|--------|------|----------------|---------|
| `id` | `uuid` | ✅ | `gen_random_uuid()` | PK | — | — |
| `code` | `text` | ✅ | 由 RPC `fn_gen_article_code()` 生成 | `uq_china_articles_code` (UNIQUE WHERE deleted_at IS NULL) | 文章编码 | 正则 `^[A-Z0-9]{12}$`，12 位，系统自动生成，前端不展示 |
| `category_id` | `uuid` | ✅ | — | `idx_china_articles_category_id` | 文章类目 | 外键 → `china_categories.id`，`ON DELETE RESTRICT` |
| `title_pinyin` | `text` | ✅ | — | — | 文章名称拼音 | 长度 1–200 |
| `title_i18n` | `jsonb` | ✅ | — | — | 文章名称（多语言） | 必含 `zh,en,vi,th,id` 全部 5 个 key；每个值长度 1–40 |
| `status` | `text` | ✅ | `'draft'` | `idx_china_articles_status` | 文章状态 | CHECK in (`'draft'`,`'published'`) |
| `published_at` | `timestamptz` | ❌ | `null` | `idx_china_articles_published_at` | — | `status='published'` 时必须非空；下架时清空 |
| `created_by` | `uuid` | ✅ | — | `idx_china_articles_created_by` | — | 外键 → `auth.users.id`，`ON DELETE SET NULL`（弱引用） |
| `updated_by` | `uuid` | ❌ | — | — | — | 同上 |
| `created_at` | `timestamptz` | ✅ | `now()` | — | — | — |
| `updated_at` | `timestamptz` | ✅ | `now()` | — | — | 触发器维护 |
| `deleted_at` | `timestamptz` | ❌ | `null` | `idx_china_articles_deleted_at` | — | 软删标记 |

---

## 二、AI 补充字段（需求中未提及，技术必要）

| 字段名 | 类型 | 补充理由 |
|--------|------|---------|
| `published_at` | `timestamptz` | 列表按发布时间倒序、缓存失效都需要；状态机切换时填充 |
| `created_by` / `updated_by` | `uuid` | 管理端审计与权限（G3 - admin 操作可追溯） |
| `deleted_at` | `timestamptz` | 文章属"用户可生成数据"，按 G1-数据库规范 §三 启用软删 |
| `code` 由 RPC 生成 | — | 12 位唯一编码并发安全，集中在 `fn_gen_article_code()`（见 [08-编号生成规则.md](./08-编号生成规则.md)） |

---

## 三、DDL 草案

```sql
create table zhiyu.china_articles (
  id           uuid primary key default gen_random_uuid(),
  code         text not null,
  category_id  uuid not null,
  title_pinyin text not null,
  title_i18n   jsonb not null,
  status       text not null default 'draft',
  published_at timestamptz,
  created_by   uuid,
  updated_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,

  constraint fk_china_articles_category_id
    foreign key (category_id) references zhiyu.china_categories(id) on delete restrict,
  constraint fk_china_articles_created_by
    foreign key (created_by) references auth.users(id) on delete set null,
  constraint fk_china_articles_updated_by
    foreign key (updated_by) references auth.users(id) on delete set null,

  constraint ck_china_articles_code_format
    check (code ~ '^[A-Z0-9]{12}$'),
  constraint ck_china_articles_status
    check (status in ('draft','published')),
  constraint ck_china_articles_title_pinyin_len
    check (char_length(title_pinyin) between 1 and 200),
  constraint ck_china_articles_title_i18n_keys
    check (title_i18n ?& array['zh','en','vi','th','id']),
  constraint ck_china_articles_published_at_consistency
    check (
      (status = 'published' and published_at is not null) or
      (status = 'draft'     and published_at is null)
    )
);

create unique index uq_china_articles_code
  on zhiyu.china_articles (code) where deleted_at is null;
create index idx_china_articles_category_id  on zhiyu.china_articles (category_id) where deleted_at is null;
create index idx_china_articles_status       on zhiyu.china_articles (status)      where deleted_at is null;
create index idx_china_articles_published_at on zhiyu.china_articles (published_at desc) where status = 'published' and deleted_at is null;
create index idx_china_articles_created_by   on zhiyu.china_articles (created_by);
create index idx_china_articles_deleted_at   on zhiyu.china_articles (deleted_at);

create trigger tg_china_articles_before_update_set_updated_at
  before update on zhiyu.china_articles
  for each row execute function zhiyu.set_updated_at();
```

---

## 四、RLS 策略

| 操作 | 角色 | 策略 |
|------|------|------|
| `select` | `anon`、`authenticated` | 仅放行 `status='published' and deleted_at is null` |
| `select` | `service_role` | 全量 |
| `insert / update / delete` | `service_role` | 全量；管理端通过 service-role 调用 |

策略命名：`china_articles_select_published`、`china_articles_write_service`。

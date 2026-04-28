# 表：`china_categories`（类目）

> **对应需求中的对象**：F1-用户 §一 · 对象「类目」
> **性质**：系统内置数据字典，12 条固定记录，由迁移种子写入；不允许在前端 CRUD。
> **不启用软删**（字典表）；通过外键 `ON DELETE RESTRICT` 阻止误删有引用的类目。

---

## 一、字段定义

| 字段名 | 类型 | 必填 | 默认值 | 索引 | 对应需求中的信息 | 校验规则 |
|--------|------|------|--------|------|----------------|---------|
| `id` | `uuid` | ✅ | `gen_random_uuid()` | PK | — | — |
| `code` | `text` | ✅ | — | `uq_china_categories_code` (UNIQUE) | 类目编码 | 正则 `^(0[1-9]\|1[0-2])$`，固定 2 位，01–12 |
| `name_i18n` | `jsonb` | ✅ | — | — | 类目名称（5 语言） | 必含 `zh,en,vi,th,id` 全部 5 个 key，每个值非空 ≤ 40 字 |
| `description_i18n` | `jsonb` | ✅ | — | — | 类目说明（5 语言） | 必含 `zh,en,vi,th,id`，每个值非空 ≤ 200 字 |
| `sort_order` | `int` | ✅ | 取自 `code` | `idx_china_categories_sort_order` | 列表展示顺序 | = `code::int` |
| `created_at` | `timestamptz` | ✅ | `now()` | — | — | — |
| `updated_at` | `timestamptz` | ✅ | `now()` | — | — | 触发器 `tg_china_categories_before_update_set_updated_at` 维护 |

---

## 二、AI 补充字段（需求中未提及，技术必要）

| 字段名 | 类型 | 补充理由 |
|--------|------|---------|
| `id (uuid)` | `uuid` | 全表统一以 uuid 为主键（G1-数据库规范 §一），`code` 仍作为业务唯一键 |
| `sort_order` | `int` | 列表展示需稳定排序；虽然可以从 `code` 派生，但显式列便于以后调整顺序而不改 code |

---

## 三、DDL 草案

```sql
create table zhiyu.china_categories (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  name_i18n   jsonb not null,
  description_i18n jsonb not null,
  sort_order  int  not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint uq_china_categories_code unique (code),
  constraint ck_china_categories_code_format
    check (code ~ '^(0[1-9]|1[0-2])$'),
  constraint ck_china_categories_name_i18n_keys
    check (name_i18n ?& array['zh','en','vi','th','id']),
  constraint ck_china_categories_desc_i18n_keys
    check (description_i18n ?& array['zh','en','vi','th','id'])
);

create index idx_china_categories_sort_order
  on zhiyu.china_categories (sort_order);

create trigger tg_china_categories_before_update_set_updated_at
  before update on zhiyu.china_categories
  for each row execute function zhiyu.set_updated_at();
```

---

## 四、RLS 策略

| 操作 | 角色 | 策略 |
|------|------|------|
| `select` | `anon`、`authenticated` | 全部放行（公开字典） |
| `insert / update / delete` | `service_role` | 仅 service-role 可写；前端禁止 |

策略命名：`china_categories_select_public`、`china_categories_write_service`。

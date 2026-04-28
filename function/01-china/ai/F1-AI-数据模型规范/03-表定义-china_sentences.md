# 表：`china_sentences`（句子）

> **对应需求中的对象**：F1-用户 §一 · 对象「文章」中"句子"部分
> **性质**：每篇文章 1..N 条句子；中文音频由 AI 接口异步生成。

---

## 一、字段定义

| 字段名 | 类型 | 必填 | 默认值 | 索引 | 对应需求中的信息 | 校验规则 |
|--------|------|------|--------|------|----------------|---------|
| `id` | `uuid` | ✅ | `gen_random_uuid()` | PK | — | — |
| `article_id` | `uuid` | ✅ | — | `idx_china_sentences_article_id` | （隶属文章） | FK → `china_articles.id`，`ON DELETE CASCADE` |
| `seq_no` | `int` | ✅ | 由 RPC 生成 | `uq_china_sentences_article_seq` (UNIQUE 复合) | 句子编码 | 1–9999；前端展示 4 位补零（`0001`）；**删除中间句子时由 RPC 自动重排，编号保持连续** |
| `pinyin` | `text` | ✅ | — | — | 句子拼音（PM 答 Q12 要求新增） | 长度 1–600；用户输入，前端展示在卡片最上方 |
| `content_zh` | `text` | ✅ | — | — | 句子中文内容 | 长度 1–400 |
| `content_en` | `text` | ✅ | — | — | 句子英文内容 | 长度 1–400 |
| `content_vi` | `text` | ✅ | — | — | 句子越语内容 | 长度 1–400 |
| `content_th` | `text` | ✅ | — | — | 句子泰语内容 | 长度 1–400 |
| `content_id` | `text` | ✅ | — | — | 句子印尼语内容 | 长度 1–400 |
| `audio_url_zh` | `text` | ❌ | `null` | — | 句子中文读音 | URL 形式；首位用户点击播放时由 TTS 生成并永久缓存，键为 `<article_code>/<seq_no_padded>.mp3` |
| `audio_status` | `text` | ✅ | `'pending'` | `idx_china_sentences_audio_status` | — | CHECK in (`'pending'`,`'processing'`,`'ready'`,`'failed'`) |
| `audio_provider` | `text` | ❌ | — | — | — | 记录 TTS 厂商（`azure` / `aliyun` / `mock` 等） |
| `audio_voice` | `text` | ❌ | — | — | — | TTS 音色 ID |
| `audio_duration_ms` | `int` | ❌ | — | — | — | 音频时长（毫秒），用于前端进度条 |
| `audio_generated_at` | `timestamptz` | ❌ | — | — | — | TTS 完成时间 |
| `audio_error` | `text` | ❌ | — | — | — | TTS 失败原因（最近一次，前端直接展示给用户） |
| `created_at` | `timestamptz` | ✅ | `now()` | — | — | — |
| `updated_at` | `timestamptz` | ✅ | `now()` | — | — | 触发器维护 |
| `deleted_at` | `timestamptz` | ❌ | `null` | `idx_china_sentences_deleted_at` | — | 软删，文章硬删时通过 CASCADE 一并清理 |

> 字段命名说明：`content_id` 中的 `id` 为印尼语 BCP-47 语言代码（与 i18n 5 语言一致），不是主键。

---

## 二、AI 补充字段（需求中未提及，技术必要）

| 字段名 | 类型 | 补充理由 |
|--------|------|---------|
| `audio_status`、`audio_provider`、`audio_voice`、`audio_duration_ms`、`audio_generated_at`、`audio_error` | 多列 | TTS 是用户触发的同步外部调用：首次点击会从 `pending → processing → ready/failed`；`failed` 时下次用户点击直接重试，不限次数（PM 答 Q10） |
| `seq_no` 用 `int` 而非 `text` | `int` | 排序高效；前端展示时再 `padStart(4,'0')`；删除后由 RPC 重排（PM 答 Q8） |
| 复合唯一索引 `(article_id, seq_no)` | — | 同一文章内句子号唯一；不同文章可重号 |

---

## 三、DDL 草案

```sql
create table zhiyu.china_sentences (
  id                 uuid primary key default gen_random_uuid(),
  article_id         uuid not null,
  seq_no             int  not null,
  pinyin             text not null,
  content_zh         text not null,
  content_en         text not null,
  content_vi         text not null,
  content_th         text not null,
  content_id         text not null,
  audio_url_zh       text,
  audio_status       text not null default 'pending',
  audio_provider     text,
  audio_voice        text,
  audio_duration_ms  int,
  audio_generated_at timestamptz,
  audio_error        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  constraint fk_china_sentences_article_id
    foreign key (article_id) references zhiyu.china_articles(id) on delete cascade,

  constraint ck_china_sentences_seq_no_range  check (seq_no between 1 and 9999),
  constraint ck_china_sentences_audio_status
    check (audio_status in ('pending','processing','ready','failed')),
  constraint ck_china_sentences_pinyin_len     check (char_length(pinyin) between 1 and 600),
  constraint ck_china_sentences_content_zh_len check (char_length(content_zh) between 1 and 400),
  constraint ck_china_sentences_content_en_len check (char_length(content_en) between 1 and 400),
  constraint ck_china_sentences_content_vi_len check (char_length(content_vi) between 1 and 400),
  constraint ck_china_sentences_content_th_len check (char_length(content_th) between 1 and 400),
  constraint ck_china_sentences_content_id_len check (char_length(content_id) between 1 and 400),
  constraint ck_china_sentences_audio_url_when_ready
    check (audio_status <> 'ready' or audio_url_zh is not null)
);

create unique index uq_china_sentences_article_seq
  on zhiyu.china_sentences (article_id, seq_no) where deleted_at is null;

create index idx_china_sentences_article_id    on zhiyu.china_sentences (article_id) where deleted_at is null;
create index idx_china_sentences_audio_status  on zhiyu.china_sentences (audio_status) where audio_status in ('pending','processing','failed');
create index idx_china_sentences_deleted_at    on zhiyu.china_sentences (deleted_at);

create trigger tg_china_sentences_before_update_set_updated_at
  before update on zhiyu.china_sentences
  for each row execute function zhiyu.set_updated_at();
```

---

## 四、RLS 策略

| 操作 | 角色 | 策略 |
|------|------|------|
| `select` | `anon`、`authenticated` | 仅放行所属文章 `status='published' and deleted_at is null` 的句子（通过 `exists` 子查询） |
| `select` | `service_role` | 全量 |
| `insert / update / delete` | `service_role` | 全量 |

策略命名：`china_sentences_select_published`、`china_sentences_write_service`。

```sql
create policy china_sentences_select_published on zhiyu.china_sentences
  for select to anon, authenticated
  using (
    deleted_at is null and exists (
      select 1 from zhiyu.china_articles a
      where a.id = china_sentences.article_id
        and a.status = 'published'
        and a.deleted_at is null
    )
  );
```

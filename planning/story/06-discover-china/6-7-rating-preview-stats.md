# ZY-06-07 · 文章评分 / 未登录预览限制 / 阅读统计 / 相关推荐

> Epic：E06 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)
> 承接 PRD：DC-FR-008（评分）/ DC-FR-010（未登录预览限制）/ DC-FR-012（相关推荐）/ DC-FR-015（阅读统计）

## User Story
**As a** 发现中国阅读用户
**I want** 给文章打分、未登录可预览少量文章但被引导注册、文末看到相关推荐、个人页能看到自己的阅读统计
**So that** 内容质量有反馈、转化漏斗清晰、内容消费可衡量。

## 上下文
- 4 条 PRD P0 FR 在 ZY-06-01..06 中没有承接，集中在本 story 实现，避免拆得过碎。
- 评分：每用户对每文章只能打 1 次（unique）。
- 未登录预览：基于浏览器指纹 + IP 限 3 篇/30 天；超限弹注册引导。
- 相关推荐：同类目 + ±1 HSK 等级 + 评分 desc，简版，不做复杂向量。
- 阅读统计：复用 ZY-06-05 的 `reading_progress` + `articles.word_count` 聚合。

## 数据模型（drizzle，schema `zhiyu`）
```sql
-- 评分表
CREATE TABLE zhiyu.article_ratings (
  article_id  uuid NOT NULL REFERENCES zhiyu.articles(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score       smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, user_id)
);
CREATE INDEX article_ratings_article_idx ON zhiyu.article_ratings(article_id);
ALTER TABLE zhiyu.article_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY rating_self ON zhiyu.article_ratings
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 未登录预览访问日志（用于配额控制）
CREATE TABLE zhiyu.preview_access_log (
  id           bigserial PRIMARY KEY,
  fingerprint  text NOT NULL,                 -- 浏览器指纹（fingerprint.js fork）
  ip_hash      text NOT NULL,                 -- ip 取 sha256，避免明文
  article_slug text NOT NULL,
  accessed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX preview_fp_idx ON zhiyu.preview_access_log(fingerprint, accessed_at DESC);
CREATE INDEX preview_ip_idx ON zhiyu.preview_access_log(ip_hash, accessed_at DESC);

-- 物化字段：articles.rating_avg / rating_count（trigger 维护）
ALTER TABLE zhiyu.articles
  ADD COLUMN IF NOT EXISTS rating_avg   numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count int          DEFAULT 0;
```

## API 契约
| Method | Path | 描述 |
|---|---|---|
| POST | `/api/v1/articles/:id/rating` | body `{score:1-5}`；upsert；幂等；返回新 avg/count |
| GET  | `/api/v1/articles/:id/related?limit=4` | 同类目 ±1 HSK，按 rating_avg desc |
| GET  | `/api/v1/_gates/preview` | 检查未登录预览配额，返回 `{remaining:int, allowed:bool}` |
| GET  | `/api/v1/me/reading-stats` | 返回 `{articles_read, words_read, favorites, current_streak}` |

## Acceptance Criteria
- [ ] 评分组件：5 星，点亮即提交，再次点亮即修改；提交后展示当前用户星数 + 平均星与人数
- [ ] articles.rating_avg / rating_count 由 trigger 实时维护（INSERT/UPDATE/DELETE）
- [ ] 未登录访问 article 详情页：前端先 `GET /_gates/preview` → 若 allowed=false 弹"注册解锁"软墙（仍可看摘要 + 前 1 段）
- [ ] preview_access_log 写入由后端在文章详情 API 中完成（避免前端绕过）；30 天滚动窗口内同 fingerprint+ip_hash 仅累计 ≤ 3 篇
- [ ] 文章末尾"相关推荐"模块：4 卡片，点击进入对应文章；空集时显示同类目热门
- [ ] 个人页 `/me/stats` 显示阅读统计 4 项（读过文章数、累计字数、收藏数、连续阅读天数）；按 4 语本地化数字格式
- [ ] 4 语文案（en/vi/th/id）由 i18next namespace `discover` 提供
- [ ] 无任何禁用 SaaS 直接调用（指纹库走 OSS fork，IP 经 hash）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run discover.rating discover.preview discover.related discover.stats
```
- MCP Puppeteer：
  1. 匿名访问 4 篇文章 → 第 4 篇出现"注册解锁"软墙
  2. 注册登录 → 软墙消失；给 3 篇评分 → 平均分实时更新
  3. 文末看到 4 篇相关推荐 → 点击进入
  4. 进入 `/me/stats` → 看到 4 项数据非 0

## DoD
- [ ] 4 类 PRD FR 全部承接并可演示
- [ ] preview 限制无法通过清 cookie 单边绕过（IP+fp 联合）
- [ ] 评分 trigger 在并发下 avg 正确（vitest 并发测）

## 依赖
- 上游：ZY-06-01（articles 表）/ ZY-06-03（详情页）/ ZY-06-05（reading_progress）/ ZY-03（auth.users）
- 下游：ZY-17-06（admin 内容管理可看到 rating_avg）

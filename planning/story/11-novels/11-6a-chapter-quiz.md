# ZY-11-06a · 章末快测（Chapter Quiz）

> Epic：E11 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)
> 承接 PRD：NV-FR-006 章末快测、`prds/05-novels/04-v1-launch-titles.md` 50 章 × 5 题种子

## User Story
**As a** 小说读者
**I want** 在章节末尾做 3-5 题快测，覆盖本章高频词与关键句
**So that** 阅读不只是消费，而是可量化的学习；答错的会进 SRS，掌握曲线可视化。

## 上下文
- v1-launch-titles 中 5 部启动小说 × 10 章 × 5 题 = **250 道题**（首批种子）。
- 题型：Q1 单选 / Q2 填空 / Q3 连线 / Q4 阅读 / Q5 拼音听写；各 1 题。
- 通过线 60%（5 题答对 ≥ 3 题）→ 奖励 5 ZC（接 ZY-12-02 规则）；可跳过。
- 错题入 SRS（接 ZY-07-04）；不影响章节解锁（与付费墙独立）。

## 数据模型（drizzle，schema `zhiyu`）
```sql
CREATE TABLE zhiyu.chapter_quizzes (
  chapter_id  uuid PRIMARY KEY REFERENCES zhiyu.chapters(id) ON DELETE CASCADE,
  questions   jsonb NOT NULL,    -- [{type:'Q1', stem, options, answer, i18n:{...}}]
  total       int   NOT NULL DEFAULT 5,
  pass_pct    int   NOT NULL DEFAULT 60,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE zhiyu.chapter_quiz_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  chapter_id   uuid NOT NULL REFERENCES zhiyu.chapters(id),
  answers      jsonb NOT NULL,
  correct      int   NOT NULL,
  total        int   NOT NULL,
  passed       boolean NOT NULL,
  zc_rewarded  int   NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)   -- 每章每用户仅奖励一次
);
ALTER TABLE zhiyu.chapter_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY cq_self ON zhiyu.chapter_quiz_attempts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## API 契约
| Method | Path | 描述 |
|---|---|---|
| GET  | `/api/v1/chapters/:id/quiz` | 返回 5 题（i18n 多语字幕由前端按 lng 选）|
| POST | `/api/v1/chapters/:id/quiz/submit` | 判分 + 错题入 SRS + 通过则发 5 ZC |

## Acceptance Criteria
- [ ] 阅读到章末（reading_progress.percent ≥ 95%）→ 弹"章末快测"卡（可关）
- [ ] 5 题覆盖本章高频词 + 拼音听写 1 题（音频取自章节 TTS）
- [ ] 提交后展示对错 + 正确答案 + 关键词解析
- [ ] 通过（≥ 60%） → 调 `/api/v1/economy/coins/issue` 发 5 ZC（幂等键 `chapter_quiz:{user}:{chapter}`）
- [ ] 错题写 `srs_cards`（source='novel_quiz'，接 ZY-07-04）
- [ ] 跳过/未通过都不阻塞下一章解锁
- [ ] 4 语题面 + UI 文案（en/vi/th/id）
- [ ] 种子数据：随 ZY-11-01 提供 250 题 JSON（5 部 × 10 章 × 5 题），路径 `system/packages/db/seed/novels/chapter_quizzes.json`

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run novels.chapter.quiz
docker compose exec zhiyu-app-be pnpm seed:novels && \
  docker compose exec zhiyu-db psql -U postgres -d zhiyu -c \
  "SELECT count(*) FROM zhiyu.chapter_quizzes;"  # 应 ≥ 50
```
- MCP Puppeteer：
  1. 阅读启动小说第 1 章到末尾 → 弹快测
  2. 答对 4 题 → 看到"+5 ZC"提示，钱包余额 +5
  3. 答错 2 题 → 进入"温故知新"队列查看新增卡片

## DoD
- [ ] NV-FR-006 完整承接
- [ ] 250 题种子幂等灌入
- [ ] 同章重复通过不重复发币

## 依赖
- 上游：ZY-11-01 / ZY-11-04 / ZY-07-04 / ZY-12-02
- 下游：ZY-17-07（admin 章末题目编辑）

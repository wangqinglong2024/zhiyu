# ZY-08-07 · 拼音入门 3 模块 + 阶段考

> Epic：E08 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)
> 承接 PRD：CR-FR-003（拼音入门 3 模块）/ CR-FR-008（阶段考 80~150 题）/ 题型 P1-P3

## User Story
**As a** 零基础学员
**I want** 进入任一轨道前先完成"声母 / 韵母 / 声调"3 个拼音入门模块；并在每个 stage 末有大型阶段考检验掌握度
**So that** 真正会读拼音再学课文，阶段达标后才解锁下一阶段。

## 上下文
- 拼音入门 P1/P2/P3 是固定 3 节（声母 23、韵母 24、声调 4），所有轨道（HSK/日常/商务/工厂）共用。
- 拼音题型在 PRD `03-question-types.md` 中定义为 P1（听音选拼音）/ P2（看拼音读字）/ P3（声调判断）；ZY-08-05 仅覆盖 Q1-Q10，本 story 补 P1-P3 step 组件。
- 阶段考 = 该 stage 内所有节小测题 + 章测题的随机抽样（80-150 题，由 stage_no 决定难度上限）；通过线 ≥ 75%。
- 阶段考通过 → 解锁下一 stage；不通过 → 7 天 1 次重考。

## 数据模型补丁（drizzle，schema `zhiyu`）
```sql
-- 拼音入门作为 onboarding lessons，slug 固定
INSERT INTO zhiyu.lessons (slug, track, stage_no, lesson_no, title, is_pinyin_intro, is_free)
VALUES
  ('pinyin-intro-initials', NULL, 0, 1, '声母', true, true),
  ('pinyin-intro-finals',   NULL, 0, 2, '韵母', true, true),
  ('pinyin-intro-tones',    NULL, 0, 3, '声调', true, true);

-- 阶段考成绩
CREATE TABLE zhiyu.stage_exam_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  track        text NOT NULL,
  stage_no     int  NOT NULL,
  question_ids uuid[] NOT NULL,
  answers      jsonb  NOT NULL,
  score_pct    numeric(5,2) NOT NULL,
  passed       boolean NOT NULL,
  duration_s   int,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stage_exam_user_idx ON zhiyu.stage_exam_attempts(user_id, track, stage_no, created_at DESC);

-- 用户拼音入门完成标记
ALTER TABLE zhiyu.profiles
  ADD COLUMN IF NOT EXISTS pinyin_intro_completed_at timestamptz;
```

## API 契约
| Method | Path | 描述 |
|---|---|---|
| POST | `/api/v1/pinyin-intro/:lessonSlug/complete` | 完成 1 个拼音模块，全 3 完成时写 profiles.pinyin_intro_completed_at |
| POST | `/api/v1/stage-exam/:track/:stageNo/start` | 抽题 80-150；返回 question_ids[] + 试卷 token |
| POST | `/api/v1/stage-exam/:track/:stageNo/submit` | 判分；passed → 解锁下一 stage |
| GET  | `/api/v1/stage-exam/:track/:stageNo/cooldown` | 未通过时返回剩余冷却时间 |

## Step 组件（P1-P3）
- `<P1AudioToPinyin>`：播放音频（mp3 占位） → 4 选 1 拼音卡（含声母/韵母/声调）
- `<P2PinyinToHanzi>`：展示拼音卡 → 4 选 1 汉字 / 或写出汉字
- `<P3ToneJudge>`：展示拼音（无声调标） + 音频 → 选 1/2/3/4 声
- 三个组件均含错题入 SRS hook（接 ZY-07-04）

## Acceptance Criteria
- [ ] 新用户进入任一课程列表 → 拼音入门未完成则强制弹引导（可跳过 3 次后强制）
- [ ] 3 个 onboarding lesson 走标准 ZY-08-04 学习页流程，但 step 类型可含 P1/P2/P3
- [ ] P1/P2/P3 三个 step 组件实现 + Storybook story + vitest 行为测试
- [ ] 阶段考列表入口在 stage-detail 页底部（前置：该 stage 所有 lessons 已完成 ≥ 80%）
- [ ] 阶段考开始后倒计时 60 分钟（前后端同源），中途断网可恢复（草稿存 IndexedDB）
- [ ] 提交后立即出分，passed → 解锁下一 stage；未通过 → 7 天冷却 + "针对薄弱点的复习单"链接
- [ ] 所有题目 + 选项支持 4 语字幕（i18n 复用题目 translations 字段）
- [ ] paywall：阶段考本身免费，但章节锁会先在 ZY-08-06 拦截

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run pinyin.intro stage.exam
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/ui exec vitest run components/Step{P1,P2,P3}
```
- MCP Puppeteer：
  1. 新用户首次进入 `/courses/hsk` → 拼音引导弹窗
  2. 完成 3 个拼音模块 → 标记完成
  3. 完成 stage-1 全部 lessons → 阶段考入口出现
  4. 模拟答题（70%、80%）→ 验证未通过/通过分支

## DoD
- [ ] CR-FR-003 + CR-FR-008 + 题型 P1-P3 全部承接
- [ ] 阶段考通过自动解锁下一 stage（与 entitlement 协同）
- [ ] 错题入 SRS（接 ZY-07-04）

## 依赖
- 上游：ZY-08-01 / ZY-08-04 / ZY-08-05 / ZY-07-04
- 下游：ZY-08-06（paywall 路径）/ ZY-17-06（admin 题目管理）

# 应用端：答题与 SRS

> 学员端"练习 / 节末小测 / SRS 复习 / 错题本"全链路。
> 所有接口需登录；C9 / C10 是写流水入口，受最严格的限流与 RPC 校验。

---

## C8 · 取节末小测题目

**对应需求中的操作**：[temp/05 §5.6 节末小测](../../../temp/05-用户端模块设计.md) + [temp/06 §6.7 流程 F](../../../temp/06-关键业务流程.md)

**方法**：GET
**路径**：`/api/v1/course/lessons/:lesson_id/quiz`
**权限**：登录

**业务校验**：
- 节必须可见
- 学员必须 `status='in_progress' OR 'passed'`
- 抽题：每个 `course_lesson_kp` 中的 KP 抽 1 题（参见 [temp/02 §2.5 组卷](../../../temp/02-知识点与题型内容模板.md) 默认规则）
- 题型轮换：避开学员上次该 KP 用过的 `last_q_type`

**请求参数**：无

**成功响应 200**：

```json
{
  "code": 0,
  "data": {
    "quiz_id": "lq_<lesson_id>_<server_seq>",
    "questions": [
      {
        "question_id": "<uuid>",
        "q_code": "q_ec_00012345",
        "q_type": "mcq_meaning",
        "kp_id": "<uuid>",
        "stem_zh": "「你好」的意思是什么？",
        "options_i18n": [
          { "vi":"xin chào", "th":"สวัสดี", "id":"halo", "en":"hello" },
          { "vi":"...", ... },
          { "vi":"...", ... },
          { "vi":"...", ... }
        ],
        "media": { "audio_url": null, "image_url": null }
      }
      /* ... 固定 5 题，与 [temp/01 §1.5](../../../temp/01-课程目录骨架.md) 一致 */
    ],
    "pass_score": 80
  }
}
```

**错误**：

| HTTP | code | 触发 |
|------|------|------|
| 401 | 40101 | 未登录 |
| 403 | `COURSE_LESSON_NOT_ENTERED` | 学员未进入该节 |
| 404 | 40400 | 节不存在 |

---

## C9 · 提交单题答案

**对应需求中的操作**：[temp/05 §5.5 节内练习 / §5.6 节末小测 / §5.8 SRS 复习](../../../temp/05-用户端模块设计.md) + [temp/06 §6.7](../../../temp/06-关键业务流程.md)

**方法**：POST
**路径**：`/api/v1/course/answers`
**权限**：登录

**业务校验**：
- `question_id` 必须可见
- `context_type` 必须合法
- `context_type='lesson_quiz'` 时 `context_ref_id` 必须为节 id 且学员处 `in_progress`
- `context_type='srs_review'` 时该 KP 必须在学员 SRS 队列且 `due_at <= now() + 1h`（防作弊）
- `user_answer` 结构必须匹配题型 schema
- **完全由后端判分**，不接受前端 `is_correct`

**请求体**：

```json
{
  "question_id": "<uuid>",
  "context_type": "practice",     // 或 lesson_quiz / chapter_test / stage_exam / hsk_mock / srs_review
  "context_ref_id": "<uuid>",     // 可选，按 context_type
  "user_answer": { "selected_index": 0 },
  "duration_ms": 3500
}
```

**副作用**：
- 写 `course_user_answers`（流水，月分区）
- 若 `context_type ≠ 'practice'`：调用 `fn_srs_update`
- 不更新 `course_user_progress`（小测整卷提交时由 C10 一次性更新）

**成功响应 200**：

```json
{
  "code": 0,
  "data": {
    "is_correct": true,
    "score": 1.0,
    "explanation_zh": "「你好」是日常问候语...",
    "explanation_i18n": { "vi":"...","th":"...","id":"...","en":"..." },
    "srs_after": { "box": 3, "due_at": "2026-04-22T08:00:00+08:00" }
  }
}
```

**错误**：

| HTTP | code | 触发 |
|------|------|------|
| 400 | `COURSE_PAYLOAD_SCHEMA_MISMATCH` | user_answer 结构错 |
| 400 | `COURSE_INVALID_ANSWER_CONTEXT` | context_type 不合法 |
| 401 | 40101 | 未登录 |
| 403 | `COURSE_SRS_NOT_DUE` | SRS 复习但未到期 |
| 404 | 40400 | 题目不存在 |
| 429 | `COURSE_RATE_LIMIT` | 用户 600/分 |

---

## C10 · 提交节末小测（汇总打分）

**对应需求中的操作**：[temp/05 §5.6](../../../temp/05-用户端模块设计.md) + [temp/06 §6.7](../../../temp/06-关键业务流程.md)

**方法**：POST
**路径**：`/api/v1/course/lessons/:lesson_id/quiz:submit`
**权限**：登录

**业务校验**：
- `quiz_id` 必须由 C8 当次发出，30 分钟内有效
- 每题必须曾通过 C9 提交（用 quiz_id 关联），缺失题计 0 分
- 总分 = sum(score) / total * 100；通过 = `score >= pass_score`

**请求体**：

```json
{
  "quiz_id": "lq_<lesson_id>_<seq>"
}
```

**副作用**：
- 计算总分写入 `course_user_progress.best_score`、`attempts += 1`
- 通过：`status='passed'`, `passed_at=now()`，自动解锁下一节（trigger）
- 未通过：保持 `in_progress`

**成功响应 200**：

```json
{
  "code": 0,
  "data": {
    "score": 92.5,
    "passed": true,
    "best_score": 92.5,
    "attempts": 1,
    "next_lesson": {
      "lesson_id": "<uuid>",
      "code": "ec-1-1-2",
      "title_zh": "..."
    },
    "wrong_questions": [
      { "question_id": "<uuid>", "q_code": "q_ec_00012567" }
    ]
  }
}
```

**错误**：

| HTTP | code | 触发 |
|------|------|------|
| 400 | `COURSE_QUIZ_EXPIRED` | quiz_id 过期 |
| 400 | `COURSE_QUIZ_INCOMPLETE_ANSWERS` | 题目未提交完毕（前端可在请求前自检） |
| 401 | 40101 | 未登录 |

---

## C11 · 取 SRS 复习队列

**对应需求中的操作**：[temp/05 §5.8 SRS 复习](../../../temp/05-用户端模块设计.md) + [temp/06 §6.8 流程 G](../../../temp/06-关键业务流程.md)

**方法**：GET
**路径**：`/api/v1/course/srs/queue`
**权限**：登录

**业务校验**：单日上限 50 张（[F1-09 §6](../F1-AI-数据模型规范/09-校验规则汇总.md)）

**请求参数**：

| 参数 | 位置 | 类型 | 默认 | 说明 |
|------|------|------|------|------|
| `limit` | query | int | 20 | 1–50 |
| `track` | query | enum | 当前主题 | 可指定单主题复习 |

**成功响应 200**：

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "kp_id": "<uuid>",
        "kp_code": "kp_ec_word_000123",
        "kp_type": "word",
        "title_zh": "你好",
        "box": 2,
        "due_at": "2026-04-15T08:00:00+08:00",
        "suggested_question": {
          "question_id": "<uuid>",
          "q_type": "listen_pick",
          "stem_zh": null,
          "options_i18n": [...]
        }
      }
    ],
    "remaining_today": 30
  }
}
```

> `suggested_question`：按 [04 §3 course_user_srs.last_q_type](../F1-AI-数据模型规范/04-表定义-学员进度.md) 轮换抽题。学员答完后调 C9（context_type=`srs_review`）。

**错误**：

| HTTP | code | 触发 |
|------|------|------|
| 401 | 40101 | 未登录 |
| 429 | `COURSE_SRS_DAILY_LIMIT_EXCEEDED` | 今日 50 张已发完 |

---

## C12 · 错题本列表

**对应需求中的操作**：[temp/05 §5.8 错题本](../../../temp/05-用户端模块设计.md)

**方法**：GET
**路径**：`/api/v1/course/me/wrong-questions`
**权限**：登录

**请求参数**：

| 参数 | 位置 | 默认 | 说明 |
|------|------|------|------|
| `track` | query | 全部 | 单主题筛选 |
| `kp_type` | query | 全部 | 7 类 KP |
| `page` | query | 1 | — |
| `page_size` | query | 20 | 上限 100 |
| `sort` | query | `-wrong_count` | 白名单：`wrong_count`/`last_wrong_at` |

**成功响应 200**：

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "kp_id": "<uuid>",
        "kp_code": "kp_ec_word_000123",
        "title_zh": "你好",
        "kp_type": "word",
        "wrong_count": 3,
        "last_wrong_at": "2026-04-12T20:30:00+08:00",
        "current_box": 1
      }
    ],
    "pagination": { "page":1, "page_size":20, "total":42 }
  }
}
```

**错误**：401 未登录。

> 数据来源：`course_user_srs WHERE user_id=? AND wrong_count>=1`，join KP 表。

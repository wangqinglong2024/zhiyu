# F1-AI：数据模型规范 · 索引

> ⚠️ **2025-11 变更**：F1/05 中的 course_ai_prompts / course_ai_generation_jobs 两表已废弃；F1/02 题目表新增 exam_scope text[]。
> 详见 [./CHANGELOG-2025-11.md](../CHANGELOG-2025-11.md)。

> **功能**：课程学习引擎（中文学习 · 4 大主题 · 共享 Stage 0）
> **来源**：[../../../temp/00-总览与设计原则.md](../../../temp/00-总览与设计原则.md) · [../../../temp/01-课程目录骨架.md](../../../temp/01-课程目录骨架.md) · [../../../temp/02-知识点与题型内容模板.md](../../../temp/02-知识点与题型内容模板.md) · [../../../temp/03-数据库schema.md](../../../temp/03-数据库schema.md)
> **遵循规范**：[../../../grules/G1-架构与技术规范/03-数据库规范.md](../../../grules/G1-架构与技术规范/03-数据库规范.md)
> **数据库**：自托管 Supabase Postgres 16，schema = `zhiyu`
> **拆分原则**：按"对象/子主题"拆为独立子文件，单文件 ≤ 1200 行

---

## 章节导航

| # | 文件 | 内容 |
|---|------|------|
| 一 | [01-表定义-课程目录.md](./01-表定义-课程目录.md) | `course_tracks` / `course_stages` / `course_chapters` / `course_lessons` |
| 一 | [02-表定义-知识点与题目.md](./02-表定义-知识点与题目.md) | `course_knowledge_points` / `course_lesson_kp` / `course_questions` |
| 一 | [03-表定义-考试与作答.md](./03-表定义-考试与作答.md) | `course_exams`（试卷模板） |
| 一 | [04-表定义-学员进度.md](./04-表定义-学员进度.md) | `course_user_progress` / `course_user_answers` / `course_user_srs` / `course_user_exam_attempts` |
| 一 | [05-表定义-AI生产与媒资.md](./05-表定义-AI生产与媒资.md) | `course_ai_prompts` / `course_ai_generation_jobs` / `course_content_review_log` / `course_media_assets` |
| 二 | [06-枚举定义.md](./06-枚举定义.md) | KP 类型、题型、内容状态、SRS 盒、考试范围、AI Job 状态等 |
| 三 | [07-表关系.md](./07-表关系.md) | ER 图、外键、级联策略、跨域副作用 |
| 四 | [08-状态机.md](./08-状态机.md) | 内容审核状态机 + AI Job 状态机 + 节级发布状态机 |
| 五 | [09-校验规则汇总.md](./09-校验规则汇总.md) | 前后端共用 Zod 规则与错误码 |
| 六 | — | 计算规则（详见 [04 §SRS 调度](./04-表定义-学员进度.md) 与 [03 §试卷抽题](./03-表定义-考试与作答.md)，无独立计算公式） |
| 七 | [10-编号生成规则.md](./10-编号生成规则.md) | `kp_code` / `q_code` / `lesson_code` 生成规则 |
| 八 | [11-种子数据.md](./11-种子数据.md) | 5 主题 + 25 阶段 + 21 prompt + 1 super 管理员 + 占位媒资 |
| — | [12-待确认问题清单.md](./12-待确认问题清单.md) | 需 PM 拍板的开放问题（含与 temp/07 的差异） |

---

## 命名约定（本功能内）

- **schema**：`zhiyu`（与 china 共用同一物理库；逻辑域用表名前缀隔离）
- **表名前缀**：`course_`（隔离课程学习域，与 china 等其它域并列）
- **多语言列**：统一字段后缀 `_i18n`，jsonb 5 key `{zh, vi, th, id, en}`（与 [grules/G1-03 §四 / §八](../../../grules/G1-架构与技术规范/03-数据库规范.md) + china 域对齐，[12-Q10](./12-待确认问题清单.md) 已封板）
  - 中文是平台主语言；学员端按 `ui_lang` 取对应 key，缺失回退 `en` → `zh`
  - 学习目标本体的中文原文额外存独立列 `title_zh / word_zh / sentence_zh`（**不可变**，与翻译解耦）；`_i18n.zh` 是管理员可改的 UI 文案
- **主题码**：固定 5 个 `ec / fc / hk / dl / share`，写死不允许动态新增（[详见 01 §course_tracks](./01-表定义-课程目录.md)）
- **节级编码**（`course_lessons.code`）：`<track>-<stage>-<chapter>-<lesson>`，如 `ec-2-3-1`、`share-0-1-1`
- **内容编码**：`kp_<track>_<type>_<6位序号>`、`q_<track>_<8位序号>`（[详见 10-编号生成规则.md](./10-编号生成规则.md)）
- **软删**：所有"内容侧"表（`course_knowledge_points` / `course_questions` / `course_lessons` 等）启用 `deleted_at`，30 天后由 cron 物理清理；用户进度类不软删（直接物理删，但有审计）
- **主键策略**：✅ 全表统一 `uuid`（[12-Q1](./12-待确认问题清单.md) 已封板，与 [grules/G1-03 §一](../../../grules/G1-架构与技术规范/03-数据库规范.md) + china 域一致），业务唯一键（如 `code`、`kp_code`）独立列；流水表索引膨胀通过月分区控制（[12-Q8](./12-待确认问题清单.md)）
- **可见性**：用户端**永远不查草稿**——通过 RLS 强制 `status='approved' AND is_published=true`

---

## 与 temp 文档的对照

| temp 文件 | 在本规范中的位置 |
|----------|----------------|
| 00 §0.5 七类 KP | [06-枚举定义.md](./06-枚举定义.md) §1 + [02 §course_knowledge_points](./02-表定义-知识点与题目.md) `content` 字段 |
| 02 §2.4 十二类题型 | [06-枚举定义.md](./06-枚举定义.md) §2 + [02 §course_questions](./02-表定义-知识点与题目.md) `payload` 字段 |
| 02 §2.5 组卷规则 | [03 §course_exams.blueprint](./03-表定义-考试与作答.md) |
| 02 §2.6 SRS Leitner 5 盒 | [04 §course_user_srs](./04-表定义-学员进度.md) + [08 §SRS 调度](./08-状态机.md) |
| 03 §3.x DDL | [01–05 各表 DDL 草案](./01-表定义-课程目录.md) |
| 03 §3.5 admins | 复用平台公共表 `auth.users` + 扩展表 `auth_admin_profiles`（详见 [12-Q5](./12-待确认问题清单.md)） |

---

## PM 审核要点

- ✅ 14 个核心表是否覆盖 temp/03 全部对象
- ✅ KP 内容字段（按 7 类差异）是否完整可生成
- ✅ 题型 12 类的 `payload` 结构是否能渲染所有用户端题型
- ✅ AI Job 表是否能支撑 [temp/06 §6.3 流程 B](../../../temp/06-关键业务流程.md) 的批量生成与重试
- ✅ 待确认清单中的默认方案是否需要调整（特别是 Q1 主键策略、Q5 管理员复用）

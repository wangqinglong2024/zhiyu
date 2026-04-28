# 08 学习引擎 · 单任务文件索引

## 总裁决

- 复习系统的数据仅来自学习系统与游戏错误。
- 小说与发现中国不进入 `srs_cards`、`learning_wrong_set`、今日复习、错题专攻、薄弱点诊断或掌握度热力图。
- PRD 中所有学习引擎功能必须保留原文引用；若原文与本裁决冲突，任务中必须标注冲突并以本裁决修正实现。

## 内容规则核对

| 板块 | 内容规则 | 对学习引擎的影响 |
|---|---|---|
| 发现中国 | `content/china/00-index.md`：12 主题，主题 → 文章 → 句子，登录后免费阅读 | 只做阅读/收藏/报错/联动，不写 SRS |
| 系统课程 | `content/course/00-index.md`：4 主题 × 12 阶段 × 12 章 × 12 节 × 12 知识点；题库来自课程知识点 | 学习引擎主数据源，课程小测/章测/阶段考错题入 SRS |
| 游戏专区 | `content/games/00-index.md`：12 游戏，内容来自课程题库，错过的字/词权重 ×3 进入复习池 | 游戏 wrong/miss 是学习引擎第二数据源 |
| 小说专区 | `content/novels/00-index.md`：句对照阅读/听书，长按生词联动课程 | v1 不把小说阅读、句子、生词直接写入 SRS；如未来做生词，必须先转为课程题库题目 |

## 任务列表

| 任务 | 文件 | 覆盖需求 |
|---|---|---|
| LE-01 | `LE-01-data-model-rls.md` | SRS / review / streak / daily stats 数据表与 RLS |
| LE-02 | `LE-02-fsrs-engine.md` | FSRS-5 评分引擎与状态更新 |
| LE-03 | `LE-03-source-boundary.md` | 复习来源边界，排除小说与发现中国 |
| LE-04 | `LE-04-review-page.md` | `/learn/review` 温故知新页面 |
| LE-05 | `LE-05-review-api.md` | review today / rate / preview API |
| LE-06 | `LE-06-wrong-set.md` | `/learn/wrong-set` 错题专攻 |
| LE-07 | `LE-07-new-questions.md` | `/learn/new` 今日新题 |
| LE-08 | `LE-08-practice.md` | `/learn/practice` 自由练习 |
| LE-09 | `LE-09-dashboard.md` | `/me/dashboard` 学习仪表板 |
| LE-10 | `LE-10-streak-freeze.md` | streak、freeze、里程碑奖励 |
| LE-11 | `LE-11-reminders.md` | 学习提醒与邮件 Adapter |
| LE-12 | `LE-12-fsrs-params-admin.md` | FSRS 参数管理与后台控制 |
| LE-13 | `LE-13-weakness-diagnosis.md` | 薄弱点诊断与专项练习入口 |
| LE-14 | `LE-14-question-feedback-components.md` | 统一题目组件、反馈、总结 |
| LE-15 | `LE-15-scheduling-performance.md` | 调度优先级与性能预算 |
| LE-16 | `LE-16-seed-tests-validation.md` | seed、Docker 测试、端到端验收 |
| LE-FINAL | `99-final-acceptance-checklist.md` | 最终总验收清单 |

## 全局技术假设

- 代码根目录遵守 `planning/rules.md`，所有实现落在 `system/`。
- 前端使用 React 19、Vite 6、TanStack Router、TanStack Query、Zustand、Tailwind CSS 4、shadcn/ui。
- 后端使用 Express、Drizzle、Supabase Postgres、Redis/BullMQ、ts-fsrs。
- 所有缺 key 外部服务必须使用 fake/console Adapter，不阻塞 Docker 验证。
- 数据表命名以最终实现 migration 为准，但必须提供兼容 PRD 语义的字段、索引、RLS 和审计。

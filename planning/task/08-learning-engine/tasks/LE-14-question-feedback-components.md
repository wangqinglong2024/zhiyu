# LE-14 · 统一题目组件与反馈

## 任务目标

复用课程题目渲染体系，让复习、新题、自由练习、错题专攻拥有一致答题体验、即时反馈和完成总结。

## PRD 原文引用

- `planning/prds/07-learning-engine/01-functional-requirements.md` UX：“答题界面统一组件（复用课程小测）”
- 同段：“每题反馈：对 / 错 + 解释 + KP 跳转链接”
- 同段：“完成 N 题展示总结：正确率 / 用时 / 币奖励”

## 需求拆解

- 在 `system/packages/ui` 或 app feature 内封装 `QuestionRenderer` 适配 Q1-Q10/P1-P3。
- 统一反馈组件：正确/错误、解释、正确答案、知识点跳转。
- 统一总结组件：题数、正确率、用时、SRS 变化、奖励。
- 学习引擎模式差异通过 props 传入，不复制组件。
- 所有组件使用 shadcn/ui 与 `zy-glass-*` 材质。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/review`、`/learn/wrong-set`、`/learn/new`、`/learn/practice` |
| 组件 | `QuestionRenderer`、`QuestionFeedback`、`SessionSummary`、`KpJumpLink` |
| API | 题目详情/提交响应必须提供解释与 KP 链接数据 |
| 数据表 | `content_questions`、`content_knowledge_points`、attempt/review 表 |
| 状态逻辑 | unanswered → submitted → feedback → next/score |

## UI 设计要求

- Button、Card、RadioGroup、Checkbox、Sortable、Dialog 均基于 shadcn/ui。
- 每个选项是玻璃按钮，hover/press/focus 明确。
- 音频题使用统一 AudioButton，带 tooltip 和 aria-label。
- 错误反馈不只靠颜色，必须有图标和文字。

## 内容规则与边界

- 题型只来自课程题库 Q1-Q10/P1-P3。
- 游戏内玩法组件不复用完整 QuestionRenderer，但结果回传要兼容同一题目模型。
- 发现中国/小说不接入该答题组件作为 LE 来源。

## 不明确 / 不支持 / 风险

- Q8 拖拽排序需要键盘替代操作。
- P2 笔顺动画如果资产未准备，需提供本地 mock 或静态 fallback。

## 技术假设

- lucide-react 可用于状态图标。
- shadcn/ui 组件已安装或会在 UX 任务中统一生成。

## 验收清单

- [ ] 四个学习引擎页面复用同一题目组件。
- [ ] 反馈显示对/错、解释、KP 跳转。
- [ ] 总结显示正确率、用时、币奖励或无奖励说明。
- [ ] 组件在 360px 宽度不溢出。
- [ ] 所有可交互元素具备键盘操作和 focus ring。

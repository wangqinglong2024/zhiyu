# ACR-01 · 课程后台分层路由与主题壳

## PRD 原文引用

- `AD-FR-006`：“CR：tracks/stages/chapters/lessons/knowledge_points 树形。”
- `planning/ux/11-screens-admin.md`：“课程：默认选择主题（电商/日常/工厂/HSK）；主题页左侧 12 阶段，右侧显示所选阶段的 12 章；点击章编辑进入子页面，左侧 12 节，右侧显示所选节的 12 知识点。”

## 需求落实

- 页面：`/admin/content/courses`（主题选择入口）。
- 子路由：
  - `/admin/content/courses/:theme`
  - `/admin/content/courses/:theme/stages/:stage`
  - `/admin/content/courses/:theme/stages/:stage/chapters/:chapter`
  - `/admin/content/courses/:theme/stages/:stage/chapters/:chapter/lessons/:lesson`
  - `/admin/content/courses/:theme/stages/:stage/chapters/:chapter/lessons/:lesson/knowledge-points/:kp`
  - `/admin/content/courses/questions`
  - `/admin/content/courses/quizzes`
- 组件：ThemePicker、StageSidebar（左侧 12 阶段）、ChapterGrid（右侧 12 章）、LessonSidebar（左侧 12 节）、KnowledgePointGrid（右侧 12 知识点）、ContextMenu、SearchInput、FilterChips。
- API：`GET /admin/api/content/courses/themes`、`GET /admin/api/content/courses/:theme/stages/:stage/chapters`、`GET /admin/api/content/courses/:theme/stages/:stage/chapters/:chapter/lessons/:lesson/knowledge-points`。

## 状态逻辑

- 默认先选择主题，不在一个页面堆多层。
- 主题页左侧固定 12 阶段，右侧只展示当前阶段 12 章。
- 章编辑子页面左侧固定 12 节，右侧只展示当前节 12 知识点。
- 节点状态颜色：published(绿)、draft(灰)、archived(红)。
- 搜索：按 slug / name_zh / external_id。
- RBAC：editor 可写，reviewer 只读。

## 不明确 / 风险

- 风险：旧树形全展开会把多层堆在一个页面，信息过载。
- 处理：按用户裁决改为分层页面；每页最多展示一层主列表 + 一层详情。

## 技术假设

- 路由按 React Router lazy load 拆分。
- 当前主题、阶段、章、节状态保留在 URL path（便于分享链接）。

## 最终验收清单

- [ ] 进入 `/admin/content/courses` 看到 4 主题选择入口。
- [ ] 选择主题后左侧 12 阶段、右侧当前阶段 12 章。
- [ ] 点击章编辑后左侧 12 节、右侧当前节 12 知识点。
- [ ] 搜索 lesson slug 命中并跳到对应子页面。
- [ ] 节点状态颜色正确。
- [ ] 写操作走 audit_logs。

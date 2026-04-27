# ADC-05 · 实现内容边界与红线校验

## PRD 原文引用

- `planning/prds/02-discover-china/01-functional-requirements.md`：“严禁政治 / 宗教 / 民族；严禁泰国王室相关；严禁敏感历史。”
- `content/china/*.md` 每个类目定义内容范围和边界。

## 需求落实

- 页面：文章编辑器、发布确认弹窗。
- 组件：CategoryBoundaryPanel、RedlineCheckPanel。
- API：`POST /admin/api/content/discover/articles/:id/redline-check`。
- 数据表：`content_review_workflow`、`admin_audit_logs`、可选 `content_policy_rules`。
- 状态逻辑：未通过红线校验不可发布；边界提示随类目变化。
- 引擎：后台必须提供红线规则版本、命中字段、命中语种、严重级别、建议处理动作，并支持保存草稿时预检、提交审校时复检、发布前终检。
- 语种：中文原文与 en/vi/th/id 翻译均需要有校验结果或审校确认。

## 不明确 / 风险

- 风险：自动校验本期是 mock，不能替代人工。
- 处理：校验结果只作为辅助，发布仍需 reviewer/editor 责任确认。

## 技术假设

- 类目边界规则从内容目录固化为 seed/config。

## 最终验收清单

- [ ] 切换类目时显示对应边界。
- [ ] 发布前必须有校验结果。
- [ ] 红线失败无法发布。
- [ ] 打回原因进入审校记录。
- [ ] 红线校验与人工确认动作写入 `admin_audit_logs`。
- [ ] 保存、导入、提交审校、发布调用同一红线检测服务，阻断级命中不可被普通 editor 绕过。
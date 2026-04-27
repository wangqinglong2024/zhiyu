# 03 · 用户账号任务清单

## 单任务文件

- 具体任务已拆分到 `tasks/`，每个任务单独一个文件。
## 来源覆盖

- PRD：`planning/prds/06-user-account/01-functional-requirements.md`、`02-data-model-api.md`。
## 冲突裁决

- 验证码、邮件、OAuth 真实外部依赖都经 Supabase/Auth 或 Adapter/fake，本期缺 key 不阻塞。
## 任务清单

- [ ] UA-01 建立 `users`、`user_preferences`、`user_devices`、`user_sessions`、`user_email_otp`、`user_data_exports` 并启用 RLS。来源句：`planning/prds/06-user-account/02-data-model-api.md` DDL 定义这些表并写明 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`。
## 验收与测试

- [ ] UA-T01 Docker 内完成注册 → OTP → 登录 → 偏好修改 → 会话下线 → 导出申请 → 销户软删主流程。来源句：`UA-FR-001~013`。


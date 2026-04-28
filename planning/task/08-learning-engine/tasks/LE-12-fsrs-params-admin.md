# LE-12 · FSRS 参数管理

## 任务目标

实现 FSRS 参数管理：默认使用 FSRS-5 标准参数，用户可重置个人 SRS 状态，管理员可调全局参数。

## PRD 原文引用

- `LE-FR-008`：“默认参数：FSRS-5 标准参数”
- `LE-FR-008`：“用户可重置个人 SRS 状态（清空所有 cards）”
- `LE-FR-008`：“管理员可调全局参数”

## 需求拆解

- 后端封装 FSRS 参数读取：默认内置标准参数，DB 配置覆盖。
- 建立后台参数页，展示当前参数、版本、更新时间、修改人。
- 参数修改必须 RBAC、二次确认、写 audit_logs。
- 用户个人设置提供“重置 SRS”危险操作，清空或软删除个人 cards/reviews，并要求二次确认。
- 参数变更只影响后续评分，不批量重算历史 due，除非另开迁移任务。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/profile/settings/learning`、`/admin/settings/learning-engine` |
| 组件 | `DangerConfirmDialog`、`FsrsParamForm`、`AuditDiffPanel` |
| API | `POST /api/le/srs/reset`、admin `GET/PATCH /api/admin/le/fsrs-params` |
| 数据表 | `srs_cards`、`srs_reviews`、`feature_flags/configs`、`admin_audit_logs` |
| 状态逻辑 | default → configured；reset_requested → confirmed → cards cleared |

## 内容规则与边界

- 参数影响课程和游戏来源卡片。
- 不影响发现中国和小说，因为它们不进入 SRS。

## 不明确 / 不支持 / 风险

- “清空所有 cards”是否保留历史 reviews：建议软删/归档 reviews，便于审计和用户恢复窗口。
- 管理员调参风险高，需要防止无效参数导致调度异常。

## 技术假设

- 后台角色 `admin` 才能调全局参数。
- 用户重置只影响当前用户。
- 参数 JSON 使用 Zod schema 校验。

## 验收清单

- [ ] 默认无配置时使用 FSRS-5 标准参数。
- [ ] 非 admin 访问调参接口返回 403。
- [ ] 参数修改写入审计 before/after。
- [ ] 用户重置 SRS 需要二次确认。
- [ ] 重置后该用户今日复习为空或按新题逻辑重新生成。

# LE-11 · 学习提醒

## 任务目标

实现用户每日学习提醒：v1 通过邮件 Adapter/console outbox，v1.5 预留 Web Push，不因缺外部 key 阻塞 Docker。

## PRD 原文引用

- `US-LE-05`：“学习提醒推送”
- `LE-FR-007`：“用户设置每日提醒时间”
- `LE-FR-007`：“v1：邮件提醒”
- `LE-FR-007`：“v1.5：浏览器 Web Push”
- `LE-FR-007`：“触发：到时未学习 → 提醒”
- `LE-FR-007`：“已学完则不发”

## 需求拆解

- 建立用户提醒偏好：enabled、time、timezone、channel=email。
- Worker/cron 定时扫描到点用户。
- 判断用户本地当天是否已完成 review/quiz/lesson；已完成不发。
- v1 发送邮件提醒，实际走 `EmailAdapter`，缺 key 时写 console/outbox。
- Web Push 只预留字段和 disabled UI，不实现真实推送。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/profile/settings/notifications` 或个人设置通知区 |
| 组件 | `ReminderTimePicker`、`NotificationToggle` |
| API | `GET/PATCH /api/le/reminder-preferences`、worker 内部 job |
| 数据表 | `notification_preferences` 或 `user_settings`、`learning_daily_stats`、`outbox` |
| 状态逻辑 | disabled → enabled；due + not learned → send；learned → skip |

## 内容规则与边界

- 提醒只围绕学习系统 review/quiz/lesson。
- 不基于小说更新或发现中国阅读触发“已学习”。
- 可推荐“今日复习/课程继续学习/游戏复习”，但不推荐小说作为复习任务。

## 不明确 / 不支持 / 风险

- 邮件模板多语种文案需 i18n 支持。
- 扫描大量用户时需要批处理与幂等，避免重复邮件。
- v1.5 Web Push 不得在 v1 文档中写成已完成。

## 技术假设

- 现有后端有 EmailAdapter 或可新增 fake/console adapter。
- cron 运行在 worker 容器内。

## 验收清单

- [ ] 用户可设置提醒时间和开关。
- [ ] 到时未学习时写出邮件 outbox/console。
- [ ] 当天已完成 review/quiz/lesson 时不发。
- [ ] 缺邮件服务 key 不阻塞容器启动。
- [ ] Web Push 明确标注 v1.5 占位，不触发真实订阅。

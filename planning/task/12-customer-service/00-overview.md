# 12 · 客服 IM 任务清单

## 来源覆盖

- PRD：`planning/prds/11-customer-service/01-functional-requirements.md`、`02-data-model-api.md`。
- 技术：`planning/spec/12-realtime-and-im.md` 与 `planning/rules.md` Supabase Realtime 裁决。

## 任务清单

- [ ] CS-01 建立 `cs_conversations`、`cs_messages`，启用用户与客服 RLS。来源句：`planning/prds/11-customer-service/02-data-model-api.md` DDL 定义这些表和 RLS policy。
- [ ] CS-02 实现全站右下角客服浮窗，已登录进入会话，未登录弹登录/留邮箱。来源句：`CS-FR-001`。
- [ ] CS-03 实现用户会话页 `/me/support`：分类、客服头像、在线/离线、消息流、输入、表情、图片、历史 tab。来源句：`CS-FR-002`。
- [ ] CS-04 实现首消息创建 conversation，并按同语种 + 最少工单 + 工作时间路由。来源句：`CS-FR-003` 与“路由算法”。
- [ ] CS-05 支持 text≤2000、image≤5MB、system、链接预览。来源句：`CS-FR-004`。
- [ ] CS-06 使用 Supabase Realtime `conversation:{id}` 推送消息，不引入独立 socket 服务。来源句：`CS-FR-005` 写明“Supabase Realtime channel = conversation:{id}”。
- [ ] CS-07 实现用户端与客服端未读数。来源句：`CS-FR-006`。
- [ ] CS-08 实现客服后台 `/admin/cs/workbench`：待接、当前会话≤5、历史搜索、快捷回复。来源句：`CS-FR-007` 与 `AD-FR-009`。
- [ ] CS-09 实现状态机 pending/active/waiting/resolved/closed_no_response。来源句：`CS-FR-008`。
- [ ] CS-10 实现关闭后 1-5 星评分与 200 字评论；≤3 转 manager 回访作为 v1.5 占位。来源句：`CS-FR-009`。
- [ ] CS-11 FAQ 作为 v1.5 占位，不阻塞 W0 客服 IM。来源句：`CS-FR-010` 写明“FAQ（v1.5）”。
- [ ] CS-12 客服消息走红线检测，用户数据不分享第三方，自动翻译 v1.5 占位。来源句：`CS-FR-011`。
- [ ] CS-13 通知：用户不在站内时 EmailAdapter fake；客服端 dashboard + 浏览器桌面通知。来源句：`CS-FR-012`。
- [ ] CS-14 实现自动归档：resolved 7 天后 archived，只读可查。来源句：`planning/prds/11-customer-service/02-data-model-api.md` “自动归档”。
- [ ] CS-15 实现 API：用户创建/查询/发消息/已读/评分；客服队列/抢单/会话/回复/关闭。来源句：同文件“API”章节。

## 验收与测试

- [ ] CS-T01 用户发起工单 → 客服同语种接单 → Realtime 收发 → 关闭 → 评分。来源句：`CS-FR-001~009`。
- [ ] CS-T02 工作时间外首消息保留 pending 并触发 fake 邮件通知。来源句：`CS-FR-003`。
- [ ] CS-T03 性能：发送 P95 <300ms、Realtime 延迟 <1s、历史加载 <500ms。来源句：`planning/prds/11-customer-service/01-functional-requirements.md` “性能”章节。

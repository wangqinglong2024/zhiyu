# 11 · 客服系统（Customer Service · CS）

> **代号**：CS | **优先级**：P0 | **核心**：内置 IM 客服（Supabase Realtime）

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 通道：内置 1v1 IM（不接 Intercom / Zendesk，节省成本）
- 后端：Supabase Realtime（websocket）+ messages 表
- 多客服：路由策略：在线最少 + 同语种优先
- 工作时间：UTC+7 9:00-22:00（覆盖 VN/TH/ID 主要活跃时段）
- 离线：用户留言 + 邮件通知客服 + 客服上线推送
- 工单分类：账号 / 支付 / 内容 / 学习 / 分销 / 其他
- v1 仅 IM；v1.5 加 FAQ + 自助
- 评分：会话末让用户评 1-5 星

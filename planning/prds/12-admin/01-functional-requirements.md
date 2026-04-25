# 12.1 · 管理后台 · 功能需求

## 角色与权限

| 角色 | 权限 |
|---|---|
| admin | 全部 + 用户角色管理 + 配置 |
| editor | 内容 CRUD + 工厂 + 审校 |
| reviewer | 审校工作台（不能改源） |
| cs | 客服工作台 + 用户基本信息 |
| viewer | 只读所有 dashboards |

## 功能需求

### AD-FR-001：登录
- 邮箱 + 密码 + TOTP（强制 2FA）
- 失败 5 次锁 30min
- IP 白名单（可选）

### AD-FR-002：Dashboard 总览
- KPI 卡片：DAU / WAU / MAU / 订单数 / GMV / Churn / NPS / 客服未接
- 7/30/90 天趋势图
- 异常告警（红线 / 高错误率 / 支付失败率）

### AD-FR-003：用户管理
- `/users` 列表 + 搜索（邮箱 / ID / 昵称 / 推荐码）
- 详情：profile + 订单 + 进度 + 币流水 + 客服历史 + 分销树
- 操作：冻结 / 解冻 / 重置密码 / 强制下线 / 加币 / 扣币 / 模拟登录（审计）

### AD-FR-004：订单管理
- 列表 + 筛选（状态 / 金额 / 时间 / 计划）
- 退款（≥ 7 天人工审批）
- 发票导出
- 订单详情含 webhook 历史

### AD-FR-005：知语币账本
- 全局发行 / 消耗 / 余额统计
- 可疑账户列表（高发行 / 异常消耗）
- 手动调整（必填理由 + 审计）

### AD-FR-006：内容管理（4 模块）
- DC：类目 + 文章 + 句子 CRUD
- CR：tracks/stages/chapters/lessons/knowledge_points 树形
- GM：游戏配置 + 词包绑定
- NV：小说 + 章节
- 通用功能：批量发布 / 撤回 / 复制 / 版本历史 / 预览

### AD-FR-007：内容工厂工作流（v1.5 占位）
- `/content/factory`
- v1：页面为“v1.5 即将上线”占位，仅提供手动导入工具入口（CSV/YAML）
- v1.5：触发新工作流（选目标 + 配置）、节点状态监控、重跑失败节点

### AD-FR-008：审校工作台
- `/content/review`
- 工作流：to_review / in_review / approved / rejected / requested_changes
- 字段对比：原文 / AI 译 / 人工编辑
- 母语审校：评分 + 修改 + 备注
- 历史版本对比

### AD-FR-009：客服工作台
- `/cs/workbench`
- 待接单列表（按语言筛）
- 当前会话（实时）
- 历史搜索
- 快捷回复模板

### AD-FR-010：分销报告
- 总佣金（ZC） / 待确认 / 已发放
- **不含提现审核**（v1 不提供现金提现）
- 反作弊告警列表 + 冻结操作
- 大客户榜单（脱敏）

### AD-FR-011：Feature Flags
- `/settings/feature-flags`
- 列表 + 编辑（payment.provider / promo.banner / game.live / 等）
- 灰度发布（按用户 / 国家 / Persona 标签）

### AD-FR-012：操作审计
- 所有写操作记录 audit_logs
- 字段：actor / action / resource / before / after / ip / ua / timestamp
- 7 年保留

### AD-FR-013：导出
- 用户列表 / 订单 / 收益 → CSV / Excel
- 大批量异步任务

### AD-FR-014：通知 / 公告
- 站内公告（多语种 banner）
- 邮件群发（已订阅营销邮件用户）
- 推送（v1.5）

## UX
- 简洁数据驱动 UI（参考 Linear / Stripe Dashboard）
- 暗色 / 亮色主题
- 桌面优先，移动响应

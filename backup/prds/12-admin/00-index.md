# 12 · 管理后台（Admin · AD）

> **代号**：AD | **优先级**：P0 | **核心**：内容 / 用户 / 订单 / 客服 / 内容工厂 全栈管理

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 独立子域 `admin.zhiyu.app`
- 角色（RBAC）：admin / editor / cs / reviewer / viewer
- 双因素登录（强制）
- 操作日志全量审计
- 工作台 + dashboards
- 路径 / 子模块：
  - `/dashboard` 总览
  - `/users` 用户管理
  - `/orders` 订单
  - `/coins` 知语币账本
  - `/content/articles` 发现中国
  - `/content/lessons` 课程
  - `/content/games` 游戏
  - `/content/novels` 小说
  - `/content/factory` 内容工厂工作流
  - `/content/review` 审校工作台
  - `/cs/workbench` 客服工作台
  - `/referral` 分销报告
  - `/settings/feature-flags` 配置开关

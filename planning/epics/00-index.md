---
stepsCompleted: ["init","module-survey","epic-design","story-decomposition"]
inputDocuments:
  - planning/prds/**
  - planning/spec/**
  - planning/ux/**
---

# 知语 Zhiyu · Epics 与 Stories 总目录

> 基于 PRD 15 模块 + 架构 12 文件 + UX 16 文件
> 每 Epic 拆分约 10 个 Story（粒度：1-3 天 / 故事）
> 使用 INVEST 原则（Independent / Negotiable / Valuable / Estimable / Small / Testable）

---

## Epic 全景

| Epic # | 名称 | 模块 | 故事数 | 优先级 | 阶段 | 文件 |
|:---:|---|---|:---:|:---:|:---:|---|
| E01 | 平台基础设施 | spec | 12 | P0 | M0 | [01-platform-foundation.md](./01-platform-foundation.md) |
| E02 | 设计系统与 UI 工具库 | ux | 10 | P0 | M0 | [02-design-system.md](./02-design-system.md) |
| E03 | 用户账户体系 | 06 | 10 | P0 | M1 | [03-user-account.md](./03-user-account.md) |
| E04 | 国际化与本地化 | 15 | 10 | P0 | M1 | [04-i18n.md](./04-i18n.md) |
| E05 | 应用骨架与导航 | 01 + ux | 10 | P0 | M1 | [05-app-shell.md](./05-app-shell.md) |
| E06 | 中国发现（探索）| 02 | 10 | P0 | M2 | [06-discover-china.md](./06-discover-china.md) |
| E07 | 学习引擎 | 07 | 12 | P0 | M2 | [07-learning-engine.md](./07-learning-engine.md) |
| E08 | 课程模块 | 03 | 10 | P0 | M3 | [08-courses.md](./08-courses.md) |
| E09 | 游戏引擎共享层 | spec/11 | 10 | P0 | M3 | [09-game-engine.md](./09-game-engine.md) |
| E10 | 游戏 v1（5 款）| 04 v1 | 10 | P0 | M4 | [10-games-v1.md](./10-games-v1.md) |
| E11 | 小说阅读 | 05 | 10 | P0 | M4 | [11-novels.md](./11-novels.md) |
| E12 | 知语币与商城 | 08 | 10 | P0 | M5 | [12-economy.md](./12-economy.md) |
| E13 | 支付与订阅 | 10 | 10 | P0 | M5 | [13-payment.md](./13-payment.md) |
| E14 | 分销系统 | 09 | 10 | P1 | M6 | [14-referral.md](./14-referral.md) |
| E15 | 客服 IM 与工单 | 11 | 10 | P0 | M6 | [15-customer-service.md](./15-customer-service.md) |
| E16 | AI 内容工厂 | 14 | 12 | P0 | M2-M5 | [16-content-factory.md](./16-content-factory.md) |
| E17 | 管理后台 | 12 | 12 | P0 | M3-M5 | [17-admin.md](./17-admin.md) |
| E18 | 安全与合规 | 13 | 10 | P0 | M0-M6 | [18-security.md](./18-security.md) |
| E19 | 可观测与运维 | spec/10 | 10 | P0 | M0-M6 | [19-observability.md](./19-observability.md) |
| E20 | 上线与发布 | spec/08 | 10 | P0 | M6 | [20-launch.md](./20-launch.md) |

合计 **20 Epics × ~10 Stories ≈ 200+ Stories**

---

## 阶段（Milestones）

| 阶段 | 时长 | 目标 |
|---|---|---|
| M0 基础 | 4 周 | 平台 / 设计系统 / 安全骨架 |
| M1 账户 | 4 周 | 用户 / i18n / App Shell |
| M2 内容 | 6 周 | 探索 / 学习引擎 / 工厂 V0 |
| M3 课程游戏 | 6 周 | 课程 / 游戏引擎 / 后台 v1 |
| M4 游戏小说 | 6 周 | 5 游戏 / 小说 / 后台 v2 |
| M5 商业化 | 6 周 | 经济 / 支付 / 工厂 v1 |
| M6 上线准备 | 6 周 | 分销 / 客服 / 安全审计 / 灰度 |
| **总计** | **38 周** | **v1 上线 4 国** |

---

## 故事编号约定

```
ZY-{Epic}-{NN}     # 例: ZY-07-03 学习引擎-第三个故事
```

## 故事模板（精简版）

```markdown
### ZY-XX-NN · 故事标题

**As a** <角色>
**I want** <目标>
**So that** <价值>

**Acceptance Criteria**
- [ ] 1. ...
- [ ] 2. ...

**Tech Notes**
- ...

**Dependencies**
- 依赖 ZY-XX-MM

**估算**: S / M / L
```

## 优先级

- P0：v1 必交付
- P1：v1 可选 / v1.5 必交
- P2：v2

## 输出物

各 Epic 文件包含：
1. Epic 摘要 + 价值
2. 范围 / 非范围
3. ~10 Stories（含 AC + 估算 + 依赖）
4. 技术注解（关联 spec / ux 文件）
5. 风险与权衡
6. 完成定义（DoD）

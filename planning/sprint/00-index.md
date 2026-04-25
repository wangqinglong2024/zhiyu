# 知语 Zhiyu · Sprint Plan 总目录

> 生成日期：2026-04-25
> 基于：planning/epics（20 Epics + 1 Post-MVP Backlog）
> 工作流：bmad-sprint-planning
> 总 stories：213（v1 = 201 · v1.5 = 12 为 E16 AI 内容工厂）
> 跟踪文件：[sprint-status.yaml](./sprint-status.yaml)

---

## Sprint 全景

每个 Sprint 文件对应一个 Epic，包含：
- Sprint 目标 / 阶段（M0~M6）
- Story 列表（含估算 / 依赖 / 优先级）
- 周次粒度执行计划（按 1-2 周拆）
- 风险与缓解
- DoD（Definition of Done）

| Sprint # | Epic 名称 | 阶段 | Story 数 | 优先级 | 文件 |
|:---:|---|:---:|:---:|:---:|---|
| S01 | 平台基础设施 | M0 | 12 | P0 | [01-platform-foundation.md](./01-platform-foundation.md) |
| S02 | 设计系统与 UI 工具库 | M0 | 10 | P0 | [02-design-system.md](./02-design-system.md) |
| S03 | 用户账户体系 | M1 | 10 | P0 | [03-user-account.md](./03-user-account.md) |
| S04 | 国际化与本地化 | M1 | 10 | P0 | [04-i18n.md](./04-i18n.md) |
| S05 | 应用骨架与导航 | M1 | 10 | P0 | [05-app-shell.md](./05-app-shell.md) |
| S06 | 中国发现 | M2 | 10 | P0 | [06-discover-china.md](./06-discover-china.md) |
| S07 | 学习引擎 | M2 | 12 | P0 | [07-learning-engine.md](./07-learning-engine.md) |
| S08 | 课程模块 | M3 | 10 | P0 | [08-courses.md](./08-courses.md) |
| S09 | 游戏引擎共享层 | M3 | 11 | P0 | [09-game-engine.md](./09-game-engine.md) |
| S10 | 游戏专区（12 款 MVP 一次性首发）| M4 | 15 | P0 | [10-games.md](./10-games.md) |
| S11 | 小说阅读 | M4 | 10 | P0 | [11-novels.md](./11-novels.md) |
| S12 | 知语币与商城 | M5 | 10 | P0 | [12-economy.md](./12-economy.md) |
| S13 | 支付与订阅 | M5 | 10 | P0 | [13-payment.md](./13-payment.md) |
| S14 | 分销系统 | M5-M6 | 11 | P0 | [14-referral.md](./14-referral.md) |
| S15 | 客服 IM 与工单 | M6 | 10 | P0 | [15-customer-service.md](./15-customer-service.md) |
| S16 | AI 内容工厂 | v1.5 | 12 | P1 | [16-content-factory.md](./16-content-factory.md) |
| S17 | 管理后台 | M3-M5 | 12 | P0 | [17-admin.md](./17-admin.md) |
| S18 | 安全与合规 | M0-M6 | 10 | P0 | [18-security.md](./18-security.md) |
| S19 | 可观测与运维 | M0-M6 | 10 | P0 | [19-observability.md](./19-observability.md) |
| S20 | 上线与发布 | M6 | 10 | P0 | [20-launch.md](./20-launch.md) |

---

## 阶段（Milestones）执行汇总

| 阶段 | 周 | Sprint 并行 | 关键交付 |
|---|---|---|---|
| **M0**（4 周）| W1-W4 | S01 + S02 + S18(分散) + S19(分散) | 平台 / 设计系统 / 安全骨架 / 可观测 |
| **M1**（4 周）| W5-W8 | S03 + S04 + S05 | 账户 / i18n / App Shell |
| **M2**（6 周）| W9-W14 | S06 + S07 | 探索 / 学习引擎 |
| **M3**（6 周）| W15-W20 | S08 + S09 + S17(Phase A) | 课程 / 游戏引擎 / 后台 v1 |
| **M4**（6 周）| W21-W26 | S10(12 款) + S11 + S17(Phase B) | 12 游戏一次性首发 / 小说 / 后台 v2 |
| **M5**（6 周）| W27-W32 | S12 → S13 → S14 （严格串行） + S17(Phase C) | 经济 / 支付 / 分销 |
| **M6**（6 周）| W33-W38 | S15 + S20 + S18 终审 | 客服 / 上线 / 安全审计 |
| **总计** | **38 周** | | **v1 上线 4 国** |
| **v1.5** | M+3~M+4（8 周）| S16 AI 内容工厂 | 完整 12 stories（8 epic v1.5 增量项迁入 99-post-mvp-backlog）|
| **v2** | M+8~ | 游戏 / 社区 / IAP 等项 | 见 99-post-mvp-backlog.md |

---

## 跨 Epic 依赖图

```
S01(平台) ──┬─ S02(设计系统) ──┬─ S05(App Shell) ─── S06(发现)
            ├─ S03(账户) ──────┼─ S07(学习引擎) ─┬─ S08(课程)
            ├─ S04(i18n) ──────┘                 ├─ S11(小说)
            ├─ S18(安全) 贯穿                     └─ S09(游戏引擎) ── S10(游戏)
            └─ S19(可观测) 贯穿
                                       S12(经济) ── S13(支付) ── S14(分销)
                                       S17(后台) 贯穿 M3-M5
                                       S15(客服) M6
                                       S20(上线) M6 终
                                       S16(AI 工厂) v1.5
```

## 命名约定

- **Story Key**：`{epic}-{story}-{kebab-title}`，例：`1-1-init-monorepo`
- **Epic Key**：`epic-{N}`，例：`epic-1`
- **Retrospective Key**：`epic-{N}-retrospective`
- Story 文件位置：`planning/story/{NN}-{epic-slug}/{epic}-{story}-{kebab-title}.md`

## 状态字段

参考 [sprint-status.yaml](./sprint-status.yaml) 顶部注释。

## 工作流

1. **创建 Story**：`bmad-create-story`（已用于 E01）
2. **开发 Story**：`bmad-dev-story`
3. **代码评审**：`bmad-code-review`
4. **回顾**：`bmad-retrospective`（每 epic 结束）

# 知语 Zhiyu · Sprint 计划总览（Sprint Planning）

> **节奏**：2 周一个 Sprint
> **总时长**：38 周 = 19 sprints（M0-M6）
> **团队**：FE 4 / BE 3 / DevOps 1 / UI/UX 1 / QA 1.5 / PM 1
> **月度容量**：≈ 80 SP

---

## 阶段与 Sprint 映射

| Milestone | Sprints | 主题 |
|---|---|---|
| M0 基础 | S1-S2 | 平台 + 设计系统 |
| M1 账户 | S3-S4 | 用户 + i18n + App Shell |
| M2 内容 | S5-S7 | 探索 + 学习引擎 + 工厂 V0 |
| M3 课程游戏 | S8-S10 | 课程 + 游戏引擎 + 后台 v1 |
| M4 游戏小说 | S11-S13 | 5 游戏 + 小说 + 后台 v2 |
| M5 商业化 | S14-S16 | 经济 + 支付 + 工厂 v1 |
| M6 上线准备 | S17-S19 | 分销 + 客服 + 灰度上线 |

## Sprint 文件

| Sprint | 周期 | 文件 |
|---|---|---|
| S1 | M0 W1-W2 | [s01.md](./s01.md) |
| S2 | M0 W3-W4 | [s02.md](./s02.md) |
| S3 | M1 W1-W2 | [s03.md](./s03.md) |
| S4 | M1 W3-W4 | [s04.md](./s04.md) |
| S5 | M2 W1-W2 | [s05.md](./s05.md) |
| S6 | M2 W3-W4 | [s06.md](./s06.md) |
| S7 | M2 W5-W6 | [s07.md](./s07.md) |
| S8 | M3 W1-W2 | [s08.md](./s08.md) |
| S9 | M3 W3-W4 | [s09.md](./s09.md) |
| S10 | M3 W5-W6 | [s10.md](./s10.md) |
| S11 | M4 W1-W2 | [s11.md](./s11.md) |
| S12 | M4 W3-W4 | [s12.md](./s12.md) |
| S13 | M4 W5-W6 | [s13.md](./s13.md) |
| S14 | M5 W1-W2 | [s14.md](./s14.md) |
| S15 | M5 W3-W4 | [s15.md](./s15.md) |
| S16 | M5 W5-W6 | [s16.md](./s16.md) |
| S17 | M6 W1-W2 | [s17.md](./s17.md) |
| S18 | M6 W3-W4 | [s18.md](./s18.md) |
| S19 | M6 W5-W6 | [s19.md](./s19.md) |

## 跟踪

- `sprint-status.yaml` 实时进度
- 每 sprint 末 retrospective（参 `.github/skills/bmad-retrospective`）
- 每 milestone 末 demo + 决策

## SP 估算约定

| Size | SP | 工时 |
|---|---|---|
| S | 1-2 | < 1 天 |
| M | 3-5 | 1-3 天 |
| L | 8 | 3-5 天 |
| XL | 13 | 1+ 周（应拆） |

## Velocity 假设

- Team velocity (10 人) ≈ 80 SP / sprint
- 不饱和（80% 实际，20% buffer）
- 每 sprint 计划 ≈ 64 SP

## Definition of Done (Story)

- [ ] 代码 + 测试合入 main
- [ ] 文档更新
- [ ] PR review ≥ 1 approve
- [ ] CI 全绿
- [ ] 部署到 staging 验证
- [ ] PO accept

## Definition of Done (Sprint)

- [ ] 全部 committed stories 完成 or 明确推迟
- [ ] Demo 召开
- [ ] Retro 召开
- [ ] sprint-status.yaml 更新
- [ ] 下个 sprint 计划已成稿

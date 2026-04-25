# 实施前检查报告（Implementation Readiness Report）

> 基于 bmad-check-implementation-readiness · 生成时间：2026-04-25
> 范围：知语 Zhiyu v1（MVP）整体规划

## 一、文档完备性

| 文档 | 路径 | 状态 |
|---|---|---|
| PRD | planning/prds/00-index.md | ✅ 15 模块齐 |
| 架构 Spec | planning/spec/00-index.md | ✅ 12 文件 |
| UX 设计 | planning/ux/00-index.md | ✅ 16 文件 |
| Epics | planning/epics/00-index.md | ✅ 20 epics（19 in v1）|
| Sprints | planning/sprint/00-index.md | ✅ 19 sprints |
| Post-MVP backlog | planning/epics/99-post-mvp-backlog.md | ✅ |

## 二、本轮调整一览

| 调整项 | 状态 | 说明 |
|---|---|---|
| 邀请码不可见 / 不可改 | ✅ | RF-FR-001 + 02 API 移除 code/regenerate 接口 |
| 佣金 L1=L2=20% | ✅ | RF-FR-006 公式更新 |
| **佣金以 ZC 发放，不支持现金提现** | ✅ | RF-FR-008 改为自动入账；移除 withdrawals 表 / 提现 API |
| 内容工厂 → v1.5（手工写库为 MVP 路径）| ✅ | 14-content-factory/00-index 标 Post-MVP；E16 推迟 |
| Sprint 重排 | ✅ | s05-07/09/12 移除 ZY-16-xx；s16-17 重排 ZY-14-xx |
| spec/05 数据模型同步 | ✅ | commissions 改 amount_coins；删 withdrawals |
| spec/04 backend 同步 | ✅ | 12.1/12.2 更新 |
| 12-admin AC | ✅ | AD-AC-008/011 改写 |
| UX referral / coins | ✅ | 移除提现按钮；移除纯邀请码字符串展示 |

## 三、范围与优先级（v1）

### P0 必交付（Epic）
E01-E15, E17-E20（共 19 epics ≈ 196 stories）

### v1.5 推迟
- E16 内容工厂 12 stories（保留完整规划文档，进入 99-post-mvp-backlog）
- AI 助理 IM
- 高级会员档

## 四、依赖与风险

| 风险 | 严重度 | 应对 |
|---|---|---|
| 手工内容产能不足以支撑 4 国上线 | High | 提前 12 周外部翻译团队介入；M5 末验收"前 3 阶段 + 600 文章 + 50 章" |
| Paddle KYC 周期 4-6 周 | Medium | M0 启动；LemonSqueezy 备援 |
| 反作弊误伤分销 | Medium | 申诉流程 + 后台标记复审 |
| 佣金 ZC 通胀 | Medium | 单户分销 ZC 年上限 200,000；与 EC 50,000 上限解耦 |

## 五、INVEST 抽样核查

随机 10 stories 全部满足 INVEST：
- Independent：依赖明确标 Tech / Dependencies
- Negotiable：粒度合理，可商量
- Valuable：每个 story 有用户价值或技术价值
- Estimable：估算 S/M/L 已标
- Small：≤ 1 周
- Testable：AC 可验证

## 六、容量验证

```
team velocity ≈ 80 SP / sprint × 80% = 64 SP（实际计划）
19 sprints × 64 SP = 1216 SP 容量
当前计划 990 SP（占用 81%，buffer 19%）
```

✅ 计划在容量范围内，buffer 合理。

## 七、未决项（Tracker）

| ID | 项 | 责任人 | ETA |
|---|---|---|---|
| OPN-001 | 翻译外包供应商签约 | PM | M0 |
| OPN-002 | 律师 / 隐私 TOS 起草 | PM | M5 前 |
| OPN-003 | Paddle KYC 通过 | PM | M1 末 |
| OPN-004 | 4 轨道前 3 阶段内容人工产能确认 | PM + Content | M0 → M5 持续 |

## 八、结论

✅ **就绪**：可启动 S1（M0 W1）开发。

实施计划：见 [planning/sprint/](./sprint/) 各 sprint 文件。
迭代规则：每 sprint 末做 retro，更新 sprint-status.yaml。

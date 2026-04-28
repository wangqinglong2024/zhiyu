# CR-19 · 跨级购买流程

## PRD 原文引用

- `CR-FR-005`：“作为学习者，我希望登录后先试学每个主题 Stage 1-3 的全部章节，并可按需要跨级购买任意阶段（如电商 Stage 9）。”
- `01-structure-content.md` §4.2：“允许跨级购买任意轨道任意阶段，例如直接购买电商 Stage 9；购买后不强制补完前置阶段。”
- `04-data-model-api.md` §3 备注：“购买不检查 prerequisite_stage。”

## 需求落实

- 入口：
  1. 阶段总览页（`/learn/:track/:stage`）顶部“购买阶段”按钮（未购时）。
  2. 课程目录页（`/learn/courses-catalog`）显示全部 4 × 12 阶段卡片，可点击未购阶段。
  3. 付费墙弹窗内默认 SKU。
- API：复用 CR-18 `/api/payment/checkout/dummy`；context 参数标 `cross_stage`。
- 数据：`user_stage_purchases.purchase_type='single_stage'`。

## 状态逻辑

- 跨级购买不要求 `prerequisite_stage` 完成。
- 购买后立即跳转到该 stage 的总览页（CR-07）。
- UI 提示：若 prerequisite_stage 未完成，显示橙色信息条“建议先完成 Stage X 以获得更好学习体验”，但不阻塞。

## 不明确 / 风险

- 风险：跨级购买的用户可能直接做阶段考导致挫败感。
- 处理：阶段考入口仍要求 12 章 completed；建议先按章学习。

## 技术假设

- 课程目录页提供 ec/factory/hsk/daily 4 列网格，每列 12 阶段卡片。
- 已购阶段显示绿色 checkmark；未购显示价格 $4。

## 最终验收清单

- [ ] 用户在课程目录直接购买电商 Stage 9，权限立即生效。
- [ ] 阶段总览页未购显示“购买”CTA，已购隐藏。
- [ ] 跨级购买后阶段总览顶部出现“建议先完成 Stage X”信息条。
- [ ] 阶段考仍需 12 章 completed 才能解锁。
- [ ] 4 × 12 阶段卡片在目录页正确展示已购/未购状态。

# CR-29 · W0 内容上线门槛

## PRD 原文引用

- `01-structure-content.md` §4.1：“登录用户：每个主题 Stage 1-3 的全部章节完全免费试学。”
- §4.1：“W0 首发生产范围（前 3 阶段）与免费权限范围一致：每个主题 Stage 1-3 全部章免费。”
- `05-acceptance-criteria.md` §3：“W0 首发生产内容：4 主题 × 前 3 阶段全部上架；登录免费试学权限：每个主题 Stage 1-3 全部章节可学。”

## 需求落实

- W0 上线门槛检查脚本：`pnpm verify:courses-w0`。
- 校验项：
  1. 4 主题存在且 status=`active`。
  2. 每个主题 Stage 1-3 status=`published`。
  3. 每个主题 Stage 1-3 下全部 chapter `is_free=TRUE` 或可由 `stage_no <= 3` 权限算法放行，`free_reason='login_trial'`。
  4. 每个主题 Stage 4-12 默认 `is_free=FALSE`，除非 manual/promo 并有审计。
  5. 每个 published lesson ≥ 12 知识点（生产标准；MVP seed 可 5）。
  6. 节小测/章测/阶段考全部存在且题量达标。
  7. 每个 published lesson 的 4 语翻译 100% 覆盖。

## 状态逻辑

- 阻断条件：任一项失败 → 阻止 deployment。
- 放行：全部通过 → 标 `courses_w0_ready=true` 写 feature_flags。

## 不明确 / 风险

- 风险：内容生产由用户后续 AI 灌入，开发期不能阻止 dev 测试。
- 处理：`verify:courses-w0` 提供 `--dev` 标志，dev 模式只校验结构而非数量阈值。

## 技术假设

- 脚本输出 JSON 报告到 `system/log/w0-courses-<ts>.json`。
- 与 CI（本地 husky）集成可选。

## 最终验收清单

- [ ] dev 模式脚本通过 + 报告生成。
- [ ] 故意删除一个 Stage 2 Chapter 7 的免费标记或权限放行后脚本失败。
- [ ] 故意缺失一种语种翻译 → 失败。
- [ ] 全部通过 → feature flag `courses_w0_ready=true`。
- [ ] 文档 `system/docs/w0-courses-checklist.md` 列全部门槛。

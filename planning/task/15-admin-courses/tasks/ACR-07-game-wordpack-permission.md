# ACR-07 · 游戏词包权限摘要导出

## PRD 原文引用

- `04-data-model-api.md` §2.2 备注：“游戏模块复用该权限汇总生成可选词包范围。”
- `content/games/shared/01-unified-settings.md`：游戏词包按用户已解锁课程范围给。

## 需求落实

- API：`GET /admin/api/users/:id/wordpack-scope` 返回 `{tracks: [{code, accessible_stages: [stage_no]}]}`。
- 内部使用：游戏 backend `wordpack.builder.ts` 调用此摘要为该用户生成可选 wordpack 列表。
- 组件：WordpackScopePreview（用户详情页），可视化展示用户当前可玩词包范围。

## 状态逻辑

- accessible_stages 含：每主题 Stage 1-3 免费范围 + 已购 stage + 会员覆盖。
- 缓存：与 CR-17 共用 5min TTL。

## 不明确 / 风险

- 风险：跨级购买的孤立 stage 会导致词包跳跃（用户买 Stage 9 但未学 1-8）。
- 处理：词包生成时显示 “含进阶词，建议复习 Stage X”提示，但不阻止。

## 技术假设

- API 输出 JSON 紧凑，便于游戏后台快速消费。
- 后台预览面板按主题分行显示，内部 JSON 可保留 `tracks` 字段供游戏服务兼容。

## 最终验收清单

- [ ] API 返回正确的 accessible_stages。
- [ ] 游戏后台基于该摘要生成可选 wordpack。
- [ ] 用户详情页可看 wordpack 范围预览。
- [ ] 缓存失效与 CR-17 同步。

# DC-24 · 实现统一 Seed JSON Schema 与幂等导入

## PRD 原文引用

- `planning/rules.md`：“所有内容模块的种子 JSON 必须符合下面的统一字段约束。”
- `planning/rules.md`：“后端必须实现 `seed://` 协议解析。”
- `planning/rules.md`：“重复执行不报错、不重复插入，按 `slug` upsert。”

## 需求落实

- 页面：无直接页面，支撑 seed 与后台导入。
- 组件：无。
- API：可选后台手动导入入口；CLI `pnpm seed:discover-china`。
- 数据表：所有 DC 内容表与 Storage 桶 `images` / `audio`。
- 状态逻辑：JSON Schema 校验通过后才 upsert；`seed://` 上传替换为 public_url。
- CLI：统一支持 `pnpm seed:discover-china`、`pnpm seed:from-file <path.json>`，与后台导入共用 `packages/db/src/seed/upsert.ts`。
- JSONB：写入 translations、summary、key_points、audio 时必须使用项目已验证 raw postgres-json 方案，避免 Drizzle/postgres-js 双重编码。
- 校验：导入完成后抽查 `jsonb_typeof`、slug 幂等、`seed://` 资源替换、句子顺序和父级约束。

## 不明确 / 风险

- 风险：JSONB 写入可能被 ORM 双重编码。
- 处理：写入 JSONB 时使用已验证的 raw postgres-json 方案。

## 技术假设

- 与内容工厂共用 `packages/db/src/seed/upsert.ts`。

## 最终验收清单

- [ ] seed JSON Schema 校验失败时给出明确错误。
- [ ] 重复执行 seed 不产生重复数据。
- [ ] `seed://images/...` 和 `seed://audio/...` 被正确解析上传。
- [ ] 后台导入与 CLI 导入共用同一套 upsert 逻辑。
- [ ] JSONB 字段入库后保持 object/array 类型，不允许落成 JSON 字符串。
- [ ] `pnpm seed:from-file <path.json>` 可导入正式内容包并复用同一校验报告。
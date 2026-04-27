# ADC-08 · 实现 DC Seed / JSON 导入

## PRD 原文引用

- `planning/rules.md`：“发现中国 (DC) | 12 类目 × 每类 ≥ 3 篇 = ≥ 36 篇 articles。”
- `planning/rules.md`：“所有内容模块的种子 JSON 必须符合统一字段约束。”
- `AD-FR-007`：“v1 ... 仅提供手动导入工具入口（CSV/YAML）。”

## 需求落实

- 页面：`/admin/content/articles/import`。
- 组件：ContentImportWizard、ImportValidationReport。
- API：`POST /admin/api/content/discover/import`。
- 数据表：DC 内容表、content_review_workflow、admin_audit_logs。
- 状态逻辑：导入默认 draft/to_review；seed CLI 可直接写 published fixture。
- 格式：CSV/YAML 导入必须先转换为统一 JSON Schema，再调用 DC-24 的共用 upsert。
- CLI 兼容：后台导入与 `pnpm seed:discover-china`、`pnpm seed:from-file <path.json>` 使用同一校验、资源解析和 JSONB 写入逻辑。
- 资源：`seed://images/...` 可上传到自托管 Supabase Storage 并替换为 public URL；`seed://audio/...` 必须上传为私有对象并保存 storage key，由 DC audio proxy 运行时鉴权解析。
- 红线：导入预检必须调用 DC-22 红线规则引擎；阻断级命中不可导入为 published，只能进入 draft/rejected 或错误报告。

## 不明确 / 风险

- 风险：CSV/YAML 与统一 JSON Schema 冲突。
- 处理：后台先转换成统一 JSON Schema，再共用 upsert。

## 技术假设

- `seed://` 资源上传逻辑与 CLI 共用。

## 最终验收清单

- [ ] 导入前显示 schema 校验结果。
- [ ] 错误行可下载。
- [ ] 成功导入生成 draft/review 记录。
- [ ] 重复导入按 slug upsert。
- [ ] JSONB 字段导入后保持 object/array 类型，不落成字符串。
- [ ] 导入操作、错误报告下载、成功 upsert 均写审计。
- [ ] 导入报告包含红线命中、规则版本、阻断行和可复审的字段级原因。
# ZY-17-11 · 种子数据导入工具页（Seed Importer）

> Epic：E17 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md) §11（内容种子数据规则）

## User Story
**As a** 运营 / 管理员
**I want** 在管理后台上传 §11.3 JSON Schema 的种子文件，预览 → 一键 upsert 入库
**So that** 不必走 CLI 也能批量灌入文章 / 课程 / 游戏 / 小说 / 商品 / 用户；后续 AI 工厂（E16）走同一通路。

## 上下文
- 与 ZY-16-03 的 `pnpm seed:from-file <path.json>` 共用 `system/packages/db/src/seed/upsert.ts` 唯一 upsert 实现。
- 仅 admin role + 通过 RBAC 校验（接 ZY-17-03）的账号可访问。
- 大文件支持：≤ 50MB JSON，分块解析，进度条显示。

## 路由
- `/admin/tools/seed-import`（侧栏：工具 → 种子导入）

## API 契约
| Method | Path | 描述 |
|---|---|---|
| POST | `/admin/api/seed/preview` | multipart 上传 JSON；返回前 20 条预览 + 校验结果 |
| POST | `/admin/api/seed/commit`  | body `{module, items[], strategy:"upsert"}`；返回 `{inserted, updated, skipped, errors[]}` |
| POST | `/admin/api/seed/upload-asset` | 上传 `seed://` 引用的 image/audio 至 supabase-storage |

## Acceptance Criteria
- [ ] 页面包含：模块选择（discover-china / courses / games / novels / economy / user）+ 文件上传 + 预览表 + 提交按钮
- [ ] 上传后即时校验：`$schema_version`、`module` 必填、`items[].slug` 必填且唯一
- [ ] 错误条目高亮 + 错误原因；可勾选"忽略错误项继续"
- [ ] 提交走幂等 upsert（同 slug update，无则 insert），返回各计数
- [ ] 资产上传：`seed://images/<m>/<s>.webp` 自动从 zip 内对应路径或独立 multipart 上传至 supabase-storage `images` 桶，并把数据库字段替换为 public URL
- [ ] 操作写入 `audit_log`（接 ZY-17-10），含上传者 / 模块 / 数量
- [ ] 页面 i18n：zh-CN（主）+ en（备）
- [ ] 不走任何外部 SaaS；JSON 解析在 BE 端

## 与 CLI 的等价性
- `pnpm seed:from-file foo.json` 必须与本页面 commit 走同一 `upsert.ts`，行为完全一致
- 单测覆盖：构造同一 JSON 同时通过 CLI 与 API 提交 → 数据库结果应等价

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-admin-be pnpm vitest run admin.seed.import
docker compose exec zhiyu-admin-be pnpm seed:from-file /seed/_fixtures/discover-china-mini.json
```
- MCP Puppeteer：
  1. 登录 admin（admin@seed user，接 ZY-17-01 种子用户）
  2. 进入 `/admin/tools/seed-import` → 上传 `discover-china-mini.json`（5 篇）
  3. 预览成功 → 提交 → 结果显示 `inserted=5, updated=0`
  4. 再次提交同文件 → `inserted=0, updated=5`（幂等）

## DoD
- [ ] 6 个模块均可走通预览 + 提交
- [ ] CLI 与 admin UI 提交结果一致
- [ ] 种子内容在内容列表（ZY-17-06/07）中标记 `is_seed=true` 可筛选

## 依赖
- 上游：ZY-17-01（admin tables）/ ZY-17-03（RBAC）/ ZY-17-04（admin shell）/ ZY-16-03（CLI）
- 下游：所有内容模块 epic 的种子 DoD 都需要本工具

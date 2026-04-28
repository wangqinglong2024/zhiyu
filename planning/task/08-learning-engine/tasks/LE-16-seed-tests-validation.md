# LE-16 · Seed、测试与验收闭环

## 任务目标

为学习引擎提供最小 seed、Docker 内测试命令和端到端验收链路，确保没有真实大规模内容时也能完整验证。

## PRD / 规则原文引用

- `planning/rules.md`：“每个内容模块在交付时必须随 epic 提供 SQL/JSON 种子文件，并通过 drizzle-kit migrate + pnpm seed:<module> 一键灌入 dev 数据库”
- `planning/rules.md`：“下列模块的 epic Definition of Done 必须包含 ... pnpm seed:<module> 在干净的 dev 数据库上一次性跑通”
- `planning/prds/07-learning-engine/03-acceptance-criteria.md`：“关键测试用例 1. 用户 A 在节小测错题 X → SRS 即时含 X，state=learning, due=now”
- 同文件：“大量错题（500 张）查询 < 500ms”

## 需求拆解

- 复用课程 seed 中的题库，额外创建学习引擎测试用户、SRS cards、reviews、daily stats。
- 提供 `pnpm seed:learning` 或并入 `seed:all` 的学习引擎 seed。
- 编写单元测试：FSRS 映射、source 边界、streak 日期、resolved 规则。
- 编写集成测试：review today、rate、wrong-set、dashboard。
- 通过 MCP Puppeteer 验证前台：dashboard → review → rate → summary → wrong-set。
- 验证小说/发现中国阅读不会写入 SRS。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/me/dashboard`、`/learn/review`、`/learn/wrong-set`、`/learn/new`、`/learn/practice` |
| 组件 | 所有 LE 关键组件需要 loading/empty/error |
| API | 全部 `/api/le/*` 核心接口 |
| 数据表 | LE 表 + 课程题库 seed + 游戏 wrong/miss fixture |
| 状态逻辑 | seed → attempt → wrong入库 → review评分 → dashboard更新 |

## 内容规则与边界

- seed 的题目来自课程内容规范。
- 游戏 fixture 使用课程题库 itemId。
- 不为发现中国/小说创建复习 seed。

## 不明确 / 不支持 / 风险

- 学习引擎不是内容模块本体，但依赖课程/游戏内容 seed；需要在 seed 文档中声明依赖顺序。
- Docker-only 约束禁止主机直接 `pnpm dev` 作为验证路径。

## 技术假设

- 测试在 `system/` 内执行。
- MCP Puppeteer 直连 `http://115.159.109.23:3100` 和必要 API 端口。

## 验收清单

- [ ] `pnpm seed:learning` 或 `pnpm seed:all` 可在干净库跑通。
- [ ] 用户 A 课程错题 X 立即进入 SRS，state=learning, due=now。
- [ ] 游戏 wrong/miss 进入 SRS。
- [ ] 小说/发现中国交互不写 SRS。
- [ ] Docker 内单元/集成测试覆盖核心规则。
- [ ] MCP 完成 dashboard → review → wrong-set 主链路。

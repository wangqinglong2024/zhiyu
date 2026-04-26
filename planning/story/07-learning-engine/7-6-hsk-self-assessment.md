# ZY-07-06 · HSK 自评 / 入门测试

> Epic：E07 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 新用户
**I want** 一组简短问题自评我的 HSK 等级（0-6）
**So that** 平台为我推荐合适难度的课程与内容。

## 上下文
- 测试题库放 `system/packages/sdk/src/data/hsk-assessment.json`，约 30 题，按等级分布。
- 每题含 4 个 HSK 等级标签；逻辑按答对题的最高等级覆盖率计算 self_level。
- 结果回写 `profiles.hsk_self_level`，并触发推荐刷新。

## Acceptance Criteria
- [ ] 题库 + 计分算法（单测 5 个 fixture）
- [ ] FE `/onboarding/hsk` 页：进度条 + 选项卡片 + 完成结果
- [ ] 跳过支持（默认 0 级）
- [ ] 结果保存 → 推荐课程页 highlight

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run hsk.assessment
```
- MCP Puppeteer：走 30 题全错 → 0 级；全对 → ≥3 级

## DoD
- [ ] 算法单测全绿
- [ ] 写库 + 推荐刷新

## 依赖
- 上游：ZY-03-01
- 下游：ZY-07-07

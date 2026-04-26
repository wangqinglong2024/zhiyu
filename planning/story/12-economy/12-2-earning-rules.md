# ZY-12-02 · 获取规则（学习 / 任务 / 活动）

> Epic：E12 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 通过完成 lesson / SRS / 阅读 / 打卡等行为获得 ZC
**So that** 投入即有回报，正向循环。

## 上下文
- 规则放表 `zhiyu.coin_rules(code, delta, daily_cap, conditions jsonb, enabled)`
- 触发：业务在事件钩子调 `EconomyService.tryReward(userId, code, refs)`
- 反作弊：单日上限 + IP/设备指纹粗校验
- 默认规则种子：`lesson_done=10, srs_review_20=5, read_article=3, daily_checkin_d1=10..d7=70`

## Acceptance Criteria
- [ ] coin_rules 表 + 种子
- [ ] EconomyService.tryReward 实现 + daily_cap 检查
- [ ] admin 可视化编辑（接 ZY-17-08）
- [ ] 单测：超 cap 不发；规则禁用不发

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run economy.earn
```

## DoD
- [ ] 7 条种子规则生效
- [ ] 反作弊可阻挡

## 依赖
- 上游：ZY-12-01
- 下游：ZY-12-08 / 各业务事件

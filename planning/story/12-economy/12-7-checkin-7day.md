# ZY-12-07 · 7 日打卡

> Epic：E12 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 每日登录领取递增的 ZC 奖励，连签 7 天有大奖
**So that** 我每天都有打开 app 的小动力。

## 上下文
- 7 档：10 / 15 / 20 / 30 / 40 / 50 / 100（D7 大奖）
- 漏签 → 重置；可消耗补签卡（接 ZY-12-05）
- 时区按 user_settings 推算（默认 `Asia/Shanghai`）

## Acceptance Criteria
- [ ] `POST /api/v1/checkin` 当日仅一次成功
- [ ] FE 7 格子组件 + 当日高亮 + 已领灰
- [ ] 漏签提示 + 用补签卡按钮
- [ ] D7 完成弹窗庆祝

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run checkin
```

## DoD
- [ ] 7 日闭环
- [ ] 时区正确

## 依赖
- 上游：ZY-12-01 / ZY-12-02

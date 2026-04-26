# ZY-12-06 · 商城页与流水页

> Epic：E12 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 浏览商城商品并兑换；查看我的 ZC 账户流水与库存
**So that** 看清钱花在哪，下次更理性。

## 上下文
- 路由：`/shop`、`/me/wallet`
- 商城分 tab：装饰 / 卡片 / 解锁
- 流水：分页 + 类型筛选 + 时间范围；库存 tab 显示已购未用

## Acceptance Criteria
- [ ] `/shop` 列表 + 兑换确认弹窗 + 余额不足引导充值
- [ ] `/me/wallet` 余额卡 + 流水列表 + 库存
- [ ] 4 语 + RTL
- [ ] 离线缓存上次列表

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run shop.page wallet
```
- MCP Puppeteer：兑换 → 流水出现 → 库存出现

## DoD
- [ ] 兑换闭环
- [ ] 流水筛选正常

## 依赖
- 上游：ZY-12-01..05

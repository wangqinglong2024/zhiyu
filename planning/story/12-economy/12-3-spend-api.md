# ZY-12-03 · 消耗 API（章节 / 商品 / 道具）

> Epic：E12 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 用 ZC 解锁章节 / 兑换商品 / 购买道具时事务一致
**So that** 不出现"扣了币没解锁"或"解锁了没扣"。

## 上下文
- 统一入口：`POST /api/v1/economy/spend` { code, ref_type, ref_id, idem_key }
- 幂等：idem_key 唯一索引 + 已提交结果直接返回
- 失败回滚（事务 + 行锁）
- 业务方注册回调：`spendHooks[code]` 完成后侧效（如 chapter_unlock 写表）

## Acceptance Criteria
- [ ] spend 端点 + 幂等
- [ ] 钩子注册：chapter / shop_item / lesson_unlock / username_change / freeze_card
- [ ] 单测：并发同 idem_key 仅一次扣费
- [ ] 失败响应有 i18n message

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run economy.spend
```

## DoD
- [ ] 幂等 + 事务保证
- [ ] 5 hooks 注册完整

## 依赖
- 上游：ZY-12-01
- 下游：ZY-08-06 / ZY-11-05 / ZY-12-05 / ZY-03-04

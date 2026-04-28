> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 10.3 · 支付 · 验收准则

## 功能
- [ ] PY-AC-001：定价页 5 计划 + 促销 banner
- [ ] PY-AC-002：付费墙触发跳 Paddle Checkout
- [ ] PY-AC-003：支付成功 webhook 解锁权限
- [ ] PY-AC-004：webhook 验签 + 幂等 OK
- [ ] PY-AC-005：单段 / 9 段 / 月 / 年 解锁正确
- [ ] PY-AC-006：取消订阅 → 服务期至 expires_at
- [ ] PY-AC-007：自动续费 → expires_at 推
- [ ] PY-AC-008：续费失败 → 7 天宽限后停服
- [ ] PY-AC-009：7 天内退款自动批准
- [ ] PY-AC-010：退款 → 撤销权限 + 反向佣金
- [ ] PY-AC-011：订单列表 / 发票下载
- [ ] PY-AC-012：备份通道 feature flag 切换
- [ ] PY-AC-013：促销半年 $12 banner

## 非功能
- [ ] webhook P95 < 1s
- [ ] 支付成功到解锁 < 5s
- [ ] webhook 重发不重复处理
- [ ] 所有金额用 DECIMAL（避免浮点）

## 关键测试用例
1. 用户买月 $4 → Paddle Checkout → 成功 webhook → user_subscriptions active 30d
2. 同 webhook 重发 → 不重复处理（幂等）
3. 用户买单段 HSK 阶段 4 → user_stage_purchases (single_stage)，永久
4. 用户买 9 段 HSK → user_stage_purchases (nine_pack, track=hsk)
5. 取消月订阅 → status=canceled, expires_at 不变
6. 月订阅到期未续 → expires_at + 7d 后 stop
7. 7 天内申请退款 → 自动批 → 权限撤销 + 佣金 reversed
8. webhook 验签失败 → 拒绝处理 + 告警
9. Paddle 故障 → 切 LemonSqueezy（feature flag）→ 新订单走 LS

## 监控
- 月支付成功率 > 95%
- webhook 失败率 < 0.5%
- 退款率 < 5%
- ARPU / Churn 周环比

# T10-014: 集成验证 — 个人中心与支付全链路

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 3

## 需求摘要

对模块 10 所有任务（T10-001 ~ T10-013）进行全链路集成验证。验证核心业务流程：每日签到 → 知语币获取 → 课程购买 → Paddle 支付 → 课程解锁 → 知语币变动正确 → 退款 → 推荐返利回收。验证数据一致性、并发安全性、前后端联调完整性。

## 相关上下文

- 所有模块 10 任务: T10-001 ~ T10-013
- 测试规范: `grules/08-qa-testing.md` — 测试标准
- 任务流程: `grules/09-task-workflow.md` — 集成验证流程
- 产品需求: `product/apps/09-personal-payment/` — 全部 PRD 文件

## 技术方案

### 集成验证场景

#### 场景 1：完整购买流程

```
步骤 1: 新用户注册并绑定推荐码
  → 验证: referral_records 创建, status=registered

步骤 2: 用户每日签到 3 天
  → 验证: daily_checkins 3 条记录
  → 验证: user_coins.balance 增加（概率奖励之和）
  → 验证: coin_transactions 3 条 type='checkin'

步骤 3: 用户购买 Level 4 课程（使用 50 知语币抵扣）
  → 验证: 创建订单, 知语币扣除 50
  → 验证: Paddle Checkout 唤起（Sandbox）
  → 验证: Webhook 回调处理
  → 验证: 订单 status → paid
  → 验证: course_access 创建, is_active=true, expires_at 正确

步骤 4: 验证推荐返利
  → 验证: referral_records status → cooling, cooling_until 30天后
  → 验证: 冷却期到后执行定时任务
  → 验证: 双方各获 订单金额 × 20% 知语币

步骤 5: 验证退款流程
  → 验证: 订单 status → refunded
  → 验证: course_access is_active → false
  → 验证: 知语币退回（扣除的 50 币返还）
  → 验证: 推荐返利回收（冷却中 → cancelled / 已确认 → clawed_back）
  → 验证: 负数余额处理正确
```

#### 场景 2：签到全覆盖

```
步骤 1: 免费用户签到
  → 验证: multiplier = 1
  → 验证: 知语币增加 = base_reward

步骤 2: 付费用户签到
  → 验证: multiplier = 2
  → 验证: 知语币增加 = base_reward × 2

步骤 3: 重复签到
  → 验证: 返回 409 "今日已签到"

步骤 4: 连续签到天数
  → 验证: 连续签到 streak_days 正确递增
  → 验证: 中断一天后 streak_days 重置为 1

步骤 5: 签到概率分布验证
  → 100 次签到抽样（测试用，不检查今日限制）
  → 验证: 各奖励出现频率与配置概率大致吻合（允许 ±10% 偏差）
```

#### 场景 3：并发安全

```
步骤 1: 并发扣减知语币
  → 5 个并发请求各扣 100 知语币
  → 验证: 仅扣除总量正确，无超扣
  → 验证: 余额 = 初始 - 实际成功扣除数 × 100

步骤 2: 幂等性验证
  → 相同 idempotency_key 发送 3 次
  → 验证: 仅执行 1 次，余额变动 1 次

步骤 3: 并发签到
  → 2 个并发签到请求
  → 验证: 仅 1 个成功，1 个返回 409
```

#### 场景 4：前端 UI 全链路

```
步骤 1: 个人中心首页
  → 验证: 头像/昵称/段位/统计卡片正确展示
  → 验证: 知语币余额实时正确
  → 验证: 课程到期红点正确

步骤 2: 知语币页面
  → 验证: 余额 + 交易记录一致
  → 验证: 收入/支出筛选正确

步骤 3: 购买流程
  → 验证: 价格计算正确（原价/折扣/抵扣/实付）
  → 验证: Paddle Checkout 唤起成功（Sandbox）
  → 验证: 支付结果页正确展示

步骤 4: 设置页
  → 验证: 主题切换生效
  → 验证: 语言切换生效

步骤 5: 跨模块数据一致性
  → 签到后: 个人中心统计 + 知语币页面余额 + 交易记录三处一致
  → 购买后: 我的课程 + 知语币余额 + 订单历史三处一致
```

#### 场景 5：边界与异常

```
步骤 1: 知语币上限
  → 充值到 99,900 币 → 签到获 200 币
  → 验证: 余额不超过 100,000
  → 验证: 或返回错误

步骤 2: 负数余额
  → 用户余额 50，推荐返利 120 需回收
  → 验证: 余额变为 -70（允许负数）

步骤 3: 过期课程
  → 设置课程 expires_at 为过去时间
  → 验证: 课程列表显示"已到期" + 续费按钮
  → 验证: 续费价格为 20% 折扣

步骤 4: 网络异常
  → 模拟 API 超时/500 错误
  → 验证: 前端显示错误提示 + 重试按钮
  → 验证: 数据不会重复提交（幂等保护）
```

### 数据一致性检查 SQL

```sql
-- 知语币余额 vs 交易记录一致性
SELECT u.user_id, u.balance,
  COALESCE(SUM(t.amount), 0) AS sum_transactions,
  u.balance - COALESCE(SUM(t.amount), 0) AS diff
FROM public.user_coins u
LEFT JOIN public.coin_transactions t ON u.user_id = t.user_id
GROUP BY u.user_id, u.balance
HAVING u.balance != COALESCE(SUM(t.amount), 0);
-- 期望: 0 行返回

-- 订单金额 vs 知语币扣除一致性
SELECT o.id, o.coin_deduct_amount,
  COALESCE((
    SELECT -amount FROM public.coin_transactions
    WHERE reference_id = o.id::text AND type = 'course_purchase'
  ), 0) AS actual_deduct
FROM public.orders o
WHERE o.coin_deduct_amount > 0
  AND o.coin_deduct_amount != COALESCE((
    SELECT -amount FROM public.coin_transactions
    WHERE reference_id = o.id::text AND type = 'course_purchase'
  ), 0);
-- 期望: 0 行返回
```

## 范围（做什么）

- 执行 5 大场景的集成验证
- 编写自动化测试脚本（可复用）
- 执行数据一致性 SQL 检查
- 编写完整的验证报告（含截图/日志）

## 边界（不做什么）

- 不修复本任务发现的 Bug（记录后由对应任务修复）
- 不进行性能压测（另行安排）
- 不进行安全渗透测试（另行安排）

## 涉及文件

- 新建: `tests/integration/personal-payment/full-flow.test.ts`
- 新建: `tests/integration/personal-payment/concurrency.test.ts`
- 新建: `tests/integration/personal-payment/data-consistency.sql`

## 依赖

- 前置: T10-001 ~ T10-013（所有模块 10 任务完成）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 全新测试环境 WHEN 执行完整购买流程 THEN 从签到→购买→支付→解锁全链路成功
2. GIVEN 推荐关系已建立 WHEN 被推荐人购课后 30 天冷却期过 THEN 双方知语币正确发放
3. GIVEN 退款发生 WHEN 推荐返利已确认 THEN 双方知语币正确回收（允许负数）
4. GIVEN 5 个并发扣币请求 WHEN 同时执行 THEN 余额正确无超扣
5. GIVEN 相同 idempotency_key WHEN 重复发送 3 次 THEN 仅执行 1 次
6. GIVEN 签到 → 购买 → 退款全流程后 WHEN 执行数据一致性 SQL THEN 0 行不一致记录
7. GIVEN 前端个人中心 WHEN 签到后刷新 THEN 余额/交易记录/统计卡片三处数据一致
8. GIVEN Paddle Sandbox WHEN 完成支付 THEN Webhook 正确处理，订单状态正确
9. GIVEN Light/Dark 模式 WHEN 全流程截图 THEN 所有页面 UI 符合 Cosmic Refraction 设计
10. GIVEN 知语币余额 50 WHEN 回收推荐返利 120 THEN 余额变为 -70，负数警告 Banner 显示

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. 清理测试数据，初始化干净环境
3. 按顺序执行 5 大场景测试
4. 执行数据一致性 SQL 检查
5. Browser MCP 截图验证前端页面
6. 导出完整测试日志

### 测试通过标准

- [ ] 场景 1（完整购买流程）全部通过
- [ ] 场景 2（签到全覆盖）全部通过
- [ ] 场景 3（并发安全）全部通过
- [ ] 场景 4（前端 UI 全链路）全部通过
- [ ] 场景 5（边界与异常）全部通过
- [ ] 数据一致性 SQL 检查 0 行不一致
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现 Bug → 记录详细复现步骤 + 截图 → 关联到对应 T10-xxx 任务
- 阻塞性 Bug → 停止后续验证，先修复
- 非阻塞性 Bug → 记录后继续验证

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-014-integration-verification.md`

### 结果报告模板

```markdown
# T10-014 集成验证结果

## 测试环境
- Docker 版本: xxx
- Node.js 版本: xxx
- 测试时间: xxx

## 测试结果概览
| 场景 | 状态 | 备注 |
|------|------|------|
| 场景 1: 完整购买流程 | ✅/❌ | |
| 场景 2: 签到全覆盖 | ✅/❌ | |
| 场景 3: 并发安全 | ✅/❌ | |
| 场景 4: 前端 UI 全链路 | ✅/❌ | |
| 场景 5: 边界与异常 | ✅/❌ | |
| 数据一致性检查 | ✅/❌ | |

## 发现问题
| # | 严重度 | 描述 | 关联任务 | 状态 |
|---|--------|------|----------|------|
| 1 | | | | |

## 截图证据
（附各页面截图）

## 结论
□ 全部通过，模块 10 可交付
□ 存在问题，需修复后重新验证
```

## 自检重点

- [ ] 数据一致性：知语币余额 = 所有交易之和
- [ ] 并发安全：SELECT...FOR UPDATE 行锁有效
- [ ] 幂等性：idempotency_key 去重有效
- [ ] 全链路：签到→购买→支付→解锁→退款→回收完整
- [ ] UI 一致：前端数据与后端 API 返回一致
- [ ] 无残留：测试数据可清理，不影响其他模块

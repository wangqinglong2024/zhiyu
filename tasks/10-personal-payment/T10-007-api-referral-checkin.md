# T10-007: 后端 API — 推荐与签到

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

实现推荐码系统和每日签到的后端 API。推荐码：生成/查询推荐码、验证推荐码（注册时绑定）、推荐记录列表、冷却期到账定时任务（30 天无退款后发放知语币）。签到：每日签到（概率分布抽奖）、签到日历查询、付费用户双倍奖励、连续签到天数追踪。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/06-referral.md` — 推荐返利系统完整 PRD
- 产品需求: `product/apps/09-personal-payment/04-zhiyu-coins.md` — 签到作为获取途径
- 产品总纲: `product/00-product-overview.md` §五.2 — 推荐 20% 返利、签到概率分布
- API 规约: `grules/04-api-design.md` — RESTful 设计规范
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 关联任务: T10-002（推荐 Schema）、T10-003（签到 Schema）→ 本任务 → T10-011（前端签到/推荐）

## 技术方案

### API 设计 — 推荐系统

#### 1. 查询我的推荐码

```
GET /api/v1/referrals/my-code
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "data": {
    "code": "ZY-A8K3M7",
    "referral_link": "https://zhiyu.app/r/ZY-A8K3M7",
    "total_referrals": 5,
    "total_rewards": 600,
    "qrcode_url": "/api/v1/referrals/qrcode/ZY-A8K3M7"
  }
}
```

#### 2. 验证推荐码

```
POST /api/v1/referrals/verify
Body: { "code": "ZY-A8K3M7" }

Response 200:
{
  "code": 0,
  "data": {
    "valid": true,
    "referrer_nickname": "知**生"
  }
}
```

#### 3. 绑定推荐关系（注册后 7 天内）

```
POST /api/v1/referrals/bind
Authorization: Bearer <jwt>
Body: { "code": "ZY-A8K3M7" }

Response 200:
{ "code": 0, "message": "推荐码绑定成功" }
```

**绑定规则**：
- 注册后 7 天内可绑定
- 不可绑定自己的推荐码
- 不可重复绑定
- 推荐码必须有效

#### 4. 查询推荐记录列表

```
GET /api/v1/referrals/records?page=1&page_size=20
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "referred_nickname": "知**生",
        "course_level": 4,
        "reward_coins": 120,
        "status": "confirmed",
        "created_at": "2026-03-15"
      }
    ],
    "total": 5,
    "page": 1,
    "page_size": 20,
    "has_next": false
  }
}
```

#### 5. 冷却期到账定时任务

```
// 定时任务：每小时执行一次
// 查找 status='cooling' 且 cooling_until <= now() 的记录
// 确认无退款 → 发放知语币到推荐人和被推荐人 → status='confirmed'
```

### API 设计 — 每日签到

#### 6. 执行签到

```
POST /api/v1/checkins/today
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "data": {
    "base_reward": 3,
    "multiplier": 2,
    "final_reward": 6,
    "streak_days": 7,
    "is_paid_user": true,
    "new_balance": 326
  }
}
```

**签到逻辑**：
1. 检查今日是否已签到 → 已签到返回 409
2. 调用 `draw_checkin_reward()` 抽取基础奖励
3. 判断付费用户 → 倍率 2（双倍），否则 1
4. 计算连续签到天数（查昨日是否有签到记录）
5. 写入 `daily_checkins` 记录
6. 调用 `change_user_coins` 发放知语币（idempotency_key: `checkin:{user_id}:{date}`）

#### 7. 查询签到日历

```
GET /api/v1/checkins/calendar?year=2026&month=4
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "data": {
    "year": 2026,
    "month": 4,
    "today_checked": true,
    "current_streak": 7,
    "days": [
      { "date": "2026-04-01", "checked": true, "reward": 2 },
      { "date": "2026-04-02", "checked": true, "reward": 6 },
      { "date": "2026-04-03", "checked": false }
    ]
  }
}
```

#### 8. 查询今日签到状态

```
GET /api/v1/checkins/today
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "data": {
    "checked": true,
    "reward": 6,
    "streak_days": 7
  }
}
```

### 昵称脱敏工具

```typescript
function maskNickname(nickname: string): string {
  if (nickname.length <= 1) return nickname + '**'
  if (nickname.length === 2) return nickname[0] + '**' + nickname[1]
  return nickname[0] + '**' + nickname[nickname.length - 1]
}
```

## 范围（做什么）

- 实现推荐码查询/验证/绑定 API
- 实现推荐记录列表 API
- 实现冷却期到账定时任务（30 天检查）
- 实现每日签到 API（概率抽取 + 付费双倍 + 连续天数）
- 实现签到日历查询 API
- 实现昵称脱敏工具
- Zod 验证 Schema

## 边界（不做什么）

- 不实现推荐里程碑奖励领取（P1 功能，后续迭代）
- 不实现推荐二维码图片生成（前端 canvas 生成）
- 不实现前端页面（T10-011）

## 涉及文件

- 新建: `src/routes/referral-routes.ts`
- 新建: `src/routes/checkin-routes.ts`
- 新建: `src/services/referral-service.ts`
- 新建: `src/services/checkin-service.ts`
- 新建: `src/validators/referral-validators.ts`
- 新建: `src/validators/checkin-validators.ts`
- 新建: `src/utils/nickname-mask.ts`
- 新建: `src/jobs/referral-cooling-job.ts` — 冷却期定时任务
- 修改: `src/repositories/referral-repository.ts` — 补充查询方法
- 修改: `src/repositories/checkin-repository.ts` — 补充查询方法
- 修改: `src/routes/index.ts` — 注册路由

## 依赖

- 前置: T10-002（推荐 Schema）、T10-003（签到 Schema）
- 后续: T10-011（前端签到/推荐页面）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 已登录用户 WHEN GET `/api/v1/referrals/my-code` THEN 返回格式为 `ZY-XXXXXX` 的推荐码及统计数据
2. GIVEN 有效推荐码 WHEN POST `/api/v1/referrals/verify` THEN 返回 `valid=true` + 脱敏昵称
3. GIVEN 注册 3 天内的用户 WHEN POST `/api/v1/referrals/bind` 绑定有效推荐码 THEN 绑定成功
4. GIVEN 注册超过 7 天的用户 WHEN POST `/api/v1/referrals/bind` THEN 返回 400 错误"推荐码绑定期限已过"
5. GIVEN 用户尝试绑定自己的推荐码 WHEN POST `/api/v1/referrals/bind` THEN 返回 400 错误
6. GIVEN 今日未签到的免费用户 WHEN POST `/api/v1/checkins/today` THEN 返回 `multiplier=1`，知语币增加 `base_reward` 数量
7. GIVEN 今日未签到的付费用户 WHEN POST `/api/v1/checkins/today` THEN 返回 `multiplier=2`，知语币增加 `base_reward × 2`
8. GIVEN 今日已签到 WHEN POST `/api/v1/checkins/today` THEN 返回 409 "今日已签到"
9. GIVEN 昨日已签到、今日签到 WHEN 查看结果 THEN `streak_days` = 昨日 streak + 1
10. GIVEN 推荐记录 cooling_until 已过期 WHEN 定时任务执行 THEN 知语币发放到双方账户，记录 status=confirmed
11. GIVEN 冷却期内订单已退款 WHEN 定时任务执行 THEN 跳过该记录（status 已被退款流程改为 cancelled）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. 测试推荐码生成、验证、绑定全流程
3. 测试签到（概率分布、付费双倍、连续天数）
4. 测试签到日历查询
5. 测试冷却期定时任务
6. 验证昵称脱敏

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 推荐码全流程正常
- [ ] 签到概率分布合理
- [ ] 付费用户双倍正确
- [ ] 连续签到天数正确
- [ ] 冷却期定时任务正常
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-007-api-referral-checkin.md`

## 自检重点

- [ ] 安全：推荐码绑定有时间窗口限制（7 天）
- [ ] 幂等：签到 idempotency_key = `checkin:{user_id}:{date}`
- [ ] 概率分布：签到奖励精确实现 PRD 定义的概率
- [ ] 付费用户判断：正确判断用户是否有付费课程
- [ ] 脱敏：推荐记录中昵称正确脱敏

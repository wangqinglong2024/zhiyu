# T04-009: 后端 API — SRS 间隔复习

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 6

## 需求摘要

实现 SRS（间隔重复）复习系统的 API，包括：获取今日待复习项目（按优先级排序）、提交复习结果（记住/忘记 → 更新间隔阶段）、获取复习统计（今日完成数/剩余数/正确率）、手动添加复习项。核心算法基于 Ebbinghaus 遗忘曲线，间隔阶段为 [1, 2, 4, 7, 15, 30] 天，连续记住 6 次即毕业。每日上限 50 条，超期 7 天未复习的项目重置到阶段 0。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/06-srs-review.md`（SRS 复习完整 PRD）
- 产品需求: `product/apps/03-course-learning/06-srs-review.md` §二.2（间隔算法参数）
- 产品需求: `product/apps/03-course-learning/06-srs-review.md` §三.2（毕业规则 — 连续记住 6 次）
- 产品需求: `product/apps/03-course-learning/06-srs-review.md` §三.3（超期重置规则 — 7 天）
- 产品需求: `product/apps/03-course-learning/06-srs-review.md` §三.4（每日上限 50 条）
- 设计规范: `grules/04-api-design.md`（统一响应格式）
- 设计规范: `grules/05-coding-standards.md` §三（三层分离）
- 关联任务: T04-004（SRS 数据表）→ 本任务 → T04-014（SRS 复习页前端）

## 技术方案

### API 设计

#### 1. 获取今日待复习项目

```
GET /api/v1/srs/due-items
鉴权级别: 1（需登录）
```

查询参数:
```
?limit=20      // 每批获取数量，默认 20
&module=vocab  // 可选：按模块过滤（vocab/grammar/idiom）
```

业务规则:
```
查询条件:
  user_id = 当前用户
  status = 'active'
  next_review_at <= now()
  
排序优先级:
  1. 超期天数最多的优先（next_review_at ASC）
  2. 同一天到期的按 interval_stage ASC（低阶段优先）

超期重置:
  next_review_at + 7天 < now() → interval_stage 重置为 0

每日上限检查:
  今日已复习数 ≥ daily_max(50) → 返回空列表 + "今日已达上限"
```

响应:
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "source_type": "vocabulary",
        "source_id": "word-uuid",
        "card_front": { "hanzi": "你好", "pinyin": "nǐ hǎo" },
        "card_back": { "meaning_en": "Hello", "example": "你好，你叫什么名字？" },
        "interval_stage": 2,
        "next_interval_days": 4,
        "correct_streak": 2,
        "is_overdue": false,
        "overdue_days": 0
      }
    ],
    "total_due": 12,
    "daily_remaining": 38,
    "daily_max": 50
  }
}
```

#### 2. 提交复习结果

```
POST /api/v1/srs/items/:itemId/review
鉴权级别: 1（需登录）
```

请求体:
```json
{
  "result": "remembered",
  "time_ms": 3500
}
```

业务规则（间隔算法）:
```
result = "remembered":
  correct_streak += 1
  wrong_streak = 0
  interval_stage = min(interval_stage + 1, 5)  // 最大阶段 5（对应 30 天）
  next_review_at = now() + INTERVALS[interval_stage] 天
  
  if correct_streak >= graduation_streak(6):
    status = 'graduated'  // 毕业，不再出现在复习队列

result = "forgotten":
  wrong_streak += 1
  correct_streak = 0
  interval_stage = max(interval_stage - 1, 0)
  next_review_at = now() + INTERVALS[interval_stage] 天
  
  if wrong_streak >= 3:
    interval_stage = 0  // 重置到起始

INTERVALS = [1, 2, 4, 7, 15, 30]  // 天数
```

响应:
```json
{
  "code": 0,
  "data": {
    "new_interval_stage": 3,
    "next_review_at": "2025-01-15T00:00:00Z",
    "next_interval_days": 7,
    "correct_streak": 3,
    "is_graduated": false,
    "daily_reviewed": 13,
    "daily_remaining": 37
  }
}
```

#### 3. 获取复习统计

```
GET /api/v1/srs/stats
鉴权级别: 1（需登录）
```

响应:
```json
{
  "code": 0,
  "data": {
    "today": {
      "total_due": 12,
      "reviewed": 8,
      "remaining": 4,
      "accuracy": 87.5,
      "daily_limit": 50
    },
    "overall": {
      "total_items": 450,
      "active": 380,
      "graduated": 60,
      "suspended": 10,
      "average_accuracy": 82.3
    },
    "streak": {
      "current_days": 7,
      "longest_days": 15
    }
  }
}
```

#### 4. 手动添加复习项

```
POST /api/v1/srs/items
鉴权级别: 1（需登录）
```

请求体:
```json
{
  "source_type": "vocabulary",
  "source_id": "word-uuid",
  "card_front": { "hanzi": "谢谢", "pinyin": "xiè xie" },
  "card_back": { "meaning_en": "Thank you", "example": "谢谢你的帮助。" }
}
```

业务规则:
- 防重复：同一 user + source_type + source_id 只能有一个 active 状态的项
- 初始状态: interval_stage = 0, next_review_at = now() + 1 天

### 三层架构

```
Router: src/routers/v1/srs.ts
Service: src/services/srs-service.ts
Repository: src/repositories/srs-repository.ts
```

### 间隔算法封装

```typescript
// src/services/srs-algorithm.ts — 纯函数，便于单元测试
export const SRS_INTERVALS = [1, 2, 4, 7, 15, 30] as const

export interface SrsUpdateResult {
  newStage: number
  nextReviewAt: Date
  correctStreak: number
  wrongStreak: number
  isGraduated: boolean
}

export function calculateNextReview(
  currentStage: number,
  correctStreak: number,
  wrongStreak: number,
  result: 'remembered' | 'forgotten',
  graduationStreak: number = 6,
  overdueResetDays: number = 7
): SrsUpdateResult {
  // ... 算法实现
}
```

## 范围（做什么）

- 实现 4 个 SRS API 端点
- 封装间隔复习算法为纯函数（`srs-algorithm.ts`）
- 实现超期重置逻辑
- 实现每日上限控制
- 实现毕业判断
- 三层分离

## 边界（不做什么）

- 不实现课时完成自动添加复习项的触发逻辑（T04-006 中实现，本任务提供添加接口）
- 不实现前端复习卡片翻转动画
- 不实现复习提醒推送通知
- 不实现 SRS 配置管理后台

## 涉及文件

- 新建: `backend/src/routers/v1/srs.ts`
- 新建: `backend/src/services/srs-service.ts`
- 新建: `backend/src/services/srs-algorithm.ts` — 纯算法函数
- 新建: `backend/src/repositories/srs-repository.ts`
- 修改: `backend/src/models/srs-review.ts` — 扩展 Zod Schema + API 请求/响应类型（T04-004 已新建基础类型）
- 修改: `backend/src/routers/v1/index.ts` — 注册 SRS 路由

## 依赖

- 前置: T04-004（SRS 数据表 — srs_review_items, srs_review_logs, srs_config）
- 前置: T04-006（课时完成后调用添加接口 — 提供接口被调用）
- 后续: T04-014（SRS 复习页前端）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户有 12 个到期复习项 **WHEN** `GET /srs/due-items` **THEN** 按超期天数排序返回，`total_due = 12`
2. **GIVEN** 复习项 interval_stage = 2 **WHEN** 提交 result = remembered **THEN** interval_stage = 3，next_review_at = now() + 7 天
3. **GIVEN** 复习项 interval_stage = 2 **WHEN** 提交 result = forgotten **THEN** interval_stage = 1，next_review_at = now() + 2 天
4. **GIVEN** 连续 3 次 forgotten **WHEN** 提交 result = forgotten **THEN** interval_stage 重置为 0
5. **GIVEN** correct_streak = 5 **WHEN** 提交 result = remembered **THEN** correct_streak = 6，status = graduated（毕业）
6. **GIVEN** next_review_at 超期 8 天 **WHEN** `GET /due-items` **THEN** 该项 interval_stage 已重置为 0
7. **GIVEN** 今日已复习 50 条 **WHEN** `GET /due-items` **THEN** 返回空列表 + daily_remaining = 0
8. **GIVEN** 用户手动添加词汇 **WHEN** `POST /srs/items` **THEN** 创建 active 复习项，next_review_at = 明天
9. **GIVEN** 重复添加同一词汇 **WHEN** `POST /srs/items` **THEN** 返回 409（已存在 active 项）
10. **GIVEN** 用户复习了 8 条 **WHEN** `GET /srs/stats` **THEN** today.reviewed = 8, today.accuracy 正确计算

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 通过 curl 添加复习项
3. 模拟时间推移（直接更新 next_review_at 到过去时间）
4. 获取到期项目列表
5. 提交复习结果，验证间隔更新
6. 测试超期重置
7. 测试每日上限
8. 测试毕业逻辑

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 4 个 API 端点正常响应
- [ ] 间隔算法正确（阶段递进/回退/重置）
- [ ] 毕业逻辑正确（连续记住 6 次）
- [ ] 超期重置正确（7 天未复习）
- [ ] 每日上限正确（50 条）
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-009-api-srs-review.md`

## 自检重点

- [ ] 安全: authMiddleware 守卫
- [ ] 安全: 用户只能操作自己的复习项
- [ ] 性能: 到期项查询有索引（idx_sri_user_due）
- [ ] 算法: 纯函数封装，可单独测试
- [ ] 三层分离: 算法在独立文件

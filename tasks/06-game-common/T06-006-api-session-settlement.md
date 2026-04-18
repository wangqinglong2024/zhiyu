# T06-006: 后端 API — 游戏会话与结算

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 8+

## 需求摘要

实现游戏会话生命周期管理和服务端结算系统。包括创建/结束游戏会话、服务端出题与计分（防作弊核心）、段位星数变更计算、晋级/掉段判定、保护机制（新手保护 10 局 + 晋级保护 3 局）、知语币奖励（PK 5 连胜奖 1 币）、逃跑处理。所有计分和段位变更必须在服务端完成，客户端不可干预。

## 相关上下文

- 产品需求: `product/apps/05-game-common/04-settlement.md` — 完整结算 PRD（胜利/失败/单人结算、段位动画、知识点回顾）
- 产品需求: `product/apps/05-game-common/05-rank-system.md` — 段位规则（**核心依据**）
  - §二 胜负规则: +1/-1 星、多人对战排名规则、最低段位保护
  - §三 晋级规则: 小段/大段晋级条件
  - §四 掉段规则: 小段/大段掉段条件（掉段后为上一小段满星数 -1）
  - §五 保护机制: 新手保护 10 局、晋级保护 3 局
  - §八 赛季机制: 5 连胜奖 1 知语币
  - §九 王者特殊规则: 积分制
- 产品需求: `product/apps/05-game-common/08-hud-landscape.md` §四 — 逃跑惩罚（判负+扣星+记录）
- 游戏规则: `game/00-index.md` — 防作弊：服务端出题+服务端计分+时间校验
- 编码规范: `grules/05-coding-standards.md` — 事务、乐观锁/悲观锁
- 关联任务: T06-002 → 本任务 → T06-011（前端结算页）

## 技术方案

### API 设计

#### 1. 创建游戏会话（匹配成功后由匹配系统调用）

```
POST /api/v1/game-sessions
Headers: Authorization: Bearer {token} (内部调用或系统 token)
Body: {
  "game_id": "uuid",
  "mode": "pk_1v1",
  "player_ids": ["uuid1", "uuid2"],
  "ai_match": false
}

Response 201:
{
  "code": 0,
  "message": "success",
  "data": {
    "session_id": "uuid",
    "questions": [...],  // 服务端预生成的题目集合（防作弊）
    "game_config": {...}
  }
}
```

#### 2. 提交答题结果（游戏过程中逐题/逐轮提交）

```
POST /api/v1/game-sessions/:sessionId/answers
Headers: Authorization: Bearer {token}
Body: {
  "question_id": "uuid",
  "answer": "...",
  "client_timestamp": 1714000000000
}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "correct": true,
    "score_delta": 100,
    "current_score": 500,
    "server_timestamp": 1714000000050
  }
}
```

#### 3. 结束游戏会话（游戏结束时调用）

```
POST /api/v1/game-sessions/:sessionId/finish
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "session_id": "uuid",
    "results": [
      {
        "user_id": "uuid",
        "score": 850,
        "rank_position": 1,
        "is_winner": true,
        "star_change": 1,
        "before_rank": { "tier": "gold", "sub_tier": "II", "stars": 3, "total_stars": 27 },
        "after_rank": { "tier": "gold", "sub_tier": "II", "stars": 4, "total_stars": 28 },
        "is_promotion": false,
        "is_demotion": false,
        "coin_reward": 0,
        "knowledge_points": [
          { "point": "奋不顾身", "correct": true },
          { "point": "破釜沉舟", "correct": false, "detail": "..." }
        ]
      }
    ]
  }
}
```

#### 4. 处理逃跑退出

```
POST /api/v1/game-sessions/:sessionId/escape
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "star_change": -1,
    "escape_count_season": 5,
    "penalty_info": "匹配等待时间增加 30 秒"
  }
}
```

### 段位计算核心逻辑

```typescript
// 星数变更计算
function calculateStarChange(params: {
  mode: string
  isWinner: boolean
  rankPosition?: number  // 多人模式排名
  isAiMatch: boolean
  isEscape: boolean
  currentTotalStars: number
  newbieProtectionRemaining: number
  promotionProtectionRemaining: number
  escapeCountSeason: number
}): {
  starChange: number
  newTotalStars: number
  isPromotion: boolean
  isDemotion: boolean
  coinReward: number
} {
  // AI 对战 / 单人模式 → 不变
  if (params.isAiMatch || params.mode.startsWith('solo')) {
    return { starChange: 0, newTotalStars: params.currentTotalStars, isPromotion: false, isDemotion: false, coinReward: 0 }
  }
  
  let starChange = 0
  
  // PK 胜负判定
  if (params.isEscape) {
    // 逃跑: 7+ 次双倍扣星
    starChange = params.escapeCountSeason >= 7 ? -2 : -1
  } else if (params.mode === 'pk_1v1') {
    starChange = params.isWinner ? 1 : -1
  } else if (params.mode === 'pk_multi') {
    // 多人: 第1名 +1, 第2名 0, 第3名+ -1
    if (params.rankPosition === 1) starChange = 1
    else if (params.rankPosition === 2) starChange = 0
    else starChange = -1
  }
  
  // 保护机制
  if (starChange < 0 && params.newbieProtectionRemaining > 0) {
    starChange = 0  // 新手保护：不扣星
  }
  
  // 最低保护：青铜 III 1 星不再扣
  const newTotalStars = Math.max(1, params.currentTotalStars + starChange)
  
  // 晋级/掉段判定（通过 rank_config 计算）
  // ...
}
```

### 知语币奖励规则

```typescript
// PK 5 连胜奖励 1 知语币
function calculateCoinReward(currentWinStreak: number, isWinner: boolean): number {
  if (!isWinner) return 0
  const newStreak = currentWinStreak + 1
  if (newStreak > 0 && newStreak % 5 === 0) return 1  // 每 5 连胜奖 1 币
  return 0
}
```

### 后端架构

```
backend/src/
├── features/
│   └── game/
│       ├── session.router.ts       # 会话路由
│       ├── session.service.ts      # 会话生命周期 + 结算逻辑
│       ├── session.repository.ts   # 会话数据访问
│       ├── rank.service.ts         # 段位计算核心逻辑
│       ├── rank.repository.ts      # 段位数据访问
│       ├── session.schema.ts       # Zod 验证
│       └── session.types.ts        # 类型定义
```

### 事务处理

结算涉及多表更新，必须使用数据库事务：
1. 更新 `game_sessions.status` = 'finished'
2. 插入 `game_results` 每个玩家的结果
3. 更新 `user_ranks` 段位变更
4. 插入 `rank_history` 变更记录
5. 更新 `user_ranks.current_win_streak`
6. 扣减 `newbie_protection_remaining` / `promotion_protection_remaining`
7. 如有知语币奖励，调用钱包接口发放

## 范围（做什么）

- 实现游戏会话创建（服务端预生成题目）
- 实现答题结果提交（服务端计分 + 时间校验）
- 实现游戏结算（确定胜负 + 计算段位变更）
- 实现段位变更核心逻辑（加星/减星/晋级/掉段/保护机制）
- 实现王者段积分计算
- 实现逃跑处理（判负 + 记录 + 惩罚判定）
- 实现知语币奖励（5 连胜 +1 币）
- 所有结算操作包装在数据库事务中
- 实现时间校验防作弊（客户端时间戳 vs 服务端时间戳差异检测）

## 边界（不做什么）

- 不实现具体游戏的题目生成（各游戏模块自行实现，本模块提供接口）
- 不实现前端结算页面（T06-011 负责）
- 不实现赛季重置逻辑（T06-007 负责）
- 不实现知语币钱包系统（依赖个人中心模块 T10）

## 涉及文件

- 新建: `backend/src/features/game/session.router.ts`
- 新建: `backend/src/features/game/session.service.ts`
- 新建: `backend/src/features/game/session.repository.ts`
- 新建: `backend/src/features/game/rank.service.ts`
- 新建: `backend/src/features/game/rank.repository.ts`
- 新建: `backend/src/features/game/session.schema.ts`
- 新建: `backend/src/features/game/session.types.ts`
- 修改: `backend/src/main.ts`（注册会话路由）

## 依赖

- 前置: T06-002（`user_ranks`, `rank_config`, `rank_history` 表和函数存在）
- 后续: T06-011（前端结算页面）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 匹配成功后创建会话 WHEN POST /api/v1/game-sessions THEN 返回 session_id 和服务端预生成的题目集合
2. GIVEN 游戏进行中 WHEN 提交答题结果 THEN 服务端验证正确性并返回得分变化，客户端时间戳与服务端差异 > 5 秒则标记可疑
3. GIVEN 用户 A（黄金 II · 3/3 星）PK 胜利 WHEN 结算 THEN star_change=+1, 晋级至黄金 I · 1/3 星, is_promotion=false（小段晋级无动画标记）
4. GIVEN 用户 A（黄金 I · 3/3 星，即黄金满星）PK 胜利 WHEN 结算 THEN 晋级至铂金 IV · 1/4 星, is_promotion=true（大段晋级）
5. GIVEN 用户 A（白银 III · 1/3 星）PK 失败 WHEN 结算 THEN star_change=-1，掉至青铜 I · 2/3 星（满星 3 - 1 = 2）, is_demotion=true
6. GIVEN 用户 A 处于青铜 III · 1 星 WHEN PK 失败 THEN star_change=0, 最低保护生效
7. GIVEN 新用户前 10 局保护中（剩余 5 局）WHEN PK 失败 THEN star_change=0, newbie_protection_remaining 减 1
8. GIVEN 用户连胜 4 场后再胜 1 场（第 5 场）WHEN 结算 THEN coin_reward=1, 知语币 +1
9. GIVEN PK 模式 WHEN 用户退出游戏（逃跑）THEN 判定失败, star_change=-1, 逃跑次数 +1, 对手判胜 +1 星
10. GIVEN AI 对战模式 WHEN 游戏结束 THEN star_change=0, 不影响段位, 不计入胜负统计

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 验证会话创建 API
5. 验证答题提交 API
6. 验证结算 API（模拟不同段位场景的胜负结算）
7. 验证段位边界值：晋级、掉段、最低保护、新手保护、王者积分
8. 验证事务完整性：结算中途异常是否回滚

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 会话创建/结算 API 正常工作
- [ ] 段位计算逻辑全部正确（覆盖晋级/掉段/保护/王者/最低保护）
- [ ] 知语币奖励逻辑正确（5 连胜 +1）
- [ ] 逃跑处理正确
- [ ] 事务完整性验证通过
- [ ] 时间校验防作弊生效
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-006-api-session-settlement.md`

## 自检重点

- [ ] 防作弊: 计分全部在服务端，客户端不可伪造分数
- [ ] 事务安全: 多表更新在同一事务中，异常时全部回滚
- [ ] 段位精确: 与 PRD 段位规则完全一致（星数、晋级条件、掉段条件、保护机制）
- [ ] 掉段计算: 掉段后回到上一小段「满星数 - 1」而非满星
- [ ] 王者特殊: 王者段积分制，积分 < 0 掉回星耀 I 满星
- [ ] 并发安全: 同一用户不能同时进行多场 PK

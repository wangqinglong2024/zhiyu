# T06-007: 后端 API — 段位与排行榜

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 6+

## 需求摘要

实现段位查询和排行榜后端 API。包括用户段位详情查询、排行榜三榜（全服总榜/赛季榜/各游戏榜）、自己的排名查询。排行榜采用服务端定时缓存刷新策略（全服/赛季榜 5 分钟、各游戏榜 10 分钟）。实现赛季结束时的段位软重置逻辑和赛季奖励发放。

## 相关上下文

- 产品需求: `product/apps/05-game-common/06-leaderboard.md` — 完整排行榜 PRD（**核心依据**）
  - §二 三榜切换、Tab 定义
  - §三 排行榜列表项元素
  - §四 自己排名高亮（固定底部）
  - §五 刷新机制（5 分钟/10 分钟缓存）
- 产品需求: `product/apps/05-game-common/05-rank-system.md` §八 — 赛季软重置规则
- 产品需求: `product/apps/05-game-common/05-rank-system.md` §八.3 — 赛季奖励表
- 产品需求: `product/apps/05-game-common/05-rank-system.md` §九 — 王者排名、Top 10
- 编码规范: `grules/05-coding-standards.md` §三 — 缓存策略
- API 规范: `grules/04-api-design.md` — 分页规范
- 关联任务: T06-002 → 本任务 → T06-012（前端排行榜页）

## 技术方案

### API 设计

#### 1. 获取用户段位详情

```
GET /api/v1/ranks/me
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "current_tier": "gold",
    "current_sub_tier": "II",
    "current_stars_in_sub": 3,
    "stars_required": 3,
    "total_stars": 27,
    "tier_name_zh": "黄金",
    "tier_name_en": "Gold",
    "tier_icon_color": "金黄色",
    "king_points": null,
    "king_rank": null,
    "total_pk_wins": 50,
    "total_pk_losses": 50,
    "total_pk_games": 100,
    "current_win_streak": 3,
    "max_win_streak": 8,
    "newbie_protection_remaining": 0,
    "promotion_protection_remaining": 0,
    "season": {
      "season_name": "S1",
      "start_date": "2026-07-01T00:00:00+07:00",
      "end_date": "2026-09-30T23:59:59+07:00",
      "days_remaining": 45,
      "is_ending_soon": false
    }
  }
}
```

#### 2. 获取全服总榜

```
GET /api/v1/ranks/leaderboard/global?page=1&page_size=50
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "rank": 1,
        "user_id": "uuid",
        "nickname": "王者选手",
        "avatar_url": "...",
        "tier": "king",
        "tier_name_zh": "王者",
        "total_stars": 95,
        "king_points": 120
      }
    ],
    "total": 1000,
    "page": 1,
    "page_size": 50,
    "has_next": true,
    "my_rank": {
      "rank": 42,
      "total_stars": 27,
      "tier": "gold",
      "tier_name_zh": "黄金",
      "sub_tier": "II"
    },
    "cached_at": "2026-04-18T10:00:00Z",
    "next_refresh_at": "2026-04-18T10:05:00Z"
  }
}
```

#### 3. 获取赛季榜

```
GET /api/v1/ranks/leaderboard/season?page=1&page_size=50
Headers: Authorization: Bearer {token}
```

#### 4. 获取各游戏榜

```
GET /api/v1/ranks/leaderboard/game/:gameCode?page=1&page_size=50
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "rank": 1,
        "user_id": "uuid",
        "nickname": "...",
        "avatar_url": "...",
        "total_wins": 120,
        "total_games": 180,
        "win_rate": 0.67
      }
    ],
    ...分页...
  }
}
```

#### 5. 赛季重置（定时任务/管理端触发）

```
POST /api/v1/ranks/season-reset  (内部 API，需 admin 权限)

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "users_reset": 5000,
    "rewards_distributed": 5000,
    "new_season": "S2"
  }
}
```

### 缓存策略

```typescript
// 排行榜缓存 key 规范
const CACHE_KEYS = {
  GLOBAL_LEADERBOARD: 'zhiyu:leaderboard:global',      // TTL: 5 分钟
  SEASON_LEADERBOARD: 'zhiyu:leaderboard:season:{sid}', // TTL: 5 分钟
  GAME_LEADERBOARD: 'zhiyu:leaderboard:game:{code}',   // TTL: 10 分钟
}

// 使用 node-cache 或 Redis（如已部署）
// 手动刷新请求时绕过缓存
```

### 赛季软重置规则（服务端实现）

```typescript
const SEASON_RESET_MAP: Record<string, { tier: string, subTier: string, stars: number }> = {
  'bronze':   { tier: 'bronze', subTier: 'III', stars: 1 },   // 青铜→青铜III 1星
  'silver':   { tier: 'bronze', subTier: 'I', stars: 1 },     // 白银→青铜I 1星
  'gold':     { tier: 'silver', subTier: 'III', stars: 1 },   // 黄金→白银III 1星
  'platinum': { tier: 'silver', subTier: 'I', stars: 1 },     // 铂金→白银I 1星
  'diamond':  { tier: 'gold', subTier: 'IV', stars: 1 },      // 钻石→黄金IV 1星
  'star':     { tier: 'gold', subTier: 'I', stars: 1 },       // 星耀→黄金I 1星
  'king':     { tier: 'platinum', subTier: 'IV', stars: 1 },  // 王者→铂金IV 1星
}
```

### 后端架构

```
backend/src/
├── features/
│   └── game/
│       ├── leaderboard.router.ts      # 排行榜路由
│       ├── leaderboard.service.ts     # 排行榜+缓存逻辑
│       ├── leaderboard.repository.ts  # 排行榜数据查询
│       ├── season.service.ts          # 赛季管理+重置逻辑
│       ├── leaderboard.schema.ts      # Zod 验证
│       └── leaderboard.types.ts       # 类型定义
```

## 范围（做什么）

- 实现段位详情查询 API
- 实现全服总榜（按累计星数排序）
- 实现赛季榜（按当赛季星数变化排序）
- 实现各游戏榜（按胜场数排序）
- 实现自己排名查询（每次进入实时查询）
- 实现排行榜缓存策略（5 分钟/10 分钟 TTL）
- 实现赛季软重置逻辑（批量更新用户段位）
- 实现赛季奖励发放逻辑

## 边界（不做什么）

- 不实现前端排行榜页面（T06-012 负责）
- 不实现历史赛季查看（MVP 暂不支持）
- 不实现推送通知（T15 横切关注点负责）

## 涉及文件

- 新建: `backend/src/features/game/leaderboard.router.ts`
- 新建: `backend/src/features/game/leaderboard.service.ts`
- 新建: `backend/src/features/game/leaderboard.repository.ts`
- 新建: `backend/src/features/game/season.service.ts`
- 新建: `backend/src/features/game/leaderboard.schema.ts`
- 新建: `backend/src/features/game/leaderboard.types.ts`
- 修改: `backend/src/main.ts`（注册排行榜路由）

## 依赖

- 前置: T06-002（`user_ranks`, `rank_config`, `seasons`, `rank_history` 表存在）
- 后续: T06-012（前端段位排行榜 + 皮肤商城）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户已登录 WHEN GET /api/v1/ranks/me THEN 返回完整段位信息含赛季倒计时
2. GIVEN 排行榜有数据 WHEN GET /api/v1/ranks/leaderboard/global?page=1&page_size=50 THEN 返回按总星数降序排列的用户列表，含自己排名
3. GIVEN 排行榜缓存未过期 WHEN 再次请求全服总榜 THEN 返回缓存数据，response 含 cached_at
4. GIVEN 排行榜缓存已过期（5 分钟后）WHEN 请求全服总榜 THEN 重新查询数据库并刷新缓存
5. GIVEN 请求各游戏榜 WHEN GET /api/v1/ranks/leaderboard/game/G1 THEN 返回 G1 按胜场数降序排列
6. GIVEN 赛季结束 WHEN 触发赛季重置 THEN 所有用户段位按重置规则下降，新赛季创建，旧赛季标记为非活跃
7. GIVEN 赛季结束时用户为钻石段 WHEN 赛季重置 THEN 用户段位变为黄金 IV 1 星，获得 100 知语币奖励

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 验证段位查询 API
5. 验证排行榜三榜 API（全服/赛季/游戏）
6. 验证分页正确性
7. 验证缓存机制（首次查询 vs 缓存命中）
8. 模拟赛季重置，验证段位变更正确性

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 段位查询 API 正确
- [ ] 三榜排行榜 API 全部正常
- [ ] 分页逻辑正确
- [ ] 缓存命中/失效逻辑正确
- [ ] 赛季重置逻辑与 PRD 一致
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-007-api-rank-leaderboard.md`

## 自检重点

- [ ] 缓存: TTL 设置正确（5 分钟/10 分钟），手动刷新可绕过
- [ ] 排序: 全服按总星数、赛季按赛季变化、游戏按胜场
- [ ] 分页: page/page_size/has_next 正确
- [ ] 赛季重置: 规则与 PRD 完全一致（7 种段位的重置目标）
- [ ] 王者排名: 按积分排序，相同积分按时间先后
- [ ] 性能: 排行榜查询有索引支撑，大数据量不会慢查询

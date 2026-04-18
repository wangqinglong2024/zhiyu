# T06-004: 后端 API — 游戏大厅

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8+

## 需求摘要

实现游戏大厅后端 API，包括获取 12 款游戏列表（含用户个人统计）、用户游戏总览信息、游戏配置详情。所有接口需要用户登录鉴权。API 设计遵循 `api-design.md` 统一规范，后端采用 Router → Service → Repository 三层分离架构。

## 相关上下文

- 产品需求: `product/apps/05-game-common/01-game-hall.md` — 游戏大厅完整 PRD（游戏列表、段位展示栏、卡片设计、底部入口）
- 产品需求: `product/apps/05-game-common/02-mode-select.md` — 游戏模式选择（子模式配置）
- API 规范: `grules/04-api-design.md` — URL 设计、统一响应格式、业务错误码
- 编码规范: `grules/05-coding-standards.md` §三 — 后端三层架构
- 关联任务: T06-001 → 本任务 → T06-009（前端游戏大厅）

## 技术方案

### API 设计

#### 1. 获取游戏列表

```
GET /api/v1/games
Headers: Authorization: Bearer {token}
Query: ?is_active=true

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "game_code": "G1",
        "name_zh": "汉字切切切",
        "name_en": "Hanzi Slash",
        "name_vi": null,
        "description_zh": "切水果式汉字识别",
        "description_en": "Fruit ninja style Hanzi recognition",
        "level_id": 1,
        "cover_image_url": "...",
        "supports_1v1": true,
        "supports_multi": true,
        "multi_player_range": "2-4人",
        "sub_modes": [...],
        "priority": "P0",
        "user_stats": {
          "total_wins": 12,
          "total_games": 20,
          "win_rate": 0.6,
          "equipped_skin_thumbnail": "url_or_null"
        },
        "user_course_started": true
      }
    ],
    "total": 12
  }
}
```

#### 2. 获取单款游戏详情

```
GET /api/v1/games/:gameId
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "uuid",
    "game_code": "G1",
    "name_zh": "汉字切切切",
    ...全量字段...,
    "sub_modes": [...],
    "user_stats": {
      "total_wins": 12,
      "total_games": 20,
      "win_rate": 0.6,
      "best_score": 1200,
      "equipped_skins": [
        {"category": "effect", "skin_name": "火焰刀光", "thumbnail": "url"}
      ]
    }
  }
}
```

#### 3. 获取用户游戏总览

```
GET /api/v1/games/overview
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "rank": {
      "current_tier": "gold",
      "current_sub_tier": "II",
      "current_stars_in_sub": 3,
      "total_stars": 27,
      "tier_name_zh": "黄金",
      "tier_name_en": "Gold",
      "stars_required": 3,
      "is_protected": false,
      "protection_type": null,
      "protection_remaining": 0
    },
    "season": {
      "season_name": "S1",
      "days_remaining": 45,
      "is_ending_soon": false
    },
    "total_pk_wins": 50,
    "total_pk_games": 100,
    "current_win_streak": 3
  }
}
```

### 后端架构

```
backend/src/
├── features/
│   └── game/
│       ├── game.router.ts          # 路由定义
│       ├── game.service.ts         # 业务逻辑
│       ├── game.repository.ts      # 数据访问
│       ├── game.schema.ts          # Zod 验证
│       └── game.types.ts           # TypeScript 类型
```

### Zod Schema

```typescript
// game.schema.ts
import { z } from 'zod'

export const gameListQuerySchema = z.object({
  is_active: z.enum(['true', 'false']).optional().default('true'),
})

export const gameIdParamSchema = z.object({
  gameId: z.string().uuid(),
})
```

## 范围（做什么）

- 创建 `game.router.ts` 定义 3 个 API 端点
- 创建 `game.service.ts` 实现业务逻辑（游戏列表聚合用户统计）
- 创建 `game.repository.ts` 数据访问层（查询 games + 聚合 game_results）
- 创建 `game.schema.ts` Zod 请求验证
- 创建 `game.types.ts` TypeScript 类型定义
- 注册路由到 Express 主入口
- 游戏列表接口需聚合用户个人统计（胜场/总场/胜率/装备皮肤）

## 边界（不做什么）

- 不实现匹配系统（T06-005 负责）
- 不实现游戏会话管理（T06-006 负责）
- 不实现段位计算逻辑（T06-006 负责）
- 不实现前端页面（T06-009 负责）

## 涉及文件

- 新建: `backend/src/features/game/game.router.ts`
- 新建: `backend/src/features/game/game.service.ts`
- 新建: `backend/src/features/game/game.repository.ts`
- 新建: `backend/src/features/game/game.schema.ts`
- 新建: `backend/src/features/game/game.types.ts`
- 修改: `backend/src/main.ts`（注册游戏路由）

## 依赖

- 前置: T06-001（`games`, `game_results`, `user_skins` 表存在）
- 后续: T06-009（前端游戏大厅页）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户已登录 WHEN GET /api/v1/games THEN 返回 12 款游戏列表，每项含 user_stats
2. GIVEN 用户从未玩过任何游戏 WHEN GET /api/v1/games THEN user_stats 中 total_wins=0, total_games=0, win_rate=0
3. GIVEN 用户在 G1 中胜 5 场总 10 场 WHEN GET /api/v1/games THEN G1 的 user_stats.total_wins=5, total_games=10, win_rate=0.5
4. GIVEN 用户已登录 WHEN GET /api/v1/games/:gameId THEN 返回该游戏完整详情含子模式和装备皮肤
5. GIVEN 用户已登录 WHEN GET /api/v1/games/overview THEN 返回段位信息、赛季信息、总战绩
6. GIVEN 用户未登录 WHEN GET /api/v1/games THEN 返回 401 错误码
7. GIVEN 请求不存在的 gameId WHEN GET /api/v1/games/:gameId THEN 返回 404 错误码

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 验证 API 端点：
   - `curl -H "Authorization: Bearer {token}" http://localhost:{port}/api/v1/games`
   - `curl -H "Authorization: Bearer {token}" http://localhost:{port}/api/v1/games/{id}`
   - `curl -H "Authorization: Bearer {token}" http://localhost:{port}/api/v1/games/overview`
5. 验证响应格式符合统一规范（code/message/data）
6. 验证未授权请求返回 401

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 3 个 API 端点全部返回正确数据
- [ ] 响应格式符合 api-design.md 规范
- [ ] 用户统计数据聚合正确
- [ ] 未授权请求正确拦截
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-004-api-game-hall.md`

## 自检重点

- [ ] 安全: 所有接口需要 JWT 鉴权
- [ ] 性能: 游戏列表聚合查询避免 N+1（使用 JOIN 或批量查询）
- [ ] 缓存: 游戏配置数据可缓存（低频变更）
- [ ] 类型: Zod schema 验证请求参数
- [ ] 响应格式: 严格遵循 api-design.md 统一格式

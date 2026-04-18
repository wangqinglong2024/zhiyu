# T06-005: 后端 API — 匹配系统

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10+

## 需求摘要

实现基于 WebSocket（Supabase Realtime）的实时匹配系统，支持 1v1 PK 匹配和多人对战匹配。匹配规则按段位相近优先，等待 10 秒/20 秒/30 秒逐步扩大匹配范围。匹配超时 30 秒后提供 AI 对战选项（AI 对战不影响段位）。同一用户不可与最近 3 局的对手连续匹配。支持匹配取消、逃跑惩罚延长匹配等待时间。

## 相关上下文

- 产品需求: `product/apps/05-game-common/03-matching.md` — 完整匹配系统 PRD（**核心依据**）
- 产品需求: `product/apps/05-game-common/03-matching.md` §四 — 段位匹配规则
- 产品需求: `product/apps/05-game-common/03-matching.md` §五 — 超时处理、AI 对战
- 产品需求: `product/apps/05-game-common/03-matching.md` §六 — 多人对战匹配
- 产品需求: `product/apps/05-game-common/03-matching.md` §七 — 网络断线处理
- 产品需求: `product/apps/05-game-common/08-hud-landscape.md` §四 — 逃跑惩罚
- 架构规范: `grules/01-rules.md` §三 — 全链路异步非阻塞、WebSocket
- 编码规范: `grules/05-coding-standards.md` §三 — 并发安全
- API 规范: `grules/04-api-design.md`
- 关联任务: T06-001 → 本任务 → T06-010（前端匹配框架）

## 技术方案

### 匹配架构

```
客户端 ──WebSocket──→ 匹配服务器（内存队列）
                            │
                            ├── 匹配算法（段位相近优先）
                            ├── 超时检测（30 秒）
                            ├── AI 替补生成
                            └── 匹配结果广播
```

### WebSocket 频道设计（Supabase Realtime）

```typescript
// 匹配频道命名
const matchChannel = `match:${gameCode}:${mode}`  // 如 match:G1:pk_1v1

// 匹配事件
type MatchEvent =
  | { type: 'join_queue', payload: { user_id, rank_tier, rank_sort_order } }
  | { type: 'leave_queue', payload: { user_id } }
  | { type: 'match_found', payload: { session_id, players: Player[] } }
  | { type: 'match_countdown', payload: { session_id, countdown: number } }
  | { type: 'match_timeout', payload: { user_id } }
  | { type: 'player_joined', payload: { session_id, player: Player, current_count, max_count } }
```

### API 设计

#### 1. 加入匹配队列

```
POST /api/v1/games/:gameCode/match
Headers: Authorization: Bearer {token}
Body: { "mode": "pk_1v1" | "pk_multi" }

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "queue_id": "uuid",
    "channel": "match:G1:pk_1v1",
    "estimated_wait": 15
  }
}
```

#### 2. 取消匹配

```
DELETE /api/v1/games/:gameCode/match
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": null
}
```

#### 3. 选择 AI 对战（超时后）

```
POST /api/v1/games/:gameCode/match/ai
Headers: Authorization: Bearer {token}
Body: { "mode": "pk_1v1" | "pk_multi" }

Response 201:
{
  "code": 0,
  "message": "success",
  "data": {
    "session_id": "uuid",
    "is_ai_match": true,
    "ai_difficulty": "medium"
  }
}
```

### 匹配算法

```typescript
// 匹配优先级计算
interface MatchCandidate {
  userId: string
  rankSortOrder: number    // rank_config.sort_order (1-25)
  joinedAt: number         // 加入队列时间戳
  recentOpponents: string[] // 最近 3 局对手 ID
}

function calculateMatchScore(a: MatchCandidate, b: MatchCandidate, waitSeconds: number): number {
  // 段位差值（sort_order 差）
  const rankDiff = Math.abs(a.rankSortOrder - b.rankSortOrder)
  
  // 等待时间决定匹配范围
  let maxAllowedDiff: number
  if (waitSeconds <= 10) maxAllowedDiff = 1      // ±1 小段
  else if (waitSeconds <= 20) maxAllowedDiff = 2  // ±2 小段
  else if (waitSeconds <= 30) maxAllowedDiff = 5  // ±相邻大段
  else maxAllowedDiff = 25                         // 无限制（不会到这里，30 秒已超时）
  
  // 超出范围不匹配
  if (rankDiff > maxAllowedDiff) return -1
  
  // 最近 3 局不重复
  if (a.recentOpponents.includes(b.userId) || b.recentOpponents.includes(a.userId)) return -1
  
  // 分数越低优先级越高
  return rankDiff * 10 + Math.abs(a.joinedAt - b.joinedAt) / 1000
}
```

### 匹配队列（内存管理）

```typescript
// 使用 Map 管理匹配队列（进程内存）
class MatchQueue {
  private queues: Map<string, MatchCandidate[]>  // key = "G1:pk_1v1"
  private timers: Map<string, NodeJS.Timeout>     // 超时定时器
  
  // 每 2 秒执行一次匹配扫描
  private matchInterval: NodeJS.Timeout
}
```

### 逃跑惩罚匹配延迟

```typescript
// 根据逃跑次数计算额外等待时间
function getEscapePenaltySeconds(escapeCount: number): number {
  if (escapeCount <= 3) return 0
  if (escapeCount <= 6) return 30
  return 60
}
```

### 后端架构

```
backend/src/
├── features/
│   └── game/
│       ├── match.router.ts         # 匹配路由
│       ├── match.service.ts        # 匹配业务逻辑
│       ├── match.queue.ts          # 匹配队列管理（内存）
│       ├── match.algorithm.ts      # 匹配算法
│       ├── match.websocket.ts      # WebSocket 频道管理
│       ├── match.schema.ts         # Zod 验证
│       └── match.types.ts          # 类型定义
```

## 范围（做什么）

- 实现匹配队列管理（内存 Map + 定时扫描）
- 实现段位相近匹配算法（10s/20s/30s 阶梯扩大范围）
- 实现 WebSocket 频道管理（Supabase Realtime 广播匹配事件）
- 实现匹配超时处理（30 秒超时通知客户端）
- 实现 AI 对战创建（AI 难度自动匹配段位）
- 实现最近 3 局不重复匹配
- 实现逃跑惩罚延迟匹配
- 实现多人对战匹配（等待人数达标）
- 实现取消匹配功能
- 实现匹配前校验（网络、登录态、是否在其他游戏中）

## 边界（不做什么）

- 不实现游戏内实时对战通信（各游戏自行实现）
- 不实现结算逻辑（T06-006 负责）
- 不实现前端匹配页面（T06-010 负责）
- 不实现游戏容器加载（T06-010 负责）

## 涉及文件

- 新建: `backend/src/features/game/match.router.ts`
- 新建: `backend/src/features/game/match.service.ts`
- 新建: `backend/src/features/game/match.queue.ts`
- 新建: `backend/src/features/game/match.algorithm.ts`
- 新建: `backend/src/features/game/match.websocket.ts`
- 新建: `backend/src/features/game/match.schema.ts`
- 新建: `backend/src/features/game/match.types.ts`
- 修改: `backend/src/main.ts`（注册匹配路由 + 初始化 WebSocket）

## 依赖

- 前置: T06-001（`game_sessions`, `game_session_players` 表存在）
- 后续: T06-010（前端匹配与对战框架）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户 A（黄金 II）加入 G1 1v1 匹配队列 WHEN 用户 B（黄金 III）10 秒内加入同队列 THEN 两人成功匹配，收到 match_found 事件，包含 session_id 和双方信息
2. GIVEN 用户 A（青铜 III）加入匹配 WHEN 仅有用户 B（钻石 I）在队列中且等待 < 10 秒 THEN 不匹配（段位差距过大）
3. GIVEN 用户 A 加入匹配 WHEN 等待超过 30 秒无人匹配 THEN 客户端收到 match_timeout 事件
4. GIVEN 匹配超时后 WHEN 用户选择 AI 对战 THEN 创建 AI 会话，session.ai_match=true, ai_difficulty 与段位匹配
5. GIVEN 用户 A 和 B 在最近 3 局中已对战 WHEN 两人再次进入匹配 THEN 跳过彼此，寻找其他对手
6. GIVEN 用户本赛季逃跑 5 次 WHEN 加入匹配 THEN 实际等待时间增加 30 秒惩罚
7. GIVEN 4 人多人对战匹配 WHEN 3 人已加入 THEN 等待第 4 人，每人加入时广播 player_joined 事件
8. GIVEN 匹配中 WHEN 用户取消匹配 THEN 从队列移除，返回成功

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 验证 API 端点：
   - POST /api/v1/games/G1/match 加入匹配
   - DELETE /api/v1/games/G1/match 取消匹配
   - POST /api/v1/games/G1/match/ai AI 对战
5. 通过 WebSocket 客户端验证匹配事件广播
6. 验证匹配算法段位范围逻辑

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 匹配 API 端点正常工作
- [ ] WebSocket 事件广播正确
- [ ] 匹配算法段位范围正确
- [ ] 超时机制正常触发
- [ ] AI 对战创建正确
- [ ] 逃跑惩罚逻辑生效
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-005-api-matching.md`

## 自检重点

- [ ] 并发安全: 匹配队列的并发读写是否安全（单进程 + 同步操作即可）
- [ ] 内存泄漏: 匹配队列是否有清理机制（用户断开、超时自动移除）
- [ ] WebSocket: Supabase Realtime 频道正确创建和销毁
- [ ] 防作弊: 匹配结果由服务端决定，客户端不可伪造
- [ ] 逃跑惩罚: 查询 user_escape_records 按赛季统计
- [ ] AI 难度: 按段位自动分配（青铜/白银→easy, 黄金→medium, 铂金+→hard）

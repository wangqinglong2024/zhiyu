# T11-004: 后端 API — 数据看板

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 6

## 需求摘要

实现管理后台仪表盘首页所需的全部数据聚合查询 API。包括：6 张顶部指标卡片数据（总用户数/DAU/付费用户/营收/在线游戏/待退款）、3 张趋势图表数据（用户增长/营收/日活，支持 7/30/90 天切换）、内容概览数据（文章饼图/课程列表/游戏排行）、快捷操作数据、最近操作日志（10条）。使用 PostgreSQL 聚合函数 + 缓存（node-cache）优化性能，确保指标数据延迟 ≤ 5 分钟。API 需按角色过滤返回数据范围。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/04-dashboard.md` — 仪表盘完整 PRD（指标卡片、图表、概览、快捷操作、日志）
- 产品需求: `product/admin/01-admin-dashboard/04-dashboard.md` §六 — 四种角色视图差异
- 产品需求: `product/admin/01-admin-dashboard/02-permissions.md` §二.2 — 仪表盘数据可见范围
- 产品需求: `product/admin/01-admin-dashboard/05-data-nonfunctional.md` §一.2 — 仪表盘数据流
- 产品需求: `product/admin/01-admin-dashboard/05-data-nonfunctional.md` §二.1 — 性能指标（指标卡片 ≤1s，图表 ≤2s）
- API 设计: `grules/04-api-design.md` — RESTful 统一响应格式
- 编码规范: `grules/05-coding-standards.md` §三 — 后端分层架构
- 关联任务: 前置 T11-002（认证中间件） → 后续 T11-008（前端看板页面）

## 技术方案

### API 端点设计

```
GET /api/v1/admin/dashboard/metrics          — 顶部指标卡片数据（按角色过滤）
GET /api/v1/admin/dashboard/trends           — 趋势图表数据（?range=7|30|90&type=users|revenue|dau）
GET /api/v1/admin/dashboard/content-overview — 内容概览数据（文章饼图+课程+游戏排行）
GET /api/v1/admin/dashboard/recent-logs      — 最近操作日志（10条，按角色过滤）
GET /api/v1/admin/dashboard/online-count     — 实时在线游戏人数（轻量接口，30秒轮询）
```

### 指标卡片数据结构

```typescript
// GET /api/v1/admin/dashboard/metrics
// 响应根据当前管理员角色自动过滤可见指标

interface DashboardMetricsResponse {
  // 超级管理员和用户运营可见
  total_users?: {
    value: number            // 总用户数
    daily_new: number        // 今日新增
    change_pct: number       // 较昨日同一时刻变化百分比
  }
  dau?: {
    value: number            // 今日活跃用户数
    dau_mau_ratio: number    // DAU/MAU 百分比
    change_pct: number
  }
  paid_users?: {
    value: number            // 付费用户总数
    paid_ratio: number       // 付费率百分比
    change_pct: number
  }
  revenue?: {
    value: number            // 今日营收（USD，分为单位存储，展示时/100）
    change_pct: number       // 较昨日变化百分比
  }
  pending_refunds?: {
    value: number            // 待处理退款数
    oldest_days: number      // 最早一笔距今天数
  }

  // 超级管理员和游戏运营可见
  online_games?: {
    value: number            // 当前在线游戏人数
    today_peak: number       // 今日峰值
    change_pct: number
  }

  // 内容运营可见（专属卡片）
  published_articles?: {
    value: number            // 已发布文章总数
    daily_new: number        // 今日新增
  }
  total_lessons?: {
    value: number            // 已上线课程总课时数
    online_levels: number    // 已上线级别数
  }

  // 游戏运营可见（专属卡片）
  today_game_sessions?: {
    value: number            // 今日游戏总对局数
    change_pct: number
  }
}
```

### 趋势图表数据结构

```typescript
// GET /api/v1/admin/dashboard/trends?range=7&type=users
// range: 7 | 30 | 90
// type: users | revenue | dau

interface TrendDataResponse {
  type: 'users' | 'revenue' | 'dau'
  range: 7 | 30 | 90
  data_points: Array<{
    date: string           // "2026-04-17"
    value: number          // 数值
  }>
}
```

### 内容概览数据结构

```typescript
// GET /api/v1/admin/dashboard/content-overview

interface ContentOverviewResponse {
  // 文章概览（饼图数据）
  articles_by_category: Array<{
    category: string       // 类目名称
    count: number          // 文章数
    percentage: number     // 百分比
  }>

  // 课程概览
  courses: Array<{
    level: number          // 级别 1-12
    name: string           // 级别名称
    lesson_count: number   // 课时数
    status: 'online' | 'developing' | 'not_started'
  }>

  // 游戏排行（今日对局数降序）
  game_rankings: Array<{
    rank: number
    game_name: string
    session_count: number  // 今日对局数
  }>
}
```

### PostgreSQL 聚合函数

```sql
-- 创建 PostgreSQL 函数用于高效聚合查询

-- 函数 1：获取指标卡片数据
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles WHERE status = 'active'),
    'dau', (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs
             WHERE activity_date = CURRENT_DATE),
    'paid_users', (SELECT COUNT(*) FROM profiles WHERE is_paid = TRUE),
    'today_revenue', (SELECT COALESCE(SUM(amount), 0) FROM orders
                       WHERE created_at >= CURRENT_DATE AND status = 'completed'),
    'pending_refunds', (SELECT COUNT(*) FROM refund_requests WHERE status = 'pending'),
    'oldest_refund_days', (SELECT COALESCE(
      EXTRACT(DAY FROM NOW() - MIN(created_at)), 0)
      FROM refund_requests WHERE status = 'pending')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函数 2：获取趋势数据
CREATE OR REPLACE FUNCTION get_trend_data(
  p_type TEXT,
  p_range INTEGER
)
RETURNS TABLE(date DATE, value BIGINT) AS $$
BEGIN
  IF p_type = 'users' THEN
    RETURN QUERY
      SELECT d::DATE, COUNT(p.id)::BIGINT
      FROM generate_series(
        CURRENT_DATE - (p_range - 1), CURRENT_DATE, '1 day'
      ) d
      LEFT JOIN profiles p ON p.created_at::DATE = d::DATE
      GROUP BY d ORDER BY d;
  ELSIF p_type = 'revenue' THEN
    RETURN QUERY
      SELECT d::DATE, COALESCE(SUM(o.amount), 0)::BIGINT
      FROM generate_series(
        CURRENT_DATE - (p_range - 1), CURRENT_DATE, '1 day'
      ) d
      LEFT JOIN orders o ON o.created_at::DATE = d::DATE AND o.status = 'completed'
      GROUP BY d ORDER BY d;
  ELSIF p_type = 'dau' THEN
    RETURN QUERY
      SELECT d::DATE, COUNT(DISTINCT ual.user_id)::BIGINT
      FROM generate_series(
        CURRENT_DATE - (p_range - 1), CURRENT_DATE, '1 day'
      ) d
      LEFT JOIN user_activity_logs ual ON ual.activity_date = d::DATE
      GROUP BY d ORDER BY d;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 缓存策略

```typescript
import NodeCache from 'node-cache'

// 缓存实例
const dashboardCache = new NodeCache({
  stdTTL: 300,          // 默认 5 分钟过期
  checkperiod: 60,      // 每 60 秒检查过期
})

// 缓存 Key 设计
const CACHE_KEYS = {
  METRICS: 'dashboard:metrics',
  TREND: (type: string, range: number) => `dashboard:trend:${type}:${range}`,
  CONTENT_OVERVIEW: 'dashboard:content_overview',
  ONLINE_COUNT: 'dashboard:online_count',  // TTL 30秒
}

// 缓存使用模式
async function getMetrics(): Promise<DashboardMetricsResponse> {
  const cached = dashboardCache.get<DashboardMetricsResponse>(CACHE_KEYS.METRICS)
  if (cached) return cached

  const data = await queryDashboardMetrics()  // 数据库查询
  dashboardCache.set(CACHE_KEYS.METRICS, data, 300)  // 5分钟缓存
  return data
}

// 在线人数：30秒缓存
async function getOnlineCount(): Promise<number> {
  const cached = dashboardCache.get<number>(CACHE_KEYS.ONLINE_COUNT)
  if (cached !== undefined) return cached

  const count = await queryOnlineCount()
  dashboardCache.set(CACHE_KEYS.ONLINE_COUNT, count, 30)  // 30秒缓存
  return count
}
```

### Repository 层

```typescript
// backend/src/repositories/dashboard.repository.ts

export class DashboardRepository {
  // 指标卡片数据
  async getMetrics(): Promise<RawMetrics>

  // 趋势图表数据
  async getTrendData(type: string, range: number): Promise<TrendPoint[]>

  // 内容概览数据
  async getContentOverview(): Promise<ContentOverview>

  // 在线游戏人数
  async getOnlineGameCount(): Promise<number>

  // 最近操作日志
  async getRecentLogs(adminId: string | null, limit: number): Promise<AuditLogResponse[]>

  // 昨日同一时刻数据（用于计算变化百分比）
  async getYesterdayMetrics(): Promise<RawMetrics>
}
```

### Service 层

```typescript
// backend/src/services/dashboard.service.ts

export class DashboardService {
  // 获取指标卡片（按角色过滤）
  async getMetrics(role: AdminRole): Promise<DashboardMetricsResponse>

  // 获取趋势数据（按角色过滤可见图表类型）
  async getTrendData(role: AdminRole, type: string, range: number): Promise<TrendDataResponse>

  // 获取内容概览（仅超管和内容运营可见）
  async getContentOverview(role: AdminRole): Promise<ContentOverviewResponse | null>

  // 获取最近操作日志（超管看全部，其他看自己）
  async getRecentLogs(adminId: string, role: AdminRole): Promise<AuditLogResponse[]>

  // 获取实时在线人数
  async getOnlineCount(): Promise<number>

  // 计算变化百分比
  private calculateChangePct(current: number, previous: number): number
}
```

### 角色数据过滤逻辑

| 角色 | 可请求的指标 | 可请求的趋势 | 内容概览 | 日志范围 |
|------|------------|------------|---------|---------|
| super_admin | 全部 | users/revenue/dau | 全部 | 全部日志 |
| content_ops | published_articles, total_lessons | 无 | 文章+课程 | 仅自己 |
| user_ops | total_users, dau, paid_users, revenue, pending_refunds | users/revenue/dau | 无 | 仅自己 |
| game_ops | online_games, today_game_sessions | 无 | 游戏排行 | 仅自己 |

## 范围（做什么）

- 创建 `supabase/migrations/20260418100002_dashboard_functions.sql` — PostgreSQL 聚合函数
- 创建 `backend/src/repositories/dashboard.repository.ts` — 仪表盘数据访问层
- 创建 `backend/src/services/dashboard.service.ts` — 仪表盘业务逻辑层（含缓存）
- 创建 `backend/src/routers/v1/admin/dashboard.router.ts` — 仪表盘 API 路由
- 修改 `backend/src/routers/v1/index.ts` — 挂载 dashboard 路由
- 修改 `backend/package.json` — 添加 node-cache 依赖

## 边界（不做什么）

- 不实现前端仪表盘页面（T11-008）
- 不创建 user_activity_logs / orders / refund_requests 等业务表（这些表由对应模块任务创建）
- 不实现 WebSocket 实时推送（轮询方式足矣）
- 不实现 D1/D7/D30 留存漏斗图（P2 功能，后续迭代）
- 不实现地区分布图（P2 功能，后续迭代）
- 当业务表尚未创建时，API 应返回零值/空数组而非报错

## 涉及文件

- 新建: `zhiyu/supabase/migrations/20260418100002_dashboard_functions.sql`
- 新建: `zhiyu/backend/src/repositories/dashboard.repository.ts`
- 新建: `zhiyu/backend/src/services/dashboard.service.ts`
- 新建: `zhiyu/backend/src/routers/v1/admin/dashboard.router.ts`
- 修改: `zhiyu/backend/src/routers/v1/index.ts`
- 修改: `zhiyu/backend/package.json`

## 依赖

- 前置: T11-002（管理员认证中间件）、T11-003（角色权限鉴权中间件）
- 后续: T11-008（前端数据看板页面）
- 软依赖: T01-006（profiles 表）、后续模块的 orders/refund_requests 等业务表（不存在时返回零值）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 已登录的超级管理员  
   **WHEN** GET `/api/v1/admin/dashboard/metrics`  
   **THEN** 返回全部指标卡片数据（total_users、dau、paid_users、revenue、online_games、pending_refunds），每项包含 value 和 change_pct

2. **GIVEN** 已登录的内容运营管理员  
   **WHEN** GET `/api/v1/admin/dashboard/metrics`  
   **THEN** 仅返回 published_articles 和 total_lessons，不包含 total_users/dau/revenue 等

3. **GIVEN** 已登录的用户运营管理员  
   **WHEN** GET `/api/v1/admin/dashboard/metrics`  
   **THEN** 返回 total_users、dau、paid_users、revenue、pending_refunds，不包含 online_games

4. **GIVEN** 已登录的管理员  
   **WHEN** GET `/api/v1/admin/dashboard/trends?range=7&type=users`  
   **THEN** 返回 7 个数据点（最近 7 天），每个包含 date 和 value

5. **GIVEN** 已登录的管理员  
   **WHEN** GET `/api/v1/admin/dashboard/trends?range=30&type=revenue`  
   **THEN** 返回 30 个数据点，type 为 revenue

6. **GIVEN** 内容运营管理员  
   **WHEN** GET `/api/v1/admin/dashboard/trends?type=users`  
   **THEN** 返回 403（内容运营无权查看用户趋势）

7. **GIVEN** 已登录的超级管理员  
   **WHEN** GET `/api/v1/admin/dashboard/content-overview`  
   **THEN** 返回文章按类目饼图数据（12个类目）、课程列表、游戏排行

8. **GIVEN** 用户运营管理员  
   **WHEN** GET `/api/v1/admin/dashboard/content-overview`  
   **THEN** 返回 403（用户运营无权查看内容概览）

9. **GIVEN** 已登录的超级管理员  
   **WHEN** GET `/api/v1/admin/dashboard/recent-logs`  
   **THEN** 返回最近 10 条全部操作日志（不限操作人）

10. **GIVEN** 已登录的内容运营管理员  
    **WHEN** GET `/api/v1/admin/dashboard/recent-logs`  
    **THEN** 仅返回该管理员自己的操作记录

11. **GIVEN** 首次请求指标数据后  
    **WHEN** 5 分钟内再次请求  
    **THEN** 返回缓存数据，不重新查询数据库（通过日志验证）

12. **GIVEN** 业务表尚未创建  
    **WHEN** 请求指标数据  
    **THEN** 返回零值/空数组，不抛出 500 错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 执行 Dashboard PostgreSQL 函数 Migration
5. 登录获取不同角色的 Token
6. 以超管身份测试全部 5 个 API 端点
7. 以内容运营身份测试指标过滤
8. 以用户运营身份测试指标过滤
9. 以游戏运营身份测试指标过滤
10. 测试趋势数据的 7/30/90 天切换
11. 测试缓存命中（连续两次请求，检查日志）
12. 测试业务表不存在时的降级处理

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 5 个 API 端点均正常响应
- [ ] 角色数据过滤正确（每种角色只看到权限范围内的数据）
- [ ] 趋势数据支持 7/30/90 天切换
- [ ] 缓存机制正常工作（指标 5 分钟、在线人数 30 秒）
- [ ] PostgreSQL 聚合函数执行无错误
- [ ] 业务表不存在时优雅降级（返回零值）
- [ ] 指标数据接口响应 ≤ 1 秒
- [ ] 趋势数据接口响应 ≤ 2 秒
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-004-api-dashboard-metrics.md`

## 自检重点

- [ ] 安全：所有接口需认证+角色数据过滤、SQL 注入防护
- [ ] 性能：缓存策略正确、PostgreSQL 函数索引命中、响应时间达标
- [ ] 容错：业务表不存在时优雅降级
- [ ] 类型同步：API 响应格式与前端期望一致
- [ ] API 规范：响应格式符合 grules/04-api-design.md

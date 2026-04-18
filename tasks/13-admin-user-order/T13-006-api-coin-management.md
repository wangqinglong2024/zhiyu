# T13-006: 后端 API — 知语币管理 (Admin Coin Management API)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

为管理后台「知语币管理」模块实现后端 API。核心功能包括：① 知语币总览仪表盘（4 个统计卡 + 发放趋势图数据），② 手动调整用户知语币余额（增加/扣减，需操作确认），③ 负余额用户监控列表，④ 大额交易告警（单日 > 5000 币的用户），⑤ 知语币流水日志查询。所有手动调整必须记录操作人和原因，支持审计追溯。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/06-coin-management.md` — 知语币管理 PRD
- 非功能需求: `product/admin/03-admin-user-order/07-data-nonfunctional.md` — 并发安全
- 产品总纲: `product/00-product-overview.md` §五.2 — 知语币体系（1 币 = $0.01，上限 100,000）
- 编码规范: `grules/05-coding-standards.md` — 行锁、事务
- 关联任务: T13-002（用户详情-知语币 Tab）、T13-005（退款扣回）

## 技术方案

### API 端点设计

```
前缀: /api/v1/admin/coins

GET    /overview                 — 知语币总览（4 统计卡 + 趋势数据）
GET    /transactions             — 知语币流水列表（筛选 + 分页）
POST   /adjust                   — 手动调整用户余额（增加/扣减）
GET    /negative-balances         — 负余额用户列表
GET    /high-volume-alerts        — 大额交易告警列表
```

### Zod Schema 定义

```typescript
// backend/src/models/admin-coin.ts
import { z } from 'zod';

// 知语币总览
export interface CoinOverview {
  total_issued: number;              // 历史累计发放总量
  total_consumed: number;            // 历史累计消耗总量
  current_circulation: number;       // 当前流通总量（发放 - 消耗 - 过期）
  negative_balance_users: number;    // 负余额用户数
  trend: CoinTrendPoint[];           // 近 30 天发放/消耗趋势
}

export interface CoinTrendPoint {
  date: string;                      // YYYY-MM-DD
  issued: number;                    // 当日发放量
  consumed: number;                  // 当日消耗量
}

// 手动调整
export const CoinAdjustSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['add', 'subtract']),
  amount: z.number().int().min(1).max(100000),
  reason_category: z.enum([
    'compensation',    // 补偿
    'correction',      // 纠错
    'promotion',       // 活动奖励
    'penalty',         // 惩罚扣除
    'other'            // 其他
  ]),
  reason_detail: z.string().min(1).max(500),
});

// 流水查询
export const CoinTransactionListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  user_id: z.string().uuid().optional(),
  type: z.enum(['all', 'add', 'subtract']).default('all'),
  source: z.enum([
    'all', 'referral', 'daily_signin', 'game_streak', 'new_user',
    'event', 'admin_manual', 'purchase', 'refund_clawback'
  ]).default('all'),
  date_start: z.string().datetime().optional(),
  date_end: z.string().datetime().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// 流水列表项
export interface CoinTransactionItem {
  id: string;
  user: { id: string; nickname: string; avatar_url: string | null };
  type: 'add' | 'subtract';
  amount: number;
  balance_after: number;
  source: string;
  reason: string;
  operator: string | null;         // 系统自动 = null，手动 = 管理员名
  created_at: string;
}

// 负余额用户列表项
export interface NegativeBalanceUser {
  user_id: string;
  nickname: string;
  email: string;
  balance: number;                  // 负数
  last_negative_at: string;
  cause: string;                    // 导致负余额的原因
}

// 大额交易告警
export interface HighVolumeAlert {
  user_id: string;
  nickname: string;
  email: string;
  daily_total: number;              // 当日累计
  transaction_count: number;        // 当日笔数
  alert_date: string;
}
```

### Service 层

```typescript
// backend/src/services/admin-coin.service.ts
export class AdminCoinService {
  /**
   * 知语币总览仪表盘
   * - 4 统计卡: 累计发放 / 累计消耗 / 当前流通 / 负余额人数
   * - 30 天趋势: 每日发放量 + 消耗量
   */
  async getOverview(): Promise<CoinOverview>;

  /**
   * 手动调整用户余额
   * - 校验用户存在
   * - add: 新余额 ≤ 100,000 上限
   * - subtract: 允许至负数（退款扣回场景）
   * - 使用 SELECT FOR UPDATE 行锁
   * - 写入 coin_transactions 流水
   * - 写入 admin_logs 审计
   */
  async adjustBalance(data: CoinAdjustInput, adminId: string): Promise<CoinAdjustResult>;

  /**
   * 知语币流水查询
   */
  async listTransactions(query: CoinTransactionListQuery): Promise<PaginatedResult<CoinTransactionItem>>;

  /**
   * 负余额用户监控
   */
  async getNegativeBalanceUsers(page: number, pageSize: number): Promise<PaginatedResult<NegativeBalanceUser>>;

  /**
   * 大额交易告警（单日 > 5000 币）
   * - 查询近 7 天内触发告警的用户
   */
  async getHighVolumeAlerts(page: number, pageSize: number): Promise<PaginatedResult<HighVolumeAlert>>;
}
```

### Router 层

```typescript
// backend/src/routers/v1/admin/coin.router.ts
const router = Router();

router.use(requireAdmin);
router.use(requireRole(['super_admin', 'user_operator']));

router.get('/overview', adminCoinController.getOverview);
router.get('/transactions', adminCoinController.listTransactions);
router.post('/adjust', adminCoinController.adjust);
router.get('/negative-balances', adminCoinController.negativeBalances);
router.get('/high-volume-alerts', adminCoinController.highVolumeAlerts);
```

## 范围（做什么）

- 创建 `admin-coin.ts` Zod Schema + 类型定义
- 实现知语币总览 API（4 统计卡 + 30 天趋势图数据）
- 实现手动调整余额 API（行锁 + 上限校验 + 允许负数 + 流水记录 + 审计日志）
- 实现知语币流水列表 API（多维度筛选 + 分页）
- 实现负余额用户监控列表 API
- 实现大额交易告警 API（单日 > 5000 币）
- 所有写操作写入 admin_logs 审计日志

## 边界（不做什么）

- 不实现知语币自动发放引擎（如签到/游戏连胜等由各自模块处理）
- 不实现退款时的知语币扣回（T13-005 已处理）
- 不实现前端页面（T13-010）
- 不实现知语币过期回收（P2 功能）

## 涉及文件

- 新建: `backend/src/models/admin-coin.ts` — Zod Schema + 类型
- 新建: `backend/src/repositories/admin-coin.repository.ts` — 数据访问层
- 新建: `backend/src/services/admin-coin.service.ts` — 业务逻辑层
- 新建: `backend/src/controllers/admin-coin.controller.ts` — 控制器
- 新建: `backend/src/routers/v1/admin/coin.router.ts` — 路由
- 修改: `backend/src/routers/v1/admin/index.ts` — 注册知语币路由

## 依赖

- 前置: T11-003（管理员鉴权）、coin_transactions 表（应在基础模块中已建）
- 后续: T13-010（前端币管理页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录
   **WHEN** 调用 `GET /api/v1/admin/coins/overview`
   **THEN** 返回 4 项统计（累计发放/消耗/流通/负余额人数）+ 近 30 天趋势数据

2. **GIVEN** 管理员为用户 A（当前余额 200）手动增加 300 币
   **WHEN** 调用 `POST /api/v1/admin/coins/adjust`，Body: `{ user_id: "...", type: "add", amount: 300, reason_category: "compensation", reason_detail: "课程质量问题补偿" }`
   **THEN** 用户 A 余额变为 500，coin_transactions 新增流水记录，admin_logs 记录操作

3. **GIVEN** 用户 B 当前余额 99,800
   **WHEN** 管理员尝试加 300 币（超过 100,000 上限）
   **THEN** 返回 400 错误「调整后余额超过上限 100,000」

4. **GIVEN** 管理员扣减用户余额
   **WHEN** 扣减量 > 当前余额
   **THEN** 余额变为负数，操作成功，流水记录标明 balance_after 为负

5. **GIVEN** 系统中有负余额用户
   **WHEN** 调用 `GET /api/v1/admin/coins/negative-balances`
   **THEN** 返回负余额用户列表，含用户ID/昵称/邮箱/当前余额/导致负余额的原因

6. **GIVEN** 用户 C 今日累计交易 6000 币
   **WHEN** 调用 `GET /api/v1/admin/coins/high-volume-alerts`
   **THEN** 用户 C 出现在告警列表中，显示当日累计量和交易笔数

7. **GIVEN** 管理员查看流水记录
   **WHEN** 调用 `GET /api/v1/admin/coins/transactions?source=admin_manual&date_start=...`
   **THEN** 返回仅手动调整的流水记录，含操作人姓名

8. **GIVEN** 非管理员用户
   **WHEN** 调用任何 coins API
   **THEN** 返回 401/403

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 测试知语币总览 4 统计卡和趋势数据
3. 测试手动增加余额（正常 + 超上限）
4. 测试手动扣减余额（正常 + 至负数）
5. 测试流水记录筛选和分页
6. 测试负余额用户列表
7. 测试大额告警列表
8. 测试权限控制

### 测试通过标准

- [ ] Docker 构建成功，后端容器正常运行
- [ ] 知语币总览 4 卡数据正确
- [ ] 趋势数据涵盖近 30 天
- [ ] 手动增加余额正确 + 上限拦截
- [ ] 手动扣减允许负余额
- [ ] 流水记录完整准确
- [ ] 负余额监控列表正确
- [ ] 大额告警（>5000/日）触发正确
- [ ] 行锁无并发写冲突
- [ ] admin_logs 审计记录完整
- [ ] 非管理员被拒绝

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-006-api-coin-management.md`

## 自检重点

- [ ] 手动调整使用 SELECT FOR UPDATE 行锁
- [ ] add 操作校验不超过 100,000 上限
- [ ] subtract 操作允许负余额
- [ ] 大额告警阈值 5000 可配置化
- [ ] 趋势数据 SQL 聚合高效（使用 date_trunc）
- [ ] 所有手动调整记入 admin_logs
- [ ] 流水记录关联操作人 ID
- [ ] 统一响应格式 {code, data, message}

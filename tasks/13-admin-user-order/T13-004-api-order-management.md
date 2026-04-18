# T13-004: 后端 API — 订单管理 (Admin Order Management API)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 9

## 需求摘要

为管理后台「订单管理」模块实现完整的后端 API。包含订单列表（搜索 + 筛选 + 排序 + 分页）、订单统计摘要（总订单数/总金额/退款数/退款金额）、订单详情（6 个信息区块：订单/用户/课程/支付/推荐返利/退款），以及 Paddle 对账状态同步。所有订单来自 Paddle 支付成功后的 Webhook 回调写入。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/04-order-management.md` — 订单列表 + 订单详情 PRD
- 非功能需求: `product/admin/03-admin-user-order/07-data-nonfunctional.md` — 性能/并发/事务一致性
- 产品总纲: `product/00-product-overview.md` §五.1 — 课程定价（L4-L12 $6/级）
- 商业模式: `plan/06-business-model.md` — Paddle MoR 支付通道
- API 规约: `grules/04-api-design.md` — 分页、筛选
- 编码规范: `grules/05-coding-standards.md` — 幂等、并发安全
- 关联任务: T10-005（Paddle 支付集成）、T11-003（管理员鉴权）

## 技术方案

### API 端点设计

```
前缀: /api/v1/admin/orders

GET    /                  — 订单列表（搜索 + 筛选 + 排序 + 分页）
GET    /summary           — 订单统计摘要（跟随筛选条件）
GET    /:orderId          — 订单详情（6 个信息区块）
```

### Zod Schema 定义

```typescript
// backend/src/models/admin-order.ts
import { z } from 'zod';

export const OrderStatusEnum = z.enum(['all', 'completed', 'refunded', 'refunding']);

export const AdminOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().min(2).max(100).optional(),   // 搜索：订单号/昵称/邮箱
  status: OrderStatusEnum.default('all'),
  levels: z.string().optional(),                     // 逗号分隔 "L4,L5,L6"
  date_start: z.string().datetime().optional(),
  date_end: z.string().datetime().optional(),
  amount_min: z.coerce.number().min(0).optional(),
  amount_max: z.coerce.number().min(0).optional(),
  sort_by: z.enum(['order_date', 'amount']).default('order_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// 订单列表项
export interface AdminOrderListItem {
  order_id: string;
  user: { id: string; nickname: string; avatar_url: string | null };
  course_name: string;           // "Level X: 课程名"
  amount: number;                // USD
  payment_method: 'paddle' | 'apple_iap' | 'coins';
  paddle_transaction_id: string | null;
  order_date: string;
  status: 'completed' | 'refunded' | 'refunding';
}

// 订单统计摘要
export interface OrderSummary {
  total_orders: number;
  total_amount: number;          // USD
  refund_count: number;
  refund_amount: number;         // USD
}

// 订单详情（6 个信息区块）
export interface AdminOrderDetail {
  order_info: OrderInfo;
  user_info: OrderUserInfo;
  course_info: OrderCourseInfo;
  payment_info: OrderPaymentInfo;
  referral_info: OrderReferralInfo | null;
  refund_info: OrderRefundInfo | null;
}

export interface OrderInfo {
  order_id: string;
  created_at: string;
  paid_at: string | null;
  status: 'completed' | 'refunded' | 'refunding';
}

export interface OrderUserInfo {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  email: string;
}

export interface OrderCourseInfo {
  level: string;
  course_name: string;
  valid_from: string;
  valid_until: string;
  is_expired: boolean;
  current_progress: number;      // 0-100
  access_revoked: boolean;       // 退款后标记为已回收
}

export interface OrderPaymentInfo {
  amount: number;                // USD
  currency: string;              // "USD"
  payment_method: 'paddle' | 'apple_iap' | 'coins';
  paddle_transaction_id: string | null;
  paddle_fee: number | null;     // Paddle 手续费
  net_income: number | null;     // 净收入
}

export interface OrderReferralInfo {
  referrer: { user_id: string; nickname: string; avatar_url: string | null } | null;
  referrer_reward_amount: number;
  referrer_reward_status: 'issued' | 'cooling' | 'clawed_back';
  self_reward_amount: number;
  self_reward_status: 'issued' | 'cooling' | 'clawed_back';
  cooling_days_remaining: number | null;
}

export interface OrderRefundInfo {
  refund_id: string;
  refund_date: string;
  refund_amount: number;
  refund_reason: string;
  refund_operator: string;
  refund_status: 'refunding' | 'refunded' | 'failed';
  refund_method: string;
  course_revoked: boolean;
  reward_clawed_back: boolean;
  reward_claw_detail: string | null;
}
```

### Repository 层

```typescript
// backend/src/repositories/admin-order.repository.ts
export class AdminOrderRepository {
  async findAll(query: AdminOrderListQuery): Promise<PaginatedResult<AdminOrderListItem>>;
  async getSummary(query: AdminOrderSummaryQuery): Promise<OrderSummary>;
  async findById(orderId: string): Promise<AdminOrderDetail | null>;
}
```

### Service 层

```typescript
// backend/src/services/admin-order.service.ts
export class AdminOrderService {
  // 业务规则：
  // - 搜索同时匹配订单号（前缀）、用户昵称（模糊）、用户邮箱（前缀）
  // - 统计摘要跟随当前筛选条件实时计算
  // - 订单详情需要聚合 6 张表的数据
  // - Paddle 手续费 ≈ 5% + $0.50，净收入 = 金额 - 手续费
  // - 推荐返利展示冷却中的剩余天数
  // - 课程 Level 筛选支持多选（逗号分隔）

  async listOrders(query: AdminOrderListQuery): Promise<PaginatedResult<AdminOrderListItem>>;
  async getOrderSummary(query: AdminOrderSummaryQuery): Promise<OrderSummary>;
  async getOrderDetail(orderId: string): Promise<AdminOrderDetail>;
}
```

### Router 层

```typescript
// backend/src/routers/v1/admin/order.router.ts
const router = Router();

router.use(requireAdmin);
router.use(requireRole(['super_admin', 'user_operator']));

router.get('/', adminOrderController.list);
router.get('/summary', adminOrderController.getSummary);
router.get('/:orderId', adminOrderController.getDetail);
```

## 范围（做什么）

- 创建 `admin-order.ts` Zod Schema + TypeScript 类型定义
- 实现 `AdminOrderRepository` 数据访问层（多表联合查询）
- 实现 `AdminOrderService` 业务逻辑层
- 实现 `adminOrderController` 控制器 + 路由注册
- 订单列表 API（搜索 + 4 维度筛选 + 2 列排序 + 分页）
- 订单统计摘要 API（跟随筛选条件）
- 订单详情 API（6 个信息区块完整聚合）
- Paddle 手续费和净收入计算

## 边界（不做什么）

- 不实现退款 API（T13-005）
- 不实现 Paddle Webhook 接收（T10-005 已完成）
- 不实现前端页面（T13-010）
- 不实现订单统计图表（P2 功能）

## 涉及文件

- 新建: `backend/src/models/admin-order.ts` — Zod Schema + 类型
- 新建: `backend/src/repositories/admin-order.repository.ts` — 数据访问层
- 新建: `backend/src/services/admin-order.service.ts` — 业务逻辑层
- 新建: `backend/src/controllers/admin-order.controller.ts` — 控制器
- 新建: `backend/src/routers/v1/admin/order.router.ts` — 路由
- 修改: `backend/src/routers/v1/admin/index.ts` — 注册订单路由
- 不动: Paddle Webhook 相关代码（T10-005 已实现）

## 依赖

- 前置: T10-005（Paddle 支付集成/订单表）、T11-003（管理员鉴权）
- 后续: T13-005（退款管理 API）、T13-010（前端订单页）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录
   **WHEN** 调用 `GET /api/v1/admin/orders?page=1&page_size=20`
   **THEN** 返回分页订单列表，默认按订单日期降序，每项包含订单号/用户/课程/金额/支付方式/Paddle交易号/日期/状态

2. **GIVEN** 管理员已登录
   **WHEN** 调用 `GET /api/v1/admin/orders?keyword=ORD123`
   **THEN** 返回订单号前缀匹配「ORD123」的结果

3. **GIVEN** 管理员已登录
   **WHEN** 调用 `GET /api/v1/admin/orders?status=completed&levels=L4,L5&amount_min=5&amount_max=10`
   **THEN** 返回符合所有筛选条件的订单列表

4. **GIVEN** 管理员已登录且当前有筛选条件
   **WHEN** 调用 `GET /api/v1/admin/orders/summary` 加相同筛选参数
   **THEN** 返回 4 项统计数据（总订单数/总金额/退款数/退款金额），数值跟随筛选条件

5. **GIVEN** 存在一笔 Paddle 支付的订单
   **WHEN** 调用 `GET /api/v1/admin/orders/:orderId`
   **THEN** 返回完整 6 区块信息：订单信息 + 用户信息（昵称可跳转）+ 课程信息（进度/有效期）+ 支付信息（含 Paddle 手续费和净收入）+ 推荐返利信息 + 退款信息

6. **GIVEN** 订单存在推荐关系且返利在冷却中
   **WHEN** 查看订单详情推荐返利区块
   **THEN** 正确显示推荐人信息、返利金额、冷却剩余天数

7. **GIVEN** 订单已退款
   **WHEN** 查看订单详情退款信息区块
   **THEN** 显示退款单号/日期/金额/原因/操作人/状态/课程回收状态/返利扣回状态

8. **GIVEN** 订单 ID 不存在
   **WHEN** 调用 `GET /api/v1/admin/orders/:orderId`
   **THEN** 返回 404 错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 测试订单列表分页 + 搜索 + 筛选 + 排序
3. 测试统计摘要跟随筛选条件更新
4. 测试订单详情 6 个区块数据完整性
5. 测试不存在的订单 ID 返回 404
6. 测试非管理员访问返回 403

### 测试通过标准

- [ ] Docker 构建成功，后端容器正常运行
- [ ] 订单列表分页 + 搜索 + 筛选 + 排序正确
- [ ] 统计摘要数值准确，跟随筛选变化
- [ ] 订单详情 6 区块数据完整
- [ ] Paddle 手续费计算正确
- [ ] 推荐返利冷却天数正确
- [ ] 不存在订单返回 404
- [ ] 非管理员被拒绝（401/403）
- [ ] 订单列表首屏 < 2s，详情 < 1.5s

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-004-api-order-management.md`

## 自检重点

- [ ] 多表联合查询无 N+1 问题
- [ ] 统计摘要使用 SQL 聚合函数，非应用层计算
- [ ] Paddle 手续费公式正确（5% + $0.50）
- [ ] 推荐返利冷却天数计算正确
- [ ] Level 多选筛选正确解析
- [ ] SQL 查询参数化防注入
- [ ] 统一响应格式

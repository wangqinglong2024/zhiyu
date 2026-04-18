# T13-002: 后端 API — 用户详情 (Admin User Detail API)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10

## 需求摘要

为管理后台「用户详情页」实现后端 API，聚合展示单个用户的完整画像。详情页包含 6 个 Tab 的数据：基本信息（顶部固定区）、学习数据（已购课程 + 学习进度 + 评测记录 + 学习天数统计）、游戏数据（段位概览 + 各游戏胜率 + 段位变化历史 + 皮肤列表）、消费数据（消费汇总 + 订单列表）、知语币（余额 + 收支明细 + 管理员调整记录）、推荐关系（推荐人 + 被推荐人列表 + 累计返利）、封禁历史。各 Tab 数据通过独立 API 按需加载。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/02-user-detail.md` — 用户详情 PRD（6 Tab 完整定义）
- 非功能需求: `product/admin/03-admin-user-order/07-data-nonfunctional.md` — 性能（基本信息 <1s，Tab 切换 <1.5s）
- API 规约: `grules/04-api-design.md` — 子资源路径、分页
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 产品总纲: `product/00-product-overview.md` §五 — 课程/知语币/段位规则
- 关联任务: T13-001（用户列表 API）

## 技术方案

### API 端点设计

```
前缀: /api/v1/admin/users/:userId

GET    /                          — 用户基本信息（固定顶部区域）
GET    /learning                  — Tab1: 学习数据（已购课程 + 进度 + 评测 + 统计）
GET    /gaming                    — Tab2: 游戏数据（段位 + 各游戏数据 + 段位趋势 + 皮肤）
GET    /spending                  — Tab3: 消费数据（汇总 + 订单列表，支持分页）
GET    /coins                     — Tab4: 知语币（余额 + 收支明细，支持分页 + 筛选）
GET    /referrals                 — Tab5: 推荐关系（推荐人 + 被推荐人列表 + 返利汇总）
GET    /ban-history               — Tab6: 封禁历史（封禁/解封记录列表）
```

### Zod Schema 与响应类型

```typescript
// backend/src/models/admin-user-detail.ts
import { z } from 'zod';

// ===== 基本信息 =====
export interface AdminUserBasicInfo {
  id: string;
  nickname: string;
  email: string;
  avatar_url: string | null;
  status: 'normal' | 'banned';
  ban_expires_at: string | null;
  user_id_display: string;          // 格式 "ID: XXXXXXXX"
  registered_at: string;
  registration_method: 'email' | 'google' | 'apple';
  last_active_at: string | null;
  country: string | null;
  language_preference: string;       // UI 语言
  learning_mode: 'pinyin_zh' | 'zh_only';  // 学习语言模式
  last_device: string | null;        // 最近登录设备
}

// ===== 学习数据 Tab =====
export interface UserLearningData {
  purchased_courses: PurchasedCourse[];
  level_progress: LevelProgressDetail[];  // 可折叠的详细进度
  assessments: Assessment[];              // 评测记录
  study_stats: StudyStats;                // 学习天数统计
}

export interface PurchasedCourse {
  level: string;           // "L1" ~ "L12"
  course_name: string;
  purchase_date: string | null;   // L1-L3 为 null
  is_free: boolean;
  expires_at: string | null;      // L1-L3 为 "永久"
  progress_percent: number;       // 0-100
  assessment_status: 'not_started' | 'in_progress' | 'passed' | 'failed';
}

export interface LevelProgressDetail {
  level: string;
  course_name: string;
  completed_lessons: number;
  total_lessons: number;
  units: UnitProgress[];
}

export interface UnitProgress {
  unit_name: string;
  completed_lessons: number;
  total_lessons: number;
  unit_test_status: 'not_started' | 'passed' | 'failed';
  unit_test_score: number | null;
  lessons: LessonProgress[];
}

export interface LessonProgress {
  lesson_title: string;
  completed: boolean;
  quiz_score: number | null;
}

export interface Assessment {
  date: string;
  type: 'unit_test' | 'comprehensive_exam';
  level: string;
  unit: string | null;
  score: number;
  passed: boolean;
  has_certificate: boolean;
}

export interface StudyStats {
  total_study_days: number;
  current_streak: number;
  longest_streak: number;
}

// ===== 游戏数据 Tab =====
export interface UserGamingData {
  rank_overview: RankOverview;
  game_stats: GameStat[];
  rank_history: RankHistoryPoint[];
  skins: UserSkin[];
}

export interface RankOverview {
  current_rank: string;             // "bronze" ~ "king"
  current_stars: number;
  season_matches: number;
  season_win_rate: number;          // 0-100
}

export interface GameStat {
  game_id: string;                  // "G1" ~ "G12"
  game_name: string;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  max_streak: number;
}

export interface RankHistoryPoint {
  date: string;
  rank: string;
  stars: number;
}

export interface UserSkin {
  skin_id: string;
  skin_name: string;
  preview_url: string;
  source: 'purchase' | 'season_reward' | 'event';
}

// ===== 消费数据 Tab =====
export interface UserSpendingData {
  summary: SpendingSummary;
  orders: PaginatedResult<UserOrder>;
}

export interface SpendingSummary {
  total_course_spent: number;       // USD
  total_courses_bought: number;
  total_skin_spent: number;         // 知语币
  total_skins_bought: number;
}

export interface UserOrder {
  order_id: string;
  product: string;                  // "Level X: 课程名" 或 皮肤名
  amount: string;                   // "$X.XX" 或 "XX 知语币"
  payment_method: 'paddle' | 'apple_iap' | 'coins';
  order_date: string;
  status: 'completed' | 'refunded' | 'refunding';
}

// ===== 知语币 Tab =====
export interface UserCoinData {
  balance: number;                  // 当前余额（可为负数）
  balance_usd: number;              // 等值 USD
  transactions: PaginatedResult<CoinTransaction>;
  admin_adjustments: PaginatedResult<AdminCoinAdjustment>;
}

export interface CoinTransaction {
  date: string;
  reason_type: string;              // 事由类型
  reason_detail: string;            // 详细描述
  amount: number;                   // 正=收入，负=支出
  balance_after: number;
  operator: string;                 // "系统" 或管理员姓名
}

export interface AdminCoinAdjustment {
  date: string;
  admin_name: string;
  type: 'increase' | 'decrease';
  amount: number;
  reason: string;
  balance_after: number;
}

// ===== 推荐关系 Tab =====
export interface UserReferralData {
  referrer: ReferrerInfo | null;
  referees: PaginatedResult<RefereeInfo>;
  referral_summary: ReferralSummary;
}

export interface ReferrerInfo {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  referred_date: string;
}

export interface RefereeInfo {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  registered_at: string;
  user_type: 'guest' | 'free' | 'paid';
  reward_amount: number | null;
  reward_status: 'issued' | 'cooling' | 'clawed_back' | null;
  cooling_days_remaining: number | null;
}

export interface ReferralSummary {
  total_earned: number;
  total_consumed: number;
  total_clawed_back: number;
}

// ===== 封禁历史 Tab =====
export interface BanHistoryRecord {
  banned_at: string;
  ban_reason_category: string;
  ban_reason_detail: string | null;
  ban_duration: string;             // "1天" / "7天" / "30天" / "永久"
  banned_by_admin: string;
  unbanned_at: string | null;
  unban_method: 'auto_expired' | 'manual' | null;
  unbanned_by_admin: string | null;
}

// 知语币明细筛选参数
export const CoinTransactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  reason_type: z.string().optional(),  // 按事由类型筛选
});

// 消费订单分页参数
export const UserOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Repository 层

```typescript
// backend/src/repositories/admin-user-detail.repository.ts
export class AdminUserDetailRepository {
  async findBasicInfo(userId: string): Promise<AdminUserBasicInfo | null>;
  async findLearningData(userId: string): Promise<UserLearningData>;
  async findGamingData(userId: string, season?: string): Promise<UserGamingData>;
  async findSpendingData(userId: string, query: UserOrderQuery): Promise<UserSpendingData>;
  async findCoinData(userId: string, query: CoinTransactionQuery): Promise<UserCoinData>;
  async findReferralData(userId: string): Promise<UserReferralData>;
  async findBanHistory(userId: string): Promise<BanHistoryRecord[]>;
}
```

### Service 层

```typescript
// backend/src/services/admin-user-detail.service.ts
export class AdminUserDetailService {
  // 业务规则：
  // - 用户不存在时返回 404
  // - 各 Tab 数据独立加载，互不影响
  // - 学习进度百分比 = 已完成 Lesson 数 / 总 Lesson 数 × 100
  // - 段位历史支持按赛季筛选（当前赛季/上赛季/全部）
  // - 知语币明细支持按事由类型筛选
  // - 负余额红色显示由前端处理，后端仅返回数值

  async getUserBasicInfo(userId: string): Promise<AdminUserBasicInfo>;
  async getUserLearningData(userId: string): Promise<UserLearningData>;
  async getUserGamingData(userId: string, season?: string): Promise<UserGamingData>;
  async getUserSpendingData(userId: string, query: UserOrderQuery): Promise<UserSpendingData>;
  async getUserCoinData(userId: string, query: CoinTransactionQuery): Promise<UserCoinData>;
  async getUserReferralData(userId: string): Promise<UserReferralData>;
  async getUserBanHistory(userId: string): Promise<BanHistoryRecord[]>;
}
```

### Router 层

```typescript
// backend/src/routers/v1/admin/user-detail.router.ts（或合并到 user.router.ts）
router.get('/:userId', adminUserDetailController.getBasicInfo);
router.get('/:userId/learning', adminUserDetailController.getLearningData);
router.get('/:userId/gaming', adminUserDetailController.getGamingData);
router.get('/:userId/spending', adminUserDetailController.getSpendingData);
router.get('/:userId/coins', adminUserDetailController.getCoinData);
router.get('/:userId/referrals', adminUserDetailController.getReferralData);
router.get('/:userId/ban-history', adminUserDetailController.getBanHistory);
```

## 范围（做什么）

- 创建 `admin-user-detail.ts` 类型定义与 Zod Schema
- 实现 `AdminUserDetailRepository` 数据访问层（多表聚合查询）
- 实现 `AdminUserDetailService` 业务逻辑层
- 实现 `adminUserDetailController` 控制器 + 路由注册
- 基本信息 API：10 个字段完整返回
- 学习数据 API：已购课程 + 学习进度（支持折叠展开的 Unit/Lesson 明细）+ 评测记录 + 学习天数统计
- 游戏数据 API：段位概览 + 12 游戏胜率表 + 段位变化趋势数据 + 皮肤列表
- 消费数据 API：消费汇总 + 分页订单列表
- 知语币 API：余额 + 分页收支明细（支持事由类型筛选）+ 管理员调整记录
- 推荐关系 API：推荐人信息 + 被推荐人列表 + 累计返利汇总
- 封禁历史 API：封禁/解封完整记录

## 边界（不做什么）

- 不实现封禁/解封操作（T13-003）
- 不实现知语币调整操作（T13-006）
- 不实现前端页面（T13-008）
- 不实现段位变化趋势的图表渲染（前端处理）
- 不建表（依赖已有表结构）

## 涉及文件

- 新建: `backend/src/models/admin-user-detail.ts` — 类型定义 + Zod Schema
- 新建: `backend/src/repositories/admin-user-detail.repository.ts` — 数据访问层
- 新建: `backend/src/services/admin-user-detail.service.ts` — 业务逻辑层
- 新建: `backend/src/controllers/admin-user-detail.controller.ts` — 控制器
- 修改: `backend/src/routers/v1/admin/user.router.ts` — 增加详情子路由
- 不动: `backend/src/core/middleware.ts` — 鉴权中间件

## 依赖

- 前置: T13-001（用户列表路由基础）
- 后续: T13-008（前端用户详情页）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录且目标用户存在
   **WHEN** 调用 `GET /api/v1/admin/users/:userId`
   **THEN** 返回用户基本信息，包含 10 个字段（昵称/邮箱/头像/状态/注册日期/方法/最近活跃/国家/语言偏好/设备信息）

2. **GIVEN** 目标用户 ID 不存在
   **WHEN** 调用 `GET /api/v1/admin/users/:userId`
   **THEN** 返回 404 错误「用户不存在」

3. **GIVEN** 用户已购买 L4、L5 课程，L1-L3 免费
   **WHEN** 调用 `GET /api/v1/admin/users/:userId/learning`
   **THEN** 返回 5 条已购课程记录，L1-L3 标记为免费 + 永久有效期，L4/L5 包含购买日期/有效期/进度百分比/考核状态

4. **GIVEN** 用户有游戏记录
   **WHEN** 调用 `GET /api/v1/admin/users/:userId/gaming`
   **THEN** 返回段位概览（段位/星数/场次/胜率）+ 12 游戏明细 + 段位趋势数据点 + 皮肤列表

5. **GIVEN** 用户有多笔订单
   **WHEN** 调用 `GET /api/v1/admin/users/:userId/spending?page=1&page_size=10`
   **THEN** 返回消费汇总（课程总消费/皮肤总消费）+ 分页订单列表

6. **GIVEN** 用户知语币余额为 -230
   **WHEN** 调用 `GET /api/v1/admin/users/:userId/coins`
   **THEN** 返回 balance=-230，balance_usd=-2.30，收支明细含退款扣回记录

7. **GIVEN** 用户有推荐人和 3 个被推荐用户
   **WHEN** 调用 `GET /api/v1/admin/users/:userId/referrals`
   **THEN** 返回推荐人信息 + 3 条被推荐人记录（含返利状态）+ 累计返利汇总

8. **GIVEN** 用户有 2 次封禁记录
   **WHEN** 调用 `GET /api/v1/admin/users/:userId/ban-history`
   **THEN** 返回 2 条记录，每条包含封禁时间/原因/期限/操作人/解封信息，按封禁时间降序

9. **GIVEN** 管理员已登录
   **WHEN** 调用知语币明细 `GET /api/v1/admin/users/:userId/coins?reason_type=referral_reward`
   **THEN** 返回仅「推荐返利」类型的收支记录

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 等待后端健康检查通过
3. 使用管理员 JWT Token 逐一调用 7 个子端点验证数据完整性
4. 验证不存在的用户 ID 返回 404
5. 验证各 Tab 数据互不影响、独立加载
6. 验证分页和筛选参数生效

### 测试通过标准

- [ ] Docker 构建成功，后端容器正常运行
- [ ] 基本信息 API 返回 10 个完整字段
- [ ] 学习数据含已购课程 + 进度 + 评测 + 统计
- [ ] 游戏数据含段位 + 12 游戏 + 趋势 + 皮肤
- [ ] 消费数据含汇总 + 分页订单
- [ ] 知语币含余额 + 分页明细 + 筛选
- [ ] 推荐关系含推荐人 + 被推荐人 + 汇总
- [ ] 封禁历史记录完整
- [ ] 用户不存在返回 404
- [ ] 基本信息 API 响应 < 1s，Tab 数据 < 1.5s

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-002-api-user-detail.md`

## 自检重点

- [ ] 7 个端点路径设计合理，遵循子资源路径规范
- [ ] 各 Tab 数据独立查询，无 N+1 查询问题
- [ ] 学习进度百分比计算正确
- [ ] 负余额正确返回负数值
- [ ] 段位趋势数据点按日期排序
- [ ] 分页参数默认值合理
- [ ] Zod 校验覆盖查询参数
- [ ] SQL 查询参数化防注入
- [ ] 文件命名 kebab-case，函数命名 camelCase

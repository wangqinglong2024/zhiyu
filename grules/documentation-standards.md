# 代码注释与文档规范 (Documentation Standards)

> **版本**: v1.0 | **最后更新**: 2025-07-16
>
> **适用范围**：所有基于本规范体系的项目。AI 生成的任何代码、文档、注释必须遵循此规范。
> **核心理念**：文档是"给未来的自己和其他 AI 会话的信"——写清楚"为什么"和"怎么用"，而不是复述代码。

---

## 一、代码注释规范

### 1. 注释语言铁律

| 场景 | 语言 | 示例 |
|------|------|------|
| 代码内注释（行注释、块注释） | **简体中文** | `// 使用乐观锁防止并发扣款` |
| 变量名、函数名、类名 | **英文** | `handlePayment`, `UserService` |
| JSDoc 的描述文本 | **简体中文** | `/** 根据用户 ID 获取钱包余额 */` |
| JSDoc 的参数名、类型 | **英文** | `@param userId - 用户唯一标识` |
| Markdown 文档（PRD、README 等） | **简体中文** | 全文中文，技术术语保持英文原貌 |
| Git Commit Message 的描述 | **简体中文** | `feat(auth): 新增手机号验证码登录` |

### 2. 注释三原则

1. **解释"为什么"，不解释"做了什么"**
   ```typescript
   // ❌ 坏注释：给 count 加 1
   count += 1

   // ✅ 好注释：重试计数 +1，超过 3 次将触发断路器熔断
   count += 1
   ```

2. **标记业务决策和约束条件**
   ```typescript
   // ✅ 微信支付要求金额为整数分，此处将元转分并取整
   const amountFen = Math.round(decimalAmount * 100)

   // ✅ RLS 策略要求：普通用户只能查看自己的订单，管理员可查看所有
   if (!currentUser.isAdmin) {
     query = query.eq('user_id', currentUser.id)
   }
   ```

3. **在复杂逻辑前提供"导航图"**
   ```typescript
   /**
    * 支付流程：
    * 1. 校验订单状态（必须为 pending）
    * 2. 锁定订单行（SELECT FOR UPDATE）
    * 3. 调用微信统一下单 API
    * 4. 更新订单状态为 paying
    * 5. 返回前端调起支付的参数
    */
   async function createPayment(orderId: string) { ... }
   ```

### 3. 禁止事项

- ❌ **禁止无意义注释**：`// 定义变量`、`// 循环`、`// 返回结果`
- ❌ **禁止注释掉的代码残留**：确认废弃就删除，Git 有历史记录
- ❌ **禁止 TODO 无归属**：写 `// TODO(2026-04-10): 用户投诉后需增加退款超时保护` 而非 `// TODO: fix this`
- ❌ **禁止过时注释**：修改代码后必须同步更新关联注释，注释与代码不一致比没有注释更有害
- ❌ **禁止在注释中暴露密钥、密码、内部 IP 等敏感信息**

### 4. TypeScript / React 注释规范

#### 组件注释（JSDoc 格式）
```tsx
/**
 * 用户钱包余额卡片
 *
 * 展示用户当前余额、收支概览，点击可进入钱包详情页。
 * 余额单位为"分"，组件内部会自动转换为"元"展示。
 *
 * @example
 * <WalletCard userId="uuid-xxx" onTap={() => navigate('/wallet')} />
 */
export const WalletCard: FC<WalletCardProps> = ({ userId, onTap }) => { ... }
```

#### Hook 注释
```tsx
/**
 * 管理分页列表的加载状态与数据
 *
 * 封装了首次加载、加载更多、下拉刷新三种状态的统一管理。
 * 内部使用 React Query 的 useInfiniteQuery。
 *
 * @param queryKey - React Query 缓存键
 * @param fetchFn - 分页请求函数，接收 page 参数
 * @returns 列表数据、加载状态、loadMore/refresh 方法
 */
export function usePaginatedList<T>(queryKey: string[], fetchFn: FetchFn<T>) { ... }
```

#### 类型定义注释
```typescript
/** 支付订单状态（严格单向流转，见 coding-standards.md §十.2） */
type PaymentStatus =
  | 'pending'    // 待支付
  | 'paying'     // 支付中（已调起微信支付）
  | 'paid'       // 已支付（回调确认）
  | 'completed'  // 已完成（业务处理完毕）
  | 'failed'     // 支付失败
  | 'refunding'  // 退款中
  | 'refunded'   // 已退款
```

### 5. 后端 Express/TypeScript 注释规范

#### 路由函数（JSDoc）
```typescript
/**
 * 发起微信支付。
 *
 * 业务流程：
 * 1. 校验订单状态为 pending 且属于当前用户
 * 2. 行锁订单（FOR UPDATE）防止并发重复支付
 * 3. 调用微信统一下单 API 获取 prepay_id
 * 4. 订单状态流转：pending → paying
 * 5. 返回前端拉起微信支付所需的参数（签名后）
 *
 * @throws BizError(40402) 订单不存在
 * @throws BizError(40301) 无权操作他人订单
 * @throws BizError(40901) 订单状态不允许支付（非 pending）
 */
router.post('/:orderId/pay', authMiddleware, async (req, res) => {
  // ...
})
```

#### Service 层函数
```typescript
/**
 * 扣减用户余额（通过 PostgreSQL 存储过程，单事务内完成）。
 *
 * 安全保障：
 * - 行锁防并发：存储过程内 SELECT FOR UPDATE
 * - 余额校验：扣减前检查 balance >= amountFen
 * - 流水记录：扣减与流水插入在同一事务，要么全成功要么全回滚
 *
 * @param userId - 用户 UUID
 * @param amountFen - 扣减金额（单位：分）。必须为正整数
 * @param reason - 扣减原因（写入流水表 remark 字段）
 * @returns true 扣减成功，false 余额不足
 * @throws BizError(50001) 数据库操作异常（需人工排查）
 */
async function deductBalance(userId: string, amountFen: number, reason: string): Promise<boolean> {
  // ...
}
```

#### Zod Schema 字段（必须有 describe）
```typescript
const OrderCreateSchema = z.object({
  /** 创建订单请求体 */
  productId: z.string().uuid().describe('商品 ID（UUID 格式）'),
  quantity: z.number().int().min(1).max(99).describe('购买数量，1~99'),
  couponCode: z.string().max(32).optional().describe('优惠券码（可选）'),
})
```

### 6. SQL / Migration 注释规范

```sql
-- ============================================================
-- 迁移：创建钱包与流水表
-- 日期：2026-04-08
-- 目的：支撑用户余额充值、消费、退款功能
-- 受影响模块：支付模块、用户中心
-- 回滚策略：DROP TABLE wallet_transactions; DROP TABLE wallets;
-- ============================================================

-- 钱包表：每个用户一个钱包，余额用 BIGINT 存储（单位：分）
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),  -- 余额（分），禁止为负
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)  -- 一人一钱包
);

-- 流水表：只 INSERT 不 UPDATE/DELETE（审计铁律）
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('topup', 'consume', 'refund', 'reward')),
    amount_fen BIGINT NOT NULL,  -- 正数=收入，负数=支出
    balance_after BIGINT NOT NULL,  -- 变动后余额快照（对账用）
    remark TEXT,  -- 变动原因（如"购买商品 xxx"）
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 开启 RLS（铁律：建表后第一条语句）
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能看自己的钱包
CREATE POLICY "wallets_owner_select" ON wallets
    FOR SELECT USING (user_id = auth.uid());
```

### 7. CSS / Tailwind 注释规范

```css
/* ===== 毛玻璃基线面板 =====
 * 物理参数来源：rules.md §一-2
 * - blur(24px) + saturate(1.8)：模拟真实毛玻璃的折射质感
 * - 边框透明度：模拟玻璃切边反光
 * - 内阴影：模拟光线打在玻璃厚度上的高光
 */
.glass { ... }

/* Light/Dark 模式切换通过 CSS 变量控制，见 :root 和 .dark 定义 */
```

---

## 二、Markdown 文档规范

### 1. 文件头元数据（所有 .md 文件强制）

```markdown
# 文档标题 (English Title)

> **版本**: v1.0 | **最后更新**: YYYY-MM-DD
>
> **简述**：一句话说明文档用途和适用范围。
```

### 2. 项目 README.md 标准模板

每个项目根目录必须包含 README.md，结构如下：

```markdown
# 项目名称

> 一句话描述项目核心价值。

## 技术栈
- 前端：Vite + React + TypeScript + Tailwind CSS v4
- 后端：Express + TypeScript + Node.js
- 数据库：Supabase (PostgreSQL)
- 容器化：Docker + Docker Compose

## 本地开发（Docker）

### 前置条件
- Docker + Docker Compose

### 启动
\```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 启动所有服务
docker compose up -d --build

# 3. 访问
# 前端：http://115.159.109.23:{端口}
# 后端：http://115.159.109.23:{端口}/api/v1/docs
\```

### 常用命令
\```bash
docker compose logs -f backend   # 查看后端日志
docker compose restart frontend  # 重启前端
docker compose down              # 停止所有服务
\```

## 项目结构
（按 project-structure.md 规范，简要列出核心目录）

## 环境变量说明
| 变量名 | 说明 | 示例 |
|--------|------|------|
| APP_ENV | 运行环境 | dev / staging / production |
| SUPABASE_URL | Supabase API 地址 | http://supabase-kong:8000 |
| ... | ... | ... |

## 部署
详见 `grules/deployment.md`

## 开发规范
详见 `grules/index.md`（规范文件索引）
```

### 3. 技术方案文档模板

重大技术决策（新增模块、架构变更、中间件引入）必须先写文档再动手：

```markdown
# 技术方案：[方案标题]

> **日期**: YYYY-MM-DD | **状态**: 草案 / 已采纳 / 已废弃

## 背景
为什么需要做这件事？当前面临什么问题？

## 目标
解决什么问题？衡量成功的指标是什么？

## 方案选型

### 方案 A：[名称]
- **描述**：简述方案
- **优点**：xxx
- **缺点**：xxx
- **工期**：约 N 天

### 方案 B：[名称]
- **描述**：简述方案
- **优点**：xxx
- **缺点**：xxx
- **工期**：约 N 天

## 决策
选择方案 X。原因：xxx

## 实施计划
1. 第一步：xxx
2. 第二步：xxx

## 风险与应对
| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|

## 影响范围
- 受影响的模块/文件：xxx
- 是否需要数据库迁移：是/否
- 是否需要修改部署配置：是/否
```

### 4. Changelog 规范

每个项目维护 `CHANGELOG.md`，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/)：

```markdown
# 变更日志

本文件记录项目的所有重要变更。格式基于 Keep a Changelog。

## [未发布]

### 新增
- 用户钱包充值功能 (#T-2.3)

### 修复
- 修复长消息截断显示问题 (#BUG-015)

### 变更
- 登录页 CTA 按钮从 Sky 色改为 Rose 色

---

## [1.0.0] - 2026-04-01

### 新增
- 手机号验证码登录
- 内容浏览与搜索
- 个人中心

### 安全
- 全接口启用 HTTPS + HSTS
- 所有表启用 RLS
```

分类说明：
- **新增 (Added)**：新功能
- **修复 (Fixed)**：Bug 修复
- **变更 (Changed)**：已有功能的变更
- **移除 (Removed)**：被移除的功能
- **安全 (Security)**：安全相关的修复或改进
- **弃用 (Deprecated)**：即将移除的功能

---

## 三、AI 生成内容的规范

### 1. AI 输出格式标准

AI 在回答问题或生成方案时，必须遵循以下格式规范：

| 场景 | 格式要求 |
|------|---------|
| 代码生成 | 完整可运行的代码块，包含必要的 import 和类型定义 |
| 方案分析 | 结构化列表/表格，不写散文 |
| 问题排查 | 按"现象→原因→修复→验证"四步输出 |
| 任务交付 | 交付清单（新增/修改的文件 + 验收方式 + 完成状态） |

### 2. AI 生成代码的注释密度

| 代码类型 | 注释要求 |
|---------|---------|
| 路由/API 端点 | 必须有完整 Docstring（功能描述 + 业务流程 + 异常说明） |
| Service 层函数 | 必须有 Docstring（安全保障 + 参数说明 + 返回值 + 异常） |
| 复杂算法/业务逻辑 | 每个关键步骤前加行注释，开头有"导航图"注释 |
| 工具函数 (utils) | 必须有 Docstring（用途 + 示例 + 边界说明） |
| React 组件 | 必须有 JSDoc（用途 + 展示说明 + 示例用法） |
| 自定义 Hook | 必须有 JSDoc（用途 + 返回值说明 + 使用示例） |
| 类型定义 | 每个复杂类型/枚举值必须有行注释 |
| CSS 全局类 | 每组类前有块注释说明用途和物理参数来源 |
| SQL Migration | 文件头必须有迁移元数据块（日期、目的、回滚、影响范围） |
| 配置文件 (Docker/Nginx) | 关键配置项必须有行注释说明 |
| 简单 CRUD / 直观逻辑 | 不需要额外注释（代码本身即文档） |

### 3. AI 交付时必须附带的文档

每个开发任务完成后，AI 必须输出：

```markdown
## 交付清单

### 新增文件
- `frontend/src/features/wallet/components/WalletCard.tsx` — 钱包余额卡片组件
- `backend/src/services/wallet-service.ts` — 钱包业务逻辑

### 修改文件
- `backend/src/routers/v1/index.ts` — 注册钱包路由
- `supabase/migrations/20260408_create_wallets.sql` — 新建钱包表

### 验收方式
1. 启动 Docker 容器：`docker compose up -d --build`
2. 访问 `http://115.159.109.23:3100/wallet` 查看钱包页面
3. 预期效果：显示余额 ¥0.00，可正常加载

### 完成状态
✅ 完成 — 代码自测通过，check-list 全绿
```

### 4. AI 解读错误/日志时的输出模板

```markdown
## 问题诊断

### 现象
[粘贴错误日志或截图说明]

### 根因
[一句话说明根本原因]

### 修复方案
[具体修改的文件和代码]

### 验证步骤
1. [如何确认修复生效]
2. [如何确认无回归]

### 预防措施
[如何避免同类问题再次出现]
```

---

## 四、文件头注释模板速查

### TypeScript 文件
```typescript
/**
 * @fileoverview 钱包模块 - 余额查询与变动服务
 * @module features/wallet/services/wallet-service
 *
 * 封装所有与钱包相关的 API 调用，搭配 React Query 使用。
 * 金额单位统一为"分"（后端存储格式），展示时由组件自行转换为"元"。
 */
```

### 后端 TypeScript 文件
```typescript
/**
 * 钱包服务层 - 余额操作与流水管理
 *
 * 职责：
 * - 查询余额（走缓存优先，60s TTL）
 * - 扣减余额（调用 PostgreSQL 存储过程，单事务保证原子性）
 * - 充值（对接微信支付回调，验签后入账）
 * - 流水查询（分页，只读，按时间倒序）
 *
 * 安全：所有写操作通过行锁 + 幂等键保证并发安全。
 */
```

### CSS 文件
```css
/**
 * 全局样式定义 — Cosmic Refraction 设计系统
 *
 * 包含：毛玻璃面板（.glass 系列）、按钮体系、输入框、渐变网格背景
 * 物理参数来源：grules/rules.md §一（Cosmic Refraction UI 规范）
 * 设计系统同步：grules/product-design.md §三（Stitch 设计系统映射表）
 *
 * ⚠️ 修改此文件后必须：
 * 1. 同步更新 Stitch 设计系统 (update_design_system)
 * 2. Docker 重建前端验证 (docker compose up -d --build frontend)
 */
```

---

## 五、项目文档矩阵

每个项目必须包含以下文档，缺一不可：

| 文档 | 路径 | 职责 | 维护频率 |
|------|------|------|---------|
| README.md | 项目根目录 | 项目概览、启动指引 | 每有结构性变更时更新 |
| CHANGELOG.md | 项目根目录 | 版本变更记录 | 每次发版时更新 |
| .env.example | 项目根目录 | 环境变量模板（无真实值） | 新增/删除环境变量时更新 |
| PRD | product/prd-{项目名}.md | 产品需求文档 | 需求变更时更新 |
| 数据库迁移 | supabase/migrations/*.sql | Schema 变更历史 | 每次表结构变更时新增 |
| API 文档 | swagger-ui-express 自动生成（dev 环境） | 接口定义 | 自动（Zod Schema 驱动） |

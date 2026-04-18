# T12-004: 后端 API — 每日金句管理 (Daily Quote Management API)

> 分类: 12-管理后台-内容管理 (Admin Content Management)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8+

## 需求摘要

为管理后台「每日金句」模块实现完整的后端 API，涵盖金句 CRUD、多语言字段（pinyin/zh/en/vi）、日历排期、排期冲突检测、自动发布定时任务、状态流转（草稿→已排期→已发布→已过期）。支持列表视图和日历视图的数据查询。所有接口需管理员鉴权 + 操作日志。

## 相关上下文

- 产品需求: `product/admin/02-admin-content/03-daily-quote.md` — 每日金句管理 PRD
- 数据模型: `product/admin/02-admin-content/04-data-nonfunctional.md` — 金句数据流
- API 规约: `grules/04-api-design.md`
- 编码规范: `grules/05-coding-standards.md`
- 关联任务: T03-002（金句数据库表）、T11-003（管理员鉴权）

## 技术方案

### 数据库表结构（引用 T03-002 已创建的表）

```sql
-- daily_quotes 表
CREATE TABLE daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_zh TEXT NOT NULL,              -- 中文金句（限 100 字）
  content_pinyin TEXT NOT NULL,          -- 拼音标注
  content_en TEXT NOT NULL,              -- 英文翻译
  content_vi TEXT NOT NULL,              -- 越南语翻译
  source_author TEXT NOT NULL,           -- 来源/出处（作者或典籍）
  background_image_url TEXT,             -- 背景图 URL
  scheduled_date DATE,                   -- 排期日期（唯一，一天一条）
  status TEXT DEFAULT 'draft',           -- draft | scheduled | published | expired
  published_at TIMESTAMPTZ,             -- 实际发布时间
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 唯一约束：一天只能排一条金句
CREATE UNIQUE INDEX idx_dq_scheduled_date ON daily_quotes(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- 索引
CREATE INDEX idx_dq_status ON daily_quotes(status);
CREATE INDEX idx_dq_scheduled ON daily_quotes(scheduled_date);
```

### API 端点设计

```
前缀: /api/v1/admin/quotes

# 金句 CRUD
GET    /                      — 金句列表（分页 + 筛选）
GET    /calendar              — 日历视图数据（按月查询）
GET    /:id                   — 金句详情
POST   /                      — 新建金句
PUT    /:id                   — 编辑金句
DELETE /:id                   — 删除金句（仅草稿）

# 排期操作
PATCH  /:id/schedule          — 设置/修改排期日期
PATCH  /:id/unschedule        — 取消排期（→草稿）

# 自动发布（内部定时任务，非外部 API）
# Supabase Edge Function / pg_cron 触发
```

### Zod Schema 定义

```typescript
// backend/src/models/daily-quote.ts
import { z } from 'zod';

export const QuoteStatusEnum = z.enum(['draft', 'scheduled', 'published', 'expired']);

export const CreateQuoteSchema = z.object({
  content_zh: z.string().min(1).max(100),
  content_pinyin: z.string().min(1),
  content_en: z.string().min(1).max(200),
  content_vi: z.string().min(1).max(200),
  source_author: z.string().min(1).max(50),
  background_image_url: z.string().url().optional().nullable(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const UpdateQuoteSchema = CreateQuoteSchema.partial();

export const QuoteListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  status: QuoteStatusEnum.optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  keyword: z.string().optional(),
  sort_by: z.enum(['created_at', 'scheduled_date']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const CalendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2024).max(2030),
  month: z.coerce.number().int().min(1).max(12),
});

export const ScheduleQuoteSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

### Service 层核心逻辑

```typescript
// backend/src/services/daily-quote.service.ts
export class DailyQuoteService {
  // CRUD
  async listQuotes(query: QuoteListQuery): Promise<PaginatedResult<DailyQuote>>;
  async getQuote(id: string): Promise<DailyQuote>;
  async createQuote(data: CreateQuoteInput, userId: string): Promise<DailyQuote>;
  async updateQuote(id: string, data: UpdateQuoteInput, userId: string): Promise<DailyQuote>;
  async deleteQuote(id: string, userId: string): Promise<void>;
  
  // 排期
  async scheduleQuote(id: string, date: string, userId: string): Promise<DailyQuote>;
  async unscheduleQuote(id: string, userId: string): Promise<DailyQuote>;
  
  // 日历视图
  async getCalendarData(year: number, month: number): Promise<CalendarDayData[]>;
  async getMonthStats(year: number, month: number): Promise<MonthStats>;
  
  // 自动发布（定时任务调用）
  async autoPublish(): Promise<void>;
  async autoExpire(): Promise<void>;
  
  // 排期冲突检测
  async checkScheduleConflict(date: string, excludeId?: string): Promise<ConflictInfo | null>;
  
  // 业务规则：
  // - 排期日期不可选过去（今天及以后可选）
  // - 一天只能排一条金句（唯一约束 + 应用层校验）
  // - 已排期不可删除，需先取消排期
  // - 已发布/已过期不可编辑和删除
  // - 编辑已排期金句：可改内容和日期
  // - 创建时如有 scheduled_date 且校验通过 → 状态直接为 scheduled
  // - 创建时无 scheduled_date → 状态为 draft
}
```

### 日历视图数据结构

```typescript
interface CalendarDayData {
  date: string;               // '2026-04-18'
  has_quote: boolean;
  quote_summary?: string;     // 金句内容前 15 字
  quote_id?: string;
  status?: 'scheduled' | 'published' | 'expired';
  is_past: boolean;
  is_today: boolean;
}

interface MonthStats {
  scheduled_days: number;
  unscheduled_days: number;   // 未来日期中未排期的天数
  published_days: number;
}
```

### 自动发布定时任务

```typescript
// 使用 Supabase pg_cron 或 Edge Function 实现
// 每天 00:00 UTC+7 执行

// 1. 自动发布：将 scheduled_date = 今天 且 status = 'scheduled' 的金句 → 'published'
// 2. 自动过期：如果有新金句发布，将昨天的 'published' 金句 → 'expired'
// 3. 空白日处理：若今天无排期金句，不做操作（复用上一条 published 金句）

// 后端 API 提供手动触发入口（用于测试）：
// POST /api/v1/admin/quotes/trigger-publish  (仅 super_admin)
```

### 统一响应格式

```typescript
// 排期冲突响应
{ code: 40002, data: { conflict_quote_id: '...', conflict_quote_summary: '...' }, message: '该日期已有排期金句' }

// 日历视图响应
{ code: 0, data: { days: CalendarDayData[], stats: MonthStats }, message: 'ok' }
```

## 范围（做什么）

- 创建 `daily-quote.ts` Zod Schema + TypeScript 类型
- 实现 DailyQuoteRepository 数据访问层
- 实现 DailyQuoteService 业务逻辑（含排期冲突检测、日历数据查询）
- 实现 Controller + Router 注册
- 实现日历视图数据查询接口（按月返回每日排期状态）
- 实现排期冲突检测逻辑
- 实现自动发布定时任务（Supabase Edge Function 或 pg_cron）
- 实现空白日处理逻辑
- 所有写操作记录 audit_log

## 边界（不做什么）

- 不实现金句分享图片生成（属于 C 端功能）
- 不实现金句背景图上传（仅存储 URL）
- 不实现拼音自动生成（前端调用拼音库，API 仅接收）
- 不建表（T03-002 已完成）
- 不实现 C 端金句展示 API（属于 T03 模块）
- 不实现仪表盘提醒卡片（属于 T11 模块）

## 涉及文件

- 新建: `backend/src/models/daily-quote.ts` — Zod Schema + 类型
- 新建: `backend/src/repositories/daily-quote.repository.ts`
- 新建: `backend/src/services/daily-quote.service.ts`
- 新建: `backend/src/controllers/daily-quote.controller.ts`
- 新建: `backend/src/routers/v1/admin/daily-quote.router.ts`
- 新建: `supabase/functions/auto-publish-quote/index.ts` — 定时发布 Edge Function
- 修改: `backend/src/routers/v1/admin/index.ts` — 注册金句路由

## 依赖

- 前置: T03-002（金句数据库表）、T11-003（管理员鉴权）
- 后续: T12-009（每日金句管理前端页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录  
   **WHEN** 调用 `GET /api/v1/admin/quotes?status=draft&page=1`  
   **THEN** 返回草稿状态金句列表，分页正确

2. **GIVEN** 管理员已登录  
   **WHEN** 调用 `POST /api/v1/admin/quotes` 提交完整金句数据含 scheduled_date  
   **THEN** 金句创建成功，状态为 scheduled，排期日期正确

3. **GIVEN** 4 月 20 日已有排期金句  
   **WHEN** 调用 `PATCH /api/v1/admin/quotes/:id/schedule` 设置另一条金句排期到 4 月 20 日  
   **THEN** 返回排期冲突错误，含冲突金句信息

4. **GIVEN** 一条已排期金句  
   **WHEN** 调用 `DELETE /api/v1/admin/quotes/:id`  
   **THEN** 返回错误「已排期金句不可删除，请先取消排期」

5. **GIVEN** 管理员查看 2026 年 4 月日历  
   **WHEN** 调用 `GET /api/v1/admin/quotes/calendar?year=2026&month=4`  
   **THEN** 返回 30 天数据，每天含 has_quote/status/quote_summary 等字段，stats 包含月度统计

6. **GIVEN** 今天是排期日且有一条 scheduled 金句  
   **WHEN** 自动发布任务执行  
   **THEN** 金句状态变为 published，published_at 记录时间

7. **GIVEN** 连续 3 天无排期金句  
   **WHEN** 查询应用端当日金句  
   **THEN** 返回最近一条 published 金句（复用机制）

8. **GIVEN** 一条已发布金句  
   **WHEN** 调用 `PUT /api/v1/admin/quotes/:id` 尝试编辑  
   **THEN** 返回错误「已发布金句不可编辑」

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 等待后端服务健康检查通过
3. 验证金句 CRUD 全流程
4. 验证排期 + 取消排期 + 排期冲突检测
5. 测试日历视图数据返回
6. 手动触发自动发布任务，验证状态流转
7. 验证删除保护规则
8. 检查 audit_log 表记录

### 测试通过标准

- [ ] Docker 构建成功
- [ ] 金句 CRUD 全通过
- [ ] 排期冲突检测正确（唯一约束 + 应用层）
- [ ] 日历视图数据正确（含 stats 统计）
- [ ] 自动发布任务正常执行
- [ ] 空白日复用机制生效
- [ ] 状态流转完整：草稿 → 已排期 → 已发布 → 已过期
- [ ] 已发布/已过期金句不可编辑和删除
- [ ] audit_log 记录完整

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/12-admin-content/` 下创建同名结果文件

结果文件路径: `/tasks/result/12-admin-content/T12-004-api-daily-quote-management.md`

## 自检重点

- [ ] scheduled_date 唯一约束（数据库层 + 应用层双重校验）
- [ ] 日期校验：不可选过去日期
- [ ] 自动发布定时任务时区为 UTC+7
- [ ] 空白日复用逻辑：查询最近一条 published 金句
- [ ] 已发布/已过期金句只读
- [ ] 日历视图返回完整月度数据（含空白日标记）
- [ ] 所有写操作记录 audit_log

# T12-001: 后端 API — 文章管理 (Article Management API)

> 分类: 12-管理后台-内容管理 (Admin Content Management)
> 状态: 📋 待开发
> 复杂度: L(大)
> 预估文件数: 12+

## 需求摘要

为管理后台「发现中国」文章模块实现完整的后端 API，涵盖文章 CRUD、多语言字段（pinyin/zh/en/vi）、上架/下架状态流转、批量操作、分页筛选与排序。所有接口需管理员鉴权（超级管理员 + 内容运营），并记录操作日志。

**核心流程**：Dify 工作流生成文章 → 写入 Supabase（状态=草稿，来源=Dify）→ 后台审核/编辑 → 手动上架 → 用户端可见。

## 相关上下文

- 产品需求: `product/admin/02-admin-content/01-article-management.md` — 文章管理 PRD
- 数据模型: `product/admin/02-admin-content/04-data-nonfunctional.md` — 数据流向 + 非功能需求
- 内容类目: `china/00-index.md` — 12 大类目定义
- API 规约: `grules/04-api-design.md` — CRUD、分页、筛选、统一响应
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 全局架构: `grules/01-rules.md` — Supabase + Express 技术栈
- 关联任务: T03-001（发现中国数据库表）、T11-003（管理员鉴权中间件）

## 技术方案

### 数据库表结构（引用 T03-001 已创建的 articles 表）

```sql
-- articles 表核心字段（T03-001 已创建，此处仅引用）
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,              -- 12 大类目之一
  title_zh TEXT NOT NULL,              -- 中文标题
  title_en TEXT,                       -- 英文标题
  title_vi TEXT,                       -- 越南语标题
  content_zh TEXT,                     -- 中文正文（含 ruby 拼音 HTML）
  content_pinyin TEXT,                 -- 纯拼音文本（用于搜索/TTS）
  content_en TEXT,                     -- 英文正文
  content_vi TEXT,                     -- 越南语正文
  cover_image_url TEXT,                -- 封面图 URL
  tags TEXT[] DEFAULT '{}',            -- 标签/关键词数组
  source TEXT DEFAULT 'manual',        -- 来源: 'dify' | 'manual'
  status TEXT DEFAULT 'draft',         -- 状态: draft | published | unpublished
  sort_weight INT DEFAULT 0,          -- 排序权重（值越大越靠前）
  related_level TEXT,                  -- 关联课程 Level
  seo_description TEXT,               -- SEO 描述
  view_count INT DEFAULT 0,           -- 浏览量
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略：管理员可 CRUD，普通用户只读已上架
-- 索引：category, status, created_at, sort_weight
```

### API 端点设计

```
前缀: /api/v1/admin/articles

GET    /                  — 文章列表（分页 + 筛选 + 排序）
GET    /:id               — 文章详情
POST   /                  — 新建文章
PUT    /:id               — 编辑文章
DELETE /:id               — 删除文章（仅草稿/已下架）
PATCH  /:id/publish       — 上架文章
PATCH  /:id/unpublish     — 下架文章
POST   /batch/publish     — 批量上架
POST   /batch/unpublish   — 批量下架
POST   /batch/delete      — 批量删除
```

### Zod Schema 定义

```typescript
// backend/src/models/article.ts
import { z } from 'zod';

export const ArticleCategoryEnum = z.enum([
  'chinese-history', 'chinese-cuisine', 'scenic-wonders',
  'festivals-customs', 'arts-heritage', 'music-opera',
  'classic-literature', 'idioms-allusions', 'philosophy-wisdom',
  'modern-china', 'fun-with-chinese', 'myths-legends'
]);

export const ArticleStatusEnum = z.enum(['draft', 'published', 'unpublished']);
export const ArticleSourceEnum = z.enum(['dify', 'manual']);

export const CreateArticleSchema = z.object({
  category: ArticleCategoryEnum,
  title_zh: z.string().min(1).max(50),
  title_en: z.string().max(120).optional(),
  title_vi: z.string().max(120).optional(),
  content_zh: z.string().min(1).max(20000).optional(),
  content_pinyin: z.string().optional(),
  content_en: z.string().max(20000).optional(),
  content_vi: z.string().max(20000).optional(),
  cover_image_url: z.string().url().optional(),
  tags: z.array(z.string().max(10)).max(10).optional(),
  sort_weight: z.number().int().min(0).max(9999).optional(),
  related_level: z.string().optional(),
  seo_description: z.string().max(200).optional(),
});

export const UpdateArticleSchema = CreateArticleSchema.partial();

export const ArticleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  category: ArticleCategoryEnum.optional(),
  status: ArticleStatusEnum.optional(),
  source: ArticleSourceEnum.optional(),
  keyword: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'view_count', 'id']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const BatchOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});
```

### Repository 层

```typescript
// backend/src/repositories/article.repository.ts
export class ArticleRepository {
  async findAll(query: ArticleListQuery): Promise<PaginatedResult<Article>>;
  async findById(id: string): Promise<Article | null>;
  async create(data: CreateArticleInput, userId: string): Promise<Article>;
  async update(id: string, data: UpdateArticleInput, userId: string): Promise<Article>;
  async delete(id: string): Promise<void>;
  async updateStatus(id: string, status: ArticleStatus, userId: string): Promise<Article>;
  async batchUpdateStatus(ids: string[], status: ArticleStatus, userId: string): Promise<BatchResult>;
  async batchDelete(ids: string[]): Promise<BatchResult>;
}
```

### Service 层

```typescript
// backend/src/services/article.service.ts
export class ArticleService {
  // 业务规则：
  // - 上架需要校验三语言必填字段 + 封面图
  // - 已上架文章不可删除，必须先下架
  // - 编辑已上架文章保存后状态保持已上架
  // - 批量操作跳过不符合条件的记录，返回成功/跳过数量
  // - 所有变更操作记录 audit_log
  
  async listArticles(query: ArticleListQuery): Promise<PaginatedResult<Article>>;
  async getArticle(id: string): Promise<Article>;
  async createArticle(data: CreateArticleInput, userId: string): Promise<Article>;
  async updateArticle(id: string, data: UpdateArticleInput, userId: string): Promise<Article>;
  async deleteArticle(id: string, userId: string): Promise<void>;
  async publishArticle(id: string, userId: string): Promise<Article>;
  async unpublishArticle(id: string, userId: string): Promise<Article>;
  async batchPublish(ids: string[], userId: string): Promise<BatchResult>;
  async batchUnpublish(ids: string[], userId: string): Promise<BatchResult>;
  async batchDelete(ids: string[], userId: string): Promise<BatchResult>;
}
```

### Router 层

```typescript
// backend/src/routers/v1/admin/article.router.ts
import { Router } from 'express';
import { requireAdmin, requireRole } from '@/core/middleware';

const router = Router();

// 所有路由需要管理员鉴权 + 内容运营角色
router.use(requireAdmin);
router.use(requireRole(['super_admin', 'content_operator']));

router.get('/', articleController.list);
router.get('/:id', articleController.getById);
router.post('/', articleController.create);
router.put('/:id', articleController.update);
router.delete('/:id', articleController.delete);
router.patch('/:id/publish', articleController.publish);
router.patch('/:id/unpublish', articleController.unpublish);
router.post('/batch/publish', articleController.batchPublish);
router.post('/batch/unpublish', articleController.batchUnpublish);
router.post('/batch/delete', articleController.batchDelete);
```

### 操作日志记录

```typescript
// 每次内容变更调用 audit_log 写入
interface AuditLogEntry {
  operator_id: string;
  action: 'create' | 'update' | 'publish' | 'unpublish' | 'delete';
  resource_type: 'article';
  resource_id: string;
  details: Record<string, unknown>;  // 变更前后对比
  created_at: string;
}
```

### 统一响应格式

```typescript
// 成功响应
{ code: 0, data: { ... }, message: 'ok' }

// 分页响应
{ code: 0, data: { items: [...], total: 100, page: 1, page_size: 20 }, message: 'ok' }

// 批量操作响应
{ code: 0, data: { success_count: 5, skipped_count: 2, skipped_ids: [...] }, message: 'ok' }

// 错误响应
{ code: 40001, data: null, message: '文章处于已上架状态，不可删除' }
```

## 范围（做什么）

- 创建 `article.ts` Zod Schema + TypeScript 类型定义
- 实现 `ArticleRepository` 数据访问层（Supabase 查询）
- 实现 `ArticleService` 业务逻辑层（状态校验、批量操作、日志记录）
- 实现 `articleController` 控制器 + 路由注册
- 实现文章列表的分页、筛选（类目/状态/来源/关键字/时间范围）、排序
- 实现上架/下架状态流转及业务规则校验
- 实现批量上架/下架/删除，含条件不符自动跳过逻辑
- 记录所有写操作到 audit_log 表
- Zod 输入校验 + 统一错误处理

## 边界（不做什么）

- 不实现文件上传（封面图上传由 T01-007 Supabase Storage 工具处理，本任务仅存储 URL）
- 不实现拼音自动生成服务（前端调用外部拼音库，API 仅接收拼音字段）
- 不实现应用端（C 端）文章 API（属于 T03 模块）
- 不实现文章版本快照（P1 功能，后续任务）
- 不建表（T03-001 已完成）
- 不实现管理员鉴权中间件（T11-003 已完成，本任务引用）

## 涉及文件

- 新建: `backend/src/models/article.ts` — Zod Schema + 类型
- 新建: `backend/src/repositories/article.repository.ts` — 数据访问层
- 新建: `backend/src/services/article.service.ts` — 业务逻辑层
- 新建: `backend/src/controllers/article.controller.ts` — 控制器
- 新建: `backend/src/routers/v1/admin/article.router.ts` — 路由
- 修改: `backend/src/routers/v1/admin/index.ts` — 注册文章路由
- 新建: `backend/src/utils/audit-log.ts` — 操作日志工具（如尚不存在）
- 不动: `backend/src/core/middleware.ts` — 鉴权中间件（T11-003 已实现）

## 依赖

- 前置: T03-001（articles 表已建）、T11-003（管理员鉴权中间件）
- 后续: T12-005（文章列表前端页面）、T12-006（文章编辑前端页面）、T12-010（内容审核工作流）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录且角色为内容运营  
   **WHEN** 调用 `GET /api/v1/admin/articles?page=1&page_size=20`  
   **THEN** 返回分页文章列表，包含 items/total/page/page_size 字段，响应码 200

2. **GIVEN** 管理员已登录  
   **WHEN** 调用 `GET /api/v1/admin/articles?category=chinese-history&status=draft&keyword=长城`  
   **THEN** 返回仅匹配条件的文章列表，筛选结果正确

3. **GIVEN** 管理员已登录  
   **WHEN** 调用 `POST /api/v1/admin/articles` 提交完整的中文标题和分类  
   **THEN** 文章创建成功，状态为 draft，来源为 manual，audit_log 记录 create 操作

4. **GIVEN** 存在一篇状态为 draft 的文章，且三语言标题+正文+封面图齐全  
   **WHEN** 调用 `PATCH /api/v1/admin/articles/:id/publish`  
   **THEN** 文章状态变为 published，audit_log 记录 publish 操作

5. **GIVEN** 存在一篇状态为 published 的文章  
   **WHEN** 调用 `DELETE /api/v1/admin/articles/:id`  
   **THEN** 返回错误码 40001，消息「文章处于已上架状态，不可删除」，文章未被删除

6. **GIVEN** 勾选 10 篇文章（其中 7 篇 draft、3 篇 published）  
   **WHEN** 调用 `POST /api/v1/admin/articles/batch/publish` 提交 10 个 ID  
   **THEN** 返回 success_count=7, skipped_count=3（已上架的跳过），skipped_ids 包含 3 篇

7. **GIVEN** 未登录用户或角色非管理员  
   **WHEN** 调用任意 `/api/v1/admin/articles` 端点  
   **THEN** 返回 401/403 错误，拒绝访问

8. **GIVEN** 调用 `POST /api/v1/admin/articles` 缺少必填字段 title_zh  
   **WHEN** 请求发出  
   **THEN** 返回 400 错误，包含 Zod 校验错误信息

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 等待后端服务健康检查通过：`curl http://localhost:3000/api/health`
3. 使用管理员 JWT Token 调用以下接口验证：
   - 创建文章 → 查询列表 → 编辑文章 → 上架 → 下架 → 删除
   - 批量上架/下架/删除
   - 筛选 + 分页 + 排序
4. 验证非管理员访问返回 403
5. 验证 Zod 校验拦截无效输入
6. 检查 audit_log 表记录完整

### 测试通过标准

- [ ] Docker 构建成功，后端容器正常运行
- [ ] 文章 CRUD 全流程通过
- [ ] 状态流转规则正确（草稿→上架→下架→删除）
- [ ] 已上架文章不可删除
- [ ] 批量操作跳过不符合条件记录
- [ ] 分页、筛选、排序全部正确
- [ ] 非管理员访问被拒绝（401/403）
- [ ] Zod 校验拦截无效请求
- [ ] audit_log 记录完整

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/12-admin-content/` 下创建同名结果文件

结果文件路径: `/tasks/result/12-admin-content/T12-001-api-article-management.md`

## 自检重点

- [ ] 所有端点遵循 RESTful 设计，路径前缀 `/api/v1/admin/articles`
- [ ] Zod Schema 覆盖所有输入，无 `any` 类型泄漏
- [ ] 统一响应格式 `{ code, data, message }`
- [ ] 分页参数默认值合理（page=1, page_size=20）
- [ ] 批量操作限制 100 条上限
- [ ] 状态流转严格校验，不可跳过
- [ ] 所有写操作记录 audit_log
- [ ] SQL 查询使用参数化，无注入风险
- [ ] 文件命名 kebab-case，函数命名 camelCase

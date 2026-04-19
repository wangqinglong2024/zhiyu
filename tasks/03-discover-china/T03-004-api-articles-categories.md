# T03-004: 后端 API — 文章与类目

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 8

## 需求摘要

为「发现中国」模块开发后端 API 接口，包含：类目列表接口、文章列表接口（支持分页/排序）、文章详情接口、浏览量统计接口。需实现三层分离架构（Router → Service → Repository），Zod 入参校验，统一响应格式，以及基于用户登录状态的类目访问控制。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/00-index.md` §1.2 — 用户访问规则
- 产品需求: `product/apps/02-discover-china/06-data-nonfunctional.md` §一.4 — 浏览量统计规则
- 设计规范: `grules/04-api-design.md` — API 设计规约（URL 风格、分页、响应格式）
- 设计规范: `grules/05-coding-standards.md` §三 — 后端规范（三层分离、Zod）
- 数据库: T03-001（categories、articles、article_translations、article_views 表）

## 技术方案

### API 端点设计

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/v1/categories` | Level 0（公开） | 获取类目列表 |
| GET | `/api/v1/categories/:categoryId/articles` | Level 0（公开） | 获取类目下的文章列表（分页） |
| GET | `/api/v1/articles/:articleId` | Level 0（公开） | 获取文章详情 |
| POST | `/api/v1/articles/:articleId/view` | Level 0（公开） | 记录浏览量（去重） |

### 类目列表 API

```
GET /api/v1/categories?locale=vi

Response 200:
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": 1,
        "slug": "chinese-history",
        "name": "Lịch sử Trung Quốc",
        "description": "...",
        "coverUrl": "...",
        "iconUrl": "...",
        "articleCount": 28,
        "isPublic": true,
        "sortOrder": 1
      }
    ]
  }
}
```

**业务逻辑**：
- 始终返回全部 12 类目（前端根据 isPublic + 用户登录状态控制遮罩）
- locale 参数决定返回哪种语言的 name/description（默认 zh）
- 按 sort_order ASC 排序

### 文章列表 API

```
GET /api/v1/categories/:categoryId/articles?page=1&page_size=10&sort=latest&locale=vi

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "slug": "qin-emperor-legend",
        "title": "...",
        "summary": "...",
        "thumbnailUrl": "...",
        "viewCount": 1234,
        "favoriteCount": 56,
        "isFavorited": false,
        "publishedAt": "2026-04-15T00:00:00Z"
      }
    ],
    "total": 28,
    "page": 1,
    "page_size": 10,
    "has_next": true
  }
}
```

**业务逻辑**：
- 未登录用户请求非公开类目（id 4-12）→ 返回 403 `CATEGORY_ACCESS_DENIED`
- sort: `latest`（按 published_at DESC）| `popular`（按 view_count DESC，相同则 published_at DESC）
- isFavorited: 已登录时查询 user_favorites 表；未登录时始终 false
- 仅返回 status='published' 的文章

### 文章详情 API

```
GET /api/v1/articles/:articleId?locale=vi

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "categoryId": 1,
    "slug": "qin-emperor-legend",
    "coverUrl": "...",
    "audioUrl": "...",
    "audioDuration": 300,
    "viewCount": 1234,
    "favoriteCount": 56,
    "isFavorited": false,
    "publishedAt": "2026-04-15T00:00:00Z",
    "translations": {
      "zh": { "title": "...", "summary": "...", "content": "...", "vocabulary": [...], "quiz": [...] },
      "en": { "title": "...", "summary": "...", "content": "..." },
      "vi": { "title": "...", "summary": "...", "content": "..." },
      "pinyin": { "title": "...", "content": "..." }
    }
  }
}
```

**业务逻辑**：
- 返回文章所有语言版本的翻译（前端根据用户配置动态渲染）
- 未登录用户访问非公开类目文章 → 403
- 文章不存在或未发布 → 404

### 浏览量 API

```
POST /api/v1/articles/:articleId/view
Body: { "fingerprint": "abc123" }   // 未登录用户传设备指纹

Response 200:
{ "code": 0, "data": { "counted": true } }
```

**业务逻辑**：
- 登录用户：用 user_id 去重，24 小时内同一用户同一文章仅计 1 次
- 未登录用户：用 fingerprint 去重，24 小时内同一设备同一文章仅计 1 次
- 使用 INSERT ... ON CONFLICT DO NOTHING 实现幂等
- 异步更新 articles.view_count（准实时，允许 5 分钟延迟）

### 三层架构

```
backend/src/
├── routers/v1/
│   ├── categories.router.ts     -- 路由定义 + Zod 校验
│   └── articles.router.ts       -- 路由定义 + Zod 校验
├── services/
│   ├── category.service.ts      -- 业务逻辑
│   └── article.service.ts       -- 业务逻辑
└── repositories/
    ├── category.repository.ts   -- Supabase 查询
    └── article.repository.ts    -- Supabase 查询
```

### Zod 校验 Schema

```typescript
// 类目列表参数
const categoriesQuerySchema = z.object({
  locale: z.enum(['zh', 'en', 'vi']).default('zh'),
});

// 文章列表参数（查询参数强制 snake_case，符合 api-design.md 规约）
const articlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['latest', 'popular']).default('latest'),
  locale: z.enum(['zh', 'en', 'vi']).default('zh'),
});

// 浏览量记录参数
const viewBodySchema = z.object({
  fingerprint: z.string().max(64).optional(),
});
```

## 范围（做什么）

- 创建 `categories.router.ts` — 类目列表路由
- 创建 `articles.router.ts` — 文章列表 + 详情 + 浏览量路由
- 创建 `category.service.ts` — 类目业务逻辑
- 创建 `article.service.ts` — 文章业务逻辑（含分页、排序、权限）
- 创建 `category.repository.ts` — 类目数据库查询
- 创建 `article.repository.ts` — 文章数据库查询（含多语言 JOIN）
- 注册路由到 v1 路由汇总
- 创建 Zod 校验 Schema

## 边界（不做什么）

- 不写每日金句 API（T03-005）
- 不写收藏 API（T03-006）
- 不写前端页面（T03-007+）
- 不写管理后台 API（Admin 模块）
- 不实现文章搜索（后续迭代）

## 涉及文件

- 新建: `backend/src/routers/v1/categories.router.ts`
- 新建: `backend/src/routers/v1/articles.router.ts`
- 新建: `backend/src/services/category.service.ts`
- 新建: `backend/src/services/article.service.ts`
- 新建: `backend/src/repositories/category.repository.ts`
- 新建: `backend/src/repositories/article.repository.ts`
- 修改: `backend/src/routers/v1/index.ts` — 注册新路由

## 依赖

- 前置: T03-001（数据库表已创建）
- 后续: T03-007（类目首页）, T03-008（文章列表页）, T03-009（文章详情页）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 12 类目种子数据已存在  
   **WHEN** 调用 `GET /api/v1/categories?locale=en`  
   **THEN** 返回 12 条类目，英文名称正确，按 sort_order 排序

2. **GIVEN** 类目 1（公开）下有 15 篇已发布文章  
   **WHEN** 未登录用户调用 `GET /api/v1/categories/1/articles?page=1&page_size=10&sort=latest`  
   **THEN** 返回 10 条文章 + total=15 + has_next=true

3. **GIVEN** 类目 4（非公开）下有文章  
   **WHEN** 未登录用户调用 `GET /api/v1/categories/4/articles`  
   **THEN** 返回 403 错误码 `CATEGORY_ACCESS_DENIED`

4. **GIVEN** 已登录用户  
   **WHEN** 调用 `GET /api/v1/categories/4/articles`  
   **THEN** 正常返回文章列表

5. **GIVEN** 文章存在且已发布  
   **WHEN** 调用 `GET /api/v1/articles/:id`  
   **THEN** 返回文章详情，含 translations 对象（zh/en/vi/pinyin 四种 locale）

6. **GIVEN** 登录用户已收藏某文章  
   **WHEN** 调用该文章的列表或详情接口  
   **THEN** isFavorited = true

7. **GIVEN** 用户首次访问某文章  
   **WHEN** 调用 `POST /api/v1/articles/:id/view`  
   **THEN** 返回 counted=true，articles.view_count +1

8. **GIVEN** 同一用户 24 小时内第二次浏览同一文章  
   **WHEN** 调用 `POST /api/v1/articles/:id/view`  
   **THEN** 返回 counted=false，view_count 不变

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 通过 curl/Puppeteer 调用各 API 端点
5. 验证所有 GIVEN-WHEN-THEN 验收标准
6. 测试非法输入（无效 page、非法 sort 值等）Zod 校验返回 400
7. 测试并发浏览量请求不产生数据异常

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 4 个 API 端点全部返回正确数据
- [ ] Zod 校验拦截非法输入返回 400
- [ ] 未登录用户访问非公开类目返回 403
- [ ] 分页参数正确（total/page_size/has_next 准确）
- [ ] 排序功能正确（latest/popular）
- [ ] 浏览量去重逻辑正确
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-004-api-articles-categories.md`

## 自检重点

- [ ] 安全：未登录用户无法访问非公开类目文章（403）
- [ ] 安全：SQL 注入防护（参数化查询，禁止字符串拼接）
- [ ] 性能：文章列表分页使用索引（避免全表扫描）
- [ ] 类型同步：API 响应类型与数据库 Schema 一致
- [ ] RLS：Supabase 查询使用正确的 Client（区分 anon/service_role）

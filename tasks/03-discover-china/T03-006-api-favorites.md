# T03-006: 后端 API — 收藏

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 4

## 需求摘要

为「收藏系统」开发后端 API 接口，包含：收藏/取消收藏文章（toggle 操作）、获取我的收藏列表（分页）、查询文章收藏状态（批量）。需支持乐观 UI 所需的幂等操作，确保收藏数据一致性和高效查询。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/05-favorite-system.md` — 收藏系统完整 PRD
- 产品需求: `product/apps/02-discover-china/06-data-nonfunctional.md` — 收藏操作响应 ≤ 300ms
- 设计规范: `grules/04-api-design.md` — API 设计规约
- 设计规范: `grules/05-coding-standards.md` §三 — 后端规范
- 数据库: T03-003（user_favorites 表）

## 技术方案

### API 端点设计

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/v1/favorites` | Level 1（登录） | 收藏文章 |
| DELETE | `/api/v1/favorites/:articleId` | Level 1（登录） | 取消收藏文章 |
| GET | `/api/v1/favorites` | Level 1（登录） | 我的收藏列表（分页） |
| POST | `/api/v1/favorites/check` | Level 1（登录） | 批量查询收藏状态 |

### 收藏文章 API

```
POST /api/v1/favorites
Body: { "articleId": "uuid" }

Response 201:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "articleId": "uuid",
    "createdAt": "2026-04-18T12:00:00Z"
  }
}

-- 已收藏时的幂等响应
Response 200:
{
  "code": 0,
  "data": { "id": "uuid", "articleId": "uuid", "createdAt": "..." },
  "message": "Already favorited"
}
```

**业务逻辑**：
- 使用 INSERT ... ON CONFLICT (user_id, article_id) DO NOTHING 实现幂等
- 若已收藏则返回已有记录（200），而非报错
- 验证 articleId 对应的文章存在且已发布
- 频率限制：每用户每分钟 30 次

### 取消收藏 API

```
DELETE /api/v1/favorites/:articleId

Response 200:
{ "code": 0, "data": null }

-- 未收藏时的幂等响应
Response 200:
{ "code": 0, "data": null, "message": "Not favorited" }
```

**业务逻辑**：
- 未收藏时返回 200（幂等），不报 404
- 删除后 favorite_count 触发器自动 -1

### 我的收藏列表 API

```
GET /api/v1/favorites?page=1&page_size=20&locale=vi

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "articleId": "uuid",
        "article": {
          "title": "...",
          "summary": "...",
          "thumbnailUrl": "...",
          "viewCount": 1234,
          "categoryId": 1,
          "publishedAt": "..."
        },
        "createdAt": "2026-04-18T12:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "page_size": 20,
    "has_next": false
  }
}
```

**业务逻辑**：
- 按收藏时间倒序（最近收藏在前）
- 关联查询文章最新信息（非收藏时快照）
- 已下架文章自动过滤（不出现在列表中）
- 默认 page_size=20

### 批量查询收藏状态 API

```
POST /api/v1/favorites/check
Body: { "articleIds": ["uuid1", "uuid2", "uuid3"] }

Response 200:
{
  "code": 0,
  "data": {
    "uuid1": true,
    "uuid2": false,
    "uuid3": true
  }
}
```

**业务逻辑**：
- 前端加载文章列表时批量查询收藏状态
- 最多一次查询 50 个 articleId
- 优化场景：减少 N+1 查询

### 三层架构

```
backend/src/
├── routers/v1/
│   └── favorites.router.ts      -- 路由定义 + Zod 校验
├── services/
│   └── favorite.service.ts      -- 业务逻辑
└── repositories/
    └── favorite.repository.ts   -- Supabase 查询
```

### Zod 校验 Schema

```typescript
const favoriteBodySchema = z.object({
  articleId: z.string().uuid(),
});

const favoriteCheckSchema = z.object({
  articleIds: z.array(z.string().uuid()).min(1).max(50),
});

// 收藏列表查询参数（查询参数强制 snake_case，符合 api-design.md 规约）
const favoriteListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(20),
  locale: z.enum(['zh', 'en', 'vi']).default('zh'),
});
```

## 范围（做什么）

- 创建 `favorites.router.ts` — 收藏路由
- 创建 `favorite.service.ts` — 收藏业务逻辑
- 创建 `favorite.repository.ts` — 收藏数据库查询
- 注册路由到 v1 路由汇总
- 实现收藏/取消的幂等操作
- 实现批量收藏状态查询（减少 N+1）

## 边界（不做什么）

- 不写收藏前端组件（T03-011）
- 不实现收藏夹分组功能（后续迭代）
- 不实现收藏导出功能
- 不处理「我的收藏」页面 UI（个人中心模块 + T03-011）

## 涉及文件

- 新建: `backend/src/routers/v1/favorites.router.ts`
- 新建: `backend/src/services/favorite.service.ts`
- 新建: `backend/src/repositories/favorite.repository.ts`
- 修改: `backend/src/routers/v1/index.ts` — 注册新路由

## 依赖

- 前置: T03-003（user_favorites 表已创建）
- 后续: T03-009（文章详情收藏按钮）, T03-011（收藏系统前端）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 登录用户且文章存在  
   **WHEN** 调用 `POST /api/v1/favorites` 收藏文章  
   **THEN** 返回 201 + 收藏记录，articles.favorite_count +1

2. **GIVEN** 用户已收藏该文章  
   **WHEN** 再次调用 `POST /api/v1/favorites` 收藏同一文章  
   **THEN** 返回 200 + 已有记录（幂等），favorite_count 不变

3. **GIVEN** 用户已收藏该文章  
   **WHEN** 调用 `DELETE /api/v1/favorites/:articleId`  
   **THEN** 返回 200，articles.favorite_count -1

4. **GIVEN** 用户未收藏该文章  
   **WHEN** 调用 `DELETE /api/v1/favorites/:articleId`  
   **THEN** 返回 200（幂等），favorite_count 不变

5. **GIVEN** 未登录用户  
   **WHEN** 调用任意收藏 API  
   **THEN** 返回 401 `UNAUTHORIZED`

6. **GIVEN** 用户有 25 条收藏  
   **WHEN** 调用 `GET /api/v1/favorites?page=1&page_size=20`  
   **THEN** 返回 20 条 + 关联文章最新信息 + total=25 + has_next=true

7. **GIVEN** 用户收藏了 3 篇文章  
   **WHEN** 调用 `POST /api/v1/favorites/check` 传入 5 个 articleId  
   **THEN** 返回 5 个 bool 值，3 个 true，2 个 false

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 创建测试用户 + 测试文章
5. 测试收藏/取消收藏完整流程
6. 测试幂等操作（重复收藏/取消不报错）
7. 测试收藏列表分页和排序
8. 测试批量收藏状态查询
9. 测试未登录访问返回 401

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 收藏/取消幂等操作正确
- [ ] favorite_count 触发器自动更新
- [ ] 未登录返回 401
- [ ] 收藏列表分页正确，关联文章信息最新
- [ ] 批量查询收藏状态正确
- [ ] 频率限制生效（每分钟 30 次）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-006-api-favorites.md`

## 自检重点

- [ ] 安全：所有收藏 API 需要 Level 1 认证
- [ ] 安全：用户只能操作自己的收藏（RLS 保证）
- [ ] 性能：收藏操作 ≤ 300ms 响应
- [ ] 幂等性：重复收藏/取消不产生异常
- [ ] 频率限制：每用户每分钟 30 次（防刷）

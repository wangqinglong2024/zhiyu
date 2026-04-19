# T04-005: 后端 API — 课程结构查询

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 5

## 需求摘要

实现课程结构的 RESTful 查询 API，包括 Level 列表（含用户购买状态和进度）、Unit 列表（含解锁状态）、Lesson 列表（含学习状态）、单个 Lesson 详情（教学内容/词汇/语法）。所有列表需根据用户权限过滤内容（免费 Level 全部返回，付费 Level 仅返回已购买的详细内容），遵循三层分离架构（Router → Service → Repository）。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/01-course-homepage.md` §三（Level 地图需要的数据）
- 产品需求: `product/apps/03-course-learning/04-level-detail.md`（Level 详情 → 单元列表 → 课时列表）
- 产品需求: `product/apps/03-course-learning/05-lesson-page.md`（课时学习页需要的数据）
- 产品需求: `product/apps/03-course-learning/03-paywall.md` §二.3（付费墙需要的 Level 内容预览数据）
- 设计规范: `grules/04-api-design.md`（URL 规范、统一响应格式、分页、鉴权）
- 设计规范: `grules/05-coding-standards.md` §三（三层分离、Zod 校验、错误处理）
- 关联任务: T04-001（课程结构表）→ 本任务 → T04-010（课程首页前端）、T04-012（Level 详情前端）

## 技术方案

### API 设计

#### 1. 获取 Level 列表（含用户状态）

```
GET /api/v1/courses/levels
鉴权级别: 1（需登录）
```

响应示例:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "level_number": 1,
        "name_zh": "识字启蒙",
        "name_en": "First Steps",
        "name_vi": "Khởi đầu nhận chữ",
        "hsk_level": "HSK 1",
        "cefr_level": "A1",
        "total_units": 8,
        "total_lessons": 40,
        "cumulative_vocab": 500,
        "is_free": true,
        "price_usd": 0,
        "user_status": "in_progress",
        "progress_percentage": 45.00,
        "completed_lessons": 18,
        "is_accessible": true,
        "purchase_expires_at": null
      }
    ]
  }
}
```

#### 2. 获取 Level 详情（单元列表）

```
GET /api/v1/courses/levels/:levelId/units
鉴权级别: 1（需登录）
```

响应包含：每个 Unit 的解锁状态、课时完成数、单元测评分数。

#### 3. 获取 Unit 课时列表

```
GET /api/v1/courses/units/:unitId/lessons
鉴权级别: 1（需登录）
```

响应包含：每个 Lesson 的学习状态、断点续学信息。

#### 4. 获取 Lesson 详情（教学内容）

```
GET /api/v1/courses/lessons/:lessonId
鉴权级别: 1（需登录）+ 权限检查（Level 已购买或免费）
```

响应包含：教学内容、重点词汇、语法点、音频 URL。

#### 5. 获取 Level 内容预览（付费墙用）

```
GET /api/v1/courses/levels/:levelId/preview
鉴权级别: 1（需登录）
```

响应：Level 元数据（单元数/课时数/词汇量/成语数），不含详细教学内容。供付费墙展示。

### 三层架构

```
Router: src/routers/v1/courses.ts
  ↓
Service: src/services/course-service.ts
  ↓
Repository: src/repositories/course-repository.ts
```

### 权限过滤规则

```
Level 可访问判断:
  L1-L3: 所有已登录用户可访问
  L4-L12: user_course_purchases 中存在 status=completed 且 expires_at > now() 的记录

Lesson 详细内容获取:
  Level 可访问 → 返回完整教学内容
  Level 不可访问 → 返回 403（引导前端弹出付费墙）
```

## 范围（做什么）

- 创建 `src/routers/v1/courses.ts` — 5 个 API 端点
- 创建 `src/services/course-service.ts` — 课程业务逻辑（含权限检查）
- 创建 `src/repositories/course-repository.ts` — 数据访问层
- 请求参数 Zod 校验
- 统一响应格式（`ok(data)` / `error(code, msg)`）
- 路由注册到 v1 Router

## 边界（不做什么）

- 不实现学习进度更新 API（T04-006）
- 不实现入学测试 API（T04-007）
- 不实现课程购买 API（T04-008）
- 不实现缓存层（MVP 可后续优化）
- 不实现前端页面

## 涉及文件

- 新建: `backend/src/routers/v1/courses.ts`
- 新建: `backend/src/services/course-service.ts`
- 新建: `backend/src/repositories/course-repository.ts`
- 修改: `backend/src/routers/v1/index.ts` — 注册课程路由
- 修改: `backend/src/models/course.ts` — 补充响应类型

## 依赖

- 前置: T04-001（课程结构表）、T04-002（进度表，用于返回用户状态）、T04-003（购买表，用于权限判断）
- 后续: T04-010（课程首页前端）、T04-012（Level 详情前端）、T04-013（课时学习页前端）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 已登录用户 **WHEN** `GET /api/v1/courses/levels` **THEN** 返回 12 个 Level，每个包含 `user_status`、`progress_percentage`、`is_accessible` 字段
2. **GIVEN** 用户已购买 L5 **WHEN** `GET /api/v1/courses/levels` **THEN** L5 的 `is_accessible = true`
3. **GIVEN** 用户未购买 L5 **WHEN** `GET /api/v1/courses/levels` **THEN** L5 的 `is_accessible = false`
4. **GIVEN** 用户已购买 L5 **WHEN** `GET /api/v1/courses/levels/:l5Id/units` **THEN** 返回所有单元，每个包含解锁状态和课时进度
5. **GIVEN** 用户正在学习 L5 U2 **WHEN** `GET /api/v1/courses/units/:u2Id/lessons` **THEN** 返回 5 个课时，状态分别为 completed/completed/in_progress/not_started/not_started
6. **GIVEN** 用户有权访问 L1 **WHEN** `GET /api/v1/courses/lessons/:lessonId` **THEN** 返回完整教学内容（content/key_vocabulary/grammar_points）
7. **GIVEN** 用户未购买 L5 **WHEN** `GET /api/v1/courses/lessons/:l5LessonId` **THEN** 返回 403 错误（40301: 无权操作该资源）
8. **GIVEN** 未登录用户 **WHEN** 请求任意课程 API **THEN** 返回 401 错误
9. **GIVEN** 无效 levelId **WHEN** `GET /api/v1/courses/levels/:invalidId/units` **THEN** 返回 404 错误
10. **GIVEN** 已登录用户 **WHEN** `GET /api/v1/courses/levels/:levelId/preview` **THEN** 返回 Level 元数据（无详细教学内容）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 通过 curl 验证 5 个 API 端点
5. 验证权限过滤：无 Token → 401、未购买 → 403、已购买 → 200
6. 验证响应格式符合 `grules/04-api-design.md` 统一格式
7. 验证返回数据包含用户进度和购买状态

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，后端容器 Running
- [ ] 5 个 API 端点正常响应
- [ ] 权限过滤正确（401/403/200）
- [ ] 响应格式符合规范
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-005-api-course-query.md`

## 自检重点

- [ ] 安全: authMiddleware 守卫全部端点
- [ ] 安全: Lesson 详情检查 Level 购买权限
- [ ] 性能: 无 N+1 查询（Level 列表一次性 JOIN 进度和购买）
- [ ] 类型同步: 响应类型与前端约定一致
- [ ] 三层分离: Router/Service/Repository 职责清晰

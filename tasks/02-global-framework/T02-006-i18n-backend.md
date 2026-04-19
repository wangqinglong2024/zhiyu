# T02-006: 多语言系统 — 后端 API

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10

## 需求摘要

实现知语 Zhiyu 多语言系统的后端部分。包含：`i18n_translations` 翻译表设计与迁移、语言包 CRUD API、按语言加载翻译 API、翻译缓存策略。支持三种 UI 语言（zh/en/vi），管理后台可动态维护翻译条目。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/03-language-system.md` — 完整 i18n 系统设计
- API 规约: `grules/04-api-design.md` — 统一响应格式、分页参数规范
- 编码规范: `grules/05-coding-standards.md` §三 — 后端三层分离
- 关联任务: T01-007（Supabase 基础配置）→ 本任务 → T02-007（前端 i18n 框架）

## 技术方案

### 数据库设计

```sql
-- public.i18n_translations: 翻译表
CREATE TABLE public.i18n_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace VARCHAR(50) NOT NULL DEFAULT 'common',    -- 翻译命名空间 (common/auth/discover/course/game/admin)
  key VARCHAR(200) NOT NULL,                          -- 翻译键 (如 "login.title")
  lang CHAR(2) NOT NULL CHECK (lang IN ('zh', 'en', 'vi')),  -- 语言代码
  value TEXT NOT NULL,                                 -- 翻译值
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(namespace, key, lang)
);

-- 索引：按 namespace + lang 快速查询语言包
CREATE INDEX idx_i18n_ns_lang ON public.i18n_translations(namespace, lang);

-- RLS 策略：所有人可读，仅管理员可写
ALTER TABLE public.i18n_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "i18n_read" ON public.i18n_translations FOR SELECT USING (true);
-- ⚠️ Supabase JWT 默认不含自定义 user_role，需通过子查询 profiles 表验证管理员身份
CREATE POLICY "i18n_admin_write" ON public.i18n_translations 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'content_ops')
    )
  );
```

### API 端点清单

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| `GET` | `/api/v1/i18n/:lang` | 无 | 获取指定语言的全部翻译（按 namespace 分组） |
| `GET` | `/api/v1/i18n/:lang/:namespace` | 无 | 获取指定语言 + 命名空间的翻译 |
| `GET` | `/api/v1/admin/i18n` | 需管理员 | 翻译列表（分页+搜索+筛选） |
| `POST` | `/api/v1/admin/i18n` | 需管理员 | 新增翻译条目 |
| `PUT` | `/api/v1/admin/i18n/:id` | 需管理员 | 修改翻译条目 |
| `DELETE` | `/api/v1/admin/i18n/:id` | 需管理员 | 删除翻译条目 |
| `POST` | `/api/v1/admin/i18n/batch` | 需管理员 | 批量导入翻译（JSON 格式） |

### 缓存策略

- 前端 API 语言包接口返回 `Cache-Control: public, max-age=3600`
- 管理后台修改翻译后，更新 `i18n_version` 配置项（存 Redis / Supabase 配置表）
- 前端通过版本号判断是否需要重新拉取语言包

### 三层架构

```
backend/src/
├── models/
│   └── i18n.ts                    # TranslationSchema, CreateTranslationSchema 等
├── routers/v1/
│   └── i18n.ts                    # 公开 API
├── routers/v1/admin/
│   └── i18n.ts                    # 管理后台 API
├── services/
│   └── i18n-service.ts            # 业务逻辑（CRUD + 缓存版本管理）
└── repositories/
    └── i18n-repo.ts               # 数据访问层
```

## 范围（做什么）

- 实现 `i18n_translations` 表迁移 SQL
- 实现公开 API（按语言/命名空间获取翻译）
- 实现管理后台 API（CRUD + 批量导入）
- 实现 Zod Schema 校验
- 实现三层架构分离
- 实现 RLS 策略（公开读 + 管理员写）
- 插入默认翻译种子数据（auth 模块 zh/en/vi 基础文案）
- 响应头缓存策略

## 边界（不做什么）

- 不实现前端 i18n 框架（T02-007）
- 不实现管理后台翻译管理 UI（T13 管理后台模块）
- 不实现内容翻译（文章/课程的 i18n 在各自模块处理）

## 涉及文件

- 新建: `supabase/migrations/20260418100001_create_i18n_translations.sql`
- 新建: `supabase/migrations/20260418100002_seed_i18n_defaults.sql`（默认翻译种子数据，合并到 migration 保证可重建）
- 新建: `backend/src/models/i18n.ts`
- 新建: `backend/src/routers/v1/i18n.ts`
- 新建: `backend/src/routers/v1/admin/i18n.ts`
- 新建: `backend/src/services/i18n-service.ts`
- 新建: `backend/src/repositories/i18n-repo.ts`
- 修改: `backend/src/routers/v1/index.ts`（注册 i18n 路由）

## 依赖

- 前置: T01-007（Supabase 基础配置就绪）
- 后续: T02-007（前端 i18n 消费这些 API）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 后端已启动  
   **WHEN** `GET /api/v1/i18n/zh`  
   **THEN** 返回中文翻译包 `{ code: 0, data: { common: {...}, auth: {...}, ... } }`

2. **GIVEN** 后端已启动  
   **WHEN** `GET /api/v1/i18n/en/auth`  
   **THEN** 返回英文 auth 命名空间翻译

3. **GIVEN** 管理员已登录  
   **WHEN** `POST /api/v1/admin/i18n` 新增翻译条目  
   **THEN** 返回成功，`GET /api/v1/i18n/{lang}` 可获取新条目

4. **GIVEN** 非管理员用户  
   **WHEN** 尝试 `POST /api/v1/admin/i18n`  
   **THEN** 返回 `{ code: 40302, message: "无管理权限" }`

5. **GIVEN** 管理员批量导入 JSON  
   **WHEN** `POST /api/v1/admin/i18n/batch`  
   **THEN** 批量导入成功，冲突条目 upsert 更新

6. **GIVEN** 语言包 API  
   **WHEN** 检查响应头  
   **THEN** 包含 `Cache-Control: public, max-age=3600`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. `docker compose logs --tail=30 backend` — 无报错
4. 验证迁移执行成功 + 种子数据已插入
5. 逐个测试 7 个 API 端点
6. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 翻译表迁移成功 + 种子数据存在
- [ ] 公开 API 返回正确翻译包
- [ ] 管理 API 权限校验正确
- [ ] 批量导入 upsert 正确
- [ ] 缓存响应头正确

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-006-i18n-backend.md`

## 自检重点

- [ ] 安全：公开 API 只读，管理 API 仅管理员可写
- [ ] 安全：批量导入输入校验（防止 XSS 内容注入）
- [ ] 性能：按 namespace + lang 索引优化查询
- [ ] 三层分离：Router/Service/Repository 无跨层调用
- [ ] 类型同步：翻译 Zod Schema ↔ 表字段一致

# T10-008: 后端 API — 个人资料

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 6

## 需求摘要

实现个人资料管理的后端 API。包含用户信息查询（含学习统计数据聚合）、个人资料更新（昵称/性别/生日/国家/学习目标）、头像上传（Supabase Storage 直传签名 URL + 记录更新）、昵称敏感词过滤。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/01-personal-center.md` — 个人中心主页 + 资料编辑页完整 PRD
- 非功能需求: `product/apps/09-personal-payment/08-data-nonfunctional.md` §一.1 — 用户资料数据流
- API 规约: `grules/04-api-design.md` §十一 — 文件上传规范（Supabase Storage）
- 编码规范: `grules/05-coding-standards.md` — 后端编码规范
- 架构白皮书: `grules/01-rules.md` §二 — Supabase Storage Bucket 权限遵循 RLS
- 关联任务: T01-006（Supabase 基础设施）→ 本任务 → T10-009（前端个人中心）

## 技术方案

### API 设计

#### 1. 查询当前用户信息（个人中心首页数据）

```
GET /api/v1/users/me
Authorization: Bearer <jwt>

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "nickname": "知语小学生",
    "avatar_url": "https://xxx.supabase.co/storage/v1/object/avatars/...",
    "gender": "male",
    "birthday": "1995-06-15",
    "country": "VN",
    "learning_goals": ["work", "hsk"],
    "registered_at": "2025-03-15",
    "stats": {
      "completed_levels": 3,
      "total_levels": 12,
      "study_days": 47,
      "game_wins": 186,
      "game_total": 320,
      "coin_balance": 320
    },
    "rank": {
      "tier": "gold",
      "division": 2,
      "stars": 3,
      "season_rank": 128
    },
    "has_expiring_course": true
  }
}
```

#### 2. 更新个人资料

```
PATCH /api/v1/users/me
Authorization: Bearer <jwt>

Body:
{
  "nickname": "新昵称",
  "gender": "female",
  "birthday": "1995-06-15",
  "country": "VN",
  "learning_goals": ["work", "culture"]
}

Response 200:
{ "code": 0, "message": "资料已更新" }
```

#### 3. 获取头像上传签名 URL

```
POST /api/v1/users/me/avatar/upload-url
Authorization: Bearer <jwt>

Body: { "file_type": "image/jpeg", "file_size": 524288 }

Response 200:
{
  "code": 0,
  "data": {
    "upload_url": "https://xxx.supabase.co/storage/v1/object/avatars/{userId}.jpg",
    "public_url": "https://xxx.supabase.co/storage/v1/object/public/avatars/{userId}.jpg"
  }
}
```

#### 4. 确认头像上传完成

```
POST /api/v1/users/me/avatar/confirm
Authorization: Bearer <jwt>

Body: { "avatar_url": "https://xxx.supabase.co/storage/v1/object/public/avatars/{userId}.jpg" }

Response 200:
{ "code": 0, "message": "头像已更新" }
```

### 昵称校验规则

```typescript
// src/validators/profile-validators.ts
const NicknameSchema = z.string()
  .min(2, '昵称至少 2 个字符')
  .max(12, '昵称最多 12 个字符')
  .refine(val => !containsSensitiveWords(val), '昵称包含敏感词')
  .refine(val => !val.includes(' '), '昵称不能包含空格')
  .describe('用户昵称')

const ProfileUpdateSchema = z.object({
  nickname: NicknameSchema.optional(),
  gender: z.enum(['male', 'female', 'private']).optional().describe('性别'),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('生日'),
  country: z.string().length(2).optional().describe('国家代码 ISO 3166-1 alpha-2'),
  learning_goals: z.array(z.enum(['work', 'hsk', 'hobby', 'culture', 'travel', 'other'])).optional(),
})
```

### 头像上传规则

| 规则 | 值 |
|------|-----|
| 允许格式 | image/jpeg, image/png, image/webp |
| 最大文件 | 5MB |
| 存储路径 | `avatars/{userId}.{ext}` |
| 覆盖策略 | upsert=true（同路径覆盖旧头像） |
| Bucket | `avatars`（需在 Supabase Storage 中创建） |
| 访问权限 | 公开读取，仅用户本人可上传自己路径 |

### 学习统计聚合查询

```sql
-- 用 PostgreSQL 函数封装聚合查询，避免多次 round-trip
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'completed_levels', COALESCE((
      SELECT COUNT(DISTINCT course_level)
      FROM public.course_access
      WHERE user_id = p_user_id AND is_active = true
    ), 0),
    'study_days', COALESCE((
      SELECT COUNT(DISTINCT checkin_date)
      FROM public.daily_checkins
      WHERE user_id = p_user_id
    ), 0),
    'coin_balance', COALESCE((
      SELECT balance FROM public.user_coins WHERE user_id = p_user_id
    ), 0),
    'has_expiring_course', EXISTS(
      SELECT 1 FROM public.course_access
      WHERE user_id = p_user_id AND is_active = true
      AND expires_at <= now() + interval '30 days'
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 范围（做什么）

- 实现用户信息查询 API（含统计数据聚合）
- 实现个人资料更新 API（含昵称敏感词过滤）
- 实现头像上传签名 URL 获取 + 确认上传 API
- 创建 Supabase Storage `avatars` Bucket 及 RLS
- 编写 `get_user_stats` 聚合查询函数
- Zod 验证 Schema

## 边界（不做什么）

- 不实现头像裁剪（前端处理）
- 不实现敏感词词库管理（使用简单静态列表 + 后续可扩展为 API）
- 不实现前端页面（T10-009）

## 涉及文件

- 新建: `src/routes/profile-routes.ts`
- 新建: `src/services/profile-service.ts`
- 新建: `src/repositories/profile-repository.ts`
- 新建: `src/validators/profile-validators.ts`
- 新建: `src/utils/sensitive-words.ts` — 敏感词过滤工具
- 新建: `supabase/migrations/{timestamp}_create_user_stats_function.sql`
- 修改: `src/routes/index.ts` — 注册路由

## 依赖

- 前置: T01-006（Supabase 基础设施 — Storage 可用）
- 后续: T10-009（前端个人中心）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 已登录用户 WHEN GET `/api/v1/users/me` THEN 返回完整个人信息 + 学习统计 + 段位信息
2. GIVEN 合法昵称"新昵称" WHEN PATCH `/api/v1/users/me` THEN 更新成功，再次查询昵称已变更
3. GIVEN 包含敏感词的昵称 WHEN PATCH 更新 THEN 返回 400 "昵称包含敏感词"
4. GIVEN 超过 12 字符的昵称 WHEN PATCH 更新 THEN 返回 400 Zod 验证错误
5. GIVEN 合法图片文件参数 WHEN POST `/api/v1/users/me/avatar/upload-url` THEN 返回签名上传 URL
6. GIVEN 文件类型 `image/gif` WHEN 请求上传 URL THEN 返回 400 不支持的文件类型
7. GIVEN 文件大小 > 5MB WHEN 请求上传 URL THEN 返回 400 文件过大
8. GIVEN 上传完成 WHEN POST `/api/v1/users/me/avatar/confirm` THEN 用户 avatar_url 更新
9. GIVEN 未登录用户 WHEN 访问任何个人资料 API THEN 返回 401

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. 测试用户信息查询（含统计聚合）
3. 测试资料更新（各字段 + 敏感词拦截）
4. 测试头像上传流程（签名 URL + 确认）
5. 验证 Supabase Storage Bucket 权限

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 用户信息查询返回完整数据
- [ ] 资料更新正常（含敏感词过滤）
- [ ] 头像上传流程完整
- [ ] Storage Bucket RLS 正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-008-api-profile.md`

## 自检重点

- [ ] 安全：头像上传仅允许指定 MIME 类型 + 大小限制
- [ ] 安全：敏感词过滤覆盖昵称
- [ ] 性能：统计数据聚合使用 DB 函数，一次查询返回
- [ ] Storage RLS：用户只能上传到自己路径
- [ ] 类型同步：Zod Schema ↔ TypeScript 类型一致

# T02-009: 推送通知系统

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 12

## 需求摘要

实现知语 Zhiyu 的 Web Push 推送通知系统。包含：前端推送权限申请（非首次打开触发，需满足特定场景条件）、Service Worker 推送监听、后端推送订阅管理 API、服务端推送发送逻辑。支持 5 种通知类型。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/05-push-notification.md` — 完整推送系统设计
  - §一: 权限申请时机（不在首次打开时弹出，在首次完成课程/测验/收藏后触发）
  - §二: 引导弹窗设计（先展示引导说明，用户确认后才弹出系统权限弹窗）
  - §三: 5 种通知类型（学习提醒/课程更新/活动通知/社交互动/系统公告）
  - §四: 通知偏好设置（可按类型开关）
- 编码规范: `grules/05-coding-standards.md` §三 — 后端三层分离
- API 规约: `grules/04-api-design.md` — 统一响应格式
- 关联任务: T02-003（认证 API 就绪，需要登录态）→ 本任务

## 技术方案

### 权限申请时机

> 核心原则：绝不在首次打开时弹权限，先让用户体验到价值

触发条件（满足任一即触发引导弹窗）：
1. 首次完成一节课程/评测
2. 首次收藏一篇文章
3. 首次完成一局游戏

触发流程：
```
满足条件 → 显示引导弹窗（说明推送价值）→ 用户点击"开启通知"
→ 系统权限弹窗 → 授权成功 → 订阅注册 → 完成
→ 用户点击"暂不开启" → 不再打扰（下次可在设置中开启）
```

### 数据库设计

```sql
-- public.push_subscriptions: 推送订阅表
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- public.notification_preferences: 通知偏好
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_reminder BOOLEAN DEFAULT true,
  course_update BOOLEAN DEFAULT true,
  activity_notice BOOLEAN DEFAULT true,
  social_interaction BOOLEAN DEFAULT true,
  system_announcement BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subs" ON public.push_subscriptions 
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_prefs" ON public.notification_preferences 
  FOR ALL USING (auth.uid() = user_id);
```

### API 端点清单

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| `POST` | `/api/v1/push/subscribe` | 需登录 | 注册推送订阅 |
| `DELETE` | `/api/v1/push/unsubscribe` | 需登录 | 取消推送订阅 |
| `GET` | `/api/v1/push/preferences` | 需登录 | 获取通知偏好 |
| `PUT` | `/api/v1/push/preferences` | 需登录 | 更新通知偏好 |
| `POST` | `/api/v1/admin/push/send` | 需管理员 | 发送推送通知（管理后台） |
| `GET` | `/api/v1/push/vapid-public-key` | 无 | 获取 VAPID 公钥 |

### 前端架构

```
frontend/src/features/push/
├── components/
│   └── PushGuideModal.tsx         # 推送引导弹窗
├── hooks/
│   ├── use-push-permission.ts     # 权限状态 + 申请
│   └── use-push-trigger.ts        # 触发条件检测
├── services/
│   └── push-service.ts            # 订阅 API 调用
├── sw/
│   └── push-handler.ts            # Service Worker 推送处理逻辑
├── types.ts
└── index.ts
```

### 5 种通知类型

| 类型 | 标题示例 | 点击行为 |
|------|---------|---------|
| 学习提醒 | "别忘了今天的中文学习！" | 跳转上次学习页 |
| 课程更新 | "新课程已上线：中国美食" | 跳转新课程详情 |
| 活动通知 | "春节限时活动开始！" | 跳转活动页 |
| 社交互动 | "有人回复了你的评论" | 跳转互动页 |
| 系统公告 | "知语 v2.0 重大更新" | 跳转公告页 |

## 范围（做什么）

- 实现数据库迁移（push_subscriptions + notification_preferences）
- 实现 6 个 API 端点（订阅/取消/偏好/VAPID/管理员发送）
- 实现 `PushGuideModal` 引导弹窗（毛玻璃 Bottom Sheet 样式）
- 实现 `usePushPermission` Hook（权限检测+申请）
- 实现 `usePushTrigger` Hook（场景触发条件检测）
- 实现 Service Worker 推送处理（展示通知 + 点击跳转）
- 实现通知偏好按类型开关
- Web Push 使用 `web-push` 库 + VAPID 密钥对

## 边界（不做什么）

- 不实现学习提醒的定时调度器（后续定时任务模块）
- 不实现管理后台推送 UI（T13）
- 不实现移动端原生推送（仅 Web Push）
- 不实现通知中心/历史记录页面

## 涉及文件

- 新建: `supabase/migrations/xxx_create_push_tables.sql`
- 新建: `backend/src/models/push.ts`
- 新建: `backend/src/routers/v1/push.ts`
- 新建: `backend/src/routers/v1/admin/push.ts`
- 新建: `backend/src/services/push-service.ts`
- 新建: `backend/src/repositories/push-repo.ts`
- 新建: `frontend/src/features/push/components/PushGuideModal.tsx`
- 新建: `frontend/src/features/push/hooks/use-push-permission.ts`
- 新建: `frontend/src/features/push/hooks/use-push-trigger.ts`
- 新建: `frontend/src/features/push/services/push-service.ts`
- 新建: `frontend/src/features/push/types.ts`
- 新建: `frontend/src/features/push/index.ts`
- 修改: `frontend/public/sw.js`（或 Service Worker 注册文件）
- 修改: `backend/src/routers/v1/index.ts`（注册 push 路由）

## 依赖

- 前置: T02-003（需要登录态的 authMiddleware）
- 后续: 课程/游戏模块会调用 `usePushTrigger` 触发引导

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户首次打开应用  
   **WHEN** 浏览首页  
   **THEN** 不弹出任何推送权限相关弹窗

2. **GIVEN** 已登录用户首次完成一节课程  
   **WHEN** 课程完成  
   **THEN** 弹出推送引导弹窗（毛玻璃底部弹窗，说明推送价值）

3. **GIVEN** 引导弹窗显示  
   **WHEN** 用户点击"开启通知"  
   **THEN** 触发浏览器系统权限弹窗

4. **GIVEN** 系统权限已授权  
   **WHEN** 权限授予成功  
   **THEN** `POST /api/v1/push/subscribe` 注册订阅 + 成功 Toast

5. **GIVEN** 引导弹窗显示  
   **WHEN** 用户点击"暂不开启"  
   **THEN** 弹窗关闭，记录已询问标记，不再自动弹出

6. **GIVEN** 用户已订阅推送  
   **WHEN** 管理员发送一条系统公告通知  
   **THEN** 用户设备收到 Web Push 通知

7. **GIVEN** 用户在设置中关闭"学习提醒"  
   **WHEN** 服务端发送学习提醒  
   **THEN** 该用户不会收到此类型通知

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. 验证迁移执行成功
4. 逐个测试 6 个 API 端点
5. Browser MCP 验证前端引导弹窗渲染
6. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 数据库迁移成功
- [ ] 订阅/取消/偏好 API 正常
- [ ] VAPID 公钥 API 可访问
- [ ] 引导弹窗正确渲染（不在首次打开弹出）
- [ ] 通知偏好按类型开关生效
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-009-push-notification.md`

## 自检重点

- [ ] 安全：VAPID 私钥仅在后端使用
- [ ] 安全：RLS 策略确保用户只能管理自己的订阅
- [ ] 安全：管理员发送 API 需鉴权
- [ ] 用户体验：绝不在首次打开弹出权限请求
- [ ] 兼容：Safari 对 Web Push 支持差异处理

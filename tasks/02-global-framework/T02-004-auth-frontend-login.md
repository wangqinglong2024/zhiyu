# T02-004: 认证系统 — 前端登录注册

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 15

## 需求摘要

实现知语 Zhiyu 前端完整的登录注册交互系统。包含：登录弹窗（Bottom Sheet 形式，从底部上滑覆盖 70% 屏幕）、Google/Apple OAuth 一键登录、邮箱登录表单、注册表单（含昵称+推荐码+隐私协议）、忘记密码多步骤流程。所有表单使用 Zod 校验，支持三语（zh/en/vi）文案。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/02-auth-system.md` — 登录弹窗布局、注册流程、忘记密码流程完整定义
- 设计规范: `grules/01-rules.md` §一.3 — 输入框/按钮交互规范（glass-input、btn-primary、Focus 弥散光晕）
- 设计规范: `grules/06-ui-design.md` §三.5 — 表单交互范式、验证反馈
- 编码规范: `grules/05-coding-standards.md` §二 — 前端组件规范、Zod 表单校验
- 项目结构: `grules/02-project-structure.md` — features/auth/ 模块结构
- 关联任务: T02-003（后端 API 已就绪）→ 本任务 → T02-005（登录墙）、T02-010（全局状态需要 auth 信息）

## 技术方案

### 组件架构

```
frontend/src/features/auth/
├── components/
│   ├── AuthModal.tsx              # 登录/注册弹窗容器（Bottom Sheet）
│   ├── LoginForm.tsx              # 邮箱登录表单
│   ├── RegisterForm.tsx           # 注册表单
│   ├── ForgotPasswordFlow.tsx     # 忘记密码多步骤
│   ├── OAuthButtons.tsx           # Google/Apple OAuth 按钮组
│   ├── PasswordInput.tsx          # 密码输入框（含显示/隐藏切换）
│   └── PasswordStrength.tsx       # 密码强度指示条
├── hooks/
│   ├── use-login.ts               # 登录逻辑 Hook
│   ├── use-register.ts            # 注册逻辑 Hook
│   └── use-forgot-password.ts     # 忘记密码逻辑 Hook
├── services/
│   └── auth-service.ts            # 前端 Auth API 调用层
├── schemas.ts                     # Zod 表单校验 Schema
├── types.ts                       # 模块类型定义
└── index.ts                       # 统一导出
```

### 弹窗交互设计

- **形式**: Bottom Sheet，从底部上滑，覆盖屏幕 70%
- **圆角**: 顶部 `--radius-3xl`（32px），底部无圆角
- **背景**: 毛玻璃材质面板
- **遮罩**: 黑色 50% 透明度 + `backdrop-blur(4px)`
- **关闭**: 向下拖拽 > 120px 释放关闭 / 点击遮罩关闭
- **弹出动效**: Slide Up 300ms Standard 缓动
- **关闭动效**: Slide Down 250ms Accelerate 缓动

### 登录/注册切换

- 登录→注册: 从右向左推入（Push）300ms
- 注册→登录: 从左向右推入（Pop）300ms
- 登录→忘记密码: Push 进入多步骤流程

### 表单校验规则

| 字段 | 校验规则 | 校验时机 |
|------|---------|---------|
| 邮箱 | 有效邮箱格式，≤ 254 字符 | blur |
| 密码（登录） | ≥ 8 位 | blur |
| 密码（注册） | ≥ 8 位，含字母 + 数字 | blur |
| 昵称 | 2-20 字符，中英文/数字/下划线 | blur |
| 推荐码 | 8 位字母数字（选填） | blur |
| 隐私协议 | 必须勾选 | 提交时 |

### Apple 登录平台适配

- 仅在 iOS/macOS Safari 显示 Apple 登录按钮
- 其他平台（Android/Windows/Linux）隐藏

## 范围（做什么）

- 实现 `AuthModal` 底部弹窗容器（拖拽关闭、遮罩关闭、动效）
- 实现 `LoginForm`（邮箱+密码+登录按钮+加载态+错误处理）
- 实现 `OAuthButtons`（Google/Apple 按钮+平台检测+加载态）
- 实现 `RegisterForm`（邮箱+密码+昵称+推荐码+隐私协议+强度指示）
- 实现 `ForgotPasswordFlow`（输入邮箱→验证码→新密码→成功）
- 实现前端 Zod 校验 Schema（所有表单字段）
- 实现前端 auth-service（调用 T02-003 的 API）
- 实现 `use-login`、`use-register`、`use-forgot-password` Hooks
- 登录/注册成功后存储 Token + 更新用户状态
- 支持三语文案（zh/en/vi）
- 支持 Light/Dark 双模式
- 所有输入框使用 `.glass-input` 样式 + Focus 弥散光晕

## 边界（不做什么）

- 不实现后端 API（T02-003 已完成）
- 不实现登录墙触发逻辑（T02-005）
- 不实现全局用户状态持久化（T02-010）
- 不实现隐私政策/服务条款页面内容（后续任务）

## 涉及文件

- 新建: `frontend/src/features/auth/components/AuthModal.tsx`
- 新建: `frontend/src/features/auth/components/LoginForm.tsx`
- 新建: `frontend/src/features/auth/components/RegisterForm.tsx`
- 新建: `frontend/src/features/auth/components/ForgotPasswordFlow.tsx`
- 新建: `frontend/src/features/auth/components/OAuthButtons.tsx`
- 新建: `frontend/src/features/auth/components/PasswordInput.tsx`
- 新建: `frontend/src/features/auth/components/PasswordStrength.tsx`
- 新建: `frontend/src/features/auth/hooks/use-login.ts`
- 新建: `frontend/src/features/auth/hooks/use-register.ts`
- 新建: `frontend/src/features/auth/hooks/use-forgot-password.ts`
- 新建: `frontend/src/features/auth/services/auth-service.ts`
- 新建: `frontend/src/features/auth/schemas.ts`
- 新建: `frontend/src/features/auth/types.ts`
- 新建: `frontend/src/features/auth/index.ts`
- 修改: `frontend/src/App.tsx`（挂载 AuthModal 全局入口）

## 依赖

- 前置: T02-003（后端认证 API 就绪）
- 后续: T02-005（登录墙调用 AuthModal）、T02-010（全局用户状态）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** AuthModal 被触发  
   **WHEN** 弹窗弹出  
   **THEN** 从底部上滑覆盖 70% 屏幕，顶部 32px 圆角，背景毛玻璃遮罩，300ms Standard 缓动

2. **GIVEN** 登录弹窗显示  
   **WHEN** 检查弹窗内容  
   **THEN** 依次包含：拖拽条、Logo、欢迎语、Google 按钮、Apple 按钮（仅 iOS/macOS）、分割线、邮箱/密码输入框、忘记密码链接、登录按钮、注册入口

3. **GIVEN** 输入无效邮箱并离开输入框  
   **WHEN** blur 事件触发  
   **THEN** 输入框边框变红色 + 下方显示错误文案

4. **GIVEN** 邮箱和密码均有效  
   **WHEN** 检查登录按钮  
   **THEN** 按钮从置灰变为可点击（Rose 色背景）

5. **GIVEN** 点击登录按钮  
   **WHEN** 请求处理中  
   **THEN** 按钮显示旋转加载指示器 + "登录中…" + 不可再次点击

6. **GIVEN** 登录成功  
   **WHEN** 服务器返回成功  
   **THEN** 弹窗关闭 + Token 存储 + 用户状态更新

7. **GIVEN** 登录失败（密码错误）  
   **WHEN** 服务器返回 40101  
   **THEN** 错误 Toast "密码错误，请重试" + 按钮恢复可点击 + 已填内容保留

8. **GIVEN** 点击"立即注册"  
   **WHEN** 切换到注册表单  
   **THEN** 从右向左推入动效 300ms，注册表单包含：邮箱+密码+昵称+推荐码+隐私协议+注册按钮

9. **GIVEN** 注册表单中未勾选隐私协议  
   **WHEN** 检查注册按钮  
   **THEN** 按钮置灰（opacity: 0.45）不可点击

10. **GIVEN** 向下拖拽弹窗超过 120px 后释放  
    **WHEN** 弹窗关闭  
    **THEN** 弹窗向下滑出 250ms Accelerate 缓动

11. **GIVEN** 深色模式  
    **WHEN** 查看登录弹窗  
    **THEN** 毛玻璃面板深色适配、Apple 按钮白色背景 + 深色文字、输入框深色主题

12. **GIVEN** UI 语言为越南语  
    **WHEN** 查看登录弹窗  
    **THEN** 所有文案显示越南语版本

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. Browser MCP 访问前端 → 触发登录弹窗
5. 截图记录 Light + Dark 模式下的登录弹窗
6. 截图记录 375px / 768px / 1280px 三断点
7. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 登录弹窗正确渲染（Light + Dark）
- [ ] 表单 Zod 校验正常工作
- [ ] OAuth 按钮可点击（加载态正常）
- [ ] 登录/注册切换动效流畅
- [ ] 三语文案正确切换
- [ ] 响应式测试通过（375px / 768px / 1280px）
- [ ] 无障碍：焦点管理、aria-label
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-004-auth-frontend-login.md`

## 自检重点

- [ ] 安全：Token 不存储在 localStorage（使用 httpOnly cookie 或内存管理）
- [ ] 安全：密码字段不可明文暴露（默认隐藏，可切换）
- [ ] 安全：表单输入经 Zod 校验 + 后端二次校验
- [ ] UI 规范：`.glass-input` 输入框 + Focus 弥散光晕（非默认 ring）
- [ ] UI 规范：`.btn-primary` Rose 色药丸按钮 + Disabled opacity-0.45
- [ ] UI 规范：毛玻璃 Bottom Sheet + 拖拽关闭 + 遮罩关闭
- [ ] 性能：弹窗组件懒加载（React.lazy）
- [ ] 类型同步：前端类型与后端 API 响应一致

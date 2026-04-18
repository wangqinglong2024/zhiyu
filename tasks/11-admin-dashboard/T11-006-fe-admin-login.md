# T11-006: 前端 — 登录页面

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 5

## 需求摘要

实现管理后台登录页面的完整前端 UI 和交互逻辑。包括：深色渐变背景 + 毛玻璃登录卡片居中布局、邮箱/密码输入框（浮动标签、即时校验、图标）、记住我复选框、登录按钮（Loading 态 / 禁用态）、登录失败提示与剩余次数显示、账号锁定倒计时、首次登录强制改密弹窗、会话超时遮罩、登录成功跳转逻辑（含 redirect 参数）。严格遵循 `01-login.md` PRD 的每一个 UI 细节和交互状态。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/01-login.md` — 登录页完整 PRD（**核心依据，每个像素级细节都在此文件**）
- 产品需求: `product/admin/01-admin-dashboard/05-data-nonfunctional.md` §三.1 — 登录页 13 项验收标准
- 架构白皮书: `grules/01-rules.md` §一 — Cosmic Refraction CSS 精确参数
- UI 设计: `grules/06-ui-design.md` — 设计哲学、色彩、字体、间距、动效
- 编码规范: `grules/05-coding-standards.md` §二 — 前端组件命名
- 关联任务: 前置 T11-002（认证 API）、T11-005（管理后台脚手架） → 后续 T11-007（全局导航）

## 技术方案

### 页面结构

```
路由: /admin/login
页面: 全屏页面，无侧边栏/顶部栏

┌─────────────────────────────────────────────────────┐
│  深色渐变背景（Cosmic Refraction 暗色模式）            │
│                                                     │
│              品牌 Logo 图标 (64×64px)                │
│              "知语 Zhiyu" (H2, 24px, 白色, 700)      │
│              "管理后台" (14px, #a3a3a3)               │
│                                                     │
│         ┌─ .glass-card 毛玻璃卡片 (400px 宽) ─┐      │
│         │                                     │      │
│         │  📧 邮箱地址（浮动标签输入框）         │      │
│         │                                     │      │
│         │  🔒 密码（浮动标签 + 👁 切换）        │      │
│         │                                     │      │
│         │  □ 记住我（7天）                      │      │
│         │                                     │      │
│         │  [ 登  录 ] (全宽 Rose 药丸按钮)      │      │
│         │                                     │      │
│         └─────────────────────────────────────┘      │
│                                                     │
│         © 2026 知语 Zhiyu. All rights reserved.     │
└─────────────────────────────────────────────────────┘
```

### 组件拆分

```
features/admin/pages/
└── AdminLoginPage.tsx              # 登录页面主组件

features/admin/components/login/
├── LoginCard.tsx                    # 毛玻璃登录卡片
├── LoginForm.tsx                    # 登录表单（邮箱+密码+记住我+按钮）
├── LoginErrorBanner.tsx             # 登录失败/锁定提示横幅
├── ChangePasswordModal.tsx          # 首次登录强制改密弹窗
└── SessionExpiredOverlay.tsx        # 会话过期全屏遮罩
```

### 表单组件规格

#### 邮箱输入框

```typescript
// 按 PRD §二.1 精确实现
{
  label: "邮箱地址",                    // 浮动标签
  placeholder: "请输入邮箱地址",
  type: "email",
  autoComplete: "email",
  leftIcon: <Mail size={20} />,         // Lucide Mail 图标，中性灰
  clearButton: true,                    // 有内容时显示 × 清除
  validation: {
    onBlur: true,                       // 失焦时校验
    rules: [
      { required: true, message: "请输入邮箱地址" },
      { pattern: /email/, message: "请输入有效的邮箱地址" },
    ]
  },
  errorStyle: {
    textColor: "#ef4444",               // 错误文字红色
    fontSize: "12px",                   // Caption
    borderColor: "#ef4444",             // 输入框边框变红
  }
}
```

#### 密码输入框

```typescript
// 按 PRD §二.2 精确实现
{
  label: "密码",
  placeholder: "请输入密码",
  type: "password",                     // 默认隐藏
  autoComplete: "current-password",
  leftIcon: <Lock size={20} />,         // Lucide Lock 图标
  rightIcon: <EyeOff size={20} />,      // 切换显隐按钮
  toggleVisibility: true,               // 点击切换 password/text
  validation: {
    onBlur: true,
    rules: [
      { required: true, message: "请输入密码" },
    ]
  },
  onEnter: "triggerLogin",              // Enter 键触发登录
}
```

#### 登录按钮

```typescript
// 按 PRD §二.4 精确实现
{
  text: "登 录",
  style: "w-full rounded-full bg-[#e11d48] text-white text-[16px] font-semibold",
  disabled: "email 或 password 为空时 opacity-50 cursor-not-allowed",
  hover: "brightness-90 cursor-pointer",
  active: "scale-[0.97] transition-transform duration-100",
  loading: "Spinner + '登录中...' + disabled",
  preventDoubleClick: true,
}
```

### 登录失败交互

```typescript
// 失败提示横幅（LoginErrorBanner）
// 位置：登录表单上方
// 样式：红色背景 10% 透明度 + 红色文字 + Lucide AlertCircle 图标

// 状态 1: 密码错误（第 1-4 次）
// "邮箱或密码错误，还剩 X 次尝试机会"

// 状态 2: 账号锁定（第 5 次触发）
// "账号已锁定，请 15 分钟后重试"
// + 登录按钮置灰
// + 显示倒计时 "账号已锁定，XX:XX 后可重试"

// 密码错误时：密码输入框水平抖动动效
// 水平位移 ±4px，持续 300ms，使用 CSS @keyframes shake
```

### 倒计时逻辑

```typescript
// 使用 useEffect + setInterval 实现分秒倒计时
// 倒计时格式: "MM:SS"
// 每秒更新一次
// 倒计时结束 → 清除 interval → 恢复按钮可用 → 失败计数归零
// 锁定状态存储在 state 中（从 API 403 响应的 remaining_seconds 初始化）
```

### 首次登录改密弹窗

```typescript
// ChangePasswordModal
// 触发条件: 登录成功但 is_temp_password === true
// 模态弹窗，不可关闭（无 × 按钮，无 ESC 关闭，无点击遮罩关闭）
// 标题: "请修改密码"
// 说明: "您正在使用临时密码，请设置新密码后继续使用"

// 字段:
// 1. 当前密码（即临时密码）
// 2. 新密码（8-32位，含大小写字母+数字，实时校验强度）
// 3. 确认新密码（与新密码一致性校验）

// 按钮: "确认修改"（Rose 主按钮）
// 修改成功 → 关闭弹窗 → Toast "密码修改成功" → 正常进入后台
// 修改失败 → 显示错误提示
```

### 登录成功流程

```typescript
// 1. 登录 API 成功返回
// 2. 存储 Token（remember_me ? localStorage : sessionStorage）
// 3. 更新 AdminAuthProvider 状态
// 4. 检查 is_temp_password → true 时弹出改密弹窗
// 5. 改密完成（或无需改密）→ 跳转
// 6. 检查 URL 中的 redirect 参数
//    - 有 redirect → 跳转至 redirect 路径
//    - 无 redirect → 跳转至 /admin/dashboard
// 7. 显示 Toast "登录成功，欢迎回来，[管理员姓名]"（绿色，2s 自动消失）
```

### 入场动画

```css
/* 登录卡片入场动画 */
@keyframes login-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* 300ms ease-out */

/* 打开页面时自动 focus 到邮箱输入框 */
```

### 密码输入框抖动动效

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
/* 持续 300ms */
```

## 范围（做什么）

- 创建 `AdminLoginPage.tsx` — 登录页面主组件
- 创建 `LoginCard.tsx` — 毛玻璃登录卡片
- 创建 `LoginForm.tsx` — 登录表单
- 创建 `LoginErrorBanner.tsx` — 错误/锁定提示
- 创建 `ChangePasswordModal.tsx` — 首次登录改密弹窗
- 创建 `SessionExpiredOverlay.tsx` — 会话超时全屏遮罩
- 集成 AdminAuthProvider 的 login 方法
- 实现所有 PRD 定义的 7 种状态（空/加载/首次加载/成功/错误/锁定/会话过期）
- 实现倒计时逻辑
- 实现 redirect 参数跳转逻辑

## 边界（不做什么）

- 不实现后端认证 API（T11-002 已完成）
- 不实现侧边栏和导航（T11-007）
- 不实现 TOTP 二次验证 UI（后续迭代）
- 不实现"忘记密码"和"注册"入口（PRD 明确无此功能）

## 涉及文件

- 新建: `zhiyu/frontend/src/features/admin/pages/AdminLoginPage.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/login/LoginCard.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/login/LoginForm.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/login/LoginErrorBanner.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/login/ChangePasswordModal.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/login/SessionExpiredOverlay.tsx`
- 修改: `zhiyu/frontend/src/features/admin/router/admin-routes.tsx` — 挂载登录页路由

## 依赖

- 前置: T11-002（后端认证 API）、T11-005（管理后台脚手架 + AdminAuthProvider）
- 后续: T11-007（登录成功后的全局导航布局）

## 验收标准（GIVEN-WHEN-THEN）

> 以下标准对应 PRD `05-data-nonfunctional.md` §三.1 的 L-01 至 L-13

1. **GIVEN** 登录页已加载  
   **WHEN** 输入正确邮箱密码 → 点击登录  
   **THEN** 2s 内跳转仪表盘 → Toast 显示"登录成功，欢迎回来，[姓名]"（L-01）

2. **GIVEN** 登录页邮箱输入框  
   **WHEN** 输入非法格式邮箱 → 失焦  
   **THEN** 输入框下方即时显示"请输入有效的邮箱地址"红色文字，边框变红（L-02）

3. **GIVEN** 密码为空  
   **WHEN** 点击登录  
   **THEN** 密码框下方显示"请输入密码"（L-03）

4. **GIVEN** 输入错误密码  
   **WHEN** 点击登录  
   **THEN** 表单上方显示"邮箱或密码错误，还剩 X 次尝试机会"红色横幅 + 密码框抖动（L-04）

5. **GIVEN** 已连续失败 5 次  
   **WHEN** 第 5 次失败后  
   **THEN** 按钮置灰 → 显示"账号已锁定，XX:XX 后可重试"分秒倒计时 → 倒计时结束后按钮恢复（L-05）

6. **GIVEN** 密码输入框默认隐藏  
   **WHEN** 点击眼睛图标  
   **THEN** 密码在明文/密文间切换 → 图标在 Eye/EyeOff 间切换（L-06）

7. **GIVEN** 勾选"记住我"  
   **WHEN** 登录成功 → 关闭浏览器  
   **THEN** 7 天内重新打开直接进入仪表盘（Token 存储在 localStorage）（L-07）

8. **GIVEN** 未勾选"记住我" → 登录成功  
   **WHEN** 静置 2 小时  
   **THEN** 显示会话过期遮罩 → 点击"重新登录"跳转登录页（L-08）

9. **GIVEN** 使用临时密码登录成功  
   **WHEN** 检测到 is_temp_password = true  
   **THEN** 弹出改密弹窗（不可关闭）→ 修改成功后才能进入后台（L-10）

10. **GIVEN** 已登录状态  
    **WHEN** 点击退出登录 → 确认弹窗 → 确认  
    **THEN** 跳转登录页 → Toast "已安全退出"（L-11）

11. **GIVEN** 密码输入框获焦  
    **WHEN** 按 Enter 键  
    **THEN** 触发登录（等同点击按钮）（L-12）

12. **GIVEN** 点击登录按钮后  
    **WHEN** API 响应中  
    **THEN** 按钮变为 Spinner + "登录中..." + Disabled，不可重复点击（L-13）

13. **GIVEN** 登录卡片首次加载  
    **WHEN** 页面渲染完成  
    **THEN** 卡片带入场动画（translateY(20px) 淡入，300ms ease-out），邮箱输入框自动 focus

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. Browser MCP 访问 `http://localhost:3100/admin/login`
5. 截图记录登录页 Dark 模式外观
6. 测试邮箱格式校验（输入非法邮箱 → 失焦）
7. 测试空密码校验
8. 测试正确账号登录成功流程
9. 测试错误密码失败提示和剩余次数
10. 测试 5 次失败后锁定和倒计时
11. 测试密码显示/隐藏切换
12. 测试 Enter 键提交
13. 测试 Loading 态防重复点击
14. 测试 1280px 宽度截图

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 登录页正确渲染（深色背景 + 毛玻璃卡片 + 品牌 Logo）
- [ ] 邮箱/密码表单交互正确（浮动标签、即时校验、图标）
- [ ] 登录成功正确跳转和 Toast
- [ ] 登录失败正确显示错误和剩余次数
- [ ] 账号锁定正确显示倒计时
- [ ] 密码显隐切换正常
- [ ] Enter 键提交正常
- [ ] Loading 态防重复点击
- [ ] 入场动画正常
- [ ] UI 符合 Cosmic Refraction 设计系统（毛玻璃、Rose 色按钮、圆角）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-006-fe-admin-login.md`

## 自检重点

- [ ] 安全：不暴露邮箱是否存在、密码不明文传输
- [ ] UI 设计规范：Cosmic Refraction 毛玻璃、Rose/Sky/Amber 色彩、无紫色
- [ ] 动效：入场动画、抖动动效、Loading 态、按钮缩放
- [ ] 无障碍：表单 label 关联、键盘操作、焦点管理、对比度
- [ ] 响应式：登录页在 1280px+ 正常展示（管理后台不考虑移动端）

# T10-013: 前端 — 设置与隐私

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10

## 需求摘要

实现「设置」页面的前端。包含：语言切换（简体中文/英文/日文等界面语言 + 课程教学语言）、主题切换（浅色/深色/跟随系统）、通知设置（签到提醒/课程到期/推荐奖励到账）、推荐码绑定入口、隐私政策/用户协议查看、退出登录、注销账号（二次确认 + 冷静期说明）。严格遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/07-settings.md` — 设置页完整 PRD
- 产品需求: `product/apps/09-personal-payment/08-data-nonfunctional.md` — 隐私合规、数据安全
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` — 前端编码规范
- 关联任务: T02-007（主题系统）、T02-008（多语言 i18n）→ 本任务

## 技术方案

### 前端架构

```
src/features/settings/
├── pages/
│   ├── SettingsPage.tsx             — 设置主页
│   ├── LanguageSettingsPage.tsx     — 语言设置页
│   ├── NotificationSettingsPage.tsx — 通知设置页
│   ├── PrivacyPolicyPage.tsx        — 隐私政策页
│   ├── TermsOfServicePage.tsx       — 用户协议页
│   └── DeleteAccountPage.tsx        — 注销账号页
├── components/
│   ├── SettingsGroup.tsx            — 设置分组
│   ├── SettingsRow.tsx              — 设置行（标题 + 当前值 + 箭头/开关）
│   ├── ThemeSelector.tsx            — 主题选择器（三选一）
│   ├── LanguageSelector.tsx         — 语言选择器
│   ├── NotificationToggle.tsx       — 通知开关
│   ├── ReferralBindEntry.tsx        — 推荐码绑定入口
│   ├── LogoutButton.tsx             — 退出登录按钮
│   ├── DeleteAccountDialog.tsx      — 注销确认弹窗
│   └── AppVersionInfo.tsx           — 应用版本信息
├── hooks/
│   ├── use-settings.ts              — 设置读写 Hook
│   ├── use-theme.ts                 — 主题切换 Hook
│   └── use-notifications.ts         — 通知设置 Hook
└── services/
    └── settings-service.ts          — 设置 API 调用
```

### 页面结构（设置主页）

```
SettingsPage
├── Header "设置"
├── SettingsGroup "通用"
│   ├── SettingsRow "界面语言"     — 当前值 "简体中文" → LanguageSettingsPage
│   ├── SettingsRow "课程语言"     — 当前值 "英语" → LanguageSettingsPage
│   └── SettingsRow "外观主题"     — ThemeSelector (浅色/深色/系统)
├── SettingsGroup "通知"
│   ├── NotificationToggle "签到提醒"    — 每日 9:00
│   ├── NotificationToggle "课程到期提醒" — 到期前 30/7/1 天
│   └── NotificationToggle "奖励到账通知" — 推荐返利确认
├── SettingsGroup "推荐"
│   └── ReferralBindEntry
│       ├── 未绑定: "输入推荐码" + 输入框 + 绑定按钮
│       └── 已绑定: "已使用推荐码 ZY-XXXX" (不可修改)
├── SettingsGroup "关于"
│   ├── SettingsRow "隐私政策"     → PrivacyPolicyPage
│   ├── SettingsRow "用户协议"     → TermsOfServicePage
│   └── AppVersionInfo "知语 v1.0.0"
├── LogoutButton "退出登录"        — 确认弹窗
└── SettingsRow "注销账号"         → DeleteAccountPage (Rose 色文字)
```

### 主题切换逻辑

```typescript
// src/features/settings/hooks/use-theme.ts

type ThemeMode = 'light' | 'dark' | 'system'

function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() =>
    localStorage.getItem('theme-mode') as ThemeMode || 'system'
  )
  
  useEffect(() => {
    const root = document.documentElement
    localStorage.setItem('theme-mode', mode)
    
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)
      const handler = (e: MediaQueryListEvent) =>
        root.classList.toggle('dark', e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    
    root.classList.toggle('dark', mode === 'dark')
  }, [mode])
  
  return { mode, setMode }
}
```

### 注销账号流程

```
用户点击"注销账号"
  → DeleteAccountPage
    1. 警告说明
       - "注销后所有数据将被永久删除"
       - "包括：学习进度、课程访问权限、知语币余额、推荐关系"
       - "此操作不可撤销"
    2. 冷静期说明
       - "提交注销申请后，7 天冷静期内可取消"
       - "7 天后账号将被永久删除"
    3. 确认输入
       - 输入框: "请输入 DELETE 确认注销"
    4. 二次确认弹窗
       - "确定要注销账号吗？"
       - [取消] [确认注销] (Rose 色)
    5. 提交注销 API
       - POST /api/v1/users/me/delete-request
       - 成功 → 退出登录 → 跳转首页
```

### 语言选项

| 界面语言 | 代码 | 课程教学语言 | 代码 |
|----------|------|-------------|------|
| 简体中文 | zh-CN | 英语 | en |
| 繁體中文 | zh-TW | 日本語 | ja |
| English | en | 한국어 | ko |
| 日本語 | ja | Tiếng Việt | vi |
| 한국어 | ko | ภาษาไทย | th |
| Tiếng Việt | vi | — | — |

### 关键样式规格

| 元素 | 样式 |
|------|------|
| 设置分组标题 | `text-xs font-medium uppercase tracking-wider opacity-50` |
| 设置行 | 56px 高 `.glass-card` 内部行, `flex justify-between items-center` |
| 当前值 | `text-sm opacity-60` |
| 开关组件 | 44×24 `rounded-full`，开启 Sky-500，关闭 灰色 |
| 主题选择器 | 三个 56×56 圆角方块（太阳/月亮/自动图标） |
| 退出登录按钮 | 全宽 `text-center` Sky 色文字 |
| 注销账号 | Rose 色文字 `text-sm`，无强调 |
| 确认输入框 | `border-[#ef4444] focus:ring-[#ef4444]` |

## 范围（做什么）

- 实现设置主页（分组展示）
- 实现主题切换（浅色/深色/跟随系统）
- 实现语言设置页（界面语言 + 课程语言）
- 实现通知开关
- 实现推荐码绑定入口
- 实现隐私政策/用户协议页面（Markdown 渲染）
- 实现退出登录（确认弹窗 + 清除状态）
- 实现注销账号流程（警告 + 输入确认 + 二次弹窗 + API）
- Light/Dark 双模式、响应式

## 边界（不做什么）

- 不实现后端注销账号数据清理逻辑（后端独立任务）
- 不实现推送通知服务端（仅前端开关，存 localStorage）
- 不实现隐私政策/用户协议内容编写（使用占位内容）

## 涉及文件

- 新建: `src/features/settings/pages/SettingsPage.tsx`
- 新建: `src/features/settings/pages/LanguageSettingsPage.tsx`
- 新建: `src/features/settings/pages/NotificationSettingsPage.tsx`
- 新建: `src/features/settings/pages/PrivacyPolicyPage.tsx`
- 新建: `src/features/settings/pages/TermsOfServicePage.tsx`
- 新建: `src/features/settings/pages/DeleteAccountPage.tsx`
- 新建: `src/features/settings/components/SettingsGroup.tsx`
- 新建: `src/features/settings/components/SettingsRow.tsx`
- 新建: `src/features/settings/components/ThemeSelector.tsx`
- 新建: `src/features/settings/components/DeleteAccountDialog.tsx`
- 新建: `src/features/settings/hooks/use-theme.ts`
- 修改: `src/router/index.tsx` — 添加路由

## 依赖

- 前置: T02-007（主题系统 — Dark Mode 基础设施）、T02-008（多语言 i18n 基础设施）
- 后续: T10-014（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户进入设置页 WHEN 查看 THEN 显示所有分组（通用/通知/推荐/关于）+ 退出登录 + 注销账号
2. GIVEN 当前浅色主题 WHEN 点击"深色"主题 THEN 立即切换为深色模式，页面全局切换
3. GIVEN 当前主题为"跟随系统" WHEN 系统切换 Dark Mode THEN 页面自动跟随切换
4. GIVEN 签到提醒开启 WHEN 关闭开关 THEN 开关变灰，设置持久化到 localStorage
5. GIVEN 未绑定推荐码 WHEN 输入有效推荐码并绑定 THEN 显示"已使用推荐码 ZY-XXXX"，不可修改
6. GIVEN 注册超过 7 天 WHEN 尝试绑定推荐码 THEN 显示错误"推荐码绑定期限已过"
7. GIVEN 点击"退出登录" WHEN 确认 THEN 清除 session + 跳转登录页
8. GIVEN 注销账号页 WHEN 输入"DELETE"并确认 THEN 提交注销请求 → 退出登录
9. GIVEN 注销账号页 WHEN 输入非"DELETE"文本 THEN 确认按钮禁用
10. GIVEN 隐私政策页 WHEN 查看 THEN 正确渲染 Markdown 内容
11. GIVEN 375px 宽度 WHEN 查看设置页 THEN 布局正常，开关/选择器不溢出

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. Browser MCP 导航到设置页面
3. 验证主题切换（浅色/深色/系统）
4. 验证通知开关
5. 验证推荐码绑定
6. 验证注销流程
7. 截图：Light + Dark + 三断点

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 主题切换正常（三种模式 + 持久化）
- [ ] 语言切换正常
- [ ] 通知开关正常
- [ ] 推荐码绑定正常（含期限校验）
- [ ] 退出登录正常
- [ ] 注销账号全流程（输入确认 + 二次确认 + API）
- [ ] 响应式通过
- [ ] Light/Dark 模式正确
- [ ] 色彩仅 Rose/Sky/Amber + 中性色
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-013-fe-settings-privacy.md`

## 自检重点

- [ ] 安全：注销账号需二次确认 + 输入确认
- [ ] 隐私：GDPR/CCPA 合规 — 注销后数据删除
- [ ] UI：Cosmic Refraction 设计系统
- [ ] UI：色彩仅限 Rose/Sky/Amber
- [ ] 持久化：主题/语言/通知设置存 localStorage
- [ ] 可逆：退出登录可重新登录，注销有 7 天冷静期

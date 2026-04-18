# T02-008: 主题系统 — ThemeProvider 与 CSS 变量切换

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

实现知语 Zhiyu 的主题系统（Light / Dark / System 三模式）。基于 CSS 变量实现主题切换，通过 ThemeProvider 管理主题状态，支持 `prefers-color-scheme` 系统主题跟随，300ms 平滑过渡。所有颜色使用 CSS 变量驱动，Tailwind v4 `@theme` 引用变量。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/04-theme-mode.md` — 主题系统完整需求
  - §一: 三模式（浅色/深色/跟随系统），默认跟随系统
  - §二: CSS 变量切换方案，300ms transition-colors
  - §三: 持久化策略（登录→profiles.theme / 未登录→localStorage）
- 设计规范: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统 CSS 变量定义
- 设计规范: `grules/06-ui-design.md` §一 — 颜色系统、CSS 变量映射
- 关联任务: T01-010（Tailwind v4 + CSS 变量基础配置）→ 本任务 → T02-011（组件使用主题变量）

## 技术方案

### CSS 变量方案

```css
/* 通过 data-theme 属性控制 */
:root[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-glass: rgba(255, 255, 255, 0.72);
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-border: rgba(0, 0, 0, 0.06);
  --color-accent-rose: #f43f5e;
  --color-accent-sky: #0ea5e9;
  --color-accent-amber: #f59e0b;
  --glass-blur: 24px;
  --glass-saturate: 1.8;
}

:root[data-theme="dark"] {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-glass: rgba(15, 23, 42, 0.78);
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-accent-rose: #fb7185;
  --color-accent-sky: #38bdf8;
  --color-accent-amber: #fbbf24;
  --glass-blur: 24px;
  --glass-saturate: 1.8;
}
```

### ThemeProvider 架构

```typescript
// frontend/src/features/theme/contexts/ThemeContext.tsx
type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode              // 用户选择模式
  resolved: ResolvedTheme      // 实际应用主题
  setMode: (mode: ThemeMode) => void
}

// 核心逻辑：
// 1. 读取持久化偏好（profiles.theme / localStorage）
// 2. system 模式 → 监听 matchMedia('(prefers-color-scheme: dark)')
// 3. 设置 document.documentElement.setAttribute('data-theme', resolved)
// 4. 添加 transition-colors 类实现 300ms 过渡
```

### 系统主题跟随

```typescript
// 监听系统主题变化
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  if (mode === 'system') {
    setResolved(e.matches ? 'dark' : 'light')
  }
})
```

### 防闪烁方案

```html
<!-- index.html 内联脚本，在 React 加载前执行 -->
<script>
  ;(function() {
    const saved = localStorage.getItem('theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = saved === 'dark' ? 'dark' 
                : saved === 'light' ? 'light' 
                : systemDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
  })()
</script>
```

### 组件架构

```
frontend/src/features/theme/
├── contexts/
│   └── ThemeContext.tsx            # ThemeProvider + ThemeContext
├── hooks/
│   └── use-theme.ts               # useTheme Hook
├── styles/
│   └── theme-variables.css        # CSS 变量定义（Light + Dark）
├── types.ts
└── index.ts
```

## 范围（做什么）

- 实现 CSS 变量定义（Light + Dark 完整色板）
- 实现 ThemeProvider + ThemeContext
- 实现 `useTheme` Hook（mode/resolved/setMode）
- 实现 `prefers-color-scheme` 监听（系统主题跟随）
- 实现 300ms 平滑过渡（transition-colors）
- 实现防闪烁内联脚本
- 持久化：登录用户 → 写入 profiles.theme / 未登录 → localStorage
- Tailwind v4 `@theme` 绑定 CSS 变量

## 边界（不做什么）

- 不实现主题切换 UI（在 T02-012 Header 或个人中心实现）
- 不实现自定义主题色功能
- 不实现 CSS 变量的全部语义化 alias（按需在后续模块补充）

## 涉及文件

- 新建: `frontend/src/features/theme/contexts/ThemeContext.tsx`
- 新建: `frontend/src/features/theme/hooks/use-theme.ts`
- 新建: `frontend/src/features/theme/styles/theme-variables.css`
- 新建: `frontend/src/features/theme/types.ts`
- 新建: `frontend/src/features/theme/index.ts`
- 修改: `frontend/src/styles/main.css`（导入 theme-variables.css）
- 修改: `frontend/index.html`（添加防闪烁内联脚本）
- 修改: `frontend/src/App.tsx`（挂载 ThemeProvider）

## 依赖

- 前置: T01-010（Tailwind v4 基础配置就绪）
- 后续: T02-011（原子组件使用主题 CSS 变量）、所有 UI 组件

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户首次访问，系统设置为深色模式  
   **WHEN** 页面加载  
   **THEN** 应用自动显示深色主题，无闪烁

2. **GIVEN** 当前为浅色模式  
   **WHEN** 调用 `setMode('dark')`  
   **THEN** 主题切换为深色，背景/文字/边框颜色变化，过渡 300ms

3. **GIVEN** 当前模式为 system  
   **WHEN** 操作系统切换深色/浅色  
   **THEN** 应用自动跟随切换

4. **GIVEN** 用户选择 light 模式  
   **WHEN** 刷新页面  
   **THEN** 仍为 light 模式（从 localStorage / profiles 恢复）

5. **GIVEN** 登录用户切换主题  
   **WHEN** 选择 dark 模式  
   **THEN** profiles.theme 更新为 "dark"

6. **GIVEN** 检查 CSS  
   **WHEN** data-theme="dark"  
   **THEN** 所有 `--color-*` 变量为深色值

7. **GIVEN** Tailwind 组件使用 `bg-[var(--color-bg-primary)]`  
   **WHEN** 主题切换  
   **THEN** 组件颜色随 CSS 变量变化

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 访问前端
4. 截图 Light 模式
5. 切换为 Dark 模式 → 截图
6. 验证 300ms 过渡效果
7. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] Light / Dark 切换正常
- [ ] System 模式跟随系统设置
- [ ] 300ms 过渡无闪烁
- [ ] CSS 变量正确生效
- [ ] 持久化恢复正确
- [ ] 无 FOUC（Flash of Unstyled Content）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-008-theme-system.md`

## 自检重点

- [ ] 绝对红线：颜色系统仅 Rose/Sky/Amber，不使用紫色
- [ ] 性能：防闪烁脚本在 `<head>` 同步执行，不依赖 React
- [ ] 性能：CSS 变量切换无 JS 运行时开销
- [ ] 兼容：Safari 14+ 支持 `matchMedia` change 事件
- [ ] Tailwind v4：使用 `@theme` 引用 CSS 变量，不使用 tailwind.config.js

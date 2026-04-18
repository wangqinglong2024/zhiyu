# T01-009: 前端 Vite + React 框架搭建

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10

## 需求摘要

搭建前端 Vite + React 19 + TypeScript 框架，包含应用入口 `main.tsx`、根组件 `App.tsx`、路由骨架（React Router v7）、Tailwind CSS v4 配置（使用 `@import "tailwindcss"` + `@theme` 方式，严禁 `tailwind.config.js`）、ThemeProvider（Light/Dark 模式切换）、基础样式入口文件。搭建完成后前端可正常构建并展示欢迎页面。

## 相关上下文

- 架构白皮书: `grules/01-rules.md` §一 — Tailwind CSS v4 强制规范、CSS 变量驱动
- 设计规范: `grules/06-ui-design.md` — 色彩、字体、间距系统
- 编码规范: `grules/05-coding-standards.md` §二 — 前端编码规范
- 项目结构: `grules/02-project-structure.md` — 前端目录结构
- 关联任务: 前置 T01-004（环境变量） → 后续 T01-010（设计系统）

## 技术方案

### frontend/src/main.tsx — 应用入口

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './providers/ThemeProvider'
import { App } from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

### frontend/src/App.tsx — 根组件

```tsx
import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

App.displayName = 'App'
```

### frontend/src/pages/HomePage.tsx — 临时欢迎页

```tsx
import type { FC } from 'react'

export const HomePage: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          知语 Zhiyu
        </h1>
        <p className="text-base opacity-70">
          中文学习平台 · 基础架构搭建中
        </p>
      </div>
    </div>
  )
}

HomePage.displayName = 'HomePage'
```

### frontend/src/pages/NotFoundPage.tsx — 404 页面

```tsx
import type { FC } from 'react'
import { Link } from 'react-router-dom'

export const NotFoundPage: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-6xl font-bold tracking-tight mb-4">404</h1>
        <p className="text-base opacity-70 mb-6">页面不存在</p>
        <Link to="/" className="btn-primary px-6 py-2">
          返回首页
        </Link>
      </div>
    </div>
  )
}

NotFoundPage.displayName = 'NotFoundPage'
```

### frontend/src/providers/ThemeProvider.tsx — 主题切换

```tsx
import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 优先读取本地存储，否则跟随系统偏好
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('zhiyu-theme') as Theme
      if (stored === 'light' || stored === 'dark') return stored
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('zhiyu-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内部使用')
  }
  return context
}

ThemeProvider.displayName = 'ThemeProvider'
```

### frontend/src/styles/index.css — Tailwind 入口

```css
/* Tailwind CSS v4 入口 — 使用 @import 方式，严禁 tailwind.config.js */
@import "tailwindcss";

/* ===== 自定义主题变量（@theme 指令） ===== */
@theme {
  /* 色彩系统 */
  --color-rose-primary: #e11d48;
  --color-rose-light: #fda4af;
  --color-sky-primary: #0284c7;
  --color-sky-light: #7dd3fc;
  --color-amber-primary: #d97706;
  --color-amber-light: #fde68a;

  /* 字体 */
  --font-heading: 'Manrope', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-3xl: 32px;
}

/* ===== CSS 自定义属性（Light/Dark 模式切换） ===== */
:root {
  /* 渐变网格 Blob 色彩 — Light */
  --mesh-color-1: #fda4af;
  --mesh-color-2: #7dd3fc;
  --mesh-color-3: #fde68a;
  --mesh-opacity: 0.6;

  /* 毛玻璃参数 — Light */
  --glass-bg: rgba(255, 255, 255, 0.25);
  --glass-border: rgba(255, 255, 255, 0.45);
  --glass-inset: rgba(255, 255, 255, 0.6);
  --glass-shadow: rgba(0, 0, 0, 0.06);
  --glass-blur: 24px;
  --glass-saturate: 1.8;

  /* 输入框 Focus */
  --input-focus-glow: rgba(225, 29, 72, 0.25);

  /* 背景 */
  --bg-primary: #fafafa;
  --bg-elevated: #ffffff;

  /* 文字 */
  --text-primary: #171717;
  --text-secondary: #404040;
  --text-tertiary: #a3a3a3;

  color-scheme: light;
}

.dark {
  /* 渐变网格 Blob 色彩 — Dark */
  --mesh-color-1: #e11d48;
  --mesh-color-2: #0284c7;
  --mesh-color-3: #d97706;
  --mesh-opacity: 0.12;

  /* 毛玻璃参数 — Dark */
  --glass-bg: rgba(255, 255, 255, 0.07);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-inset: rgba(255, 255, 255, 0.1);
  --glass-shadow: rgba(0, 0, 0, 0.50);
  --glass-blur: 24px;
  --glass-saturate: 1.8;

  /* 输入框 Focus */
  --input-focus-glow: rgba(253, 164, 175, 0.2);

  /* 背景 */
  --bg-primary: #0e0e0e;
  --bg-elevated: #171717;

  /* 文字 */
  --text-primary: #fafafa;
  --text-secondary: #a3a3a3;
  --text-tertiary: #525252;

  color-scheme: dark;
}

/* ===== 全局基础样式 ===== */
body {
  font-family: var(--font-body);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

/* 毛玻璃基线类 — 占位（T01-010 完善） */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 0 var(--glass-inset),
    0 4px 12px var(--glass-shadow);
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  box-shadow:
    inset 0 1px 0 0 var(--glass-inset),
    0 4px 12px var(--glass-shadow);
  transition: all 300ms ease-out;
}

.glass-card:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 0 var(--glass-inset),
    0 8px 24px var(--glass-shadow);
}
```

### frontend/src/router/index.tsx — 路由配置

```tsx
import { Routes, Route } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* 后续模块路由在此扩展 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
```

### frontend/index.html — HTML 入口

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="知语 Zhiyu — 中文学习平台" />
    <title>知语 Zhiyu</title>
    <!-- Google Fonts: Manrope + Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 范围（做什么）

- 实现 `frontend/src/main.tsx` 应用入口
- 实现 `frontend/src/App.tsx` 根组件
- 实现 `frontend/src/pages/HomePage.tsx` 临时欢迎页
- 实现 `frontend/src/pages/NotFoundPage.tsx` 404 页面
- 实现 `frontend/src/providers/ThemeProvider.tsx` 主题切换
- 实现 `frontend/src/styles/index.css` Tailwind v4 入口 + CSS 变量
- 实现 `frontend/src/router/index.tsx` 路由骨架
- 更新 `frontend/index.html` HTML 入口
- 配置 Tailwind CSS v4（@import + @theme，无 tailwind.config.js）
- 配置 Light/Dark 双模式 CSS 变量

## 边界（不做什么）

- 不实现完整的毛玻璃类库（T01-010 设计系统任务）
- 不实现 Three.js 粒子背景（T01-011）
- 不实现认证流程（T02）
- 不实现 Tab 导航（T02）
- 不实现 API 客户端封装（T02）
- 不实现具体业务页面

## 涉及文件

- 修改: `zhiyu/frontend/src/main.tsx`
- 修改: `zhiyu/frontend/src/App.tsx`
- 修改: `zhiyu/frontend/src/pages/HomePage.tsx`（新建或修改占位）
- 修改: `zhiyu/frontend/src/pages/NotFoundPage.tsx`
- 修改: `zhiyu/frontend/src/providers/ThemeProvider.tsx`
- 修改: `zhiyu/frontend/src/styles/index.css`
- 修改: `zhiyu/frontend/src/router/index.tsx`
- 修改: `zhiyu/frontend/index.html`
- 修改: `zhiyu/frontend/src/hooks/use-theme.ts`（导出 useTheme 便捷引用）
- 确认不存在: `zhiyu/frontend/tailwind.config.js`（**绝对红线**）

## 依赖

- 前置: T01-004（前端环境变量）
- 后续: T01-010（设计系统在此基础上完善 CSS）、T01-011（粒子背景组件）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 前端 Docker 容器已构建启动  
   **WHEN** 浏览器访问 `http://localhost:3100`  
   **THEN** 显示"知语 Zhiyu"欢迎页面，无白屏

2. **GIVEN** 前端已构建  
   **WHEN** 执行 `find frontend/ -name "tailwind.config.js"`  
   **THEN** 无结果（**绝对红线**：不存在此文件）

3. **GIVEN** 前端样式已加载  
   **WHEN** 检查 `index.css` 头部  
   **THEN** 使用 `@import "tailwindcss"` 和 `@theme` 指令

4. **GIVEN** ThemeProvider 已挂载  
   **WHEN** 切换至 Dark 模式  
   **THEN** `<html>` 添加 class="dark"，CSS 变量切换为暗色系

5. **GIVEN** 页面加载完成  
   **WHEN** 检查 `<html>` 元素  
   **THEN** 有 light 或 dark class，localStorage 有 zhiyu-theme 键

6. **GIVEN** 浏览器访问 `/nonexistent`  
   **WHEN** React Router 匹配  
   **THEN** 显示 404 页面，包含"返回首页"链接

7. **GIVEN** CSS 变量已定义  
   **WHEN** 检查 :root 和 .dark 变量  
   **THEN** 包含 --mesh-color-1/2/3、--glass-bg、--glass-blur 等完整变量

8. **GIVEN** 前端构建  
   **WHEN** 执行 `npm run build`（Docker 内）  
   **THEN** 零编译错误，生成 dist/ 目录

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认 frontend 容器 Running
3. `docker compose logs --tail=30 frontend` — 确认 Nginx 启动正常
4. Browser MCP 导航到 `http://localhost:3100`
5. Browser MCP 截图 Light 模式
6. Browser MCP 检查控制台无 Error
7. Browser MCP 导航到 `http://localhost:3100/nonexistent` — 验证 404 页面
8. 确认无 `tailwind.config.js` 文件存在

### 测试通过标准

- [ ] Docker 构建零错误
- [ ] 前端页面正常渲染
- [ ] 无 tailwind.config.js（绝对红线）
- [ ] Light/Dark 模式切换正常
- [ ] CSS 变量完整定义
- [ ] 控制台无 Error
- [ ] 404 页面正常显示

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新全量验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-009-frontend-vite-react-setup.md`

## 自检重点

- [ ] 绝对红线：无 tailwind.config.js
- [ ] 样式：Tailwind CSS v4 + @import + @theme
- [ ] 主题：Light/Dark CSS 变量完整
- [ ] 组件：所有组件有 displayName
- [ ] 响应式：Mobile-First 基础样式
- [ ] 无障碍：HTML lang="zh-CN"

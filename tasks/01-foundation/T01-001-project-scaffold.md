# T01-001: 项目脚手架初始化

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 25+

## 需求摘要

按照 `grules/02-project-structure.md` 定义的完整目录结构标准，创建知语 Zhiyu 平台的项目脚手架骨架。包含前端（Vite + React + TypeScript）和后端（Express + TypeScript）的基础目录、配置文件、占位入口文件。此任务是一切后续任务的基石。

## 相关上下文

- 产品需求: `product/00-product-overview.md` — 技术栈定义
- 设计规范: `grules/02-project-structure.md` — 完整目录结构模板（**核心依据**）
- 编码规范: `grules/05-coding-standards.md` §一 — 命名约定
- 环境配置: `grules/env.md` §2 — 端口映射、容器名
- 关联任务: 无前置 → 后续所有 T01 任务依赖本任务

## 技术方案

### 项目根目录

```
zhiyu/
├── docker-compose.yml          # 占位（T01-002 填充）
├── .env.example                # 环境变量模板
├── .env                        # 真实环境变量（.gitignore）
├── .gitignore                  # Git 忽略规则
├── README.md                   # 项目说明
├── frontend/                   # 前端项目
├── backend/                    # 后端项目
├── supabase/                   # 数据库迁移
│   └── migrations/
└── scripts/                    # 运维脚本
    ├── gen-types.sh
    └── seed-data.sql
```

### 前端目录骨架

```
frontend/
├── Dockerfile                  # 占位（T01-002 填充）
├── nginx.conf                  # 前端生产 Nginx（T01-003 填充）
├── package.json                # 依赖声明
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
├── index.html                  # HTML 入口
└── src/
    ├── main.tsx                # 应用入口
    ├── App.tsx                 # 根组件
    ├── vite-env.d.ts           # Vite 类型声明
    ├── assets/                 # 静态资源
    ├── styles/
    │   ├── index.css           # Tailwind 入口（T01-010 填充）
    │   └── animations.css      # 动效定义（T01-010 填充）
    ├── types/
    │   ├── supabase.ts         # Supabase 类型占位
    │   ├── api.ts              # API 类型占位
    │   └── index.ts            # 统一导出
    ├── lib/
    │   ├── supabase.ts         # Supabase Client 占位（T01-005）
    │   ├── api-client.ts       # API 客户端占位
    │   └── constants.ts        # 全局常量
    ├── hooks/
    │   ├── use-auth.ts         # 认证 Hook 占位
    │   ├── use-toast.ts        # Toast Hook 占位
    │   └── use-theme.ts        # 主题 Hook 占位
    ├── components/
    │   ├── ui/                 # 基础 UI 组件占位
    │   ├── layout/             # 布局组件占位
    │   └── shared/             # 共享组件占位
    ├── features/               # 业务模块占位
    ├── pages/                  # 页面组件占位
    │   └── NotFoundPage.tsx    # 404 页面
    ├── router/
    │   ├── index.tsx           # 路由定义
    │   └── guards.tsx          # 路由守卫占位
    └── providers/              # Provider 占位
        ├── AuthProvider.tsx
        └── ThemeProvider.tsx
```

### 后端目录骨架

```
backend/
├── Dockerfile                  # 占位（T01-002 填充）
├── package.json
├── tsconfig.json
└── src/
    ├── main.ts                 # Express 入口占位（T01-008 填充）
    ├── core/
    │   ├── config.ts           # 配置管理占位（T01-004 填充）
    │   ├── auth.ts             # JWT 认证占位
    │   ├── exceptions.ts       # 异常类占位
    │   ├── response.ts         # 统一响应封装占位
    │   ├── supabase.ts         # Supabase Client 占位（T01-005）
    │   └── middleware.ts       # 中间件占位
    ├── models/
    │   └── common.ts           # 通用模型占位
    ├── routers/
    │   ├── v1/
    │   │   └── index.ts        # v1 路由汇总占位
    │   └── health.ts           # 健康检查占位（T01-008 填充）
    ├── services/               # 服务层占位
    └── repositories/           # 数据访问层占位
```

### 关键配置文件内容

**frontend/package.json**:
```json
{
  "name": "zhiyu-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

**backend/package.json**:
```json
{
  "name": "zhiyu-backend",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "zod": "^3.23.0",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/compression": "^1.7.5",
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "tsx": "^4.19.0"
  }
}
```

**frontend/vite.config.ts**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
```

**frontend/tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**backend/tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**.gitignore**:
```
node_modules/
dist/
.env
*.log
.DS_Store
```

## 范围（做什么）

- 创建完整的项目根目录结构
- 创建前端 Vite + React + TypeScript 项目骨架（含 package.json、tsconfig.json、vite.config.ts）
- 创建后端 Express + TypeScript 项目骨架（含 package.json、tsconfig.json）
- 创建所有子目录（按 `grules/02-project-structure.md` 严格执行）
- 创建占位入口文件（main.tsx、App.tsx、main.ts 等）
- 创建 .gitignore、README.md、.env.example
- 创建 supabase/migrations/ 目录
- 创建 scripts/ 目录和占位脚本

## 边界（不做什么）

- 不写 Docker 配置（T01-002）
- 不写 Nginx 配置（T01-003）
- 不写环境变量管理逻辑（T01-004）
- 不写 Supabase 连接代码（T01-005）
- 不写 Express 中间件和路由逻辑（T01-008）
- 不写 CSS 设计系统样式（T01-010）
- 不安装实际依赖（Docker 环境中安装）

## 涉及文件

- 新建: `zhiyu/` 根目录下所有目录和骨架文件（约 25+ 文件）
- 不动: `/tasks/`、`/grules/`、`/product/` 等规范文件

## 依赖

- 前置: 无
- 后续: T01-002 ~ T01-012 全部依赖本任务

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 项目目录已创建完毕  
   **WHEN** 执行 `find zhiyu/ -type f | wc -l`  
   **THEN** 文件数量 ≥ 25，目录结构与 `grules/02-project-structure.md` 一致

2. **GIVEN** 前端 package.json 存在  
   **WHEN** 检查 `zhiyu/frontend/package.json` 的 dependencies  
   **THEN** 包含 react ^19、react-dom ^19、react-router-dom ^7

3. **GIVEN** 后端 package.json 存在  
   **WHEN** 检查 `zhiyu/backend/package.json` 的 dependencies  
   **THEN** 包含 express ^4.21、zod ^3.23、typescript ^5.6

4. **GIVEN** Vite 配置存在  
   **WHEN** 检查 `zhiyu/frontend/vite.config.ts`  
   **THEN** 包含 `@tailwindcss/vite` 插件和 `@` 路径别名配置

5. **GIVEN** 项目根目录已创建  
   **WHEN** 检查 `.gitignore` 文件  
   **THEN** 包含 node_modules/、dist/、.env 忽略规则

6. **GIVEN** 所有 TypeScript 配置文件存在  
   **WHEN** 检查 `strict` 选项  
   **THEN** 前后端 tsconfig.json 均为 `"strict": true`

7. **GIVEN** 目录结构已就绪  
   **WHEN** 检查关键目录是否存在  
   **THEN** `frontend/src/components/ui/`、`frontend/src/features/`、`backend/src/core/`、`backend/src/routers/v1/`、`supabase/migrations/` 全部存在

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. 本任务为纯文件创建任务，暂无 Docker 构建（T01-002 才有 Dockerfile）
2. 验证方式：遍历目录结构，逐一检查文件存在性和内容正确性
3. 后续 T01-002 完成后回归验证：`docker compose up -d --build` 可基于此骨架正常构建

### 测试通过标准

- [ ] 所有目录按规范创建
- [ ] package.json 依赖版本符合 `grules/01-rules.md` 技术栈声明
- [ ] tsconfig.json 配置 strict: true
- [ ] vite.config.ts 无 tailwind.config.js 出现
- [ ] .env.example 包含所有必要变量键（值为空）
- [ ] 占位文件可被后续任务正确导入

### 测试不通过处理

- 发现问题 → 立即修复 → 重新验证目录结构
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/01-foundation/` 下创建同名结果文件

结果文件路径: `/tasks/result/01-foundation/T01-001-project-scaffold.md`

## 自检重点

- [ ] 命名约定：目录 kebab-case、组件 PascalCase、Hook kebab-case
- [ ] 无 tailwind.config.js 存在
- [ ] tsconfig.json 路径别名 `@/*` 配置正确
- [ ] 前后端分离清晰，无交叉引用
- [ ] .env 在 .gitignore 中，.env.example 可提交

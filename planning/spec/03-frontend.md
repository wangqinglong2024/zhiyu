# 03 · 前端架构（Frontend Architecture）

## 一、Monorepo 结构

```
zhiyu/
├── apps/
│   ├── app/              # 应用端 PWA (用户)
│   ├── admin/            # 管理后台
│   ├── web/              # 营销站点 (v1.5 SSG)
│   ├── api/              # 后端 API
│   └── worker/           # 后台 Worker / 工厂
├── packages/
│   ├── ui/               # 共享 UI 组件 + Tokens + Storybook
│   ├── sdk/              # API 客户端 (生成自 OpenAPI/tRPC)
│   ├── i18n/             # 共享翻译资源
│   ├── games/            # 12 个游戏插件 (PixiJS)
│   ├── game-engine/      # 游戏引擎共享层
│   ├── pinyin/           # 拼音库封装
│   ├── analytics/        # 埋点 SDK 封装
│   ├── config/           # 共享 ESLint/TS/Tailwind 配置
│   └── types/            # 共享类型定义
├── tools/                # 脚本（migrate / seed / build）
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 二、apps/app（应用端 PWA）

### 2.1 目录
```
apps/app/
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── sw.ts            # Workbox SW
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── routes/
│   │   ├── _layout.tsx
│   │   ├── discover/
│   │   ├── courses/
│   │   ├── games/
│   │   ├── novels/
│   │   ├── profile/
│   │   ├── auth/
│   │   └── _error.tsx
│   ├── features/        # 业务领域模块
│   │   ├── discover/
│   │   ├── courses/
│   │   ├── games/
│   │   ├── learning-engine/
│   │   ├── novels/
│   │   ├── profile/
│   │   ├── coins/
│   │   ├── referral/
│   │   ├── payments/
│   │   ├── customer-service/
│   │   └── auth/
│   ├── components/      # 应用专属组件
│   ├── hooks/
│   ├── lib/
│   ├── stores/          # Zustand
│   ├── styles/
│   └── env.ts
├── tests/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### 2.2 路由
- TanStack Router 文件路由
- 守卫 beforeLoad（认证 / 付费 / 国家）
- 懒加载 + Suspense

### 2.3 数据层
- TanStack Query 全局
- Cache time / Stale time 按资源
- Mutations + Optimistic Update
- Infinite Query 列表

### 2.4 状态
- Zustand 全局（用户 / 主题 / 学习偏好）
- TanStack Query 服务端状态
- React Context 仅必要（Theme / I18n）

### 2.5 PWA
- vite-plugin-pwa
- Workbox precache + runtime cache
- 离线 Shell + 内容
- App Update 检测 + Toast 提示

### 2.6 错误边界
- 全局 ErrorBoundary
- 路由级 ErrorBoundary
- Sentry 上报

### 2.7 性能
- 路由级 lazy
- Image lazy
- 字体 preload
- HMR + React Refresh

## 三、apps/admin（后台）

### 3.1 目录
类似 app，关键差异：
```
apps/admin/
├── src/
│   ├── routes/
│   │   ├── _layout.tsx (Sidebar + TopBar)
│   │   ├── dashboard/
│   │   ├── content/
│   │   │   ├── articles/
│   │   │   ├── courses/
│   │   │   ├── novels/
│   │   │   └── games/
│   │   ├── factory/
│   │   ├── review/
│   │   ├── users/
│   │   ├── orders/
│   │   ├── coins/
│   │   ├── referrals/
│   │   ├── support/
│   │   ├── flags/
│   │   ├── audit/
│   │   └── settings/
│   ├── features/
│   ├── components/
│   └── ...
```

### 3.2 关键差异
- 无 PWA
- 表格密集（TanStack Table + virtualizer）
- 表单密集（RHF + Zod）
- 富文本编辑（Tiptap）
- Permission 守卫（RBAC）
- 审计 hook 自动记录

## 四、packages/ui

### 4.1 结构
```
packages/ui/
├── src/
│   ├── components/        # Button, Input, Card, ...
│   ├── icons/             # 自定义 SVG
│   ├── illustrations/     # 插画
│   ├── styles/
│   │   ├── theme.css      # CSS 变量
│   │   ├── glass.css
│   │   └── animations.css
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── motion.ts
│   ├── hooks/
│   ├── utils/
│   └── index.ts
├── tailwind-preset.ts     # 共享 Tailwind 配置
├── stories/               # Storybook
├── tests/
└── package.json
```

### 4.2 导出
```ts
import { Button, Card, Modal } from '@zhiyu/ui';
import { tokens } from '@zhiyu/ui/tokens';
import preset from '@zhiyu/ui/tailwind-preset';
```

### 4.3 Storybook
- 每组件 .stories.tsx
- Interaction Tests
- Chromatic 视觉回归
- 部署到 storybook.zhiyu.io

## 五、packages/games

### 5.1 结构
```
packages/games/
├── src/
│   ├── pinyin-shooter/
│   │   ├── index.ts
│   │   ├── scenes/
│   │   ├── entities/
│   │   ├── assets/
│   │   └── manifest.ts
│   ├── hanzi-ninja/
│   ├── tone-bubbles/
│   ├── hanzi-tetris/
│   ├── whack-hanzi/
│   ├── hanzi-match3/
│   ├── hanzi-snake/
│   ├── hanzi-rhythm/
│   ├── hanzi-runner/
│   ├── pinyin-defense/
│   ├── memory-match/
│   └── hanzi-slingshot/
└── package.json
```

每游戏导出统一接口（详见 11-game-engine.md）。

## 六、packages/sdk

### 6.1 来源
- 后端 OpenAPI/tRPC schema 生成
- TypeScript fully typed

### 6.2 用法
```ts
import { createClient } from '@zhiyu/sdk';

const client = createClient({
  baseURL: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('token'),
});

const articles = await client.discover.articles.list({ category: 'history' });
```

### 6.3 拦截器
- 请求：附加 token / locale / 设备 / 版本
- 响应：刷新 token / 错误标准化
- 重试：指数退避

## 七、packages/i18n

### 7.1 结构
```
packages/i18n/
├── locales/
│   ├── en/
│   ├── vi/
│   ├── th/
│   └── id/
├── src/
│   ├── index.ts        # 配置 + provider
│   └── types.ts        # 类型化 keys
└── package.json
```

### 7.2 自动类型
- 基于 en 翻译生成 TS 类型
- t('key') 类型安全

## 八、共享配置

### 8.1 packages/config
```
packages/config/
├── eslint/
│   ├── base.js
│   ├── react.js
│   └── node.js
├── prettier/
│   └── index.js
├── tsconfig/
│   ├── base.json
│   ├── react.json
│   └── node.json
└── tailwind/
    └── preset.ts
```

### 8.2 各 app 引用
```json
{
  "extends": "@zhiyu/config/tsconfig/react.json"
}
```

## 九、构建与发布

### 9.1 Turborepo
- 缓存 build / test / lint
- 按依赖图执行
- 并行加速

### 9.2 命令
```
pnpm dev          # 全 dev
pnpm dev:app      # 只跑 app
pnpm build        # 全 build
pnpm test         # 全 test
pnpm lint         # 全 lint
pnpm typecheck    # 全 ts
```

### 9.3 输出
- apps/app/dist → Cloudflare Pages
- apps/admin/dist → Cloudflare Pages (子域)
- apps/api → Render Docker
- apps/worker → Render Docker

## 十、状态管理细则

### 10.1 用户状态
```ts
// stores/user.ts
const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  logout: () => { set({ user: null }); router.navigate('/auth/login'); }
}));
```

### 10.2 Theme 状态
```ts
const useThemeStore = create((set) => ({
  mode: 'system',
  setMode: (m) => { applyTheme(m); set({ mode: m }); }
}));
```

### 10.3 学习引擎状态
- 当前学习节
- 进度
- 步骤间状态（答题 / 跟读评分）
- 完成后清空

## 十一、API 集成

### 11.1 统一封装
```ts
// lib/api.ts
import { createClient } from '@zhiyu/sdk';
import { useUserStore } from '@/stores/user';

export const api = createClient({
  baseURL: import.meta.env.VITE_API_URL,
  getToken: () => useUserStore.getState().token,
  onUnauthorized: () => useUserStore.getState().logout(),
});
```

### 11.2 React Query 配置
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    }
  }
});
```

## 十二、表单

### 12.1 通用模式
```tsx
const form = useForm<FormSchema>({
  resolver: zodResolver(schema),
});
const { mutate, isPending } = useMutation({...});
const onSubmit = form.handleSubmit((data) => mutate(data));
```

### 12.2 共享 schema
- packages/sdk/schemas/*.ts
- 前后端共享 Zod 校验

## 十三、可观测

### 13.1 Sentry
```ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [browserTracingIntegration(), replayIntegration()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
});
```

### 13.2 PostHog
```ts
posthog.init(VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
  capture_pageview: true,
});
```

### 13.3 Web Vitals
```ts
import { onCLS, onINP, onLCP } from 'web-vitals';
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
```

## 十四、Service Worker

### 14.1 策略
| 资源 | 策略 |
|---|---|
| HTML | network-first, fallback offline.html |
| Assets (JS/CSS) | cache-first, hash invalidation |
| Images | cache-first, max 200 entries |
| Audio | cache-first |
| API GET | stale-while-revalidate |
| API POST | network-only |

### 14.2 更新
- 检测新 SW → 提示用户刷新
- skipWaiting + clientsClaim

## 十五、错误处理

### 15.1 网络错误
- toast.error
- 离线检测
- 重试按钮

### 15.2 业务错误
- 表单字段错误
- toast 通用
- 跳转登录（401）/ 升级（402）

### 15.3 渲染错误
- ErrorBoundary
- ErrorFallback 组件
- Sentry 上报

## 十六、检查清单

- [ ] Monorepo 全部包独立 build
- [ ] packages/ui Storybook 上线
- [ ] PWA Lighthouse 90+
- [ ] 路由级 lazy
- [ ] 全部 i18n 4 语
- [ ] Sentry / PostHog 集成
- [ ] Web Vitals 全绿
- [ ] 12 游戏插件可独立加载

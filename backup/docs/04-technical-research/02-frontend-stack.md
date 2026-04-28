# 4.2 · 前端技术栈

## 一、技术选型

### 1.1 核心选型表

| 层 | 选型 | 理由 |
|---|---|---|
| 构建工具 | Vite 5 | 快、HMR 强、TS 原生 |
| 框架 | React 18 + TS 5.4 | 生态成熟、grules 已规定 |
| 路由 | React Router 6 (Data Mode) | SSR-ready, loaders/actions |
| 状态 | Zustand | 轻量；React Query 处理 server state |
| 服务端状态 | TanStack Query v5 | 自动缓存 / 重试 / 乐观更新 |
| 表单 | react-hook-form + zod | 性能 + 类型安全 |
| UI 组件 | shadcn/ui + Radix UI primitives | 可定制、无锁定 |
| 样式 | Tailwind CSS v4 | grules 已定，搭配 Cosmic Refraction 设计系统 |
| 图标 | lucide-react | 一致 + 树摇 |
| 国际化 | i18next + react-i18next | 4 语种 v1 |
| 动画 | Framer Motion | 留存友好的微动画 |
| 图表 | Recharts（管理后台） | React 原生 |
| 富文本 | TipTap（管理后台编辑器） | shadcn 友好 |
| 音频 | Howler.js | 跨浏览器一致 |
| 游戏 | PixiJS（Canvas / WebGL） | 性能 + 体积 |
| 测试 | Vitest + Playwright | 单元 + e2e |

### 1.2 PWA 配置
- Workbox 7 自动生成 Service Worker
- 离线策略：
  - 学习卡 / 已下载知识点：CacheFirst
  - 内容 API：StaleWhileRevalidate
  - 静态资产：CacheFirst + 自动更新
- Web Push：用于 D1/D3/D7 留存钩子
- "Add to Home Screen" 提示

## 二、应用结构

### 2.1 应用端（Web App）路由

```
/                       首页（每日金句 + 温故知新）
/discover               发现中国（12 类目网格）
/discover/[cat]/[slug]  文章详情（句子列表 + TTS）
/courses                系统课程（4 轨道选择）
/courses/[track]        轨道详情（12 阶段）
/courses/[track]/[stage] 阶段详情（12 章）
/courses/[track]/[stage]/[chapter]/[lesson] 节学习
/games                  游戏中心（12 款）
/games/[id]             具体游戏（强制横屏）
/novels                 小说专区（12 类目）
/novels/[cat]/[slug]    小说详情 / 章节
/me                     个人中心
/me/coins               知语币
/me/referral            分享 / 分销
/me/settings            设置（语言/拼音/朗读）
/me/im                  客服 IM
/auth/login             登录
/auth/signup            注册
/checkout/[plan]        Paddle Checkout
/legal/privacy          隐私政策
/legal/tos              用户协议
```

### 2.2 管理后台（Admin）路由

```
/admin                  仪表盘
/admin/content/discover 发现中国管理
/admin/content/courses  课程管理
/admin/content/novels   小说管理
/admin/content/games    游戏配置
/admin/users            用户管理
/admin/orders           订单 / 订阅
/admin/coins            知语币流水
/admin/referrals        分销关系
/admin/im               IM 工作台
/admin/audits           内容审校工作台
/admin/analytics        业务分析
/admin/settings         系统设置
```

### 2.3 通用页面元素
- 顶部 Header：Logo + Tabs（4 模块）+ 知语币 + 头像
- 底部 Tab Bar（移动端）：发现 / 课程 / 游戏 / 我的
- 全局 Toast / Modal / Drawer

## 三、响应式 / 视觉

### 3.1 响应式断点（Tailwind v4）
- sm: 640px（手机横屏 / 小平板）
- md: 768px（平板）
- lg: 1024px（小桌面）
- xl: 1280px
- 2xl: 1536px

### 3.2 主要布局
- 应用端：Mobile-first，桌面适配
- 管理后台：Desktop-first，平板可用
- 游戏：强制横屏（lock orientation API + UI 兜底）

### 3.3 设计系统对接
- 来自 grules: Cosmic Refraction
- Primary: #e11d48 (Rose)
- Secondary: #0284c7 (Sky)
- Tertiary: #d97706 (Amber)
- 禁止紫色任何色阶

### 3.4 暗色模式
- v1 支持（CSS variable + Tailwind dark:）
- 用户中心可切换 / 跟系统

## 四、国际化（i18n）

### 4.1 语种
- v1：英 (en) / 越 (vi) / 泰 (th) / 印尼 (id)
- v2 扩展：菲 (tl) / 马 (ms) / 中 (zh)（不重要，仅供参考）

### 4.2 翻译流水线
- 静态文案：i18next JSON（开发时人工 + AI 校对）
- 动态内容（课程/文章）：数据库字段中包含多语字段
- 用户反馈翻译：管理后台一键修复

### 4.3 设置同步
- 用户设置 UI 语言后：所有 UI + 内容讲解切换
- 中文教学内容（中文本身）不变，仅讲解部分变

## 五、性能优化

### 5.1 加载性能目标
- LCP < 2.5s（东南亚移动网络）
- FID < 100ms
- CLS < 0.1
- TTI < 4s

### 5.2 优化手段
- 路由级 code splitting（React.lazy + Suspense）
- 图片：WebP / AVIF + lazy loading
- 字体：subset（只含 4 语种 + 中文常用字）
- Critical CSS inline
- Tailwind purge 严格模式
- React Compiler（v19 后启用）

### 5.3 数据加载策略
- 列表用 React Query infinite + 虚拟滚动（对长列表）
- 预加载下一节内容
- 离线缓存当前学习章节

## 六、PWA 详细策略

### 6.1 Service Worker 缓存策略

```
caches:
  static-v1:        index.html, JS, CSS, 字体, 图标
  api-articles-v1:  发现中国短文（StaleWhileRevalidate）
  audio-v1:         TTS 音频（CacheFirst, 30 天）
  user-progress-v1: 离线进度（本地优先，上线时同步）
```

### 6.2 离线学习能力
- 已下载文章可离线阅读（含音频）
- 已下载课程节可离线学习与做题
- 答题结果暂存 IndexedDB → 上线同步

### 6.3 Web Push
- 使用 Supabase Edge Function 发送
- 后端管理订阅 endpoint
- 内容：D1 学习提醒 / D3 进度报告 / D7 召回

## 七、客服 IM（前端）

### 7.1 技术
- 不用第三方（Crisp / Intercom 太贵）
- 自建：Supabase Realtime（Postgres Changes 订阅）

### 7.2 功能
- 用户端：单聊 + 文件上传 + emoji
- 管理端：多用户工作台 + 标签 / 分配 + 一键复制对话
- v2：AI FAQ 助理（基于 RAG）

## 八、错误处理 / 用户感知

### 8.1 错误边界
- React Error Boundary
- 全局未捕获 Promise 处理
- 网络错误友好提示（4 语种）

### 8.2 加载状态
- Skeleton Screen（不要 Spinner）
- 渐进式加载（先骨架，后内容）

### 8.3 空状态
- 每个空列表都有插画 + 引导文案
- 无网络：明确提示 + "重试"按钮

## 九、技术风险与缓解

| 风险 | 缓解 |
|---|---|
| Tailwind v4 仍较新 | 启用前测试核心组件 |
| React Compiler 未稳定 | v19 后启用，先关 |
| 多语种字体加载慢 | font-display: swap + subset |
| PixiJS 体积大 | 仅游戏页加载，其他路由不引入 |
| iOS Safari PWA 限制 | 兜底"打开在浏览器"提示 |

进入 [`03-backend-supabase.md`](./03-backend-supabase.md)。

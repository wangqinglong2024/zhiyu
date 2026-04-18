# T03-007: 前端 — 类目首页

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10

## 需求摘要

实现「发现中国」Tab 1 的类目首页，是用户打开 App 的第一个页面。包含：每日金句毛玻璃卡片（含分享按钮）、12 大类目卡片网格（2 列布局）、未登录用户 04-12 类目遮罩 + "登录解锁"标签、登录后遮罩消除自动跳转。需覆盖 7 种页面状态（空/加载/首次加载/成功/错误/部分加载/离线），遵循 Cosmic Refraction 毛玻璃设计系统。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/01-category-homepage.md` — 类目首页完整 PRD
- 产品需求: `product/apps/02-discover-china/00-index.md` §1.2 — 用户访问规则
- 设计规范: `grules/06-ui-design.md` — UI/UX 设计规范（Cosmic Refraction 设计系统）
- 设计规范: `grules/01-rules.md` §一 — 毛玻璃 CSS 基线参数
- API 依赖: T03-004（GET /api/v1/categories）, T03-005（GET /api/v1/daily-quotes/today）

## 技术方案

### 页面结构

```
DiscoverChinaPage/
├── DailyQuoteCard          -- 每日金句毛玻璃卡片
│   ├── QuoteContent        -- 金句文本（多语言配置驱动）
│   └── ShareButton         -- 分享按钮（→ T03-010 分享系统）
├── CategoryGrid            -- 12 类目卡片网格
│   ├── CategoryCard        -- 单个类目卡片（已解锁）
│   └── LockedCategoryCard  -- 未登录遮罩卡片
├── PageStates              -- 7 种页面状态
│   ├── LoadingSkeleton     -- 骨架屏
│   ├── ErrorState          -- 错误+重试
│   ├── EmptyState          -- 空状态
│   └── OfflineBanner       -- 离线提示
└── hooks/
    ├── use-categories.ts   -- 类目数据查询 Hook
    └── use-daily-quote.ts  -- 金句数据查询 Hook
```

### 前端架构

```
frontend/src/
├── features/discover-china/
│   ├── pages/
│   │   └── DiscoverChinaPage.tsx       -- 类目首页
│   ├── components/
│   │   ├── DailyQuoteCard.tsx          -- 每日金句卡片
│   │   ├── CategoryGrid.tsx            -- 类目网格容器
│   │   ├── CategoryCard.tsx            -- 单类目卡片
│   │   ├── LockedCategoryCard.tsx      -- 遮罩类目卡片
│   │   └── CategorySkeleton.tsx        -- 骨架屏
│   ├── hooks/
│   │   ├── use-categories.ts           -- 类目数据
│   │   └── use-daily-quote.ts          -- 金句数据
│   └── types/
│       └── discover-china.types.ts     -- 类型定义
```

### 每日金句卡片

- 毛玻璃材质：`.glass-card`（`backdrop-filter: blur(24px) saturate(1.8)`，圆角 24px）
- 金句文本按用户多语言配置动态渲染（5 种配置组合，详见 PRD §2.2）
- 分享按钮：Lucide `Share2` 图标，始终可点击（触发 T03-010 分享流程）
- 「✨ 每日金句」标签：Overline 字体（11px，Amber 色），跟随 UI 语言

### 类目卡片网格

- 响应式列数：手机 2 列（xs/sm）、平板 3 列（md/lg）、桌面 4 列（xl+）
- 卡片间距 16px，水平外边距 16px
- 每张卡片：`.glass-card`（圆角 24px）
  - 插图区：4:3 比例，`object-fit: cover`
  - 中文名称：H3 20px Manrope 600
  - 解释语言名称：Caption 12px，UI 语言=汉语时隐藏
  - 文章数量角标：Amber 色 FileText 图标 + 数字
- 点击动效：`scale(0.97)` + 100ms → Push 转场进入文章列表

### 未登录遮罩

- 04-12 类目叠加半透明遮罩（`rgba(0, 0, 0, 0.5)`）
- 插图和文字 opacity 0.4
- 居中浮动「登录解锁」标签：`.glass-elevated` + `rounded-full`
  - Lucide `Lock` 图标 16px + 文字
  - 多语言：汉语="登录解锁" / 英语="Sign in to unlock" / 越南语="Đăng nhập để mở khóa"
- 点击遮罩卡片 → 弹出登录弹窗 → 登录成功 → 遮罩消除 → 自动跳转该类目文章列表

### 7 种页面状态

| 状态 | 实现 |
|------|------|
| Empty | 品牌插画 + "内容正在准备中" + `.glass-decor` 浮动方块 |
| Loading | 金句骨架屏(180px) + 12 个卡片骨架屏(2列) |
| First Load | 全屏骨架屏 + 品牌 Logo 呼吸动画(opacity 0.4-1.0) |
| Success | 金句 + 类目 Stagger 渐入动画(每项 50ms 延迟) |
| Error | 错误插画 + "网络不给力" + Rose 色重试按钮 |
| Partial | 成功部分正常展示，失败部分独立错误提示+重试 |
| Offline | 顶部 Amber 色 Banner + 缓存数据展示 |

### 缓存策略

- 类目数据：本地存储缓存，1 小时刷新一次
- 当日金句：本地存储缓存，24 小时后过期
- 离线时展示缓存数据，标记离线状态

## 范围（做什么）

- 创建 `DiscoverChinaPage.tsx` 页面组件
- 创建 `DailyQuoteCard.tsx` 每日金句卡片（多语言配置驱动）
- 创建 `CategoryGrid.tsx` + `CategoryCard.tsx` + `LockedCategoryCard.tsx`
- 创建 `CategorySkeleton.tsx` 骨架屏
- 创建 `use-categories.ts` + `use-daily-quote.ts` 数据 Hook
- 创建类型定义文件
- 实现 7 种页面状态
- 实现未登录遮罩 + 登录弹窗联动
- 注册路由（Tab 1）

## 边界（不做什么）

- 不实现金句分享图片生成（T03-010）
- 不实现文章列表页（T03-008）
- 不实现下拉刷新（P2 延后）
- 不实现节日装饰元素（P2 延后）
- 不写登录弹窗组件（全局框架 T02 提供）

## 涉及文件

- 新建: `frontend/src/features/discover-china/pages/DiscoverChinaPage.tsx`
- 新建: `frontend/src/features/discover-china/components/DailyQuoteCard.tsx`
- 新建: `frontend/src/features/discover-china/components/CategoryGrid.tsx`
- 新建: `frontend/src/features/discover-china/components/CategoryCard.tsx`
- 新建: `frontend/src/features/discover-china/components/LockedCategoryCard.tsx`
- 新建: `frontend/src/features/discover-china/components/CategorySkeleton.tsx`
- 新建: `frontend/src/features/discover-china/hooks/use-categories.ts`
- 新建: `frontend/src/features/discover-china/hooks/use-daily-quote.ts`
- 新建: `frontend/src/features/discover-china/types/discover-china.types.ts`
- 修改: `frontend/src/router/index.tsx` — 注册路由

## 依赖

- 前置: T03-004（类目 API）, T03-005（金句 API）
- 后续: T03-008（文章列表页，类目卡片点击跳转目标）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 12 类目数据和当日金句数据已就绪  
   **WHEN** 访问发现中国首页  
   **THEN** 页面正确渲染：金句卡片（毛玻璃样式）+ 12 类目卡片网格（2 列），Stagger 渐入动画

2. **GIVEN** 用户未登录  
   **WHEN** 查看类目网格  
   **THEN** 01-03 类目正常显示，04-12 类目有半透明遮罩 + "登录解锁"标签

3. **GIVEN** 用户未登录  
   **WHEN** 点击 04-12 中任一遮罩类目卡片  
   **THEN** 弹出登录弹窗（Bottom Sheet），标题为「登录即可解锁全部 12 类目」

4. **GIVEN** 用户在遮罩卡片触发的登录弹窗中完成登录  
   **WHEN** 登录成功  
   **THEN** 弹窗关闭 → 全部 12 类目遮罩消除 → 自动跳转到刚才点击的类目文章列表

5. **GIVEN** 用户已登录  
   **WHEN** 查看类目网格  
   **THEN** 全部 12 类目正常显示，无遮罩

6. **GIVEN** 金句数据加载失败但类目加载成功  
   **WHEN** 查看页面  
   **THEN** 金句区域显示骨架屏，类目网格正常显示（部分加载状态）

7. **GIVEN** 页面首次加载  
   **WHEN** 数据请求中  
   **THEN** 显示骨架屏（金句卡片形状 + 12 个卡片形状，保持 2 列布局）

8. **GIVEN** 页面数据加载完成  
   **WHEN** 切换 UI 语言为英语  
   **THEN** 页面标题 "Discover China"、金句标签 "Daily Quote"、类目英文名称正确显示

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. `docker compose logs --tail=30 backend` — 后端无报错
5. 通过 Browser MCP（Puppeteer）访问发现中国首页
6. 截图验证：金句卡片 + 12 类目网格渲染正确
7. 未登录状态截图：验证 04-12 遮罩效果
8. 切换 Light/Dark 模式截图对比
9. 响应式测试：375px / 768px / 1280px 三个断点截图

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 前端页面正常渲染（Light + Dark 模式）
- [ ] 每日金句卡片毛玻璃效果正确（blur(24px) saturate(1.8)）
- [ ] 12 类目卡片网格布局正确（2 列手机端）
- [ ] 未登录遮罩效果正确（04-12 半透明 + "登录解锁"标签）
- [ ] 7 种页面状态全部覆盖
- [ ] UI 符合 Cosmic Refraction 设计系统（色彩仅 Rose/Sky/Amber，无紫色）
- [ ] 响应式测试通过（375px / 768px / 1280px）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-007-fe-category-homepage.md`

## 自检重点

- [ ] UI 设计规范：毛玻璃参数（blur 24px / saturate 1.8）
- [ ] UI 设计规范：色彩仅 Rose/Sky/Amber + 中性色，严禁紫色
- [ ] UI 设计规范：Tailwind CSS v4（@import "tailwindcss"），无 tailwind.config.js
- [ ] 响应式：375px / 768px / 1280px 三断点
- [ ] Light/Dark 双模式
- [ ] 无障碍：最小触控尺寸 44×44pt，色彩对比度 WCAG 2.1 AA
- [ ] 多语言：页面标题、金句标签、类目名称、遮罩标签跟随 UI 语言
- [ ] 性能：类目图片预加载（优化 LCP），Stagger 动画流畅

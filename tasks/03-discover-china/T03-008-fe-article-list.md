# T03-008: 前端 — 文章列表页

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 7

## 需求摘要

实现类目下的文章列表页，从类目首页点击类目卡片进入。包含：顶部导航栏（返回 + 类目名 + 排序切换）、类目封面大图 + 简介、文章卡片流（横向布局：缩略图 + 标题 + 元信息 + 收藏图标）、排序切换（最新/最热）、触底加载更多（无限滚动，每页 10 篇）、7 种页面状态。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/02-article-list.md` — 文章列表页完整 PRD
- 产品需求: `product/apps/02-discover-china/06-data-nonfunctional.md` §2.2 — 图片懒加载策略
- 设计规范: `grules/06-ui-design.md` — UI/UX 设计规范
- API 依赖: T03-004（GET /api/v1/categories/:id/articles）
- API 依赖: T03-006（POST /api/v1/favorites/check — 批量查询收藏状态）

## 技术方案

### 页面结构

```
ArticleListPage/
├── StickyNavBar              -- 吸顶导航栏（毛玻璃）
│   ├── BackButton            -- 返回按钮
│   ├── CategoryTitle         -- 类目名称
│   └── SortToggle            -- 排序切换按钮 + Popover
├── CategoryCover             -- 类目封面大图 + 简介
├── ArticleCardList           -- 文章卡片列表
│   ├── ArticleCard           -- 单篇文章卡片
│   │   ├── Thumbnail         -- 封面缩略图
│   │   ├── ArticleInfo       -- 标题 + 元信息
│   │   └── FavoriteIcon      -- 收藏心形图标
│   └── LoadMoreIndicator     -- 加载更多指示器
└── PageStates                -- 7 种页面状态
```

### 前端架构

```
frontend/src/features/discover-china/
├── pages/
│   └── ArticleListPage.tsx          -- 文章列表页
├── components/
│   ├── ArticleCard.tsx              -- 文章卡片（横向布局）
│   ├── SortToggle.tsx               -- 排序切换（Popover）
│   ├── CategoryCover.tsx            -- 类目封面区
│   ├── LoadMoreIndicator.tsx        -- 加载更多动画
│   └── ArticleListSkeleton.tsx      -- 文章列表骨架屏
├── hooks/
│   └── use-article-list.ts          -- 文章列表数据（含分页、排序）
```

### 吸顶导航栏

- 高度 56px，`.glass-elevated` 毛玻璃背景
- 返回按钮：Lucide `ChevronLeft` 24px，点击 Pop 转场返回
- 类目名称居中：H3 20px Manrope 600，跟随 UI 语言
- 排序切换：Lucide `ArrowUpDown` + 当前排序文字，点击弹出 Popover
  - Popover 毛玻璃材质，两个选项（最新/最热），选中项左侧 Rose 色 Check 图标

### 文章卡片

- `.glass-card` 毛玻璃卡片，圆角 24px，padding 12px
- 横向布局：左侧缩略图（100×75px，4:3，圆角 12px）+ 右侧文字
- 中文标题：H3 20px，最多 2 行截断
- 解释语言标题：Body S 14px，1 行截断；UI 语言=汉语时隐藏
- 元信息行：发布时间 + 浏览量（Eye 图标 + 数字，≥1000 显示 1.2k）
- 收藏图标：Lucide `Heart` 20px，右下角，点击热区 ≥ 44×44pt
  - 未收藏=空心，已收藏=实心 Rose 色
  - 未登录点击 → 触发登录弹窗 → 登录后自动收藏
  - 已登录点击 → 弹跳动画 + 乐观 UI + Toast

### 无限滚动

- 每页 10 篇文章
- 距底部 200px 触发加载
- 加载指示器：3 个 Rose 色圆点依次跳动，高度 48px
- 无更多数据："已经到底啦~" 提示

### 排序切换

- 切换后：列表区域显示骨架屏 → 请求新排序第一页 → Stagger 动画渲染
- 切换失败：恢复上次排序，Toast 错误提示

### 缩略图懒加载

- IntersectionObserver，进入可视区域前 200px 开始加载
- 未加载完成：灰色占位（保持 4:3 布局稳定）
- 优先 WebP 格式

## 范围（做什么）

- 创建 `ArticleListPage.tsx` 页面
- 创建 `ArticleCard.tsx` 文章卡片组件
- 创建 `SortToggle.tsx` 排序切换组件
- 创建 `CategoryCover.tsx` 类目封面区
- 创建 `LoadMoreIndicator.tsx` 加载指示器
- 创建 `ArticleListSkeleton.tsx` 骨架屏
- 创建 `use-article-list.ts` 数据 Hook（含分页、排序、缓存）
- 实现无限滚动加载
- 实现 7 种页面状态
- 注册路由

## 边界（不做什么）

- 不实现文章详情页（T03-009）
- 不实现下拉刷新（P2 延后）
- 不实现收藏按钮完整动画（T03-011 负责心形弹跳动画封装）
- 不实现搜索功能

## 涉及文件

- 新建: `frontend/src/features/discover-china/pages/ArticleListPage.tsx`
- 新建: `frontend/src/features/discover-china/components/ArticleCard.tsx`
- 新建: `frontend/src/features/discover-china/components/SortToggle.tsx`
- 新建: `frontend/src/features/discover-china/components/CategoryCover.tsx`
- 新建: `frontend/src/features/discover-china/components/LoadMoreIndicator.tsx`
- 新建: `frontend/src/features/discover-china/components/ArticleListSkeleton.tsx`
- 新建: `frontend/src/features/discover-china/hooks/use-article-list.ts`
- 修改: `frontend/src/router/index.tsx` — 注册路由

## 依赖

- 前置: T03-004（文章列表 API）、T03-006（收藏状态查询 API，文章卡片需显示收藏状态）
- 后续: T03-009（文章详情，卡片点击跳转目标）、T03-011（FavoriteButton 集成到 ArticleCard）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 类目下有 15 篇已发布文章  
   **WHEN** 从类目首页点击进入文章列表  
   **THEN** 显示类目封面 + 简介 + 前 10 篇文章卡片（横向布局，缩略图 + 标题 + 元信息）

2. **GIVEN** 文章列表已显示 10 篇  
   **WHEN** 向下滚动至距底部 200px  
   **THEN** 自动加载第 2 页（加载指示器 → 追加 5 篇 → 显示"已经到底啦~"）

3. **GIVEN** 当前排序为"最新"  
   **WHEN** 点击排序按钮选择"最热"  
   **THEN** 列表显示骨架屏 → 按浏览量倒序重新渲染 → Stagger 动画

4. **GIVEN** 用户已登录且已收藏某文章  
   **WHEN** 查看文章列表  
   **THEN** 该文章卡片的心形图标为实心 Rose 色

5. **GIVEN** 用户未登录  
   **WHEN** 点击文章卡片的收藏图标  
   **THEN** 触发登录弹窗 → 登录成功后自动收藏该文章

6. **GIVEN** 文章列表页  
   **WHEN** 点击文章卡片（非收藏图标区域）  
   **THEN** 卡片 scale(0.97) → Push 转场进入文章详情页

7. **GIVEN** 页面加载中  
   **WHEN** 查看页面  
   **THEN** 显示封面区骨架 + 文章卡片骨架（保持横向布局占位）

8. **GIVEN** 响应式测试  
   **WHEN** 分别以 375px / 768px / 1280px 宽度查看  
   **THEN** 布局自适应，文章卡片在各断点下正常显示

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. 通过 Browser MCP（Puppeteer）从类目首页点击进入文章列表
5. 截图验证：封面区 + 文章卡片列表渲染正确
6. 滚动到底部验证无限加载
7. 切换排序验证列表刷新
8. 切换 Light/Dark 模式截图对比
9. 响应式测试：375px / 768px / 1280px

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 前端页面正常渲染（Light + Dark 模式）
- [ ] 无限滚动加载正确（10 篇/页，触底追加）
- [ ] 排序切换功能正确
- [ ] 文章卡片布局正确（缩略图 + 标题 + 元信息）
- [ ] 收藏图标状态正确（已收藏/未收藏）
- [ ] UI 符合 Cosmic Refraction 设计系统
- [ ] 响应式测试通过（375px / 768px / 1280px）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-008-fe-article-list.md`

## 自检重点

- [ ] UI 设计规范：吸顶导航栏 `.glass-elevated` 毛玻璃
- [ ] UI 设计规范：色彩仅 Rose/Sky/Amber，无紫色
- [ ] 性能：缩略图懒加载（IntersectionObserver），避免首屏加载 15+ 张图
- [ ] 性能：返回列表时使用内存缓存（避免重新请求）
- [ ] 无障碍：最小触控 44×44pt、色彩对比度
- [ ] 多语言：类目名称、排序选项、提示文案跟随 UI 语言

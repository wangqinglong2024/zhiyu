# T12-005: 前端 — 文章管理列表页 (Article List Page)

> 分类: 12-管理后台-内容管理 (Admin Content Management)
> 状态: 📋 待开发
> 复杂度: L(大)
> 预估文件数: 8+

## 需求摘要

实现管理后台「文章管理」列表页，包含文章表格展示、组合筛选（类目/状态/来源/关键字/时间范围）、分页、排序、单行操作（编辑/预览/上架/下架/删除）、批量操作（批量上架/下架/删除），以及空状态/加载中/错误/离线等完整状态矩阵处理。遵循 Cosmic Refraction 毛玻璃设计系统。

## 相关上下文

- 产品需求: `product/admin/02-admin-content/01-article-management.md` §一（文章列表页）+ §四（批量操作）+ §五（状态矩阵）
- 设计规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 全局架构: `grules/01-rules.md` §一 — 设计系统（色彩、毛玻璃、响应式）
- 编码规范: `grules/05-coding-standards.md` §二 — 前端编码规范
- API 依赖: T12-001 — 文章管理 API（分页、筛选、CRUD、批量操作）
- 关联任务: T11-003（管理后台框架 + 侧边栏）

## 技术方案

### 路由配置

```typescript
// 侧边栏路径: 内容管理 > 文章管理
// URL: /admin/content/articles
```

### 页面布局

```
┌──────────────────────────────────────────────────────────┐
│ 面包屑: 内容管理 > 文章管理                                │
│                                                          │
│ 页面标题: 文章管理               [+ 新建文章] (Rose 实色)   │
│                                                          │
│ ┌─ 筛选栏 ──────────────────────────────────────────────┐ │
│ │ [文章分类 ▾] [文章状态 ▾] [内容来源 ▾] [🔍搜索...]    │ │
│ │ [创建时间范围 📅]                          [重置]      │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ 批量操作栏（勾选后显示）─────────────────────────────┐ │
│ │ 已选 X 篇  [批量上架] [批量下架] [批量删除] [取消选择] │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ 表格 ────────────────────────────────────────────────┐ │
│ │ ☐ | 序号↕ | 标题 | 分类 | 来源 | 状态 | 创建↕ | 更新↕ │ │
│ │   |      |      |     |     |     | 浏览↕ | 操作      │ │
│ │ ─────────────────────────────────────────────────────  │ │
│ │ ☐ | 1    | 长城 | 历史 | Dify | 草稿 | 04-15 | 04-16 │ │
│ │   |      |      |     |      |      | 0    | 编辑|... │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                          │
│ 共 96 篇文章                    20/页 ▾  < 1 2 3 ... >   │
└──────────────────────────────────────────────────────────┘
```

### 组件结构

```
frontend/src/pages/admin/content/
├── ArticleListPage.tsx              — 页面主组件
└── components/
    ├── ArticleFilterBar.tsx          — 筛选栏组件
    ├── ArticleTable.tsx              — 表格组件
    ├── ArticleBatchBar.tsx           — 批量操作栏
    ├── ArticleStatusTag.tsx          — 状态标签组件
    ├── ArticleSourceTag.tsx          — 来源标签组件
    └── ArticleCategoryTag.tsx        — 类目标签组件

frontend/src/hooks/
├── use-articles.ts                  — 文章列表 Hook（含筛选/分页/排序）
└── use-article-mutations.ts         — 文章操作 Hook（上架/下架/删除/批量）

frontend/src/services/
└── article.service.ts               — 文章 API 调用封装
```

### 筛选栏实现

```typescript
// 筛选项配置
const ARTICLE_CATEGORIES = [
  { value: '', label: '全部分类' },
  { value: 'chinese-history', label: '中国历史' },
  { value: 'chinese-cuisine', label: '中国美食' },
  { value: 'scenic-wonders', label: '名胜风光' },
  { value: 'festivals-customs', label: '传统节日' },
  { value: 'arts-heritage', label: '艺术非遗' },
  { value: 'music-opera', label: '音乐戏曲' },
  { value: 'classic-literature', label: '文学经典' },
  { value: 'idioms-allusions', label: '成语典故' },
  { value: 'philosophy-wisdom', label: '哲学思想' },
  { value: 'modern-china', label: '当代中国' },
  { value: 'fun-with-chinese', label: '趣味汉字' },
  { value: 'myths-legends', label: '中国神话传说' },
];

// 筛选变更 → 300ms 防抖 → 自动刷新列表
// 关键字搜索 → 300ms 防抖
// 无需点击搜索按钮
```

### 状态标签颜色映射

```typescript
const STATUS_CONFIG = {
  draft:       { label: '草稿', color: '#a3a3a3', bg: '#f5f5f5' },
  published:   { label: '已上架', color: '#22c55e', bg: '#f0fdf4' },
  unpublished: { label: '已下架', color: '#ef4444', bg: '#fef2f2' },
};

const SOURCE_CONFIG = {
  dify:   { label: 'Dify', className: 'bg-sky-100 text-sky-700' },
  manual: { label: '人工', className: 'bg-amber-100 text-amber-700' },
};
```

### 操作按钮逻辑

```typescript
// 每行操作按钮根据文章状态动态显示
function getActions(article: Article) {
  const actions = [
    { label: '编辑', type: 'link', always: true },
    { label: '预览', type: 'link', always: true },
  ];
  if (['draft', 'unpublished'].includes(article.status)) {
    actions.push({ label: '上架', type: 'success', onClick: () => publish(article.id) });
  }
  if (article.status === 'published') {
    actions.push({ label: '下架', type: 'danger', onClick: () => unpublish(article.id) });
  }
  if (['draft', 'unpublished'].includes(article.status)) {
    actions.push({ label: '删除', type: 'danger', onClick: () => confirmDelete(article.id) });
  }
  return actions;
}
```

### 批量操作实现

```typescript
// 勾选后底部操作栏出现
// 批量操作前弹出二次确认弹窗
// 如包含不符合条件的记录，弹窗提示跳过数量
// 操作完成后自动取消所有勾选 + 刷新列表

// 批量删除使用红色警告图标的确认弹窗
```

### 状态矩阵处理

```typescript
// Empty → 插画 + 「暂无文章，快去创建第一篇吧」+ CTA
// Loading → Skeleton 骨架屏（保留表头和筛选栏）
// Error → 错误插画 + 「数据加载失败」+ 重新加载按钮
// Offline → 顶部 Amber Banner + 操作按钮置灰
```

### 毛玻璃设计要求

```css
/* 筛选栏容器 */
.filter-bar {
  @apply backdrop-blur-[24px] backdrop-saturate-[1.8];
  @apply bg-white/70 dark:bg-neutral-900/70;
  @apply rounded-2xl border border-white/20;
}

/* 表格容器 */
.table-container {
  @apply backdrop-blur-[24px] backdrop-saturate-[1.8];
  @apply bg-white/60 dark:bg-neutral-900/60;
  @apply rounded-2xl;
}
```

## 范围（做什么）

- 创建 ArticleListPage 页面组件
- 实现筛选栏（5 个筛选项 + 重置 + 300ms 防抖）
- 实现表格组件（9 列 + 操作列 + 排序）
- 实现状态/来源/类目标签组件
- 实现批量操作栏（上架/下架/删除 + 二次确认 + 条件不符提示）
- 实现分页组件（页码 + 每页条数 + 跳页 + 总数）
- 实现状态矩阵全覆盖（Empty/Loading/Error/Offline）
- 实现 API 调用 Hook（use-articles + use-article-mutations）
- 实现 article.service.ts API 封装
- 注册路由 `/admin/content/articles`

## 边界（不做什么）

- 不实现文章编辑页（T12-006 负责）
- 不实现文章预览弹窗（T12-006 负责）
- 不实现后端 API（T12-001 已完成）

## 涉及文件

- 新建: `frontend/src/pages/admin/content/ArticleListPage.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleFilterBar.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleTable.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleBatchBar.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleStatusTag.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleSourceTag.tsx`
- 新建: `frontend/src/hooks/use-articles.ts`
- 新建: `frontend/src/hooks/use-article-mutations.ts`
- 新建: `frontend/src/services/article.service.ts`
- 修改: `frontend/src/router/index.tsx` — 注册路由

## 依赖

- 前置: T12-001（文章管理 API）、T11-003（管理后台框架）
- 后续: T12-006（文章编辑页）、T12-010（内容审核工作流）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 数据库有文章数据  
   **WHEN** 进入「内容管理 > 文章管理」页面  
   **THEN** 文章列表在 1 秒内加载完成，默认每页 20 条，按创建时间倒序

2. **GIVEN** 文章列表已加载  
   **WHEN** 在分类下拉中选择「中国历史」+ 状态选择「草稿」  
   **THEN** 列表实时筛选（300ms 防抖），仅显示匹配文章

3. **GIVEN** 文章列表显示 3 篇文章（1 篇草稿、1 篇已上架、1 篇已下架）  
   **WHEN** 查看各行操作按钮  
   **THEN** 草稿行显示「编辑|预览|上架|删除」；已上架行显示「编辑|预览|下架」；已下架行显示「编辑|预览|上架|删除」

4. **GIVEN** 勾选 5 篇文章  
   **WHEN** 点击「批量上架」按钮  
   **THEN** 弹出二次确认弹窗，确认后调用 API，操作完成后取消勾选 + 刷新列表 + Toast 提示

5. **GIVEN** 勾选包含已上架文章的混合选择  
   **WHEN** 点击「批量上架」  
   **THEN** 弹窗提示「选中文章中有 Y 篇不符合操作条件，将自动跳过，实际操作 Z 篇」

6. **GIVEN** 数据库无文章数据  
   **WHEN** 进入文章列表页  
   **THEN** 显示空状态插画 + 「暂无文章，快去创建第一篇吧」+ 「新建文章」CTA 按钮

7. **GIVEN** 网络连接断开  
   **WHEN** 查看文章列表页  
   **THEN** 页面顶部显示 Amber 色 Banner「网络连接已断开」，操作按钮全部置灰禁用

8. **GIVEN** 页面在浅色模式下正常  
   **WHEN** 切换到深色模式  
   **THEN** 所有组件正确切换为深色主题，毛玻璃效果正常，状态标签对比度 ≥ 4.5:1

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建前后端
2. Browser MCP（Puppeteer）打开 `http://localhost:5173/admin/content/articles`
3. 验证页面加载 + 数据展示
4. 测试筛选功能（组合筛选 + 重置）
5. 测试排序（点击列头）
6. 测试分页（翻页 + 每页条数切换 + 跳页）
7. 测试单行操作（上架/下架/删除 + 二次确认）
8. 测试批量操作（全选 + 批量上架/下架/删除）
9. 验证响应式：375px / 768px / 1280px
10. 验证 Light/Dark 双模式
11. 截图保存

### 测试通过标准

- [ ] Docker 构建成功，前端容器正常
- [ ] 列表加载 ≤ 1s
- [ ] 筛选 + 分页 + 排序全部正确
- [ ] 操作按钮按状态动态显示
- [ ] 批量操作含二次确认 + 条件不符提示
- [ ] 状态矩阵（Empty/Loading/Error）全覆盖
- [ ] 响应式 375px / 768px / 1280px 正常
- [ ] Light/Dark 双模式正常
- [ ] 无紫色出现，仅 Rose/Sky/Amber + 中性色
- [ ] 毛玻璃效果 blur(24px) saturate(1.8)

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/12-admin-content/` 下创建同名结果文件

结果文件路径: `/tasks/result/12-admin-content/T12-005-fe-article-list.md`

## 自检重点

- [ ] Tailwind CSS v4（@import "tailwindcss" + @theme），无 tailwind.config.js
- [ ] 色彩仅限 Rose/Sky/Amber + 中性色，无紫色
- [ ] 毛玻璃基线 blur(24px) saturate(1.8)
- [ ] 300ms 防抖筛选，无"搜索"按钮
- [ ] 批量操作上限 100 条
- [ ] 二次确认弹窗用于所有危险操作（上架/下架/删除）
- [ ] 分页默认 20 条/页
- [ ] 状态矩阵全覆盖
- [ ] 表格 aria-label 无障碍支持

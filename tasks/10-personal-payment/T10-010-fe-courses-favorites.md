# T10-010: 前端 — 我的课程与收藏

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10

## 需求摘要

实现「我的课程」和「我的收藏」两个前端页面。我的课程：展示用户已购课程列表（进度条/到期时间/续费入口）、未购课程引导。我的收藏：展示用户收藏的发现中国文章列表（支持搜索、分类筛选、取消收藏）。两个页面均需处理空状态、Loading、Error、离线缓存。严格遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/01-personal-center.md` §二.2/§二.3 — 我的课程/我的收藏 PRD
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` — 前端编码规范
- 关联任务: T04-006（课程学习 API）、T03-006（发现中国 API） → 本任务

## 技术方案

### 前端架构

```
src/features/personal/
├── pages/
│   ├── MyCoursesPage.tsx           — 我的课程页
│   └── MyFavoritesPage.tsx         — 我的收藏页
├── components/
│   ├── CourseCard.tsx              — 单个课程卡片
│   ├── CourseList.tsx              — 课程列表
│   ├── FavoriteCard.tsx            — 单个收藏卡片
│   ├── FavoriteList.tsx            — 收藏列表
│   ├── ExpiryBadge.tsx            — 到期倒计时徽章
│   ├── ProgressBar.tsx            — 课程进度条
│   └── EmptyState.tsx             — 空状态组件
├── hooks/
│   ├── use-my-courses.ts          — 我的课程 Hook
│   └── use-my-favorites.ts        — 我的收藏 Hook
└── services/
    ├── course-service.ts          — 课程 API 调用
    └── favorite-service.ts        — 收藏 API 调用
```

### 页面结构（我的课程）

```
MyCoursesPage
├── Header "我的课程"
├── TabBar [全部 | 进行中 | 已到期]
├── CourseList
│   └── CourseCard × N
│       ├── 课程封面缩略图 (48×48 圆角)
│       ├── 课程名称 "Level 4: 日常表达"
│       ├── ProgressBar (Sky 色进度条)
│       │   └── 进度文字 "8/24 课时"
│       ├── ExpiryBadge
│       │   ├── 正常: "剩余 320 天" (Amber 色)
│       │   ├── 即将到期: "剩余 28 天" (Rose 色闪烁)
│       │   └── 已到期: "已于 2026-01-15 到期" (灰色)
│       └── 操作按钮
│           ├── 进行中: "继续学习" → 跳转课程页
│           └── 已到期: "续费 $4.80" → 跳转购买页
└── 无课程时
    └── EmptyState "还没有课程"
        ├── 插图
        └── CTA "去选课" → 跳转课程列表
```

### 页面结构（我的收藏）

```
MyFavoritesPage
├── Header "我的收藏"
├── SearchBar (搜索文章标题)
├── CategoryFilter [全部 | 历史 | 美食 | 风景 | ... 12 类]
├── FavoriteList
│   └── FavoriteCard × N
│       ├── 文章封面图 (80×60 圆角)
│       ├── 文章标题（最多 2 行，超出 ...）
│       ├── 分类标签 (.chip Rose/Sky/Amber)
│       ├── 收藏时间 "3 天前"
│       └── SwipeAction: 左滑显示"取消收藏"（Rose 色）
└── 无收藏时
    └── EmptyState "还没有收藏"
        ├── 插图
        └── CTA "去发现中国" → 跳转发现中国
```

### 到期倒计时逻辑

```typescript
function getExpiryStatus(expiresAt: string): {
  label: string
  variant: 'normal' | 'warning' | 'expired'
} {
  const diff = dayjs(expiresAt).diff(dayjs(), 'day')
  if (diff < 0) return { label: `已于 ${dayjs(expiresAt).format('YYYY-MM-DD')} 到期`, variant: 'expired' }
  if (diff <= 30) return { label: `剩余 ${diff} 天`, variant: 'warning' }
  return { label: `剩余 ${diff} 天`, variant: 'normal' }
}
```

### 续费价格规则

| 场景 | 价格 |
|------|------|
| 正常购买 | $6.00/级 |
| 续费（到期前/到期后） | $4.80/级（20% 折扣） |
| 知语币抵扣 | 1 coin = $0.01 |

### 关键样式规格

| 元素 | 样式 |
|------|------|
| 课程卡片 | `.glass-card` `p-4`，内部 `flex items-center gap-4` |
| 进度条 | 高度 6px `rounded-full`，bg Sky-500 渐变 |
| 到期警告 | Rose-500 闪烁 `animate-pulse` |
| 收藏卡片 | `.glass-card` `p-3`，内部 `flex gap-3` |
| 左滑操作 | 宽度 80px Rose-500 背景 白色文字 |
| 空状态插图 | 居中 120×120，`opacity-60` |
| Tab 指示器 | 3px 底线 `bg-sky-500` `transition-all duration-300` |

## 范围（做什么）

- 实现"我的课程"列表页（Tab 筛选、进度条、到期倒计时、续费入口）
- 实现"我的收藏"列表页（搜索、分类筛选、左滑取消收藏）
- 实现空状态、Loading（Skeleton）、Error、离线缓存
- 响应式适配（375px / 768px / 1280px）
- Light/Dark 双模式

## 边界（不做什么）

- 不实现课程详情页（课程学习模块已有）
- 不实现购买支付页面（T10-012）
- 不实现知语币抵扣逻辑（T10-012）

## 涉及文件

- 新建: `src/features/personal/pages/MyCoursesPage.tsx`
- 新建: `src/features/personal/pages/MyFavoritesPage.tsx`
- 新建: `src/features/personal/components/CourseCard.tsx`
- 新建: `src/features/personal/components/CourseList.tsx`
- 新建: `src/features/personal/components/FavoriteCard.tsx`
- 新建: `src/features/personal/components/FavoriteList.tsx`
- 新建: `src/features/personal/components/ExpiryBadge.tsx`
- 新建: `src/features/personal/components/ProgressBar.tsx`
- 新建: `src/features/personal/components/EmptyState.tsx`
- 新建: `src/features/personal/hooks/use-my-courses.ts`
- 新建: `src/features/personal/hooks/use-my-favorites.ts`
- 修改: `src/router/index.tsx` — 添加路由

## 依赖

- 前置: T04-006（课程学习 API — 课程进度/到期查询）、T03-006（发现中国 API — 收藏列表）
- 后续: T10-012（购买支付页面 — 续费跳转目标）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户有 3 门已购课程 WHEN 进入"我的课程" THEN 显示 3 张课程卡片，各有进度条和到期信息
2. GIVEN 用户有 1 门课程剩余 28 天到期 WHEN 查看 THEN 该卡片到期徽章显示 Rose 色闪烁 "剩余 28 天"
3. GIVEN 用户有 1 门课程已到期 WHEN 查看 THEN 该卡片显示灰色到期文字 + "续费 $4.80" 按钮
4. GIVEN 用户点击"进行中"Tab WHEN 筛选 THEN 仅显示未到期课程
5. GIVEN 用户无课程 WHEN 进入"我的课程" THEN 显示空状态插图 + "去选课"按钮
6. GIVEN 用户有 15 条收藏 WHEN 进入"我的收藏" THEN 展示列表，支持滚动加载
7. GIVEN 搜索输入"长城" WHEN 模糊搜索 THEN 筛选出标题含"长城"的收藏
8. GIVEN 用户左滑收藏卡片 WHEN 出现"取消收藏"按钮 THEN 点击后移除该条目（乐观更新）
9. GIVEN 无收藏 WHEN 进入"我的收藏" THEN 显示空状态 + "去发现中国"按钮
10. GIVEN Light/Dark 模式 WHEN 切换 THEN 所有卡片、进度条、徽章正确适配

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. Browser MCP 导航到"我的课程"页面
3. Browser MCP 导航到"我的收藏"页面
4. 截图：Light + Dark 模式
5. 截图：375px / 768px / 1280px 三断点
6. 验证空状态、到期倒计时、左滑取消收藏

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 课程列表正常渲染（进度条、到期状态）
- [ ] 收藏列表正常渲染（搜索、筛选、左滑取消）
- [ ] 空状态正确显示
- [ ] 响应式通过（375px / 768px / 1280px）
- [ ] Light/Dark 模式正确
- [ ] 色彩仅 Rose/Sky/Amber + 中性色，无紫色
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-010-fe-courses-favorites.md`

## 自检重点

- [ ] UI：Cosmic Refraction 设计系统
- [ ] UI：色彩仅限 Rose/Sky/Amber
- [ ] 交互：左滑取消收藏 — 乐观更新 + 回滚
- [ ] 数据：续费价格 20% 折扣正确
- [ ] 性能：React Query 缓存 + 无限滚动
- [ ] 无障碍：进度条 role="progressbar" aria-valuenow

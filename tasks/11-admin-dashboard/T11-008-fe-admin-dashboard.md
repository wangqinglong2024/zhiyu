# T11-008: 前端 — 仪表盘页面

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: L(较大)
> 预估文件数: 10

## 需求摘要

实现管理后台仪表盘首页，包括：6 个核心指标卡片（总用户数、今日活跃用户、总订单数、本月收入、课程完成率、游戏日活）、3 个趋势折线图（用户增长/收入/游戏 DAU，Recharts 实现，支持 7天/30天/90天 周期切换）、内容概览区（内容分布饼图 + 热门文章/热门课程列表）、快捷操作区（4 个快捷入口）、最近操作日志（10 条最新审计日志表格）。根据管理员角色过滤可见数据区块。所有数据通过 T11-004 API 获取，支持加载态骨架屏。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/04-dashboard.md` — 仪表盘完整 PRD（**核心依据**）
- 产品需求: `product/admin/01-admin-dashboard/05-data-nonfunctional.md` §三.2 — 仪表盘 18 项验收标准 + §二 在线用户数
- 产品需求: `product/admin/01-admin-dashboard/02-permissions.md` §二 — 角色可见数据范围
- 架构白皮书: `grules/01-rules.md` §一 — Cosmic Refraction CSS 参数
- UI 设计: `grules/06-ui-design.md` — 色彩、字体、间距、动效规范
- API 设计: `grules/04-api-design.md` — 响应格式
- 关联任务: 前置 T11-004（仪表盘 API）、T11-007（全局导航布局） → 后续 T11-010（集成验证）

## 技术方案

### 页面布局

```
路由: /admin/dashboard
内容区（在 AdminLayout 的 Outlet 内渲染）

┌────────────────────────────────────────────────────────┐
│  H1: "仪表盘"          [在线用户: 🟢 128]  [刷新按钮] │
│                                                        │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌──┐
│  │总用户 │ │今日活跃│ │总订单 │ │本月收入│ │课程完 │ │游│
│  │12,345 │ │  2,100│ │ 8,899 │ │¥89.2万│ │成率   │ │戏│
│  │↑12.5% │ │ ↑8.3% │ │ ↑5.2% │ │↑15.1% │ │62.3%  │ │日│
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └──┘
│                                                        │
│  ┌─ 趋势图区域 ─────────────────────────────────────┐  │
│  │  [7天] [30天] [90天]                             │  │
│  │  📈 用户增长趋势  │  💰 收入趋势  │ 🎮 游戏DAU  │  │
│  │       折线图       │    折线图     │   折线图     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─ 内容概览 ─────────────┐  ┌─ 快捷操作 ──────────┐  │
│  │  🥧 内容分布饼图       │  │  📝 发布新文章       │  │
│  │  热门文章 Top5         │  │  📚 创建新课程       │  │
│  │  热门课程 Top5         │  │  🔍 查看退款         │  │
│  └─────────────────────────┘  │  📊 导出报表         │  │
│                               └──────────────────────┘  │
│  ┌─ 最近操作日志 ────────────────────────────────────┐  │
│  │  时间  |  管理员  |  操作类型  |  描述  |  IP     │  │
│  │  ...10 条最新审计日志...                          │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 组件拆分

```
features/admin/pages/
└── AdminDashboardPage.tsx           # 仪表盘页面主组件

features/admin/components/dashboard/
├── MetricCard.tsx                    # 单个指标卡片（复用）
├── MetricCardsGrid.tsx              # 6 个指标卡片网格
├── TrendCharts.tsx                  # 趋势图区域容器
├── TrendLineChart.tsx               # 单个趋势折线图（Recharts）
├── PeriodSelector.tsx               # 周期选择器（7天/30天/90天）
├── ContentOverview.tsx              # 内容概览区
├── ContentPieChart.tsx              # 内容分布饼图
├── TopContentList.tsx               # 热门文章/课程排行列表
├── QuickActions.tsx                 # 快捷操作区
├── RecentLogs.tsx                   # 最近操作日志
├── OnlineCount.tsx                  # 在线用户数显示
└── DashboardSkeleton.tsx            # 骨架屏加载态
```

### 指标卡片规格

```typescript
// MetricCard 组件
interface MetricCardProps {
  title: string           // 指标名称
  value: string | number  // 指标值
  change?: number         // 环比变化百分比
  changeLabel?: string    // 变化说明 "较昨日"
  icon: LucideIcon        // 图标
  iconColor: string       // 图标背景色（Rose/Sky/Amber 三色轮换）
  loading?: boolean       // 骨架屏态
}

// 卡片样式
// 毛玻璃卡片: rgba(255,255,255,0.03) + backdrop-filter: blur(24px) saturate(1.8)
// border: 1px solid rgba(255,255,255,0.06)
// border-radius: 16px
// padding: 24px
// Hover: 微抬升 translateY(-2px) + shadow

// 6 卡片网格
// 大屏: grid-cols-6（一行 6 个）
// 中屏: grid-cols-3（两行各 3 个）
// 小屏: grid-cols-2（三行各 2 个）

// 变化指示
// 正增长: ↑ 绿色 #22c55e
// 负增长: ↓ 红色 #ef4444
// 无变化: — 灰色 #a3a3a3
```

### 6 个指标卡片具体规格

```typescript
const METRIC_CARDS = [
  {
    key: 'total_users',
    title: '总用户数',
    icon: Users,
    iconColor: 'rose',          // Rose #e11d48 背景
    format: 'number',           // 千分位格式化 12,345
    changeLabel: '较昨日',
    roles: ['super_admin', 'user_ops'],  // 可见角色
  },
  {
    key: 'active_users_today',
    title: '今日活跃用户',
    icon: UserCheck,
    iconColor: 'sky',           // Sky #0284c7
    format: 'number',
    changeLabel: '较昨日',
    roles: ['super_admin', 'user_ops'],
  },
  {
    key: 'total_orders',
    title: '总订单数',
    icon: Receipt,
    iconColor: 'amber',         // Amber #d97706
    format: 'number',
    changeLabel: '较上月',
    roles: ['super_admin', 'user_ops'],
  },
  {
    key: 'monthly_revenue',
    title: '本月收入',
    icon: BadgeYuan,
    iconColor: 'rose',
    format: 'currency',         // ¥xx.x万 格式
    changeLabel: '较上月',
    roles: ['super_admin'],     // 仅超级管理员
  },
  {
    key: 'course_completion_rate',
    title: '课程完成率',
    icon: GraduationCap,
    iconColor: 'sky',
    format: 'percent',          // xx.x%
    changeLabel: '较上周',
    roles: ['super_admin', 'content_ops'],
  },
  {
    key: 'game_dau',
    title: '游戏日活',
    icon: Gamepad2,
    iconColor: 'amber',
    format: 'number',
    changeLabel: '较昨日',
    roles: ['super_admin', 'game_ops'],
  },
]
```

### 趋势折线图

```typescript
// 使用 Recharts 库
// npm install recharts

// TrendLineChart 组件
interface TrendLineChartProps {
  title: string
  data: { date: string; value: number }[]
  color: string           // 折线颜色 (Rose/Sky/Amber)
  loading?: boolean
  period: '7d' | '30d' | '90d'
}

// 图表样式
// 背景: 毛玻璃卡片
// 折线: 2px 宽，带区域渐变填充
// X 轴: 日期（格式化为 MM/DD）
// Y 轴: 自动刻度，千分位
// 网格线: rgba(255,255,255,0.06)
// Tooltip: 毛玻璃弹出层
// 动画: 折线描绘动画 1000ms ease-in-out

// PeriodSelector
// 三按钮组: [7天] [30天] [90天]
// 默认选中 7 天
// 按钮样式: 选中 Rose 背景白字，未选中 transparent 灰字
// 切换周期时重新请求 API

// 三个趋势图
// 1. 用户增长趋势 — Rose 色折线 #e11d48
// 2. 收入趋势 — Amber 色折线 #d97706
// 3. 游戏 DAU 趋势 — Sky 色折线 #0284c7
```

### 内容概览

```typescript
// ContentPieChart — 内容分布饼图
// Recharts PieChart
// 三色: 文章(Rose #e11d48) / 课程(Sky #0284c7) / 金句(Amber #d97706)
// 中心文字: 总内容数
// Legend 在右侧，每项含名称+数量+百分比

// TopContentList — 热门内容排行
// 两个 Tab: "热门文章" | "热门课程"
// 每 Tab 显示 Top 5
// 列表项: 序号（1-3 Rose 色圆形）+ 标题 + 浏览数/完成数
// 点击跳转到对应管理页面（有权限时）
```

### 快捷操作

```typescript
// QuickActions
// 4 个操作入口
// 毛玻璃卡片内，2×2 网格
// 每项: 图标(40px 彩色圆形背景) + 标签(14px)
// Hover: 卡片微抬升 + 图标缩放 1.1

const QUICK_ACTIONS = [
  { label: '发布新文章', icon: PenSquare, color: 'rose', path: '/admin/content/articles/new', permission: 'content.articles.create' },
  { label: '创建新课程', icon: BookPlus, color: 'sky', path: '/admin/content/courses/new', permission: 'content.courses.create' },
  { label: '查看退款', icon: RotateCcw, color: 'amber', path: '/admin/orders/refunds', permission: 'orders.refunds.view' },
  { label: '导出报表', icon: Download, color: 'rose', path: '#', permission: 'system.export' },
]
// 无权限的操作项隐藏
```

### 最近操作日志

```typescript
// RecentLogs — 10 条最新审计日志
// 毛玻璃表格
// 列: 时间 | 管理员 | 操作类型 | 描述 | IP 地址
// 时间格式: YYYY-MM-DD HH:mm:ss
// 操作类型: 用 Tag 标签展示，颜色区分（登录-Sky，内容-Rose，系统-Amber）
// 底部: "查看全部日志" 链接 → /admin/system/logs
// 仅 super_admin 可见全部；其他角色仅看到自己的操作日志
```

### 在线用户数

```typescript
// OnlineCount — 实时在线用户计数
// 位置: 页面标题栏右侧
// 样式: 绿色小圆点(#22c55e) + "在线用户: 128"
// 更新频率: 30 秒轮询 /api/v1/admin/dashboard/online-count
// 使用 useEffect + setInterval
// 数字变化时数字 flip 动画（可选 framer-motion 或 CSS）
```

### 角色数据过滤

```typescript
// 根据角色过滤仪表盘可见数据区块
// super_admin: 全部区块可见
// content_ops: 课程完成率卡片 + 内容概览 + 操作日志（仅自己）
// user_ops: 用户/订单卡片 + 用户趋势图 + 操作日志（仅自己）
// game_ops: 游戏日活卡片 + 游戏DAU趋势图 + 操作日志（仅自己）

// 不可见的区块直接不渲染（不要灰色遮罩或无权限占位）
```

### 加载态骨架屏

```typescript
// DashboardSkeleton
// 初次加载时全页面骨架屏
// 指标卡片: 6 个灰色脉冲矩形
// 图表区: 3 个灰色脉冲矩形
// 内容概览 + 快捷操作: 灰色脉冲矩形
// 操作日志: 10 行灰色脉冲条

// 脉冲动画: CSS @keyframes pulse
// 背景: rgba(255,255,255,0.06) → rgba(255,255,255,0.03) 循环
// 持续: 1.5s ease-in-out infinite
```

### 数据刷新

```typescript
// 右上角刷新按钮
// 图标: RefreshCw (Lucide)
// 点击时图标旋转动画
// 刷新所有仪表盘 API
// 刷新中: 按钮 disabled + spinning
// 刷新完成: Toast "数据已刷新"
```

### 数据格式化

```typescript
// 通用数据格式化工具函数
// features/admin/lib/format-utils.ts

export function formatNumber(num: number): string {
  // 千分位: 12345 → "12,345"
  return num.toLocaleString('zh-CN')
}

export function formatCurrency(num: number): string {
  // 金额: 892000 → "¥89.2万"  |  1200 → "¥1,200"
  if (num >= 10000) return `¥${(num / 10000).toFixed(1)}万`
  return `¥${num.toLocaleString('zh-CN')}`
}

export function formatPercent(num: number): string {
  // 百分比: 0.623 → "62.3%"
  return `${(num * 100).toFixed(1)}%`
}

export function formatChange(num: number): { text: string; color: string; icon: 'up' | 'down' | 'flat' } {
  if (num > 0) return { text: `+${num.toFixed(1)}%`, color: '#22c55e', icon: 'up' }
  if (num < 0) return { text: `${num.toFixed(1)}%`, color: '#ef4444', icon: 'down' }
  return { text: '—', color: '#a3a3a3', icon: 'flat' }
}
```

## 范围（做什么）

- 创建仪表盘页面主组件和所有子组件
- 实现 6 个指标卡片（格式化数值、环比变化指示）
- 实现 3 个 Recharts 趋势折线图（含周期切换）
- 实现内容概览区（饼图 + 热门排行）
- 实现快捷操作区（权限过滤）
- 实现最近操作日志表格
- 实现在线用户数轮询显示
- 实现角色数据过滤（不同角色看不同区块）
- 实现全页面骨架屏加载态
- 实现数据刷新按钮
- 安装 recharts 依赖
- 创建通用数据格式化工具函数

## 边界（不做什么）

- 不实现图表数据导出功能（后续迭代）
- 不实现仪表盘数据自定义面板（后续迭代）
- 不实现 WebSocket 实时推送（当前用轮询）
- 不实现报表导出按钮的实际导出功能（仅占位链接）

## 涉及文件

- 新建: `zhiyu/frontend/src/features/admin/pages/AdminDashboardPage.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/MetricCard.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/MetricCardsGrid.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/TrendCharts.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/TrendLineChart.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/PeriodSelector.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/ContentOverview.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/ContentPieChart.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/TopContentList.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/QuickActions.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/RecentLogs.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/OnlineCount.tsx`
- 新建: `zhiyu/frontend/src/features/admin/components/dashboard/DashboardSkeleton.tsx`
- 新建: `zhiyu/frontend/src/features/admin/lib/format-utils.ts`
- 修改: `zhiyu/frontend/src/features/admin/router/admin-routes.tsx` — 挂载仪表盘路由
- 修改: `zhiyu/frontend/package.json` — 添加 recharts 依赖

## 依赖

- 前置: T11-004（仪表盘 API 5 个端点）、T11-007（全局导航布局 + AdminLayout）
- 后续: T11-010（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

> 以下标准对应 PRD `05-data-nonfunctional.md` §三.2 的 D-01 至 D-18

1. **GIVEN** 超级管理员登录  
   **WHEN** 访问 /admin/dashboard  
   **THEN** 2s 内加载完成 → 6 个指标卡片全部展示正确数值（D-01）

2. **GIVEN** 总用户数 12345  
   **WHEN** 卡片渲染  
   **THEN** 显示"12,345"千分位格式化（D-02）

3. **GIVEN** 本月收入 892000  
   **WHEN** 收入卡片渲染  
   **THEN** 显示"¥89.2万"（D-03）

4. **GIVEN** 环比增长 12.5%  
   **WHEN** 卡片渲染  
   **THEN** 显示绿色 ↑ 和 "+12.5%"（D-04）

5. **GIVEN** 环比下降 -3.2%  
   **WHEN** 卡片渲染  
   **THEN** 显示红色 ↓ 和 "-3.2%"（D-05）

6. **GIVEN** 趋势图区域  
   **WHEN** 默认加载  
   **THEN** 三张折线图（用户增长/收入/游戏DAU），默认"7天"选中（D-06）

7. **GIVEN** 趋势图周期选择器  
   **WHEN** 点击"30天"  
   **THEN** 三张图同时切换为 30 天数据 → 折线重新描绘动画（D-07）

8. **GIVEN** 仪表盘正在加载  
   **WHEN** API 尚未返回  
   **THEN** 全部区域显示脉冲骨架屏（D-08）

9. **GIVEN** 内容概览区  
   **WHEN** 渲染完成  
   **THEN** 饼图显示文章/课程/金句三色分布 + 右侧热门 Top5 列表（D-09）

10. **GIVEN** 快捷操作区  
    **WHEN** 点击"发布新文章"  
    **THEN** 跳转至 /admin/content/articles/new（D-10）

11. **GIVEN** 最近操作日志  
    **WHEN** 渲染完成  
    **THEN** 显示 10 条最新记录 + "查看全部日志"链接（D-11）

12. **GIVEN** 在线用户数  
    **WHEN** 页面加载  
    **THEN** 右上角显示绿色圆点 + 当前在线人数 → 30 秒后数字更新（D-12）

13. **GIVEN** 内容运营管理员  
    **WHEN** 访问仪表盘  
    **THEN** 仅显示课程完成率卡片 + 内容概览 + 自己的操作日志，其他区块不显示（D-13）

14. **GIVEN** 用户运营管理员  
    **WHEN** 访问仪表盘  
    **THEN** 显示用户/订单相关卡片和趋势图，隐藏收入/游戏区块（D-14）

15. **GIVEN** 游戏运营管理员  
    **WHEN** 访问仪表盘  
    **THEN** 显示游戏日活卡片和趋势图，隐藏用户/订单/收入区块（D-15）

16. **GIVEN** 刷新按钮  
    **WHEN** 点击刷新  
    **THEN** 图标旋转动画 → 数据重新获取 → Toast "数据已刷新"（D-16）

17. **GIVEN** API 返回错误  
    **WHEN** 数据获取失败  
    **THEN** 对应区块显示错误提示 + "重试"按钮，不影响其他区块（D-17）

18. **GIVEN** 仪表盘所有图表  
    **WHEN** Hover 数据点  
    **THEN** 显示毛玻璃 Tooltip，内含日期和精确数值（D-18）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. Browser MCP 登录管理后台（super_admin 账号）
4. 截图记录 1280px 宽度仪表盘完整页面
5. 验证 6 个指标卡片正确渲染和数值格式
6. 验证趋势图渲染（三条折线 + 周期切换）
7. 测试骨架屏（清除缓存 → 刷新 → 截图加载态）
8. 测试内容概览饼图和热门排行
9. 测试快捷操作按钮跳转
10. 测试操作日志列表
11. 测试在线用户数显示和轮询更新
12. 测试数据刷新按钮
13. 切换 content_ops 角色登录 → 截图验证数据过滤
14. 切换 game_ops 角色登录 → 截图验证数据过滤
15. 测试 Hover Tooltip

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 6 个指标卡片正确渲染（数值格式、环比变化）
- [ ] 3 个趋势折线图正确渲染（Recharts，描绘动画）
- [ ] 周期切换正常（7天/30天/90天）
- [ ] 内容概览饼图和排行列表正常
- [ ] 快捷操作按钮正常跳转
- [ ] 操作日志正常显示
- [ ] 在线用户数正常显示和轮询
- [ ] 骨架屏加载态正常
- [ ] 角色数据过滤正确（四种角色均验证）
- [ ] Hover Tooltip 正常
- [ ] 数据刷新按钮正常
- [ ] UI 符合 Cosmic Refraction 设计系统
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证全部
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-008-fe-admin-dashboard.md`

## 自检重点

- [ ] 安全：敏感数据（收入）仅超管可见，API 侧做权限过滤
- [ ] UI 设计规范：Cosmic Refraction 毛玻璃、Rose/Sky/Amber 三色、无紫色
- [ ] 动效：骨架屏脉冲、折线描绘、卡片 Hover 抬升、刷新旋转
- [ ] 性能：Recharts 按需导入、骨架屏避免 CLS、30s 轮询有 cleanup
- [ ] 无障碍：图表 aria-label、卡片语义标签
- [ ] 容错：API 失败不白屏，单独区块降级

# T06-009: 前端页面 — 游戏大厅

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10+

## 需求摘要

实现游戏大厅前端页面。包括 12 款游戏的网格展示、游戏卡片（图标 + 名称 + 段位 + 战绩 + 锁定状态）、搜索过滤、游戏详情弹窗（模式选择：PK / 单人练习 / 多人）、总段位概览区域（当前段位 + 赛季信息 + 连胜）。遵循 Cosmic Refraction 毛玻璃设计系统。竖屏布局（大厅不强制横屏）。

## 相关上下文

- 产品需求: `product/apps/05-game-common/01-game-hall.md` — 完整游戏大厅 PRD（**核心依据**）
  - §二 入口与页面框架
  - §三 游戏列表网格
  - §四 游戏卡片元素
  - §五 游戏搜索与筛选
  - §六 游戏详情弹窗（模式选择）
  - §七 总段位概览区
- 产品需求: `product/apps/05-game-common/02-common-ui.md` — 通用 UI 组件（段位徽章、星星指示器）
- 设计规范: `grules/01-rules.md` §二.1 — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` §二 — React 组件规范
- UI 规范: `grules/06-ui-design.md` — 全局 UI 标准
- 关联任务: T06-004 → 本任务 → T06-010（匹配框架）

## 技术方案

### 页面结构

```
/games                    # 游戏大厅（竖屏模式）
├── Header                # 顶部导航
├── RankOverviewCard      # 总段位概览卡片
├── GameSearchBar         # 搜索筛选栏
├── GameGrid              # 12 款游戏网格
│   └── GameCard × 12    # 游戏卡片
└── GameDetailModal       # 游戏详情弹窗（模式选择）
```

### 组件设计

```typescript
// 游戏大厅页面
// frontend/src/pages/games/GameHallPage.tsx

// 段位概览卡片 — 展示当前段位、赛季、连胜
// frontend/src/pages/games/components/RankOverviewCard.tsx
interface RankOverviewProps {
  tier: string
  tierNameZh: string
  subTier: string
  starsInSub: number
  starsRequired: number
  currentWinStreak: number
  seasonName: string
  daysRemaining: number
}

// 游戏卡片 — 展示单个游戏信息
// frontend/src/pages/games/components/GameCard.tsx
interface GameCardProps {
  gameCode: string
  name: string
  description: string
  iconUrl: string
  isLocked: boolean          // 等级未达标则锁定
  unlockLevel: number
  userStats: {
    totalGames: number
    winRate: number
    equippedSkin?: string
  }
}

// 游戏详情弹窗 — 展示模式选择
// frontend/src/pages/games/components/GameDetailModal.tsx
interface GameDetailModalProps {
  game: GameDetail
  isOpen: boolean
  onClose: () => void
  onSelectMode: (mode: 'pk_1v1' | 'pk_multi' | 'solo_practice') => void
}

// 搜索筛选栏
// frontend/src/pages/games/components/GameSearchBar.tsx
```

### Cosmic Refraction 设计规范

```css
/* 游戏卡片毛玻璃样式 — 使用 Tailwind CSS v4 */
/* @import "tailwindcss" + @theme 变量，不使用 tailwind.config.js */

/* 游戏卡片 */
.game-card {
  @apply rounded-2xl border border-white/20 shadow-xl;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(1.8);
}

/* 段位概览卡片 */
.rank-overview {
  @apply rounded-2xl border border-white/20;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px) saturate(1.8);
}

/* 锁定游戏半透明遮罩 */
.game-card-locked {
  @apply opacity-50 pointer-events-none;
}
```

### 段位徽章颜色映射

```typescript
const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze:   { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-500/30' },
  silver:   { bg: 'bg-gray-400/30', text: 'text-gray-300', border: 'border-gray-400/30' },
  gold:     { bg: 'bg-yellow-500/30', text: 'text-yellow-300', border: 'border-yellow-400/30' },
  platinum: { bg: 'bg-cyan-500/30', text: 'text-cyan-300', border: 'border-cyan-400/30' },
  diamond:  { bg: 'bg-sky-500/30', text: 'text-sky-300', border: 'border-sky-400/30' },
  star:     { bg: 'bg-rose-500/30', text: 'text-rose-300', border: 'border-rose-400/30' },
  king:     { bg: 'bg-amber-400/30', text: 'text-amber-200', border: 'border-amber-300/30' },
}
```

### 数据流

```typescript
// API 调用
const { data: games } = useQuery(['games'], () => api.get('/api/v1/games'))
const { data: overview } = useQuery(['games-overview'], () => api.get('/api/v1/games/overview'))

// 进入游戏流程
function handleSelectMode(gameCode: string, mode: string) {
  // 1. 关闭弹窗
  // 2. 导航到匹配页 /games/:gameCode/match?mode=xxx
}
```

### 前端目录结构

```
frontend/src/
├── pages/
│   └── games/
│       ├── GameHallPage.tsx         # 大厅页面
│       └── components/
│           ├── RankOverviewCard.tsx  # 段位概览
│           ├── GameCard.tsx          # 游戏卡片
│           ├── GameGrid.tsx          # 游戏网格
│           ├── GameSearchBar.tsx     # 搜索筛选
│           ├── GameDetailModal.tsx   # 详情弹窗
│           └── TierBadge.tsx         # 段位徽章组件
├── hooks/
│   └── useGames.ts                  # 游戏列表 Hook
├── types/
│   └── game.types.ts                # 游戏类型定义（如已有则合并）
```

## 范围（做什么）

- 实现游戏大厅页面整体布局（竖屏模式）
- 实现段位概览卡片（当前段位 + 赛季 + 连胜）
- 实现 12 款游戏网格展示
- 实现游戏卡片（图标 + 名称 + 战绩 + 等级锁定）
- 实现搜索筛选功能（按名称搜索）
- 实现游戏详情弹窗（模式选择：PK / 单人 / 多人）
- 实现段位徽章通用组件
- 实现等级锁定状态展示（半透明 + 锁定图标 + 解锁条件）
- 响应式布局：手机 2 列，平板 3 列，桌面 4 列

## 边界（不做什么）

- 不实现匹配与对战功能（T06-010 负责）
- 不实现皮肤商城入口页（T06-012 负责）
- 不实现后端 API（T06-004 已完成）

## 涉及文件

- 新建: `frontend/src/pages/games/GameHallPage.tsx`
- 新建: `frontend/src/pages/games/components/RankOverviewCard.tsx`
- 新建: `frontend/src/pages/games/components/GameCard.tsx`
- 新建: `frontend/src/pages/games/components/GameGrid.tsx`
- 新建: `frontend/src/pages/games/components/GameSearchBar.tsx`
- 新建: `frontend/src/pages/games/components/GameDetailModal.tsx`
- 新建: `frontend/src/pages/games/components/TierBadge.tsx`
- 新建: `frontend/src/hooks/useGames.ts`
- 修改: `frontend/src/router.tsx`（添加 /games 路由）

## 依赖

- 前置: T06-004（后端游戏大厅 API 可用）
- 后续: T06-010（匹配与对战框架）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户登录后 WHEN 导航到 /games THEN 展示游戏大厅，顶部显示段位概览卡片
2. GIVEN 12 款游戏数据已加载 WHEN 页面渲染 THEN 展示 12 个游戏卡片网格，手机 2 列、平板 3 列、桌面 4 列
3. GIVEN 用户等级 3（course level-03）WHEN 查看游戏列表 THEN G1-G3 可点击，G4-G12 显示锁定态（半透明+锁图标+提示 "Lv.X 解锁"）
4. GIVEN 用户点击可玩游戏卡片 WHEN 弹出详情弹窗 THEN 展示游戏图标、名称、描述、模式选择按钮
5. GIVEN 详情弹窗中用户选择 "PK 对战" WHEN 点击确认 THEN 导航到 /games/G1/match?mode=pk_1v1
6. GIVEN 搜索框输入 "成语" WHEN 过滤 THEN 仅展示名称包含 "成语" 的游戏
7. GIVEN 段位概览卡片 WHEN 页面加载 THEN 显示当前段位徽章、星数进度条、赛季名称、剩余天数、连胜记录
8. GIVEN 所有 UI 元素 WHEN 视觉检查 THEN 符合 Cosmic Refraction 毛玻璃风格，无紫色元素

## UI 设计对照检查表（强制）

> 必须遵循 Cosmic Refraction 设计系统

- [ ] 毛玻璃效果: `backdrop-filter: blur(24px) saturate(1.8)`
- [ ] 背景透明度: `rgba(255, 255, 255, 0.06~0.15)`
- [ ] 边框: `border-white/20`
- [ ] 圆角: `rounded-2xl`
- [ ] 阴影: `shadow-xl`
- [ ] 禁止紫色: 无 purple/violet 色系
- [ ] 主题色: Rose/Sky/Amber 三色系
- [ ] Tailwind CSS v4: `@import "tailwindcss"` + `@theme`，无 `tailwind.config.js`
- [ ] 响应式: 手机/平板/桌面三档

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 浏览器访问前端页面 /games
4. 验证游戏网格展示正确
5. 验证段位概览卡片数据
6. 验证游戏详情弹窗和模式选择
7. 验证搜索过滤功能
8. 验证等级锁定展示
9. 验证响应式布局（三档断点）

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，前端正常渲染
- [ ] 12 款游戏卡片正确展示
- [ ] 段位概览信息正确
- [ ] 模式选择弹窗正常
- [ ] 搜索过滤功能正常
- [ ] 等级锁定展示正确
- [ ] 毛玻璃效果可见
- [ ] 无紫色元素
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-009-fe-game-hall.md`

## 自检重点

- [ ] 设计系统: Cosmic Refraction 毛玻璃风格一致
- [ ] 无紫色: 检查所有颜色引用
- [ ] Tailwind v4: `@import "tailwindcss"` 而非 `@tailwind base`
- [ ] 响应式: 手机/平板/桌面三档断点正确
- [ ] 等级锁定: 不可点击，不可绕过
- [ ] 无障碍: 卡片有 aria-label，弹窗有 ESC 关闭

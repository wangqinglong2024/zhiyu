# T06-012: 前端页面 — 段位排行榜与皮肤商城

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 12+

## 需求摘要

实现段位排行榜和皮肤商城两个前端页面。排行榜包含三榜切换（全服/赛季/游戏）、排名列表、自己排名高亮、段位详情展示。皮肤商城包含分类浏览（角色/背景/特效/音效）、皮肤预览、购买流程、装备管理。遵循 Cosmic Refraction 毛玻璃设计系统。

## 相关上下文

- 产品需求: `product/apps/05-game-common/06-leaderboard.md` — 排行榜 PRD（**核心依据**）
  - §二 三榜切换 Tab
  - §三 排行榜列表项（排名/头像/昵称/段位/星数）
  - §四 自己排名（固定底部高亮）
  - §五 缓存时间提示（"数据更新于 X 分钟前"）
- 产品需求: `product/apps/05-game-common/07-skin-shop.md` — 皮肤商城 PRD（**核心依据**）
  - §二 商城入口与布局
  - §三 皮肤分类 Tab（角色/背景/特效/音效）
  - §四 皮肤详情（预览、试用）
  - §五 购买流程（确认弹窗、余额展示）
  - §六 装备管理（装备/卸下/互斥提示）
- 设计规范: `grules/01-rules.md` §二.1 — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` §二 — React 组件规范
- 关联任务: T06-007 + T06-008 → 本任务 → T06-013（集成验证）

## 技术方案

### 页面结构

#### 排行榜页面

```
/games/leaderboard                      # 排行榜页（竖屏）
├── LeaderboardHeader                   # 页面标题
├── LeaderboardTabs                     # 三榜切换 Tab
│   ├── Tab: 全服总榜
│   ├── Tab: 赛季榜
│   └── Tab: 游戏榜（含游戏选择器）
├── MyRankCard                          # 自己排名卡片（固定顶部/底部）
├── LeaderboardList                     # 排名列表
│   └── LeaderboardItem × N            # 排名项
├── CacheInfo                           # "数据更新于 X 分钟前"
└── LoadMore / Pagination              # 加载更多
```

#### 皮肤商城页面

```
/games/skins                            # 皮肤商城（竖屏）
├── SkinShopHeader                      # 商城标题 + 知语币余额
├── SkinCategoryTabs                    # 分类 Tab（角色/背景/特效/音效）
├── SkinGrid                           # 皮肤网格
│   └── SkinCard × N                   # 皮肤卡片
├── SkinDetailModal                     # 皮肤详情弹窗（预览+购买/装备）
│   ├── SkinPreview                    # 大图预览
│   ├── SkinInfo                       # 信息（名称/描述/稀有度/价格）
│   └── SkinActions                    # 购买/装备按钮
├── PurchaseConfirmModal               # 购买确认弹窗
└── OwnedSkinsSection                  # 已拥有皮肤区域
```

### 排行榜组件

```typescript
// frontend/src/pages/games/LeaderboardPage.tsx

// 排行榜列表项
// frontend/src/pages/games/components/LeaderboardItem.tsx
interface LeaderboardItemProps {
  rank: number
  userId: string
  nickname: string
  avatarUrl: string
  tier: string
  tierNameZh: string
  totalStars: number
  kingPoints?: number
  isMe: boolean
}

// Top 3 特殊样式: 金/银/铜色背景
// 自己排名: 高亮边框 + 固定在列表底部

// 自己排名卡片
// frontend/src/pages/games/components/MyRankCard.tsx
interface MyRankCardProps {
  rank: number
  tier: string
  tierNameZh: string
  subTier: string
  totalStars: number
}
```

### 皮肤商城组件

```typescript
// frontend/src/pages/games/SkinShopPage.tsx

// 皮肤卡片
// frontend/src/pages/games/components/SkinCard.tsx
interface SkinCardProps {
  skinId: string
  name: string
  previewUrl: string
  category: 'character' | 'background' | 'effect' | 'sound'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  priceCoins: number
  discountPriceCoins?: number
  owned: boolean
  equipped: boolean
}

// 稀有度颜色映射
const RARITY_COLORS = {
  common:    { border: 'border-gray-400/30', badge: 'bg-gray-500/30 text-gray-300' },
  rare:      { border: 'border-sky-400/30', badge: 'bg-sky-500/30 text-sky-300' },
  epic:      { border: 'border-rose-400/30', badge: 'bg-rose-500/30 text-rose-300' },
  legendary: { border: 'border-amber-400/30', badge: 'bg-amber-500/30 text-amber-300' },
}

// 购买确认弹窗
// frontend/src/pages/games/components/PurchaseConfirmModal.tsx
interface PurchaseConfirmModalProps {
  skin: SkinDetail
  currentBalance: number
  isDiscountUser: boolean
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}
```

### Hooks

```typescript
// frontend/src/hooks/useLeaderboard.ts
export function useLeaderboard(type: 'global' | 'season' | 'game', gameCode?: string) {
  return useInfiniteQuery(
    ['leaderboard', type, gameCode],
    ({ pageParam = 1 }) => api.get(`/api/v1/ranks/leaderboard/${type}`, {
      params: { page: pageParam, page_size: 50, ...(gameCode ? { game_code: gameCode } : {}) }
    }),
    { getNextPageParam: (lastPage) => lastPage.has_next ? lastPage.page + 1 : undefined }
  )
}

// frontend/src/hooks/useSkins.ts
export function useSkins(category?: string, gameCode?: string) {
  return useQuery(['skins', category, gameCode], () =>
    api.get('/api/v1/skins', { params: { category, game_code: gameCode } })
  )
}

export function usePurchaseSkin() {
  const queryClient = useQueryClient()
  return useMutation(
    (skinId: string) => api.post(`/api/v1/skins/${skinId}/purchase`),
    { onSuccess: () => queryClient.invalidateQueries(['skins']) }
  )
}

export function useEquipSkin() {
  return useMutation(
    ({ skinId, gameCode }: { skinId: string, gameCode: string }) =>
      api.post(`/api/v1/skins/${skinId}/equip`, { game_code: gameCode })
  )
}
```

### 前端目录结构

```
frontend/src/
├── pages/
│   └── games/
│       ├── LeaderboardPage.tsx          # 排行榜页面
│       ├── SkinShopPage.tsx             # 皮肤商城页面
│       └── components/
│           ├── LeaderboardItem.tsx       # 排行榜列表项
│           ├── LeaderboardTabs.tsx       # 三榜切换
│           ├── MyRankCard.tsx            # 自己排名
│           ├── CacheInfo.tsx            # 缓存时间提示
│           ├── SkinCard.tsx             # 皮肤卡片
│           ├── SkinGrid.tsx             # 皮肤网格
│           ├── SkinDetailModal.tsx       # 皮肤详情弹窗
│           ├── PurchaseConfirmModal.tsx  # 购买确认
│           └── SkinCategoryTabs.tsx      # 分类 Tab
├── hooks/
│   ├── useLeaderboard.ts               # 排行榜 Hook
│   └── useSkins.ts                     # 皮肤 Hook
```

## 范围（做什么）

- **排行榜页面**:
  - 三榜切换 Tab（全服总榜/赛季榜/游戏榜）
  - 排行榜列表（头像+昵称+段位+星数）
  - Top 3 特殊样式（金/银/铜）
  - 自己排名高亮（固定底部或列表内高亮）
  - 缓存时间提示（"数据更新于 X 分钟前"）
  - 游戏榜选择器（选择具体游戏）
  - 无限滚动/分页加载
- **皮肤商城页面**:
  - 四分类 Tab（角色/背景/特效/音效）
  - 皮肤网格展示（卡片 + 稀有度标记 + 价格）
  - 皮肤详情弹窗（大图预览 + 信息 + 操作）
  - 购买确认弹窗（价格/折扣/余额）
  - 装备/卸下功能
  - 已拥有/已装备状态标记
  - 知语币余额展示

## 边界（不做什么）

- 不实现后端排行榜/皮肤 API（T06-007 + T06-008 已完成）
- 不实现知语币充值入口（支付模块负责）
- 不实现皮肤的游戏内预览/试用（各游戏模块负责）
- 不实现段位详情页（已在 T06-009 RankOverviewCard 中）

## 涉及文件

- 新建: `frontend/src/pages/games/LeaderboardPage.tsx`
- 新建: `frontend/src/pages/games/SkinShopPage.tsx`
- 新建: `frontend/src/pages/games/components/LeaderboardItem.tsx`
- 新建: `frontend/src/pages/games/components/LeaderboardTabs.tsx`
- 新建: `frontend/src/pages/games/components/MyRankCard.tsx`
- 新建: `frontend/src/pages/games/components/CacheInfo.tsx`
- 新建: `frontend/src/pages/games/components/SkinCard.tsx`
- 新建: `frontend/src/pages/games/components/SkinGrid.tsx`
- 新建: `frontend/src/pages/games/components/SkinDetailModal.tsx`
- 新建: `frontend/src/pages/games/components/PurchaseConfirmModal.tsx`
- 新建: `frontend/src/pages/games/components/SkinCategoryTabs.tsx`
- 新建: `frontend/src/hooks/useLeaderboard.ts`
- 新建: `frontend/src/hooks/useSkins.ts`
- 修改: `frontend/src/router.tsx`（添加 /games/leaderboard 和 /games/skins 路由）

## 依赖

- 前置: T06-007（排行榜 API）
- 前置: T06-008（皮肤商城 API）
- 前置: T06-009（TierBadge 组件复用）
- 后续: T06-013（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

### 排行榜

1. GIVEN 用户进入排行榜页 WHEN 默认展示全服总榜 THEN 按总星数降序显示，Top 3 有特殊样式（金/银/铜）
2. GIVEN 全服总榜 WHEN 下滑到底部 THEN 加载更多排名数据（无限滚动）
3. GIVEN 切换到赛季榜 Tab WHEN 数据加载 THEN 显示当赛季排名
4. GIVEN 切换到游戏榜 Tab WHEN 选择 G1 THEN 显示 G1 按胜场数排名
5. GIVEN 自己排名 42 WHEN 列表可见区域无自己 THEN 底部固定显示自己排名卡片
6. GIVEN 缓存数据 WHEN 页面显示 THEN 底部提示 "数据更新于 X 分钟前"

### 皮肤商城

7. GIVEN 进入皮肤商城 WHEN 默认展示角色分类 THEN 显示角色皮肤网格 + 右上角知语币余额
8. GIVEN 切换到背景分类 WHEN Tab 切换 THEN 展示背景皮肤列表
9. GIVEN 点击未拥有皮肤卡片 WHEN 弹出详情 THEN 展示大图预览 + 价格 + "购买" 按钮
10. GIVEN 点击购买按钮 WHEN 弹出确认 THEN 显示价格（付费用户显示折扣价）、当前余额、确认/取消
11. GIVEN 确认购买且余额充足 WHEN 购买成功 THEN 皮肤标记为已拥有，余额更新
12. GIVEN 余额不足 WHEN 购买 THEN 显示余额不足提示
13. GIVEN 已拥有皮肤 WHEN 点击详情 THEN 显示 "装备" 按钮（而非购买），可选择装备到哪个游戏
14. GIVEN 装备皮肤到 G1 WHEN 同类已有其他皮肤装备在 G1 THEN 旧皮肤自动卸下，新皮肤装备成功

## UI 设计对照检查表（强制）

> 必须遵循 Cosmic Refraction 设计系统

- [ ] 毛玻璃效果: 排行榜卡片、皮肤卡片、弹窗
- [ ] `backdrop-filter: blur(24px) saturate(1.8)`
- [ ] 禁止紫色: 无 purple/violet 色系
- [ ] Top 3 配色: 金(Amber)/银(gray)/铜(amber-700) — 不用 purple
- [ ] 稀有度配色: 普通(gray)/稀有(Sky)/史诗(Rose)/传说(Amber)
- [ ] Tailwind CSS v4: `@import "tailwindcss"` + `@theme`
- [ ] 响应式: 排行榜单列、皮肤网格手机 2 列/平板 3 列/桌面 4 列

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 访问排行榜页面，验证三榜切换
4. 验证 Top 3 特殊样式
5. 验证自己排名高亮
6. 访问皮肤商城页面，验证分类 Tab
7. 验证皮肤详情弹窗
8. 验证购买流程（正常/余额不足）
9. 验证装备/卸下功能

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，前端正常渲染
- [ ] 排行榜三榜切换正常
- [ ] 排行榜数据排序正确
- [ ] 皮肤分类浏览正常
- [ ] 购买流程完整
- [ ] 装备/卸下功能正确
- [ ] 毛玻璃效果可见
- [ ] 无紫色元素
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-012-fe-rank-skin.md`

## 自检重点

- [ ] 无限滚动: 排行榜分页加载不重复、不遗漏
- [ ] 缓存提示: 正确计算"X 分钟前"
- [ ] 购买幂等: 点击购买按钮后禁用防重复提交
- [ ] 乐观更新: 购买成功后立即更新 UI 状态
- [ ] 余额同步: 购买后余额数字实时更新
- [ ] Tab 状态: 切换 Tab 不丢失滚动位置

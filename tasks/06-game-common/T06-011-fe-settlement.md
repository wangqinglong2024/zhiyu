# T06-011: 前端页面 — 结算页面

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8+

## 需求摘要

实现游戏结算页面。包括胜利/失败/平局三种状态展示、段位变化动画（加星/减星/晋级/掉段）、知识点回顾列表、知语币奖励提示、连胜状态、单人练习结算（无段位变化）。结算页在游戏结束后自动展示，可返回大厅或再来一局。

## 相关上下文

- 产品需求: `product/apps/05-game-common/04-settlement.md` — 完整结算 PRD（**核心依据**）
  - §二 胜利结算页布局（恭喜动画、段位变化、知识点回顾）
  - §三 失败结算页布局（鼓励文案、段位变化、知识点薄弱项）
  - §四 单人练习结算（无段位变化、正确率统计）
  - §五 多人对战结算（排名列表）
  - §六 操作按钮（再来一局/返回大厅/分享）
- 产品需求: `product/apps/05-game-common/05-rank-system.md` §三 — 晋级动画触发条件
- 设计规范: `grules/01-rules.md` §二.1 — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` §二 — React 组件规范
- 关联任务: T06-006 → 本任务 → T06-013（集成验证）

## 技术方案

### 页面结构

```
/games/:gameCode/settlement/:sessionId    # 结算页（竖屏模式）
├── SettlementHeader          # 胜利/失败/平局状态标题+动画
├── RankChangeCard            # 段位变化动画卡片
│   ├── StarAnimation         # 加星/减星动画
│   ├── PromotionAnimation    # 晋级大段动画（可选）
│   └── DemotionAnimation     # 掉段动画（可选）
├── ScoreSummary              # 得分摘要（己方/对手）
├── KnowledgeReview           # 知识点回顾列表
├── RewardInfo                # 奖励信息（知语币/连胜）
├── MultiPlayerRanking        # 多人排名列表（多人模式）
└── SettlementActions         # 操作按钮区
    ├── PlayAgainButton       # 再来一局
    ├── BackToHallButton      # 返回大厅
    └── ShareButton           # 分享按钮
```

### 组件设计

```typescript
// 结算页面
// frontend/src/pages/games/SettlementPage.tsx
interface SettlementData {
  sessionId: string
  gameCode: string
  mode: string
  result: 'win' | 'lose' | 'draw'
  isAiMatch: boolean
  myResult: {
    score: number
    starChange: number
    beforeRank: RankInfo
    afterRank: RankInfo
    isPromotion: boolean
    isDemotion: boolean
    coinReward: number
    currentWinStreak: number
  }
  opponentResult?: {
    nickname: string
    avatar: string
    score: number
  }
  multiResults?: MultiPlayerResult[]
  knowledgePoints: KnowledgePoint[]
}

// 段位变化卡片
// frontend/src/pages/games/components/RankChangeCard.tsx
interface RankChangeCardProps {
  beforeRank: RankInfo
  afterRank: RankInfo
  starChange: number
  isPromotion: boolean
  isDemotion: boolean
  isAiMatch: boolean     // AI 对战不显示段位变化
}

// 星数动画组件
// frontend/src/pages/games/components/StarAnimation.tsx
// 加星: 星星从灰色点亮为金色，伴随粒子特效
// 减星: 星星从金色变灰，伴随碎裂特效

// 知识点回顾
// frontend/src/pages/games/components/KnowledgeReview.tsx
interface KnowledgePoint {
  point: string         // 知识点名称（如 "奋不顾身"）
  correct: boolean
  detail?: string       // 错误时的详细解释
}
```

### 动画方案

```typescript
// 使用 CSS Animation + Tailwind 动画类
// 胜利动画: 金色光效 + 粒子飘散
// 失败动画: 柔和的蓝色色调 + 鼓励文案淡入
// 晋级动画: 段位徽章放大 → 光效闪烁 → 新段位名称显示（约 3 秒）
// 掉段动画: 段位徽章缩小淡出 → 新段位淡入（约 2 秒）

// 星星动画时序
const STAR_ANIMATION_DELAY = 500  // 每颗星间隔 500ms
const PROMOTION_DELAY = 1500       // 晋级动画延迟 1.5s（等星星动画完成）
```

### 数据获取

```typescript
// frontend/src/hooks/useSettlement.ts
export function useSettlement(sessionId: string) {
  // 结算数据已在结束游戏时通过 finish API 返回
  // 也可通过查询 API 获取：
  // GET /api/v1/game-sessions/:sessionId/result
  
  return useQuery(
    ['settlement', sessionId],
    () => api.get(`/api/v1/game-sessions/${sessionId}/result`)
  )
}
```

### 前端目录结构

```
frontend/src/
├── pages/
│   └── games/
│       ├── SettlementPage.tsx         # 结算页面
│       └── components/
│           ├── RankChangeCard.tsx      # 段位变化卡片
│           ├── StarAnimation.tsx       # 星星动画
│           ├── PromotionAnimation.tsx  # 晋级动画
│           ├── KnowledgeReview.tsx     # 知识点回顾
│           ├── RewardInfo.tsx          # 奖励信息
│           ├── MultiPlayerRanking.tsx  # 多人排名
│           └── SettlementActions.tsx   # 操作按钮区
├── hooks/
│   └── useSettlement.ts               # 结算数据 Hook
```

## 范围（做什么）

- 实现胜利结算页（恭喜动画 + 段位变化 + 知识点回顾）
- 实现失败结算页（鼓励文案 + 段位变化 + 薄弱知识点）
- 实现单人练习结算页（无段位变化，正确率统计）
- 实现多人对战结算页（排名列表）
- 实现段位变化动画（加星/减星 + 晋级/掉段特效）
- 实现知识点回顾列表（正确/错误标记 + 错误详解）
- 实现知语币奖励提示（5 连胜 +1 币提示）
- 实现操作按钮（再来一局/返回大厅）
- 实现 AI 对战特殊标记（"AI 对战不影响段位"）

## 边界（不做什么）

- 不实现结算 API 逻辑（T06-006 已完成）
- 不实现分享到社交平台（MVP 暂不支持）
- 不实现游戏对战框架（T06-010 已完成）

## 涉及文件

- 新建: `frontend/src/pages/games/SettlementPage.tsx`
- 新建: `frontend/src/pages/games/components/RankChangeCard.tsx`
- 新建: `frontend/src/pages/games/components/StarAnimation.tsx`
- 新建: `frontend/src/pages/games/components/PromotionAnimation.tsx`
- 新建: `frontend/src/pages/games/components/KnowledgeReview.tsx`
- 新建: `frontend/src/pages/games/components/RewardInfo.tsx`
- 新建: `frontend/src/pages/games/components/MultiPlayerRanking.tsx`
- 新建: `frontend/src/pages/games/components/SettlementActions.tsx`
- 新建: `frontend/src/hooks/useSettlement.ts`
- 修改: `frontend/src/router.tsx`（添加 /games/:gameCode/settlement/:sessionId 路由）

## 依赖

- 前置: T06-006（结算 API 返回完整数据）
- 前置: T06-009（TierBadge 组件复用）
- 后续: T06-013（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN PK 胜利 WHEN 结算页展示 THEN 显示恭喜动画、段位 +1 星动画、得分对比
2. GIVEN PK 失败 WHEN 结算页展示 THEN 显示鼓励文案、段位 -1 星动画、得分对比
3. GIVEN 大段晋级（黄金→铂金）WHEN 结算页展示 THEN 播放晋级特效动画（段位徽章放大+光效），持续约 3 秒
4. GIVEN 大段掉段 WHEN 结算页展示 THEN 播放掉段动画（段位徽章缩小淡出→新段位淡入）
5. GIVEN 答题 10 道，对 7 道错 3 道 WHEN 知识点回顾 THEN 展示 10 个知识点（7 绿 3 红），错误项有详细解释
6. GIVEN 连胜 5 场 WHEN 结算页 THEN 显示 "5 连胜！获得 1 知语币" 奖励提示
7. GIVEN AI 对战结束 WHEN 结算页 THEN 显示 "AI 对战" 标记，不显示段位变化
8. GIVEN 多人对战结束 WHEN 结算页 THEN 显示排名列表（1-N 名），自己高亮
9. GIVEN 单人练习结束 WHEN 结算页 THEN 显示正确率、用时，不显示段位变化
10. GIVEN 结算页 WHEN 点击 "再来一局" THEN 导航到匹配页；点击 "返回大厅" THEN 导航到 /games

## UI 设计对照检查表（强制）

> 必须遵循 Cosmic Refraction 设计系统

- [ ] 毛玻璃效果: 结算卡片背景
- [ ] `backdrop-filter: blur(24px) saturate(1.8)`
- [ ] 禁止紫色: 无 purple/violet 色系
- [ ] 胜利配色: Amber/金色系为主（Rose 辅助）
- [ ] 失败配色: Sky/蓝色系为主（柔和鼓励）
- [ ] 星星颜色: 点亮=Amber, 未点亮=gray-600
- [ ] 动画流畅: 60fps，CSS transition/animation 为主
- [ ] Tailwind CSS v4: `@import "tailwindcss"` + `@theme`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 直接访问结算页 URL 并 mock 数据验证各状态
4. 验证胜利/失败/平局三种页面
5. 验证段位变化动画（加星/减星/晋级/掉段）
6. 验证知识点回顾列表
7. 验证操作按钮导航
8. 验证 AI 对战特殊标记
9. 验证多人对战排名

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，前端正常渲染
- [ ] 三种结算状态页面正确
- [ ] 段位变化动画流畅
- [ ] 知识点回顾正确
- [ ] 操作按钮导航正确
- [ ] 毛玻璃效果可见
- [ ] 无紫色元素
- [ ] 动画帧率稳定（无卡顿）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-011-fe-settlement.md`

## 自检重点

- [ ] 动画性能: 使用 CSS transform/opacity 动画，避免触发 layout
- [ ] 数据完整: 结算数据缺失时有 fallback（如 API 超时）
- [ ] AI 标记: AI 对战明确标注不影响段位
- [ ] 内存清理: 动画完成后清理定时器
- [ ] 路由守卫: 结算页需要有效 sessionId，无效则重定向到大厅

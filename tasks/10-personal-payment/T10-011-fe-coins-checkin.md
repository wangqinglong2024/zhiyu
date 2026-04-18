# T10-011: 前端 — 知语币与签到

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 14

## 需求摘要

实现「知语币」页面和「每日签到」功能的前端。知语币页面：余额展示（含美元等值）、交易记录列表（分页+全部/收入/支出筛选）、负数余额警告 Banner、充值入口。签到功能：签到日历（翻转动画）、签到抽奖弹窗（旋转+揭示动画）、连续签到天数展示、付费用户双倍标识。推荐页面：我的推荐码+QR码、推荐记录列表、里程碑进度。严格遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/04-zhiyu-coins.md` — 知语币系统 PRD
- 产品需求: `product/apps/09-personal-payment/06-referral.md` — 推荐系统 PRD
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- UI 精确参数: `grules/01-rules.md` §一 — 毛玻璃参数、色彩铁律、交互动效
- 编码规范: `grules/05-coding-standards.md` — 前端编码规范
- 关联任务: T10-004（知语币 API）、T10-007（推荐/签到 API）→ 本任务

## 技术方案

### 前端架构

```
src/features/coins/
├── pages/
│   ├── CoinsPage.tsx                — 知语币主页
│   ├── CheckinPage.tsx              — 签到日历页
│   └── ReferralPage.tsx             — 推荐好友页
├── components/
│   ├── CoinBalance.tsx              — 余额展示卡片
│   ├── NegativeBalanceBanner.tsx    — 负数余额警告横幅
│   ├── TransactionList.tsx          — 交易记录列表
│   ├── TransactionItem.tsx          — 交易记录行
│   ├── TransactionFilter.tsx        — 筛选 Tab（全部/收入/支出）
│   ├── CoinSourceGrid.tsx           — 获取途径 2×2 网格
│   ├── CheckinCalendar.tsx          — 签到日历
│   ├── CheckinDay.tsx               — 日历单日格子
│   ├── CheckinRewardDialog.tsx      — 签到抽奖弹窗
│   ├── StreakBadge.tsx              — 连续签到天数徽章
│   ├── PaidUserBadge.tsx            — 付费用户双倍标识
│   ├── ReferralCodeCard.tsx         — 推荐码展示 + 复制 + QR
│   ├── ReferralRecordList.tsx       — 推荐记录列表
│   └── MilestoneProgress.tsx        — 里程碑进度条
├── hooks/
│   ├── use-coin-balance.ts          — 余额查询 Hook
│   ├── use-transactions.ts          — 交易记录 Hook（无限滚动）
│   ├── use-checkin.ts               — 签到操作 + 日历 Hook
│   └── use-referral.ts              — 推荐码/记录 Hook
├── services/
│   ├── coin-service.ts              — 知语币 API
│   ├── checkin-service.ts           — 签到 API
│   └── referral-service.ts          — 推荐 API
└── types/
    └── index.ts
```

### 页面结构（知语币主页）

```
CoinsPage
├── CoinBalance (.glass-card 大卡片)
│   ├── "知语币余额" 标题
│   ├── 余额数字 text-4xl font-bold tabular-nums (Amber 色)
│   │   └── 负数时 text-[#ef4444] + 感叹号图标
│   ├── 等值美元 "≈ $3.20" text-sm opacity-60
│   └── 充值按钮（如果支持）
├── NegativeBalanceBanner (仅负数时显示)
│   ├── ⚠️ "您的知语币余额为负数"
│   ├── 说明文字"这是因为退款扣回了推荐奖励知语币"
│   └── "了解详情" 链接
├── CoinSourceGrid (2×2 获取途径)
│   ├── "每日签到" — 跳转签到页
│   ├── "推荐好友" — 跳转推荐页
│   ├── "游戏获胜" — 游戏中获取
│   └── "新人礼包" — 一次性
├── TransactionFilter [全部 | 收入 | 支出]
└── TransactionList (无限滚动)
    └── TransactionItem × N
        ├── 图标 (类型图标：签到/推荐/购买/退款/...)
        ├── 描述 "每日签到奖励"
        ├── 金额 "+3" (绿色) / "-600" (红色)
        └── 时间 "2026-04-01 09:23"
```

### 页面结构（签到日历页）

```
CheckinPage
├── Header "每日签到"
├── StreakBadge "连续签到 7 天" (Amber 色)
├── PaidUserBadge "付费用户 ×2" (Sky 色，仅付费用户显示)
├── CheckinCalendar
│   ├── 月份切换器 [< 2026 年 4 月 >]
│   └── 7×6 日历网格
│       └── CheckinDay × 42
│           ├── 已签到: Amber 色圆圈 + 硬币图标 + 奖励数字
│           ├── 今日未签到: 脉冲发光圆圈 "签" 字
│           ├── 今日已签到: Amber 色实心圆 + ✓
│           └── 未来/不可操作: 灰色
└── 签到按钮 (仅今日未签到时显示)
    └── 点击 → CheckinRewardDialog 弹窗
```

### 签到抽奖动画

```typescript
// CheckinRewardDialog 弹窗动画
// 1. 硬币旋转动画 (0.8s, CSS @keyframes spin)
// 2. 数字揭示动画 (fade-in + scale from 0.5 to 1.0)
// 3. 付费用户: "×2 加成!" 文字弹出 (bounce 动效)
// 4. 余额更新动画 (数字滚动效果 counter)

const CoinSpinKeyframes = `
@keyframes coin-spin {
  0% { transform: rotateY(0deg) scale(1); }
  50% { transform: rotateY(180deg) scale(1.2); }
  100% { transform: rotateY(360deg) scale(1); }
}
`
```

### 页面结构（推荐好友页）

```
ReferralPage
├── Header "推荐好友"
├── ReferralCodeCard (.glass-card)
│   ├── "你的推荐码"
│   ├── 推荐码 "ZY-A8K3M7" text-2xl font-mono tracking-wider
│   ├── [复制] [分享] 按钮
│   └── QR Code (前端 canvas 生成)
├── 返利说明卡片
│   ├── "邀请好友购课"
│   ├── "双方各获 订单金额 20% 知语币"
│   └── "30 天冷却期后自动到账"
├── MilestoneProgress
│   ├── 进度条 (3 → 10 → 30 → 100)
│   └── 当前进度标记
└── ReferralRecordList
    └── 推荐记录卡片 × N
        ├── 脱敏昵称 "知**生"
        ├── 状态标签 (冷却中/已确认/已取消)
        ├── 奖励金额 "+120 币"
        └── 时间
```

### 关键样式规格

| 元素 | 样式 |
|------|------|
| 余额数字 | `text-4xl font-bold tabular-nums` Amber-500 |
| 负数余额 | `text-[#ef4444]`，前缀感叹号 |
| 警告 Banner | `bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-4` |
| 交易金额正 | `text-emerald-500` 前缀 `+` |
| 交易金额负 | `text-[#ef4444]` 前缀 `-` |
| 签到日历格 | 40×40，已签到 Amber-500 圆形背景 |
| 今日签到 | 脉冲 `animate-pulse ring-2 ring-amber-400` |
| 推荐码字体 | `font-mono text-2xl tracking-wider` |
| QR Code | 180×180 白底圆角 |

## 范围（做什么）

- 实现知语币主页（余额 + 交易记录 + 负数警告 + 获取途径入口）
- 实现签到日历页（月历 + 签到操作 + 抽奖弹窗 + 连续天数 + 付费双倍）
- 实现推荐好友页（推荐码 + QR + 推荐记录 + 里程碑进度）
- 实现无限滚动交易记录
- 实现签到抽奖动画
- Light/Dark 双模式、响应式

## 边界（不做什么）

- 不实现知语币充值（P1 功能）
- 不实现推荐里程碑奖励领取（P1 功能）
- 不实现后端 API（T10-004、T10-007）

## 涉及文件

- 新建: `src/features/coins/pages/CoinsPage.tsx`
- 新建: `src/features/coins/pages/CheckinPage.tsx`
- 新建: `src/features/coins/pages/ReferralPage.tsx`
- 新建: `src/features/coins/components/CoinBalance.tsx`
- 新建: `src/features/coins/components/NegativeBalanceBanner.tsx`
- 新建: `src/features/coins/components/TransactionList.tsx`
- 新建: `src/features/coins/components/TransactionItem.tsx`
- 新建: `src/features/coins/components/TransactionFilter.tsx`
- 新建: `src/features/coins/components/CheckinCalendar.tsx`
- 新建: `src/features/coins/components/CheckinRewardDialog.tsx`
- 新建: `src/features/coins/components/ReferralCodeCard.tsx`
- 新建: `src/features/coins/components/MilestoneProgress.tsx`
- 新建: `src/features/coins/hooks/use-coin-balance.ts`
- 新建: `src/features/coins/hooks/use-transactions.ts`
- 新建: `src/features/coins/hooks/use-checkin.ts`
- 新建: `src/features/coins/hooks/use-referral.ts`
- 修改: `src/router/index.tsx` — 添加路由

## 依赖

- 前置: T10-004（知语币 API）、T10-007（签到/推荐 API）
- 后续: T10-014（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户余额 320 WHEN 进入知语币页面 THEN 显示 "320" Amber 色 + "≈ $3.20"
2. GIVEN 用户余额 -180 WHEN 进入知语币页面 THEN 数字红色 + 负数警告 Banner 显示
3. GIVEN 有 50 条交易 WHEN 滚动到底部 THEN 自动加载下一页
4. GIVEN 用户点击"收入"Tab WHEN 筛选 THEN 仅显示正数交易
5. GIVEN 今日未签到 WHEN 进入签到页 THEN 今日格子脉冲发光 + 签到按钮可点击
6. GIVEN 点击签到按钮 WHEN API 返回 base=3, multiplier=2, final=6 THEN 弹窗硬币旋转 → 揭示"3" → "×2 加成!" → "获得 6 知语币"
7. GIVEN 今日已签到 WHEN 进入签到页 THEN 今日格子为 Amber 实心 + ✓，签到按钮隐藏
8. GIVEN 用户切换月份 WHEN 查看 3 月签到 THEN 日历正确展示 3 月签到记录
9. GIVEN 推荐码页面 WHEN 点击复制按钮 THEN 推荐码复制到剪贴板 + Toast 提示
10. GIVEN 推荐了 5 人 WHEN 查看里程碑 THEN 进度条在 3 和 10 之间
11. GIVEN Light/Dark 模式 WHEN 切换 THEN 所有页面正确适配
12. GIVEN 375px 宽度 WHEN 查看知语币页面 THEN 布局正常无溢出

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. Browser MCP 导航到知语币页面
3. Browser MCP 导航到签到页面、推荐页面
4. 截图：Light + Dark 模式
5. 截图：375px / 768px / 1280px 三断点
6. 验证签到动画流程
7. 验证负数余额警告

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 知语币余额正确展示（正数 Amber / 负数红色）
- [ ] 负数警告 Banner 正确显示/隐藏
- [ ] 交易记录无限滚动 + 筛选正常
- [ ] 签到日历渲染正确
- [ ] 签到抽奖弹窗动画流畅
- [ ] 付费用户双倍标识正确
- [ ] 推荐码复制 + QR 码生成
- [ ] 里程碑进度条正确
- [ ] 响应式通过（375px / 768px / 1280px）
- [ ] Light/Dark 模式正确
- [ ] 色彩仅 Rose/Sky/Amber + 中性色
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-011-fe-coins-checkin.md`

## 自检重点

- [ ] UI：Cosmic Refraction 设计系统
- [ ] UI：色彩仅限 Rose/Sky/Amber
- [ ] 动画：签到抽奖弹窗流畅（硬币旋转 → 数字揭示 → 双倍弹出）
- [ ] 无限滚动：交易记录分页加载无闪烁
- [ ] 负数：余额负数红色 + Banner + 说明
- [ ] 剪贴板：navigator.clipboard.writeText + 降级处理
- [ ] QR Code：前端 canvas 生成，无后端调用

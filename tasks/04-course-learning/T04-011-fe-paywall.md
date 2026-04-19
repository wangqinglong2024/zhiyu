# T04-011: 前端页面 — 付费墙弹窗

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 8

## 需求摘要

实现课程付费墙 Bottom Sheet 弹窗组件，支持两种购买方式：①Paddle 在线支付（$6/Level，Overlay 模式）；②知语币兑换（600 币/Level，二次确认）。弹窗从底部上滑，包含 Level 内容预览、价格展示、知语币余额状态（4 种场景）、操作按钮。另含"全部购买"弹窗（L4-L12 打包，已购自动扣减）。支持支付状态流转和错误处理。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/03-paywall.md`（付费墙完整 PRD）
- 设计规范: `grules/06-ui-design.md`（Bottom Sheet 32px 圆角、毛玻璃、遮罩）
- 关联 API: T04-008（课程购买 API — Paddle 支付 + 知语币兑换）
- 关联 API: T04-005（Level 内容预览 API）
- 关联页面: T04-010（课程首页 — 锁定 Level 点击触发）

## 技术方案

### 组件架构

```
components/paywall/
├── PaywallSheet.tsx          — Bottom Sheet 容器（遮罩 + 滑入/滑出 + 拖拽关闭）
├── PaywallContent.tsx        — 内容区（Level 预览 + 价格 + 按钮）
├── CoinExchangeConfirm.tsx   — 知语币兑换二次确认弹窗
├── BuyAllSheet.tsx           — 全部购买弹窗
├── PaymentStatusOverlay.tsx  — 支付进行中 / 成功 / 失败状态覆盖层
└── hooks/
    ├── usePaywall.ts         — 付费墙状态管理（open/close + 当前 Level）
    └── usePayment.ts         — 支付流程管理（Paddle + 知语币）
```

### Bottom Sheet 行为

```
触发场景:
  - 课程首页点击锁定 Level
  - 完成 L3 后点击 L4
  - 入学测试推荐付费 Level

外观:
  - 顶部 32px 圆角 (rounded-3xl)
  - 毛玻璃背景 (.glass-card)
  - 遮罩 rgba(0,0,0,0.5)
  - 最大高度 85vh
  - 顶部拖拽指示条: 40×4px，灰色，居中

动画:
  - 弹入: 300ms Decelerate，从底部上滑
  - 弹出: 200ms Accelerate，向下滑出
  
关闭方式:
  - 遮罩点击
  - 下滑 > 100px 释放
  - 支付成功后自动关闭
```

### 内容区布局

```
┌──────────────────────────┐
│ ══════ (拖拽指示条)       │
│                          │
│ Level 5 · 成语故事       │  ← Level 名称
│ HSK 3 · B1              │  ← 标签（Amber 色）
│                          │
│ 📚 8 单元 · 42 课时      │  ← 内容概要
│ 📝 420 词汇 · 80 成语    │
│                          │
│       $6                 │  ← Display 48px Rose 色
│  ≈ ¥42 / ₫145,000       │  ← 本地化 Caption 灰色
│                          │
│ 知语币余额: 850          │  ← 4 种场景（见下方）
│                          │
│ ┌─────────┐ ┌──────────┐ │
│ │ Paddle  │ │ 知语币兑换│ │  ← 主/次按钮
│ │ 购买 $6 │ │ 600 币   │ │
│ └─────────┘ └──────────┘ │
│                          │
│ 「购买全部 Level」链接    │  ← 底部链接
└──────────────────────────┘
```

### 知语币余额 4 种场景

```
场景 1: 余额 ≥ 600
  显示: "知语币余额: 850" (绿色)
  兑换按钮: 可用

场景 2: 余额 > 0 但 < 600
  显示: "知语币余额: 350 (不足 600)" (Amber 色)
  兑换按钮: disabled, opacity 0.4

场景 3: 余额 = 0
  显示: "知语币余额: 0" (灰色)
  兑换按钮: disabled
  
场景 4: 未查到余额
  显示: "知语币余额: --" (灰色)
  兑换按钮: disabled
```

### 二次确认弹窗（知语币兑换）

```
模态居中弹窗:
  毛玻璃材质 (.glass-card)
  16px 圆角
  
  内容:
    "确认使用知语币兑换？"
    "将从您的账户扣除 600 知语币"
    "兑换后获得 Level 5 的 3 年使用权"
    
  按钮:
    "取消" (毛玻璃轮廓) + "确认兑换" (Rose 色)
    
  确认后 → 调用 coin-exchange API → Loading 态 → 成功/失败
```

### 全部购买弹窗

```
触发: 点击"购买全部 Level"链接
布局: 与主弹窗同结构的 Bottom Sheet

价格计算:
  原价 = 9 × $6 = $54（L4-L12 共 9 个）
  已购扣减 = 已购数量 × $6
  实际价格 = (9 - 已购数量) × $6

展示已购 Level 列表（划线 + ✅ 图标）
```

### Paddle 支付流程

```
1. 用户点击"Paddle 购买"
2. 前端调用 POST /api/v1/courses/purchase/paddle → 获取 checkout_url
3. 打开 Paddle Checkout Overlay
4. Paddle 处理支付
5. Paddle 回调:
   - 成功 → 关闭弹窗 → Level 节点更新 → Toast "购买成功"
   - 失败 → Toast "支付失败"
   - 取消 → 无提示，保持弹窗
6. Loading 最长 15s 超时
7. Webhook 延迟场景: Toast "支付处理中，稍后生效"
```

## 范围（做什么）

- PaywallSheet 组件（Bottom Sheet 容器 + 动画 + 拖拽关闭）
- PaywallContent 组件（Level 预览 + 价格 + 知语币 4 种场景 + 操作按钮）
- CoinExchangeConfirm 组件（二次确认弹窗 + API 调用）
- BuyAllSheet 组件（全部购买 + 已购扣减计算）
- PaymentStatusOverlay 组件（Loading / 成功 / 失败）
- Paddle Checkout Overlay 集成
- usePaywall Hook（状态管理）
- usePayment Hook（支付流程管理）

## 边界（不做什么）

- 不实现 Paddle Dashboard 配置
- 不实现知语币充值入口（属于 09-personal-payment）
- 不实现退款流程前端（管理后台功能）

## 涉及文件

- 新建: `frontend/src/components/paywall/PaywallSheet.tsx`
- 新建: `frontend/src/components/paywall/PaywallContent.tsx`
- 新建: `frontend/src/components/paywall/CoinExchangeConfirm.tsx`
- 新建: `frontend/src/components/paywall/BuyAllSheet.tsx`
- 新建: `frontend/src/components/paywall/PaymentStatusOverlay.tsx`
- 新建: `frontend/src/components/paywall/hooks/usePaywall.ts`
- 新建: `frontend/src/components/paywall/hooks/usePayment.ts`
- 修改: `frontend/src/api/courses.ts` — 购买相关 API 调用函数

## 依赖

- 前置: T04-008（课程购买 API — Paddle + 知语币兑换）
- 前置: T04-005（Level 预览 API）
- 前置: T02-011（全局框架 — Toast、Modal 基础组件）
- 后续: 无（本组件被 T04-010、T04-012 调用）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 锁定 Level **WHEN** 点击 Level 节点 **THEN** Bottom Sheet 从底部上滑 300ms
2. **GIVEN** 付费墙已打开 **WHEN** 点击遮罩 **THEN** 弹窗下滑 200ms 关闭
3. **GIVEN** 付费墙已打开 **WHEN** 下滑超过 100px 释放 **THEN** 弹窗关闭
4. **GIVEN** Level 5 付费墙 **WHEN** 查看内容区 **THEN** 显示 Level 5 名称 + HSK 3 + 内容概要 + $6 价格
5. **GIVEN** 知语币余额 = 850 **WHEN** 查看兑换按钮 **THEN** 余额绿色显示，兑换按钮可用
6. **GIVEN** 知语币余额 = 350 **WHEN** 查看兑换按钮 **THEN** 余额 Amber 色 + "(不足 600)"，兑换按钮 disabled
7. **GIVEN** 用户点击 Paddle 购买 **WHEN** API 返回 checkout_url **THEN** 打开 Paddle Checkout Overlay
8. **GIVEN** Paddle 支付成功 **WHEN** 回调触发 **THEN** 弹窗关闭 + Toast "购买成功" + Level 节点状态更新
9. **GIVEN** 用户点击知语币兑换 **WHEN** 确认弹窗出现 **THEN** 显示扣除详情（600 币 + 3 年使用权）
10. **GIVEN** 确认兑换 + 余额充足 **WHEN** API 成功 **THEN** 弹窗关闭 + Toast "兑换成功"
11. **GIVEN** 已购买 L4、L5 **WHEN** 打开全部购买弹窗 **THEN** 价格 = (9-2) × $6 = $42，L4/L5 显示 ✅ 划线
12. **GIVEN** 暗色模式 **WHEN** 查看付费墙 **THEN** 毛玻璃/颜色符合 Dark 主题
13. **GIVEN** 支付 Loading 超过 15s **WHEN** 超时 **THEN** Toast "支付处理中，稍后生效"

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 通过 Browser MCP 访问课程首页
3. 点击锁定 Level → 验证 Bottom Sheet 弹出
4. 验证内容区（Level 信息 + 价格 + 知语币余额）
5. 验证关闭方式（遮罩点击 / 下滑）
6. 测试 Paddle 购买流程（Mock 或 Paddle 沙箱）
7. 测试知语币兑换流程（二次确认 + 成功/失败）
8. 测试全部购买弹窗（已购扣减计算）
9. 验证 Dark / Light 模式
10. 截图留存

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] Bottom Sheet 弹出/关闭动画流畅
- [ ] 知语币 4 种余额场景正确
- [ ] Paddle 支付流程正确
- [ ] 知语币兑换流程正确（含二次确认）
- [ ] 全部购买价格计算正确
- [ ] Dark/Light 模式正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-011-fe-paywall.md`

## 自检重点

- [ ] 设计: Bottom Sheet 32px 圆角 + 毛玻璃
- [ ] 设计: 价格 Display 48px Rose 色
- [ ] 设计: 严格三色（Rose/Sky/Amber），无紫色
- [ ] 交互: 拖拽关闭阈值 100px
- [ ] 交互: Paddle Overlay 模式（非跳转）
- [ ] 安全: 前端不暴露 Paddle API Key（服务端创建 Session）
- [ ] 无障碍: Bottom Sheet Focus Trap，ESC 关闭
- [ ] 不使用 tailwind.config.js

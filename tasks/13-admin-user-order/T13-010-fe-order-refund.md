# T13-010: 前端 — 订单与退款管理页 (FE Order & Refund Page)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 14

## 需求摘要

实现管理后台「订单管理」和「退款管理」的完整前端页面。包含：① 订单列表页（4 统计卡 + 搜索 + 筛选 + 排序 + 分页表格），② 订单详情页（6 信息区块），③ 退款发起弹窗（影响预览 + 原因表单 + 二次确认），④ 退款列表页（筛选 + 分页），⑤ 知语币管理页面（总览仪表盘 + 手动调整弹窗 + 负余额/大额告警 + 流水列表）。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/04-order-management.md` — 订单管理 PRD
- 产品需求: `product/admin/03-admin-user-order/05-refund.md` — 退款管理 PRD
- 产品需求: `product/admin/03-admin-user-order/06-coin-management.md` — 知语币管理 PRD
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 后端 API: T13-004（订单 API）、T13-005（退款 API）、T13-006（知语币 API）

## 技术方案

### 路由

```
/admin/orders           → OrderListPage      订单列表
/admin/orders/:orderId  → OrderDetailPage     订单详情
/admin/refunds          → RefundListPage      退款列表
/admin/coins            → CoinManagementPage  知语币管理
```

### 一、订单列表页

#### 页面布局

```
┌─────────────────────────────────────────────────────┐
│ [H2] 订单管理                    [🔍 搜索框 360px]   │
├─────────────────────────────────────────────────────┤
│ 统计卡 × 4 (glass-card):                             │
│ [总订单 | 总金额 | 退款数 | 退款金额]                  │
├─────────────────────────────────────────────────────┤
│ [状态▼] [课程Level▼多选] [日期📅] [金额范围] [重置]    │
├─────────────────────────────────────────────────────┤
│ .glass-card 订单表格                                  │
│ 列: 订单号 | 用户 | 课程 | 金额↓ | 支付方式 |         │
│     Paddle交易号 | 日期↓ | 状态 | 操作                │
│ 分页: 共 X 条 · 第 X/Y 页                            │
└─────────────────────────────────────────────────────┘
```

#### 统计卡设计

```
4 张 .glass-card 水平排列，响应式 grid-cols-4
每张卡片: 图标(左) + 标签(上) + 数值(下, 大字等宽)
- 总订单数: Lucide ShoppingCart, Sky 色
- 总金额: Lucide DollarSign, Amber 色
- 退款数: Lucide RotateCcw, Rose 色
- 退款金额: Lucide TrendingDown, Rose 色
统计数据跟随筛选条件实时更新
```

#### 订单状态标签

```
completed → 绿色标签 "已完成"
refunding → 橙色(Amber)标签 "退款中"
refunded → 红色(Rose)标签 "已退款"
```

#### 操作列

```
查看详情: Sky 文字按钮 → /admin/orders/:orderId
发起退款: Rose 文字按钮（仅 completed 状态显示）→ 打开退款弹窗
```

### 二、订单详情页

#### 页面布局

```
面包屑: 订单管理 > 订单详情 (订单号)

6 个信息区块 (各自 .glass-card):
┌──────────────┐ ┌──────────────┐
│ 订单信息      │ │ 用户信息      │
└──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│ 课程信息      │ │ 支付信息      │
│ (进度条+有效期)│ │ (Paddle费+净收入)│
└──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│ 推荐返利信息  │ │ 退款信息      │
│ (冷却天数)    │ │ (如有)        │
└──────────────┘ └──────────────┘
```

#### 区块字段

```
1. 订单信息: 订单号/创建时间/支付时间/状态
2. 用户信息: 头像+昵称(可点击→用户详情)/邮箱
3. 课程信息: Level/课程名/有效期/进度条(Sky渐变)/是否已回收
4. 支付信息: 金额/币种/支付方式/Paddle交易号/Paddle手续费/净收入
5. 推荐返利: 推荐人(可点击)/返利金额/状态(issued/cooling/clawed_back)/冷却剩余天数
6. 退款信息: 退款单号/日期/金额/原因/操作人/状态/课程回收/返利扣回
```

### 三、退款发起弹窗

```
弹窗: Modal 520px, Level 4 阴影

Step 1 — 影响预览:
  调用 refund impact preview API
  展示: 课程名(将被回收) + 推荐返利(将被扣回 X 币) + 推荐人当前余额 → 扣回后余额
  警告色面板: Amber 背景

Step 2 — 退款表单:
  退款原因: 下拉单选 (用户申请/课程质量/系统错误/其他)
  补充说明: 多行文本 (选择"其他"时必填)
  退款金额: 数字输入 (默认=订单金额, 不可超过订单金额)

Step 3 — 二次确认:
  "确认退款？此操作将立即回收课程权限并扣回推荐返利，不可撤销。"
  确认按钮: 危险按钮 → Loading → 成功后关闭 + Toast + 刷新

幂等保护: 确认按钮点击后 Disabled，防重复提交
```

### 四、退款列表页

```
路由: /admin/refunds
筛选: 状态(全部/处理中/已完成/失败) + 日期范围 + 操作人
表格列: 退款单号 | 关联订单 | 用户 | 金额 | 原因 | 操作人 | 日期 | 状态
状态: processing=Amber, completed=绿, failed=Rose
```

### 五、知语币管理页面

```
路由: /admin/coins

┌─────────────────────────────────────────────────────┐
│ [H2] 知语币管理                                       │
├─────────────────────────────────────────────────────┤
│ 统计卡 × 4:                                          │
│ [累计发放 | 累计消耗 | 当前流通 | 负余额人数]           │
├─────────────────────────────────────────────────────┤
│ 趋势图 (30天): 发放量(Sky) + 消耗量(Amber) 双折线     │
├─────────────────────────────────────────────────────┤
│ Tab: [流水记录] [负余额监控] [大额告警]                │
│ 流水记录: 表格 + 筛选(类型/来源/日期)                  │
│ 负余额监控: 表格(用户/余额/原因)                      │
│ 大额告警: 表格(用户/日交易量/笔数/日期)               │
├─────────────────────────────────────────────────────┤
│ [手动调整余额] 按钮 → 弹窗                            │
└─────────────────────────────────────────────────────┘
```

#### 手动调整弹窗

```
弹窗: 480px
字段:
  用户ID: 文本输入(必填, UUID 格式)
  操作类型: 增加 / 扣减 (下拉单选)
  金额: 数字输入 (1~100,000)
  原因分类: 补偿/纠错/活动奖励/惩罚扣除/其他
  原因详情: 多行文本(必填)

校验:
  增加: 调整后余额 ≤ 100,000
  扣减: 允许至负数（显示警告）

二次确认 → API 调用 → Toast + 刷新
```

### 组件结构

```typescript
// 订单
frontend/src/pages/admin/orders/OrderListPage.tsx
frontend/src/pages/admin/orders/OrderDetailPage.tsx
frontend/src/pages/admin/orders/components/OrderSummaryCards.tsx
frontend/src/pages/admin/orders/components/OrderTable.tsx
frontend/src/pages/admin/orders/components/OrderFilters.tsx
frontend/src/pages/admin/orders/components/OrderDetailBlocks.tsx
frontend/src/pages/admin/orders/components/RefundModal.tsx

// 退款
frontend/src/pages/admin/refunds/RefundListPage.tsx

// 知语币
frontend/src/pages/admin/coins/CoinManagementPage.tsx
frontend/src/pages/admin/coins/components/CoinOverviewCards.tsx
frontend/src/pages/admin/coins/components/CoinTrendChart.tsx
frontend/src/pages/admin/coins/components/CoinTransactionList.tsx
frontend/src/pages/admin/coins/components/NegativeBalanceList.tsx
frontend/src/pages/admin/coins/components/HighVolumeAlerts.tsx
frontend/src/pages/admin/coins/components/CoinAdjustModal.tsx
```

## 范围（做什么）

- 创建订单列表页（4 统计卡 + 搜索 + 筛选 + 排序 + 分页 + 状态标签）
- 创建订单详情页（面包屑 + 6 信息区块 + 跳转链接）
- 创建退款发起弹窗（影响预览 + 表单 + 二次确认 + 幂等保护）
- 创建退款列表页（筛选 + 分页 + 状态标签）
- 创建知语币管理页面（总览卡 + 趋势图 + 3 Tab + 手动调整弹窗）
- 路由注册 + 侧边栏导航项

## 边界（不做什么）

- 不实现后端 API（T13-004/005/006 已完成）
- 不实现 Paddle 对账功能的手动触发（P2）
- 不实现知语币过期管理（P2）
- 不实现趋势图的缩放/拖拽交互

## 涉及文件

- 新建: `frontend/src/pages/admin/orders/OrderListPage.tsx`
- 新建: `frontend/src/pages/admin/orders/OrderDetailPage.tsx`
- 新建: `frontend/src/pages/admin/orders/components/OrderSummaryCards.tsx`
- 新建: `frontend/src/pages/admin/orders/components/OrderTable.tsx`
- 新建: `frontend/src/pages/admin/orders/components/OrderFilters.tsx`
- 新建: `frontend/src/pages/admin/orders/components/OrderDetailBlocks.tsx`
- 新建: `frontend/src/pages/admin/orders/components/RefundModal.tsx`
- 新建: `frontend/src/pages/admin/refunds/RefundListPage.tsx`
- 新建: `frontend/src/pages/admin/coins/CoinManagementPage.tsx`
- 新建: `frontend/src/pages/admin/coins/components/CoinOverviewCards.tsx`
- 新建: `frontend/src/pages/admin/coins/components/CoinTrendChart.tsx`
- 新建: `frontend/src/pages/admin/coins/components/CoinAdjustModal.tsx`
- 修改: `frontend/src/router/admin.tsx` — 注册 4 条路由
- 修改: `frontend/src/components/admin/Sidebar.tsx` — 添加导航项

## 依赖

- 前置: T13-004/T13-005/T13-006（后端 API）、T11-001/T11-002（管理后台框架）
- 后续: T13-011（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员进入 `/admin/orders`
   **WHEN** 页面加载完成
   **THEN** 展示 4 统计卡 + 搜索栏 + 筛选 + 订单表格 + 分页

2. **GIVEN** 选择筛选条件 status=completed + levels=L4,L5
   **WHEN** 筛选生效
   **THEN** 统计卡数据跟随筛选条件更新

3. **GIVEN** 在订单列表点击"查看详情"
   **WHEN** 进入订单详情页
   **THEN** 展示 6 信息区块完整数据

4. **GIVEN** 订单详情中有推荐返利且冷却中
   **WHEN** 查看推荐返利区块
   **THEN** 显示冷却剩余天数

5. **GIVEN** 在 completed 订单上点击"发起退款"
   **WHEN** 退款弹窗打开
   **THEN** 先展示影响预览（课程回收+返利扣回详情），再显示表单

6. **GIVEN** 退款表单填写完成后点击确认
   **WHEN** 二次确认弹窗中点击确认
   **THEN** 按钮 Loading + Disabled 防重复 → 成功后关闭 + Toast + 订单状态变为 refunding

7. **GIVEN** 管理员进入 `/admin/refunds`
   **WHEN** 页面加载完成
   **THEN** 展示退款列表 + 筛选 + 分页，状态标签配色正确

8. **GIVEN** 管理员进入 `/admin/coins`
   **WHEN** 页面加载完成
   **THEN** 展示 4 统计卡 + 30 天趋势图 + 流水记录 Tab

9. **GIVEN** 点击"手动调整余额"
   **WHEN** 输入增加 300 币给用户（当前余额 99,800）
   **THEN** 提示"调整后余额超过上限 100,000"

10. **GIVEN** 点击"手动调整余额"
    **WHEN** 输入扣减 500 币（用户余额 200）
    **THEN** 显示警告"调整后余额将为 -300" + 允许提交

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 订单列表页：统计卡 + 搜索 + 筛选 + 排序 + 分页
3. 订单详情页：6 区块数据完整性
4. 退款弹窗：影响预览 + 表单校验 + 二次确认 + 幂等
5. 退款列表页：筛选 + 状态标签
6. 知语币总览：4 卡 + 趋势图
7. 手动调整弹窗：上限校验 + 负余额警告
8. 负余额监控 + 大额告警列表

### 测试通过标准

- [ ] Docker 构建成功
- [ ] 订单列表 4 统计卡跟随筛选
- [ ] 订单详情 6 区块完整
- [ ] 退款影响预览正确
- [ ] 退款幂等保护（Disabled 按钮）
- [ ] 知语币趋势图渲染
- [ ] 手动调整上限/负余额校验
- [ ] 所有状态标签配色正确
- [ ] Cosmic Refraction 设计规范
- [ ] 无 purple 色
- [ ] Tailwind CSS v4

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-010-fe-order-refund.md`

## 自检重点

- [ ] 统计卡跟随筛选条件实时更新
- [ ] 退款影响预览先于表单展示
- [ ] 退款确认按钮 Disabled 防重复
- [ ] 知语币趋势图使用轻量图表库（如 Recharts）
- [ ] 手动调整负余额场景显示警告但不阻断
- [ ] 订单详情用户昵称可跳转用户详情
- [ ] Cosmic Refraction: 毛玻璃 + blur(24px) saturate(1.8)
- [ ] Rose/Sky/Amber 三色
- [ ] 无 console.log / any

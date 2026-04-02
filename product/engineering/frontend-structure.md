# 工程文档：前端项目结构（React + TypeScript）

> 技术栈：React 18 + TypeScript + Tailwind CSS + Framer Motion
> 部署方式：Nginx 静态托管，SPA，所有路由 fallback 到 index.html

---

## 一、目录结构

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts             # 构建工具：Vite
│
├── src/
│   ├── main.tsx               # 入口，挂载 App
│   ├── App.tsx                # Router 配置（React Router v6）
│   │
│   ├── pages/                 # 页面组件（一个路由一个文件）
│   │   ├── HomePage.tsx       # / 类目选择
│   │   ├── AnalyzePage.tsx    # /analyze/:category 输入困境
│   │   ├── PayingPage.tsx     # /paying/:orderId 支付等待/轮询
│   │   ├── GeneratingPage.tsx # /generating/:orderId AI生成中
│   │   ├── ReportPage.tsx     # /report/:orderId 报告展示
│   │   ├── ProfilePage.tsx    # /profile 我的（历史记录+收益）
│   │   ├── LoginPage.tsx      # /login 手机号验证码登录
│   │   └── InvitePage.tsx     # /invite/:code 邀请落地页
│   │
│   ├── components/            # 可复用组件
│   │   ├── layout/
│   │   │   ├── MeshBackground.tsx  # 固定 CSS Mesh Gradient 暗金背景
│   │   │   └── GlassPanel.tsx      # 毛玻璃面板通用组件
│   │   ├── report/
│   │   │   ├── ReportCard.tsx      # 报告展示卡片（核心症结/路径/升维）
│   │   │   └── PosterGenerator.tsx # html2canvas 海报生成
│   │   ├── profile/
│   │   │   ├── WalletCard.tsx      # 收益中心卡片
│   │   │   └── OrderHistory.tsx    # 历史报告列表（下拉加载）
│   │   └── common/
│   │       ├── Button.tsx          # 主/次按钮（鎏金渐变/透明描边）
│   │       ├── Input.tsx           # 输入框（底部下划线，聚焦金色光晕）
│   │       └── Disclaimer.tsx      # 免责声明固定底部组件
│   │
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useAuth.ts         # 读取/刷新 JWT，未登录跳转
│   │   ├── useOrderStatus.ts  # 轮询订单状态（每2秒，最多30秒）
│   │   └── useWithdrawal.ts   # 提现申请逻辑
│   │
│   ├── api/                   # 所有接口请求封装
│   │   ├── client.ts          # axios 实例，统一注入 Bearer JWT
│   │   ├── auth.ts            # 认证相关接口
│   │   ├── orders.ts          # 订单相关接口
│   │   ├── commissions.ts     # 佣金/钱包接口
│   │   └── withdrawals.ts     # 提现接口
│   │
│   ├── store/                 # 全局状态（Zustand）
│   │   ├── authStore.ts       # token、user_id、phone（脱敏）
│   │   └── settingsStore.ts   # 系统设置（价格、公告等）
│   │
│   └── types/
│       ├── supabase.ts        # 自动生成（supabase gen types）
│       └── api.ts             # API 请求/响应类型定义
│
└── admin/                     # 管理端（独立子项目或同仓库子目录）
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   ├── OrdersPage.tsx
    │   │   ├── WithdrawalsPage.tsx
    │   │   ├── UsersPage.tsx
    │   │   └── SettingsPage.tsx
    │   └── ...
    └── package.json
```

---

## 二、路由配置

```tsx
// App.tsx
<Routes>
  {/* 公开路由 */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/invite/:code" element={<InvitePage />} />

  {/* 需要登录 */}
  <Route element={<AuthGuard />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/analyze/:category" element={<AnalyzePage />} />
    <Route path="/paying/:orderId" element={<PayingPage />} />
    <Route path="/generating/:orderId" element={<GeneratingPage />} />
    <Route path="/report/:orderId" element={<ReportPage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Route>
</Routes>
```

---

## 三、状态管理原则

- **全局状态（Zustand）**：登录态（token + user_id）、系统设置
- **服务端状态（React Query）**：订单列表、钱包余额、提现记录（自动缓存+失效）
- **本地状态（useState）**：表单输入、UI 交互状态

---

## 四、支付跳转流程

```
AnalyzePage
  └─ 点击付款 → POST /orders/create → 获得 {order_id, pay_url}
      └─ window.location.href = pay_url（微信 MWEB 跳转）
          或 wx.chooseWXPay()（微信 JSAPI，需 JS-SDK 初始化）
          或 window.location.href = alipay_url（支付宝 H5）
  └─ 跳转到 PayingPage?order_id=xxx（支付完成后回跳）
      └─ useOrderStatus 轮询 GET /orders/{id}/status
          ├─ paid → navigate('/generating/:orderId')
          └─ 超时30秒 → 提示「支付确认中」，继续后台轮询
```

---

## 五、管理端技术选型

- 组件库：Ant Design（表格、弹窗、Form 都有）
- 图表：Recharts（收入折线图）
- 状态：React Query（数据获取）+ 本地 useState（表单）
- 路由：React Router v6
- 不需要移动端适配，桌面端 1280px 宽度优先

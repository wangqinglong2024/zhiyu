# T13-008: 前端 — 用户详情页 (FE User Detail Page)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12

## 需求摘要

实现管理后台「用户详情页」，包含面包屑导航 + 基本信息卡片 + 6 个 Tab 页面。基本信息区包含头像/昵称/邮箱/注册时间/用户类型/状态/国家/段位及操作按钮（封禁/解封）。6 个 Tab 分别展示：学习进度、游戏数据、消费记录、知语币流水、推荐关系、封禁历史。每个 Tab 数据独立加载（懒加载），避免初次进入时过多请求。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/02-user-detail.md` — 用户详情完整 PRD
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 后端 API: T13-002 — 用户详情 API（7 个子端点）
- 封禁操作: T13-009 — 封禁管理前端（复用弹窗组件）

## 技术方案

### 路由

```
/admin/users/:userId → UserDetailPage
```

### 页面布局

```
┌─────────────────────────────────────────────────────┐
│ 面包屑: 用户管理 > 用户详情 (昵称)                      │
├─────────────────────────────────────────────────────┤
│ .glass-card 基本信息                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [64px头像] 昵称                    [封禁用户] 按钮│ │
│ │            ID: xxx | 邮箱 | 注册 | 类型 | 段位    │ │
│ │            国家/地区 | 状态(正常/封禁中)          │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Tab: [学习进度] [游戏数据] [消费记录] [知语币] [推荐] [封禁历史] │
├─────────────────────────────────────────────────────┤
│ Tab 内容区域（独立加载 + 骨架屏）                      │
└─────────────────────────────────────────────────────┘
```

### 组件结构

```typescript
// frontend/src/pages/admin/users/UserDetailPage.tsx
// 页面主组件：面包屑 + 基本信息卡 + Tab 容器

// frontend/src/pages/admin/users/components/UserBasicInfoCard.tsx
// 基本信息卡：头像/昵称/邮箱/注册时间/类型/段位/国家/状态 + 操作按钮

// frontend/src/pages/admin/users/components/tabs/LearningTab.tsx
// Tab 1: 学习进度 — 已购课程列表/进度/有效期/学习时长

// frontend/src/pages/admin/users/components/tabs/GamingTab.tsx
// Tab 2: 游戏数据 — 段位/积分/场次/胜率/最近对局记录

// frontend/src/pages/admin/users/components/tabs/SpendingTab.tsx
// Tab 3: 消费记录 — 订单列表/金额/状态/日期

// frontend/src/pages/admin/users/components/tabs/CoinsTab.tsx
// Tab 4: 知语币流水 — 流水列表/类型/来源/余额变动

// frontend/src/pages/admin/users/components/tabs/ReferralsTab.tsx
// Tab 5: 推荐关系 — 推荐人信息/被推荐人列表/返利统计

// frontend/src/pages/admin/users/components/tabs/BanHistoryTab.tsx
// Tab 6: 封禁历史 — 封禁/解封时间线/原因/操作人

// frontend/src/pages/admin/users/hooks/useUserDetail.ts
// 基本信息 + 当前 Tab 数据获取 Hook
```

### Cosmic Refraction 设计要点

```
面包屑: 灰色文字 > Sky 色当前项
基本信息卡: .glass-card, rounded-2xl, padding 24px
头像: 64px 圆形, 无头像显示 Lucide User 灰色圆形
Tab 栏: 毛玻璃底部边框, 选中态 Sky 下划线 2px + 白色文字, 未选中灰色 #a3a3a3
Tab 内容区: .glass-card, rounded-2xl, margin-top 16px
封禁按钮(正常): 危险按钮 .glass-button-danger (#ef4444)
解封按钮(封禁中): 成功按钮 (#22c55e)
状态指示: 正常=绿色圆点, 封禁中=红色圆点+封禁到期日
段位: 16px 图标 + 段位名
用户类型标签: 同列表页配色
```

### Tab 数据加载策略

```
- 进入页面: 仅请求基本信息 GET /api/v1/admin/users/:userId
- 默认展示: 第一个 Tab（学习进度）
- 切换 Tab: 懒加载 —— 首次切换时请求，数据缓存在前端状态中
- 每个 Tab 独立骨架屏 Loading 态
- Tab 数据获取失败: 独立展示错误态 + 重试按钮
```

### 各 Tab 数据展示

#### Tab 1: 学习进度
```
- 课程卡片列表（每张: 课程名/Level/进度百分比/学习时长/有效期/状态）
- 进度条: Sky 渐变
- 已过期: 标签红色 "已过期"
- 已回收(退款): 标签灰色 "已回收"
- 空态: "该用户尚未购买任何课程"
```

#### Tab 2: 游戏数据
```
- 段位信息卡: 当前段位图标 + 名称 + 积分
- 统计卡: 总场次 / 胜率 / 连胜最高 / 最近 7 天活跃
- 最近对局记录表格: 游戏名/对手/结果/积分变动/时间
```

#### Tab 3: 消费记录
```
- 消费统计: 累计消费 $X.XX / 订单数 X
- 订单列表表格: 订单号/课程/金额/支付方式/日期/状态
- 状态: completed=绿, refunded=红, refunding=橙
- 点击订单号 → 跳转订单详情 (T13-010)
```

#### Tab 4: 知语币流水
```
- 余额卡: 当前余额（大字），负数红色
- 流水表格: 时间/类型(+/-)/金额/来源/余额变动/备注
- 来源图标: 签到/游戏/推荐/购买/退款/管理员手动
- 筛选: 类型(全部/收入/支出) + 日期范围
```

#### Tab 5: 推荐关系
```
- 推荐人信息: 如有推荐人，展示头像+昵称+ID (可点击跳转)
- 被推荐人列表: 表格 —— 用户/注册日期/是否付费/返利金额/返利状态
- 统计: 总推荐人数 / 有效推荐数 / 累计返利
```

#### Tab 6: 封禁历史
```
- 时间线布局 (Timeline)
- 每条记录: 封禁时间/原因/期限/操作管理员/解封时间/解封方式/解封管理员
- 当前封禁: 顶部高亮标记
- 空态: "该用户无封禁记录"
```

## 范围（做什么）

- 创建 `UserDetailPage` 页面组件（路由 `/admin/users/:userId`）
- 实现面包屑导航组件
- 实现基本信息卡片组件（头像/各字段/操作按钮）
- 实现 6 个 Tab 组件 + Tab 切换 + 懒加载
- 实现 `useUserDetail` 数据 Hook
- 每个 Tab 独立 Loading 骨架屏 + Error 态
- 路由注册

## 边界（不做什么）

- 不实现封禁/解封弹窗组件（T13-009 复用）
- 不实现后端 API（T13-002 已完成）
- 不实现知语币手动调整操作（T13-010 知语币管理页面）
- 不实现游戏对局数据的详情弹窗

## 涉及文件

- 新建: `frontend/src/pages/admin/users/UserDetailPage.tsx` — 页面主组件
- 新建: `frontend/src/pages/admin/users/components/UserBasicInfoCard.tsx` — 基本信息卡
- 新建: `frontend/src/pages/admin/users/components/tabs/LearningTab.tsx`
- 新建: `frontend/src/pages/admin/users/components/tabs/GamingTab.tsx`
- 新建: `frontend/src/pages/admin/users/components/tabs/SpendingTab.tsx`
- 新建: `frontend/src/pages/admin/users/components/tabs/CoinsTab.tsx`
- 新建: `frontend/src/pages/admin/users/components/tabs/ReferralsTab.tsx`
- 新建: `frontend/src/pages/admin/users/components/tabs/BanHistoryTab.tsx`
- 新建: `frontend/src/pages/admin/users/hooks/useUserDetail.ts` — 数据 Hook
- 修改: `frontend/src/router/admin.tsx` — 注册 `/admin/users/:userId` 路由

## 依赖

- 前置: T13-002（后端 API）、T13-007（用户列表页路由跳转）
- 后续: T13-009（封禁弹窗复用）、T13-010（订单详情跳转）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 从用户列表点击"查看详情"
   **WHEN** 页面加载完成
   **THEN** 展示面包屑（用户管理 > 用户详情 (昵称)）+ 基本信息卡 + 默认第一个 Tab

2. **GIVEN** 用户状态为"正常"
   **WHEN** 查看基本信息卡
   **THEN** 展示绿色圆点"正常"状态 + "封禁用户"危险按钮

3. **GIVEN** 用户状态为"封禁中"
   **WHEN** 查看基本信息卡
   **THEN** 展示红色圆点"封禁中"+ 封禁到期日 + "解封用户"成功按钮

4. **GIVEN** 首次进入详情页
   **WHEN** 页面渲染
   **THEN** 仅请求基本信息 + 学习进度（默认 Tab），其他 Tab 不请求

5. **GIVEN** 切换到"游戏数据" Tab
   **WHEN** 首次切换
   **THEN** 展示骨架屏 → 请求 `/gaming` 端点 → 展示游戏数据

6. **GIVEN** 再次切回"学习进度" Tab
   **WHEN** 已有缓存数据
   **THEN** 直接展示（不重复请求）

7. **GIVEN** 某 Tab 数据获取失败
   **WHEN** 查看该 Tab
   **THEN** 展示错误态 + "重试"按钮，不影响其他 Tab

8. **GIVEN** 消费记录 Tab 中点击订单号
   **WHEN** 点击
   **THEN** 跳转到订单详情页

9. **GIVEN** 推荐关系 Tab 中有推荐人
   **WHEN** 点击推荐人昵称
   **THEN** 跳转到该推荐人的详情页

10. **GIVEN** 用户无封禁记录
    **WHEN** 查看封禁历史 Tab
    **THEN** 展示"该用户无封禁记录"空态

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. Browser MCP 从用户列表跳转到用户详情
3. 验证基本信息卡渲染完整性
4. 逐个切换 6 个 Tab，验证数据加载和展示
5. 验证 Tab 懒加载（Network 面板确认请求时机）
6. 验证封禁/解封按钮条件显示
7. 验证面包屑导航和返回
8. 测试错误态和空态

### 测试通过标准

- [ ] Docker 构建成功，前端容器正常运行
- [ ] 面包屑导航正确（含用户昵称）
- [ ] 基本信息卡完整渲染（头像/昵称/邮箱/注册时间/类型/段位/国家/状态）
- [ ] 6 个 Tab 切换正常 + 数据正确展示
- [ ] Tab 懒加载（首次切换才请求）
- [ ] 数据缓存（切回不重复请求）
- [ ] 各 Tab 骨架屏 Loading 态正常
- [ ] 封禁/解封按钮条件显示正确
- [ ] Cosmic Refraction 设计规范一致
- [ ] 无 purple 色

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-008-fe-user-detail.md`

## 自检重点

- [ ] Tab 懒加载：React.lazy 或条件渲染 + useEffect
- [ ] Cosmic Refraction: 毛玻璃卡片、blur(24px) saturate(1.8)
- [ ] Rose/Sky/Amber 三色限定
- [ ] Tailwind CSS v4 语法
- [ ] 各 Tab 独立错误处理，不级联
- [ ] 头像缺失 fallback Lucide User
- [ ] 面包屑包含用户昵称（动态）
- [ ] 无 console.log / any 类型

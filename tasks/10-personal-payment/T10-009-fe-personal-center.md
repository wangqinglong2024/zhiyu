# T10-009: 前端 — 个人中心首页

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12

## 需求摘要

实现应用端 Tab 4「个人中心」首页和个人资料编辑页的前端。个人中心首页包含用户信息区（头像/昵称/注册时间）、段位展示栏、2×2 学习数据统计卡片、功能菜单列表。个人资料编辑页包含头像上传裁剪、昵称/性别/生日/国家/学习目标编辑。需处理访客模式（未登录引导）、Skeleton 加载态、离线缓存、部分加载。严格遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/01-personal-center.md` — 个人中心主页完整 PRD
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- UI 精确参数: `grules/01-rules.md` §一 — 毛玻璃参数、色彩铁律、交互动效
- 编码规范: `grules/05-coding-standards.md` — 前端编码规范
- 关联任务: T10-004（知语币 API）、T10-008（个人资料 API）→ 本任务

## 技术方案

### 前端架构

```
src/features/personal/
├── pages/
│   ├── PersonalCenterPage.tsx      — 个人中心首页（Tab 4）
│   └── ProfileEditPage.tsx         — 个人资料编辑页
├── components/
│   ├── UserInfoSection.tsx         — 用户信息区（头像/昵称/注册时间）
│   ├── RankCard.tsx                — 段位展示栏
│   ├── StatsGrid.tsx               — 2×2 统计卡片网格
│   ├── StatsCard.tsx               — 单个统计卡片
│   ├── MenuList.tsx                — 功能菜单列表
│   ├── MenuItem.tsx                — 单个菜单项
│   ├── GuestGuide.tsx              — 访客引导页
│   ├── AvatarUploader.tsx          — 头像上传+裁剪组件
│   └── ProfileForm.tsx             — 资料编辑表单
├── hooks/
│   ├── use-profile.ts              — 个人资料查询/更新 Hook
│   ├── use-avatar-upload.ts        — 头像上传 Hook
│   └── use-user-stats.ts           — 统计数据 Hook
├── services/
│   └── profile-service.ts          — API 调用层
└── types/
    └── index.ts                    — 前端类型定义
```

### 页面结构（个人中心首页）

```
PersonalCenterPage
├── 已登录状态
│   ├── UserInfoSection           — 头像(64×64 圆形) + 昵称 + 注册时间 + 编辑入口
│   ├── RankCard (.glass-card)    — 段位图标 + 名称 + 星数 + 赛季排名
│   ├── StatsGrid                 — 2×2 网格
│   │   ├── StatsCard "已学课程"  — {N}/12, Rose 色
│   │   ├── StatsCard "学习天数"  — {N}天, Sky 色
│   │   ├── StatsCard "游戏战绩"  — {胜}/{总}, Amber 色
│   │   └── StatsCard "知语币余额" — {N}币, Amber 色（负数红色）
│   └── MenuList
│       ├── MenuItem "我的课程"   — BookOpen 图标, 到期红点
│       ├── MenuItem "我的收藏"   — Star 图标
│       ├── MenuItem "我的证书"   — Award 图标
│       ├── MenuItem "知语币"     — Coins 图标
│       ├── MenuItem "推荐好友"   — Gift 图标
│       └── MenuItem "设置"      — Settings 图标
└── 未登录状态
    └── GuestGuide               — 默认头像 + 登录引导 + 权益列表 + 登录按钮
```

### 状态管理

- 使用 `@tanstack/react-query` 管理服务端数据
- `queryKey: ['profile']` — 个人资料
- `queryKey: ['user-stats']` — 学习统计（部分加载）
- 离线缓存：React Query `gcTime` 设置较长（30 分钟）

### 关键样式规格

| 元素 | 样式 |
|------|------|
| 头像 | `w-16 h-16 rounded-full`，右下角白色编辑铅笔图标 |
| 昵称 | `text-xl font-semibold`（H3 20px），最多 12 字符截断 `...` |
| 段位栏 | `.glass-card`，Amber 色段位名 |
| 统计卡片 | `.glass-card`，H2 数字 `text-2xl font-bold`，`tabular-nums` |
| 知语币负数 | 数字 `text-[#ef4444]`（语义错误色） |
| 菜单行 | 56px 高度，左图标 20px + 名称 16px + 右箭头 |
| 到期红点 | 8px 圆点 `bg-[#ef4444]`，菜单项名称右侧 |

## 范围（做什么）

- 实现个人中心首页（已登录 + 访客两种状态）
- 实现个人资料编辑页（含头像上传裁剪）
- 实现所有状态：Loading（Skeleton）、Success、Error、Partial、Offline
- 前端 API Service + React Query Hook
- 响应式适配（375px / 768px / 1280px）
- Light/Dark 双模式

## 边界（不做什么）

- 不实现"我的课程"等子页面（T10-010）
- 不实现知语币页面（T10-011）
- 不实现推荐页面（T10-011）
- 不实现设置页（T10-013）

## 涉及文件

- 新建: `src/features/personal/pages/PersonalCenterPage.tsx`
- 新建: `src/features/personal/pages/ProfileEditPage.tsx`
- 新建: `src/features/personal/components/UserInfoSection.tsx`
- 新建: `src/features/personal/components/RankCard.tsx`
- 新建: `src/features/personal/components/StatsGrid.tsx`
- 新建: `src/features/personal/components/StatsCard.tsx`
- 新建: `src/features/personal/components/MenuList.tsx`
- 新建: `src/features/personal/components/GuestGuide.tsx`
- 新建: `src/features/personal/components/AvatarUploader.tsx`
- 新建: `src/features/personal/hooks/use-profile.ts`
- 新建: `src/features/personal/services/profile-service.ts`
- 修改: `src/router/index.tsx` — 添加路由

## 依赖

- 前置: T10-004（知语币 API — 余额查询）、T10-008（个人资料 API）
- 后续: T10-014（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 已登录用户 WHEN 点击 Tab 4「个人中心」THEN 显示头像/昵称/注册时间/段位/统计卡片/功能菜单
2. GIVEN 未登录用户 WHEN 点击 Tab 4 THEN 显示访客引导页（默认头像 + 登录按钮）
3. GIVEN 用户知语币余额为 -180 WHEN 查看统计卡片 THEN 知语币数字显示红色 `-180 币`
4. GIVEN 有课程 30 天内到期 WHEN 查看菜单 THEN "我的课程"右侧显示红点
5. GIVEN 页面加载中 WHEN 数据未返回 THEN 显示 Skeleton 骨架屏（头像圆形灰块 + 文字灰条）
6. GIVEN 网络错误 WHEN 数据请求失败 THEN 显示错误 Banner + 重试按钮
7. GIVEN 已登录用户 WHEN 点击"编辑资料" THEN 跳转资料编辑页，当前信息已回填
8. GIVEN 资料编辑页 WHEN 点击头像区域 THEN 弹出裁剪器，选择/裁剪/上传头像
9. GIVEN Light 模式 WHEN 查看个人中心 THEN 毛玻璃卡片明亮通透
10. GIVEN Dark 模式 WHEN 查看个人中心 THEN 毛玻璃卡片深邃克制
11. GIVEN 375px 宽度 WHEN 查看个人中心 THEN 统计卡片 2×2 网格正常展示，无溢出
12. GIVEN 1280px 宽度 WHEN 查看个人中心 THEN 内容居中，宽度受限，阅读体验佳

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose logs --tail=30 frontend` — 前端构建成功
3. Browser MCP 导航到个人中心页面
4. 截图：Light + Dark 模式
5. 截图：375px / 768px / 1280px 三断点
6. 验证访客模式（未登录）
7. 验证资料编辑 + 头像上传

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 前端页面正常渲染（Light + Dark 模式）
- [ ] 毛玻璃效果正确（.glass-card, blur(24px), saturate(1.8)）
- [ ] 色彩仅 Rose/Sky/Amber + 中性色，无紫色
- [ ] 响应式测试通过（375px / 768px / 1280px）
- [ ] 访客引导页正常
- [ ] 头像上传流程完整
- [ ] 控制台无 Error 级别日志
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-009-fe-personal-center.md`

## 自检重点

- [ ] UI：严格遵循 Cosmic Refraction 设计系统
- [ ] UI：色彩仅限 Rose/Sky/Amber，无紫色
- [ ] UI：Tailwind CSS v4，无 tailwind.config.js
- [ ] 交互：所有状态切换 transition-all duration-300 ease-out
- [ ] 响应式：375px / 768px / 1280px 三断点
- [ ] 无障碍：装饰元素 aria-hidden、图片 alt
- [ ] 性能：React Query 缓存 + 骨架屏

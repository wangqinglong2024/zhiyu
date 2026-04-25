# 06 · 导航与路由（Navigation & Routing）

## 一、应用端导航总览

### 1.1 一级 Tab（底部 TabBar）

| # | 图标 | 名称 | 路由 | 描述 |
|:---:|:---:|---|---|---|
| 1 | Compass | 发现 | `/discover` | 中国文化 + 小说聚合 |
| 2 | BookOpen | 课程 | `/courses` | 4 轨道课程 |
| 3 | Gamepad2 | 游戏 | `/games` | 12 款游戏 |
| 4 | User | 我的 | `/profile` | 个人中心 |

**未登录可见**：所有 4 个 Tab 始终显示。
**未登录限制**：
- /discover：可看前 3 篇 / 类目，第 4 篇要求登录
- /courses：可浏览课程结构，开始学习要求登录
- /games：可看游戏列表，开始游戏要求登录
- /profile：未登录显示登录/注册引导

### 1.2 一级 Tab 子路由
```
/discover
  ├── /                  类目首页（12 文化类目 + 小说聚合）
  ├── /:category         类目列表（如 /discover/history）
  ├── /:category/:slug   文章详情
  ├── /novels            小说聚合（实际复用 /novels 路由）
  └── /search            搜索结果

/courses
  ├── /                  4 轨道首页
  ├── /:track            轨道详情（HSK 12 阶段地图）
  ├── /:track/:stage     阶段详情（12 章列表）
  ├── /:track/:stage/:chapter   章详情（12 节）
  ├── /:track/:stage/:chapter/:lesson   节详情（学习 + 练习）

/games
  ├── /                  12 游戏列表
  ├── /:game             游戏详情 + 词包选择
  ├── /:game/play        游戏画布（强制横屏）
  └── /:game/result      通关页

/profile
  ├── /                  个人中心首页
  ├── /settings          设置（主题 / 语言 / 偏好 / 安全）
  ├── /favorites         收藏
  ├── /notes             笔记
  ├── /achievements      成就
  ├── /referral          分销
  ├── /coins             知语币账本
  ├── /payments          订单 / 订阅
  └── /support           客服

/novels  （独立顶级，但通过 /discover 入口聚合）
  ├── /                  12 类目
  ├── /:category         类目下小说列表
  ├── /:category/:novel  小说详情
  └── /:category/:novel/:chapter   章节阅读

/auth
  ├── /login
  ├── /register
  ├── /forgot-password
  └── /verify-email
```

### 1.3 i18n 路由前缀
所有路由可前缀语言：
- `/en/discover/history`
- `/vi/courses`
- `/th/games/pinyin-shooter`
- `/id/profile`

无前缀 → 重定向至浏览器首选语言或用户偏好。

中文 `/zh/...`：v1.5+ 评估。

## 二、TabBar 组件规范

### 2.1 视觉
```
┌────────────────────────────────────────────┐
│ 内容滚动区                                  │
│                                            │
└────────────────────────────────────────────┘
┌─[毛玻璃]───────────────────────────────────┐
│  🧭        📖        🎮        👤         │
│ 发现       课程       游戏       我的       │
└────────────────────────────────────────────┘
↑ 64px height + safe-area-inset-bottom
```

### 2.2 状态
- 默认：图标 + 文字 `text-text-secondary`
- 激活：图标 + 文字 `text-rose-600` + 上方小圆点 dot
- 长按：触觉反馈 + 提示文字
- 角标：右上角 dot 或数字（红色，最大 99+）

### 2.3 交互
- 点击切换 Tab：路由切换 + 滚动位置保留
- 双击：滚动到顶部
- 长按：进入设置中心快捷

### 2.4 隐藏场景
TabBar 在以下页面隐藏：
- 游戏画布 `/games/:game/play`
- 课程节学习页 `/courses/.../:lesson`（沉浸学习）
- 章节阅读 `/discover/:category/:slug` `/novels/.../:chapter`（沉浸阅读）
- 模态 / 抽屉打开时（CSS `pointer-events: none`）
- 客服会话页

## 三、Header（顶栏）规范

### 3.1 默认 Header
```
┌─[毛玻璃 sticky]──────────────────────┐
│ [←]    页面标题             [⋯][🔍]  │
└──────────────────────────────────────┘
↑ 56px + safe-area-inset-top
```

### 3.2 字段
| 位置 | 元素 | 用途 |
|---|---|---|
| 左 | 返回箭头 / Logo | 默认返回上一页；首页显示 Logo |
| 中 | 标题 | 页面名 |
| 右 | 操作按钮组 | 搜索 / 分享 / 收藏 / 菜单 |

### 3.3 滚动时变化
- 滚动 > 100px：背景变更深、增加阴影
- 滚动 > 400px：标题缩小、显示返回顶部按钮

### 3.4 透明 Header
- 详情页（含 Cover 图）：初始透明，滚动后变毛玻璃
- 个人中心：透明 + 头像背景

## 四、面包屑（Breadcrumb）

### 4.1 应用端不强制
应用端通常仅返回箭头，但深层路径（如课程节内）顶部显示精简：
```
课程 > 日常轨道 > 第3阶段 > 第2章 > 第5节
```

### 4.2 后台必备
所有后台页 TopBar 下显示面包屑：
```
仪表板 > 内容管理 > 课程 > 日常轨道 > 编辑
```
点击各级跳转。

## 五、模态导航（Modal Routes）

### 5.1 路由 Modal
- 登录 / 注册 modal：通过 `?modal=login` query 触发
- 关闭后回退到原路由
- 防止 URL 被分享后无法直接进入

### 5.2 Bottom Sheet
- 词包选择 `/games/:game?packs=open`
- 评分 / 评论 `/articles/:slug?review=open`

### 5.3 行内抽屉
- 后台编辑器右侧推出抽屉

## 六、Floating Action Button (FAB)

### 6.1 全局浮窗
| 位置 | 浮窗 | 显示条件 |
|---|---|---|
| 右下 | 客服 IM | 已登录 + 非全屏页 |
| 左下 | 主题切换 | 仅 /profile 内 |
| 右上 | 通知中心 | 未读 > 0 时显示徽标 |

### 6.2 FAB 视觉
- 56×56 圆形 `.glass-floating`
- 阴影 `shadow-lg`
- hover 缩放 1.05
- 点击 涟漪

## 七、后台导航

### 7.1 Sidebar 结构
```
[Logo] 知语 Admin
─────────────────
📊 仪表板
📚 内容管理
   ├ 文章 (DC)
   ├ 课程 (CR)
   ├ 小说 (NV)
   └ 游戏 (GM)
🤖 内容工厂
🔍 审校工作台
👥 用户管理
💰 订单管理
💎 知语币
🤝 分销报告
🛎 客服工作台
🚩 Feature Flags
📜 操作审计
⚙️ 系统设置
```

### 7.2 Sidebar 行为
- 点击展开 / 折叠子菜单
- 当前激活高亮（左侧色条）
- 多级菜单支持（最多 3 级）
- 移动端：抽屉

### 7.3 TopBar
- 左：折叠按钮 + 面包屑
- 中：全局搜索（可选）
- 右：通知 + 用户菜单（含主题切换 / 退出）

## 八、路由策略

### 8.1 路由库
- 应用端：TanStack Router v1（类型安全）
- 后台：TanStack Router v1（同库）

### 8.2 守卫
| 守卫 | 用途 |
|---|---|
| AuthGuard | 需登录才能访问 |
| PaidGuard | 需付费才能访问（CR 第 4 阶段+） |
| RoleGuard | 后台 RBAC |
| LocaleGuard | 校验语言前缀有效 |

### 8.3 守卫实现
```ts
// 路由定义
const courseStageRoute = createRoute({
  path: '/courses/$track/$stage',
  beforeLoad: async ({ params, context }) => {
    if (!context.user) throw redirect({ to: '/auth/login' });
    if (parseInt(params.stage) > 3 && !context.user.isPaid) {
      throw redirect({ to: '/profile/payments' });
    }
  },
  component: CourseStagePage,
});
```

### 8.4 路由动画
- 默认：fade-in 200ms
- 详情进入：从右滑入 300ms
- 模态出现：scale-in 250ms
- 横向 Tab 切换：横向滑动 200ms

## 九、URL 设计原则

- ✅ 全部小写
- ✅ 单词以 `-` 连接
- ✅ 资源用 slug 而非 ID（`/discover/history` 不是 `/discover/cat-001`）
- ✅ 语言前缀放最前（`/en/courses`）
- ❌ 不用尾斜杠
- ❌ 不在 URL 暴露内部 ID（除资源标识）

## 十、深链支持

- 任意路径分享后可直接打开
- 含语言前缀（自动检测目标语言）
- 含分销码 query：`?ref=ABC123`，落地后绑定上级
- 含游戏分享：`/games/pinyin-shooter?from=share&user=xxx`

## 十一、PWA 启动

### 11.1 Manifest start_url
`/?utm_source=pwa`

### 11.2 Splash 屏
- 全屏毛玻璃背景
- 中央 Logo + 品牌口号
- 加载进度条（线性 + breathe 动效）

### 11.3 入屏后跳转
- 已登录 + 有最近学习 → `/courses/<last_track>/<last_stage>`
- 已登录无学习记录 → `/discover`
- 未登录 → `/discover`（可看前 3 篇）

## 十二、检查清单

- [ ] 4 Tab 切换流畅 < 200ms
- [ ] 路由前缀 4 语全部测试
- [ ] 守卫覆盖所有付费 / 登录需求
- [ ] 深链分享后落地正确
- [ ] 后台移动端抽屉可用
- [ ] FAB 在适当页面显示 / 隐藏

# 06 · 导航与路由

## 一、应用端一级导航

| # | 图标 | 名称 | 路由 | 说明 |
|---:|---|---|---|---|
| 1 | Compass | 发现 | `/discover` | 发现中国 + 小说入口 |
| 2 | BookOpen | 课程 | `/courses` | 4 轨道学习 |
| 3 | Gamepad2 | 游戏 | `/games` | 12 款 MVP 游戏 |
| 4 | User | 我的 | `/profile` | 账户、偏好、权益 |

未登录时 4 个 Tab 均可见：发现仅前 3 个中国类目可读，课程可浏览结构，游戏可看列表，个人中心显示登录/注册引导。

## 二、路由结构

```text
/discover
  /                      12 文化类目 + 小说入口
  /:category             类目文章列表
  /:category/:slug       文章阅读
  /search                搜索结果

/courses
  /                      4 轨道首页
  /:track                轨道详情
  /:track/:stage         阶段详情
  /:track/:stage/:chapter/:lesson  沉浸学习

/games
  /                      12 游戏列表
  /:game                 游戏详情 + 词包选择
  /:game/play            60 秒横屏画布
  /:game/result          单局结果

/profile
  / settings favorites notes achievements coins referral payments support

/novels
  / :category :category/:novel :category/:novel/:chapter

/auth
  /login /register /forgot-password /verify-email
```

全部应用路由支持 `/en`、`/vi`、`/th`、`/id` 前缀。无前缀根路径按浏览器语言或用户偏好重定向。

## 三、TabBar

- 高度 64px + safe-area-bottom。
- 材质：`.glass-porcelain`，顶部 1px `line-hair`。
- 激活态：`brand-jade` 图标 + 文字，顶部短线或小印点。
- 未读/角标：`cinnabar` 小点，数字最大 `99+`。
- 双击当前 Tab 滚动到顶部；长按显示 tooltip。

隐藏场景：游戏画布、课程节学习、文章/小说沉浸阅读、客服会话、全屏 modal 打开时。

## 四、Header

- 默认 56px + safe-area-top，sticky。
- 首页左侧 Logo，详情页左侧返回箭头。
- 右侧只放图标按钮：搜索、分享、收藏、菜单等，必须有 tooltip 和 aria-label。
- 详情页初始可透明覆盖 Cover，滚动后转 `.glass-porcelain`。

## 五、后台导航

Sidebar：
- Dashboard
- 内容管理：发现中国、课程、小说、游戏词包
- 内容工厂：v1 占位与导入入口
- 审校工作台
- 用户管理
- 订单与订阅
- 知语币
- 分销报告
- 客服工作台
- Feature Flags
- 操作审计
- 系统设置

TopBar：折叠按钮、面包屑、全局搜索、通知、用户菜单。后台所有深层页面必须显示面包屑。

## 六、守卫

| 守卫 | 说明 |
|---|---|
| `LocaleGuard` | 只允许 en/vi/th/id |
| `AuthGuard` | 需登录功能 |
| `PaidGuard` | 课程免费范围外权限 |
| `RoleGuard` | 后台 RBAC |
| `ContentGate` | 发现中国前 3 类目访客可读，其余需登录 |
| `GameAccessGuard` | 登录后可玩 12 款，词包范围按课程权限 |

## 七、URL 原则

- 小写短 slug，不暴露内部 ID。
- 语言前缀置于最前。
- 不用尾斜杠。
- 分享链接可带 `ref`，邀请码只嵌入链接，不单独展示纯码。

## 八、验收

- [ ] 4 语路由前缀、根重定向、用户偏好覆盖全部通过。
- [ ] 守卫覆盖登录、付费、RBAC、发现中国访问模型。
- [ ] Header/TabBar 在安全区内，无文字重叠。
- [ ] 后台面包屑与移动抽屉可用。
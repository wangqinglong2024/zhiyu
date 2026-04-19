# T04-010: 前端页面 — 课程首页

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12

## 需求摘要

实现课程首页，包含三个核心区域：①入学测试引导卡片（引导模式/结果展示模式，可关闭）；②纵向蜿蜒 S 形 Level 地图路径（L1 底 → L12 顶，垂直滚动，12 个 Level 节点含 5 种状态）；③今日复习入口卡片（SRS 待复习数量 + 预计用时）。未登录用户点击课程 Tab 全屏跳转登录页。页面需支持 7 种状态（Loading / First Load / Success / Error / Partial / Offline / Empty）和 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/01-course-homepage.md`（课程首页完整 PRD）
- 设计规范: `grules/06-ui-design.md`（Cosmic Refraction 设计系统）
- 设计规范: `grules/05-coding-standards.md` §四（前端目录结构、组件封装）
- 关联 API: T04-005（课程结构查询 — Level 列表 + 用户状态）
- 关联 API: T04-006（学习进度概览 API）
- 关联 API: T04-009（SRS 统计 — 今日待复习数）
- 关联 API: T04-007（入学测试历史 — 测试状态 + 推荐 Level）

## 技术方案

### 页面路由

```
/courses → 课程首页（底部 Tab "课程"）
```

### 组件拆分

```
pages/courses/
├── CoursesPage.tsx              — 页面容器（鉴权 + 状态管理 + 数据加载）
├── components/
│   ├── PlacementTestCard.tsx    — 入学测试引导卡片
│   ├── LevelMap.tsx             — Level 地图容器（S 形路径 + 节点）
│   ├── LevelNode.tsx            — 单个 Level 节点（5 种状态渲染）
│   ├── LevelPathLine.tsx        — 路径连线（SVG — 已通过段/未通过段）
│   ├── SrsReviewCard.tsx        — 今日复习入口卡片
│   └── CoursePageSkeleton.tsx   — 骨架屏
└── hooks/
    ├── useCourseData.ts         — 整合多个 API 数据
    └── useLevelMapScroll.ts     — 自动滚动到当前 Level
```

### 入学测试引导卡片

```
两种模式:
  引导模式（未测试 + 未关闭）:
    - 标题"发现你的中文水平"
    - 描述"3-5分钟测试，精准推荐起点"
    - Rose 色 CTA "开始测试"
    - 右上角 X 关闭（关闭后存 localStorage，不再展示）
    
  结果展示模式（已测试）:
    - 标题"你的推荐起点"
    - 推荐 Level 名称 + HSK 标签
    - Rose 色 CTA "从 Level X 开始"
    
  不显示条件:
    placement_card_dismissed = true（引导模式被关闭）
```

### Level 地图路径

```
S 形蜿蜒路径设计:
  - L1 在底部，L12 在顶部（向上滚动 = 向上攀登）
  - 奇数 Level 偏左，偶数 Level 偏右，形成 S 形
  - 连线使用 SVG 曲线（cubic bezier）
  - 已通过段: Rose 渐变实线
  - 未通过段: 灰色虚线
  - 当前 Level 节点自动滚动到视口中央（500ms Standard 缓动）
```

### Level 节点 5 种状态

```
🟢 进行中 (in_progress):
  - Rose 环形进度条（SVG circle + stroke-dasharray）
  - .glass-elevated 毛玻璃
  - 比其他节点大 20%（scale 1.2）
  - 呼吸闪烁动画（1.5s ease-in-out 循环）
  - 点击 → Level 详情页

✅ 已完成 (completed):
  - 绿色完整环 + CheckCircle 图标
  - 正常毛玻璃
  - 点击 → Level 详情页

⚪ 已解锁 (unlocked):
  - 灰色虚线环 + opacity 0.7
  - 点击 → Level 详情页

🔵 已购买未开始 (purchased):
  - Sky 色虚线环 + 蓝色圆点
  - 点击逻辑: 前序未完成 → Toast 提示；前序已完成 → Level 详情页

🔒 锁定 (locked):
  - 灰色实线环 + Lock 图标
  - opacity 0.4 + 灰度滤镜
  - 点击 → 弹出付费墙 Bottom Sheet（T04-011）
```

### 今日复习入口卡片

```
位于 Level 地图上方:
  - 🔄 图标
  - "今日待复习" + 待复习数量(Amber 色)
  - "预计 X 分钟"
  - Rose 色 CTA "开始复习"
  - 无待复习 → "今日已完成" + ✅ 图标
```

### 动画规范

```
路径绘制: 800ms Standard 缓动
当前 Level 呼吸闪烁: 1.5s ease-in-out 循环
节点入场: 每个延迟 100ms，单个 300ms Decelerate
自动滚动到当前 Level: 500ms Standard
入学测试卡片关闭: 300ms 上滑退出
prefers-reduced-motion: 关闭所有动画
```

### 状态管理

```typescript
// hooks/useCourseData.ts
function useCourseData() {
  const levels = useQuery(['courses', 'levels'], fetchLevels)
  const srsStats = useQuery(['srs', 'stats'], fetchSrsStats)
  const placementTest = useQuery(['placement-test', 'history'], fetchPlacementHistory)
  
  // 推导 Level 节点状态
  const levelNodes = useMemo(() => deriveLevelStates(levels, purchases, progress), [levels])
  
  return { levelNodes, srsStats, placementTest, isLoading, isError }
}
```

## 范围（做什么）

- CoursesPage 页面容器（鉴权守卫 + 7 种状态）
- 入学测试引导卡片（引导/结果两种模式 + 关闭持久化）
- Level 地图 S 形路径（SVG 连线 + 12 个节点 + 5 种状态）
- Level 节点进度环（SVG circle 动画）
- 今日复习入口卡片
- 自动滚动到当前 Level
- 路径/节点入场动画
- 骨架屏 Loading 态
- 响应式布局（Mobile-First）
- Dark / Light 模式
- `prefers-reduced-motion` 支持

## 边界（不做什么）

- 不实现入学测试页面（由独立路由处理）
- 不实现付费墙 Bottom Sheet 组件（T04-011，本页面仅调用触发）
- 不实现 Level 详情页（T04-012）
- 不实现 SRS 复习页面（T04-014）
- 不实现离线数据缓存（P2）

## 涉及文件

- 新建: `frontend/src/pages/courses/CoursesPage.tsx`
- 新建: `frontend/src/pages/courses/components/PlacementTestCard.tsx`
- 新建: `frontend/src/pages/courses/components/LevelMap.tsx`
- 新建: `frontend/src/pages/courses/components/LevelNode.tsx`
- 新建: `frontend/src/pages/courses/components/LevelPathLine.tsx`
- 新建: `frontend/src/pages/courses/components/SrsReviewCard.tsx`
- 新建: `frontend/src/pages/courses/components/CoursePageSkeleton.tsx`
- 新建: `frontend/src/pages/courses/hooks/useCourseData.ts`
- 新建: `frontend/src/pages/courses/hooks/useLevelMapScroll.ts`
- 修改: `frontend/src/router/index.tsx` — 注册 /courses 路由
- 修改: `frontend/src/api/courses.ts` — 课程相关 API 调用函数

## 依赖

- 前置: T04-005（课程结构查询 API）、T04-006（学习进度 API）、T04-009（SRS 统计 API）、T04-007（入学测试历史 API）
- 前置: T02-001（全局框架 — 底部 Tab Bar、Auth 守卫、Toast）
- 后续: T04-011（付费墙 — 锁定 Level 点击触发）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 未登录用户 **WHEN** 点击课程 Tab **THEN** 全屏跳转登录页
2. **GIVEN** 已登录 + 未做入学测试 + 未关闭卡片 **WHEN** 进入首页 **THEN** 显示引导模式入学测试卡片
3. **GIVEN** 引导模式卡片 **WHEN** 点击 X 关闭 **THEN** 卡片上滑 300ms 消失，刷新后不再出现
4. **GIVEN** 已完成入学测试 **WHEN** 进入首页 **THEN** 显示结果展示模式（推荐 Level X）
5. **GIVEN** 12 个 Level 数据加载完成 **WHEN** 渲染 Level 地图 **THEN** S 形路径正确绘制，12 个节点按状态渲染
6. **GIVEN** 当前进行中 Level 为 L5 **WHEN** 页面加载完成 **THEN** 自动滚动到 L5 节点（视口中央）
7. **GIVEN** L5 状态为进行中 **WHEN** 查看 L5 节点 **THEN** Rose 进度环 + 大 20% + 呼吸闪烁
8. **GIVEN** L8 状态为锁定 **WHEN** 点击 L8 节点 **THEN** 弹出付费墙 Bottom Sheet
9. **GIVEN** SRS 有 12 条待复习 **WHEN** 查看复习卡片 **THEN** 显示"12"（Amber 色）+ 预计时间
10. **GIVEN** SRS 无待复习 **WHEN** 查看复习卡片 **THEN** 显示"今日已完成" + ✅
11. **GIVEN** API 请求中 **WHEN** 页面加载 **THEN** 显示骨架屏
12. **GIVEN** API 请求失败 **WHEN** 渲染页面 **THEN** 显示错误态 + 重试按钮
13. **GIVEN** 暗色模式 **WHEN** 查看页面 **THEN** 毛玻璃背景/边框/颜色符合 Cosmic Refraction Dark 主题
14. **GIVEN** `prefers-reduced-motion: reduce` **WHEN** 查看页面 **THEN** 所有动画静止

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认 frontend 容器 Running
3. 通过 Browser MCP 访问 `http://localhost:5173/courses`
4. 验证未登录 → 跳转登录页
5. 登录后验证入学测试卡片显示
6. 验证 12 个 Level 节点渲染 + 5 种状态视觉
7. 验证自动滚动到当前 Level
8. 验证点击锁定 Level → 触发付费墙
9. 验证今日复习入口卡片
10. 验证 Dark / Light 模式切换
11. 截图留存

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，前后端容器 Running
- [ ] 未登录拦截正确
- [ ] 入学测试卡片两种模式正确
- [ ] Level 地图 12 节点正确渲染
- [ ] 5 种 Level 状态视觉区分明显
- [ ] 自动滚动到当前 Level
- [ ] 点击锁定 Level 触发付费墙
- [ ] 今日复习卡片数据正确
- [ ] Dark/Light 模式正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-010-fe-course-homepage.md`

## 自检重点

- [ ] 设计: 严格遵循 Cosmic Refraction（三色 Rose/Sky/Amber，无紫色）
- [ ] 设计: 毛玻璃 CSS 使用 `--glass-*` 变量，非硬编码
- [ ] 设计: 间距 8px 倍数，圆角使用规范值
- [ ] 设计: 图标使用 Lucide Icons，Stroke 1.5px
- [ ] 交互: 点击区域 ≥ 44×44pt
- [ ] 交互: hover `translateY(-1px)`，active `scale(0.97)`
- [ ] 无障碍: 对比度 ≥ 4.5:1，语义 HTML，aria 属性
- [ ] 性能: 12 个节点不造成滚动卡顿
- [ ] 不使用 tailwind.config.js（Tailwind CSS v4 `@import "tailwindcss"` + `@theme`）

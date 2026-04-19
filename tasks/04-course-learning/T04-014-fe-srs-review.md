# T04-014: 前端页面 — SRS 间隔复习页

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 14

## 需求摘要

实现 SRS 间隔复习页面，包含：①复习进行页（顶部进度条 + 居中单张复习卡片 + 底部"显示答案"按钮 → 翻转后显示"记住了/还没记住"操作按钮）；②3 类卡片正面/背面渲染（词汇卡片/语法卡片/错题卡片）；③复习完成页（庆祝撒花动画 + 统计卡片 + 明日预告 + 导航按钮）。核心交互为卡片 3D 翻转 + 左右滑出切换 + 退出二次确认。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/06-srs-review.md`（SRS 复习完整 PRD）
- 设计规范: `grules/06-ui-design.md`（Cosmic Refraction 设计系统）
- 关联 API: T04-009（SRS API — 待复习列表 + 提交结果 + 统计）
- 关联页面: T04-010（课程首页 → "今日复习"入口卡片 → 导航到本页面）

## 技术方案

### 页面路由

```
/courses/srs-review → SRS 复习页
```

### 组件拆分

```
pages/courses/srs-review/
├── SrsReviewPage.tsx              — 页面容器（队列管理 + 状态机）
├── components/
│   ├── ReviewNavBar.tsx           — 顶部栏（退出 + 进度"X/Y已复习" + 进度条）
│   ├── ReviewCardContainer.tsx    — 卡片容器（翻转 + 左右滑出动画管理）
│   ├── VocabReviewCard.tsx        — 词汇复习卡片（正面/背面）
│   ├── GrammarReviewCard.tsx      — 语法复习卡片（正面/背面）
│   ├── QuizReviewCard.tsx         — 错题复习卡片（正面/背面）
│   ├── ReviewActionButtons.tsx    — 底部操作按钮（显示答案 / 记住了+还没记住）
│   ├── ReviewCompletePage.tsx     — 复习完成页
│   ├── ReviewStatsCard.tsx        — 统计卡片（总数/记住/未记住/用时）
│   ├── TomorrowPreviewCard.tsx    — 明日预告卡片
│   └── ExitConfirmDialog.tsx      — 退出二次确认弹窗
└── hooks/
    ├── useReviewQueue.ts          — 复习队列管理
    └── useReviewTimer.ts          — 复习计时器
```

### 复习进行页布局

```
┌───────────────────────────────┐
│ ✕ 退出     3/12 已复习        │  ← 导航栏
│ ████████░░░░░░░░░░░░░░       │  ← 线性进度条 Rose
├───────────────────────────────┤
│                               │
│                               │
│   ┌───────────────────┐       │
│   │                   │       │  ← 居中单张卡片
│   │   复习卡片正面    │       │     .glass-card 毛玻璃
│   │   (词汇/语法/错题) │      │     24px 圆角
│   │                   │       │
│   └───────────────────┘       │
│                               │
│                               │
├───────────────────────────────┤
│    ┌──────────────────┐       │
│    │   显示答案        │       │  ← Rose 色 CTA
│    └──────────────────┘       │
└───────────────────────────────┘
```

### 卡片翻转后

```
┌───────────────────────────────┐
│   ┌───────────────────┐       │
│   │                   │       │
│   │   复习卡片背面    │       │
│   │   (答案内容)      │       │
│   │                   │       │
│   └───────────────────┘       │
│                               │
├───────────────────────────────┤
│  ┌──────────┐ ┌──────────┐   │
│  │😅 还没记住│ │😊 记住了  │   │  ← 左红右绿
│  │  (红轮廓) │ │ (绿色)   │   │     各占 45% 宽度
│  └──────────┘ └──────────┘   │
└───────────────────────────────┘
```

### 3 类复习卡片

#### 词汇卡片

```
正面:
  - 汉字 48px 居中
  - "这个字/词是什么意思？"
  - 🔊 发音按钮
  - 来源标签（如 "Level 3 · 单元 2"）Amber 色小标签

背面:
  - 汉字 24px + 拼音
  - 释义（跟随用户解释语言设置）
  - 例句
  - 🔊 发音按钮
```

#### 语法卡片

```
正面:
  - 📐 图标 + 语法点名称
  - 改写/填空题干
  - 来源标签

背面:
  - 正确答案
  - 语法公式
  - 用法说明
  - 例句对比
```

#### 错题卡片

```
正面:
  - 原题干（选择题/判断题）
  - 选项列表
  - 来源标签（"单元 3 测评"）

背面:
  - 正确答案（绿色高亮）
  - 用户上次错选（红色删除线）
  - 解析说明
```

### 卡片动画

```
翻转（显示答案）:
  - 3D Y 轴旋转 400ms Spring(0.34, 1.56, 0.64, 1) 缓动
  - 正面 → 背面

切换到下一张:
  - 当前卡片: 向左滑出 300ms Accelerate + opacity 0→
  - 下一张卡片: 从右滑入 300ms Decelerate + opacity →1

prefers-reduced-motion:
  - 翻转 → 淡入淡出 200ms
  - 切换 → 交叉淡入淡出 200ms
```

### 退出二次确认

```
点击 ✕ 退出按钮:
  弹出 ExitConfirmDialog:
    "确定退出复习？"
    "已复习的进度已保存"
    "继续复习"(Rose CTA) + "退出"(灰色轮廓)
```

### 复习完成页

```
┌───────────────────────────────┐
│                               │
│       🎉 (撒花动画)          │  ← Confetti 动画 2s
│                               │
│   "今日复习完成！"            │  ← H1 居中
│                               │
│   ┌─────────────────────┐    │
│   │ 📊 复习统计          │    │  ← .glass-card
│   │ 总计 12 张           │    │
│   │ 😊 记住 10  😅 未记 2 │    │
│   │ 用时 8 分钟          │    │
│   │ 正确率 83.3%         │    │
│   └─────────────────────┘    │
│                               │
│   ┌─────────────────────┐    │
│   │ 📅 明日预告          │    │  ← .glass-card
│   │ 明日待复习: 8 张      │    │
│   │ 新词汇 3 · 复习 5    │    │
│   └─────────────────────┘    │
│                               │
│   ┌─────────────────────┐    │
│   │   返回课程首页       │    │  ← Rose CTA
│   └─────────────────────┘    │
│   「继续学习课时」链接        │  ← Sky 色文字链接
│                               │
└───────────────────────────────┘
```

### 队列管理

```typescript
// hooks/useReviewQueue.ts
function useReviewQueue() {
  const [queue, setQueue] = useState<ReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<Map<string, ReviewResult>>()
  
  // "还没记住"连续 2 次的项 → 加到队列末尾再复习
  const handleResult = async (itemId: string, result: 'remembered' | 'forgotten') => {
    await submitReview(itemId, result)
    
    if (result === 'forgotten') {
      const item = queue[currentIndex]
      if (item.consecutiveForgotten >= 1) {
        // 连续 2 次忘记 → 加到队列末尾
        setQueue(prev => [...prev, { ...item, consecutiveForgotten: item.consecutiveForgotten + 1 }])
      }
    }
    
    setIsFlipped(false)
    setCurrentIndex(prev => prev + 1)
  }
  
  const isComplete = currentIndex >= queue.length
  return { currentItem: queue[currentIndex], isFlipped, isComplete, handleResult, ... }
}
```

### 每日队列排序规则

```
优先级从高到低:
  1. 逾期项（next_review_at 最早的优先）
  2. 连续未记住的项
  3. 当日到期项（低阶段优先 — interval_stage ASC）
  4. 类型穿插（避免连续同类型）
```

## 范围（做什么）

- SrsReviewPage 页面（队列管理 + 状态机 + 计时）
- ReviewNavBar（进度条 + 退出按钮 + 二次确认）
- ReviewCardContainer（翻转 + 左右切换动画）
- 3 类卡片正面/背面渲染（词汇/语法/错题）
- ReviewActionButtons（显示答案 → 记住了/还没记住）
- ReviewCompletePage（撒花 + 统计 + 明日预告 + 导航）
- 连续 2 次忘记 → 加到队列末尾
- useReviewQueue Hook（队列管理）
- useReviewTimer Hook（计时）
- Dark / Light 模式
- 响应式布局
- `prefers-reduced-motion` 支持

## 边界（不做什么）

- 不实现复习提醒推送通知
- 不实现 SRS 配置管理页面
- 不实现复习历史回顾页面

## 涉及文件

- 新建: `frontend/src/pages/courses/srs-review/SrsReviewPage.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/ReviewNavBar.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/ReviewCardContainer.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/VocabReviewCard.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/GrammarReviewCard.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/QuizReviewCard.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/ReviewActionButtons.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/ReviewCompletePage.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/ReviewStatsCard.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/TomorrowPreviewCard.tsx`
- 新建: `frontend/src/pages/courses/srs-review/components/ExitConfirmDialog.tsx`
- 新建: `frontend/src/pages/courses/srs-review/hooks/useReviewQueue.ts`
- 新建: `frontend/src/pages/courses/srs-review/hooks/useReviewTimer.ts`
- 修改: `frontend/src/router/index.tsx` — 注册路由

## 依赖

- 前置: T04-009（SRS API — 待复习列表 + 提交结果 + 统计）
- 前置: T04-010（课程首页 → "今日复习"入口导航到本页面）
- 后续: 无

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 今日有 12 条待复习 **WHEN** 进入复习页 **THEN** 顶部显示"0/12 已复习" + 空进度条
2. **GIVEN** 词汇卡片正面 **WHEN** 查看 **THEN** 汉字 48px + 问题 + 🔊 + 来源标签
3. **GIVEN** 正面状态 **WHEN** 点击"显示答案" **THEN** 卡片 3D Y 轴翻转 400ms 到背面
4. **GIVEN** 背面状态 **WHEN** 点击"😊 记住了" **THEN** 当前卡片滑出 + 下一张滑入 + 进度 +1
5. **GIVEN** 背面状态 **WHEN** 点击"😅 还没记住" **THEN** 当前卡片滑出 + 提交 forgotten + 进度 +1
6. **GIVEN** 同一项连续 2 次还没记住 **WHEN** 第 2 次提交 **THEN** 该项追加到队列末尾
7. **GIVEN** 复习最后一张 **WHEN** 提交结果 **THEN** 跳转到复习完成页
8. **GIVEN** 复习完成页 **WHEN** 查看 **THEN** 撒花动画 + 统计（总/记住/未记/用时/正确率）+ 明日预告
9. **GIVEN** 复习进行中 **WHEN** 点击 ✕ 退出 **THEN** 弹出二次确认弹窗
10. **GIVEN** 确认退出 **WHEN** 点击"退出" **THEN** 已复习进度已保存 + 返回课程首页
11. **GIVEN** 暗色模式 **WHEN** 查看页面 **THEN** Cosmic Refraction Dark 主题正确
12. **GIVEN** `prefers-reduced-motion` **WHEN** 翻转卡片 **THEN** 使用淡入淡出替代 3D 翻转

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 预先通过 API 添加复习项（确保有待复习数据）
3. 通过 Browser MCP 从课程首页"今日复习"入口进入
4. 验证卡片正面渲染（3 类卡片）
5. 验证翻转动画
6. 验证"记住了/还没记住"操作 + 下一张切换
7. 验证连续忘记追加队列
8. 验证复习完成页（统计 + 明日预告）
9. 验证退出二次确认
10. 验证 Dark / Light 模式
11. 截图留存

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 3 类卡片正确渲染
- [ ] 翻转动画流畅
- [ ] 记住/未记住操作正确
- [ ] 连续忘记追加队列
- [ ] 完成页统计正确
- [ ] 退出二次确认正确
- [ ] Dark/Light 模式正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-014-fe-srs-review.md`

## 自检重点

- [ ] 设计: 卡片 24px 圆角 + 毛玻璃
- [ ] 设计: 记住了绿色 / 还没记住红色轮廓
- [ ] 设计: 撒花动画 2s（可用 canvas-confetti 库）
- [ ] 交互: Spring 缓动翻转
- [ ] 交互: 退出二次确认（不能直接退出丢失进度）
- [ ] 逻辑: 连续 2 次忘记追加到末尾
- [ ] 无障碍: 操作按钮 aria-label
- [ ] 不使用 tailwind.config.js

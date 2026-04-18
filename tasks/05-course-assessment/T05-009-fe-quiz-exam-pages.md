# T05-009: 前端页面 — 课时小测验 & 单元测评

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 10

## 需求摘要

构建课时小测验和单元测评的完整前端页面，包括考核入口、答题界面、进度条、提交确认、结果展示页。课时小测验采用逐题即时反馈模式，单元测评采用统一提交模式并支持答题进度保存/恢复。两种考核共享答题界面框架但交互模式不同。遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/02-lesson-quiz.md` — 课时小测验 PRD
- 产品需求: `product/apps/04-course-assessment/03-unit-test.md` — 单元测评 PRD
- UI 设计规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` §二 — 前端编码规范
- 关联任务: T05-005（小测验 API）、T05-006（单元测评 API）、T05-008（题型组件）

## 技术方案

### 页面/路由结构

```
frontend/src/pages/assessment/
├── LessonQuizPage.tsx            -- 课时小测验页面
├── UnitTestPage.tsx              -- 单元测评页面
├── components/
│   ├── QuizHeader.tsx            -- 考核顶部栏（进度条、计数器、退出按钮）
│   ├── QuizProgress.tsx          -- 进度条组件（圆点进度/条形进度）
│   ├── NavigationBar.tsx         -- 题目导航（上一题/下一题/提交）
│   ├── SubmitConfirmModal.tsx    -- 提交确认弹窗
│   ├── QuizResultCard.tsx        -- 结果卡片（得分、正确率、通过状态）
│   ├── LessonQuizResult.tsx      -- 课时小测验结果页
│   └── UnitTestResult.tsx        -- 单元测评结果页
├── hooks/
│   ├── useLessonQuiz.ts          -- 课时小测验状态管理
│   ├── useUnitTest.ts            -- 单元测评状态管理
│   └── useQuizProgress.ts        -- 进度保存/恢复 Hook
└── types.ts                       -- 页面级类型定义
```

### 路由配置

```
/course/lessons/:lessonId/quiz          -- 课时小测验
/course/units/:unitId/test              -- 单元测评
/course/assessments/:attemptId/result   -- 考核结果页
```

### 课时小测验流程

```
[课时完成] → [开始测验] → [逐题答题 + 即时反馈] → [全部完成] → [结果页]
```

1. **开始测验**：调用 `POST /api/v1/lessons/:lessonId/quiz`，获取题目
2. **逐题答题**：每答一题立即调用 `POST /api/v1/assessments/:attemptId/answers`
3. **即时反馈**：答案提交后显示正确/错误动画 + 解析面板
4. **自动进入下一题**：反馈展示 2 秒后自动切换（或用户手动点击继续）
5. **结果页**：所有题答完后调用 submit，显示总结

### 单元测评流程

```
[单元完成] → [开始测评] → [自由答题 + 导航] → [提交确认] → [判分等待] → [结果页]
```

1. **开始测评**：调用 `POST /api/v1/units/:unitId/test`，获取题目
2. **自由答题**：用户可前后翻页、跳题，答案暂存本地
3. **进度保存**：每答一题自动调用 `PUT /api/v1/assessments/:attemptId/progress`
4. **断线恢复**：页面加载时检查 in_progress attempt，有则自动恢复
5. **提交确认**：点击提交 → 弹窗确认（显示已答/未答统计）→ 调用 submit
6. **结果页**：显示总分、逐题判分、通过/不通过状态

### 状态管理（Custom Hook）

```typescript
// hooks/useLessonQuiz.ts
function useLessonQuiz(lessonId: string) {
  const [status, setStatus] = useState<'loading' | 'answering' | 'feedback' | 'completed'>('loading')
  const [questions, setQuestions] = useState<RenderedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, unknown>>()
  const [results, setResults] = useState<GradingResult[]>([])
  const [attemptId, setAttemptId] = useState<string>()

  const startQuiz = async () => { ... }
  const submitAnswer = async (questionId: string, answer: unknown) => { ... }
  const finishQuiz = async () => { ... }

  return { status, questions, currentIndex, answers, results, startQuiz, submitAnswer, finishQuiz }
}

// hooks/useUnitTest.ts
function useUnitTest(unitId: string) {
  const [status, setStatus] = useState<'loading' | 'answering' | 'submitting' | 'completed'>('loading')
  const [questions, setQuestions] = useState<RenderedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, unknown>>()
  const [attemptId, setAttemptId] = useState<string>()

  const startTest = async () => { ... }
  const saveProgress = async () => { ... }
  const restoreProgress = async () => { ... }
  const submitTest = async () => { ... }
  const goToQuestion = (index: number) => { ... }

  return { status, questions, currentIndex, answers, startTest, saveProgress, submitTest, goToQuestion }
}
```

### 考核结果页设计

#### 课时小测验结果
- 顶部：得分圆环动画（如 80/100）
- 中间：正确数/总数
- 下方：逐题回顾列表（点击展开查看解析）
- 底部：按钮「返回课时」

#### 单元测评结果
- **通过**：
  - 顶部：🎉 祝贺通过 + 分数动画
  - 中间：各题型正确率条形图
  - 下方：错题回顾
  - 底部：按钮「继续下一单元」
- **不通过**：
  - 顶部：分数 + 通过线提示
  - 中间：薄弱知识点分析
  - 下方：错题回顾
  - 底部：按钮「立即重考」/「先去复习」

### Cosmic Refraction 页面设计

- 页面背景：深色渐变 + 微光粒子效果
- 题目卡片：玻璃态面板，居中显示
- 进度条：Sky 蓝色渐变填充，带光晕效果
- 结果页：Amber 金色得分高亮，Rose 红色错题标注
- 通过动画：粒子爆发 + 光环扩散

## 范围（做什么）

- 实现课时小测验完整页面（即时反馈模式）
- 实现单元测评完整页面（统一提交模式）
- 实现共享组件（进度条、导航栏、提交确认弹窗）
- 实现考核结果页（通过/不通过两种状态）
- 状态管理 Hooks（useLessonQuiz、useUnitTest、useQuizProgress）
- 进度保存/恢复（调用 T05-006 的进度 API）
- 断线恢复检测
- 路由配置和页面跳转
- Cosmic Refraction 设计效果
- 移动端适配

## 边界（不做什么）

- 不做题型渲染组件（T05-008）
- 不做级别综合考核页面（T05-010）
- 不做证书展示（T05-010）
- 不做考试计时器（P1 无时限）

## 涉及文件

- 新建: `frontend/src/pages/assessment/LessonQuizPage.tsx`
- 新建: `frontend/src/pages/assessment/UnitTestPage.tsx`
- 新建: `frontend/src/pages/assessment/components/QuizHeader.tsx`
- 新建: `frontend/src/pages/assessment/components/QuizProgress.tsx`
- 新建: `frontend/src/pages/assessment/components/NavigationBar.tsx`
- 新建: `frontend/src/pages/assessment/components/SubmitConfirmModal.tsx`
- 新建: `frontend/src/pages/assessment/components/QuizResultCard.tsx`
- 新建: `frontend/src/pages/assessment/components/LessonQuizResult.tsx`
- 新建: `frontend/src/pages/assessment/components/UnitTestResult.tsx`
- 新建: `frontend/src/pages/assessment/hooks/useLessonQuiz.ts`
- 新建: `frontend/src/pages/assessment/hooks/useUnitTest.ts`
- 新建: `frontend/src/pages/assessment/hooks/useQuizProgress.ts`
- 修改: `frontend/src/router/index.tsx` — 添加考核路由

## 依赖

- 前置: T05-005（课时小测验 API）、T05-006（单元测评 API）、T05-008（题型组件）
- 外部: T02-xxx（全局路由框架）
- 后续: T05-011（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户完成课时学习  
   **WHEN** 进入小测验页面  
   **THEN** 显示加载状态 → 题目加载完成 → 显示第 1 题

2. **GIVEN** 课时小测验中  
   **WHEN** 选择答案  
   **THEN** 立即提交判分，显示正确/错误反馈动画和解析

3. **GIVEN** 课时小测验即时反馈显示中  
   **WHEN** 2 秒后或用户点击继续  
   **THEN** 自动切换到下一题

4. **GIVEN** 课时小测验所有题答完  
   **WHEN** 自动提交  
   **THEN** 显示结果页：得分圆环、正确数、逐题回顾

5. **GIVEN** 用户完成所有课时  
   **WHEN** 进入单元测评页面  
   **THEN** 加载 10-15 道题，显示题目导航和进度条

6. **GIVEN** 单元测评中  
   **WHEN** 点击上一题/下一题  
   **THEN** 切换题目，已答题标记完成

7. **GIVEN** 单元测评中  
   **WHEN** 答题后页面刷新  
   **THEN** 自动检测 in_progress attempt，恢复进度和已答内容

8. **GIVEN** 单元测评中  
   **WHEN** 点击提交  
   **THEN** 弹出确认弹窗，显示已答/未答统计

9. **GIVEN** 单元测评通过（≥ 70 分）  
   **WHEN** 查看结果页  
   **THEN** 显示祝贺动画、分数、错题回顾、继续下一单元按钮

10. **GIVEN** 单元测评不通过  
    **WHEN** 查看结果页  
    **THEN** 显示分数和通过线对比、薄弱知识点、立即重考按钮

11. **GIVEN** 所有页面  
    **WHEN** 在移动设备查看  
    **THEN** 布局正常适配，触摸操作友好

12. **GIVEN** TypeScript 编译  
    **WHEN** 执行 `npx tsc --noEmit`  
    **THEN** 零类型错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 访问 `http://localhost:3100`
3. 模拟课时完成 → 进入小测验 → 完成逐题答题 → 查看结果
4. 模拟单元完成 → 进入测评 → 自由答题 → 保存进度 → 刷新恢复 → 提交 → 查看结果
5. 测试通过/不通过两种结果页
6. 验证移动端适配
7. 编译检查：`docker compose exec frontend npx tsc --noEmit`

### 测试通过标准

- [ ] Docker 构建成功，TypeScript 零编译错误
- [ ] 课时小测验：逐题即时反馈正常
- [ ] 单元测评：自由答题 + 导航正常
- [ ] 进度保存/恢复正常（断线恢复）
- [ ] 提交确认弹窗正常
- [ ] 结果页通过/不通过展示正确
- [ ] 动画效果流畅
- [ ] 移动端适配正常
- [ ] 颜色仅 Rose/Sky/Amber，无 purple

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-009-fe-quiz-exam-pages.md`

## 自检重点

- [ ] 课时小测验：逐题提交（不是最后统一提交）
- [ ] 单元测评：统一提交（不是逐题提交）
- [ ] 进度保存间隔合理（每答一题保存一次）
- [ ] 断线恢复流程完整（检测 → 提示 → 恢复）
- [ ] 提交前验证所有题目已答（单元测评）
- [ ] 颜色仅 Rose/Sky/Amber，无 purple
- [ ] Tailwind CSS v4 语法

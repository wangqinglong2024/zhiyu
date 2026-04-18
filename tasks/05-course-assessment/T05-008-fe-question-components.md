# T05-008: 前端组件 — 题型渲染组件

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12

## 需求摘要

构建 7 种题型的前端渲染和交互组件，遵循 Cosmic Refraction 设计系统。每个组件接收 RenderedQuestion 数据，渲染题干和交互区域，采集用户答案并上报。支持两种模式：答题模式（不显示正确答案）和解析模式（显示正确答案和解析）。组件需支持移动端适配和动画反馈。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/01-question-types.md` — 7 种题型交互规则
- UI 设计规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` §二 — 前端编码规范
- Tailwind 规范: `grules/05-coding-standards.md` §二.4 — Tailwind CSS v4
- 关联任务: T05-004（RenderedQuestion 类型定义）→ T05-009/010（页面集成）

## 技术方案

### 组件设计

```
frontend/src/components/assessment/
├── QuestionRenderer.tsx           -- 统一题目渲染入口（按 type 分发）
├── questions/
│   ├── SingleChoice.tsx           -- 单选题
│   ├── MultipleChoice.tsx         -- 多选题
│   ├── ListeningChoice.tsx        -- 听力选择题
│   ├── PinyinAnnotation.tsx       -- 拼音标注题
│   ├── SentenceOrdering.tsx       -- 排序组句题
│   ├── FillInBlank.tsx            -- 填空题
│   └── ReadingComprehension.tsx   -- 阅读理解题
├── shared/
│   ├── QuestionStem.tsx           -- 题干通用组件
│   ├── OptionCard.tsx             -- 选项卡片（玻璃态）
│   └── ExplanationPanel.tsx       -- 解析展示面板
└── types.ts                       -- 前端题目类型定义
```

### 统一入口组件

```tsx
// QuestionRenderer.tsx
interface QuestionRendererProps {
  question: RenderedQuestion
  mode: 'answering' | 'review'      // 答题模式 / 解析模式
  userAnswer?: unknown               // 用户已有答案（恢复进度用）
  gradingResult?: GradingResult      // 判分结果（解析模式用）
  onAnswer: (answer: unknown) => void // 答案回调
  disabled?: boolean                  // 已提交则禁用交互
}
```

### 各题型交互规范

#### 1. 单选题（SingleChoice）
- 4 个选项卡片垂直排列，玻璃态背景
- 点击选中：卡片边框变为 Sky 蓝色高亮，出现选中动画
- 解析模式：正确选项绿色、用户错选红色
- 颜色：Sky（选中态）、Rose（错误态）、Amber（正确高亮）

#### 2. 多选题（MultipleChoice）
- 类似单选，但支持多选（Checkbox 图标）
- 点击切换选中/取消，选中数量显示
- 提交时高亮正确和错误选项

#### 3. 听力选择题（ListeningChoice）
- 顶部播放按钮（圆形，Sky 蓝色脉冲动画）
- 支持重播（最多 3 次）
- 播放中显示声波动画
- 选项同单选题

#### 4. 拼音标注题（PinyinAnnotation）
- 展示汉字序列，每个字上方有输入框
- 输入框支持声调输入（ā á ǎ à）
- 自动跳转下一输入框
- 解析模式：正确拼音绿色、错误红色并显示正确答案

#### 5. 排序组句题（SentenceOrdering）
- 词语卡片散落展示
- 支持拖拽排序（drag & drop）
- 支持点击排序（点击词语添加到答案行，再次点击移除）
- 答案行显示已排列的词语
- 解析模式：显示正确顺序对比

#### 6. 填空题（FillInBlank）
- 句子中的空位显示为下划线输入框
- 输入框内联在句子中
- 支持中文输入法
- 解析模式：正确答案填入，错误空位红色标注

#### 7. 阅读理解题（ReadingComprehension）
- 上方阅读材料区（可滚动，最大高度限制）
- 下方选择题（同单选题组件复用）
- 支持收起/展开阅读材料
- 关键词可高亮（如果 PRD 要求）

### Cosmic Refraction 设计规范应用

```css
/* 题目卡片 - 玻璃态 */
.question-card {
  @apply bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20;
  @apply shadow-[0_8px_32px_rgba(0,0,0,0.1)];
}

/* 选项卡片 */
.option-card {
  @apply bg-white/5 backdrop-blur-md rounded-xl border border-white/10;
  @apply hover:bg-white/15 transition-all duration-300;
}

/* 选中态 - Sky 蓝 */
.option-selected {
  @apply border-sky-400/60 bg-sky-500/10;
}

/* 正确态 */
.option-correct {
  @apply border-emerald-400/60 bg-emerald-500/10;
}

/* 错误态 - Rose 红 */
.option-wrong {
  @apply border-rose-400/60 bg-rose-500/10;
}
```

### 动画规范

- 选中选项：scale(1.02) + border 高亮，duration 200ms
- 正确反馈：✅ 图标 + 绿色渐变 + 微弹动画
- 错误反馈：❌ 图标 + 红色闪烁 + 轻微抖动
- 拖拽排序：元素拖起时提升阴影 + 半透明
- 听力播放：脉冲光环动画

### 移动端适配

- 选项卡片全宽
- 拖拽排序降级为点击排序
- 阅读材料默认折叠
- 输入框适当加大触摸区域

## 范围（做什么）

- 实现 7 种题型的渲染组件
- 实现统一入口 QuestionRenderer
- 实现共享组件（QuestionStem、OptionCard、ExplanationPanel）
- 两种模式：答题模式和解析模式
- Cosmic Refraction 玻璃态设计
- 选项选中/正确/错误动画
- 拖拽排序交互（SentenceOrdering）
- 听力音频播放（ListeningChoice）
- 移动端适配
- 前端类型定义（对齐后端 RenderedQuestion）

## 边界（不做什么）

- 不做考核页面布局（T05-009/010）
- 不做计时器组件（P1 无时限）
- 不做 AI 写作批改展示（P2）
- 不做音频录制（P2 口语题）

## 涉及文件

- 新建: `frontend/src/components/assessment/QuestionRenderer.tsx`
- 新建: `frontend/src/components/assessment/questions/SingleChoice.tsx`
- 新建: `frontend/src/components/assessment/questions/MultipleChoice.tsx`
- 新建: `frontend/src/components/assessment/questions/ListeningChoice.tsx`
- 新建: `frontend/src/components/assessment/questions/PinyinAnnotation.tsx`
- 新建: `frontend/src/components/assessment/questions/SentenceOrdering.tsx`
- 新建: `frontend/src/components/assessment/questions/FillInBlank.tsx`
- 新建: `frontend/src/components/assessment/questions/ReadingComprehension.tsx`
- 新建: `frontend/src/components/assessment/shared/QuestionStem.tsx`
- 新建: `frontend/src/components/assessment/shared/OptionCard.tsx`
- 新建: `frontend/src/components/assessment/shared/ExplanationPanel.tsx`
- 新建: `frontend/src/components/assessment/types.ts`

## 依赖

- 前置: T05-004（RenderedQuestion 类型定义）、T02-xxx（Cosmic Refraction 基础组件）
- 后续: T05-009（小测验/单元测评页面）、T05-010（综合考核页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 传入单选题 RenderedQuestion 数据  
   **WHEN** 渲染 QuestionRenderer  
   **THEN** 显示题干和 4 个选项卡片，点击可选中

2. **GIVEN** 传入多选题 RenderedQuestion  
   **WHEN** 点击多个选项  
   **THEN** 多个选项同时选中，取消可取消

3. **GIVEN** 传入听力题  
   **WHEN** 点击播放按钮  
   **THEN** 音频播放，显示声波动画，播放次数计数

4. **GIVEN** 传入拼音标注题，目标汉字 "图书馆"  
   **WHEN** 在输入框输入拼音  
   **THEN** 每字一个输入框，输入完自动跳转下一个

5. **GIVEN** 传入排序组句题  
   **WHEN** 拖拽词语卡片  
   **THEN** 词语按拖拽顺序排列到答案行

6. **GIVEN** 传入排序组句题（移动端）  
   **WHEN** 点击词语  
   **THEN** 点击的词语添加到答案行末尾

7. **GIVEN** 传入填空题  
   **WHEN** 在空位输入文字  
   **THEN** 支持中文输入法，输入内容显示在空位中

8. **GIVEN** 传入阅读理解题  
   **WHEN** 渲染  
   **THEN** 上方显示阅读材料（可滚动），下方显示选择题

9. **GIVEN** mode='review' 且 gradingResult 显示错误  
   **WHEN** 渲染  
   **THEN** 正确选项绿色高亮，用户错选红色标注，显示解析面板

10. **GIVEN** 所有组件  
    **WHEN** 检查玻璃态样式  
    **THEN** 使用 backdrop-blur、半透明背景，颜色仅使用 Rose/Sky/Amber

11. **GIVEN** TypeScript 编译  
    **WHEN** 执行 `npx tsc --noEmit`  
    **THEN** 零类型错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 访问前端页面 `http://localhost:3100`
3. 渲染各题型组件（使用 Mock 数据）
4. 验证每种题型的交互（选中/拖拽/输入/播放）
5. 验证解析模式的正确/错误高亮
6. 验证移动端适配（浏览器模拟或缩小窗口）
7. 验证玻璃态样式效果
8. 编译检查：`docker compose exec frontend npx tsc --noEmit`

### 测试通过标准

- [ ] Docker 构建成功，TypeScript 零编译错误
- [ ] 7 种题型全部可渲染
- [ ] 答题模式交互正常（选择/拖拽/输入/播放）
- [ ] 解析模式高亮正确
- [ ] 玻璃态样式正确（backdrop-blur、半透明）
- [ ] 颜色仅使用 Rose/Sky/Amber，无 purple
- [ ] 动画流畅自然
- [ ] 移动端可用

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-008-fe-question-components.md`

## 自检重点

- [ ] 颜色仅使用 Rose/Sky/Amber，绝对不用 purple
- [ ] Tailwind CSS v4 语法（`@import "tailwindcss"` + `@theme`，无 tailwind.config.js）
- [ ] 玻璃态效果：`bg-white/10 backdrop-blur-lg`
- [ ] 每个组件都支持 answering 和 review 两种模式
- [ ] 拖拽排序有移动端降级方案
- [ ] 听力播放次数限制
- [ ] 无 any 类型（全部强类型）

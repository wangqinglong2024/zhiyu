# T12-007: 前端 — 课程内容管理页 (Course Management Page)

> 分类: 12-管理后台-内容管理 (Admin Content Management)
> 状态: 📋 待开发
> 复杂度: L(大)
> 预估文件数: 15+

## 需求摘要

实现管理后台「课程管理」完整前端，包含四个层级页面：① Level 总览页（12 张卡片网格）、② Unit 列表页（可拖拽排序）、③ Lesson 列表页（可拖拽排序）、④ Lesson 编辑页（讲解型内容编辑 + 练习/复习型题目管理 + 7 种题型编辑弹窗）。支持面包屑导航、拖拽排序自动保存、Level 上线/下线切换。遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/admin/02-admin-content/02-course-management.md` — 完整课程管理 PRD
- 设计规范: `grules/06-ui-design.md`
- 全局架构: `grules/01-rules.md` §一
- 编码规范: `grules/05-coding-standards.md` §二
- 课程体系: `course/00-index.md` — 12 级框架理解
- API 依赖: T12-002 — 课程管理 API

## 技术方案

### 路由配置

```typescript
// Level 总览: /admin/content/courses
// Unit 列表: /admin/content/courses/levels/:levelId/units
// Lesson 列表: /admin/content/courses/units/:unitId/lessons
// Lesson 编辑: /admin/content/courses/lessons/:lessonId/edit
```

### ① Level 总览页

```
┌──────────────────────────────────────────────────────────┐
│ 课程管理                                                  │
│ 管理 12 个级别的完整课程内容，包括教学素材和练习题目          │
│                                                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ L1      │ │ L2      │ │ L3      │ │ L4      │        │
│ │ 启蒙段   │ │ 启蒙段   │ │ 启蒙段   │ │ 基础段   │        │
│ │ 识字启蒙 │ │ 识字起步 │ │ 段落表达 │ │ 记叙文   │        │
│ │ 一年级   │ │ 二年级   │ │ 三年级   │ │ 四年级   │        │
│ │ HSK1/A1 │ │ HSK2/A2 │ │ HSK3/B1 │ │ HSK4/B1 │        │
│ │ 8U·40L  │ │ 8U·40L  │ │ 8U·40L  │ │ 8U·40L  │        │
│ │ 免费     │ │ 免费     │ │ 免费     │ │ $6      │        │
│ │ [进入管理]│ │ [进入管理]│ │ [进入管理]│ │ [进入管理]│        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│ ... (共 3 行 12 张卡片)                                   │
└──────────────────────────────────────────────────────────┘
```

**Level 卡片**:
- 阶段标签颜色：启蒙段 Amber / 基础段 Sky / 核心段 Rose / 高阶段 绿色
- 统计：Unit 数 · Lesson 总数 · 题目总数
- 定价：L1-L3「免费」绿色标签，L4-L12 价格标签
- 状态：开发中(灰) / 已上线(绿) / 已下线(红)
- 右上角状态开关（仅超级管理员可见）
- Hover 阴影提升效果

### ② Unit 列表页

```
┌──────────────────────────────────────────────────────────┐
│ 课程管理 > Level 1「识字启蒙」                              │
│ 一年级 / HSK 1 / A1                                      │
│ 共 8 个 Unit，40 个 Lesson，186 道题     [+ 新建 Unit]     │
│                                                          │
│ ⠿ Unit 1 | 你好中国      | 5 个 Lesson | 23 道题 | 进入|编辑|删除 │
│ ⠿ Unit 2 | 数字世界      | 5 个 Lesson | 18 道题 | 进入|编辑|删除 │
│ ⠿ Unit 3 | 家人称呼      | 5 个 Lesson | 20 道题 | 进入|编辑|删除 │
│ ... (可拖拽排序)                                          │
└──────────────────────────────────────────────────────────┘
```

### ③ Lesson 列表页

```
┌──────────────────────────────────────────────────────────┐
│ 课程管理 > Level 1 > Unit 1「你好中国」                     │
│ 共 5 个 Lesson，23 道题                  [+ 新建 Lesson]   │
│                                                          │
│ ⠿ Lesson 1 | 问候自我介绍 | 讲解型 | M1 汉字 | 0 题 | 编辑|复制|删除 │
│ ⠿ Lesson 2 | 声调练习     | 练习型 | M2 拼音 | 5 题 | 编辑|复制|删除 │
│ ... (可拖拽排序)                                          │
└──────────────────────────────────────────────────────────┘
```

### ④ Lesson 编辑页

讲解型：基本信息 + 教学正文（多语言富文本+拼音标注）+ 示例句列表 + 配套音频 + 配图 + 重点词汇 + 语法点
练习/复习型：基本信息 + 题目管理列表 + 新建/编辑题目弹窗（7 种题型）

### 组件结构

```
frontend/src/pages/admin/content/courses/
├── LevelOverviewPage.tsx              — Level 总览
├── UnitListPage.tsx                   — Unit 列表
├── LessonListPage.tsx                 — Lesson 列表
├── LessonEditorPage.tsx               — Lesson 编辑
└── components/
    ├── LevelCard.tsx                  — Level 卡片
    ├── LevelStatusSwitch.tsx          — Level 状态切换
    ├── DraggableList.tsx              — 可拖拽排序列表（Unit/Lesson 共用）
    ├── UnitRow.tsx                    — Unit 行组件
    ├── LessonRow.tsx                  — Lesson 行组件
    ├── CreateUnitModal.tsx            — 新建 Unit 弹窗
    ├── CreateLessonModal.tsx          — 新建 Lesson 弹窗
    ├── LessonContentEditor.tsx        — 讲解型内容编辑
    ├── ExampleSentenceList.tsx        — 示例句列表
    ├── VocabularyList.tsx             — 重点词汇列表
    ├── GrammarPointList.tsx           — 语法点列表
    ├── QuestionManager.tsx            — 题目管理列表
    ├── QuestionEditModal.tsx          — 题目编辑弹窗（7 种题型）
    ├── QuestionPreviewModal.tsx       — 题目预览弹窗
    ├── question-types/
    │   ├── SingleChoiceForm.tsx
    │   ├── MultiChoiceForm.tsx
    │   ├── FillBlankForm.tsx
    │   ├── SortingForm.tsx
    │   ├── MatchingForm.tsx
    │   ├── ListeningForm.tsx
    │   └── ReadingAloudForm.tsx
    └── AudioUploader.tsx              — 音频上传组件

frontend/src/hooks/
├── use-course-levels.ts
├── use-course-units.ts
├── use-course-lessons.ts
└── use-course-questions.ts
```

### 拖拽排序实现

```typescript
// 使用 @dnd-kit/core + @dnd-kit/sortable
// 拖拽时被拖行半透明 + 目标位置蓝色插入线
// 松手后编号自动重排（Unit 1, 2, 3...）
// 排序变更自动保存（调用 reorder API）
// 保存成功 → Toast「排序已更新」
```

### 题目编辑弹窗

```typescript
// 大尺寸 Modal（宽 800px，高度自适应，最大 80vh 内滚动）
// 顶部：通用字段（题型选择 + 三语言题干 + 难度 + 标签）
// 中部：题型专有字段（根据选择的题型动态渲染对应表单）
// 底部：取消 | 预览 | 确认保存
// 题型切换确认：「切换题型将清空已填内容，确定吗？」
```

### 题型标签颜色

```typescript
const QUESTION_TYPE_COLORS = {
  single_choice: 'sky',
  multi_choice: 'sky-dark',
  fill_blank: 'amber',
  sorting: 'green',
  matching: 'rose',
  listening: 'slate',    // 用灰色替代紫色
  reading_aloud: 'neutral',
};
```

## 范围（做什么）

- 创建 Level 总览页（12 张卡片网格 + 统计 + 状态切换）
- 创建 Unit 列表页（拖拽排序 + CRUD + 面包屑）
- 创建 Lesson 列表页（拖拽排序 + CRUD + 复制 + 面包屑）
- 创建 Lesson 编辑页（讲解型 / 练习型 / 复习型）
- 实现讲解型内容编辑（多语言富文本 + 示例句 + 音频 + 配图 + 词汇 + 语法）
- 实现题目管理列表 + 拖拽排序
- 实现 7 种题型编辑弹窗
- 实现题目预览弹窗（手机端样式）
- 实现新建 Unit/Lesson 弹窗
- 实现状态矩阵（Empty/Loading/Error/Offline）
- 注册全部路由

## 边界（不做什么）

- 不实现评测题库管理页面（T12-008 负责）
- 不实现考核配置页面（T12-008 负责）
- 不实现后端 API（T12-002 已完成）
- 不实现文章编辑器相关功能（T12-006 已完成，复用 PinyinAnnotator）

## 涉及文件

- 新建: 上述组件结构中的所有文件（约 20+ 文件）
- 新建: `frontend/src/hooks/use-course-*.ts` — 4 个 Hook
- 新建: `frontend/src/services/course.service.ts` — API 调用封装
- 修改: `frontend/src/router/index.tsx` — 注册 4 个路由

## 依赖

- 前置: T12-002（课程管理 API）、T11-003（管理后台框架）
- 后续: T12-011（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入课程管理页  
   **WHEN** 页面加载完成  
   **THEN** 12 张 Level 卡片网格展示，每行 4 张，统计数据准确，状态标签颜色正确

2. **GIVEN** 点击 Level 1 卡片  
   **WHEN** Unit 列表页加载  
   **THEN** 面包屑「课程管理 > Level 1『识字启蒙』」准确，Unit 列表可拖拽排序

3. **GIVEN** Unit 列表页有 3 个 Unit  
   **WHEN** 拖拽 Unit 3 到 Unit 1 上方  
   **THEN** 编号自动重排为 Unit 1(原3)/Unit 2(原1)/Unit 3(原2)，Toast「排序已更新」

4. **GIVEN** Unit 下有 Lesson  
   **WHEN** 点击删除 Unit  
   **THEN** 删除按钮置灰，hover 提示「请先删除该 Unit 下的所有 Lesson」

5. **GIVEN** 进入讲解型 Lesson 编辑页  
   **WHEN** 添加示例句 + 重点词汇 + 语法点  
   **THEN** 每组结构化输入支持拖拽排序、删除，拼音字段支持自动生成

6. **GIVEN** 进入练习型 Lesson 编辑页  
   **WHEN** 点击「+ 新建题目」→ 选择「排序题」  
   **THEN** 弹窗显示通用字段 + 排序题专有表单（排序项列表 + 提示文案）

7. **GIVEN** 题目编辑弹窗已选择单选题  
   **WHEN** 切换题型为多选题  
   **THEN** 弹出确认「切换题型将清空已填内容，确定吗？」，确认后表单重置

8. **GIVEN** 页面在浅色模式  
   **WHEN** 切换到深色模式  
   **THEN** 所有组件正确切换，卡片/列表/弹窗毛玻璃效果正常

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建前后端
2. Browser MCP 依次验证 4 个页面：
   - Level 总览 → Unit 列表 → Lesson 列表 → Lesson 编辑
3. 测试拖拽排序（Unit + Lesson + 题目）
4. 测试新建 Unit / Lesson 弹窗
5. 测试 7 种题型编辑弹窗
6. 测试 Lesson 复制
7. 验证面包屑导航贯通
8. 验证响应式 375px / 768px / 1280px
9. 验证 Light/Dark 双模式

### 测试通过标准

- [ ] Docker 构建成功
- [ ] 4 个页面正常加载
- [ ] 拖拽排序 + 自动保存
- [ ] 7 种题型编辑弹窗完整
- [ ] 面包屑导航贯通
- [ ] 状态矩阵全覆盖
- [ ] 响应式 3 个断点正常
- [ ] Light/Dark 双模式
- [ ] 无紫色，毛玻璃效果正确

### 测试不通过处理

- 发现问题 → 修复 → 重新全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞

## 执行结果报告

结果文件路径: `/tasks/result/12-admin-content/T12-007-fe-course-management.md`

## 自检重点

- [ ] 拖拽排序使用 @dnd-kit，非原生 HTML5 DnD
- [ ] 题型标签颜色无紫色（听力题用 slate 替代）
- [ ] Level 卡片阶段标签颜色正确（Amber/Sky/Rose/绿色）
- [ ] 面包屑层级清晰，返回路径正确
- [ ] Lesson 复制标题加「(副本)」后缀
- [ ] 题目编辑弹窗宽 800px，高度自适应
- [ ] 所有结构化列表支持拖拽排序 + 动态增删
- [ ] Tailwind CSS v4，无 tailwind.config.js

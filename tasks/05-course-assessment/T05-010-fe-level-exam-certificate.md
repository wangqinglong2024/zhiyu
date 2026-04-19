# T05-010: 前端页面 — 级别综合考核 & 证书展示

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 16

## 需求摘要

构建级别综合考核的完整前端页面和证书展示功能。考核页面含多模块 Tab 切换（听力/阅读/词汇语法/写作），结果页含各模块雷达图、成绩报告。通过后展示庆祝动画并自动跳转证书页面。证书使用 Canvas 生成 1080×1440 像素的 PNG 图片，包含用户昵称、Level 信息、HSK/CEFR 等级、分数、日期和证书编号。遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/04-level-exam.md` — 级别综合考核 PRD
- 产品需求: `product/apps/04-course-assessment/05-certificate.md` — 电子证书 PRD
- UI 设计规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` §二 — 前端编码规范
- 关联任务: T05-007（综合考核 API）、T05-008（题型组件）、T05-003（证书 DB）

## 技术方案

### 页面/路由结构

```
frontend/src/pages/assessment/
├── LevelExamPage.tsx              -- 级别综合考核页面
├── LevelExamResultPage.tsx        -- 综合考核结果页
├── CertificatePage.tsx            -- 证书展示页
├── components/
│   ├── ExamModuleTabs.tsx         -- 模块 Tab 切换（听力/阅读/词汇语法/写作）
│   ├── ModuleProgress.tsx         -- 模块进度指示器
│   ├── EligibilityCheck.tsx       -- 考核资格检查组件
│   ├── ExamResultRadar.tsx        -- 雷达图组件（各模块分数）
│   ├── ModuleScoreCard.tsx        -- 模块成绩卡片
│   ├── CelebrationAnimation.tsx   -- 通过庆祝动画
│   ├── CertificateCanvas.tsx      -- 证书 Canvas 渲染组件
│   └── CertificatePreview.tsx     -- 证书预览卡片
├── hooks/
│   ├── useLevelExam.ts            -- 综合考核状态管理
│   └── useCertificate.ts          -- 证书数据和生成 Hook
└── utils/
    └── certificate-generator.ts   -- Canvas 证书图片生成工具
```

### 路由配置

```
/courses/levels/:levelId/exam              -- 综合考核
/courses/levels/:levelId/exam/result       -- 考核结果
/courses/certificates/:certificateNo       -- 证书展示
/courses/certificates                      -- 我的证书列表
```

### 综合考核流程

```
[资格检查] → [模块选择/切换] → [按模块答题] → [全部提交] → [结果页 + 雷达图] → [证书签发]
```

1. **资格检查**：进入页面自动调用 eligibility API，不符合条件展示提示
2. **模块 Tab**：顶部 4 个模块 Tab，可自由切换
3. **模块答题**：每个模块独立答题区，答案独立保存
4. **进度保存**：复用 T05-006 的进度 API
5. **统一提交**：所有模块答完后点击提交 → 确认弹窗 → 判分
6. **结果页**：总分 + 各模块分数雷达图 + 逐题回顾
7. **证书签发**：通过后自动展示庆祝动画 → 证书展示

### 考核界面设计

#### 模块 Tab 切换

```
┌───────────────────────────────────────┐
│ [听力] │ [阅读] │ [词汇语法] │ [写作] │
├───────────────────────────────────────┤
│                                       │
│         当前模块的题目区域              │
│                                       │
│         ← 上一题   下一题 →            │
│                                       │
├───────────────────────────────────────┤
│  模块进度: ●●●○○○○○○○  3/10          │
│  总进度: ████████░░░░  25/35          │
└───────────────────────────────────────┘
```

- Tab 上显示模块完成状态（未开始/进行中/已完成）
- 切换 Tab 时保留当前模块的答案
- 每个 Tab 有独立的题目进度

#### 冷却期提示

```
┌────────────────────────────────┐
│   ⏳ 暂时无法考核               │
│                                │
│   距下次考核开放还有             │
│      12:34:56                  │
│                                │
│   上次考核: 2025-01-01 10:00   │
│   得分: 78/100                 │
│                                │
│   [返回学习]                   │
└────────────────────────────────┘
```

### 结果页设计

#### 通过场景

```
┌────────────────────────────────────┐
│        🎉 恭喜通过!               │
│                                    │
│         88.5 / 100                 │
│     ━━━━━━━━━━━━━━ 通过线: 85     │
│                                    │
│  ┌──────────────────────────┐     │
│  │       雷达图              │     │
│  │     听力 90               │     │
│  │    /    \                 │     │
│  │ 写作     阅读             │     │
│  │  85      80               │     │
│  │    \    /                 │     │
│  │   词汇语法 90             │     │
│  └──────────────────────────┘     │
│                                    │
│  模块详情:                         │
│  ✅ 听力    90/100 (9/10)         │
│  ✅ 阅读    80/100 (8/10)         │
│  ✅ 词汇语法 90/100 (9/10)        │
│  ✅ 写作    85/100 (4/5)          │
│                                    │
│  [查看证书]  [错题回顾]           │
└────────────────────────────────────┘
```

#### 不通过场景

```
┌────────────────────────────────────┐
│         78 / 100                   │
│     未达到通过线 85                 │
│                                    │
│  ❌ 听力    55/100 (未达模块60分)  │
│  ✅ 阅读    80/100                 │
│  ✅ 词汇语法 90/100               │
│  ✅ 写作    85/100                 │
│                                    │
│  下次考核可在 24h 后进行            │
│  预计开放: 2025-01-02 10:00        │
│                                    │
│  [错题回顾]  [返回学习]            │
└────────────────────────────────────┘
```

### 雷达图组件

- 使用 Canvas 或 SVG 绘制 4 轴雷达图
- 4 个轴：听力、阅读、词汇语法、写作
- 显示实际分数和通过线（60 分）两层
- 配色：Sky 蓝色（实际分数区域）+ 虚线（通过线）

### 庆祝动画（CelebrationAnimation）

- 通过后触发 3 秒全屏动画
- 效果：粒子爆发 + 金色光环扩散 + 分数滚动计数
- 使用 CSS 动画或轻量 Canvas 实现（不引入重型库）
- 动画结束后自动收起，显示结果页

### 证书 Canvas 生成

```typescript
// utils/certificate-generator.ts

interface CertificateData {
  certificateNo: string     // ZY-L03-20250101-A1B2
  userNickname: string      // 张三
  levelNameZh: string       // 第三级
  levelNameEn: string       // Level 3
  hskLevel: string          // HSK 3
  cefrLevel: string         // CEFR B1
  totalScore: number        // 88.5
  moduleScores: Record<string, number>
  issuedAt: string          // 2025-01-01
}

async function generateCertificateImage(data: CertificateData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1440

  const ctx = canvas.getContext('2d')!

  // 1. 绘制背景（深色渐变 + 星光纹理）
  drawBackground(ctx)

  // 2. 绘制标题 "知语中文学习证书"
  drawTitle(ctx)

  // 3. 绘制用户昵称
  drawUserName(ctx, data.userNickname)

  // 4. 绘制 Level + HSK + CEFR 信息
  drawLevelInfo(ctx, data)

  // 5. 绘制成绩
  drawScore(ctx, data.totalScore)

  // 6. 绘制模块成绩小图
  drawModuleScores(ctx, data.moduleScores)

  // 7. 绘制签发日期
  drawDate(ctx, data.issuedAt)

  // 8. 绘制证书编号
  drawCertificateNo(ctx, data.certificateNo)

  // 9. 绘制装饰边框和印章
  drawDecorations(ctx)

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/png', 1.0)
  })
}
```

### 证书展示页

- 证书图片居中展示（带阴影和发光效果）
- 底部操作按钮：
  - 「保存图片」— 下载 PNG 到本地
  - 「分享」— MVP 仅支持保存后手动分享（P2 做社交分享）
- 证书信息文字版（可访问性）

### 我的证书列表

```
/courses/certificates

┌──────────────────────────────┐
│  我的证书 (3/12)             │
│                              │
│  ┌────┐  ┌────┐  ┌────┐    │
│  │ L1 │  │ L2 │  │ L3 │    │
│  │ A1 │  │ A2 │  │ B1 │    │
│  │ 92分│  │ 88分│  │ 85分│   │
│  └────┘  └────┘  └────┘    │
│                              │
│   L4  L5  L6  L7 ... (锁定) │
└──────────────────────────────┘
```

## 范围（做什么）

- 实现综合考核页面（多模块 Tab 切换答题）
- 实现资格检查组件（含冷却期倒计时）
- 实现考核结果页（雷达图 + 模块分数 + 通过/不通过状态）
- 实现庆祝动画（通过后触发）
- 实现证书 Canvas 生成（1080×1440 PNG）
- 实现证书展示页（预览 + 保存下载）
- 实现我的证书列表页
- 状态管理 Hooks
- 路由配置
- Cosmic Refraction 设计
- 移动端适配

## 边界（不做什么）

- 不做课时小测验和单元测评页面（T05-009）
- 不做证书社交分享（P2）
- 不做证书 URL 验证（MVP 不做）
- 不做证书打印优化（P2）

## 涉及文件

- 新建: `frontend/src/pages/assessment/LevelExamPage.tsx`
- 新建: `frontend/src/pages/assessment/LevelExamResultPage.tsx`
- 新建: `frontend/src/pages/assessment/CertificatePage.tsx`
- 新建: `frontend/src/pages/assessment/CertificateListPage.tsx`
- 新建: `frontend/src/pages/assessment/components/ExamModuleTabs.tsx`
- 新建: `frontend/src/pages/assessment/components/ModuleProgress.tsx`
- 新建: `frontend/src/pages/assessment/components/EligibilityCheck.tsx`
- 新建: `frontend/src/pages/assessment/components/ExamResultRadar.tsx`
- 新建: `frontend/src/pages/assessment/components/ModuleScoreCard.tsx`
- 新建: `frontend/src/pages/assessment/components/CelebrationAnimation.tsx`
- 新建: `frontend/src/pages/assessment/components/CertificateCanvas.tsx`
- 新建: `frontend/src/pages/assessment/components/CertificatePreview.tsx`
- 新建: `frontend/src/pages/assessment/hooks/useLevelExam.ts`
- 新建: `frontend/src/pages/assessment/hooks/useCertificate.ts`
- 新建: `frontend/src/pages/assessment/utils/certificate-generator.ts`
- 修改: `frontend/src/router/index.tsx` — 添加路由

## 依赖

- 前置: T05-007（综合考核 API + 证书 API）、T05-008（题型组件）
- 外部: T02-001（全局路由和设计基础）
- 后续: T05-011（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户满足考核资格  
   **WHEN** 进入考核页面  
   **THEN** 加载 4 个模块题目，显示模块 Tab

2. **GIVEN** 用户不满足资格（24h 冷却中）  
   **WHEN** 进入考核页面  
   **THEN** 显示冷却倒计时，不显示题目

3. **GIVEN** 综合考核中  
   **WHEN** 切换模块 Tab  
   **THEN** 显示对应模块题目，之前模块答案保留

4. **GIVEN** 所有模块答完  
   **WHEN** 点击提交  
   **THEN** 显示确认弹窗（各模块完成状态），确认后提交判分

5. **GIVEN** 考核通过  
   **WHEN** 查看结果页  
   **THEN** 播放庆祝动画 → 显示雷达图 + 各模块分数 + 查看证书按钮

6. **GIVEN** 考核不通过  
   **WHEN** 查看结果页  
   **THEN** 显示分数差距、薄弱模块标红、下次考核时间

7. **GIVEN** 雷达图渲染  
   **WHEN** 查看各模块分数  
   **THEN** 4 轴雷达图正确显示实际分数和 60 分通过线

8. **GIVEN** 点击「查看证书」  
   **WHEN** 进入证书页面  
   **THEN** Canvas 生成 1080×1440 证书图片，包含完整信息

9. **GIVEN** 证书页面  
   **WHEN** 点击「保存图片」  
   **THEN** 下载 PNG 文件到本地

10. **GIVEN** 用户有 3 张证书  
    **WHEN** 访问我的证书列表  
    **THEN** 显示 3 张已获得证书 + 其余锁定状态

11. **GIVEN** 证书编号  
    **WHEN** 渲染证书图片  
    **THEN** 编号格式 ZY-L{XX}-{YYYYMMDD}-{XXXX} 正确显示

12. **GIVEN** 移动端  
    **WHEN** 查看所有页面  
    **THEN** 布局适配正常，触摸操作友好

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 访问 `http://localhost:3100`
3. 模拟满足资格 → 开始综合考核 → 多模块切换答题 → 提交
4. 验证通过场景：庆祝动画 + 雷达图 + 证书
5. 验证不通过场景：冷却期倒计时 + 薄弱模块
6. 打开证书页 → 验证 Canvas 生成 → 下载 PNG
7. 验证我的证书列表
8. 验证移动端适配
9. 编译检查：`docker compose exec frontend npx tsc --noEmit`

### 测试通过标准

- [ ] Docker 构建成功，TypeScript 零编译错误
- [ ] 多模块 Tab 切换正常
- [ ] 资格检查 + 冷却期倒计时正常
- [ ] 雷达图正确渲染
- [ ] 庆祝动画流畅
- [ ] 证书 Canvas 生成正确（1080×1440）
- [ ] 证书 PNG 可下载
- [ ] 证书列表展示正确
- [ ] 颜色仅 Rose/Sky/Amber，无 purple
- [ ] 移动端适配正常

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-010-fe-level-exam-certificate.md`

## 自检重点

- [ ] 证书尺寸 1080×1440 像素（竖版）
- [ ] 证书编号格式：ZY-L{XX}-{YYYYMMDD}-{XXXX}
- [ ] 证书内容为签发时快照（不随用户后续修改变化）
- [ ] 雷达图 4 轴 + 通过线
- [ ] 庆祝动画轻量实现（CSS/Canvas，不引入重型库）
- [ ] 冷却期倒计时基于服务端 nextAvailableAt 计算
- [ ] 颜色仅 Rose/Sky/Amber，无 purple
- [ ] Tailwind CSS v4 语法
- [ ] Canvas 证书生成不依赖外部字体加载（使用系统字体或内嵌字体）

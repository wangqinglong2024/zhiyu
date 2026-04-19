# T04-013: 前端页面 — 课时学习页

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 15

## 需求摘要

实现课时学习页，包含三大核心区域：①顶部导航栏（返回 + 课时标题 + 进度指示）；②教学内容区（正文多语言渲染 + 词汇高亮弹窗 + 逐句音频播放 + 词汇卡片横向滑动 + 语法点展示）；③底部操作区（测验入口按钮）。本页面核心复杂度在于多语言渲染系统（6 种组合）和断点续学自动保存（每 30 秒 + 退出时保存 + 恢复滚动位置）。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/05-lesson-page.md`（课时学习页完整 PRD）
- 设计规范: `grules/06-ui-design.md`（Cosmic Refraction 设计系统）
- 关联 API: T04-005（Lesson 详情 API — 教学内容/词汇/语法）
- 关联 API: T04-006（学习进度保存 API — 断点续学）
- 关联页面: T04-012（课时列表 → 导航到本页面）

## 技术方案

### 页面路由

```
/courses/lessons/:lessonId → 课时学习页
```

### 组件拆分

```
pages/courses/lesson/
├── LessonPage.tsx                 — 页面容器（数据加载 + 进度保存 + 状态管理）
├── components/
│   ├── LessonNavBar.tsx           — 顶部导航栏（固定）
│   ├── LessonContent.tsx          — 教学内容区（可滚动容器）
│   ├── ContentParagraph.tsx       — 正文段落（多语言渲染核心组件）
│   ├── VocabHighlight.tsx         — 正文词汇高亮 + 点击弹 Popover
│   ├── VocabPopover.tsx           — 词汇弹出详情（毛玻璃 Popover）
│   ├── AudioPlayer.tsx            — 逐句音频播放按钮 + 声波动画
│   ├── VocabCardCarousel.tsx      — 词汇卡片横向滑动组
│   ├── VocabCard.tsx              — 单张词汇卡片（正反面翻转）
│   ├── GrammarSection.tsx         — 语法点区域
│   ├── GrammarPointCard.tsx       — 单个语法点（公式+说明+例句+结构图）
│   ├── LessonBottomBar.tsx        — 底部操作区（测验按钮）
│   └── LessonPageSkeleton.tsx     — 骨架屏
└── hooks/
    ├── useLessonData.ts           — 课时数据加载
    ├── useAutoSave.ts             — 断点续学自动保存（30s 定时器 + visibilitychange）
    ├── useMultiLangRenderer.ts    — 多语言渲染配置
    └── useAudioPlayer.ts          — 音频播放状态管理
```

### 多语言渲染系统（核心复杂度）

```
3 个用户配置项:
  A. 学习语言模式: "拼音+中文" / "纯中文"
  B. 解释语言开关: 开 / 关
  C. 解释语言: 跟随 UI 语言（越南语 / 英语）

6 种渲染组合:
┌───────────────┬──────────────┬──────────────────────────────┐
│ 语言模式       │ 解释语言开关  │ 渲染结果                      │
├───────────────┼──────────────┼──────────────────────────────┤
│ 拼音+中文      │ 开           │ 三行: 拼音 → 中文 → 越/英     │
│ 拼音+中文      │ 关           │ 两行: 拼音 → 中文             │
│ 纯中文         │ 开           │ 两行: 中文 → 越/英            │
│ 纯中文         │ 关           │ 一行: 纯中文                  │
└───────────────┴──────────────┴──────────────────────────────┘

字体规范:
  拼音行: 14px Inter, text-gray-500
  中文行: 18px "PingFang SC" / "Noto Sans CJK SC"
  解释行: 14px Inter, text-sky-500
  段落间距: 24px, 行间距: 4px
```

### 正文词汇高亮

```
规则:
  - 中文行内的重点词汇添加 Amber 色下划线 2px
  - 仅中文行高亮，拼音行和解释行不高亮
  - 点击高亮词 → 弹出 VocabPopover

VocabPopover 内容:
  - 毛玻璃材质 (.glass-card), 16px 圆角
  - 汉字(24px) + 拼音 + 🔊 发音按钮
  - 释义（跟随解释语言设置）
  - 例句
  - 关闭: 点击外部区域
```

### 逐句音频播放

```
每段中文行左侧小喇叭图标:
  - 默认: 灰色 Volume2 图标 16px
  - 播放中: Rose 色 + 声波动画（3 条竖线渐变脉动）
  - 播放中文本块: Rose 色淡背景高亮

行为:
  - 点击 → 播放该句音频
  - 再次点击 → 暂停
  - 播放完毕 → 自动停止（不自动连播）
  - 记录已播放音频 ID → 断点续学数据
```

### 词汇卡片横向滑动

```
位置: 正文下方，语法点上方
布局: 横向滑动，单屏约 1.2 张（露出下一张边缘）

单张卡片:
  - 200px 高，24px 圆角 (.glass-card)
  - 正面: 汉字 48px 居中 + 拼音 + 🔊 发音按钮
  - 背面: 释义 + 例句 + 🔊 发音按钮
  - 翻转: 3D Y 轴旋转 400ms Spring 缓动
  - 底部: 圆点指示器（Rose 色当前 / 灰色其他）
```

### 语法点展示

```
每个语法点:
  📐 图标(16px) + 语法点名称(H3)
  用法公式: code 背景（深色圆角区块）
  说明文字: 正文字号
  ✅ 正确例句: 绿色左边框 4px
  ❌ 常见错误: 红色左边框 4px + 删除线
  句型结构图: 表格形式（毛玻璃背景行）
```

### 底部操作区（固定）

```
首次学习模式:
  "开始测验" Rose 色按钮（须滚动到底部后才可用）
  未滚到底 → 按钮 disabled + opacity 0.45 + 提示文字

复习模式:
  "复习测验" 毛玻璃轮廓按钮（始终可用）
```

### 断点续学自动保存

```typescript
// hooks/useAutoSave.ts
function useAutoSave(lessonId: string) {
  // 30 秒定时器
  useInterval(() => {
    saveProgress({
      scroll_position: getScrollPercentage(),
      viewed_vocab_ids: getViewedVocabIds(),
      played_audio_ids: getPlayedAudioIds(),
      last_section_index: getCurrentSectionIndex(),
      study_seconds_delta: 30,
    })
  }, 30_000)

  // 页面退出时保存
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgressSync() // 使用 navigator.sendBeacon
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}
```

### 进入页面恢复逻辑

```
1. 加载课时数据
2. 查询 user_lesson_progress.resume_data
3. 若 resume_data 存在:
   - 恢复滚动位置（smooth scroll）
   - Toast "已恢复到上次学习位置"
4. 若不存在 → 从头开始
5. 更新课时状态为 in_progress（首次进入时）
```

## 范围（做什么）

- LessonPage 页面容器（数据加载 + 进度保存 + 状态机）
- 多语言渲染系统（6 种组合 + 3 种字体规范）
- 词汇高亮 + Popover 弹窗
- 逐句音频播放 + 声波动画
- 词汇卡片横向滑动 + 3D 翻转
- 语法点展示（公式 + 例句 + 结构图）
- 底部测验入口（滚动到底才可用）
- 断点续学自动保存（30s + visibilitychange + sendBeacon）
- 进入页面恢复滚动位置
- 骨架屏 Loading 态
- Dark / Light 模式
- 响应式布局
- `prefers-reduced-motion` 支持

## 边界（不做什么）

- 不实现课时小测验页面（T05 模块）
- 不实现离线缓存（P2 — 文本可浏览但音频不缓存）
- 不实现自动连播音频

## 涉及文件

- 新建: `frontend/src/pages/courses/lesson/LessonPage.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/LessonNavBar.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/LessonContent.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/ContentParagraph.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/VocabHighlight.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/VocabPopover.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/AudioPlayer.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/VocabCardCarousel.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/VocabCard.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/GrammarSection.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/GrammarPointCard.tsx`
- 新建: `frontend/src/pages/courses/lesson/components/LessonBottomBar.tsx`
- 新建: `frontend/src/pages/courses/lesson/hooks/useAutoSave.ts`
- 新建: `frontend/src/pages/courses/lesson/hooks/useMultiLangRenderer.ts`
- 新建: `frontend/src/pages/courses/lesson/hooks/useAudioPlayer.ts`
- 修改: `frontend/src/router/index.tsx` — 注册路由

## 依赖

- 前置: T04-005（Lesson 详情 API）、T04-006（进度保存 API）
- 前置: T04-012（课时列表 → 导航到本页面）
- 后续: T05-XXX（课时小测验 — 底部按钮跳转）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户设置"拼音+中文" + 解释语言开 **WHEN** 渲染正文 **THEN** 三行渲染（拼音 14px 灰 → 中文 18px → 越/英 14px Sky）
2. **GIVEN** 用户设置"纯中文" + 解释语言关 **WHEN** 渲染正文 **THEN** 一行渲染（纯中文 18px）
3. **GIVEN** 正文包含重点词"你好" **WHEN** 查看中文行 **THEN** "你好"有 Amber 下划线
4. **GIVEN** 点击高亮词"你好" **WHEN** Popover 弹出 **THEN** 毛玻璃弹窗含汉字+拼音+发音+释义
5. **GIVEN** 段落有音频 **WHEN** 点击喇叭图标 **THEN** 图标变 Rose 色 + 声波动画 + 文本高亮
6. **GIVEN** 音频播放中 **WHEN** 播放完毕 **THEN** 自动停止，不连播
7. **GIVEN** 词汇卡片区 **WHEN** 横向滑动 **THEN** 一屏显示约 1.2 张卡片
8. **GIVEN** 词汇卡片 **WHEN** 点击翻转 **THEN** 3D Y 轴旋转 400ms 显示背面
9. **GIVEN** 语法点有正误例句 **WHEN** 渲染语法区 **THEN** ✅ 绿色边框 + ❌ 红色边框 + 删除线
10. **GIVEN** 首次学习 + 未滚到底 **WHEN** 查看底部按钮 **THEN** "开始测验" 按钮 disabled
11. **GIVEN** 已滚到底部 **WHEN** 查看底部按钮 **THEN** "开始测验" 按钮可用
12. **GIVEN** 学习 30 秒 **WHEN** 定时器触发 **THEN** 自动保存进度（scroll/viewed/played）
13. **GIVEN** 切换到其他 App **WHEN** visibilitychange **THEN** sendBeacon 保存进度
14. **GIVEN** 有断点续学数据 **WHEN** 重新进入课时 **THEN** 自动恢复滚动位置 + Toast 提示
15. **GIVEN** 暗色模式 **WHEN** 查看页面 **THEN** Cosmic Refraction Dark 主题正确
16. **GIVEN** `prefers-reduced-motion` **WHEN** 查看页面 **THEN** 翻转/声波等动画静止

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 通过 Browser MCP 导航到课时学习页
3. 验证多语言渲染（切换 4 种配置组合）
4. 验证词汇高亮 + Popover 弹窗
5. 验证音频播放 + 声波动画
6. 验证词汇卡片滑动 + 翻转
7. 验证语法点展示
8. 验证底部按钮（滚到底启用）
9. 验证断点续学（保存 + 恢复）
10. 验证 Dark / Light 模式
11. 截图留存

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 6 种多语言渲染组合正确
- [ ] 词汇高亮 + Popover 正确
- [ ] 音频播放正确
- [ ] 词汇卡片滑动 + 翻转正确
- [ ] 语法点展示正确
- [ ] 底部按钮滚动逻辑正确
- [ ] 断点续学保存/恢复正确
- [ ] Dark/Light 模式正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-013-fe-lesson-page.md`

## 自检重点

- [ ] 设计: 字体规范（拼音 14px Inter / 中文 18px / 解释 14px Sky）
- [ ] 设计: Amber 下划线仅中文行
- [ ] 设计: 卡片 24px 圆角 + 200px 高
- [ ] 设计: 声波动画 3 条竖线脉动
- [ ] 交互: sendBeacon 保存（visibilitychange）
- [ ] 交互: 滚动到底才启用测验按钮
- [ ] 性能: 长内容页不卡顿（虚拟化或懒渲染）
- [ ] 无障碍: 音频播放有 aria-label
- [ ] 不使用 tailwind.config.js

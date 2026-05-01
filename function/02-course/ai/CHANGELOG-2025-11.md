# F1/F2/F3 规范变更说明（2025-11）

> 本文件为 **真理来源（source of truth）**。F1/F2/F3 各子文档若与此处冲突，以本文件为准。
> 与各 spec 配套的可视化效果详见 [F4-AI-原型设计/index.html](./F4-AI-原型设计/index.html)。

---

## 一、术语统一

| 旧术语 | 新术语 | 范围 |
|---|---|---|
| 赛道 / track | **主题 / theme** | 所有用户可见文案、UI、文档说明（DB 列名 `track_code` 等保持不变） |
| HK | **HSK** | 显示文案；DB 枚举值 `hk` 保留兼容 |

主题固定 5 个：`share / ec / fc / hsk / dl`，写死不可动态新增。其中 `share` 在 KP 表与题表中以两位码 **SH** 简写显示。

---

## 二、删除 AI 工作流（重大变更）

**决策：** 题目与 KP 数据由运营在系统外部使用 AI 生成，再通过数据库直接导入。系统内不再保留 AI Prompt 库与 Job 编排。

### 2.1 删除的原型页面

- `P-A-6 Prompt 库`
- `P-A-7 AI 工作台`
- `P-A-8 审核队列`

### 2.2 删除的接口集

- `F2/06 管理端-AI工作台.md`：A15 / A16 / A17 / A18 全部接口废弃
- `F2/07 管理端-审核与发布.md`：A19 / A20 审核队列与审核动作废弃；**仅保留学员举报相关（迁移到 P-A-9）**
- `F2/09 AI补充接口.md`：I1 / I2 / I3（AI 回调与 worker 心跳）全部废弃；保留 I5（cron 任务）

### 2.3 删除的数据库表

- `course_ai_prompts`
- `course_ai_generation_jobs`

> 已生成数据的可追溯字段（`questions.ai_job_id` 等）改为可空 / 弃用注释；保留历史记录但新增数据写 NULL。

### 2.4 内容审核流程

- 不再存在「待审核」中间态；所有数据导入即视为已审核（`status = approved`）。
- 学员举报（P-A-9）保留，由运营人工处理：详情 / 调整（跳转编辑抽屉）/ 手动采纳 / 忽略。
- 新增页面级开关「全局隐藏应用端举报入口」。

---

## 三、题目表 `course_questions` 变更

### 3.1 新增字段

```sql
exam_scope text[] not null default '{practice}'
  -- 允许值：practice | lesson_quiz | chapter_test | stage_exam | hsk_mock
  -- 决定该题在哪些考试场景被抽取，可多选
  -- 引擎规则：
  --   practice + lesson_quiz 共用题池
  --   chapter_test / stage_exam / hsk_mock 三者题池互斥（避免高阶考试题与日常练习重复）
```

### 3.2 删除/弱化字段

| 字段 | 处置 | 原因 |
|---|---|---|
| `difficulty` | 标记 deprecated（不再在 UI 展示与查询） | 由 `exam_scope` + `kp.hsk_level` 间接表达 |
| `created_by_ai` / `ai_job_id` | 保留，新数据写 NULL | AI Job 表已删除 |
| `usage_count` / `error_rate` | UI 不再展示 | 改由独立报表实现 |

### 3.3 列表 UI 变化

- P-A-5 题目列表移除：`难度 / 来源 / 使用率` 列
- 新增 `exam_scope` 列，显示 P/L/C/S/H 五个角标
- 删除「⚡AI 批量重生」「⚡AI 重生本题」按钮与模态

---

## 四、应用端 5 语言完整支持

### 4.1 支持语言

`zh / en / vi / th / id` 共 5 种。所有面向应用端的 i18n 字段必须包含 5 个 key（缺失时按 `en → zh` 回退）。

### 4.2 需 i18n 的对象类型

- 主题名 / 阶段名 / 章名 / 节名（`*_i18n` jsonb 5 key）
- KP 释义、例句翻译
- 题型枚举的友好名称（题型 code 仍是 ASCII）
- 系统提示文案、按钮文字、Toast

### 4.3 章名编辑器

P-A-2 / F3-06 中，章名编辑由原 zh+en 双语扩展为 **5 语言并排输入**（zh 必填，其余可空但 key 必须存在）。

### 4.4 应用端语言切换

- 顶部导航增加 `.zy-lang-pill` 全局语言切换器
- 设置弹窗中的语言下拉提供 5 个选项
- 切换后立即生效，并写入 `course_user_settings.ui_lang`

---

## 五、章/节默认数量规则

- **默认节数：6**（覆盖原"6 固定"决策）
- **可选值：4 / 6 / 8**
- 创建章时下拉默认 6，可改为 4 或 8

---

## 六、考试中心层级重构

### 6.1 新结构（应用端 P-C-6 与管理端 P-A-11）

```
主题选择 (5 个 pill: share / ec / fc / hsk / dl)
   └─ 进入主题后展示子层级 Tab
        ├─ 章测 (chapter_test)         ← 所有主题
        ├─ 阶段考 (stage_exam)         ← 所有主题
        └─ HSK 模考 (hsk_mock)         ← 仅 HSK 主题显示
```

### 6.2 删除

- 顶层「HSK 横考」独立 Tab（HSK 现在仅作为主题之一存在）

### 6.3 P-A-11 视图重设计

- 顶部主题切换 + 汇总卡（章测题池数 / 阶段考题池数 / 节末-练习题池数）
- 主体为 **阶段 → 章 → 节** 的层级展开视图，每个层级显示其归属的题数（按 `exam_scope` 统计）
- 蓝图编辑保留但简化（去掉难度分布、作弊检测等）
- HSK 主题额外展示「HSK 模考蓝图」表

---

## 七、移动端响应式修复

原型常见问题：长且不可换行的标签 / 横排控件在移动端竖排显示。统一规范：

- 标签行使用 `.zy-tag-row`（`display: flex; flex-wrap: wrap; gap: 8px`）
- 表格使用 `.zy-table-stack` + 单元格 `data-label` 属性，移动端自动转卡片式
- 长按钮 / 横排控件容器加 `flex-wrap: wrap; gap: ...`
- 页头使用 `flex-wrap: wrap; align-items: flex-start`，主标题块加 `flex: 1 1 240px; min-width: 0`

---

## 八、SVG 图标体系

emoji 图标在不同操作系统上风格差异大，且不能用 CSS 着色。统一替换为 SVG（注入到 `[data-icon]` 属性的元素中）。

可用 icon：`play / pause / speaker / flag / globe`（详见 `_assets/prototype.js` 中的 `window.zyIcon`）。

按钮样式 token：

- `.zy-play-btn`（紧凑播放按钮）
- `.zy-report-link`（弱化的举报入口，旗帜图标 + 文本链接）
- `.zy-lang-pill`（导航栏语言切换 pill）

---

## 九、附录：受影响文件清单

### 已直接修改（HTML 原型）

- `F4/index.html`（移除 P-A-6/7/8 卡片，封板说明重写）
- `F4/_assets/styles.css`（新增 SVG/i18n badge/lang pill/play btn/report link/tag-row/table-stack 等 token）
- `F4/_assets/prototype.js`（新增 `window.zyIcon` 与自动注入逻辑）
- `F4/P-C-1` ~ `F4/P-C-8`（应用端 1-2-4-5-6-7-8 全部更新）
- `F4/P-A-2 / P-A-3 / P-A-4 / P-A-5 / P-A-9 / P-A-11`（管理端更新）
- `F4/P-A-6 / P-A-7 / P-A-8` **已物理删除**

### Spec 文档（按本变更说明落实）

- F1：02（题目表加 exam_scope）/ 05（标记 prompts/jobs 表 DEPRECATED）/ 06（保留 exam_scope_type 枚举，弱化 difficulty）
- F2：06（整体废弃）/ 07（仅保留举报）/ 09（仅保留 cron）
- F3：05（考试中心层级）/ 06（5 语言章名编辑）/ 08（整体废弃）/ 09（仅保留举报）/ 10（重设计 P-A-11）
- temp：00 / 01（赛道→主题）/ 04（删 §4.6 AI 工作台）/ 05（考试中心层级 + 5 语言）/ 06（简化流程 B/D）

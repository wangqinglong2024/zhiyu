# T08-008: G8 阅读侦探社 — Phaser 游戏前端

> 分类: 08-游戏 G5-G8 (Games G5-G8)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 16+

## 需求摘要

实现 G8 阅读侦探社的 Phaser 3 前端游戏场景。玩家以"文字侦探"视角阅读短文、标记线索、解答推理题。核心体验：左侧文章阅读区（可滚动 + 线索高亮可点击）、右侧线索面板（收集的线索卡片）、题目弹窗（四选一 + 解析展示）、评级揭晓动画（B→SSS 等级动画）、案卷档案回看界面。整体侦探/悬疑氛围，羊皮纸/放大镜/档案夹视觉元素。强制横屏 1920×1080。

## 相关上下文

- 产品需求: `product/apps/07-games-g5-g8/04-g8-reading-detective.md` — G8 完整 PRD
  - §三 游戏画面布局（左侧阅读区 60% + 右侧线索面板 40%、底部进度条、题目弹窗）
  - §四 核心交互（翻页/滚动阅读、线索标记发光、答题选择+确认、解析展示、评级揭晓）
  - §五 PK 模式布局（双方进度对比 + 答题进度条）
  - §六 上瘾机制（评级星级动画、侦探徽章收集、案卷档案展示）
  - §七 状态矩阵
- 游戏设计: `game/08-reading-detective.md`
  - §四 视觉与交互（侦探办公桌、羊皮纸文章、放大镜互动、案卷夹）
  - §七.1 Phaser 3 场景结构
- 通用 HUD: `product/apps/05-game-common/08-hud-landscape.md`
- 前端规范: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统
- UI 规范: `grules/06-ui-design.md`
- 关联任务: T08-007（G8 后端）→ 本任务 | T06-010（Phaser 容器框架）→ 本任务

## 技术方案

### Phaser 3 场景架构

```
G8ReadingDetective/
├── BootScene.ts              # 资源预加载（羊皮纸纹理、放大镜、音效、字体）
├── ReadingScene.ts           # 阅读阶段场景
│   ├── ArticleView.ts        # 左侧文章阅读区（滚动 + 线索高亮区域）
│   ├── CluePanel.ts          # 右侧线索面板（线索卡片收集展示）
│   ├── ClueCard.ts           # 单条线索卡片（线索文本 + 类型标签 + 发现动画）
│   ├── ReadingProgress.ts    # 底部阅读进度条 + 预计阅读时间
│   └── MagnifierEffect.ts    # 放大镜悬停效果（线索区域放大 + 光圈）
├── QuestionScene.ts          # 答题阶段场景
│   ├── QuestionCard.ts       # 题目卡片（题型标签 + 题目文本 + 四选项）
│   ├── OptionButton.ts       # 选项按钮（A/B/C/D + 选中/正确/错误状态）
│   ├── ExplanationPanel.ts   # 解析面板（正确答案 + 解析文字 + 关联原文引用）
│   ├── ProgressDots.ts       # 题目进度指示器（5 个圆点 + 对错状态）
│   └── TimerDisplay.ts       # 答题倒计时（限时模式）
├── RatingScene.ts            # 评级揭晓场景
│   ├── RatingReveal.ts       # 评级动画（信封开启 → 评级卡翻转 → 星级展示）
│   ├── ScoreBreakdown.ts     # 分项得分展示（准确/速度/线索/连对）
│   ├── BadgeDisplay.ts       # 徽章展示（首次通关/完美通关/文体专家等）
│   └── TitleUpgrade.ts       # 称号升级动画
├── PKOverlay.ts              # PK 模式覆盖层
│   ├── OpponentProgress.ts   # 对手答题进度条
│   └── PKSettlement.ts       # PK 最终对比结算
├── CasefileView.ts           # 案卷档案回看界面
├── GameOverOverlay.ts        # 超时 / 放弃结算
└── SkinManager.ts            # 皮肤系统预留
```

### 核心组件详细设计

#### 1. 文章阅读区 ArticleView

```typescript
// 左侧 60%（约 1120×900px）
// 背景：羊皮纸/旧纸质感 rgba(245,235,215,0.2) + 纸张褶皱纹理
// 顶部：文章标题 H1 28px 白色 + 作者/朝代 Body S 14px 灰色
// 正文：Body 18px 白色 行高 1.8，缩进 2em
// 可垂直滚动，右侧滚动条 4px Amber 色
//
// 线索区域：
//   关键句自带淡黄底色 rgba(251,191,36,0.15)
//   鼠标悬停：底色加深 rgba(251,191,36,0.3) + 放大镜图标光标
//   点击标记：Amber 色下划线 + 右侧线索面板新增卡片 + 发现音效
//   已标记线索：持续 Amber 底色 + 下划线
//
// 滚动到底部时：提示 "阅读完成，准备答题" 按钮出现
```

#### 2. 线索面板 CluePanel

```typescript
// 右侧 40%（约 760×900px）
// 标题："线索板" H2 20px + 放大镜图标 + "X/Y 已发现" Badge
// 线索卡片纵向排列，间距 12px
// 可滚动
// 未发现线索：虚线边框 + "?" 占位 + "继续阅读寻找线索" 提示
// 底部："开始答题" 按钮（阅读完成后高亮）

// ClueCard 设计：
//   160px 高度，圆角 12px 毛玻璃
//   线索文本 Body S 14px 白色（引用原文片段）
//   类型标签："修辞" / "论据" / "转折" Caption 12px 白边框
//   发现动画：从左侧文章对应位置飞入面板（400ms 弧线）
```

#### 3. 题目卡片 QuestionCard

```typescript
// 居中弹窗 700×500px 毛玻璃面板
// 顶部：题型标签（"修辞手法" Rose / "作者意图" Sky / "逻辑关系" Amber / "情感色彩" Rose / "文体辨析" Sky）
// 题目文本：H2 20px 白色，最多 3 行
// 四选项纵向排列，间距 12px

// OptionButton 设计：
//   全宽 640×56px 圆角 12px
//   默认：毛玻璃 rgba(255,255,255,0.08) + 白色文字
//   选中：Sky 蓝边框 2px + 背景加深
//   正确：绿色背景 rgba(34,197,94,0.3) + ✓ 图标
//   错误：Rose 红背景 rgba(225,29,72,0.3) + ✗ 图标
//   确认按钮：底部药丸形 Rose 红 160×48px "确认"
```

#### 4. 解析面板 ExplanationPanel

```typescript
// 答题后弹出，替换选项区域
// 400×300px 毛玻璃面板
// "解析" 标题 H2 20px Amber 色
// 正确答案：Body 16px "正确答案：B. 白描" Sky 蓝色
// 解析文字：Body S 14px 白色 80%（2-4 行）
// 原文引用：Body S 14px Amber 底色斜体（引用关联线索句）
// "下一题" 按钮 / "查看评级" 按钮（最后一题）
```

#### 5. 评级揭晓 RatingReveal

```typescript
// 全屏覆盖动画序列

// 阶段 1：信封入场（0-800ms）
//   密封信封从底部升起 + 旋转入场
//   "侦探报告" 封面文字

// 阶段 2：开信封（800-1500ms）
//   信封翻盖打开动画
//   报告卡从信封中抽出 + 上移

// 阶段 3：评级展示（1500-2500ms）
//   评级字母 Display 96px 从模糊到清晰
//   B=灰色 / A=Sky 蓝 / S=Amber 金 / SS=Rose 红 / SSS=彩虹渐变
//   星级：B=1★ A=2★ S=3★ SS=4★ SSS=5★
//   SSS 额外：烟花粒子 + 金色光芒 + 庆祝旋律

// 阶段 4：分项得分（2500-4000ms）
//   逐项淡入：准确率 → 速度 → 线索 → 连对 → 总分
//   每项数字滚动计数动画
```

### 核心交互实现

#### 阅读阶段入场（PRD §4.1）

```
时间线：
0ms    — 侦探办公桌背景淡入
200ms  — 文章羊皮纸卷轴从中央展开（展开 600ms）
500ms  — 标题+作者淡入
700ms  — 正文逐段淡入（每段 200ms 延迟）
1000ms — 线索面板从右侧滑入
1200ms — 提示 "找出文中的关键线索" 浮现 2 秒
1500ms — 阅读交互激活
```

#### 线索发现（PRD §4.2）

```
触发：点击线索区域文本

0ms    — 放大镜聚焦效果（原文周围暗化 0.3 + 线索区放大 120%）
200ms  — Amber 色下划线从左到右绘制（300ms）
300ms  — 线索文本复制体从原文位置飞向右侧面板（400ms 弧线轨迹）
500ms  — 线索卡片在面板中展开（翻转入场 300ms）
600ms  — "线索 +1" 飘字（Amber 金色 上移淡出）
700ms  — 线索面板计数器更新（弹跳）
音效   — 发现铃声 + 翻页声
```

#### 答题交互（PRD §4.3）

```
进入答题：
0ms    — 文章区缩小至 40% + 左移（留出题目空间）
200ms  — 题目卡片从右侧滑入（400ms）
400ms  — 进度指示器淡入（5 个圆点，第 1 个高亮）

选择选项：
0ms    — 选项 Sky 蓝边框 + 背景加深
100ms  — 确认按钮激活（可点击）

确认答案（正确）：
0ms    — 选中选项变绿色 + ✓ + 缩放 105%
200ms  — 得分飘字 "+200" Sky 蓝色
300ms  — 进度圆点变绿色 ✓
500ms  — 解析面板淡入

确认答案（错误）：
0ms    — 选中选项变 Rose 红 + ✗ + 震动
100ms  — 正确选项变绿色高亮
200ms  — 进度圆点变 Rose 红 ✗
500ms  — 解析面板淡入 + 原文对应线索高亮闪烁
```

### PK 模式布局（PRD §5）

```
顶部 HUD 扩展：
  左侧 — 己方：头像 + 昵称 + 侦探称号
  右侧 — 对手：头像 + 昵称 + 侦探称号
  中央 — "vs" + 文章标题

双方答题进度对比：
  己方进度条（Sky 蓝）⬛⬛⬛⬜⬜ 3/5
  对手进度条（Rose 红）⬛⬛⬜⬜⬜ 2/5

WebSocket 实时更新：
  g8_progress → 更新对手进度条 + 正确数
  g8_complete → 对手完成标记 + "对手已完成" 提示
  g8_settlement → 最终对比面板

最终对比面板：
  双方评级并排展示（左 己方 vs 右 对手）
  准确率/速度/总分逐项对比
  胜负宣告
```

### 音效设计

| 场景 | 音效 |
|------|------|
| 文章展开 | 卷轴展开声 + 纸张沙沙声 |
| 线索发现 | 发现铃声 + 翻页声 |
| 答题正确 | 清脆确认音 |
| 答题错误 | 短促错误音 + 轻微叹息 |
| 评级揭晓 — 信封 | 拆信声 |
| 评级揭晓 — SSS | 烟花 + 庆祝旋律 |
| 评级揭晓 — B | 低沉鼓声 |
| 称号升级 | 升级庆祝音效 |
| 倒计时紧迫 | 心跳/嘀嗒声 |

## 范围（做什么）

- 实现 G8 Phaser 3 BootScene（侦探风格资源预加载）
- 实现 ReadingScene（文章阅读区 + 线索面板 + 阅读进度条）
- 实现文章阅读区（滚动、线索高亮、点击标记、放大镜效果）
- 实现线索面板（卡片收集、发现动画飞入、计数器）
- 实现 QuestionScene（题目卡片 + 四选项按钮 + 进度指示器）
- 实现选项交互（选中、确认、正确/错误状态动画）
- 实现解析面板（答案 + 解析 + 原文引用）
- 实现 RatingScene（信封开启 → 评级翻转 → 星级展示 → 分项得分）
- 实现 PK 模式覆盖层（对手进度条 + 最终对比结算）
- 实现案卷档案回看界面（历史记录列表 + 详情查看）
- 实现称号展示 + 升级动画
- 实现 Game Over / 超时结算
- 对接 T08-007 后端 API（获取文章+题目、提交答案、完成评级、案卷查询）

## 边界（不做什么）

- 不写后端逻辑（T08-007）
- 不写匹配/结算页面（T06）
- 不写通用 HUD（T06-010 复用）
- 不实现文章朗读（后期功能）
- 不实现文章收藏功能（T09 个人中心）

## 涉及文件

- 新建: `frontend/src/games/g8-reading-detective/BootScene.ts`
- 新建: `frontend/src/games/g8-reading-detective/ReadingScene.ts`
- 新建: `frontend/src/games/g8-reading-detective/QuestionScene.ts`
- 新建: `frontend/src/games/g8-reading-detective/RatingScene.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/ArticleView.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/CluePanel.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/ClueCard.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/ReadingProgress.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/MagnifierEffect.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/QuestionCard.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/OptionButton.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/ExplanationPanel.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/ProgressDots.ts`
- 新建: `frontend/src/games/g8-reading-detective/components/TimerDisplay.ts`
- 新建: `frontend/src/games/g8-reading-detective/rating/RatingReveal.ts`
- 新建: `frontend/src/games/g8-reading-detective/rating/ScoreBreakdown.ts`
- 新建: `frontend/src/games/g8-reading-detective/rating/BadgeDisplay.ts`
- 新建: `frontend/src/games/g8-reading-detective/rating/TitleUpgrade.ts`
- 新建: `frontend/src/games/g8-reading-detective/pk/OpponentProgress.ts`
- 新建: `frontend/src/games/g8-reading-detective/pk/PKSettlement.ts`
- 新建: `frontend/src/games/g8-reading-detective/CasefileView.ts`
- 新建: `frontend/src/games/g8-reading-detective/GameOverOverlay.ts`
- 新建: `frontend/src/games/g8-reading-detective/SkinManager.ts`
- 新建: `frontend/src/games/g8-reading-detective/types.ts`
- 修改: `frontend/src/games/index.ts` — 注册 G8 游戏场景

## 依赖

- 前置: T08-007（G8 后端文章库与评级逻辑）
- 前置: T06-010（Phaser 游戏容器框架）
- 前置: T06-009（匹配页面前端）
- 前置: T06-011（结算页面前端）
- 后续: 无（G8 完整闭环）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入 G8 单人侦查模式  
   **WHEN** 游戏开始  
   **THEN** 办公桌背景淡入 → 文章卷轴展开 → 正文逐段淡入 → 线索面板滑入 → 阅读交互激活

2. **GIVEN** 阅读文章中  
   **WHEN** 鼠标悬停线索区域  
   **THEN** 底色加深 + 放大镜图标光标 + 线索区域放大提示

3. **GIVEN** 点击线索区域  
   **WHEN** 线索被标记  
   **THEN** 下划线绘制 → 线索文本飞向右侧面板（弧线 400ms） → 线索卡片翻转入场 → 计数器 +1

4. **GIVEN** 阅读完成进入答题  
   **WHEN** 第一道题展示  
   **THEN** 文章区缩小左移 + 题目卡片右侧滑入 + 题型标签彩色 + 进度指示器 5 个圆点

5. **GIVEN** 选择某选项并确认  
   **WHEN** 答案正确  
   **THEN** 选项变绿 + ✓ + 得分飘字 → 进度圆点变绿 → 解析面板淡入

6. **GIVEN** 选择某选项并确认  
   **WHEN** 答案错误  
   **THEN** 选中选项 Rose 红 + ✗ + 震动 → 正确选项高亮 → 进度圆点变红 → 解析面板 + 原文线索闪烁

7. **GIVEN** 5 题全部答完  
   **WHEN** 评级揭晓  
   **THEN** 信封入场 → 开信封 → 评级字母渐显 → 星级 → 分项得分逐项计数

8. **GIVEN** 获得 SSS 评级  
   **WHEN** 评级揭晓  
   **THEN** 彩虹渐变评级字母 + 5 颗星 + 烟花粒子 + 庆祝旋律

9. **GIVEN** PK 模式  
   **WHEN** 对手每答一题  
   **THEN** 顶部对手进度条实时更新（答题数 + 正确数）

10. **GIVEN** 查看案卷档案  
    **WHEN** 进入案卷界面  
    **THEN** 历史案卷列表展示（文章标题 + 评级 + 得分 + 日期）+ 点击查看详情

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. `docker compose logs --tail=30 backend` — 后端无报错
5. Browser MCP 导航到 G8 游戏入口页面
6. 验证阅读阶段完整流程（文章展开 → 滚动阅读 → 线索标记）
7. 验证答题阶段（选择 → 确认 → 正确/错误动画 → 解析）
8. 验证评级揭晓动画（信封 → 评级 → 分项得分）
9. 验证 PK 模式进度同步
10. 验证案卷档案回看
11. 验证横屏强制 landscape
12. 截图记录 Light + Dark 模式
13. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Phaser 场景正常加载，无 JS 报错
- [ ] 文章阅读区滚动流畅
- [ ] 线索标记交互正常（悬停 + 点击 + 飞入动画）
- [ ] 答题选项交互正常（选中 + 确认 + 状态变化）
- [ ] 评级揭晓动画完整（信封 → 评级 → 得分）
- [ ] PK 实时同步正常
- [ ] 横屏强制生效
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/08-games-g5-g8/` 下创建同名结果文件

结果文件路径: `/tasks/result/08-games-g5-g8/T08-008-g8-reading-detective-frontend.md`

## 自检重点

- [ ] UI: 色彩仅限 Rose/Sky/Amber + 中性色，严禁紫色
- [ ] UI: 侦探/悬疑氛围（羊皮纸、放大镜、档案夹视觉元素）
- [ ] UI: 所有动画带 transition，过渡自然
- [ ] 性能: 60 FPS，长文章滚动无掉帧
- [ ] 性能: 线索飞入动画流畅
- [ ] 性能: 评级动画序列流畅无卡顿
- [ ] 横屏: landscape 强制
- [ ] 无障碍: prefers-reduced-motion 时关闭非核心动画
- [ ] 皮肤: 文章纹理/面板/字体可替换接口预留
- [ ] 安全: 正确答案不在前端代码中暴露（仅提交后由服务端返回）

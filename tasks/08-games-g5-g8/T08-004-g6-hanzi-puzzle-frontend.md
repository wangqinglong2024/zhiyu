# T08-004: G6 汉字华容道 — Phaser 游戏前端

> 分类: 08-游戏 G5-G8 (Games G5-G8)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 15+

## 需求摘要

实现 G6 汉字华容道的 Phaser 3 前端游戏场景。核心为 4×4 / 5×5 华容道滑块棋盘，玩家通过拖拽/点击/方向键移动汉字方块到正确位置。包括目标文本展示区、棋盘交互区、步数/时间信息区、提示高亮、PK 模式对手进度条、多人竞速排名面板。方块具备汉字+拼音双行显示，正确位置绿色底纹，拖拽手感模拟实体滑块摩擦感。场景强制横屏 1920×1080，砚台/书桌古风视觉。

## 相关上下文

- 产品需求: `product/apps/07-games-g5-g8/02-g6-hanzi-puzzle.md` — G6 完整 PRD
  - §三 游戏画面布局（目标区左上、棋盘中央、信息区右上、倒计时底部）
  - §四 核心交互（拖拽手势、点击滑动、方向键、提示高亮、解题成功烟花、失败碎裂）
  - §五 PK 模式布局（双方棋盘并排 / 己方大+对手缩略）
  - §六 上瘾机制（最少步数挑战金星、连续完美解题计数）
  - §七 状态矩阵
- 游戏设计: `game/06-hanzi-puzzle.md`
  - §四 视觉与交互（砚台/书桌、墨色方块、毛笔字质感）
  - §七.1 Phaser 3 场景结构
- 通用 HUD: `product/apps/05-game-common/08-hud-landscape.md`
- 前端规范: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统
- UI 规范: `grules/06-ui-design.md` — 毛玻璃参数、动效铁律
- 关联任务: T08-003（G6 后端）→ 本任务 | T06-010（Phaser 容器框架）→ 本任务

## 技术方案

### Phaser 3 场景架构

```
G6HanziPuzzle/
├── BootScene.ts              # 资源预加载（方块纹理、背景、音效、字体）
├── GameScene.ts              # 核心游戏主场景
│   ├── PuzzleBoard.ts        # 棋盘容器（4×4 或 5×5 网格管理）
│   ├── PuzzleTile.ts         # 单个方块（汉字+拼音、正确标记、拖拽交互）
│   ├── TargetDisplay.ts      # 左上目标文本展示（完整文本+拼音+释义）
│   ├── InfoPanel.ts          # 右上信息面板（步数计数、用时、提示余量）
│   ├── CountdownBar.ts       # 底部倒计时进度条（极速模式/PK 模式）
│   ├── HintOverlay.ts        # 提示高亮覆盖层（目标方块闪烁+箭头指向）
│   ├── ScorePopup.ts         # 解题成功得分弹窗（分项展示）
│   └── EffectManager.ts      # 特效管理（方块吸附、正确归位光效、解题烟花）
├── PKScene.ts                # PK 模式场景扩展
│   ├── OpponentBoard.ts      # 对手棋盘缩略图（实时进度）
│   ├── ProgressBar.ts        # 对手进度条（完成百分比 + 步数）
│   ├── RoundSettlement.ts    # 回合间结算卡片
│   └── RaceLeaderboard.ts    # 多人竞速排名面板
├── GameOverOverlay.ts        # Game Over / 结算展示
└── SkinManager.ts            # 皮肤系统（方块/棋盘/字体可替换）
```

### 核心组件详细设计

#### 1. 方块 PuzzleTile

```typescript
interface PuzzleTileConfig {
  char: string               // 汉字
  pinyin: string             // 拼音
  gridRow: number            // 当前棋盘行
  gridCol: number            // 当前棋盘列
  correctRow: number         // 正确位置行
  correctCol: number         // 正确位置列
  isEmpty: boolean           // 是否空位
}

// 视觉规范
// 4×4 模式：方块尺寸 120×120px，间距 8px，棋盘总宽 504px
// 5×5 模式：方块尺寸 96×96px，间距 6px，棋盘总宽 504px
// 方块背景：深灰/墨色 rgba(40,40,40,0.85) + 轻微纸纹
// 汉字：H1 32px 白色毛笔字（4×4）/ H2 24px（5×5），居中
// 拼音：Caption 10px 白色 60%，汉字下方 4px
// 正确位置：底纹渐变至 Sky 蓝色 rgba(56,189,248,0.3) + 对号标记
// 拖拽中：放大 105% + 阴影 8px + z-index 提升
// 滑动动画：吸附到网格 200ms easeOutQuart
```

#### 2. 棋盘 PuzzleBoard

```typescript
// 棋盘居中显示，砚台/书桌背景
// 网格线：rgba(255,255,255,0.1) 1px
// 方块排列：行列对齐到网格

// 拖拽交互：
//   1. pointerdown → 方块放大 + 高亮
//   2. pointermove → 沿合法方向（水平/垂直）跟随手指
//   3. pointerup → 吸附到目标格 / 回弹到原位
//   4. 仅允许向空位方向滑动（单方向限制）

// 点击交互：
//   点击空位相邻方块 → 直接滑动到空位（无需拖拽）

// 键盘交互（桌面端）：
//   上下左右方向键 → 移动空位相邻方块
//   空格 → 请求提示
```

#### 3. 目标展示 TargetDisplay

```typescript
// 左上区域 300×120px
// 标题 "目标" Caption 12px 白色 60%
// 目标文本 H1 32px 白色（如 "同舟共济"）
// 拼音 Body S 14px 白色 40%
// 释义 Body S 14px 白色 60%（单行，过长省略）
// 已归位字高亮 Sky 蓝色（实时更新）
```

#### 4. 信息面板 InfoPanel

```typescript
// 右上区域 200×120px
// 步数：Display 36px 白色 + "步" 16px 灰色
// 最优步数：Body S 14px "最优 8 步" 灰色
// 用时：Body 16px "01:23" 白色
// 提示：3 个灯泡图标（已用灰色，未用 Amber 色）
// 已归位：2/4 个 + 进度条
```

#### 5. 提示高亮 HintOverlay

```typescript
// 目标方块 Amber 色边框闪烁 4 次（300ms 间隔）
// 箭头从目标方块指向它应到达的空位方向
// 其余方块降低到 30% 透明度
// 持续 2 秒后自动消失
```

### 核心交互实现

#### 题目入场（PRD §4.1）

```
时间线：
0ms    — 目标文本从顶部滑入展示（300ms）
200ms  — 棋盘从中央缩放入场（0.8 → 1.0，400ms easeOutBack）
400ms  — 方块逐个翻转入场（每块 100ms 延迟，3D 翻转效果）
800ms  — 信息面板淡入 + 倒计时启动
1000ms — 棋盘交互激活
```

#### 拖拽滑动完整流程（PRD §4.2）

```
pointerdown:
  → 方块放大 105% + 投影 + z-index 提升
  → 轻触振动反馈（移动端 10ms）

pointermove:
  → 沿合法方向跟随手指（超出半格自动切换目标格）
  → 有阻尼感（移动距离 × 0.9）

pointerup (>50% 格子距离):
  → 方块吸附到目标格（200ms easeOutQuart）
  → 空位更新
  → 原空位方块反向补位
  → 步数 +1 弹跳

pointerup (<50% 格子距离):
  → 方块回弹到原位（150ms easeOutBounce）
  → 不计步数
```

#### 方块归位反馈

```
0ms    — 方块底纹渐变至 Sky 蓝色 rgba(56,189,248,0.3)（300ms）
100ms  — 右上角出现 ✓ 标记（Sky 蓝色）
150ms  — 轻微缩放 105% → 100%
200ms  — 对应目标文本字高亮 Sky 蓝色
音效   — 清脆 "叮" 一声
```

#### 解题成功（PRD §4.4）

```
时间线：
0ms    — 所有方块同时闪光（白色光晕 500ms）
200ms  — 棋盘上方烟花粒子特效（Sky+Amber 色 2 秒）
500ms  — 得分弹窗（毛玻璃面板 400×300px）
         基础分 500
         步数奖励 +200 (最优解) 金色
         速度奖励 +100 金色
         提示惩罚 -50 灰色
         总分 750 Display 48px Sky 蓝色
800ms  — "完美!" / "出色!" / "不错!" 评语
1500ms — 自动进入下一题（无尽模式）或 结算

最优解达成额外：⭐ 金星标记 + 星形粒子 + 特殊音效
```

### PK 模式布局（PRD §5）

```
左侧 65% — 己方棋盘（正常交互尺寸）
右侧 35% — 对手区域
  对手信息：头像 32px + 昵称 14px
  对手棋盘缩略：1:3 缩小（仅显示方块位置，无交互）
  对手进度条：Sky 蓝色填充 + 百分比文字
  对手步数：Body S 14px "15 步"

WebSocket 实时更新：
  g6_progress → 更新对手缩略棋盘 + 进度条 + 步数
  g6_complete → 对手棋盘烟花 + "对手已完成" 提示
  g6_round_end → 回合结算卡片

多人竞速：右侧排名面板 → 2-4 人进度条纵向排列
```

### 音效设计

| 场景 | 音效 |
|------|------|
| 方块滑动 | 木块摩擦滑动声 |
| 方块归位 | 清脆 "叮" 确认音 |
| 方块回弹 | 轻微 "嗒" 碰撞声 |
| 请求提示 | 翻页/提示音 |
| 解题成功 | 烟花+欢快旋律 |
| 最优解达成 | 特殊金星闪烁音 |
| 超时 | 蜂鸣警告音 |
| 倒计时紧迫 | 最后 10 秒心跳/嘀嗒 |

## 范围（做什么）

- 实现 G6 Phaser 3 BootScene（资源预加载）
- 实现核心 GameScene（棋盘 + 目标展示 + 信息面板 + 倒计时）
- 实现方块 PuzzleTile（汉字+拼音、正确标记、拖拽/点击/键盘三种交互）
- 实现棋盘 PuzzleBoard（4×4 / 5×5 网格管理、空位追踪、合法方向判定）
- 实现拖拽手势检测（阻尼感、吸附阈值、回弹动画）
- 实现桌面端方向键交互
- 实现归位视觉反馈（底纹渐变 + ✓ 标记 + 目标文本高亮）
- 实现提示高亮（目标方块闪烁 + 箭头 + 其余降透明度）
- 实现解题成功特效（全屏闪光 + 烟花 + 得分弹窗 + 评语）
- 实现 PK 模式（对手缩略棋盘 + 进度条 + WebSocket 同步）
- 实现多人竞速排名面板
- 实现 Game Over 展示（Game Over 文字 + 统计数据）
- 对接 T08-003 后端 API（生成题目、提交滑动、请求提示）

## 边界（不做什么）

- 不写后端游戏逻辑（T08-003 已完成）
- 不写匹配页面（T06-009）
- 不写结算页面（T06-011）
- 不写通用 HUD（T06-010，复用）
- 不实现 5×5 以上棋盘

## 涉及文件

- 新建: `frontend/src/games/g6-hanzi-puzzle/BootScene.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/GameScene.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/PKScene.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/components/PuzzleBoard.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/components/PuzzleTile.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/components/TargetDisplay.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/components/InfoPanel.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/components/CountdownBar.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/components/HintOverlay.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/components/ScorePopup.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/components/EffectManager.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/pk/OpponentBoard.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/pk/ProgressBar.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/pk/RoundSettlement.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/pk/RaceLeaderboard.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/GameOverOverlay.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/SkinManager.ts`
- 新建: `frontend/src/games/g6-hanzi-puzzle/types.ts`
- 修改: `frontend/src/games/index.ts` — 注册 G6 游戏场景

## 依赖

- 前置: T08-003（G6 后端题目与逻辑）
- 前置: T06-010（Phaser 游戏容器框架）
- 前置: T06-009（匹配页面前端）
- 前置: T06-011（结算页面前端）
- 后续: 无（G6 完整闭环）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入 G6 单人无尽模式  
   **WHEN** 游戏开始  
   **THEN** 目标文本从顶部滑入，棋盘缩放入场，方块逐个翻转入场，交互激活

2. **GIVEN** 棋盘交互已激活  
   **WHEN** 拖拽空位相邻方块超过格子 50%  
   **THEN** 方块吸附到空位（200ms easeOutQuart），步数 +1，原位成为新空位

3. **GIVEN** 棋盘交互已激活  
   **WHEN** 拖拽方块但未超过格子 50%  
   **THEN** 方块回弹到原位（150ms easeOutBounce），不计步数

4. **GIVEN** 桌面端  
   **WHEN** 按方向键  
   **THEN** 空位对应方向的方块滑入空位（与拖拽效果一致）

5. **GIVEN** 方块滑到正确位置  
   **WHEN** 服务端确认 correct_positions 增加  
   **THEN** 方块底纹渐变 Sky 蓝 + ✓ 标记 + 目标文本对应字高亮

6. **GIVEN** 最后一个方块归位  
   **WHEN** 解题成功  
   **THEN** 全屏闪光 → 烟花粒子 → 得分弹窗（分项展示）→ 自动进入下一题

7. **GIVEN** PK 模式  
   **WHEN** 对手每步操作  
   **THEN** 右侧对手缩略棋盘实时更新 + 进度条填充增加

8. **GIVEN** 点击提示按钮  
   **WHEN** 提示次数 > 0  
   **THEN** 目标方块 Amber 色闪烁 + 箭头指向 + 其余方块降透明度

9. **GIVEN** 极速模式  
   **WHEN** 倒计时剩余 < 10 秒  
   **THEN** 进度条 Rose 红闪烁 + 嘀嗒音效

10. **GIVEN** 单人无尽模式  
    **WHEN** 步数恰好等于最优解  
    **THEN** 额外金星 ⭐ 标记 + 星形粒子特效 + "完美!" 评语

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. `docker compose logs --tail=30 backend` — 后端无报错
5. Browser MCP 导航到 G6 游戏入口页面
6. 验证 4×4 完整解题流程（拖拽 + 点击 + 键盘）
7. 验证 5×5 棋盘显示与交互
8. 验证提示高亮效果
9. 验证 PK 模式对手缩略棋盘同步
10. 验证横屏强制 landscape
11. 截图记录 Light + Dark 模式
12. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Phaser 场景正常加载，无 JS 报错
- [ ] 拖拽交互流畅（60 FPS），吸附/回弹手感自然
- [ ] 方向键交互正常
- [ ] 归位视觉反馈正确
- [ ] PK 实时同步正常
- [ ] 横屏强制生效
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/08-games-g5-g8/` 下创建同名结果文件

结果文件路径: `/tasks/result/08-games-g5-g8/T08-004-g6-hanzi-puzzle-frontend.md`

## 自检重点

- [ ] UI: 色彩仅限 Rose/Sky/Amber + 中性色，严禁紫色
- [ ] UI: 砚台/书桌古风背景 + 墨色方块质感
- [ ] UI: 所有动画带 transition，拖拽流畅无卡顿
- [ ] 性能: 60 FPS，16 / 25 个方块同时渲染无掉帧
- [ ] 性能: 拖拽延迟 < 16ms（一帧内响应）
- [ ] 横屏: landscape 强制
- [ ] 无障碍: prefers-reduced-motion 时关闭非核心动画
- [ ] 皮肤: 方块/棋盘/字体可替换接口预留

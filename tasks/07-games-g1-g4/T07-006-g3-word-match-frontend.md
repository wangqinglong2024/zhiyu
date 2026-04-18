# T07-006: G3 词语消消乐 — Phaser 游戏前端

> 分类: 07-游戏 G1-G4 (Games G1-G4)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 15+

## 需求摘要

实现 G3 词语消消乐的 Phaser 3 前端游戏场景。包括 7×7 棋盘渲染（圆角方块 + 匹配类型颜色底色）、交换操作（点击/滑动 + 有效/无效反馈）、语义配对消除动画（类型标签弹出 + 粒子爆散）、连锁消除 Cascade 动画（分层自动消除 + 计数显示）、特殊方块视觉与激活特效（炸弹爆炸/彩虹扫射/横扫闪电）、Combo 特效、洗牌/提示道具、PK 模式对手分数同步、Game Over 序列。场景封装为独立 Phaser Scene，通过 T06-010 容器加载。

## 相关上下文

- 产品需求: `product/apps/06-games-g1-g4/03-g3-word-match.md` — G3 完整 PRD（**核心依据**）
  - §三 游戏画面布局（棋盘 700×700 + 左侧信息栏 + 右侧学习统计 + 底部提示条）
  - §三.3 中央棋盘区（88×88px 方块、间距 8px、圆角 12px、匹配类型颜色）
  - §三.6 匹配类型颜色系统（近义词绿/反义词红/搭配词蓝）
  - §四.2 方块交换操作（选中态、有效/无效交换动画）
  - §四.3 消除动画（配对高亮 → 类型标签 → 方块消除 → 下落 → 补入 → 连锁）
  - §四.4 特殊方块视觉与激活特效
  - §四.5 连锁消除 Cascade（分层间隔 300ms）
  - §六 Game Over（外圈到内圈翻转变灰）
  - §八 Combo 特效（NICE!/BRILLIANT!!/GENIUS!!!）
  - §八.1 特殊方块特效（爆炸/彩虹扫射/闪电/全屏清除）
- 游戏设计: `game/03-word-match.md`
  - §四 视觉与交互设计
  - §五 上瘾机制（cascade 连锁爽感、学习反馈）
- 通用框架: `product/apps/05-game-common/08-hud-landscape.md` — 通用 HUD
- 设计规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 关联任务: T07-005（G3 后端）→ 本任务 | T06-010（Phaser 容器）→ 本任务

## 技术方案

### Phaser 3 场景架构

```
G3WordMatch/
├── BootScene.ts              # 资源预加载（方块纹理、特殊方块图标、音效）
├── GameScene.ts              # 核心游戏主场景
│   ├── BoardRenderer.ts      # 7×7 棋盘渲染 + 方块管理
│   ├── SwapHandler.ts        # 交换操作（选中 + 拖动 + 有效/无效反馈）
│   ├── MatchAnimator.ts      # 配对消除动画（高亮 + 标签 + 粒子）
│   ├── CascadeAnimator.ts    # 连锁自动消除动画（分层 300ms）
│   ├── SpecialBlocks.ts      # 特殊方块视觉与激活特效
│   ├── FillAnimator.ts       # 方块下落 + 新方块补入动画
│   ├── ComboDisplay.ts       # Combo 特效（NICE/BRILLIANT/GENIUS）
│   ├── InfoPanel.ts          # 左侧信息栏（匹配图例 + 洗牌 + 提示）
│   ├── LearningPanel.ts      # 右侧学习统计（本局学到的配对）
│   └── BottomBar.ts          # 底部选中词语信息 + 匹配图例
├── PKScene.ts                # PK 模式场景（对手分数实时同步）
├── GameOverOverlay.ts        # Game Over 外圈翻转灰化动画
└── SkinManager.ts            # 皮肤系统预留
```

### 核心组件详细设计

#### 1. BoardRenderer — 7×7 棋盘

```typescript
// frontend/src/features/games/g3/scenes/components/BoardRenderer.ts

interface WordBlock {
  container: Phaser.GameObjects.Container
  wordId: string
  word: string
  pinyin: string
  pos: string                          // noun / verb / adj / adv / other
  pairTypeHint: 'synonym' | 'antonym' | 'collocation'
  type: 'normal' | 'obstacle' | 'bomb' | 'rainbow' | 'sweep'
  gridPos: { row: number; col: number }
  isSelected: boolean
}

class BoardRenderer {
  /**
   * 棋盘渲染（PRD §三.3）：
   * - 7×7 网格，居中于 700×700px 区域
   * - 方块 88×88px，间距 8px，圆角 12px
   * - 棋盘背景：深色半透明面板 rgba(0,0,0,0.3)，圆角 24px
   */
  renderBoard(boardData: BoardData): void

  /**
   * 方块视觉（PRD §三.3 + §三.6）：
   * - 背景色按匹配类型：
   *   - 近义词: rgba(34,197,94,0.2) 绿色淡底 + 边框 #22c55e
   *   - 反义词: rgba(225,29,72,0.2) 红色淡底 + 边框 #e11d48
   *   - 搭配词: rgba(2,132,199,0.2) 蓝色淡底 + 边框 #0284c7
   * - 中心词语 Body S 14px 白色字重 600
   * - 右上角类型小圆点 8px（🟢/🔴/🔵）
   * - 顶部 1px 白色内阴影（光泽效果）
   */
  createWordBlock(cell: CellData): WordBlock

  /**
   * 石头方块（PRD §五.1 无尽模式 60 消除后出现）：
   * - 灰色 #404040，岩石纹理
   * - 不可选中、不可移动
   */
  createObstacleBlock(position: GridPosition): WordBlock

  /**
   * 特殊方块视觉（PRD §四.4）：
   * - 炸弹: 叠加💣图标 + 边缘发光脉冲
   * - 彩虹: 彩虹渐变色 + ✨闪烁
   * - 横扫: 叠加⚡图标 + 水平/垂直线条动画
   */
  createSpecialBlock(type: SpecialType, position: GridPosition, word: string): WordBlock
}
```

#### 2. SwapHandler — 交换操作

```typescript
// frontend/src/features/games/g3/scenes/components/SwapHandler.ts

class SwapHandler {
  /**
   * 选中态（PRD §四.2）：
   * - 点击第一个方块 → 放大 105% + 白色光圈边框 2px + 上浮 y-4px
   * - 底部提示条显示该词拼音 + 释义 + 匹配类型
   * - 可配对的相邻方块显示微弱呼吸光效
   */
  handleFirstSelect(block: WordBlock): void

  /**
   * 有效交换（PRD §四.2）：
   * - 两方块 200ms 平滑交换位置
   * → 触发消除动画
   */
  playValidSwap(blockA: WordBlock, blockB: WordBlock): Promise<void>

  /**
   * 无效交换（PRD §四.2）：
   * - 两方块尝试交换（移动到一半 100ms）
   * - 自动回弹原位（100ms）
   * - 两方块同时左右微晃 2 次（±4px，200ms）
   * - 音效：沉闷 "嗡" 提示音
   */
  playInvalidSwap(blockA: WordBlock, blockB: WordBlock): Promise<void>
}
```

#### 3. MatchAnimator — 消除动画

```typescript
// frontend/src/features/games/g3/scenes/components/MatchAnimator.ts

class MatchAnimator {
  /**
   * 消除动画序列（PRD §四.3）：
   * 
   * 1. 配对高亮（0ms）：参与方块白色脉冲光，扩散 110%，150ms
   * 2. 类型标签弹出（100ms）：配对方块之间弹出关系标签
   *    - "近义 ✓" 绿色 / "反义 ✓" 红色 / "搭配 ✓" 蓝色
   *    - H3 20px，上浮 40px 后淡出，持续 800ms
   * 3. 方块消除（200ms）：缩小至 0% + 同色粒子爆散 8 个，300ms
   * 4. 得分飘字（250ms）：Amber 色 H3 20px，上移 60px 后淡出
   */
  playMatchAnimation(match: MatchData): Promise<void>
}
```

#### 4. CascadeAnimator — 连锁消除

```typescript
// frontend/src/features/games/g3/scenes/components/CascadeAnimator.ts

class CascadeAnimator {
  /**
   * 连锁消除动画（PRD §四.5）：
   * 
   * 1. 每层间隔 300ms（让玩家看清）
   * 2. 连锁计数：棋盘上方 "Chain ×2" → "Chain ×3"（金色 H2 24px）
   * 3. 层数越高 → 粒子越华丽（颜色越鲜艳、粒子数越多）
   * 4. ≥ 3 层：屏幕微震 ±2px，100ms
   * 5. ≥ 5 层：背景出现短暂金色光芒扩散
   */
  playCascade(cascadeLayers: CascadeLayer[]): Promise<void>
}
```

#### 5. SpecialBlocks — 特殊方块特效

```typescript
// frontend/src/features/games/g3/scenes/components/SpecialBlocks.ts

class SpecialBlocks {
  /**
   * 炸弹特效（PRD §八.1）：
   * - 中心白色闪光 → 3×3 方块碎裂飞散 → 冲击波涟漪
   * - 音效：低沉爆炸音 + 碎裂音
   */
  playBombEffect(position: GridPosition): Promise<void>

  /**
   * 彩虹特效（PRD §八.1）：
   * - 彩虹光线从方块射出 → 命中所有同类型方块
   * - 命中方块依次闪光消除（间隔 50ms，扫射效果）
   * - 音效：升调扫射音 + 叮叮叮连续消除音
   */
  playRainbowEffect(position: GridPosition, targetPositions: GridPosition[]): Promise<void>

  /**
   * 横扫特效（PRD §八.1）：
   * - 闪电从方块向行/列两端同时射出
   * - 经过方块依次电击消除（间隔 30ms）
   * - 音效：电击"滋滋"音
   */
  playSweepEffect(position: GridPosition, direction: 'horizontal' | 'vertical'): Promise<void>

  /**
   * 全屏清除（彩虹×2，PRD §八.1）：
   * - 全屏白色闪光 → 所有方块同时爆裂 → 彩色碎片漫天
   * - 新方块雨点般落入
   * - 音效：盛大管弦乐爆发 2 秒
   */
  playFullClearEffect(): Promise<void>
}
```

#### 6. FillAnimator — 方块下落与补入

```typescript
// frontend/src/features/games/g3/scenes/components/FillAnimator.ts

class FillAnimator {
  /**
   * 方块下落（PRD §四.3 步骤 5-6）：
   * - 上方方块受重力下落填补空位
   * - 带弹跳效果：落到位后回弹 4px，200ms
   * - 音效：轻微 "哒哒" 落地音
   */
  playDropAnimation(dropData: DropData[]): Promise<void>

  /**
   * 新方块补入（PRD §四.3 步骤 6）：
   * - 顶部生成新方块从上方滑入 200ms
   * - 带轻微弹跳
   */
  playFillAnimation(fillData: FillData[]): Promise<void>
}
```

#### 7. InfoPanel — 左侧信息栏

```typescript
// frontend/src/features/games/g3/scenes/components/InfoPanel.ts

class InfoPanel {
  /**
   * 左侧信息栏（PRD §三.4，宽 160px）：
   * - 匹配类型图例（近义🟢 / 反义🔴 / 搭配🔵）
   * - 洗牌按钮（Lucide Shuffle，48×48px）+ 剩余次数 ×3
   * - 提示按钮（Lucide Lightbulb，48×48px）+ 剩余次数 ×3
   */
  render(): void

  /**
   * 提示效果：高亮闪烁一组可消除配对，闪烁 3 次，1.5 秒
   */
  playHintAnimation(positions: GridPosition[]): void

  /**
   * 洗牌效果：所有方块旋转飞散后重新落入（1 秒动画）
   */
  playShuffleAnimation(): Promise<void>
}
```

#### 8. GameOverOverlay — Game Over

```typescript
// frontend/src/features/games/g3/scenes/GameOverOverlay.ts

class GameOverOverlay {
  /**
   * Game Over 动画（PRD §六）：
   * 1. 所有方块从外圈到内圈翻转变灰（每圈间隔 150ms）
   * 2. 屏幕中央 "Game Over"（Display 48px，白色）
   * 3. 1.5 秒后过渡结算页
   */
  playGameOver(): Promise<void>
}
```

### 与通用框架集成

```typescript
// frontend/src/features/games/g3/G3GameConfig.ts

export function createG3Config(sessionData: SessionData): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [
      new G3BootScene(sessionData),
      sessionData.mode === 'pk_1v1' || sessionData.mode === 'multiplayer'
        ? new G3PKScene(sessionData)
        : new G3GameScene(sessionData),
    ],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  }
}
```

## 范围（做什么）

- 实现 G3 BootScene（方块纹理集、特殊方块图标、音效预加载）
- 实现 BoardRenderer（7×7 棋盘渲染、匹配类型颜色底色、方块视觉）
- 实现 SwapHandler（选中态、有效/无效交换动画、拖动支持）
- 实现 MatchAnimator（配对高亮 → 类型标签 → 粒子爆散 → 得分飘字）
- 实现 CascadeAnimator（分层自动消除、Chain 计数、震屏、金光扩散）
- 实现 SpecialBlocks（炸弹爆炸/彩虹扫射/横扫闪电/全屏清除特效）
- 实现 FillAnimator（方块下落弹跳 + 新方块补入）
- 实现 ComboDisplay（NICE!/BRILLIANT!!/GENIUS!!! 特效）
- 实现 InfoPanel（匹配图例 + 洗牌/提示按钮 + 洗牌动画）
- 实现 LearningPanel（本局学到的配对实时列表）
- 实现 BottomBar（选中词语信息展示）
- 实现 PKScene（对手分数实时显示 + 消除类型图标反馈）
- 实现 GameOverOverlay（外圈翻转变灰序列）
- 实现 SkinManager 皮肤接口预留
- 实现 React 页面入口（G3GamePage）

## 边界（不做什么）

- 不写后端配对验证/计分逻辑（T07-005）
- 不写匹配页面/结算页面（T06-010/T06-011）
- 不写通用 HUD 暂停/退出（T06-010）
- 不制作实际皮肤素材

## 涉及文件

- 新建: `frontend/src/features/games/g3/scenes/BootScene.ts`
- 新建: `frontend/src/features/games/g3/scenes/GameScene.ts`
- 新建: `frontend/src/features/games/g3/scenes/PKScene.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/BoardRenderer.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/SwapHandler.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/MatchAnimator.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/CascadeAnimator.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/SpecialBlocks.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/FillAnimator.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/ComboDisplay.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/InfoPanel.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/LearningPanel.ts`
- 新建: `frontend/src/features/games/g3/scenes/components/BottomBar.ts`
- 新建: `frontend/src/features/games/g3/scenes/GameOverOverlay.ts`
- 新建: `frontend/src/features/games/g3/SkinManager.ts`
- 新建: `frontend/src/features/games/g3/G3GameConfig.ts`
- 新建: `frontend/src/features/games/g3/types.ts`
- 新建: `frontend/src/pages/games/g3-word-match/G3GamePage.tsx`
- 修改: `frontend/src/router/index.tsx` — 注册 G3 路由

## 依赖

- 前置: T07-005（G3 后端题库与游戏逻辑）
- 前置: T06-010（Phaser 容器框架 + LandscapeGuard）
- 前置: T06-005（WebSocket — PK 模式通信）
- 后续: 无

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入 G3 无尽模式  
   **WHEN** 游戏启动  
   **THEN** 7×7 棋盘正确渲染，每个方块 88×88px 圆角 12px，按匹配类型着色（绿/红/蓝淡底）

2. **GIVEN** 点击一个方块  
   **WHEN** 方块被选中  
   **THEN** 方块放大 105% + 白色光圈 + 上浮 4px，底部提示条显示拼音 + 释义

3. **GIVEN** 交换两个构成近义词配对的方块  
   **WHEN** 消除触发  
   **THEN** 配对高亮 → "近义 ✓" 绿色标签弹出 → 方块缩小消除 + 绿色粒子 → 得分飘字

4. **GIVEN** 交换两个不构成任何配对的方块  
   **WHEN** 交换无效  
   **THEN** 两方块移到一半后回弹 + 左右微晃 2 次 + "嗡" 提示音

5. **GIVEN** 消除后方块下落产生新配对  
   **WHEN** 连锁 Cascade 触发  
   **THEN** 每层间隔 300ms 自动消除 + "Chain ×N" 金色计数递增 + ≥3 层屏幕微震

6. **GIVEN** 4 消产生炸弹方块  
   **WHEN** 炸弹方块被激活  
   **THEN** 中心白色闪光 → 3×3 范围碎裂飞散 → 冲击波涟漪 + 爆炸音效

7. **GIVEN** 彩虹方块被激活  
   **WHEN** 配对类型为近义词  
   **THEN** 彩虹光线射出 → 命中所有绿色近义词方块 → 依次闪光消除（间隔 50ms）

8. **GIVEN** 无尽模式洗牌次数用完且无可消除  
   **WHEN** Game Over 触发  
   **THEN** 方块从外圈到内圈翻转变灰（每圈 150ms）→ "Game Over" → 结算页

9. **GIVEN** PK 模式对手消除得分  
   **WHEN** 接收 WebSocket 分数同步  
   **THEN** 对手分数跳动 + 对手头像旁显示消除类型图标（🟢/🔴/🔵）

10. **GIVEN** 连续 5 次有效消除  
    **WHEN** Combo 触发  
    **THEN** "BRILLIANT!!" Amber 金色 Display 48px + 棋盘边缘金色光带

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 导航到 G3 游戏页面
4. 验证 7×7 棋盘渲染 + 匹配类型颜色
5. 验证选中态 + 交换操作
6. 验证消除动画 + 类型标签弹出
7. 验证 Cascade 连锁分层动画
8. 验证特殊方块特效
9. 验证 Game Over 外圈翻转灰化
10. 截图记录关键验证点

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] Phaser 3 场景稳定 60 FPS
- [ ] 7×7 棋盘渲染正确，方块间距一致
- [ ] 匹配类型颜色系统正确（绿/红/蓝）
- [ ] 选中态 + 有效/无效交换动画流畅
- [ ] 消除动画序列完整（高亮 → 标签 → 消除 → 下落 → 补入）
- [ ] Cascade 分层动画间隔 300ms
- [ ] 特殊方块四种特效全部验证
- [ ] Combo 三级特效正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 3 次失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/07-games-g1-g4/T07-006-g3-word-match-frontend.md`

## 自检重点

- [ ] 性能: 60 FPS，49 方块 + 特效同屏无卡顿
- [ ] 性能: Cascade 10 层连锁动画流畅
- [ ] 性能: 全屏清除（49 方块同时爆裂）不掉帧
- [ ] 交互: 选中 + 交换操作灵敏跟手
- [ ] 视觉: 匹配类型颜色清晰（绿近义/红反义/蓝搭配）
- [ ] 视觉: 方块右上角类型小圆点可辨识
- [ ] 无障碍: 不完全依赖颜色区分（小圆点 + 标签文字辅助）
- [ ] 音效: 消除递增音阶、Cascade 连锁音效、特殊方块音效
- [ ] UI: 无紫色，色彩限 Rose/Sky/Amber + 中性色

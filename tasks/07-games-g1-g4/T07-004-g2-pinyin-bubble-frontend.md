# T07-004: G2 拼音泡泡龙 — Phaser 游戏前端

> 分类: 07-游戏 G1-G4 (Games G1-G4)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 15+

## 需求摘要

实现 G2 拼音泡泡龙的 Phaser 3 前端游戏场景。包括蜂巢排列泡泡阵列渲染、底部发射器瞄准线（含反弹预测）、泡泡射击物理（碰壁反弹 + 蜂巢吸附）、拼音-汉字匹配消除动画、连锁反应（Cascade）瀑布掉落特效（核心爽感）、声调颜色泡泡系统、PK 模式分屏（己方 60% + 对手 40%）、垃圾泡泡落入动画、死亡线预警。场景封装为独立 Phaser Scene，通过 T06-010 容器加载。

## 相关上下文

- 产品需求: `product/apps/06-games-g1-g4/02-g2-pinyin-bubble.md` — G2 完整 PRD（**核心依据**）
  - §三 游戏画面布局（泡泡阵列区 700px + 发射区 300px + 死亡线 + PK 分屏）
  - §四 核心交互（瞄准发射、匹配消除、连锁 cascade 动画、特殊泡泡效果）
  - §三.3 泡泡视觉（蜂巢排列、声调着色、光泽高光、悬浮动画）
  - §三.4 发射区（发射器造型、瞄准线、反弹预测、下一泡泡预览、交换操作）
  - §六 生命值系统（触底判定、死亡线变红、最后机会 3 秒缓冲、Game Over 动画）
- 产品需求: `product/apps/06-games-g1-g4/00-index.md` §二.4 — 声调颜色规范
- 游戏设计: `game/02-pinyin-bubble.md`
  - §二 声调颜色系统
  - §二.3 特殊泡泡视觉与效果
- 通用框架: `product/apps/05-game-common/08-hud-landscape.md` — 通用 HUD
- 设计规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 关联任务: T07-003（G2 后端）→ 本任务 | T06-010（Phaser 容器）→ 本任务

## 技术方案

### Phaser 3 场景架构

```
G2PinyinBubble/
├── BootScene.ts              # 资源预加载（泡泡纹理、发射器精灵、音效）
├── GameScene.ts              # 核心游戏主场景（单人模式）
│   ├── BubbleGrid.ts         # 蜂巢排列泡泡阵列管理
│   ├── Launcher.ts           # 发射器（瞄准 + 发射 + 反弹预测）
│   ├── BubblePhysics.ts      # 泡泡飞行物理（碰壁反弹 + 吸附）
│   ├── MatchAnimator.ts      # 匹配消除动画
│   ├── CascadeAnimator.ts    # 连锁掉落瀑布动画（核心爽感）
│   ├── SpecialBubbles.ts     # 特殊泡泡效果（彩虹/炸弹/冰冻）
│   ├── DeathLine.ts          # 死亡线 + 预警系统
│   └── ScoreHUD.ts           # 分数 + Combo + 清屏数
├── PKScene.ts                # PK 模式场景（左右分屏）
│   └── OpponentView.ts       # 对手缩略泡泡阵列 + 垃圾泡泡动画
├── GameOverOverlay.ts        # Game Over 泡泡爆裂动画
└── SkinManager.ts            # 皮肤系统预留
```

### 核心组件详细设计

#### 1. BubbleGrid — 蜂巢泡泡阵列

```typescript
// frontend/src/features/games/g2/scenes/components/BubbleGrid.ts

interface BubbleSprite {
  container: Phaser.GameObjects.Container
  hanziId: string
  hanzi: string
  pinyin: string
  tone: number
  type: 'normal' | 'obstacle' | 'garbage' | 'rainbow' | 'bomb' | 'frozen'
  gridPos: { row: number; col: number }
}

class BubbleGrid {
  /**
   * 蜂巢排列渲染（PRD §三.3）：
   * - 奇数行 10 个，偶数行 9 个（交错排列）
   * - 单个泡泡直径 64px，间距 4px
   * - 阵列水平居中
   */
  renderGrid(boardData: BoardData): void

  /**
   * 泡泡视觉（PRD §三.3）：
   * - 圆形泡泡，右上方白色高光弧（球体质感）
   * - 底色按声调：一声蓝 #0284c7 / 二声绿 #22c55e / 三声橙 #d97706 / 四声红 #e11d48 / 轻声灰 #a3a3a3
   * - 中心汉字 16px 白色字重 600
   * - 轻微悬浮动画（±2px，周期 2s，随机相位）
   */
  createBubbleSprite(bubble: BubbleData): BubbleSprite

  /**
   * 垃圾泡泡视觉（PRD §三.3）：
   * - 灰色 #404040，无文字，裂纹纹理
   * - 落入时下坠 + 弹跳动画
   */
  addGarbageBubbles(positions: GridPosition[], animated: boolean): void

  /**
   * 泡泡下降（生存模式每 N 秒一行）
   * - 整行下移动画 + 顶部补入新行
   */
  descendOneLine(): void

  /** 吸附泡泡到最近的空蜂巢位置 */
  snapToGrid(worldPos: { x: number; y: number }): GridPosition

  /** 获取六方向相邻泡泡 */
  getAdjacentBubbles(pos: GridPosition): BubbleSprite[]

  /** 移除泡泡（消除后） */
  removeBubbles(positions: GridPosition[]): void
}
```

#### 2. Launcher — 发射器

```typescript
// frontend/src/features/games/g2/scenes/components/Launcher.ts

class Launcher {
  /**
   * 发射器视觉（PRD §三.4）：
   * - 底部水平居中，距底部 40px
   * - 圆形底座 80×80px + 炮管指向瞄准方向
   * - 底座内显示当前拼音泡泡（直径 56px，声调色）
   * - 左侧下一泡泡预览（直径 40px，透明度 60%）
   * - 右侧剩余交换次数 🔄 ×3
   */
  render(): void

  /**
   * 瞄准线（PRD §四.1）：
   * - 触摸拖动：瞄准线从发射器向触摸方向延伸
   * - 白色虚线（透明度 50%，线段 12px + 间隔 8px）
   * - 显示一次反弹预测路径
   * - 角度范围：10°-170°（水平面以上左右各 80°）
   * - 末端半透明泡泡轮廓（预测落点）
   */
  drawAimLine(pointerX: number, pointerY: number): void

  /**
   * 反弹路径计算
   * - 泡泡碰左/右墙壁 → 反射角 = 入射角
   * - 预计算一次反弹后的落点
   */
  calculateBouncePath(angle: number): { path: Phaser.Math.Vector2[]; landingPos: Phaser.Math.Vector2 }

  /**
   * 发射（PRD §四.1）：
   * - 松手触发发射，速度 1200 px/s
   * - 发射器后坐动画（下移 4px，100ms 回弹）
   * - 泡泡飞行拖尾效果（40px 渐透明尾迹）
   */
  shoot(): void

  /**
   * 交换操作：点击下一泡泡预览 → 交换
   * - 每局限 3 次
   */
  swapBubble(): void
}
```

#### 3. CascadeAnimator — 连锁掉落动画（核心爽感）

```typescript
// frontend/src/features/games/g2/scenes/components/CascadeAnimator.ts

class CascadeAnimator {
  /**
   * 连锁掉落动画（PRD §四.3 — 核心爽感设计）：
   * 
   * 1. 延迟分层：悬空泡泡从断点处按距离分层掉落
   *    - 每层间隔 80ms → "哗啦啦" 瀑布效果
   * 
   * 2. 掉落物理：
   *    - 重力加速 800 px/s²
   *    - 轻微左右摇摆（正弦，振幅 ±8px）
   * 
   * 3. 触底消散：
   *    - 泡泡到屏幕底部爆裂为 4-6 个彩色碎片
   *    - 碎片向两侧飞散
   * 
   * 4. 连锁计数：
   *    - 屏幕中央 "Cascade ×N" 金色 H2 24px
   *    - 每个掉落泡泡 +1
   * 
   * 5. 屏幕震动：
   *    - ≥ 10 个掉落时，屏幕震动 ±3px，300ms
   */
  playCascade(cascadeLayers: CascadeLayer[]): Promise<void>

  /**
   * 连锁音效：
   * - 每个泡泡掉落 "嘀" 音，音调递增（上升音阶）
   * - ≥ 10 个连锁：叠加 "哗啦" 群碎音效
   */
  playCascadeAudio(count: number): void
}
```

#### 4. DeathLine — 死亡线与预警

```typescript
// frontend/src/features/games/g2/scenes/components/DeathLine.ts

class DeathLine {
  /**
   * 死亡线视觉（PRD §三.3）：
   * - 发射区上方 80px 处
   * - 白色虚线（透明度 30%，线段 8px + 间隔 8px）
   * - 泡泡接近（< 2 行）：死亡线变 Rose 红色 + 缓慢闪烁
   */
  render(): void

  /**
   * 死亡预警（PRD §六）：
   * - 距死亡线 ≤ 2 行：线变红 + 背景音乐加速 + 屏幕边缘红色光晕
   */
  updateWarning(closestBubbleRow: number): void

  /**
   * 最后机会缓冲（PRD §六）：
   * - 泡泡触达死亡线 → 3 秒缓冲期
   * - 3 秒内可快速发射消除
   * - 超时 → 正式 Game Over
   */
  triggerLastChance(): Promise<boolean>

  /**
   * Game Over 动画（PRD §六）：
   * 1. 泡泡从下到上依次爆裂（每行间隔 100ms）
   * 2. 灰色碎片
   * 3. "Game Over" Display 48px
   * 4. 1.5 秒后过渡到结算页
   */
  playGameOver(): Promise<void>
}
```

#### 5. PKScene — PK 模式分屏

```typescript
// frontend/src/features/games/g2/scenes/PKScene.ts

class G2PKScene extends Phaser.Scene {
  /**
   * PK 分屏布局（PRD §三.5）：
   * ┌─────────────────────────────┬──────────────────────┐
   * │   己方游戏区 60%              │   对手区 40%          │
   * │                             │                      │
   * │  泡泡阵列（完整交互）          │  泡泡阵列（缩略展示）  │
   * │                             │  缩略泡泡直径 32px    │
   * │                             │  对手分数 + 昵称      │
   * │  发射器                      │  对手发射动画（简化）   │
   * └─────────────────────────────┴──────────────────────┘
   * 中间分隔线：1px 白色线透明度 20%
   */

  /**
   * WebSocket 同步：
   * - 接收对手消除事件 → 更新对手缩略阵列
   * - 接收垃圾泡泡 → 在己方阵列顶部生成灰色垃圾泡泡 + 下坠弹跳动画
   * - 接收对手 Game Over → 显示胜利
   */
  handleGarbageIncoming(event: GarbageBubbleEvent): void
  handleOpponentSync(state: PlayerState): void
}
```

### 与通用框架集成

```typescript
// frontend/src/features/games/g2/G2GameConfig.ts

export function createG2Config(sessionData: SessionData): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },  // 泡泡无默认重力，手动控制
        debug: false,
      },
    },
    scene: [
      new G2BootScene(sessionData),
      sessionData.mode === 'pk_1v1' || sessionData.mode === 'multiplayer'
        ? new G2PKScene(sessionData)
        : new G2GameScene(sessionData),
    ],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  }
}
```

## 范围（做什么）

- 实现 G2 BootScene（泡泡纹理集、发射器精灵、音效预加载）
- 实现 BubbleGrid（蜂巢排列渲染、声调着色、悬浮动画、吸附逻辑）
- 实现 Launcher（瞄准线、反弹预测、发射动画、交换操作）
- 实现 BubblePhysics（飞行、碰壁反弹、吸附到蜂巢位）
- 实现 MatchAnimator（配对高亮、消除炸裂、粒子爆散）
- 实现 CascadeAnimator（分层瀑布掉落、触底消散、计数显示、屏幕震动）
- 实现 SpecialBubbles（彩虹全消、炸弹范围消、冰冻效果动画）
- 实现 DeathLine（预警闪烁、最后机会缓冲、Game Over 序列爆裂）
- 实现 PKScene（60/40 分屏、对手缩略阵列、垃圾泡泡落入动画）
- 实现 SkinManager 皮肤接口预留
- 实现 React 页面入口（G2GamePage）
- 声调颜色系统全面应用（泡泡底色 + 粒子色 + 发射泡泡色）

## 边界（不做什么）

- 不写后端匹配/出题/计分逻辑（T07-003）
- 不写匹配页面/结算页面（T06-010/T06-011）
- 不写通用 HUD 暂停/退出（T06-010）
- 不制作实际皮肤素材

## 涉及文件

- 新建: `frontend/src/features/games/g2/scenes/BootScene.ts`
- 新建: `frontend/src/features/games/g2/scenes/GameScene.ts`
- 新建: `frontend/src/features/games/g2/scenes/PKScene.ts`
- 新建: `frontend/src/features/games/g2/scenes/components/BubbleGrid.ts`
- 新建: `frontend/src/features/games/g2/scenes/components/Launcher.ts`
- 新建: `frontend/src/features/games/g2/scenes/components/BubblePhysics.ts`
- 新建: `frontend/src/features/games/g2/scenes/components/MatchAnimator.ts`
- 新建: `frontend/src/features/games/g2/scenes/components/CascadeAnimator.ts`
- 新建: `frontend/src/features/games/g2/scenes/components/SpecialBubbles.ts`
- 新建: `frontend/src/features/games/g2/scenes/components/DeathLine.ts`
- 新建: `frontend/src/features/games/g2/scenes/components/ScoreHUD.ts`
- 新建: `frontend/src/features/games/g2/scenes/OpponentView.ts`
- 新建: `frontend/src/features/games/g2/SkinManager.ts`
- 新建: `frontend/src/features/games/g2/G2GameConfig.ts`
- 新建: `frontend/src/features/games/g2/types.ts`
- 新建: `frontend/src/pages/games/g2-pinyin-bubble/G2GamePage.tsx`
- 修改: `frontend/src/router/index.tsx` — 注册 G2 路由

## 依赖

- 前置: T07-003（G2 后端题库与游戏逻辑）
- 前置: T06-010（Phaser 容器框架 + LandscapeGuard）
- 前置: T06-005（WebSocket — PK 模式通信）
- 后续: 无

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入 G2 单人生存模式  
   **WHEN** 游戏启动  
   **THEN** 蜂巢排列泡泡阵列正确渲染（6 行），每个泡泡按声调着色 + 显示汉字 + 悬浮动画

2. **GIVEN** 游戏进行中  
   **WHEN** 触摸屏幕拖动瞄准  
   **THEN** 瞄准线实时跟随，显示反弹路径预测 + 落点半透明泡泡轮廓

3. **GIVEN** 发射拼音泡泡  
   **WHEN** 泡泡碰到左/右墙壁  
   **THEN** 泡泡以反射角反弹，继续飞行直到碰到阵列泡泡或顶部

4. **GIVEN** 拼音泡泡命中对应汉字泡泡  
   **WHEN** 匹配消除  
   **THEN** 白色光圈脉冲 → 两泡泡炸裂 + 粒子爆散 → 得分飘字

5. **GIVEN** 消除后有泡泡失去与顶部连接  
   **WHEN** 触发连锁掉落  
   **THEN** 泡泡按距离分层掉落（每层 80ms）、左右摇摆、触底碎裂 + "Cascade ×N" 计数 + 上升音阶音效

6. **GIVEN** 泡泡阵列距死亡线 ≤ 2 行  
   **WHEN** 检测预警  
   **THEN** 死亡线变红闪烁 + 背景音乐加速 + 屏幕边缘红色光晕

7. **GIVEN** 泡泡触达死亡线  
   **WHEN** 3 秒最后机会期结束  
   **THEN** 泡泡从下到上依次爆裂（每行 100ms）→ "Game Over" → 跳转结算

8. **GIVEN** PK 模式  
   **WHEN** 我方消除泡泡后对手收到垃圾  
   **THEN** 对手区顶部灰色垃圾泡泡落入 + 下坠弹跳动画

9. **GIVEN** 获得彩虹泡泡  
   **WHEN** 发射命中一个蓝色（一声）泡泡  
   **THEN** 全阵列所有蓝色泡泡闪烁后消除，华丽全消特效

10. **GIVEN** 声调颜色系统  
    **WHEN** 渲染四声字泡泡  
    **THEN** 泡泡底色为红色 `#e11d48`（Rose），发射泡泡中拼音文字同色

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 导航到 G2 游戏页面
4. 验证蜂巢排列泡泡阵列渲染
5. 验证瞄准线 + 反弹预测
6. 验证发射 + 碰壁反弹 + 吸附
7. 验证匹配消除 + 连锁瀑布动画
8. 验证死亡线预警 + Game Over 序列
9. 验证 PK 分屏 + 垃圾泡泡
10. 截图记录关键验证点

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] Phaser 3 场景稳定 60 FPS
- [ ] 蜂巢排列正确（交错行列）
- [ ] 瞄准线反弹预测准确
- [ ] 泡泡碰壁反射角正确
- [ ] 吸附到蜂巢网格对齐
- [ ] 连锁瀑布动画分层掉落流畅
- [ ] 声调颜色规范正确
- [ ] PK 分屏布局 60/40 比例正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 3 次失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/07-games-g1-g4/T07-004-g2-pinyin-bubble-frontend.md`

## 自检重点

- [ ] 性能: 60 FPS，100+ 泡泡同屏不卡顿
- [ ] 性能: 连锁掉落 50 泡泡时动画流畅
- [ ] 物理: 反弹角度精确，吸附位置正确
- [ ] 交互: 瞄准线灵敏跟手，无延迟感
- [ ] 视觉: 声调颜色一致（蓝/绿/橙/红/灰）
- [ ] 视觉: 垃圾泡泡灰色 + 裂纹纹理
- [ ] 音效: 发射音、消除音、连锁递增音阶、群碎音效
- [ ] UI: 无紫色，色彩限 Rose/Sky/Amber + 中性色

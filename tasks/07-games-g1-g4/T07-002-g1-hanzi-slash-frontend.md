# T07-002: G1 汉字切切切 — Phaser 游戏前端

> 分类: 07-游戏 G1-G4 (Games G1-G4)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 15+

## 需求摘要

实现 G1 汉字切切切的 Phaser 3 前端游戏场景。包括汉字卡片抛物线飞行、滑动/鼠标切割手势检测、卡片裂开 + 粒子爆炸特效、Combo 连击系统（3/5/10/20 连特效）、生命值系统、底部提示条、PK 分屏布局及 WebSocket 实时同步。场景封装为独立 Phaser Scene，通过 T06-010 游戏通用框架容器加载。强制横屏，设计基准 1920×1080，支持皮肤系统预留。

## 相关上下文

- 产品需求: `product/apps/06-games-g1-g4/01-g1-hanzi-slash.md` — G1 完整 PRD（**核心依据**）
  - §三 游戏画面布局（1920×1080 区域划分、HUD、提示条、PK 分屏）
  - §四 核心交互（切对/切错/漏切完整视觉反馈链、Combo 特效详情）
  - §五 难度递增（速度曲线、卡片数量、间隔）
  - §六 生命值系统（心形图标、碎裂动画、最后一命闪烁）
- 产品需求: `product/apps/06-games-g1-g4/00-index.md` §二.4 — 声调颜色规范
- 游戏设计: `game/01-hanzi-slash.md`
  - §四.1 画面风格（中国风卷轴背景、毛笔字风格卡片）
  - §四.3 音效设计（切对/切错/Combo/Game Over 音效列表）
  - §七.1 Phaser 3 场景结构（BootScene → MenuScene → GameScene → ResultScene）
  - §七.3 性能目标（60 FPS、< 3s 加载、< 100MB 内存）
- 通用框架: `product/apps/05-game-common/08-hud-landscape.md` — 通用 HUD + 横屏切换
- 前端规范: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统
- UI 规范: `grules/06-ui-design.md` — 色彩、毛玻璃、动效规范
- 编码规范: `grules/05-coding-standards.md` §二 — React 组件规范
- 关联任务: T07-001（G1 后端）→ 本任务 | T06-010（Phaser 容器框架）→ 本任务

## 技术方案

### Phaser 3 场景架构

```
G1HanziSlash/
├── BootScene.ts              # 资源预加载（图片、音效、字体）
├── GameScene.ts              # 核心游戏主场景
│   ├── HanziSpawner.ts       # 汉字卡片生成与飞行管理
│   ├── SlashDetector.ts      # 切割手势/鼠标检测 + 碰撞判定
│   ├── ScoreManager.ts       # 分数 + Combo 显示与动画
│   ├── LifeManager.ts        # 生命值图标 + 碎裂动画
│   ├── HintBar.ts            # 底部提示条（当前提示 + 预览）
│   └── EffectManager.ts      # 粒子特效 + 飘字 + Combo 特效
├── PKScene.ts                # PK 模式场景（分屏 + 对手信息）
├── GameOverOverlay.ts        # Game Over 慢动作 + 过渡动画
└── SkinManager.ts            # 皮肤系统（背景/卡片/刀光/音效可替换）
```

### 核心组件详细设计

#### 1. HanziSpawner — 汉字卡片生成器

```typescript
// frontend/src/features/games/g1/scenes/components/HanziSpawner.ts

interface HanziCard {
  sprite: Phaser.GameObjects.Container  // 卡片容器（背景 + 文字 + 色带）
  hanziId: string
  hanzi: string
  pinyin: string
  tone: number
  isTarget: boolean                     // 是否为当前目标
  velocity: { x: number; y: number }
  angularVelocity: number
}

class HanziSpawner {
  /**
   * 卡片视觉规格（PRD §四.1）：
   * - 120×120px 正方形，圆角 16px
   * - 毛玻璃白色半透明背景 rgba(255,255,255,0.15) + blur(8px)
   * - 汉字居中 32px 白色字重 700
   * - 顶部 4px 声调色带（蓝/绿/橙/红/灰）
   */
  createCard(question: QuestionItem): HanziCard

  /**
   * 抛物线飞行（PRD §四.1）：
   * - 从底部外 y > 1080 飞入
   * - x 随机 200-1720px
   * - vy: -600 ~ -900 px/s，重力 g: 400 px/s²
   * - vx: -100 ~ 100 px/s
   * - 旋转 30°-60°/s
   */
  spawnCard(card: HanziCard): void

  /**
   * 难度曲线调整（PRD §五.1）：
   * 根据 speedCurve 配置动态调整 velocity、concurrent、interval
   */
  updateDifficulty(elapsedSec: number): void

  /** 检测卡片飞出屏幕底部 → 漏切处理 */
  checkOutOfBounds(): HanziCard[]
}
```

#### 2. SlashDetector — 切割检测器

```typescript
// frontend/src/features/games/g1/scenes/components/SlashDetector.ts

class SlashDetector {
  private trailGraphics: Phaser.GameObjects.Graphics  // 切割轨迹
  private pointerPath: Phaser.Math.Vector2[]           // 滑动路径点

  /**
   * 切割轨迹视觉（PRD §三.3）：
   * - 白色半透明发光线，宽 3px
   * - 持续 300ms 淡出
   */
  drawTrail(points: Phaser.Math.Vector2[]): void

  /**
   * 碰撞判定（PRD §四.2）：
   * - 线段与卡片碰撞框（卡片尺寸 + 外扩 8px 容差）相交
   * - 使用 Phaser.Geom.Intersects.LineToRectangle
   */
  checkSlashCollision(
    trailSegment: Phaser.Geom.Line,
    cards: HanziCard[]
  ): HanziCard | null

  /**
   * 处理切割结果
   * - 切对：发送 slash 事件到服务端 → 等待确认 → 触发特效
   * - 切错：发送 slash 事件到服务端 → 等待确认 → 触发错误特效
   */
  onSlash(card: HanziCard): void
}
```

#### 3. EffectManager — 特效管理器

```typescript
// frontend/src/features/games/g1/scenes/components/EffectManager.ts

class EffectManager {
  /**
   * 切对特效（PRD §四.2 按时间顺序）：
   * 1. 卡片裂开（0ms）：沿切割方向裂成两半，飞散 400ms
   * 2. 得分飘字（50ms）："+10" Amber 色 H3 上移 60px 淡出 600ms
   * 3. 粒子爆炸（0ms）：12-16 个声调色粒子四周扩散 500ms
   * 4. Combo 更新（100ms）：数字弹跳放大 120% 回弹
   */
  playCorrectSlash(card: HanziCard, scoreDelta: number, combo: number): void

  /**
   * 切错特效（PRD §四.3 按时间顺序）：
   * 1. 屏幕边缘红闪（0ms）：Rose 红径向渐变闪光 300ms
   * 2. 卡片震动（0ms）：左右 ±6px 震动 3 次 200ms
   * 3. 生命值碎裂（100ms）：心形裂开碎片飞散 400ms
   * 4. Combo Break!（0ms）：Rose 红文字 500ms 淡出
   * 5. 错误标注（200ms）：卡片上方显示正确拼音+释义 1000ms
   */
  playWrongSlash(card: HanziCard, correctPinyin: string): void

  /**
   * 漏切特效（PRD §四.4）：
   * - 底部边缘白色涟漪波纹 200ms
   */
  playMiss(x: number): void

  /**
   * Combo 里程碑特效（PRD §四.5）：
   * 3 连：屏幕中央 "GOOD!" Sky 蓝色 H1 32px
   * 5 连："GREAT!!" Amber 金色 Display 48px + 金色光芒粒子
   * 10 连：全屏金色光芒 + "AMAZING!!!" Rose+Amber 渐变 + 彩色粒子喷泉
   * 20 连：全屏彩虹光环 + "LEGENDARY!!!!" 彩虹渐变 + 星空背景
   */
  playComboMilestone(combo: number): void

  /**
   * Game Over 动画（PRD §四.6）：
   * 1. 画面慢动作 0.3x 速度 1 秒
   * 2. 所有卡片下坠消失
   * 3. "Game Over" / "Time's Up!" Display 48px 1.5 秒
   * 4. 过渡到结算页
   */
  playGameOver(reason: 'lives' | 'timeout'): Promise<void>
}
```

#### 4. PK 模式分屏

```typescript
// frontend/src/features/games/g1/scenes/PKScene.ts

class G1PKScene extends Phaser.Scene {
  /**
   * PK 布局（PRD §三.5）：
   * ┌─────────────────────────────────────────────────────────────┐
   * │ [我方] 分数: 1,250 ♥♥♥    VS    ♥♥♡ 分数: 980 [对手]       │
   * │ 头像+昵称              Combo ×3              头像+昵称      │
   * ├─────────────────────────────────────────────────────────────┤
   * │                    [倒计时 00:42]                            │
   * │                                                             │
   * │                [共享游戏区域]                                 │
   * │              汉字卡片飞出区域                                 │
   * │                                                             │
   * ├─────────────────────────────────────────────────────────────┤
   * │ 当前提示：「切 māo 🐱」    下一提示预览                       │
   * └─────────────────────────────────────────────────────────────┘
   */

  /** 双方信息对称分布在 HUD 两侧 */
  private myInfo: PlayerHUD
  private opponentInfo: PlayerHUD

  /**
   * WebSocket 同步：
   * - 接收对手的切割结果广播 → 更新对手分数/Combo/生命
   * - 接收抢答结果 → 如果对手先抢到，目标卡片自动消失
   */
  handleSlashBroadcast(result: SlashResultBroadcast): void

  /**
   * 对手切对时：对手分数跳动 + 对手 Combo 更新
   * 对手切错时：对手生命减少动画
   */
  updateOpponentState(state: OpponentState): void
}
```

### 皮肤系统预留

```typescript
// frontend/src/features/games/g1/SkinManager.ts

interface G1SkinConfig {
  background: string          // 背景主题 key（经典/星空/竹林/宫殿...）
  cardStyle: string           // 卡片样式 key（毛笔/印章/霓虹/像素...）
  slashTrail: string          // 刀光特效 key（金色/火焰/冰霜/樱花...）
  slashSound: string          // 切割音效 key（默认/武侠/电子/古风...）
  comboEffect: string         // Combo 特效 key（默认/焰火/龙吟/星爆...）
}

class G1SkinManager {
  /** 从用户装备数据加载皮肤配置 */
  async loadSkin(userId: string): Promise<G1SkinConfig>

  /** 替换背景纹理 */
  applyBackground(scene: Phaser.Scene, key: string): void

  /** 替换卡片精灵图 */
  getCardTexture(key: string): string

  /** 替换切割轨迹粒子配置 */
  getSlashParticleConfig(key: string): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig

  /** 替换音效 */
  getSoundKey(event: string, skinKey: string): string
}
```

### 与通用框架集成

```typescript
// frontend/src/features/games/g1/G1GameConfig.ts

import Phaser from 'phaser'
import { G1BootScene } from './scenes/BootScene'
import { G1GameScene } from './scenes/GameScene'
import { G1PKScene } from './scenes/PKScene'

/**
 * G1 Phaser 游戏配置
 * 通过 T06-010 的 PhaserContainer 加载
 */
export function createG1Config(sessionData: SessionData): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 400 },  // 卡片重力
        debug: false,
      },
    },
    scene: [
      new G1BootScene(sessionData),
      sessionData.mode === 'pk_1v1' || sessionData.mode === 'multiplayer'
        ? new G1PKScene(sessionData)
        : new G1GameScene(sessionData),
    ],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: {
      disableWebAudio: false,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
  }
}
```

### React 页面入口

```typescript
// frontend/src/pages/games/g1-hanzi-slash/G1GamePage.tsx

import { useParams } from 'react-router-dom'
import { PhaserContainer } from '@/pages/games/components/PhaserContainer'
import { LandscapeGuard } from '@/pages/games/components/LandscapeGuard'
import { GameHUD } from '@/pages/games/components/GameHUD'
import { createG1Config } from '@/features/games/g1/G1GameConfig'

export function G1GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  // 从会话数据获取游戏配置
  const { data: sessionData } = useGameSession(sessionId!)

  if (!sessionData) return <GameLoading />

  return (
    <LandscapeGuard>
      <PhaserContainer
        gameConfig={createG1Config(sessionData)}
        sessionId={sessionId!}
        onGameReady={handleGameReady}
        onGameDestroy={handleGameDestroy}
      />
    </LandscapeGuard>
  )
}
```

## 范围（做什么）

- 实现 G1 BootScene（资源预加载：汉字字体、卡片纹理、粒子图、音效）
- 实现 G1 GameScene 核心游戏场景
  - HanziSpawner：卡片生成、抛物线飞行、难度曲线
  - SlashDetector：触摸/鼠标滑动检测、轨迹绘制、碰撞判定
  - ScoreManager：分数显示、Combo 计数器、倍率动画
  - LifeManager：3 条命显示、碎裂动画、最后一命闪烁
  - HintBar：底部提示条（当前提示 + 下一提示预览）
  - EffectManager：切对/切错/漏切/Combo 里程碑/Game Over 全部特效
- 实现 G1 PKScene（PK 分屏、对手信息显示、WebSocket 状态同步）
- 实现 SkinManager（皮肤配置加载、纹理/音效替换接口预留）
- 实现 React 页面入口（与 PhaserContainer 集成）
- 声调颜色系统（一声蓝/二声绿/三声橙/四声红/轻声灰）
- 游戏背景（渐变深色 #0e1628 → #1a1a2e）
- 所有音效触发点接入
- 支持 Web 桌面和移动端 H5 自适应

## 边界（不做什么）

- 不写后端出题/计分逻辑（T07-001 已完成）
- 不写匹配页面（T06-010 已完成）
- 不写结算页面（T06-011 已完成）
- 不写通用 HUD 暂停/退出按钮逻辑（T06-010 已完成）
- 不制作实际皮肤素材（仅预留接口，默认皮肤使用程序化生成）
- 不写 TTS 汉字读音功能（后续横切关注点任务）

## 涉及文件

- 新建: `frontend/src/features/games/g1/scenes/BootScene.ts`
- 新建: `frontend/src/features/games/g1/scenes/GameScene.ts`
- 新建: `frontend/src/features/games/g1/scenes/PKScene.ts`
- 新建: `frontend/src/features/games/g1/scenes/components/HanziSpawner.ts`
- 新建: `frontend/src/features/games/g1/scenes/components/SlashDetector.ts`
- 新建: `frontend/src/features/games/g1/scenes/components/ScoreManager.ts`
- 新建: `frontend/src/features/games/g1/scenes/components/LifeManager.ts`
- 新建: `frontend/src/features/games/g1/scenes/components/HintBar.ts`
- 新建: `frontend/src/features/games/g1/scenes/components/EffectManager.ts`
- 新建: `frontend/src/features/games/g1/scenes/GameOverOverlay.ts`
- 新建: `frontend/src/features/games/g1/SkinManager.ts`
- 新建: `frontend/src/features/games/g1/G1GameConfig.ts`
- 新建: `frontend/src/features/games/g1/types.ts`
- 新建: `frontend/src/pages/games/g1-hanzi-slash/G1GamePage.tsx`
- 修改: `frontend/src/router/index.tsx` — 注册 G1 游戏路由

## 依赖

- 前置: T07-001（G1 后端题库与游戏逻辑）
- 前置: T06-010（Phaser 容器框架 + LandscapeGuard + 通用 HUD）
- 前置: T06-005（WebSocket 匹配基础 — PK 模式通信）
- 后续: 无（G1 完成后可独立交付）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入 G1 单人经典模式  
   **WHEN** 游戏启动  
   **THEN** 汉字卡片从底部以抛物线轨迹飞出，同时出现 2 张，底部提示条显示当前目标拼音

2. **GIVEN** 游戏进行中，当前提示为 "māo"  
   **WHEN** 滑动切割"猫"字卡片  
   **THEN** 卡片裂开两半飞散 + 得分飘字 +10 + 声调色粒子爆炸 + 切割音效，全流程 < 200ms

3. **GIVEN** 游戏进行中  
   **WHEN** 滑动切割非目标汉字  
   **THEN** 屏幕边缘红闪 + 卡片震动 + 生命值心形碎裂 + Combo Break! + 显示正确答案

4. **GIVEN** 连续切对 3 次  
   **WHEN** 第 3 次切对完成  
   **THEN** 屏幕中央闪现 "GOOD!" Sky 蓝色文字 + 升调音效

5. **GIVEN** 连续切对 10 次  
   **WHEN** 第 10 次切对完成  
   **THEN** 全屏金色光芒 + "AMAZING!!!" Rose+Amber 渐变文字 + 彩色粒子喷泉 + 管弦乐片段

6. **GIVEN** 3 条命全部耗尽  
   **WHEN** 触发 Game Over  
   **THEN** 画面慢动作 1 秒 → 所有卡片下坠 → "Game Over" 文字 → 1.5 秒后跳转结算页

7. **GIVEN** PK 模式匹配成功  
   **WHEN** 游戏开始  
   **THEN** 双方信息对称分布在 HUD 两侧，倒计时居中，实时显示对手分数和生命值

8. **GIVEN** PK 模式，对手先切对当前目标  
   **WHEN** 收到 WebSocket 抢答结果  
   **THEN** 该卡片自动消失 + 对手分数跳动更新

9. **GIVEN** 移动端 H5 竖屏进入游戏  
   **WHEN** 检测到竖屏方向  
   **THEN** 显示"请旋转手机至横屏模式"提示，旋转后正常显示游戏

10. **GIVEN** 声调颜色系统  
    **WHEN** 卡片显示拼音为二声字  
    **THEN** 卡片顶部色带为绿色 `#22c55e`，切对时粒子也为绿色

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. `docker compose logs --tail=30 backend` — 后端无报错
5. 通过 Browser MCP（Puppeteer）导航到 G1 游戏页面
6. 验证横屏切换提示（移动端模拟）
7. 验证游戏场景加载和卡片飞出动画
8. 模拟切割操作验证特效反馈
9. 验证 PK 模式分屏布局
10. 截图记录 375px（竖屏提示）/ 1280px（桌面横屏正常）
11. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Phaser 3 游戏场景正常渲染（60 FPS）
- [ ] 卡片抛物线飞行物理正确
- [ ] 切割手势检测灵敏（触摸 + 鼠标）
- [ ] 切对/切错/漏切特效完整
- [ ] Combo 里程碑特效 4 级全部正确
- [ ] 生命值碎裂动画正确
- [ ] Game Over 流程完整
- [ ] PK 模式 WebSocket 同步正常
- [ ] 横屏强制切换正确
- [ ] 声调颜色规范正确
- [ ] 控制台无 Error 级别日志
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/07-games-g1-g4/` 下创建同名结果文件

结果文件路径: `/tasks/result/07-games-g1-g4/T07-002-g1-hanzi-slash-frontend.md`

## 自检重点

- [ ] 性能: 稳定 60 FPS，无卡顿（移动端 H5 也需流畅）
- [ ] 性能: 首次加载 < 3 秒，资源包 < 2MB
- [ ] 性能: 粒子特效不超过 200 个同时存在
- [ ] 交互: 切割判定容差 8px，触感灵敏不漏判
- [ ] 交互: 触摸和鼠标两种输入模式均支持
- [ ] 视觉: 声调颜色严格匹配规范（蓝/绿/橙/红/灰）
- [ ] 视觉: 毛玻璃卡片效果正确渲染
- [ ] 音效: 所有交互节点音效触发正确
- [ ] 皮肤: SkinManager 接口预留完整，默认皮肤正常工作
- [ ] UI 设计规范: 无紫色出现，色彩仅限 Rose/Sky/Amber + 中性色

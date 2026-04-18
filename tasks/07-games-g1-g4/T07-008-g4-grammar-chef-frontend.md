# T07-008: G4 语法大厨 — Phaser 游戏前端

> 分类: 07-游戏 G1-G4 (Games G1-G4)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 15+

## 需求摘要

实现 G4 语法大厨的 Phaser 3 前端游戏场景。包括中国风厨房场景（传送带 + 操作台 + 锅区三列布局）、顾客队列（卡通人物 + 耐心计时条 + 订单对话气泡）、传送带词语食材滚动（按词性着色）、操作台拖拽排序（槽位 + 连接线反馈）、锅区烹饪动画（正确上菜/错误黑烟/超时愤怒）、关联词特殊食材视觉（Rose 红底 + 金色边框 + ⭐）、Combo 特效（好厨艺!/大厨上线!!/厨神降临!!!）、PK 分屏（己方 60% + 对手 40%）、协作模式（角色分区 + 实时同步）。场景封装为独立 Phaser Scene，通过 T06-010 容器加载。

## 相关上下文

- 产品需求: `product/apps/06-games-g1-g4/04-g4-grammar-chef.md` — G4 完整 PRD（**核心依据**）
  - §三 游戏画面布局（HUD 80px + 顾客区 180px + 厨房操作区 500px + 按钮区 80px）
  - §三.3 顾客等待区（卡通头像、耐心计时条颜色梯度、VIP 金色边框）
  - §三.4 厨房操作区（传送带 360px + 操作台 760px + 锅区 280px）
  - §三.4.1 传送带（词性颜色方块、竖向滚入）
  - §三.4.2 操作台（虚线槽位、拖动排序、语序辅助连线）
  - §三.4.3 锅区（中国风大铁锅、火焰动画、蒸汽效果）
  - §四 核心交互四步骤（接单 → 选词 → 排序 → 提交）
  - §四.4 提交动画（正确烹饪/错误黑烟/超时愤怒三套完整动画）
  - §四.5 关联词特殊食材视觉
  - §六 失败计数 3 个 ✗ 图标
  - §八.1 Combo 特效
  - §三.6 PK 模式布局 | §三.7 协作模式特殊布局
- 游戏设计: `game/04-grammar-chef.md`
  - §四 视觉与交互设计（厨房场景、传送带横向滚动）
  - §五 上瘾机制（餐厅装修、连续 Combo）
- 通用框架: `product/apps/05-game-common/08-hud-landscape.md` — 通用 HUD
- 设计规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 关联任务: T07-007（G4 后端）→ 本任务 | T06-010（Phaser 容器）→ 本任务

## 技术方案

### Phaser 3 场景架构

```
G4GrammarChef/
├── BootScene.ts              # 资源预加载（厨房纹理、角色精灵、食材方块、音效）
├── GameScene.ts              # 核心游戏主场景（单人经营/限时）
│   ├── CustomerQueue.ts      # 顾客队列管理（头像 + 耐心条 + 订单气泡）
│   ├── ConveyorBelt.ts       # 传送带（词语食材滚入 + 词性着色）
│   ├── PrepTable.ts          # 操作台（虚线槽位 + 拖动排序 + 连线反馈）
│   ├── CookingPot.ts         # 锅区（火焰 + 蒸汽 + 烹饪动画）
│   ├── FoodDelivery.ts       # 上菜动画（菜品飞向顾客 + 满意/不满反馈）
│   ├── ComboDisplay.ts       # Combo 特效
│   ├── FailureCounter.ts     # 3 个 ✗ 失败计数图标
│   └── ScoreHUD.ts           # 分数 + 订单完成数 + 倒计时
├── PKScene.ts                # PK 模式（左右分屏 60/40）
├── CoopScene.ts              # 协作模式（角色分区 + 实时同步）
├── GameOverOverlay.ts        # Game Over 厨房灯光熄灭动画
└── SkinManager.ts            # 皮肤系统预留
```

### 核心组件详细设计

#### 1. CustomerQueue — 顾客队列

```typescript
// frontend/src/features/games/g4/scenes/components/CustomerQueue.ts

class CustomerQueue {
  /**
   * 顾客等待区（PRD §三.3，高 180px）：
   * - 最多 3 位排队，从左到右
   * - 当前服务顾客最大最清晰，后面依次缩小 90%、80%
   * - 中国风卡通人物头像 80×80px
   * - 名字 Body S 14px（如"小明"、"李阿姨"）
   * - VIP: 金色边框 + ⭐ 标记
   */
  renderQueue(customers: CustomerData[]): void

  /**
   * 顾客入场动画（PRD §四.1）：
   * - 从屏幕右侧走入（步行动画 300ms）
   * - 到达后对话气泡弹出订单（2 秒后收起，转固定显示）
   * - 关联词在订单文字中高亮 Amber 色
   * - 音效：门铃 "叮铃"
   */
  customerEnter(customer: CustomerData): Promise<void>

  /**
   * 耐心计时条（PRD §三.3）：
   * - 宽 120px，高 6px，位于头像下方
   * - 颜色梯度：100%-60% 绿 → 60%-30% 黄 → 30%-10% 橙 → <10% 红色闪烁
   * - 右侧 Caption 12px 秒数
   */
  updatePatienceBar(customerId: string, remainingSec: number, totalSec: number): void

  /**
   * 顾客满意离开（PRD §四.4.1）：
   * - 表情变笑脸 😊 + ❤️ + 竖大拇指
   * - 向左侧走出
   */
  customerHappyLeave(customerId: string): Promise<void>

  /**
   * 顾客愤怒离开（PRD §四.4.3）：
   * - 表情变愤怒 😡 + 💢💢
   * - 快速走向右侧离开
   * - "-20" Rose 红色飘字
   * - 音效：不耐烦 "哼" + 脚步声
   */
  customerAngryLeave(customerId: string): Promise<void>
}
```

#### 2. ConveyorBelt — 传送带

```typescript
// frontend/src/features/games/g4/scenes/components/ConveyorBelt.ts

class ConveyorBelt {
  /**
   * 传送带（PRD §三.4.1，宽 360px）：
   * - 竖向传送带，食材从上方持续滚入
   * - 金属质感深灰色背景 #2a2a2a + 两侧齿轮装饰
   * - 可上下滚动浏览
   */
  render(): void

  /**
   * 词语食材方块（PRD §三.4.1）：
   * - 尺寸自适应：最小 80×56px，最大 160×56px
   * - 圆角 12px
   * - 词性颜色：
   *   - 名词: Sky 蓝淡底 rgba(2,132,199,0.2)
   *   - 动词: 绿色淡底 rgba(34,197,94,0.2)
   *   - 形容词/副词: Amber 淡底 rgba(217,119,6,0.2)
   *   - 关联词: Rose 红淡底 rgba(225,29,72,0.2) + 金色 2px 边框 + ⭐ 右上角
   *   - 标点: 灰色淡底
   * - 中心词语 Body S 14px 白色字重 600
   * - 上方小标签词性 Caption 11px 半透明白色
   * - 关联词方块有微弱金色发光脉冲
   */
  createFoodBlock(word: WordData): FoodBlock

  /**
   * 点击选取（PRD §四.2）：
   * - 点击 → 词语飞入操作台第一个空槽位（200ms 弧线 + 旋转 + 缩放弹跳）
   */
  handleTap(block: FoodBlock): void

  /**
   * 拖动选取（PRD §四.2）：
   * - 长按 150ms 触发拖动 → 跟随手指
   * - 拖到操作台松手 → 落入最近空槽位（弹跳落地）
   * - 拖到外部松手 → 回弹原位
   */
  handleDrag(block: FoodBlock): void
}
```

#### 3. PrepTable — 操作台

```typescript
// frontend/src/features/games/g4/scenes/components/PrepTable.ts

class PrepTable {
  /**
   * 操作台（PRD §三.4.2，宽 760px）：
   * - 木质纹理台面（中国风砧板质感），浅棕色 #8B7355
   * - 周围暖光效果
   * - 水平排列词语槽位，最多 12 个
   * - 空槽位: 虚线框 56×56px 最小，白色透明度 30%
   * - 已放置词语: 高度 64px（比传送带略大）
   */
  render(slotCount: number): void

  /**
   * 拖动排序（PRD §四.3）：
   * - 长按 150ms → 浮起（上移 8px + 阴影加深）
   * - 左右拖动 → 其他词语自动挤让（200ms 平滑位移）
   * - 松手 → 落入当前位置（弹跳 100ms）
   */
  handleReorder(block: FoodBlock, targetSlotIndex: number): void

  /**
   * 双击退回（PRD §四.3）：
   * - 双击操作台上的词语 → 飞回传送带（弧线 200ms）
   */
  handleDoubleTap(block: FoodBlock): void

  /**
   * 语序辅助连接线（PRD §三.4.2）：
   * - ≥ 2 个词时显示词语间连接线
   * - 部分正确序列: 绿色实线
   * - 可能有误: 灰色虚线
   * - 仅供参考，不保证 100% 准确
   */
  updateConnectionLines(words: FoodBlock[]): void
}
```

#### 4. CookingPot — 锅区

```typescript
// frontend/src/features/games/g4/scenes/components/CookingPot.ts

class CookingPot {
  /**
   * 锅区视觉（PRD §三.4.3，宽 280px）：
   * - 中国风大铁锅直径 200px
   * - 锅底火焰动画（持续循环）
   * - 蒸汽/热气上升动画（白色半透明）
   * - 文字提示 "将排好的词语放入锅中" Caption 12px
   */
  render(): void

  /**
   * 烹饪正确动画（PRD §四.4.1）：
   * 1. 词语依次飞入锅中（每个 80ms）+ 火焰变大
   * 2. 大量白色蒸汽 + 金色光芒（500ms）
   * 3. 弹出精美中国菜卡通图标（随机：饺子/面条/炒菜/汤品）
   * 4. 菜品飞向顾客（弧线 200ms）
   * 5. 音效：锅中 "嗞啦" → 叮铃完成音 → 顾客 "谢谢"
   */
  playCookSuccess(words: FoodBlock[], customerPos: { x: number; y: number }): Promise<void>

  /**
   * 烹饪失败动画（PRD §四.4.2）：
   * 1. 词语飞入锅中后冒黑色烟雾（800ms）
   * 2. 锅左右震动 3 次（±8px，200ms）
   * 3. 音效：沉闷 "噗嗤" + 碰撞音
   * 4. 操作台上方显示正确语序（绿色 Body 16px，2 秒学习）
   */
  playCookFail(words: FoodBlock[], correctSequence: string[]): Promise<void>
}
```

#### 5. FailureCounter — 失败计数

```typescript
// frontend/src/features/games/g4/scenes/components/FailureCounter.ts

class FailureCounter {
  /**
   * 3 个 ✗ 图标（PRD §六）：
   * - 顶部 HUD 区域，24×24px，间距 4px
   * - 初始灰色
   * - 触发时：灰 → 红色 + 放大 150% 后回弹 + 短暂震动
   * - 已有 2 失败时：第三个 ✗ 缓慢闪烁（红色，每秒 1 次）
   * - 屏幕边缘持续微弱红色光晕
   */
  render(): void
  triggerFailure(index: number): Promise<void>
  showLastChanceWarning(): void
}
```

#### 6. Combo 特效

```typescript
// frontend/src/features/games/g4/scenes/components/ComboDisplay.ts

class ComboDisplay {
  /**
   * Combo 特效（PRD §八.1）：
   * - 3 连: "好厨艺!" Sky 蓝色 H2 24px + 锅中火焰变大
   * - 5 连: "大厨上线!!" Amber 金色 Display 48px + 厨房亮度提升 + 金色光带
   * - 10 连: "厨神降临!!!" Rose+Amber 渐变 Display 48px + 全屏金色粒子 + 厨房变华丽金色主题
   * - 10 连音效: 华丽管弦乐片段 1.5 秒
   */
  showComboEffect(comboCount: number): Promise<void>
}
```

#### 7. PKScene — PK 模式分屏

```typescript
// frontend/src/features/games/g4/scenes/PKScene.ts

class G4PKScene extends Phaser.Scene {
  /**
   * PK 分屏布局（PRD §三.6）：
   * ┌─────────────────────────────┬──────────────────────┐
   * │   己方厨房 60%              │   对手区 40%          │
   * │   完整厨房操作区             │   缩略版厨房          │
   * │   传送带+操作台+锅           │   对手订单完成数       │
   * │   底部操作按钮              │   对手头像+昵称+分数   │
   * └─────────────────────────────┴──────────────────────┘
   */

  /**
   * 对手状态反馈（PRD §七.2）：
   * - 对手完成一单: 对手区绿色 "完成 +1" 闪烁
   * - 对手 Combo ≥ 3: 己方顶部 "对手连击 ×3！" 提示条 800ms
   * - 对手失败: 对手区短暂红色闪光
   * - 对手超越己方: 己方订单计数变 Rose 红闪烁 + "加油！"
   */
  handleOpponentSync(state: PlayerState): void
}
```

#### 8. CoopScene — 协作模式

```typescript
// frontend/src/features/games/g4/scenes/CoopScene.ts

class G4CoopScene extends Phaser.Scene {
  /**
   * 协作模式布局（PRD §三.7）：
   * - 共享厨房，共同顾客队列
   * - 玩家 A（选词手）：只能操作传送带，抓取食材放操作台
   * - 玩家 B（排序手）：只能操作操作台排序 + 提交到锅
   * - 各自操作区域有专属角色标签和高亮边框
   * - 非己操作区域半透明不可交互
   */
  render(role: 'selector' | 'sorter'): void

  /**
   * 实时操作同步：
   * - A 放入词语 → B 端操作台实时显示新词语
   * - B 排列操作 → A 端可看到排列变化
   * - 快捷消息面板（"选这个！""顺序不对！"）
   */
  handleCoopAction(event: CoopActionEvent): void
}
```

### Game Over

```typescript
// frontend/src/features/games/g4/scenes/GameOverOverlay.ts

class GameOverOverlay {
  /**
   * Game Over 动画（PRD §九.1）：
   * 1. 厨房灯光逐渐熄灭（整体亮度从 100% → 20%，1 秒）
   * 2. 锅中火焰缩小熄灭
   * 3. "Game Over" Display 48px 白色
   * 4. 1.5 秒后过渡结算页
   */
  playGameOver(): Promise<void>
}
```

### 与通用框架集成

```typescript
// frontend/src/features/games/g4/G4GameConfig.ts

export function createG4Config(sessionData: SessionData): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [
      new G4BootScene(sessionData),
      sessionData.mode === 'pk_1v1'
        ? new G4PKScene(sessionData)
        : sessionData.mode === 'coop'
          ? new G4CoopScene(sessionData)
          : new G4GameScene(sessionData),
    ],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  }
}
```

## 范围（做什么）

- 实现 G4 BootScene（厨房纹理、角色精灵、食材方块、菜品图标、音效预加载）
- 实现 CustomerQueue（卡通人物、耐心计时条颜色梯度、VIP 金色边框、入场/满意离开/愤怒离开动画）
- 实现 ConveyorBelt（竖向滚动、词性着色方块、点击飞入/拖动选取）
- 实现 PrepTable（虚线槽位、拖动排序、语序辅助连线、双击退回）
- 实现 CookingPot（中国风铁锅、火焰/蒸汽动画、烹饪正确/失败完整动画序列）
- 实现 FoodDelivery（菜品飞向顾客弧线动画、随机中国菜图标）
- 实现 ComboDisplay（好厨艺!/大厨上线!!/厨神降临!!! 三级特效）
- 实现 FailureCounter（3 个 ✗ 图标、触发动画、最后机会警告）
- 实现 PKScene（60/40 分屏、对手进度缩略、状态反馈）
- 实现 CoopScene（选词手/排序手角色分区、实时操作同步、快捷消息）
- 实现 GameOverOverlay（厨房灯光熄灭动画）
- 实现关联词特殊食材视觉（Rose 红底 + 金色边框 + ⭐ + 发光脉冲）
- 实现 SkinManager 皮肤接口预留
- 实现 React 页面入口（G4GamePage）

## 边界（不做什么）

- 不写后端订单生成/语序验证/计分逻辑（T07-007）
- 不写匹配页面/结算页面（T06-010/T06-011）
- 不写通用 HUD 暂停/退出（T06-010）
- 不制作实际皮肤素材
- 不写餐厅装修系统视觉升级（后续任务）

## 涉及文件

- 新建: `frontend/src/features/games/g4/scenes/BootScene.ts`
- 新建: `frontend/src/features/games/g4/scenes/GameScene.ts`
- 新建: `frontend/src/features/games/g4/scenes/PKScene.ts`
- 新建: `frontend/src/features/games/g4/scenes/CoopScene.ts`
- 新建: `frontend/src/features/games/g4/scenes/components/CustomerQueue.ts`
- 新建: `frontend/src/features/games/g4/scenes/components/ConveyorBelt.ts`
- 新建: `frontend/src/features/games/g4/scenes/components/PrepTable.ts`
- 新建: `frontend/src/features/games/g4/scenes/components/CookingPot.ts`
- 新建: `frontend/src/features/games/g4/scenes/components/FoodDelivery.ts`
- 新建: `frontend/src/features/games/g4/scenes/components/ComboDisplay.ts`
- 新建: `frontend/src/features/games/g4/scenes/components/FailureCounter.ts`
- 新建: `frontend/src/features/games/g4/scenes/components/ScoreHUD.ts`
- 新建: `frontend/src/features/games/g4/scenes/GameOverOverlay.ts`
- 新建: `frontend/src/features/games/g4/SkinManager.ts`
- 新建: `frontend/src/features/games/g4/G4GameConfig.ts`
- 新建: `frontend/src/features/games/g4/types.ts`
- 新建: `frontend/src/pages/games/g4-grammar-chef/G4GamePage.tsx`
- 修改: `frontend/src/router/index.tsx` — 注册 G4 路由

## 依赖

- 前置: T07-007（G4 后端题库与游戏逻辑）
- 前置: T06-010（Phaser 容器框架 + LandscapeGuard）
- 前置: T06-005（WebSocket — PK/协作模式通信）
- 后续: 无

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入 G4 经营模式  
   **WHEN** 第一位顾客到达  
   **THEN** 顾客从右侧走入 + 对话气泡弹出订单 + 耐心计时条开始倒计 + 传送带滚入词语食材

2. **GIVEN** 传送带上有关联词 "虽然"  
   **WHEN** 渲染食材方块  
   **THEN** Rose 红淡底 + 金色 2px 边框 + ⭐ 右上角 + 微弱金色发光脉冲

3. **GIVEN** 点击传送带词语  
   **WHEN** 选取食材  
   **THEN** 词语以 200ms 弧线飞入操作台第一个空槽位 + 旋转 + 弹跳落地

4. **GIVEN** 操作台已有 3 个词语  
   **WHEN** 长按并拖动第 2 个词到第 3 个位置  
   **THEN** 其他词语自动挤让 200ms + 松手弹跳落入 + 连接线更新

5. **GIVEN** 操作台词语正确排序后提交  
   **WHEN** 烹饪正确  
   **THEN** 词语依次飞入锅中 → 蒸汽+金光 → 菜品弹出 → 飞向顾客 → 顾客笑脸+❤️ → 得分飘字

6. **GIVEN** 提交语序错误  
   **WHEN** 烹饪失败  
   **THEN** 锅冒黑烟 + 左右震动 → 顾客不满 😤 → 操作台上方显示正确语序（绿色 2 秒）

7. **GIVEN** 顾客耐心条 < 10%  
   **WHEN** 耐心即将耗尽  
   **THEN** 计时条红色闪烁 + 顾客表情焦急

8. **GIVEN** 第 3 位顾客因超时离开  
   **WHEN** Game Over 触发  
   **THEN** 厨房灯光逐渐熄灭 + 锅火焰缩小 → "Game Over" → 结算页

9. **GIVEN** PK 模式对手完成一单  
   **WHEN** 接收进度同步  
   **THEN** 对手区绿色 "完成 +1" 闪烁

10. **GIVEN** 协作模式我是排序手  
    **WHEN** 选词手放入新词到操作台  
    **THEN** 操作台实时显示新放入的词语 + 我可以拖动排序

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 导航到 G4 游戏页面
4. 验证厨房场景三列布局渲染
5. 验证顾客入场 + 耐心计时条
6. 验证传送带食材 + 词性着色
7. 验证操作台拖动排序 + 连线反馈
8. 验证烹饪正确/失败/超时三套动画
9. 验证 PK 分屏 + 协作模式角色分区
10. 截图记录关键验证点

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] Phaser 3 场景稳定 60 FPS
- [ ] 厨房三列布局正确（传送带 360 + 操作台 760 + 锅 280）
- [ ] 顾客入场/满意离开/愤怒离开动画完整
- [ ] 耐心计时条颜色梯度正确（绿→黄→橙→红）
- [ ] 词性颜色系统正确（蓝名/绿动/橙形副/红关联+金边/灰标点）
- [ ] 操作台拖动排序流畅
- [ ] 烹饪正确/失败/超时三套动画全部验证
- [ ] 关联词特殊视觉（Rose 红底+金色边框+⭐）
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 3 次失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/07-games-g1-g4/T07-008-g4-grammar-chef-frontend.md`

## 自检重点

- [ ] 性能: 60 FPS，传送带滚动 + 顾客动画同屏流畅
- [ ] 交互: 传送带点击/拖动灵敏，操作台排序跟手
- [ ] 交互: 双击退回响应及时
- [ ] 视觉: 词性颜色体系一致
- [ ] 视觉: 关联词特殊食材辨识度高
- [ ] 动画: 烹饪正确全序列流畅（词语飞入 → 蒸汽 → 菜品 → 上菜 → 顾客反馈）
- [ ] 动画: 烹饪失败黑烟 + 震动 + 正确答案展示
- [ ] 音效: 门铃、选取嗒、放置咚、烹饪嗞啦、完成叮铃、失败噗嗤
- [ ] 协作: 选词手/排序手操作区域严格隔离
- [ ] UI: 无紫色，色彩限 Rose/Sky/Amber + 中性色

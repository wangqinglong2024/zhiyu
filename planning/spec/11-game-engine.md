# 11 · 游戏引擎共享层（Game Engine）

## 一、目标

- 12 款游戏共享：渲染 / 输入 / 音频 / 资源 / 排行榜
- 单游戏开发 < 2 周
- 60fps 中端机
- 浏览器 + 移动横屏统一接口

## 二、技术栈

- **PixiJS v8**：2D WebGL 渲染
- **Matter.js**：2D 物理（仅需要的游戏）
- **Howler.js**：音频
- **GSAP** / **PixiJS tween**：动效

## 三、Monorepo 结构

```
packages/game-engine/         # 共享引擎
├── src/
│   ├── core/
│   │   ├── App.ts            # PixiJS 封装
│   │   ├── Scene.ts          # 场景基类
│   │   ├── SceneManager.ts
│   │   ├── AssetLoader.ts
│   │   ├── InputManager.ts   # 键鼠 + 触屏统一
│   │   ├── AudioManager.ts   # Howler
│   │   ├── PhysicsWorld.ts   # Matter.js
│   │   └── Ticker.ts
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── PauseMenu.ts
│   │   ├── GameOverScene.ts
│   │   └── VictoryScene.ts
│   ├── words/
│   │   ├── WordPackLoader.ts
│   │   ├── PinyinRenderer.ts
│   │   └── ChineseTextStyle.ts
│   ├── analytics/
│   │   └── GameAnalytics.ts
│   └── index.ts
└── package.json

packages/games/               # 12 游戏
├── src/
│   ├── pinyin-shooter/
│   ├── hanzi-ninja/
│   └── ...
```

## 四、Game 插件接口

### 4.1 标准接口
```ts
export interface GameModule {
  meta: {
    slug: string;
    name: string;
    version: string;
    minPackSize: number;
    inputRequirements: InputCapability[];
  };
  init(ctx: GameContext): Promise<void>;
  start(config: GameConfig): Promise<GameSession>;
  destroy(): void;
}

export interface GameContext {
  app: Application;       // PixiJS Application
  audio: AudioManager;
  input: InputManager;
  pack: WordPack;
  user: GameUser;
  hooks: GameHooks;       // onScore / onMistake / onComplete
}

export interface GameSession {
  pause(): void;
  resume(): void;
  end(): GameResult;
}
```

### 4.2 12 游戏注册
```ts
import { registerGame } from '@zhiyu/game-engine';
import { PinyinShooter } from './pinyin-shooter';
import { HanziNinja } from './hanzi-ninja';
// ...
registerGame(PinyinShooter);
registerGame(HanziNinja);
// ...
```

## 五、Application 启动

### 5.1 创建
```ts
const app = new Application();
await app.init({
  width: 1280,
  height: 720,
  backgroundAlpha: 0,
  resolution: window.devicePixelRatio,
  autoDensity: true,
  antialias: true,
  preference: 'webgl',
});
container.appendChild(app.canvas);
```

### 5.2 自适应
- 监听 resize
- 等比缩放保持 16:9
- letterbox 上下或左右

### 5.3 强制横屏
详见 `planning/ux/10-game-ux.md` § 1

## 六、SceneManager

### 6.1 场景栈
- push / pop / replace
- 转场动画（fade / slide）
- 暂停时维持

### 6.2 标准场景
- LoadingScene
- MenuScene（如需）
- PlayScene
- PauseScene
- GameOverScene
- VictoryScene

## 七、AssetLoader

### 7.1 资源类型
- 图片 (PNG / WebP)
- 雪碧图 (Atlas)
- 音频 (mp3)
- 字体 (BitmapFont)
- JSON 数据

### 7.2 加载策略
- 首屏必需
- 关卡间懒加载
- 进度回调
- 失败重试

### 7.3 缓存
- AssetLoader.cache
- ServiceWorker 缓存

## 八、InputManager

### 8.1 抽象接口
```ts
input.on('action', (e) => { ... });    // 主操作
input.on('move', (dir) => { ... });    // 方向
input.on('typed', (char) => { ... });  // 字母
input.on('tap', (pos) => { ... });
input.on('drag', (delta) => { ... });
```

### 8.2 设备适配
- 桌面：键盘 + 鼠标
- 移动：触屏 + 虚拟控件
- 自动检测 + 切换

### 8.3 虚拟控件
- VirtualJoystick
- VirtualButton
- VirtualKeyboard（拼音）

## 九、AudioManager (Howler)

### 9.1 通用
- 音乐 BGM（loop）
- 音效 SFX（一次播放）
- 单字音频

### 9.2 接口
```ts
audio.playBGM(slug);
audio.playSFX(slug);
audio.playWord(zh);
audio.setVolume(category, 0-1);
audio.muteAll();
```

### 9.3 资源
- packages/game-engine/assets/sfx/*.mp3
- 单字音频按需 load 自 R2

## 十、PhysicsWorld (Matter.js)

### 10.1 用途
- 汉字俄罗斯方块（碰撞 / 重力）
- 弹弓物理
- 部分关卡

### 10.2 接口
```ts
const world = new PhysicsWorld({ gravity: { x: 0, y: 1 } });
world.addBody(body);
world.addConstraint(constraint);
world.step(delta);
```

### 10.3 渲染
- Matter 与 Pixi 同步（手动 sync 位置）
- 不用 Matter.Render

## 十一、UI 共享

### 11.1 HUD
- 顶部分数 / 时间 / HSK
- 底部命数 / 道具 / 控制
- 暂停按钮

### 11.2 PauseMenu
详见 `planning/ux/10-game-ux.md` § 3.3

### 11.3 GameOverScene / VictoryScene
- 结果统计
- 知语币奖励
- 操作按钮

## 十二、PinyinRenderer

### 12.1 渲染汉字 + 拼音
```ts
const text = new PinyinText({
  zh: '学习',
  pinyin: 'xué xí',
  toneMode: 'color',
  size: 48,
});
container.addChild(text);
```

### 12.2 字体
- BitmapFont 预生成（性能）
- 子集化（仅游戏词包字）

## 十三、WordPack

### 13.1 加载
```ts
const pack = await WordPackLoader.load(packId);
// pack.words[]
// pack.metadata
```

### 13.2 抽词策略
- 随机
- 按错题加权
- 按 HSK 难度

## 十四、Analytics

### 14.1 事件
- game.started
- game.score_changed
- game.mistake
- game.word_learned
- game.completed
- game.failed

### 14.2 上报
- 游戏内 hook → GameAnalytics
- 上报 PostHog + 后端 game_runs

## 十五、12 游戏简要规格

| Slug | 类型 | 物理 | 输入 | 词包大小 |
|---|---|---|---|---|
| `hanzi-ninja` | 切割 | ❌ | 拖拽 | 30+ |
| `pinyin-shooter` | 射击 | ❌ | 键盘 / 触屏 | 30+ |
| `tone-bubbles` | 选择 | ❌ | 数字键 / 触 | 30+ |
| `hanzi-tetris` | 物理 | ✅ | 键盘 / 摇杆 | 30+ |
| `whack-hanzi` | 反应 | ❌ | 数字键 / 触 | 30+ |
| `hanzi-match3` | 三消 | ❌ | 拖拽 | 60+ |
| `hanzi-snake` | 移动 | ❌ | 方向 / 滑 | 30+ |
| `hanzi-rhythm` | 节奏 | ❌ | 拼音键 / 触 | 30+ |
| `hanzi-runner` | 跑酷 | 部分 | Space / 触 | 30+ |
| `pinyin-defense` | 塔防 | ❌ | 鼠标 / 触 | 30+ |
| `memory-match` | 翻牌 | ❌ | 点击 | 16-32 |
| `hanzi-slingshot` | 物理 | ✅ | 拖拽 | 30+ |

每游戏详细规格已在 `planning/prds/04-games/` 定义。

## 十六、性能优化

### 16.1 渲染
- TextureAtlas 减少 draw call
- 合批
- 隐藏对象 visible=false 不 update

### 16.2 GC
- 对象池（子弹 / 粒子）
- 避免每帧 new

### 16.3 资源
- 纹理压缩 BasisU（v1.5）
- 音频按需

## 十七、测试

### 17.1 引擎单测
- Vitest
- 核心模块（InputManager / AudioManager）

### 17.2 游戏 E2E
- 关卡可完成（自动玩）
- 性能（fps）

### 17.3 跨设备
- iPhone 11 / 14
- 红米 Note 11 / Pixel 6
- iPad
- 桌面 Chrome / Safari / Firefox

## 十八、检查清单

- [ ] 引擎接口稳定
- [ ] 12 游戏插件注册
- [ ] PixiJS v8 + Matter + Howler 集成
- [ ] 输入设备自动适配
- [ ] 强制横屏机制
- [ ] BitmapFont 预生成
- [ ] 词包动态加载
- [ ] 60fps 全平台
- [ ] Analytics 全埋点
- [ ] 内存 < 200MB

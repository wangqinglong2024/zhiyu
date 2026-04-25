# Epic E09 · 游戏引擎共享层（Game Engine）

> 阶段：M3 · 优先级：P0 · 估算：4 周

## 摘要
PixiJS v8 + Matter + Howler 的共享引擎包，为 12 款游戏提供统一接口。

## 范围
- packages/game-engine 完整实现
- 强制横屏 / 输入抽象 / 资源加载 / 共享 UI
- 词包加载与抽词
- 排行榜 / 分析埋点
- 引擎 demo 游戏

## 非范围
- 12 款具体游戏（在 E10）

## Stories

### ZY-09-01 · packages/game-engine 骨架
**AC**
- [ ] 包结构按 spec/11 § 3
- [ ] 入口导出
- [ ] tsconfig + build
**估**: M

### ZY-09-02 · PixiJS Application 封装
**AC**
- [ ] 初始化 + canvas 挂载
- [ ] resize 自适应（letterbox）
- [ ] DPR + antialias
- [ ] destroy 清理
**估**: M

### ZY-09-03 · SceneManager
**AC**
- [ ] push / pop / replace
- [ ] 转场动画
- [ ] 全标准场景（Loading/Pause/GameOver/Victory）
**估**: M

### ZY-09-04 · AssetLoader
**AC**
- [ ] 图 / 音 / Atlas / BitmapFont
- [ ] 进度回调
- [ ] 失败重试
- [ ] cache
**估**: M

### ZY-09-05 · InputManager（键鼠 + 触屏）
**AC**
- [ ] action / move / typed / tap / drag
- [ ] 设备自动检测
- [ ] 虚拟摇杆 / 键盘组件
**估**: L

### ZY-09-06 · AudioManager（Howler）
**AC**
- [ ] BGM / SFX / Word audio
- [ ] 分类音量
- [ ] 静音
**估**: M

### ZY-09-07 · PhysicsWorld（Matter）
**AC**
- [ ] 创建 world + step
- [ ] Pixi 同步位置
- [ ] 调试渲染（dev）
**估**: M

### ZY-09-08 · WordPackLoader + PinyinRenderer
**AC**
- [ ] 远程加载词包
- [ ] BitmapFont 子集生成
- [ ] 拼音 / 声调色彩
**估**: L

### ZY-09-09 · 强制横屏 + 全屏 API
**AC**
- [ ] 检测竖屏 → 提示
- [ ] iOS 提示手动旋转
- [ ] 全屏 API + 退出
**Tech**：ux/13-game-ux-landscape.md
**估**: M

### ZY-09-10 · GameAnalytics + 排行榜接入
**AC**
- [ ] 埋点 hook
- [ ] 上报后端 game_runs
- [ ] PostHog event
- [ ] 周 / 月 / 全期排行 API
**估**: M

## 风险
- 不同浏览器 PixiJS WebGL 兼容性 → 测试矩阵
- BitmapFont 生成时机 → 预生成 + 增量

## DoD
- [ ] demo 游戏可玩
- [ ] 60fps 中端机
- [ ] 接口稳定

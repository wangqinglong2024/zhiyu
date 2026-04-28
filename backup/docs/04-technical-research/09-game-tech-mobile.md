# 4.9 · 游戏技术 + 移动端

## 一、12 款游戏概览（与 /games 现有规划对齐）

| # | 游戏 | 核心机制 | 操控方式 | 难度 | 词汇联动 |
|:---:|---|---|---|:---:|:---:|
| 01 | 汉字忍者 | 切水果式 | 滑动 | 中 | 强 |
| 02 | 拼音射击 | 飞机射击 | 触屏 / 摇杆 | 中 | 强 |
| 03 | 声调泡泡 | 泡泡龙 | 拖拽 | 易 | 强 |
| 04 | 汉字俄罗斯方块 | 俄罗斯方块 | 滑动 / 旋转 | 中 | 中 |
| 05 | 打地鼠 | 反应游戏 | 点击 | 易 | 强 |
| 06 | 汉字消消乐 | 三消 | 滑动 | 易 | 中 |
| 07 | 汉字贪吃蛇 | 贪吃蛇 | 滑动 | 中 | 中 |
| 08 | 汉字节奏 | 节奏游戏 | 节拍点击 | 中 | 弱（拼音） |
| 09 | 汉字跑酷 | 跑酷 | 跳跃滑动 | 中 | 弱 |
| 10 | 拼音防御 | 塔防 | 拖拽放置 | 难 | 强 |
| 11 | 翻牌记忆 | 配对记忆 | 点击 | 易 | 强 |
| 12 | 汉字弹弓 | 愤怒小鸟式 | 拖拽瞄准 | 中 | 中 |

**强制要求**：所有 12 款全部强制横屏。

## 二、游戏引擎选型

### 2.1 选型对比

| 引擎 | 体积 | 性能 | TS 支持 | 学习曲线 | 决策 |
|---|:---:|:---:|:---:|---|---|
| Phaser 3 | 1.2 MB | 高 | 好 | 中 | 备选 |
| **PixiJS v8** | 350 KB | 极高 | 极好 | 中 | **首选** |
| Three.js | 600 KB | 高（3D） | 好 | 高 | 不需要 |
| Babylon.js | 4 MB | 极高 | 极好 | 高 | 不需要 |
| Unity WebGL | 5+ MB | 极高 | C# | 极高 | 体积太大 |

→ **首选 PixiJS v8（Canvas + WebGL 自动）**

### 2.2 配套库

| 类别 | 选型 |
|---|---|
| 物理（部分游戏） | Matter.js（轻量 2D） |
| 音频 | Howler.js |
| 状态 | Zustand（与主 App 一致） |
| 动画 | GSAP（License 为 free for non-profit / 自购 v8 商业） / Framer Motion 备选 |
| 输入 | 自有 InputManager（手势） |

### 2.3 共享游戏 Shell
- 通用 UI：暂停 / 重玩 / 退出 / 分数 / 排行榜
- 通用游戏循环：requestAnimationFrame + delta time
- 通用资源加载：PIXI.Assets
- 通用音频管理：Howler.Group
- 通用结算：API 提交分数

## 三、强制横屏

### 3.1 实现方式

```typescript
// 1. CSS：检测竖屏时显示提示
@media (orientation: portrait) {
  .game-container { display: none; }
  .rotate-prompt { display: flex; }
}

// 2. JS：尝试 lock orientation
async function lockLandscape() {
  if (screen.orientation && screen.orientation.lock) {
    try {
      await screen.orientation.lock('landscape');
    } catch (e) {
      // iOS Safari 不支持，依赖 CSS fallback
    }
  }
}

// 3. 全屏 API（推荐）
async function enterFullscreen(el: HTMLElement) {
  if (el.requestFullscreen) await el.requestFullscreen();
  // 进入全屏后再 lock orientation 成功率更高
}
```

### 3.2 用户体验
- 进入游戏页 → 自动尝试 lock + fullscreen（需用户交互）
- 失败时 → 显示"请横屏游玩"动画提示
- 提供"已横屏"按钮（用户手动旋转后点击）

### 3.3 iOS 兼容
- iOS Safari 不支持 lockOrientation API
- 依赖：CSS @media + 视觉提示
- v2 移动 App（Capacitor）可原生 lock

## 四、性能优化（中端机适配）

### 4.1 目标设备
- **低端**：Vivo Y20s / Oppo A57 / Samsung Galaxy A02s（2 GB RAM, GPU 弱）
- **中端**：Vivo V25 / Oppo Reno 8 / Samsung Galaxy A33（4-6 GB RAM）
- **高端**：iPhone 12+, Pixel 6+, Samsung S22+

### 4.2 优化策略
- **资源**：
  - 纹理 atlas（减少 draw call）
  - 图片用 WebP / AVIF
  - 音频 OGG（比 MP3 小 30%）
  - Sprite sheet 不超过 2048×2048
- **渲染**：
  - 自适应 FPS（30 fps 默认，高端机 60 fps）
  - 动态降级（FPS < 25 自动减少粒子 / 关卡复杂度）
  - 视口外对象不渲染
- **逻辑**：
  - 对象池（避免 GC）
  - 时间步长固定（避免抖动）
- **加载**：
  - 首屏只加载当前关
  - 下一关预加载（idle callback）

### 4.3 性能监控
- 内置 FPS counter（开发模式）
- 上报：FPS / load time / 卡顿次数

## 五、与课程的联动

### 5.1 场景与词汇范围
- 用户进入游戏 → 选场景（电商 / 工厂 / HSK / 日常）
- 选阶段范围（如电商 4-6 级）
- 系统从对应知识点池中筛选词汇 → 注入游戏

### 5.2 数据流

```
用户选场景 → API: /api/v1/games/:id/start?track=ec&stage_from=4&stage_to=6
                ↓
            后端：
            - 验证用户解锁状态
            - 从 content_knowledge_points 筛词汇
            - 返回游戏配置 + 词汇池
                ↓
            前端：游戏内动态使用词汇
                ↓
            游戏结束：POST /api/v1/games/:id/submit
                ↓
            后端：
            - 记录分数到 user_progress_games
            - 错答词汇入 SRS
            - 知语币奖励（基于分数）
```

### 5.3 解锁规则
- 已解锁课程对应阶段 → 可选场景
- 未解锁 → 灰显 + 提示

## 六、知语币与游戏

### 6.1 币消耗
- 皮肤：100-500 币（普通）/ 1000-3000 币（限定）
- 复活道具：50 币 / 次
- 解锁高级关卡：500 币

### 6.2 币奖励
- 单局达标：5-20 币
- 全国排行榜前 100：每周 50-200 币
- 限时活动：100-500 币

## 七、社交（不实时）

### 7.1 异步好友挑战
- 用户 A 通关 → 生成"挑战链接"
- 用户 B 24h 内点击 → 用相同种子（同词汇 / 同关卡）挑战
- 比拼分数 → 双方 push 通知

### 7.2 排行榜
- 单游戏：周榜 / 月榜 / 总榜
- 国家榜：分越南 / 泰国 / 印尼
- 总榜：所有用户

### 7.3 不做（v1）
- 实时对战
- 直播
- 联机合作

## 八、移动端策略

### 8.1 v1：Web + PWA
- 浏览器访问 + Add to Home Screen
- 优势：无需应用商店审核
- 劣势：iOS PWA 限制多

### 8.2 v1.5：可选轻量 Capacitor 包装
- 用 Capacitor.js 把 Web 打包为 iOS / Android App
- 优势：上架商店、更接近原生
- 劣势：需付出审核成本

### 8.3 v2：React Native 重写
- 性能更优
- 复用大部分组件 + 业务逻辑
- 游戏：用 react-native-pixi 或重写为 Skia

### 8.4 决策：v1 仅 PWA，避免商店审核风险

## 九、游戏开发节奏

### 9.1 开发顺序（按 RICE）
1. **Wave 1（W-1 上线 5 款）**：拼音射击、声调泡泡、汉字消消乐、打地鼠、翻牌记忆
   - 选这 5 款的理由：玩法简单、复用 PixiJS 组件、覆盖核心机制
2. **Wave 2（W+2 上线 4 款）**：汉字忍者、汉字俄罗斯方块、汉字贪吃蛇、汉字节奏
3. **Wave 3（W+4 上线 3 款）**：汉字跑酷、拼音防御、汉字弹弓

### 9.2 单款工时估算
- 简单（消消乐 / 翻牌）：3-5 工程日
- 中等（射击 / 节奏 / 跑酷）：7-10 工程日
- 复杂（塔防 / 弹弓）：12-15 工程日

### 9.3 复用率
- 共享 Shell + 字体 + 音效 + UI = 60% 代码复用
- 单款独立逻辑 = 40%

## 十、风险与缓解

| 风险 | 缓解 |
|---|---|
| iOS Safari PWA 限制 | 兜底 CSS + 横屏提示 + v1.5 Capacitor |
| 中端机性能不足 | 物理设备测试 + FPS 自适应降级 |
| 横屏 lock 失败 | 渐进降级（CSS + 视觉提示） |
| 12 款工时太大 | 分波次上线 + 共享 Shell |
| 玩法重复 | 设计阶段强制差异化 |
| 知语币经济失衡 | 经济模型仿真 + 月度复盘 |
| 排行榜被刷 | 服务端校验分数 / 设备指纹 |

## 十一、声音 / 音乐

### 11.1 BGM
- 12 首独立 BGM（每款游戏 1 首）
- 来源：Pixabay 免费商用 / Mubert AI 生成 / 购买
- 长度：2-3 分钟循环

### 11.2 音效
- 通用音效：点击 / 对错 / 升级
- 专属音效：每款游戏 5-10 个

### 11.3 音频管理
- Howler.js
- 用户可独立调"BGM 音量"和"音效音量"
- 设置入个人中心

## 十二、与设计系统对齐

- 来自 grules: Cosmic Refraction
- Primary Rose / Secondary Sky / Tertiary Amber
- 禁止紫色
- 字体：与主 App 一致（多语种字体集）

## 十三、QA 与测试

### 13.1 测试清单（每款游戏）
- [ ] 横屏 lock 在 Android Chrome 成功
- [ ] iOS Safari 横屏提示正常
- [ ] 中端机 30 FPS 稳定
- [ ] 内存不漏（玩 30 分钟不崩）
- [ ] 网络断开 / 弱网处理
- [ ] 关闭 / 退出后状态保留（继续游戏）
- [ ] 分数提交 / 知语币奖励准确
- [ ] 错答词汇正确入 SRS

### 13.2 自动化
- Playwright e2e（基础流程）
- 性能测试：Lighthouse + Chrome DevTools

进入 [`05-product-brief/`](../05-product-brief/00-index.md)。

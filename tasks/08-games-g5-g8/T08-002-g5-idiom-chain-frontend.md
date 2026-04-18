# T08-002: G5 成语接龙大战 — Phaser 游戏前端

> 分类: 08-游戏 G5-G8 (Games G5-G8)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 15+

## 需求摘要

实现 G5 成语接龙大战的 Phaser 3 前端游戏场景。包括成语卡牌链横向滚动展示、底部输入框与联想提示面板、10 秒倒计时进度条、成语释义浮层、PK 模式回合交替与对手信息展示、车轮战多人头像与淘汰标记。场景封装为独立 Phaser Scene，通过 T06-010 游戏通用框架容器加载。强制横屏 1920×1080，中国象棋风格棋盘氛围，竹简/宣纸卡牌视觉，支持皮肤系统预留。

## 相关上下文

- 产品需求: `product/apps/07-games-g5-g8/01-g5-idiom-chain.md` — G5 完整 PRD（**核心依据**）
  - §三 游戏画面布局（顶部 HUD、成语链展示区、底部操作区、倒计时进度条）
  - §四 核心交互（起始成语入场动画、键盘输入、联想提示选择、接龙成功/失败视觉反馈链、倒计时归零动画）
  - §五 PK 模式（三回合制布局、回合交替遮罩、回合间结算卡片、车轮战头像排列）
  - §六 上瘾机制（生僻成语飘字特效、释义浮层、每日排名）
  - §七 状态矩阵（所有游戏中状态的 UI 表现）
- 游戏设计: `game/05-idiom-chain.md`
  - §四 视觉与交互（中国象棋对弈桌、竹简卡牌、接龙链布局）
  - §七.1 Phaser 3 场景结构
- 通用 HUD: `product/apps/05-game-common/08-hud-landscape.md` — 暂停按钮、声音控制、横屏切换
- 前端规范: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统（色彩铁律）
- UI 规范: `grules/06-ui-design.md` — 毛玻璃参数、动效铁律
- 编码规范: `grules/05-coding-standards.md` §二 — React/TS 组件规范
- 关联任务: T08-001（G5 后端）→ 本任务 | T06-010（Phaser 容器框架）→ 本任务

## 技术方案

### Phaser 3 场景架构

```
G5IdiomChain/
├── BootScene.ts              # 资源预加载（卡牌纹理、背景、音效、字体）
├── GameScene.ts              # 核心游戏主场景
│   ├── ChainDisplay.ts       # 成语卡牌链横向展示 + 滚动管理
│   ├── IdiomCard.ts          # 单张成语卡牌（竹简/宣纸造型 + 四字竖排）
│   ├── InputPanel.ts         # 底部输入面板（输入框 + 确认/清空按钮）
│   ├── SuggestionPanel.ts    # 右侧联想提示面板（候选列表 + 常见度标签）
│   ├── CountdownBar.ts       # 底部 10 秒倒计时进度条（颜色渐变 + 闪烁）
│   ├── MeaningTooltip.ts     # 成语释义浮层（释义 + 出处 + 例句）
│   ├── ScoreDisplay.ts       # 分数显示 + 得分飘字动画
│   └── EffectManager.ts      # 特效管理（卡牌入场、链条断裂、生僻加分粒子）
├── PKScene.ts                # PK 模式场景扩展
│   ├── OpponentInfo.ts       # 对手信息条（头像 + 昵称 + 分数 + 回合标记）
│   ├── TurnOverlay.ts        # 回合交替遮罩（等待对方 + 呼吸闪烁）
│   ├── RoundSettlement.ts    # 回合间结算卡片（胜负 + 比分 + 链长 + 倒计时）
│   └── WheelWarDisplay.ts    # 车轮战多人头像排列 + 淘汰标记
├── GameOverOverlay.ts        # Game Over / 正确答案展示
└── SkinManager.ts            # 皮肤系统（卡牌样式/棋盘/字体/接龙特效可替换）
```

### 核心组件详细设计

#### 1. 成语卡牌 IdiomCard

```typescript
interface IdiomCardConfig {
  idiom: string           // 四字成语
  pinyin: string          // 拼音
  owner: 'player' | 'opponent' | 'ai'
  rarity: 'common' | 'advanced' | 'rare'
  position: { x: number; y: number }
}

// 视觉规范（来自 PRD §3.3）
// - 尺寸：160×200px，圆角 12px
// - 背景：米色宣纸质感 rgba(245,235,220,0.9) + 纸张纹理
// - 文字：四字竖排，每字 H2 24px，深棕色 #3d2b1f，字间距 8px
// - 底部：出自哪方标签（我方 Sky 蓝 / 对手 Rose 红 / AI 灰色）
// - 入场：从右侧滑入 + 轻微弹跳（300ms easeOutBack）
```

#### 2. 成语链展示 ChainDisplay

```typescript
// 横向排列成语卡牌，间距 24px
// 卡牌之间以 Amber 色箭头连接线（2px + 箭头末端）
// 接龙关键字（尾字↔首字）在箭头上方高亮（16px Rose 红色）
// 链条超出宽度时自动向左滚动，保持最新卡牌可见
// 末端显示闪烁的 "?" 占位卡牌（虚线边框 Amber 色）
```

#### 3. 输入面板 InputPanel

```typescript
// 左侧占 55%（PRD §3.4.1）
// 当前尾字展示：Display 48px Rose 红色 + 下方拼音 16px 灰色
// 输入框：400×56px 圆角 12px 毛玻璃背景
// 确认按钮：药丸形 Rose 红色 140×48px
// 清空按钮：药丸形 透明+白边框 100×48px
// 输入验证：超过 4 字红色边框 + 提示、首字不匹配震动反馈
```

#### 4. 联想提示面板 SuggestionPanel

```typescript
// 右侧占 45%（PRD §3.4.2）
// 标题 "可选成语" Caption 12px 白色 60%
// 每行 52px，Body 16px 白色
// 常见度标签：无/Sky 蓝色 "进阶"/Amber ⭐ "生僻"
// 已用成语：灰色删除线 + 30% 透明度
// 点击直接选用（自动填入 + 自动提交）
// 超 8 条可滚动
```

#### 5. 倒计时进度条 CountdownBar

```typescript
// 全宽 8px 圆角 4px（PRD §3.4.3）
// 底色 rgba(255,255,255,0.1)
// 填充色：绿 #22c55e (>5s) → Amber #d97706 (3-5s) → Rose #e11d48 (<3s)
// 秒数 Body S 14px 精确到 0.1s
// 最后 3 秒：闪烁 + 秒数放大 120% + 心跳音效
```

### 核心交互实现

#### 起始成语入场（PRD §4.1）

```
时间线：
0ms    — 成语卡牌从中央放大入场（50% → 100%，500ms）
200ms  — 朗读音频播放
500ms  — 释义浮层弹出（rgba(0,0,0,0.7) + blur 12px，持续 2s）
1000ms — 尾字高亮 Rose 红色 + 放大 120%（300ms）
1500ms — 操作区激活，输入框获取焦点，10 秒倒计时启动
1500ms — 联想提示面板加载候选列表
```

#### 接龙成功反馈链（PRD §4.4）

```
时间线：
0ms    — 输入框绿色闪光（#22c55e 边框 300ms）
100ms  — 新卡牌从操作区飞向链条末端（滑入 + 弹跳 400ms）
300ms  — 箭头连接线绘制 + 接龙关键字高亮
200ms  — 得分飘字（+100 / +150 博学! Amber 色，上移 60px 淡出）
300ms  — 链长度计数器 +1 弹跳放大
500ms  — 释义浮层展示 1.5 秒
600ms  — 操作区重置（输入框清空、尾字更新、联想面板刷新、新倒计时启动）

生僻成语额外：飘字 "+150 博学!" + ⭐ + 星形粒子 + 铃铛音
```

#### 接龙失败 — 无效成语（PRD §4.5）

```
0ms    — 输入框震动 3 次（±6px）+ Rose 红边框（300ms）
50ms   — 错误提示文字（Rose 红 14px）
       — 倒计时不暂停
音效   — 短促 "嗡" 错误音
```

#### 接龙失败 — 超时（PRD §4.6）

```
0ms    — 进度条 Rose 红闪烁 3 次 + 蜂鸣音
200ms  — "?" 占位卡牌碎裂动画（裂开 + 碎片飞散 Rose 红色）
500ms  — 判负处理（按模式分支）
800ms  — "其实可以接：XXX" 灰色浮层（2 秒）
```

### PK 模式布局（PRD §5）

```
顶部 HUD 扩展：
  双方头像（32×32 圆形）+ 昵称（14px）+ 分数（16px）+ 回合胜负标记
  中央 VS 标志

己方回合：操作区正常，输入框焦点
对方回合：操作区灰色遮罩 opacity 40%，"等待对方" 呼吸闪烁

回合间结算：毛玻璃面板 400×200px
  "第 X 回合" + "你赢了!/你输了" + 链长度 + 比分 + "下一回合 3 秒后开始"

车轮战：3-6 人头像横排，当前操作者高亮，淘汰者变灰 + "已淘汰"
```

### 音效设计

| 场景 | 音效 |
|------|------|
| 接龙成功 | 清脆 "叮" 确认音 + 成语朗读 |
| 接龙失败 | 短促 "嗡" 错误音 |
| 倒计时紧迫 | 最后 3 秒心跳音效 |
| 超时 | 蜂鸣提示音 |
| 链条断裂 | 碎裂音效 |
| 生僻成语 | 铃铛音叠加 |
| 回合结算 | 胜利/失败旋律 |
| 最终结算 | 通用结算 BGM |

### WebSocket 实时同步

```typescript
// 接收服务端广播
// g5_idiom_result → 更新对手操作动画、链条、分数
// g5_round_end → 展示回合结算卡片
// g5_elimination → 车轮战淘汰动画

// 发送到服务端
// g5_submit → 玩家提交接龙
```

## 范围（做什么）

- 实现 G5 Phaser 3 BootScene（资源预加载）
- 实现核心 GameScene（成语链展示、输入面板、联想提示、倒计时）
- 实现成语卡牌组件（竹简/宣纸造型、四字竖排、入场/链条动画）
- 实现输入交互（键盘输入 + 实时过滤联想 + 确认/清空 + 回车提交）
- 实现联想提示面板（候选列表、常见度标签、已用标记、点击选用）
- 实现倒计时进度条（颜色渐变、最后 3 秒闪烁 + 心跳音效）
- 实现释义浮层（成语释义 + 出处，自动展示 1.5 秒淡出）
- 实现接龙成功/失败完整视觉反馈链
- 实现 PK 模式场景（双方信息、回合交替遮罩、回合间结算、车轮战头像）
- 实现 Game Over / 超时展示（链条断裂、正确答案展示）
- 实现 WebSocket 实时同步（PK/车轮战对手操作广播处理）
- 实现皮肤系统预留（卡牌样式/棋盘/字体/特效可替换接口）
- 对接 T08-001 后端 API（候选列表、提交接龙、AI 回合）

## 边界（不做什么）

- 不写后端游戏逻辑（T08-001 已完成）
- 不写匹配页面（T06-009 已完成）
- 不写结算页面（T06-011 已完成）
- 不写通用 HUD 逻辑（T06-010 已完成，直接复用）
- 不实现语音输入（后期功能）
- 不制作成语朗读音频资源（素材团队提供，代码预留接口）

## 涉及文件

- 新建: `frontend/src/games/g5-idiom-chain/BootScene.ts`
- 新建: `frontend/src/games/g5-idiom-chain/GameScene.ts`
- 新建: `frontend/src/games/g5-idiom-chain/PKScene.ts`
- 新建: `frontend/src/games/g5-idiom-chain/components/ChainDisplay.ts`
- 新建: `frontend/src/games/g5-idiom-chain/components/IdiomCard.ts`
- 新建: `frontend/src/games/g5-idiom-chain/components/InputPanel.ts`
- 新建: `frontend/src/games/g5-idiom-chain/components/SuggestionPanel.ts`
- 新建: `frontend/src/games/g5-idiom-chain/components/CountdownBar.ts`
- 新建: `frontend/src/games/g5-idiom-chain/components/MeaningTooltip.ts`
- 新建: `frontend/src/games/g5-idiom-chain/components/ScoreDisplay.ts`
- 新建: `frontend/src/games/g5-idiom-chain/components/EffectManager.ts`
- 新建: `frontend/src/games/g5-idiom-chain/pk/OpponentInfo.ts`
- 新建: `frontend/src/games/g5-idiom-chain/pk/TurnOverlay.ts`
- 新建: `frontend/src/games/g5-idiom-chain/pk/RoundSettlement.ts`
- 新建: `frontend/src/games/g5-idiom-chain/pk/WheelWarDisplay.ts`
- 新建: `frontend/src/games/g5-idiom-chain/GameOverOverlay.ts`
- 新建: `frontend/src/games/g5-idiom-chain/SkinManager.ts`
- 新建: `frontend/src/games/g5-idiom-chain/types.ts`
- 修改: `frontend/src/games/index.ts` — 注册 G5 游戏场景

## 依赖

- 前置: T08-001（G5 后端题库与游戏逻辑）
- 前置: T06-010（Phaser 游戏容器框架）
- 前置: T06-009（匹配页面前端）
- 前置: T06-011（结算页面前端）
- 后续: 无（G5 完整闭环）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入 G5 单人无尽模式  
   **WHEN** 游戏开始  
   **THEN** 起始成语卡牌从中央放大入场，朗读音频播放，释义浮层展示 2 秒，尾字高亮后操作区激活

2. **GIVEN** 操作区激活，联想提示面板已加载  
   **WHEN** 在输入框中输入第 1-2 个字  
   **THEN** 右侧联想面板实时过滤匹配结果，已输入部分加粗高亮

3. **GIVEN** 联想面板显示候选成语  
   **WHEN** 点击某个候选成语  
   **THEN** 自动填入输入框 + 自动提交，无需二次确认

4. **GIVEN** 提交有效成语  
   **WHEN** 服务端返回 valid: true  
   **THEN** 输入框绿色闪光 → 新卡牌飞入链条 → 箭头连接 → 得分飘字 → 释义浮层 1.5 秒 → 操作区重置

5. **GIVEN** 提交无效成语  
   **WHEN** 服务端返回 valid: false  
   **THEN** 输入框震动 3 次 + Rose 红边框 + 对应错误提示文字 + 倒计时继续不暂停

6. **GIVEN** 10 秒倒计时进行中  
   **WHEN** 剩余时间 < 3 秒  
   **THEN** 进度条变 Rose 红闪烁 + 秒数放大 120% + 心跳音效

7. **GIVEN** PK 模式对方回合  
   **WHEN** 等待对方操作  
   **THEN** 操作区灰色遮罩 40% + "等待对方" 呼吸闪烁 + 对方头像边框发光

8. **GIVEN** PK 模式某回合结束  
   **WHEN** 一方接龙失败  
   **THEN** 链条断裂动画 + 回合结算卡片（胜负/比分/链长）+ 3 秒后进入下一回合

9. **GIVEN** 车轮战模式 4 人  
   **WHEN** 一名玩家淘汰  
   **THEN** 该玩家头像变灰 + "已淘汰" 标记 + 后续轮转自动跳过

10. **GIVEN** 使用生僻成语接龙成功  
    **WHEN** 得分飘字展示  
    **THEN** 飘字为 "+150 博学!" Amber 金色 + ⭐ 标记 + 星形粒子特效 + 铃铛音效

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. `docker compose logs --tail=30 backend` — 后端无报错
5. Browser MCP 导航到 G5 游戏入口页面
6. 验证单人无尽模式完整游戏流程（起始 → 输入 → 接龙 → AI → 超时）
7. 验证 PK 模式布局（双方信息、回合交替、结算卡片）
8. 验证车轮战模式（多人头像、淘汰标记）
9. 验证横屏显示（强制 landscape）
10. 截图记录 Light + Dark 模式
11. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Phaser 场景正常加载，无 JS 报错
- [ ] 成语链横向滚动流畅
- [ ] 输入框交互正常（输入、联想过滤、提交）
- [ ] 倒计时进度条颜色渐变正确
- [ ] PK/车轮战实时同步正常
- [ ] 横屏强制生效
- [ ] 皮肤系统预留接口存在
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/08-games-g5-g8/` 下创建同名结果文件

结果文件路径: `/tasks/result/08-games-g5-g8/T08-002-g5-idiom-chain-frontend.md`

## 自检重点

- [ ] UI: 色彩仅限 Rose/Sky/Amber + 中性色，严禁紫色
- [ ] UI: 中国象棋风格木纹背景 + 宣纸卡牌质感
- [ ] UI: 所有动画带 transition，Hover 有 translateY(-1px)
- [ ] 性能: Phaser 场景 60 FPS，卡牌数量多时无掉帧
- [ ] 性能: 联想面板实时过滤 < 50ms 响应
- [ ] 横屏: landscape 强制，进入游戏自动切换
- [ ] 无障碍: prefers-reduced-motion 时关闭非核心动画
- [ ] 皮肤: 卡牌/棋盘/字体/特效替换接口预留

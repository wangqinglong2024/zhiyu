# T08-006: G7 古诗飞花令 — Phaser 游戏前端

> 分类: 08-游戏 G5-G8 (Games G5-G8)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 16+

## 需求摘要

实现 G7 古诗飞花令的 Phaser 3 前端游戏场景。核心体验：关键字以书法动画揭晓、诗句展示区配古风水墨背景与朗诵音频、底部输入区支持联想提示列表、回合交替以对手头像+诗句展示、连击计数器动态增长。整体视觉为山水画卷风格，纸张卷轴布局，毛笔字诗句渲染。强制横屏 1920×1080。

## 相关上下文

- 产品需求: `product/apps/07-games-g5-g8/03-g7-poem-flyorder.md` — G7 完整 PRD
  - §三 游戏画面布局（关键字展示区顶部居中、诗句画卷展示区中央、底部操作区、连击计数右下）
  - §四 核心交互（关键字书法揭晓、诗句滚动展示、输入联想、吟诵成功/失败动画链）
  - §五 PK 模式布局（双方区域+中央诗句卷轴）
  - §六 上瘾机制（稀有诗句飘字特效、称号展示、诗词知识浮层）
  - §七 状态矩阵
- 游戏设计: `game/07-poem-flyorder.md`
  - §四 视觉与交互（山水画卷、毛笔字渲染、墨色晕染特效）
  - §七.1 Phaser 3 场景结构
- 通用 HUD: `product/apps/05-game-common/08-hud-landscape.md`
- 前端规范: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统
- UI 规范: `grules/06-ui-design.md`
- 关联任务: T08-005（G7 后端）→ 本任务 | T06-010（Phaser 容器框架）→ 本任务

## 技术方案

### Phaser 3 场景架构

```
G7PoemFlyorder/
├── BootScene.ts              # 资源预加载（水墨背景、毛笔字字体、朗诵音频、音效）
├── GameScene.ts              # 核心游戏主场景
│   ├── KeywordDisplay.ts     # 顶部关键字展示（书法揭晓动画 + 字义提示）
│   ├── PoemScroll.ts         # 诗句卷轴展示区（历史诗句纵向滚动 + 出处信息）
│   ├── PoemCard.ts           # 单条诗句卡片（毛笔字渲染 + 来源标签 + 稀有度标记）
│   ├── InputPanel.ts         # 底部输入面板（输入框 + 确认 + 联想提示）
│   ├── SuggestionList.ts     # 联想提示列表（候选诗句 + 作者 + 稀有度 + 已用标记）
│   ├── CountdownRing.ts      # 倒计时环形进度（30 秒圆环 + 内部秒数）
│   ├── StreakCounter.ts      # 连击计数器（右下角 + 倍数展示 + 火焰特效）
│   ├── ScoreDisplay.ts       # 得分飘字（+100/+180 + 稀有度标签）
│   └── EffectManager.ts      # 特效管理（墨水晕染、花瓣飘落、书法笔画动画）
├── PKScene.ts                # PK 模式场景扩展
│   ├── OpponentInfo.ts       # 对手信息条（头像 + 昵称 + 分数 + 称号）
│   ├── TurnOverlay.ts        # 回合交替遮罩（"轮到你了" / "对方吟诵中"）
│   ├── RoundSettlement.ts    # 回合结算卡片
│   └── WheelWarDisplay.ts    # 车轮战多人排列 + 淘汰标记
├── PoemDetailOverlay.ts      # 诗词详情浮层（全文 + 注释 + 赏析摘要）
├── TitleDisplay.ts           # 称号展示组件（称号名 + 图标 + 升级动画）
├── GameOverOverlay.ts        # Game Over / 最终结算
└── SkinManager.ts            # 皮肤系统预留
```

### 核心组件详细设计

#### 1. 关键字展示 KeywordDisplay

```typescript
// 顶部居中 200×120px
// 关键字：Display 64px 毛笔字体 白色（或 Amber 金色）
// 下方小字：字义提示 Body S 14px 白色 60%
// 关键字类型标签："单字令" / "主题令" Caption 12px 白边框

// 揭晓动画：
//   0ms    — 墨汁从中央扩散晕染（圆形遮罩 500ms）
//   300ms  — 关键字毛笔笔画逐笔书写动画（600ms）
//   600ms  — 字体放大 120% → 100% 弹跳
//   800ms  — 下方字义淡入
//   1000ms — 操作区激活
```

#### 2. 诗句卷轴 PoemScroll

```typescript
// 中央区域 1200×500px 卷轴造型
// 背景：宣纸/绢帛质感 rgba(245,235,215,0.15) + 纸张纹理
// 左右卷轴装饰（木色/红色卷轴头）
// 诗句从底部向上滚动排列
// 每条诗句 60px 高度，间距 16px
// 超出可见区域自动向上滚动，保持最新诗句可见
// 最多同时可见 6-7 条

// 诗句格式：
//   己方诗句：右对齐 + Sky 蓝标签
//   对手诗句：左对齐 + Rose 红标签
//   AI 诗句：左对齐 + 灰色标签
```

#### 3. 诗句卡片 PoemCard

```typescript
interface PoemCardConfig {
  sentence: string           // 诗句文本
  author: string             // 作者
  title: string              // 诗词标题
  dynasty: string            // 朝代
  owner: 'player' | 'opponent' | 'ai'
  rarity: 1 | 2 | 3 | 4 | 5
}

// 视觉规范
// 诗句文本：H2 24px 毛笔字体 白色
// 出处信息：Caption 12px "—— 唐·李白《静夜思》" 白色 40%
// 稀有度标记：rarity ≥ 3 → Amber ⭐ | rarity ≥ 4 → Amber ⭐⭐ | rarity 5 → Rose 💎
// 入场动画：从对应方向滑入（己方从右、对手从左）+ 毛笔字渐显效果
```

#### 4. 输入面板 InputPanel

```typescript
// 底部 100px 高度
// 中央输入框：500×48px 毛玻璃背景 圆角 12px
// 确认按钮：药丸形 Rose 红 120×48px "吟诵"
// 左侧：当前关键字重复展示 Body 16px Amber 色
// 右侧：连击计数预览（当前连击数）

// 输入时实时触发联想查询（debounce 300ms）
// 回车 = 确认提交
```

#### 5. 联想提示列表 SuggestionList

```typescript
// 输入框上方弹出面板 500×280px 毛玻璃
// 每行 48px：诗句文本（16px 白色）+ 作者（12px 灰色）+ 稀有度标记
// 已用诗句：灰色 + 删除线 + 30% 透明度 + "已用" 标签
// 点击选中 → 自动填入 + 自动提交
// 最多显示 8 条，可滚动
// 无结果时："没有找到匹配的诗句" 灰色提示
```

#### 6. 倒计时环形 CountdownRing

```typescript
// 右上角 80×80px 圆环
// 外环 6px：Amber 色 → Rose 红色（最后 10 秒）
// 内部秒数：Display 28px 白色
// 最后 5 秒：环 + 秒数同时脉冲闪烁
// 最后 3 秒：心跳音效 + 环变 Rose 红闪烁
```

#### 7. 连击计数器 StreakCounter

```typescript
// 右下角 120×60px
// "连击" Caption 12px 白色 60%
// 数字 Display 36px Amber 金色
// 倍数标签 "×1.5" Body S 14px Rose 红色
// 连击 ≥ 3：数字周围火焰粒子效果
// 连击 ≥ 5：整体发光 + 火焰加大
// 连击 ≥ 10：彩虹色描边 + 爆裂粒子
// 连击断裂：数字碎裂 + 灰色淡出
```

### 核心交互实现

#### 关键字揭晓（PRD §4.1）

```
时间线：
0ms    — 场景渐暗（0.7 遮罩 300ms）
200ms  — 中央圆形墨汁晕染扩散（500ms）
400ms  — 关键字毛笔笔画逐笔书写动画（600ms）
         笔画路径跟随，墨色从深到浅渐变
700ms  — 关键字弹跳放大 120% → 100%
800ms  — 字义提示淡入
900ms  — 遮罩淡出
1000ms — 操作区激活 + 输入框获取焦点 + 倒计时 30 秒启动
1000ms — 联想提示预加载
```

#### 吟诵成功反馈链（PRD §4.4）

```
时间线：
0ms    — 输入框绿色闪光 300ms
100ms  — 诗句卡片从右侧飞入卷轴（滑入 + 弹跳 400ms）
200ms  — 诗句文本毛笔字渐显效果（墨色从淡到深 400ms）
300ms  — 出处信息淡入（"—— 唐·张九龄《望月怀远》"）
400ms  — 得分飘字上升（"+180" Amber 金色 + 稀有度标签）
400ms  — 连击计数器 +1 弹跳
500ms  — 朗诵音频播放（如有）
600ms  — 诗词知识浮层短暂展示 2 秒（可选）
800ms  — 操作区重置 + 新倒计时启动

稀有诗句额外：花瓣从诗句四周飘落 + 星形粒子 + 铃铛音
```

#### 吟诵失败 — 不含关键字

```
0ms    — 输入框 Rose 红边框闪烁 3 次
50ms   — 关键字高亮放大提醒（顶部关键字 120% 脉冲 3 次）
100ms  — 错误提示 "诗句中需要包含「月」" Rose 红 14px
音效   — 短促错误音
```

#### 吟诵失败 — 已被使用

```
0ms    — 输入框 Amber 色边框
50ms   — 卷轴中对应已用诗句高亮闪烁 + 标记使用者
100ms  — 错误提示 "这句诗已被 XXX 使用过了" Amber 14px
音效   — 重复提示音
```

#### 吟诵失败 — 非真实诗句

```
0ms    — 输入框 Rose 红边框 + 震动 3 次
100ms  — 错误提示 "未找到匹配的古诗句" Rose 红 14px
音效   — 错误音
```

### PK 模式布局（PRD §5）

```
顶部 HUD 扩展：
  左侧 — 己方：头像 + 昵称 + 称号 + 分数
  右侧 — 对手：头像 + 昵称 + 称号 + 分数
  中央 — 关键字 + VS

诗句卷轴：双方诗句交替排列（左对齐/右对齐区分）

己方回合：操作区正常 + 倒计时启动
对方回合：操作区灰色遮罩 40% + "对方吟诵中..." 呼吸闪烁
  对方提交后：对方诗句从左侧飞入卷轴

回合间结算（Bo3 一局结束）：
  毛玻璃面板 400×250px
  "第 X 局" + "你赢了!/你输了" + 双方比分 + 双方诗句数 + 稀有度对比
  "下一局 3 秒后开始"

车轮战：顶部多人头像横排 + 当前操作者高亮 + 淘汰者变灰
```

### 音效设计

| 场景 | 音效 |
|------|------|
| 关键字揭晓 | 毛笔落纸声 + 轻柔古风旋律 |
| 吟诵成功 | 清脆确认音 + 诗句朗诵（如有） |
| 稀有诗句 | 铃铛音 + 花瓣飘落音 |
| 连击 3+ | 火焰燃烧声 |
| 吟诵失败 | 短促错误音 |
| 超时 | 蜂鸣警告 + 卷轴合拢声 |
| 倒计时紧迫 | 心跳音效 |
| 回合结算 | 胜利/失败旋律 |
| 称号升级 | 庆祝旋律 + 烟花 |

## 范围（做什么）

- 实现 G7 Phaser 3 BootScene（水墨资源预加载）
- 实现核心 GameScene（关键字展示、诗句卷轴、输入面板、倒计时环、连击计数）
- 实现关键字书法揭晓动画（墨汁晕染 + 笔画逐笔 + 弹跳）
- 实现诗句卡片组件（毛笔字渲染 + 出处 + 稀有度标记 + 入场动画）
- 实现诗句卷轴展示（纵向滚动、自动跟随最新、卷轴装饰）
- 实现输入面板（输入框 + 确认按钮 + 回车提交）
- 实现联想提示列表（实时过滤、已用标记、点击选用）
- 实现倒计时环形进度（渐变色 + 闪烁 + 心跳音效）
- 实现连击计数器（火焰特效 + 倍数展示 + 断裂动画）
- 实现吟诵成功/失败完整视觉反馈链
- 实现诗词详情浮层（点击诗句查看全文 + 注释）
- 实现 PK 模式场景（双方信息、回合交替、车轮战）
- 实现称号展示组件（升级动画）
- 对接 T08-005 后端 API（开始/候选/提交/AI）

## 边界（不做什么）

- 不写后端逻辑（T08-005）
- 不写匹配/结算页面（T06）
- 不写通用 HUD（T06-010 复用）
- 不实现语音吟诵（后期功能）
- 不制作诗句朗诵音频（素材团队提供，预留接口）

## 涉及文件

- 新建: `frontend/src/games/g7-poem-flyorder/BootScene.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/GameScene.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/PKScene.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/KeywordDisplay.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/PoemScroll.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/PoemCard.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/InputPanel.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/SuggestionList.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/CountdownRing.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/StreakCounter.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/ScoreDisplay.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/components/EffectManager.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/pk/OpponentInfo.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/pk/TurnOverlay.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/pk/RoundSettlement.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/pk/WheelWarDisplay.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/PoemDetailOverlay.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/TitleDisplay.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/GameOverOverlay.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/SkinManager.ts`
- 新建: `frontend/src/games/g7-poem-flyorder/types.ts`
- 修改: `frontend/src/games/index.ts` — 注册 G7 游戏场景

## 依赖

- 前置: T08-005（G7 后端诗词库与验证逻辑）
- 前置: T06-010（Phaser 游戏容器框架）
- 前置: T06-009（匹配页面前端）
- 前置: T06-011（结算页面前端）
- 后续: 无（G7 完整闭环）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 进入 G7 单人无尽模式  
   **WHEN** 游戏开始  
   **THEN** 中央墨汁晕染扩散 → 关键字毛笔逐笔书写 → 字义淡入 → 操作区激活

2. **GIVEN** 操作区激活  
   **WHEN** 输入 "明月" 二字  
   **THEN** 联想提示列表弹出（debounce 300ms）+ 匹配诗句 + 作者 + 稀有度标记

3. **GIVEN** 联想列表显示候选诗句  
   **WHEN** 点击某候选诗句  
   **THEN** 自动填入 + 自动提交（无需二次确认）

4. **GIVEN** 提交有效诗句  
   **WHEN** 服务端返回 valid: true  
   **THEN** 输入框绿色闪光 → 诗句卡片飞入卷轴 → 毛笔字渐显 → 出处淡入 → 得分飘字 → 连击 +1

5. **GIVEN** 连续 5 次有效吟诵  
   **WHEN** 连击计数达到 5  
   **THEN** 连击计数器显示 "5" + "×1.5" + 火焰粒子效果加大

6. **GIVEN** 连击被打断（超时/失败）  
   **WHEN** 连击归零  
   **THEN** 连击数字碎裂动画 + 灰色淡出

7. **GIVEN** 使用稀有诗句（rarity ≥ 3）  
   **WHEN** 吟诵成功  
   **THEN** 花瓣飘落特效 + 稀有度 ⭐ 标记 + 额外得分飘字

8. **GIVEN** PK 模式对方回合  
   **WHEN** 等待对方吟诵  
   **THEN** 操作区灰色遮罩 + "对方吟诵中..." 呼吸闪烁

9. **GIVEN** 倒计时 30 秒  
   **WHEN** 剩余 < 5 秒  
   **THEN** 环形进度 Rose 红闪烁 + 心跳音效

10. **GIVEN** 点击卷轴中已展示的诗句  
    **WHEN** 详情浮层弹出  
    **THEN** 显示完整诗词全文 + 注释 + 赏析摘要

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. `docker compose logs --tail=30 backend` — 后端无报错
5. Browser MCP 导航到 G7 游戏入口页面
6. 验证关键字书法揭晓动画完整
7. 验证输入联想 + 点击选用 + 诗句入场动画
8. 验证连击计数器递增 + 火焰特效
9. 验证 PK 模式回合交替
10. 验证横屏强制 landscape
11. 截图记录 Light + Dark 模式
12. 验收标准逐条验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Phaser 场景正常加载，无 JS 报错
- [ ] 书法揭晓动画流畅
- [ ] 诗句卷轴滚动流畅
- [ ] 联想提示响应 < 300ms
- [ ] 连击特效正常
- [ ] PK 实时同步正常
- [ ] 横屏强制生效
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/08-games-g5-g8/` 下创建同名结果文件

结果文件路径: `/tasks/result/08-games-g5-g8/T08-006-g7-poem-flyorder-frontend.md`

## 自检重点

- [ ] UI: 色彩仅限 Rose/Sky/Amber + 中性色，严禁紫色
- [ ] UI: 山水画卷风格 + 毛笔字渲染 + 宣纸质感
- [ ] UI: 墨汁晕染/花瓣飘落等中国风特效
- [ ] 性能: 60 FPS，多诗句滚动无掉帧
- [ ] 性能: 书法动画流畅（笔画路径渲染 < 16ms/帧）
- [ ] 横屏: landscape 强制
- [ ] 无障碍: prefers-reduced-motion 时关闭非核心动画
- [ ] 皮肤: 卷轴/字体/特效可替换接口预留
- [ ] 音频: 朗诵音频接口预留（即使素材未就绪）

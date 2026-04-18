# T06-010: 前端页面 — 匹配与对战框架

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: XL(超大)
> 预估文件数: 15+

## 需求摘要

实现匹配等待页面和游戏对战通用框架。匹配页展示段位匹配动画、倒计时、30 秒超时后 AI 对战入口。对战框架负责强制横屏、Phaser 3 容器初始化（React 包装）、通用 HUD 面板（计时/血条/分数/退出）。本任务是所有 12 款游戏的底层容器，游戏具体逻辑由各游戏任务实现。

## 相关上下文

- 产品需求: `product/apps/05-game-common/03-matching.md` — 匹配页面 PRD
  - §三 匹配中页面布局（段位展示、VS 动画、计时器）
  - §五 超时处理页面
  - §七 断线处理（重连提示）
- 产品需求: `product/apps/05-game-common/08-hud-landscape.md` — 强制横屏与 HUD（**核心依据**）
  - §二 横屏检测与强制旋转提示
  - §三 HUD 常驻面板布局
  - §四 暂停/退出按钮逻辑
- 产品需求: `product/apps/05-game-common/02-common-ui.md` — 通用 UI 组件
- 游戏引擎: Phaser 3（ `game/00-index.md` §四 — 12 款游戏共用 Phaser 3）
- 设计规范: `grules/01-rules.md` §二.1 — Cosmic Refraction 设计系统
- 编码规范: `grules/05-coding-standards.md` §二 — React 组件规范
- 关联任务: T06-005 → 本任务 → T06-011（结算页）、各游戏模块

## 技术方案

### 页面结构

```
/games/:gameCode/match          # 匹配等待页（竖屏）
├── MatchHeader                 # 游戏名称+模式
├── MatchAnimation              # VS 动画（双方段位展示）
├── MatchTimer                  # 倒计时（30秒）
├── MatchStatus                 # 状态文字（匹配中/已找到/超时）
└── AiMatchButton               # 超时后显示 AI 对战按钮

/games/:gameCode/play/:sessionId  # 游戏对战页（强制横屏）
├── LandscapeGuard              # 横屏检测+旋转提示
├── PhaserContainer             # Phaser 3 游戏容器（React 包装）
├── GameHUD                     # 通用 HUD 面板
│   ├── TimerDisplay            # 计时器
│   ├── ScoreBoard              # 分数面板（己方/对手）
│   ├── ProgressBar             # 进度条/血条
│   └── PauseButton             # 暂停/退出按钮
└── DisconnectOverlay           # 断线重连遮罩
```

### Phaser 3 React 包装组件

```typescript
// frontend/src/pages/games/components/PhaserContainer.tsx
import Phaser from 'phaser'
import { useEffect, useRef, useCallback } from 'react'

interface PhaserContainerProps {
  gameConfig: Phaser.Types.Core.GameConfig
  sessionId: string
  onGameReady?: (game: Phaser.Game) => void
  onGameDestroy?: () => void
}

export function PhaserContainer({ gameConfig, sessionId, onGameReady, onGameDestroy }: PhaserContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    
    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: containerRef.current,
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
      },
    }
    
    gameRef.current = new Phaser.Game(config)
    onGameReady?.(gameRef.current)
    
    return () => {
      gameRef.current?.destroy(true)
      onGameDestroy?.()
    }
  }, [sessionId])

  return <div ref={containerRef} className="w-full h-full" />
}
```

### 强制横屏检测

```typescript
// frontend/src/pages/games/components/LandscapeGuard.tsx
import { useState, useEffect } from 'react'

export function LandscapeGuard({ children }: { children: React.ReactNode }) {
  const [isLandscape, setIsLandscape] = useState(true)

  useEffect(() => {
    function checkOrientation() {
      const isLand = window.innerWidth > window.innerHeight
      setIsLandscape(isLand)
    }
    
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    // 尝试锁定横屏
    screen.orientation?.lock?.('landscape').catch(() => {})
    
    return () => {
      window.removeEventListener('resize', checkOrientation)
      screen.orientation?.unlock?.()
    }
  }, [])

  if (!isLandscape) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        {/* 旋转手机提示动画 */}
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-rotate-phone">📱</div>
          <p className="text-lg">请旋转手机至横屏模式</p>
          <p className="text-sm text-white/60 mt-2">游戏需要在横屏下进行</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

### 通用 HUD 面板

```typescript
// frontend/src/pages/games/components/GameHUD.tsx
interface GameHUDProps {
  // 计时
  timeRemaining?: number      // 剩余秒数
  timeElapsed?: number        // 已用秒数
  showTimer: boolean
  
  // 分数
  myScore: number
  opponentScore?: number
  showScore: boolean
  
  // 进度
  progress?: number           // 0-100
  showProgress: boolean
  
  // 玩家信息
  myAvatar: string
  myNickname: string
  opponentAvatar?: string
  opponentNickname?: string
  
  // 回调
  onPause: () => void
  onExit: () => void
}
```

### WebSocket 连接管理

```typescript
// frontend/src/hooks/useMatchWebSocket.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseMatchWebSocketOptions {
  gameCode: string
  mode: string
  onMatchFound: (data: { sessionId: string, players: Player[] }) => void
  onTimeout: () => void
  onPlayerJoined?: (data: { currentCount: number, maxCount: number }) => void
}

export function useMatchWebSocket(options: UseMatchWebSocketOptions) {
  const [status, setStatus] = useState<'idle' | 'matching' | 'found' | 'timeout'>('idle')
  const [countdown, setCountdown] = useState(30)
  
  // ... Supabase Realtime 订阅匹配频道
}
```

### 匹配页面

```typescript
// frontend/src/pages/games/MatchPage.tsx
// 状态机: idle → matching → found → navigating
//                        ↘ timeout → ai_option
```

### 前端目录结构

```
frontend/src/
├── pages/
│   └── games/
│       ├── MatchPage.tsx              # 匹配等待页
│       ├── GamePlayPage.tsx           # 对战容器页
│       └── components/
│           ├── PhaserContainer.tsx     # Phaser 3 容器
│           ├── LandscapeGuard.tsx      # 横屏检测
│           ├── GameHUD.tsx            # 通用 HUD
│           ├── TimerDisplay.tsx       # 计时器
│           ├── ScoreBoard.tsx         # 分数面板
│           ├── PauseMenu.tsx          # 暂停菜单
│           ├── DisconnectOverlay.tsx   # 断线遮罩
│           ├── MatchAnimation.tsx     # 匹配 VS 动画
│           └── AiMatchButton.tsx      # AI 对战按钮
├── hooks/
│   ├── useMatchWebSocket.ts           # 匹配 WebSocket Hook
│   ├── useGameSession.ts             # 游戏会话 Hook
│   └── useLandscape.ts               # 横屏检测 Hook
```

## 范围（做什么）

- 实现匹配等待页面（段位展示 + VS 动画 + 30 秒倒计时）
- 实现匹配超时后 AI 对战入口
- 实现 WebSocket 匹配事件监听（Supabase Realtime）
- 实现强制横屏检测与旋转提示
- 实现 Phaser 3 容器（React 包装组件，lifecycle 管理）
- 实现通用 HUD 面板（计时/分数/进度条/暂停/退出）
- 实现暂停菜单（继续/退出确认）
- 实现断线重连遮罩（10 秒内自动重连 / 超时判负）
- 实现退出确认弹窗（提示逃跑惩罚）
- 实现游戏对战容器页面路由

## 边界（不做什么）

- 不实现具体游戏的 Phaser Scene（各游戏模块负责传入 gameConfig）
- 不实现结算页面（T06-011 负责）
- 不实现后端匹配 API（T06-005 已完成）

## 涉及文件

- 新建: `frontend/src/pages/games/MatchPage.tsx`
- 新建: `frontend/src/pages/games/GamePlayPage.tsx`
- 新建: `frontend/src/pages/games/components/PhaserContainer.tsx`
- 新建: `frontend/src/pages/games/components/LandscapeGuard.tsx`
- 新建: `frontend/src/pages/games/components/GameHUD.tsx`
- 新建: `frontend/src/pages/games/components/TimerDisplay.tsx`
- 新建: `frontend/src/pages/games/components/ScoreBoard.tsx`
- 新建: `frontend/src/pages/games/components/PauseMenu.tsx`
- 新建: `frontend/src/pages/games/components/DisconnectOverlay.tsx`
- 新建: `frontend/src/pages/games/components/MatchAnimation.tsx`
- 新建: `frontend/src/pages/games/components/AiMatchButton.tsx`
- 新建: `frontend/src/hooks/useMatchWebSocket.ts`
- 新建: `frontend/src/hooks/useGameSession.ts`
- 新建: `frontend/src/hooks/useLandscape.ts`
- 修改: `frontend/src/router.tsx`（添加 /games/:gameCode/match 和 /games/:gameCode/play/:sessionId 路由）
- 修改: `frontend/package.json`（添加 phaser 依赖）

## 依赖

- 前置: T06-005（后端匹配 API + WebSocket 事件）
- 前置: T06-009（游戏大厅页面 → 导航到匹配页）
- 后续: T06-011（前端结算页面）
- 后续: 各游戏模块（G1-G12 向 PhaserContainer 传入具体 gameConfig）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 用户从游戏大厅选择 PK 模式 WHEN 导航到匹配页 THEN 展示匹配动画、段位信息、30 秒倒计时
2. GIVEN 匹配中 WHEN 收到 match_found 事件 THEN 展示 VS 动画（双方头像+段位），3 秒后自动跳转对战页
3. GIVEN 匹配 30 秒未找到对手 WHEN 超时 THEN 展示 "匹配超时" 并显示 "AI 对战" 按钮
4. GIVEN 用户选择 AI 对战 WHEN 点击按钮 THEN 创建 AI 会话并跳转对战页
5. GIVEN 对战页面加载 WHEN 手机竖屏 THEN 显示旋转提示全屏遮罩，不加载游戏
6. GIVEN 手机已横屏 WHEN 对战页渲染 THEN Phaser 3 容器正确初始化，HUD 面板顶部显示
7. GIVEN 游戏进行中 WHEN 点击暂停按钮 THEN 游戏暂停，显示暂停菜单（继续/退出）
8. GIVEN 暂停菜单中点击退出 WHEN 确认退出 THEN 弹窗提示 "退出将判定失败并扣除星数"，确认后发送逃跑请求
9. GIVEN 对战中断网 WHEN 检测到断线 THEN 显示断线重连遮罩，10 秒内自动重连
10. GIVEN HUD 面板 WHEN 游戏进行中 THEN 正确显示计时器、双方分数、进度条

## UI 设计对照检查表（强制）

> 必须遵循 Cosmic Refraction 设计系统

- [ ] 毛玻璃效果: 匹配页卡片 + HUD 面板
- [ ] `backdrop-filter: blur(24px) saturate(1.8)`
- [ ] 背景透明度: `rgba(255, 255, 255, 0.06~0.15)`
- [ ] 禁止紫色: 无 purple/violet 色系
- [ ] 主题色: Rose/Sky/Amber 三色系
- [ ] HUD 面板: 半透明底部/顶部栏，不遮挡核心游戏区域
- [ ] 横屏提示: 全屏深色遮罩 + 旋转动画
- [ ] Tailwind CSS v4: `@import "tailwindcss"` + `@theme`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 浏览器访问匹配页面
4. 验证匹配动画与倒计时
5. 验证 WebSocket 连接（开发者工具 Network → WS）
6. 验证对战页面 Phaser 容器加载
7. 验证 HUD 面板各元素
8. 验证横屏检测与旋转提示（Chrome DevTools 模拟手机旋转）
9. 验证暂停/退出流程
10. 验证断线遮罩

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，前端正常渲染
- [ ] 匹配页面动画流畅
- [ ] WebSocket 连接正常
- [ ] Phaser 3 容器初始化成功
- [ ] HUD 面板正确显示
- [ ] 横屏检测功能正常
- [ ] 暂停/退出流程完整
- [ ] 毛玻璃效果可见
- [ ] 无紫色元素
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-010-fe-matching-framework.md`

## 自检重点

- [ ] Phaser 生命周期: React 组件卸载时 Phaser Game 正确 destroy
- [ ] 内存泄漏: WebSocket 订阅在组件卸载时取消
- [ ] 横屏锁定: screen.orientation.lock 调用有 catch（部分浏览器不支持）
- [ ] HUD 层级: z-index 管理不与 Phaser Canvas 冲突
- [ ] 断线重连: 不丢失游戏状态
- [ ] 退出确认: 必须二次确认，防止误触

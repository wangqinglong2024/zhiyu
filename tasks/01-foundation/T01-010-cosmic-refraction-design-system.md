# T01-010: Cosmic Refraction 设计系统实现

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 6

## 需求摘要

完整实现 Cosmic Refraction（宇宙折射）毛玻璃设计系统。包括：全局 CSS 变量体系、毛玻璃语义化类库（`.glass`、`.glass-card`、`.glass-elevated`、`.glass-bubble-ai`、`.glass-bubble-user`、`.glass-decor`）、渐变网格 Blob 背景组件、按钮体系（`.btn-primary`、`.btn-glass`、`.btn-ghost`）、输入体系（`.glass-input`）、装饰性浮动玻璃方块、所有 Blob 漂移和浮动动画（精确参数复制自 `grules/01-rules.md`）。

## 相关上下文

- 架构白皮书: `grules/01-rules.md` §一 — **核心依据**（CSS 精确参数、Three.js 规格、毛玻璃物理参数）
- 设计规范: `grules/06-ui-design.md` §二 — 视觉设计体系（色彩、字体、间距、圆角、阴影、图标）
- 设计规范: `grules/06-ui-design.md` §三 — 交互设计范式
- 编码规范: `grules/05-coding-standards.md` §二.4 — 前端样式规则
- 关联任务: 前置 T01-009（React 框架 + index.css 基础） → 后续 T01-011（Three.js 粒子层）

## 技术方案

### frontend/src/styles/index.css — 完整毛玻璃类库

> 以下 CSS 必须**精确复制** `grules/01-rules.md` §一中的所有参数，不可修改数值。

```css
/* ===== 毛玻璃语义化类库 ===== */

/* .glass — 标准基线毛玻璃面板 */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 0 var(--glass-inset),
    0 4px 12px var(--glass-shadow);
}

/* .glass-card — 卡片级毛玻璃，含 hover 悬浮响应 */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);  /* rounded-3xl = 24px */
  box-shadow:
    inset 0 1px 0 0 var(--glass-inset),
    0 4px 12px var(--glass-shadow);
  transition: all 300ms ease-out;
}

.glass-card:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 0 var(--glass-inset),
    0 8px 24px var(--glass-shadow);
}

/* .glass-elevated — 高阶浮起面板 (blur 32px)，弹窗/悬浮菜单/聊天输入区 */
.glass-elevated {
  background: var(--glass-bg);
  backdrop-filter: blur(32px) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(32px) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow:
    inset 0 1px 0 0 var(--glass-inset),
    0 8px 24px var(--glass-shadow),
    0 16px 48px rgba(0, 0, 0, 0.08);
}

.dark .glass-elevated {
  box-shadow:
    inset 0 1px 0 0 var(--glass-inset),
    0 8px 24px var(--glass-shadow),
    0 16px 48px rgba(0, 0, 0, 0.6);
}

/* .glass-bubble-ai — AI 对话气泡（质感更强、更清晰） */
.glass-bubble-ai {
  background: rgba(255, 255, 255, 0.30);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.40);
  border-radius: var(--radius-xl);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
}

.dark .glass-bubble-ai {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}

/* .glass-bubble-user — 用户对话气泡（更柔和） */
.glass-bubble-user {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-xl);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
}

.dark .glass-bubble-user {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
}

/* .glass-decor — 纯装饰性浮动玻璃方块 */
.glass-decor {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.20);
  border-radius: var(--radius-lg);
  pointer-events: none;
}

.dark .glass-decor {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

/* ===== 按钮体系 ===== */

/* .btn-primary — 主行动点 CTA */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--color-rose-primary, #e11d48);
  color: #ffffff;
  border: none;
  border-radius: 9999px;  /* rounded-full */
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 300ms ease-out;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.35);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* .btn-glass — 毛玻璃药丸按钮 */
.btn-glass {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: 9999px;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 300ms ease-out;
}

.btn-glass:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--glass-shadow);
}

.btn-glass:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

/* .btn-ghost — 透明幽灵按钮 */
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9999px;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 300ms ease-out;
}

.btn-ghost:hover {
  background: var(--glass-bg);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border-color: var(--glass-border);
  transform: translateY(-1px);
}

.btn-ghost:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

/* ===== 输入体系 ===== */

/* .glass-input — 表单输入框 */
.glass-input {
  width: 100%;
  padding: 12px 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: 9999px;  /* rounded-full */
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  transition: all 300ms ease-out;
}

.glass-input::placeholder {
  color: var(--text-tertiary);
}

/* Focus 弥散光晕 — 绝不使用 ring/border */
.glass-input:focus {
  box-shadow: 0 0 0 4px var(--input-focus-glow);
  border-color: var(--glass-border);
}

.glass-input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 聊天输入框（方角） */
.glass-input-chat {
  width: 100%;
  padding: 12px 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);  /* rounded-xl */
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  transition: all 300ms ease-out;
}

.glass-input-chat:focus {
  box-shadow: 0 0 0 4px var(--input-focus-glow);
}

/* ===== 性能降级 ===== */
@media (max-width: 768px) {
  /* 移动端检测低性能设备时降级 — 通过 JS 添加 .perf-low 类 */
  .perf-low .glass,
  .perf-low .glass-card,
  .perf-low .glass-elevated {
    --glass-blur: 12px;
    --glass-saturate: 1.2;
  }
}
```

### frontend/src/styles/animations.css — 动效定义

> 以下动画参数**必须精确复制** `grules/01-rules.md` 中的代码块，不可修改任何数值。

```css
/* ===== 三个 Mesh Gradient Blob 漂移动画 ===== */
@keyframes mesh-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(80px, -60px) scale(1.05); }
  50%      { transform: translate(-40px, 80px) scale(0.95); }
  75%      { transform: translate(60px, 40px) scale(1.02); }
}

@keyframes mesh-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(-70px, 50px) scale(0.97); }
  50%      { transform: translate(90px, -30px) scale(1.04); }
  75%      { transform: translate(-50px, -70px) scale(1.01); }
}

@keyframes mesh-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(50px, 70px) scale(1.03); }
  50%      { transform: translate(-80px, -40px) scale(0.96); }
  75%      { transform: translate(30px, -60px) scale(1.06); }
}

/* 应用到 3 个 Blob 元素（错开延迟产生呼吸感） */
.mesh-blob-1 {
  animation: mesh-drift-1 22s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.mesh-blob-2 {
  animation: mesh-drift-2 25s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  animation-delay: -7s;
}
.mesh-blob-3 {
  animation: mesh-drift-3 20s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  animation-delay: -13s;
}

/* ===== 装饰性浮动玻璃方块 ===== */
@keyframes float-slow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-20px) rotate(3deg); }
}
.animate-float-slow {
  animation: float-slow 8s ease-in-out infinite;
}

/* ===== 无障碍：尊重用户减少动画偏好 ===== */
@media (prefers-reduced-motion: reduce) {
  .mesh-blob-1, .mesh-blob-2, .mesh-blob-3,
  .animate-float-slow {
    animation: none !important;
  }
}
```

### frontend/src/components/shared/MeshGradientBackground.tsx — 渐变网格背景

```tsx
import type { FC } from 'react'

/**
 * 渐变网格 Blob 背景 — Z 层级 z-0（最底层）
 * 3 个带 blur(100px) 的巨型模糊 Blob 组成动态渐变背景
 */
export const MeshGradientBackground: FC = () => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden" aria-hidden="true">
      {/* Blob 1: Rose */}
      <div
        className="mesh-blob-1 absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'var(--mesh-color-1)',
          opacity: 'var(--mesh-opacity)',
          filter: 'blur(100px)',
          top: '-10%',
          left: '-5%',
        }}
      />
      {/* Blob 2: Sky */}
      <div
        className="mesh-blob-2 absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'var(--mesh-color-2)',
          opacity: 'var(--mesh-opacity)',
          filter: 'blur(100px)',
          top: '40%',
          right: '-10%',
        }}
      />
      {/* Blob 3: Amber */}
      <div
        className="mesh-blob-3 absolute w-[450px] h-[450px] rounded-full"
        style={{
          background: 'var(--mesh-color-3)',
          opacity: 'var(--mesh-opacity)',
          filter: 'blur(100px)',
          bottom: '-5%',
          left: '30%',
        }}
      />
    </div>
  )
}

MeshGradientBackground.displayName = 'MeshGradientBackground'
```

### frontend/src/components/shared/GlassDecorBlocks.tsx — 装饰性浮动玻璃方块

```tsx
import type { FC } from 'react'

/**
 * 装饰性浮动玻璃方块 — 用于空状态或登录注册页
 * 3~4 个绝对定位 + 错开延迟的浮动方块
 */
export const GlassDecorBlocks: FC = () => {
  return (
    <>
      <div
        className="glass-decor animate-float-slow absolute w-16 h-16 opacity-60"
        style={{ top: '15%', right: '10%', animationDelay: '0s' }}
        aria-hidden="true"
      />
      <div
        className="glass-decor animate-float-slow absolute w-12 h-12 opacity-40"
        style={{ top: '60%', left: '8%', animationDelay: '2s' }}
        aria-hidden="true"
      />
      <div
        className="glass-decor animate-float-slow absolute w-20 h-20 opacity-50"
        style={{ bottom: '20%', right: '15%', animationDelay: '4s' }}
        aria-hidden="true"
      />
      <div
        className="glass-decor animate-float-slow absolute w-10 h-10 opacity-30"
        style={{ top: '35%', left: '25%', animationDelay: '6s' }}
        aria-hidden="true"
      />
    </>
  )
}

GlassDecorBlocks.displayName = 'GlassDecorBlocks'
```

### Z 轴空间分层（强制）

```
z-index 分层规则（必须严格遵守）：
  z-[-20]  → 渐变网格 Blob 背景（MeshGradientBackground）
  z-[-10]  → Three.js 粒子层（T01-011 ParticleBackground）
  z-[0]    → 业务内容层（毛玻璃面板、卡片等）
  z-[10]   → 浮层（弹窗、下拉菜单）
  z-[20]   → Toast/通知
  z-[30]   → 全局遮罩
```

## 范围（做什么）

- 完善 `frontend/src/styles/index.css` 全部毛玻璃语义化类库
- 创建 `frontend/src/styles/animations.css` 完整动效定义
- 创建 `MeshGradientBackground.tsx` 渐变网格背景组件
- 创建 `GlassDecorBlocks.tsx` 装饰性浮动方块组件
- 完善按钮体系（.btn-primary / .btn-glass / .btn-ghost）
- 完善输入体系（.glass-input / .glass-input-chat）
- 实现性能降级（低性能设备降低 blur/saturate）
- 更新 `App.tsx` 挂载背景组件

## 边界（不做什么）

- 不实现 Three.js 粒子层（T01-011）
- 不创建完整的 UI 组件库（后续按需创建）
- 不实现具体业务页面的布局
- 不实现响应式断点的完整适配（各业务任务负责）

## 涉及文件

- 修改: `zhiyu/frontend/src/styles/index.css`（完善毛玻璃类库、按钮、输入框）
- 新建: `zhiyu/frontend/src/styles/animations.css`
- 新建: `zhiyu/frontend/src/components/shared/MeshGradientBackground.tsx`
- 新建: `zhiyu/frontend/src/components/shared/GlassDecorBlocks.tsx`
- 修改: `zhiyu/frontend/src/App.tsx`（挂载 MeshGradientBackground）
- 修改: `zhiyu/frontend/src/main.tsx`（导入 animations.css）

## 依赖

- 前置: T01-009（React 框架 + 基础 index.css）
- 后续: T01-011（Three.js 粒子层在此基础上叠加）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 前端页面加载完成  
   **WHEN** 检查背景区域  
   **THEN** 可见 3 个模糊渐变 Blob 缓慢漂移（22s/25s/20s 周期）

2. **GIVEN** Light 模式  
   **WHEN** 检查 Blob 颜色  
   **THEN** 使用 `#fda4af`(rose) / `#7dd3fc`(sky) / `#fde68a`(amber)，透明度 0.5~0.7

3. **GIVEN** Dark 模式  
   **WHEN** 检查 Blob 颜色  
   **THEN** 使用 `#e11d48` / `#0284c7` / `#d97706`，透明度 0.10~0.15

4. **GIVEN** `.glass-card` 元素存在  
   **WHEN** 鼠标 hover  
   **THEN** 元素上移 1px（translateY(-1px)），阴影扩大

5. **GIVEN** `.glass-input` 存在  
   **WHEN** 聚焦输入框  
   **THEN** 出现弥散光晕（box-shadow: 0 0 0 4px），无默认 ring

6. **GIVEN** `.btn-primary` 按钮  
   **WHEN** 设置 disabled  
   **THEN** 透明度降为 0.45，cursor 变为 not-allowed

7. **GIVEN** 用户系统启用 `prefers-reduced-motion: reduce`  
   **WHEN** 检查 Blob 和装饰方块  
   **THEN** 所有动画停止

8. **GIVEN** 装饰性浮动方块  
   **WHEN** 检查 HTML 属性  
   **THEN** 所有方块带 `aria-hidden="true"`

9. **GIVEN** 页面全部 CSS 已加载  
   **WHEN** 搜索任何紫色 (purple/violet) CSS 值  
   **THEN** 不存在任何紫色元素（**铁律**）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动
2. Browser MCP 导航到 `http://localhost:3100`
3. Browser MCP 截图 Light 模式 — 验证 Blob 背景可见
4. 切换 Dark 模式 → 截图 — 验证暗色 Blob
5. 检查 `.glass-card` hover 效果
6. 检查 `.glass-input` focus 效果
7. 检查 `.btn-primary` / `.btn-glass` / `.btn-ghost` 样式
8. 检查装饰方块 `aria-hidden`
9. 验证 375px / 768px / 1280px 三断点渲染

### 测试通过标准

- [ ] 渐变网格 Blob 可见且漂移
- [ ] Light/Dark 双模式正常
- [ ] 毛玻璃效果清晰可见
- [ ] 按钮三件套样式正确
- [ ] 输入框 Focus 弥散光晕
- [ ] 无紫色元素
- [ ] 无障碍属性完整
- [ ] 响应式三断点正常

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新全量验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-010-cosmic-refraction-design-system.md`

## 自检重点

- [ ] CSS 参数与 grules/01-rules.md 完全一致
- [ ] 动画参数精确（周期、延迟、缓动函数）
- [ ] 无紫色（铁律）
- [ ] 无 tailwind.config.js（铁律）
- [ ] 无障碍：aria-hidden、prefers-reduced-motion
- [ ] 性能：嵌套毛玻璃不超过 2 层
- [ ] Z 轴分层正确

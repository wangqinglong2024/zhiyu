# T02-011: UI 组件库 — 原子组件（毛玻璃设计系统）

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 18

## 需求摘要

实现知语 Zhiyu Cosmic Refraction 设计系统的原子级 UI 组件库。包含：Button、Input、Modal、Toast、Skeleton、Card、Badge、BottomSheet、Toggle、Checkbox 等基础组件。所有组件遵循毛玻璃设计规范，支持 Light/Dark 双主题，使用 CSS 变量驱动。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/07-common-components.md` — 通用组件清单
  - §一: Toast 组件（4 类型、顶部居中、堆叠最多 3 条）
  - §二: Modal 对话框（焦点陷阱、危险确认双按钮）
  - §三: Bottom Sheet（3 档高度、拖拽关闭）
  - §四: Pull-to-refresh 下拉刷新
  - §五: Infinite Scroll 无限滚动
- 设计规范: `grules/01-rules.md` §一 — Cosmic Refraction 设计系统
  - 核心参数: `backdrop-filter: blur(24px) saturate(1.8)`
  - 色彩: Rose(#f43f5e/#fb7185) / Sky(#0ea5e9/#38bdf8) / Amber(#f59e0b/#fbbf24)
  - **绝对红线: 不使用紫色**
  - 输入框: `.glass-input` 毛玻璃 + Focus 弥散光晕（非默认 ring）
  - 按钮: `.btn-primary` Rose 色药丸按钮 + Disabled opacity-0.45
- 设计规范: `grules/01-rules.md` §一.3 — 动效缓动函数
  - Standard: `cubic-bezier(0.4, 0, 0.2, 1)` 通用
  - Spring: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` 弹性
  - Accelerate: `cubic-bezier(0.4, 0, 1, 1)` 退出
- 设计规范: `grules/06-ui-design.md` §二 — 组件设计规范
- 关联任务: T01-010（Tailwind v4 基础配置）→ 本任务 → T02-012（布局组件）

## 技术方案

### 组件清单

| 组件 | 变体 | 说明 |
|------|------|------|
| `Button` | primary / secondary / ghost / danger | Rose 色药丸按钮 + 各种变体 |
| `IconButton` | default / ghost | 图标按钮（如收藏、分享） |
| `Input` | text / email / password / search | `.glass-input` 毛玻璃输入框 |
| `TextArea` | default | 多行输入框 |
| `Checkbox` | default | 勾选框 |
| `Toggle` | default | 开关切换 |
| `Select` | default | 下拉选择器 |
| `Modal` | info / confirm / danger | 焦点陷阱 + Esc 关闭 + 遮罩关闭 |
| `BottomSheet` | sm(30%) / md(50%) / lg(70%) | 拖拽关闭 + 3 档高度 |
| `Toast` | success / error / warning / info | 顶部居中 + 堆叠 max 3 |
| `Card` | default / glass | 毛玻璃卡片 |
| `Badge` | dot / count | 消息角标（Tab Bar 用） |
| `Skeleton` | text / circle / rect | 骨架屏占位 |
| `Divider` | horizontal / vertical | 分割线 |
| `Avatar` | sm / md / lg | 头像（含默认占位） |
| `ProgressBar` | default | 线性进度条 |

### 核心样式规范

```css
/* 毛玻璃面板基类 */
.glass-panel {
  background: var(--color-bg-glass);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
}

/* 毛玻璃输入框 */
.glass-input {
  background: var(--color-bg-glass);
  backdrop-filter: blur(12px) saturate(1.4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all 200ms var(--ease-standard);
}

.glass-input:focus {
  border-color: var(--color-accent-rose);
  box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.15); /* 弥散光晕，非默认 ring */
  outline: none;
}

/* 主按钮 */
.btn-primary {
  background: var(--color-accent-rose);
  color: white;
  border-radius: 9999px; /* 药丸形状 */
  font-weight: 600;
  transition: all 200ms var(--ease-standard);
}

.btn-primary:disabled {
  opacity: 0.45;
  pointer-events: none;
}

.btn-primary:active {
  transform: scale(0.97);
}
```

### Toast 系统

```typescript
// 全局 Toast 管理器
// 位置: 顶部居中 (top: 16px + safe-area-inset-top)
// 堆叠: 最多 3 条同时显示，新 Toast 从上方推入
// 自动消失: success/info 3s, warning 5s, error 不自动消失（需手动关闭）
// 动效: Slide Down 300ms Standard 进入 / Fade Out 200ms 退出
```

### Modal 组件

```typescript
// 焦点陷阱: Tab 键循环在 Modal 内
// Esc 关闭: 按 Esc 关闭（danger 类型二次确认）
// 遮罩关闭: 点击遮罩关闭（danger 类型不允许遮罩关闭）
// 内容: 标题 + 描述 + 按钮组
// danger 类型: "确认删除?" 红色确认按钮 + 灰色取消按钮
```

### BottomSheet 拖拽

```typescript
// 拖拽条: 顶部中央 32x4px 圆角灰条
// 拖拽关闭: 下拉超过 120px → 释放时关闭
// 拖拽回弹: 下拉未超过 120px → 释放时弹回原位
// 三档高度: sm(30vh) / md(50vh) / lg(70vh)
```

### 组件目录结构

```
frontend/src/core/components/ui/
├── Button.tsx
├── IconButton.tsx
├── Input.tsx
├── TextArea.tsx
├── Checkbox.tsx
├── Toggle.tsx
├── Select.tsx
├── Modal.tsx
├── BottomSheet.tsx
├── Toast.tsx
├── ToastProvider.tsx
├── Card.tsx
├── Badge.tsx
├── Skeleton.tsx
├── Divider.tsx
├── Avatar.tsx
├── ProgressBar.tsx
└── index.ts
```

## 范围（做什么）

- 实现 16 个原子组件（含所有变体）
- 所有组件使用 CSS 变量 + Tailwind v4 类
- 所有组件支持 Light + Dark 双主题
- 实现 Toast 全局管理器（ToastProvider + useToast Hook）
- 实现 Modal 焦点陷阱 + Esc/遮罩关闭
- 实现 BottomSheet 拖拽交互
- 所有组件支持 `className` props 自定义扩展
- 所有交互组件支持 `disabled` 状态
- 按钮/输入框支持 `loading` 状态

## 边界（不做什么）

- 不实现布局组件（T02-012）
- 不实现业务级组件（各模块自行实现）
- 不实现 Storybook 或组件文档
- 不实现 Pull-to-refresh / Infinite Scroll（T02-012）

## 涉及文件

- 新建: `frontend/src/core/components/ui/Button.tsx`
- 新建: `frontend/src/core/components/ui/IconButton.tsx`
- 新建: `frontend/src/core/components/ui/Input.tsx`
- 新建: `frontend/src/core/components/ui/TextArea.tsx`
- 新建: `frontend/src/core/components/ui/Checkbox.tsx`
- 新建: `frontend/src/core/components/ui/Toggle.tsx`
- 新建: `frontend/src/core/components/ui/Select.tsx`
- 新建: `frontend/src/core/components/ui/Modal.tsx`
- 新建: `frontend/src/core/components/ui/BottomSheet.tsx`
- 新建: `frontend/src/core/components/ui/Toast.tsx`
- 新建: `frontend/src/core/components/ui/ToastProvider.tsx`
- 新建: `frontend/src/core/components/ui/Card.tsx`
- 新建: `frontend/src/core/components/ui/Badge.tsx`（⚠️ T02-001 已在 `components/ui/Badge.tsx` 创建了基础版本，此处为 core 层增强版本，需在 T02-001 完成后迁移合并）
- 新建: `frontend/src/core/components/ui/Skeleton.tsx`
- 新建: `frontend/src/core/components/ui/Divider.tsx`
- 新建: `frontend/src/core/components/ui/Avatar.tsx`
- 新建: `frontend/src/core/components/ui/ProgressBar.tsx`
- 新建: `frontend/src/core/components/ui/index.ts`
- 新建: `frontend/src/core/hooks/use-toast.ts`

## 依赖

- 前置: T01-010（Tailwind v4 + CSS 变量基础）、T02-008（主题 CSS 变量已定义）
- 后续: T02-012（布局组件使用原子组件）、全部前端模块

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Button primary 变体  
   **WHEN** 渲染  
   **THEN** Rose 色药丸形状、白色文字、hover 状态加深

2. **GIVEN** Button primary disabled  
   **WHEN** 渲染  
   **THEN** opacity 0.45、不可点击

3. **GIVEN** Input 组件  
   **WHEN** 聚焦  
   **THEN** 边框变 Rose 色 + 弥散光晕（box-shadow 4px），非默认 focus ring

4. **GIVEN** Toast 触发 success 类型  
   **WHEN** 调用 `toast.success('操作成功')`  
   **THEN** 顶部居中滑入 Toast，3 秒后自动消失

5. **GIVEN** 同时触发 4 条 Toast  
   **WHEN** 渲染  
   **THEN** 最多显示 3 条，第 4 条替换最早的

6. **GIVEN** Modal danger 类型  
   **WHEN** 显示  
   **THEN** 焦点陷阱激活 + 红色确认按钮 + 遮罩不可关闭

7. **GIVEN** BottomSheet md 档  
   **WHEN** 向下拖拽超过 120px 释放  
   **THEN** BottomSheet 关闭（Slide Down 250ms）

8. **GIVEN** BottomSheet md 档  
   **WHEN** 向下拖拽 80px 释放  
   **THEN** BottomSheet 弹回原位

9. **GIVEN** 深色模式  
   **WHEN** 查看所有组件  
   **THEN** 颜色随 CSS 变量切换，对比度满足可读性

10. **GIVEN** Card glass 变体  
    **WHEN** 渲染  
    **THEN** 背景毛玻璃效果 `blur(24px) saturate(1.8)`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 逐个查看组件渲染效果
4. 截图 Light + Dark 下的所有组件
5. 测试 Toast/Modal/BottomSheet 交互
6. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 16 个组件全部正确渲染
- [ ] Light + Dark 双主题适配
- [ ] `.glass-input` Focus 弥散光晕（非默认 ring）
- [ ] `.btn-primary` Rose 药丸 + disabled opacity-0.45
- [ ] Toast 堆叠、自动消失正确
- [ ] Modal 焦点陷阱正确
- [ ] BottomSheet 拖拽关闭/回弹正确
- [ ] 无障碍: aria-label / role 属性完备
- [ ] 颜色系统: 仅 Rose/Sky/Amber，无紫色
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-011-ui-components-atomic.md`

## 自检重点

- [ ] 绝对红线：不使用紫色，颜色仅 Rose/Sky/Amber
- [ ] 绝对红线：不使用 tailwind.config.js，使用 `@theme` + CSS 变量
- [ ] 绝对红线：输入框 Focus 使用弥散光晕（box-shadow），非默认 ring
- [ ] 安全：Modal 焦点陷阱防止焦点逃逸
- [ ] 性能：Toast 组件使用 Portal 渲染
- [ ] 无障碍：所有交互组件有 aria 属性
- [ ] 类型安全：所有 Props 接口完整定义

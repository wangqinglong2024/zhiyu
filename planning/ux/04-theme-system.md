# 04 · 主题系统（亮 / 暗双模）

> 用户硬性要求 #2：完整 **亮 / 暗模式** 切换。

## 一、模式定义

| 模式 | 值 | 行为 |
|---|---|---|
| 亮 | `light` | 强制亮色，覆盖系统 |
| 暗 | `dark` | 强制暗色，覆盖系统 |
| 跟随系统 | `system` | 监听 `prefers-color-scheme` |

**默认值**：`system`（首次访问）

## 二、技术实现

### 2.1 主题状态
存储位置：`localStorage.theme`（不放 cookie，避免跨域开销）。

```ts
// ThemeContext.tsx（已实现于 frontend-patterns.md）
type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}
```

### 2.2 应用方式
- HTML `<html data-theme="dark" class="dark">` 双标记
- `data-theme` 用于 CSS 变量切换
- `.dark` 类用于 Tailwind dark: 变体兼容

### 2.3 切换过渡
```css
.theme-transition,
.theme-transition * {
  transition:
    background-color 300ms var(--ease-in-out),
    color 300ms var(--ease-in-out),
    border-color 300ms var(--ease-in-out);
}
```
切换时短暂添加 `.theme-transition` 类（300ms 后移除）。

### 2.4 系统监听
```ts
useEffect(() => {
  if (mode !== 'system') return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => setResolved(mq.matches ? 'dark' : 'light');
  handler();
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, [mode]);
```

## 三、切换入口

### 3.1 应用端入口
**位置 1**：个人中心 → 设置 → 主题
- 三档单选：亮 / 暗 / 跟随系统
- 切换即时生效，不需要保存按钮

**位置 2**：顶部右上角图标按钮（仅 `/profile` 内）
- 当前 light → 显示月亮图标 → 切到 dark
- 当前 dark → 显示太阳图标 → 切到 light
- 长按 1s → 弹出三档菜单

### 3.2 后台入口
**位置**：右上角用户菜单 → 主题
- 同三档单选

## 四、CSS 变量声明

### 亮模式
```css
:root,
:root[data-theme='light'] {
  /* 背景 */
  --bg-base:        #fafafa;
  --bg-surface:     #ffffff;
  --bg-elevated:    #ffffff;
  --bg-overlay:     rgba(250,250,250,.85);

  /* 文字 */
  --text-primary:   #0a0a0a;
  --text-secondary: #525252;
  --text-tertiary:  #737373;
  --text-disabled:  #d4d4d4;
  --text-inverse:   #fafafa;

  /* 边框 */
  --border-default: rgba(0,0,0,.08);
  --border-strong:  rgba(0,0,0,.16);

  /* 阴影 */
  --shadow-sm:      0 1px 2px rgba(0,0,0,.04);
  --shadow-md:      0 4px 12px rgba(0,0,0,.06);
  --shadow-lg:      0 12px 32px rgba(0,0,0,.10);

  /* 毛玻璃（详见 03） */
  --glass-bg:       rgba(255,255,255,.45);
  --glass-blur:     16px;
  /* ... */

  /* MeshGradient */
  --mesh-1: #fda4af;
  --mesh-2: #7dd3fc;
  --mesh-3: #fcd34d;

  /* 品牌色（亮暗一致） */
  --color-primary:   #e11d48;
  --color-secondary: #0284c7;
  --color-tertiary:  #d97706;
}
```

### 暗模式
```css
:root[data-theme='dark'] {
  /* 背景 */
  --bg-base:        #0a0a0a;
  --bg-surface:     #171717;
  --bg-elevated:    #262626;
  --bg-overlay:     rgba(10,10,10,.9);

  /* 文字 */
  --text-primary:   #fafafa;
  --text-secondary: #a3a3a3;
  --text-tertiary:  #737373;
  --text-disabled:  #404040;
  --text-inverse:   #0a0a0a;

  /* 边框 */
  --border-default: rgba(255,255,255,.08);
  --border-strong:  rgba(255,255,255,.18);

  /* 阴影（更深以衬托浮起） */
  --shadow-sm:      0 1px 2px rgba(0,0,0,.4);
  --shadow-md:      0 4px 12px rgba(0,0,0,.4);
  --shadow-lg:      0 12px 32px rgba(0,0,0,.5);

  /* 毛玻璃 */
  --glass-bg:       rgba(23,23,23,.55);
  --glass-blur:     20px;

  /* MeshGradient（暗色主题用深色变体） */
  --mesh-1: #881337;  /* rose-900 */
  --mesh-2: #0c4a6e;  /* sky-900 */
  --mesh-3: #78350f;  /* amber-900 */

  /* 品牌色亮一档（确保暗背景下醒目） */
  --color-primary:   #f43f5e;  /* rose-500 */
  --color-secondary: #0ea5e9;  /* sky-500 */
  --color-tertiary:  #f59e0b;  /* amber-500 */
}
```

## 五、亮 / 暗 主题视觉差异

### 5.1 关键差异
| 元素 | 亮 | 暗 |
|---|---|---|
| **页面底色** | 米白 #fafafa | 近黑 #0a0a0a |
| **MeshGradient** | 浅彩色 blob | 深色调 blob（90% 黑+10% 主色） |
| **粒子** | 半透白色 | 半透白色（透明度 0.4 → 0.2） |
| **毛玻璃** | 白色透明 | 黑色透明 |
| **文字** | 近黑 | 近白 |
| **品牌色** | 深一档（600） | 亮一档（500） |
| **阴影** | 浅黑 4-12% | 深黑 40-50% |
| **边框** | 黑色 8-16% | 白色 8-18% |

### 5.2 学习专用色（声调）
亮模式声调更深，暗模式更浅，确保在两种背景下均易辨。

## 六、组件主题感知

所有组件不写死颜色，全部走 CSS 变量或 Tailwind dark: 变体：
```tsx
<div className="bg-glass-bg text-text-primary border border-border-default">
```
或 Tailwind 直接：
```tsx
<div className="bg-white/45 text-neutral-900 dark:bg-neutral-900/55 dark:text-neutral-50">
```

推荐 优先用 CSS 变量类（已封装在 packages/ui/styles/theme.css）。

## 七、特殊处理

### 7.1 图片资源
| 类型 | 处理 |
|---|---|
| 文章封面 | 同图，亮暗都用，加 0.1 暗色 overlay 保证对比 |
| 头像 | 不变 |
| 图标 | SVG 用 currentColor 自动适配；多色图标准备 light / dark 两版 |
| Logo | 准备 logo-light.svg / logo-dark.svg |
| 庆祝插画 | 准备双版 |

### 7.2 视频 / 游戏
- 视频背景：暗模式叠加 30% 黑遮罩
- 游戏画布：游戏内自有 UI，按游戏主题独立设计（仍参考主题 token）

### 7.3 表格 / 后台
- 后台数据密集屏（订单 / 用户表）：亮模式用浅灰行间隔，暗模式用稍亮黑行间隔
- 表格 hover 行：亮 `bg-rose-50/50`，暗 `bg-rose-900/20`

## 八、第三方组件主题适配

| 库 | 处理 |
|---|---|
| Recharts | 通过 ThemeContext 提供颜色对象，组件内 useTheme 读取 |
| TanStack Table | 完全 headless，自定义样式即可 |
| 富文本编辑器（v1.5） | 暗模式皮肤需独立配置 |
| 日期选择器 | 自定义皮肤 |

## 九、检查清单

- [ ] 所有页面在亮 / 暗 / 跟随系统 三模式下截图对比无断层
- [ ] 文字对比度 ≥ 4.5:1（lighthouse a11y 检查）
- [ ] 切换过渡 300ms 平滑无闪烁
- [ ] 系统模式跟随生效（macOS / iOS / Win11 各端测试）
- [ ] localStorage 持久化跨刷新生效
- [ ] 切换不引起 layout shift（CLS = 0）
- [ ] 图片 / 图标在两模式下视觉一致
- [ ] 后台密集屏（订单、用户）暗模式可读

## 十、首次访问行为

1. 读 `localStorage.theme`
2. 若为空 → mode = `system`
3. 读系统 `prefers-color-scheme`
4. 应用 resolved 主题
5. SSR/SSG 防闪烁：HTML 头部 inline script 立即应用主题（避免 FOUC）

```html
<script>
(function() {
  try {
    var t = localStorage.getItem('theme');
    var d = t === 'dark' || (t === 'system' || !t)
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = d ? 'dark' : 'light';
    if (d) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
</script>
```
此脚本必须放 `<head>` 最顶部，避免 FOUC。

## 十一、模式提示

- 首次切换至 暗模式 → 显示 Toast：「眼睛会更舒服 ✨」（5s）
- 切换至 跟随系统 → Toast：「将根据系统设置自动切换 🌗」（3s）
- 切换至 亮模式 → 无提示

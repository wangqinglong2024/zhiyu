# 03 · 毛玻璃系统（Glassmorphism System）

> 用户硬性要求 #1：**透明毛玻璃** 风格全局应用。本文件定义所有毛玻璃材质规范。

## 一、设计原理

毛玻璃 = `半透明背景` + `背景模糊` + `细边框` + `内高光` + `柔阴影` 五要素叠加。

```css
.glass {
  background: var(--glass-bg);                 /* 半透明 */
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);       /* 细边框 */
  box-shadow:
    var(--glass-shadow),                        /* 柔阴影 */
    var(--glass-inset);                         /* 内高光 */
  border-radius: var(--radius-lg);
}
```

## 二、毛玻璃层级（Glass Hierarchy）

| 层级 | 类名 | 模糊 | 透明度 | 用途 |
|---|---|---|---|---|
| L1 基础 | `.glass` | 8px | 0.35 | 底层装饰块 |
| L2 卡片 | `.glass-card` | 16px | 0.45 | 内容卡片 |
| L3 浮起 | `.glass-elevated` | 24px | 0.55 | 模态、抽屉 |
| L4 浮窗 | `.glass-floating` | 32px | 0.65 | 浮动按钮、Tooltip |
| L5 顶层 | `.glass-overlay` | 40px | 0.75 | 横屏遮罩、Splash |

### CSS 实现
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow:
    0 8px 24px rgba(15,23,42,.08),
    inset 0 1px 0 0 rgba(255,255,255,.7);
  border-radius: 16px;
  transition: transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
}
.glass-card:hover {
  transform: translateY(-1px);
  box-shadow:
    0 12px 32px rgba(15,23,42,.12),
    inset 0 1px 0 0 rgba(255,255,255,.7);
}

.glass-elevated {
  background: var(--glass-bg-elevated);
  backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid var(--glass-border-strong);
  box-shadow:
    0 24px 48px rgba(15,23,42,.14),
    inset 0 1px 0 0 rgba(255,255,255,.8);
}
```

## 三、亮 / 暗模式毛玻璃 Token

### 亮模式
```css
:root[data-theme='light'] {
  --glass-bg:           rgba(255,255,255,.45);
  --glass-bg-elevated:  rgba(255,255,255,.65);
  --glass-bg-floating:  rgba(255,255,255,.75);
  --glass-bg-overlay:   rgba(255,255,255,.85);
  --glass-border:       rgba(255,255,255,.6);
  --glass-border-strong:rgba(255,255,255,.8);
  --glass-inset:        inset 0 1px 0 0 rgba(255,255,255,.7);
  --glass-shadow:       0 8px 24px rgba(15,23,42,.08);
  --glass-blur:         16px;
  --glass-saturate:     180%;
}
```

### 暗模式
```css
:root[data-theme='dark'] {
  --glass-bg:           rgba(23,23,23,.55);
  --glass-bg-elevated:  rgba(23,23,23,.7);
  --glass-bg-floating:  rgba(23,23,23,.8);
  --glass-bg-overlay:   rgba(10,10,10,.9);
  --glass-border:       rgba(255,255,255,.10);
  --glass-border-strong:rgba(255,255,255,.18);
  --glass-inset:        inset 0 1px 0 0 rgba(255,255,255,.06);
  --glass-shadow:       0 8px 24px rgba(0,0,0,.4);
  --glass-blur:         20px;
  --glass-saturate:     150%;
}
```

> **暗模式微调原因**：暗背景下需要更强模糊 + 略低饱和度，避免毛玻璃看起来浑浊。

## 四、毛玻璃使用规范

### 4.1 必须毛玻璃的元素
- ✅ 内容卡片（DC 文章 / CR 课程 / NV 小说 / GM 游戏卡）
- ✅ TabBar 底部导航
- ✅ 模态弹窗 / 抽屉 / Bottom Sheet
- ✅ 浮窗（客服 / 设置 / 通知）
- ✅ Toast / Snackbar
- ✅ Tooltip / Popover
- ✅ 后台 Sidebar / 顶栏

### 4.2 不要毛玻璃的元素
- ❌ 输入框（用半透明实色替代，避免读字困难）
- ❌ 按钮（仅 secondary 用淡毛玻璃 `.btn-glass`，primary 用实色）
- ❌ 学习内容句子卡（避免遮挡阅读）
- ❌ 表格行（密度高时性能差）
- ❌ 游戏画布内 HUD（性能优先用实色 + 描边）

### 4.3 必须有的背景
毛玻璃需要"可模糊的背景"。所有应用毛玻璃的页面背景必须包含：
1. **MeshGradient**（三色渐变 blob）
2. **ParticleBackground**（Three.js 粒子，性能允许时）
3. **GlassDecorBlocks**（4-8 个浮动装饰块，pointer-events: none）

详细背景实现见 `frontend-patterns.md` 现有 `MeshGradientBackground.tsx`。

## 五、性能策略

### 5.1 backdrop-filter 性能问题
`backdrop-filter` 是 GPU 密集操作，过多层叠会卡顿。

**优化策略**：
1. **同屏不超过 8 个 backdrop-filter 元素**（含子元素）
2. **滚动列表项**：仅可视区元素应用毛玻璃，virtual scroll
3. **大区域**（>50% 视口）：降级为 `background: rgba()` 无 blur
4. **低端设备检测**：navigator.hardwareConcurrency ≤ 4 时禁用 blur

```ts
// useGlassSupport.ts
export function useGlassSupport() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const lowPower =
      navigator.hardwareConcurrency <= 4 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(!lowPower);
  }, []);
  return enabled;
}
```

如禁用，类降级：
```css
.glass-card.no-glass {
  background: rgba(255,255,255,.92); /* 实色 */
  backdrop-filter: none;
}
```

### 5.2 暗模式额外性能损耗
暗背景模糊 GPU 成本更高，blur 半径上调 4px 但需控制层数。

### 5.3 Safari 兼容
必须 `-webkit-backdrop-filter` 前缀。Safari 14- 不支持 saturate，降级为单 blur。

### 5.4 Firefox 兼容
Firefox 103+ 支持，但需用户开启 layout.css.backdrop-filter.enabled。降级方案为半透明无 blur。

## 六、毛玻璃组件库

| 组件 | 类 | 高度 (CSS) | 用法 |
|---|---|---|---|
| 卡片 | `.glass-card` | auto | 通用容器 |
| 浮起卡片 | `.glass-elevated` | auto | 模态、Bottom Sheet |
| 浮窗 FAB | `.glass-floating` | 56px | 客服 / 设置 |
| 顶栏 | `.glass-header` | 56px | 页面顶部 sticky |
| 底栏 | `.glass-tabbar` | 64px | 底部 Tab 导航 |
| Toast | `.glass-toast` | auto | 顶部提示 |
| Tooltip | `.glass-tooltip` | auto | 长按 / hover 提示 |
| 横屏遮罩 | `.glass-orientation-mask` | 100vh | 强制旋转屏 |

## 七、检查清单

- [ ] 所有毛玻璃元素同屏 ≤ 8
- [ ] 所有 `.glass-*` 类在亮 / 暗主题切换后视觉一致
- [ ] 低端设备已降级测试通过
- [ ] Safari iOS 17 / Android Chrome 120+ 验收通过
- [ ] 文字在毛玻璃上 WCAG AA 对比度 ≥ 4.5:1
- [ ] 滚动列表项使用 virtual list，仅可视区毛玻璃

## 八、视觉示例（描述）

### 卡片悬浮态
```
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   ← 模糊渐变背景透出
│ ░░░ [Image] 标题 ░░░░░░░░░░ │
│ ░░░ 副文案     ░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────┘
   ↑ 半透明 + 模糊 + 内高光 + 柔阴影
```

### 模态弹窗
```
                  ┌───────┐
        ┌─────────┤ Close │
        │         └───────┘
        │  毛玻璃模态（强模糊+高透明度）
        │  ─────────────────────
        │  内容...
        │  ─────────────────────
        │  [取消]  [确认]
        └────────────────────────
   ↑ 背景额外加深 .scrim {bg:rgba(0,0,0,.4)}
```

## 九、Token Reference

详见 `02-design-tokens.md` 第 1.5 节。

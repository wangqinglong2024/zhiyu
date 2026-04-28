# 03 · Shadcn Glass 毛玻璃系统

## 一、定位

本项目全局使用毛玻璃。所有 shadcn/ui 组件、业务复合组件、后台工作台组件、游戏外壳组件都必须接入统一玻璃材质。毛玻璃必须具备透明层、backdrop blur、边缘高光、细边框、阴影、hover/press/focus/disabled 状态和降级方案。

## 二、材质层级

| 层级 | 类名 | 背景 | Blur | 用途 |
|---|---|---|---:|---|
| L0 | `.surface-atmosphere` / `.surface-wash` | 冷瓷釉 + 三点极光雾带＋微颗粒 | 80（装饰层） | 页面底、全局 Shell |
| L1 | `.zy-glass-subtle` | 轻玻璃 | 14 | Button secondary、Input small、Badge、Tab |
| L2 | `.zy-glass-panel` | 标准玻璃 + 双层内高光 | 24-28 | Card、Sidebar、Header、Table、主题/话题选择卡 |
| L3 | `.zy-glass-elevated` | 高亮玻璃 + 大阴影 | 36 | Dialog、Sheet、Popover、Toast、底部 TabBar |
| L4 | `.zy-glass-strong` | 高不透明玻璃 | 16 | 正文、句子、表格密集数据、表单 |
| L5 | `.zy-glass-ink` | 深色玻璃 | 28 | Cover、HUD、游戏外壳、图像上按钮 |
| L6 | `.seal-accent` | 朱砂渐变动作层 | 0 | 主 CTA、危险、小面积强调 |

同屏可见 backdrop blur 组件建议不超过 16 个；阅读/表格密集页使用 `.zy-glass-strong` 降低透明度。低端设备通过 `prefers-reduced-transparency` 或运行时性能检测将 blur 降为 0，但仍保留玻璃边框、阴影和高光。

## 二点五、Stitch 式交互参照

用户指定 `https://stitch.withgoogle.com/` 作为交互参考：按钮、卡片、输入框、分段控件、浮层和顶部/底部导航需要具备清晰的毛玻璃材质、边缘高光、按压缩放、hover 抬升与动态图层反馈。但知语不得照搬 Stitch 的紫蓝黑色调，必须使用现代东方玻璃体系，并以 shadcn/ui 输出可复用组件。

落地规则：
- 背景使用三点极光雾带（玉/雾紫/朱砂）加 80px blur 加 noise overlay，不使用离散彩色 blob、粒子、bokeh。
- 交互组件使用多层玻璃：`linear-gradient(180deg,var(--glass-highlight),transparent 50%) + var(--glass-panel)`，可见边缘 + 内顶高光 + rim 双重 inset border + ambient/key 双层阴影。
- IconButton 必须有 tooltip/aria-label，模式切换使用 segmented control，二元设置用 toggle/checkbox，数字设置用 slider/select/input。
- 卡片默认 14px 圆角；主题选择卡 / Hero / 底栏 Dock 20-28px；IconButton/Badge/胶囊按钮 full。
- 按压使用 `transform: scale(.96-.97)`，hover 抬起 1-3px 并走 shimmer sweep（`zy-shimmer` keyframe）。focus 使用 `box-shadow: var(--focus-ring)`。

## 三、CSS 参考

```css
.surface-wash, .surface-atmosphere {
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(ellipse 80% 50% at 12% -8%,  color-mix(in srgb, var(--brand-jade) 22%, transparent), transparent 60%),
    radial-gradient(ellipse 70% 50% at 92% 4%,   color-mix(in srgb, var(--brand-mist-violet) 20%, transparent), transparent 60%),
    radial-gradient(ellipse 90% 60% at 50% 110%, color-mix(in srgb, var(--brand-cinnabar) 14%, transparent), transparent 65%),
    linear-gradient(180deg, var(--surface-paper), var(--surface-paper-muted));
}
.surface-wash::before {
  content: '';
  position: fixed; inset: -20%; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 50% 40% at 20% 30%, color-mix(in srgb, var(--brand-jade) 26%, transparent), transparent 70%),
    radial-gradient(ellipse 45% 35% at 78% 22%, color-mix(in srgb, var(--brand-mist-violet) 22%, transparent), transparent 70%);
  filter: blur(80px) saturate(120%);
  animation: zy-aurora 26s var(--ease-brush) infinite alternate;
}
.surface-wash::after {
  /* 微颗粒叠加，提高玻璃质感 */
  content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background-image: radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 3px 3px; mix-blend-mode: overlay; opacity: .55;
}

.zy-glass-panel {
  background:
    linear-gradient(180deg, var(--glass-highlight), transparent 55%),
    var(--glass-panel);
  backdrop-filter: blur(24px) saturate(170%);
  border: 1px solid var(--line-glass);
  box-shadow:
    inset 0 1px 0 var(--glass-edge),
    inset 0 0 0 1px var(--glass-rim),
    var(--shadow-glass-md);
}

.zy-glass-elevated {
  background:
    linear-gradient(180deg, var(--glass-highlight), transparent 50%),
    var(--glass-elevated);
  backdrop-filter: blur(36px) saturate(180%);
  border: 1px solid var(--line-glass);
  box-shadow:
    inset 0 1px 0 var(--glass-edge),
    inset 0 0 0 1px var(--glass-rim),
    var(--shadow-glass-lg);
}

.zy-glass-ink {
  background: var(--glass-ink);
  backdrop-filter: blur(28px) saturate(150%);
  border: 1px solid var(--line-strong);
  color: #F4F6F7;
}

.seal-accent {
  background: linear-gradient(135deg, var(--brand-cinnabar-soft), var(--brand-cinnabar));
  color: #FFFAF6;
  box-shadow: var(--shadow-seal);
}
```

## 四、纹理规则

- 宣纸颗粒：使用 1-2KB 内联 CSS noise 或本地 tiny PNG，opacity 2-4%。
- 水墨雾带：使用 CSS radial/linear gradient，不使用彩色 blob、粒子背景。
- 窗棂线：仅做 1px 分隔或封面遮罩，不做大面积图案。
- 印章：只作为状态/类目/成就的小面积视觉锚点。

## 五、使用场景

| 场景 | 推荐层级 |
|---|---|
| App Header / TabBar | L2 |
| Discover 主题卡 | L2 + 真实封面/纹样 |
| 阅读页正文 | L4，玻璃强不透明保护可读性 |
| 文章 Cover 操作按钮 | L5 |
| 登录/注册 Modal | L3，移动端 L4 |
| 游戏 HUD | L5，高对比优先 |
| 后台表格容器 | L2/L4，密集内容降低透明度 |
| shadcn Button/Input/Select/Tabs | L1/L2，根据重要性切换 |

## 六、降级

- `prefers-reduced-transparency` 或低端设备：blur 降为 0，改为半透明实底。
- Safari/Android 性能不足：Header/TabBar 保留透明，列表卡片改实底。
- 打印、导出、截图卡：全部转实底，确保文本清楚。

## 七、验收

- [ ] 玻璃不会降低正文、拼音、翻译、表格文字对比度。
- [ ] 所有 shadcn/ui 基础组件和业务复合组件均使用 `zy-glass-*` 材质。
- [ ] 同屏 blur 数量符合预算，低端设备自动降级。
- [ ] 低端设备降级后布局不跳动。
- [ ] 页面仍能体现现代大气与东方内容气质。
- [ ] 按钮、卡片、输入框、分段控件的 hover/press/focus 状态具备明显毛玻璃反馈。
- [ ] 背景流光在正常模式动态运行，在 `prefers-reduced-motion` 下停止。
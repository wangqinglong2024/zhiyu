# 03 · Shadcn Glass 毛玻璃系统

## 一、定位

本项目全局使用毛玻璃。所有 shadcn/ui 组件、业务复合组件、后台工作台组件、游戏外壳组件都必须接入统一玻璃材质。毛玻璃必须具备透明层、backdrop blur、边缘高光、细边框、阴影、hover/press/focus/disabled 状态和降级方案。

## 二、材质层级

| 层级 | 类名 | 背景 | Blur | 用途 |
|---|---|---|---:|---|
| L0 | `.surface-atmosphere` | 低对比动态玻璃背景 | 0 | 页面底、全局 Shell |
| L1 | `.zy-glass-subtle` | 轻玻璃 | 8-12 | Button secondary、Input、Badge、Tab |
| L2 | `.zy-glass-panel` | 标准玻璃 | 14-18 | Card、Sidebar、Header、Table、List |
| L3 | `.zy-glass-elevated` | 高亮玻璃 + 大阴影 | 18-24 | Dialog、Sheet、Popover、Toast |
| L4 | `.zy-glass-strong` | 高不透明玻璃 | 8-12 | 正文、句子、表格密集数据、表单 |
| L5 | `.zy-glass-ink` | 深色玻璃 | 16-22 | Cover、HUD、游戏外壳、图像上按钮 |
| L6 | `.seal-accent` | 朱砂动作层 | 0-8 | 主 CTA、危险、小面积强调 |

同屏可见 backdrop blur 元素建议不超过 16 个；阅读/表格密集页允许使用 `.zy-glass-strong` 降低透明度。低端设备通过 `prefers-reduced-transparency` 或运行时性能检测将 blur 降为 0，但仍保留玻璃边框、阴影和高光。

## 二点五、Stitch 式交互参照

用户指定 `https://stitch.withgoogle.com/` 作为交互参考：按钮、卡片、输入框、分段控件、浮层和顶部/底部导航需要具备清晰的毛玻璃材质、边缘高光、按压缩放、hover 抬升与动态图层反馈。但知语不得照搬 Stitch 的紫蓝黑色调，必须使用现代东方玻璃体系，并以 shadcn/ui 输出可复用组件。

落地规则：
- 背景允许动态“流光/水墨雾带”，使用大面积柔和光带和 CSS animation，不使用离散彩色 blob、粒子、bokeh。
- 交互组件使用半透明玻璃、边缘高光、内阴影和 backdrop blur；正文、句子、表格密集内容使用 `.zy-glass-strong`，不是普通实底。
- IconButton 必须有 tooltip/aria-label，模式切换使用 segmented control，二元设置用 toggle/checkbox，数字设置用 slider/select/input。
- 卡片默认 8px 圆角；只有 Modal/BottomSheet/FAB 等浮层允许 12px 或 full。

## 三、CSS 参考

```css
.surface-paper {
  background: var(--surface-paper);
  color: var(--text-ink);
}

.surface-wash {
  position: relative;
  isolation: isolate;
  background:
    linear-gradient(120deg, rgba(111,159,141,.16), transparent 28%, rgba(174,191,204,.16) 58%, transparent 78%),
    radial-gradient(ellipse at 18% 8%, rgba(247,241,228,.24), transparent 34%),
    radial-gradient(ellipse at 82% 18%, rgba(111,159,141,.13), transparent 32%),
    linear-gradient(180deg, var(--surface-paper), var(--surface-paper-muted));
}

.surface-wash::before {
  content: '';
  position: fixed;
  inset: -22% -18%;
  pointer-events: none;
  background:
    linear-gradient(100deg, transparent 8%, rgba(255,248,236,.18) 24%, rgba(111,159,141,.20) 38%, transparent 56%),
    linear-gradient(280deg, transparent 16%, rgba(174,191,204,.18) 46%, rgba(182,64,50,.08) 60%, transparent 78%);
  filter: blur(32px) saturate(118%);
  animation: zy-ink-flow 18s var(--ease-brush) infinite alternate;
}

.zy-glass-panel {
  background: var(--glass-panel);
  backdrop-filter: blur(14px) saturate(118%);
  border: 1px solid var(--line-glass);
  box-shadow: inset 0 1px 0 var(--highlight-glass), var(--shadow-glass-md);
}

.zy-glass-elevated {
  background: var(--glass-elevated);
  backdrop-filter: blur(22px) saturate(125%);
  border: 1px solid var(--line-glass);
  box-shadow: inset 0 1px 0 var(--highlight-glass), var(--shadow-glass-lg);
}

.zy-glass-ink {
  background: rgba(31,36,33,.36);
  backdrop-filter: blur(16px) saturate(110%);
  border: 1px solid rgba(244,239,228,.18);
  color: #F4EFE4;
}

.seal-accent {
  background: var(--brand-cinnabar);
  color: #FFF8EC;
  box-shadow: 0 8px 20px rgba(182,64,50,.22);
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
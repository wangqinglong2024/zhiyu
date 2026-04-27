# 12 · 动效与微交互

## 一、动效原则

- 有目的：只服务反馈、导航和状态变化。
- 像水墨：轻、慢起快收、不过度弹跳。
- 不喧宾夺主：阅读、答题、后台表格中尽量减少动效。
- 可关闭：完整响应 `prefers-reduced-motion`。

## 二、时长

| 场景 | 时长 |
|---|---:|
| 按钮按下 | 80-100ms |
| hover / toggle | 150-180ms |
| Toast / popover | 180-240ms |
| Modal / BottomSheet | 220-280ms |
| 路由切换 | 220-300ms |
| 游戏反馈 | 80-400ms |

## 三、缓动

```css
:root {
  --ease-ink: cubic-bezier(.2,.8,.2,1);
  --ease-brush: cubic-bezier(.16,1,.3,1);
  --duration-fast: 100ms;
  --duration-base: 180ms;
  --duration-slow: 260ms;
}
```

## 四、组件动效

- Button：active scale 0.97；hover 只改变阴影/底色。
- Card：interactive hover translateY(-1px)，不做大幅漂浮。
- Modal：opacity + scale 0.98→1。
- BottomSheet：translateY + spring，拖拽跟手。
- Toast：从顶部淡入，退出淡出。
- Tabs：indicator 平滑移动。
- Skeleton：纸色 shimmer；减弱动效时静态。

## 五、路由动效

- Tab 切换：淡入 + 轻微横移。
- 详情 push：新页面从右进入；返回反向。
- 沉浸阅读/学习：使用 fade，避免晕动。
- 后台：默认无页面转场，只保留局部 loading。

## 六、特殊场景

- 课程完成：印章点亮、轻微纸屑/墨点，不做大烟花。
- 答对：celadon 边框、Check 图标、success 触觉。
- 答错：cinnabar 边框、轻微 shake、error 触觉。
- 游戏结束：分数滚动、错题摘要、分享图生成提示。

## 七、减弱动效

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

关闭视差、循环背景、翻牌、粒子和自动播放，仅保留必要状态切换。

## 八、性能预算

- 同屏动画 ≤ 5 个。
- 动画优先 transform/opacity。
- 禁止对大列表、表格行、正文逐项做入场动画。
- 游戏动效由 PixiJS 管理，低端设备减少粒子与后处理。

## 九、验收

- [ ] 减弱动效模式完整可用。
- [ ] 所有按钮、Modal、Toast、Tab 有一致反馈。
- [ ] 阅读、答题、后台无干扰性动画。
- [ ] 中端机滚动和游戏帧率达标。
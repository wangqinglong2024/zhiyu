# 13 · 可访问性

## 一、目标

- WCAG 2.1 AA。
- VoiceOver、TalkBack、NVDA 基础兼容。
- 应用端和后台除游戏画布外均 100% 键盘可操作。

## 二、对比度

| 元素 | 最低对比度 |
|---|---:|
| 正文 | 4.5:1 |
| 大字 | 3:1 |
| UI 控件/图形 | 3:1 |
| 焦点环 | 3:1 |

毛玻璃上的文字必须按最差背景验证；必要时改 paper 实底。

## 三、键盘与焦点

- 所有交互元素 Tab 可达。
- DOM 顺序符合视觉顺序。
- 焦点环使用 `brand-jade`，不可被 outline none 移除。
- Modal/Drawer/BottomSheet 必须 focus trap。
- 关闭后焦点回到触发元素。
- 提供“跳到主内容”链接。

## 四、语义与 ARIA

- 使用 `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`, `<a>`。
- 图标按钮必须有 `aria-label`。
- 当前路由/Tab 使用 `aria-current="page"`。
- Toast 和状态更新用 `aria-live`。
- 表单错误关联 `aria-describedby` 与 `aria-invalid`。

## 五、移动端

- 命中区：iOS 44×44，Android 48×48。
- 滑动/长按必须提供按钮替代。
- 不禁用浏览器缩放。
- fixed 元素不遮挡 safe-area。

## 六、文字可读性

- 用户字号：xs、sm、base、lg、xl。
- 正文行高 ≥ 1.5。
- 中文阅读行长 ≤ 24 字。
- 不使用难读仿古字体承载正文或表格。

## 七、色弱与声调

- 成功/错误/警告必须颜色 + 图标 + 文案。
- 声调支持颜色、数字、隐藏；色弱模式下增加形状或数字标记。
- 图表必须有 label 或 pattern，不只靠颜色。

## 八、音频与游戏

- 音频不自动播放，提供文字稿。
- 游戏提供字幕/文字提示、慢速模式、色弱模式、关闭闪烁。
- 桌面端游戏必须键盘可玩；屏幕阅读器可提供降级说明。

## 九、测试

- axe-core 本地检测。
- Lighthouse Accessibility 本地报告 ≥ 95。
- 手动：VoiceOver iOS、TalkBack Android、NVDA 后台关键页。
- 仅键盘走查注册、阅读、学习、游戏详情、后台列表/编辑。

## 十、验收

- [ ] WCAG AA 对比度通过。
- [ ] 图标按钮、表单、错误、Modal 全部 ARIA 正确。
- [ ] 字号和减弱动效偏好生效。
- [ ] 游戏可访问性降级策略明确。
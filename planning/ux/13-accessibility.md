# 13 · 可访问性（Accessibility · WCAG 2.1 AA）

## 一、目标合规

- WCAG 2.1 Level AA
- iOS / Android 原生辅助技术兼容
- 屏幕阅读器：VoiceOver / TalkBack / NVDA
- 键盘可达：100% 应用可操作

## 二、对比度

| 元素 | 最低对比度 |
|---|---|
| 正文文字 | 4.5:1 |
| 大字（≥18pt 或 14pt bold） | 3:1 |
| UI 控件 / 图形 | 3:1 |
| 焦点边框 | 3:1 |

### 2.1 验证
- 设计稿全部颜色对组合 → Stark / Contrast 检测
- 毛玻璃背景上文字：以最差背景计算（深图上浅毛玻璃）
- 暗模式独立验证

## 三、键盘导航

### 3.1 必备
- 所有可交互元素 Tab 可达
- 顺序逻辑（DOM 顺序）
- 焦点环可见 `ring-2 ring-rose-500`
- Esc 关闭模态
- Enter 触发主操作
- Space 触发按钮 / 切换

### 3.2 自定义
- 方向键导航列表 / 网格 / Tab
- 1-9 数字快捷
- 跳过链接（"跳到主内容"）

### 3.3 焦点陷阱
- Modal 打开时 focus trap
- 关闭后回到触发元素

## 四、屏幕阅读器

### 4.1 语义化 HTML
- 用语义标签：`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<article>`, `<section>`, `<button>`, `<a>`
- 避免 `<div onclick>`
- 标题层级正确（h1 → h2 → h3）

### 4.2 ARIA 属性
- `aria-label` 仅图标按钮
- `aria-labelledby` 复杂控件
- `aria-describedby` 帮助 / 错误文字
- `aria-live="polite"` Toast / 状态更新
- `aria-live="assertive"` 错误
- `aria-current="page"` Tab 当前
- `aria-expanded` 折叠
- `aria-modal` 模态
- `role` 仅必要

### 4.3 表单
- `<label>` 关联 `<input>` (for/id 或包裹)
- 错误关联 `aria-describedby`
- `aria-invalid="true"` 出错时
- `aria-required="true"` 必填

### 4.4 图片
- `<img alt="">` 装饰图空 alt
- 内容图 alt 描述含义
- Cover 图 alt = 标题
- 图标按钮 aria-label

## 五、移动端辅助

### 5.1 命中区
- 最小 44×44 dp（iOS）/ 48×48 dp（Android）
- 视觉小按钮也保证 hit area

### 5.2 手势替代
- 滑动 → 提供按钮替代
- 长按 → 提供菜单按钮

### 5.3 缩放
- 不禁用浏览器缩放
- `<meta viewport>` 不含 `user-scalable=no`

## 六、字号与可读性

### 6.1 用户调节
- 设置内字号选项：xs / sm / base / lg / xl
- 系统字号跟随：iOS Dynamic Type / Android Font Scale

### 6.2 行高
- 正文 ≥ 1.5
- 段落间距 ≥ 1.5x 字号

### 6.3 行长
- 中文 ≤ 20 字
- 英文 ≤ 70 字符

### 6.4 字体
- 中文用 Source Han Sans (思源黑体)
- 拼音用 Noto Sans
- 不用过于装饰字体

## 七、色彩与色盲

### 7.1 不仅靠颜色
- 错误：红色 + ✕ 图标 + 文字
- 成功：绿色 + ✓ 图标 + 文字
- 警告：橙色 + ⚠ 图标 + 文字

### 7.2 声调标识
- 不仅彩色：可切换 数字 / 颜色 / 隐藏
- 色弱模式：对比明显 + 形状

### 7.3 图表
- 不仅颜色区分：增加 pattern / label
- 图例必备

## 八、动效

### 8.1 减弱动效
- `prefers-reduced-motion` 响应
- 关键状态过渡保留（轻微 fade）
- 无视差 / 自动播放

### 8.2 闪烁
- 闪烁频率 < 3 Hz
- 不大面积闪烁

## 九、音频与视频

### 9.1 音频
- 所有教学音频含文字稿
- 自动播放禁止
- 音量可调

### 9.2 视频（v1.5）
- 字幕 .vtt
- 控制面板可键盘操作

## 十、表单

### 10.1 错误提示
- 实时 + 提交后
- 关联字段 aria-describedby
- 错误总览 top（提交失败）
- focus 跳到第一个错误字段

### 10.2 帮助文字
- 输入要求 提前显示
- 不藏在 placeholder

### 10.3 自动填充
- name 标准 (autocomplete attr)
- email / current-password / new-password

## 十一、模态 / 弹窗

- focus trap
- Esc 关闭
- aria-modal="true"
- 关闭后焦点回到触发元素
- aria-labelledby 标题

## 十二、Tab / 路由

- 当前 Tab 用 `aria-current="page"`
- 路由切换公告 `aria-live`
- 标题更新 `<title>`

## 十三、游戏可访问性

### 13.1 必备
- 字幕 / 文字提示
- 慢速模式 (×0.5 ×0.75)
- 关闭闪烁
- 色弱模式

### 13.2 退而求其次
- 桌面键盘游戏：必须键盘可玩
- 触屏游戏：屏幕阅读器降级提示"游戏内容，请佩戴耳机听语音指令"

## 十四、文字 / 翻译

### 14.1 多语言
- 5 种语言完整 i18n
- 不混用语言（避免读屏混淆）
- `lang` attr 正确

### 14.2 RTL（v2）
- 暂不支持
- 预留 RTL 布局

## 十五、测试

### 15.1 自动化
- axe-core CI 集成
- Lighthouse Accessibility ≥ 95

### 15.2 手动
- VoiceOver iOS：所有页面走查
- TalkBack Android：所有页面走查
- NVDA Windows：后台所有页面
- 仅键盘 Tab 走查

### 15.3 真实用户
- v2：邀请视障用户测试

## 十六、检查清单

- [ ] WCAG 2.1 AA 全部通过
- [ ] Lighthouse a11y ≥ 95
- [ ] 所有页面键盘可操作
- [ ] 所有图标按钮 aria-label
- [ ] 所有表单 label 关联
- [ ] 所有错误 aria-describedby
- [ ] 焦点环可见
- [ ] 色弱模式可用
- [ ] 减弱动效模式可用
- [ ] VoiceOver / TalkBack 测试通过
- [ ] 字号可调 5 档
- [ ] 安全区不遮元素

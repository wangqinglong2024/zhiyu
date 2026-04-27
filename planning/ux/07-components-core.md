# 07 · 核心组件库

> 共用组件位于 `system/packages/ui`，应用端与后台共享。组件只消费 token，不写业务模块逻辑。

## 一、Button

| variant | 视觉 | 用途 |
|---|---|---|
| `primary` | `seal-accent` 朱砂实底 | 主操作 |
| `secondary` | `.glass-porcelain` + jade 文本 | 次级操作 |
| `tertiary` | 无背景文本 | 取消/跳过 |
| `danger` | cinnabar 实底或描边 | 危险操作 |
| `ghost` | hover 低透明底 | 表格/列表操作 |
| `ink` | `.glass-ink` | Cover/HUD 上操作 |

尺寸：xs 28、sm 36、md 44、lg 52、xl 60。移动端命中区最低 44×44。

## 二、Input

- 类型：text、email、password、number、search、textarea、pin、pinyin。
- 边框：`line-hair`；focus：`brand-jade` ring。
- 错误：cinnabar + 图标 + 文案，关联 `aria-describedby`。
- `<PasswordInput>`、`<PinInput>`、`<PinyinInput>`、`<PhoneInput>`、`<SearchInput>` 为必备复合组件。

## 三、Card

| variant | 用途 |
|---|---|
| `paper` | 阅读、学习内容，实底保护可读性 |
| `porcelain` | 类目卡、普通信息卡 |
| `outlined` | 后台分区、轻量容器 |
| `interactive` | 可点击卡片，hover 只轻微抬起 |
| `ink` | Cover/HUD 深色浮层 |

卡片默认圆角 8px，浮层可 12px。页面分区不当作卡片套卡片。

## 四、Modal / Drawer / BottomSheet

- Desktop modal：`.glass-elevated`，最大宽度按内容定义。
- Mobile modal 默认转 BottomSheet。
- 必须支持 ESC、遮罩关闭策略、focus trap、关闭后焦点回到触发元素。
- 危险确认使用实底 paper，避免透明背景干扰阅读。

## 五、Tabs / Segmented Control

- 内容分类用 underline。
- 模式切换用 segmented。
- 移动端横向滚动时两端显示淡出遮罩。
- 激活态使用 jade 或 cinnabar 小印点，避免大面积色块。

## 六、List / Table

- `<List>` 用于应用端设置、收藏、笔记。
- `<DataTable>` 用于后台，支持筛选、排序、分页、批量操作、密度切换。
- 行 hover 使用 `paper-muted` 或 `porcelain`，不使用彩色高饱和底。

## 七、Badge / Tag / Chip

- 状态 badge：draft、reviewing、published、archived、blocked。
- 学习 tag：HSK、难度、预计时长、类目。
- 筛选 chip 支持删除、键盘操作与计数。

## 八、Tooltip / Popover

- 图标按钮必须有 tooltip。
- Tooltip 延迟 500ms，移动端长按。
- Popover 可含表单/菜单，但必须 trap 或正确返回焦点。

## 九、AudioPlayer

- 句子级与全文音频共用。
- 控件：播放、进度、时间、语速、循环。
- 播放中句子高亮使用 jade 左边线或瓷色背景，不改变文本布局。

## 十、PinyinText / SentenceCard

PinyinText：拼音字号 = 汉字 0.6，声调支持颜色/数字/隐藏三模式。

SentenceCard：中文、拼音、母语翻译、播放、笔记、收藏、加入生词本。长按菜单必须有按钮替代。

## 十一、组件交付

- Button、Input、Card、Modal、Tabs、List、DataTable、Avatar、Badge、Tag、Tooltip、Popover、AudioPlayer、PinyinText、SentenceCard、IconButton。
- 每个组件含 stories、a11y smoke、键盘交互测试、明/暗主题截图。

## 十二、验收

- [ ] 所有组件使用 token 和 CSS variables。
- [ ] 图标按钮有 aria-label/tooltip。
- [ ] 文本在 360px 宽度不溢出。
- [ ] 后台表格支持键盘与批量操作。
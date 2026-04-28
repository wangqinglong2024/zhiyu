# 07 · 核心组件库

> 共用组件位于 `system/packages/ui`，应用端与后台共享。组件以 shadcn/ui 为基础生成或封装，只消费 token，不写业务模块逻辑。所有组件必须有毛玻璃材质变体；业务侧禁止绕过组件库自写基础控件。

## 一、Button

| variant | 视觉 | 用途 |
|---|---|---|
| `primary` | 朱砂玻璃，保留高不透明度与高光边 | 主操作 |
| `secondary` | `.zy-glass-subtle` + jade 文本 | 次级操作 |
| `tertiary` | 透明玻璃文本按钮，hover 出现玻璃底 | 取消/跳过 |
| `danger` | cinnabar 玻璃或描边玻璃 | 危险操作 |
| `ghost` | `.zy-glass-subtle` hover | 表格/列表操作 |
| `ink` | `.zy-glass-ink` | Cover/HUD 上操作 |

尺寸：xs 28、sm 36、md 44、lg 52、xl 60。移动端命中区最低 44×44。

交互必须参考 Stitch 式质感：按钮带半透明玻璃、高光边、hover 轻抬、active scale 0.97、focus ring。主按钮也必须是玻璃按钮，但不允许透明到对比不足。

## 二、Input

- 类型：text、email、password、number、search、textarea、pin、pinyin。
- 背景：默认 `.zy-glass-strong`，搜索/轻量输入可用 `.zy-glass-subtle`。
- 边框：`line-glass`；focus：`brand-jade` ring。
- 错误：cinnabar + 图标 + 文案，关联 `aria-describedby`。
- `<PasswordInput>`、`<PinInput>`、`<PinyinInput>`、`<PhoneInput>`、`<SearchInput>` 为必备复合组件。

## 三、Card

| variant | 用途 |
|---|---|
| `paper` | 阅读、学习内容，使用 `.zy-glass-strong` 保护可读性 |
| `porcelain` | 主题卡、普通信息卡，使用 `.zy-glass-panel` |
| `outlined` | 后台分区、轻量容器，玻璃边框 |
| `interactive` | 可点击卡片，hover 只轻微抬起 |
| `ink` | Cover/HUD 深色玻璃浮层 |

卡片默认圆角 8px，浮层可 12px。页面分区不当作卡片套卡片。

Interactive card 必须具备可感知点击态：hover 只抬升 1px、边框转 jade/celadon、阴影加深。Discover 类目卡可叠加本地纹样，但不得只靠颜色表示类别。

## 四、Modal / Drawer / BottomSheet

- Desktop modal：`.zy-glass-elevated`，最大宽度按内容定义。
- Mobile modal 默认转 BottomSheet。
- 必须支持 ESC、遮罩关闭策略、focus trap、关闭后焦点回到触发元素。
- 危险确认使用 `.zy-glass-strong`，避免透明背景干扰阅读。

## 五、Tabs / Segmented Control

- 内容分类用 underline。
- 模式切换用 segmented。
- 移动端横向滚动时两端显示淡出遮罩。
- 激活态使用 jade 或 cinnabar 小印点，避免大面积色块。

## 六、List / Table

- `<List>` 用于应用端设置、收藏、笔记。
- `<DataTable>` 用于后台，支持筛选、排序、分页、批量操作、密度切换。
- DataTable 表头、工具栏、分页器、行 hover 均使用玻璃层；单元格密集文本使用高不透明玻璃。
- 行 hover 使用 `glass-subtle` 或 `porcelain`，不使用彩色高饱和底。

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

SentenceCard 必须跟随用户偏好实时变化：`pinyin_mode` 控制拼音字母 / 数字声调 / 隐藏，`translation_mode` 控制实时 / 折叠 / 隐藏，`font_size` 控制句子字号，`tts_speed` 控制播放速度。句子点击播放和长按菜单之外，必须保留显式按钮以保证键盘与触屏均可操作。

## 十一、组件交付

- Button、Input、Card、Dialog、Sheet、Drawer、Tabs、SegmentedControl、List、DataTable、Avatar、Badge、Tag、Tooltip、Popover、DropdownMenu、Command、Toast、AudioPlayer、PinyinText、SentenceCard、IconButton。
- 每个组件含 stories、a11y smoke、键盘交互测试、明/暗主题截图。

## 十二、验收

- [ ] 所有组件使用 token 和 CSS variables。
- [ ] 所有组件基于 shadcn/ui 或在 `@zhiyu/ui` 中封装，不允许业务散写基础控件。
- [ ] 所有组件都有 `zy-glass-*` 材质、hover、press、focus、disabled、loading 状态。
- [ ] 图标按钮有 aria-label/tooltip。
- [ ] 文本在 360px 宽度不溢出。
- [ ] 后台表格支持键盘与批量操作。
- [ ] 所有模式切换使用 segmented/select/toggle，不用无语义的文本胶囊。
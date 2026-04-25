# 07 · 核心组件库（Core Components）

> 共用组件库 `packages/ui`，应用端 + 后台共享。

## 一、Button

### 1.1 变体
| variant | 视觉 | 用途 |
|---|---|---|
| `primary` | 实色 rose-600 + 白字 + 圆角胶囊 | 主 CTA |
| `secondary` | 毛玻璃 + 主色字 | 次要操作 |
| `tertiary` | 文字按钮无背景 | 取消 / 跳过 |
| `danger` | 实色 red-600 | 危险操作 |
| `ghost` | hover 显示底色 | 列表项操作 |
| `glass` | 强毛玻璃 | 浮在 Cover 图上 |

### 1.2 尺寸
| size | 高度 | padding | 字号 |
|---|---|---|---|
| `xs` | 28 | 8 12 | 12 |
| `sm` | 36 | 12 16 | 13 |
| `md` | 44 | 12 20 | 14 |
| `lg` | 52 | 16 24 | 16 |
| `xl` | 60 | 20 32 | 18 |

### 1.3 状态
- default / hover / active / focus / disabled / loading
- loading：spinner 替换图标，禁用点击
- focus：ring `ring-2 ring-rose-500/40`

### 1.4 图标
- 左图标 `iconLeading` 或右图标 `iconTrailing`
- 仅图标按钮 `iconOnly` （正方形，无文字）

### 1.5 Hit Target
最小命中区 44×44 dp（移动），即使按钮视觉小

## 二、Input

### 2.1 类型
- text / email / password / number / search / textarea / pin / pinyin

### 2.2 视觉
```
┌──────────────────────────────┐
│ Label                         │
│ ┌─────────────────────────┐  │
│ │ 占位符 / 内容            │  │
│ └─────────────────────────┘  │
│ ↑ 帮助文字 / 错误提示          │
└──────────────────────────────┘
```
- 输入框：`bg-white/60 dark:bg-neutral-900/40` + border + 圆角 sm
- 高度 44 (sm) / 48 (md)
- focus：边框 rose-500 + ring

### 2.3 子组件
- `<PasswordInput>` 含眼睛切换
- `<PinInput>` 6 位 OTP
- `<PinyinInput>` 拼音输入（数字声调切换）
- `<PhoneInput>` 国际区号
- `<SearchInput>` 内置搜索图标 + 清空 X

### 2.4 表单
- React Hook Form + Zod
- 字段离焦即验证
- 实时显示错误（红字 micro，下方）
- 提交禁用直到全有效

## 三、Card

### 3.1 变体
| variant | 用法 |
|---|---|
| `glass` | 默认（毛玻璃） |
| `solid` | 后台实色卡 |
| `outlined` | 边框无背景 |
| `interactive` | 可点击 + hover 浮起 |

### 3.2 子组件
```tsx
<Card variant="glass">
  <Card.Cover src="..." aspect="16/9" />
  <Card.Header>
    <Card.Title>标题</Card.Title>
    <Card.Subtitle>副标题</Card.Subtitle>
  </Card.Header>
  <Card.Body>内容</Card.Body>
  <Card.Footer>
    <Button>操作</Button>
  </Card.Footer>
</Card>
```

### 3.3 尺寸
- xs: padding 12 / 圆角 md
- sm: padding 16 / 圆角 lg
- md: padding 20 / 圆角 lg
- lg: padding 24 / 圆角 xl

## 四、Modal / Dialog

### 4.1 类型
- `Modal`：标准居中
- `Drawer`：从侧边滑出
- `BottomSheet`：移动端从底部
- `Confirm`：简短确认对话框

### 4.2 视觉
- 遮罩：`bg-black/40 backdrop-blur-sm`
- 对话框：`.glass-elevated` + 圆角 2xl
- 关闭按钮：右上角 X
- ESC 关闭
- 点击遮罩关闭（可禁用）

### 4.3 移动端
- Modal 自动转 BottomSheet
- 拖拽手柄
- 滑下关闭

## 五、Tabs

### 5.1 变体
| variant | 用法 |
|---|---|
| `pills` | 圆角胶囊（移动端横滚） |
| `underline` | 下划线（后台） |
| `segmented` | 分段控件（iOS 风格） |

### 5.2 行为
- 切换动画：横向滑动 200ms
- Indicator 移动 spring 缓动
- 滚动 sticky（顶部）

## 六、List

### 6.1 类型
- `<List>` 通用列表
- `<List.Item>` 带 leading + trailing
- `<List.Section>` 分组带标题
- `<VirtualList>` 虚拟滚动（条目 > 50）

### 6.2 视觉
```
┌────────────────────────────────────┐
│ 🎵 标题             >              │ 44px
│    副文                            │
├────────────────────────────────────┤
│ 🎵 标题             >              │
└────────────────────────────────────┘
```
- 分隔线：`divider` 1px
- hover：bg-rose-50/30 dark:bg-rose-900/20

## 七、Avatar

### 7.1 尺寸
xs 24 / sm 32 / md 40 / lg 48 / xl 64 / 2xl 96

### 7.2 状态
- 在线圆点（右下，绿色）
- 角标（数字 / dot）
- 默认占位：用户名首字母（背景按用户 ID hash 取色）

## 八、Badge

### 8.1 类型
| type | 视觉 |
|---|---|
| `dot` | 6×6 圆点 |
| `count` | 数字 1-99+ |
| `text` | 短文（New / Beta） |
| `level` | 用户等级条 |

### 8.2 颜色
- default neutral
- primary rose
- success green
- warning amber
- danger red
- info sky

## 九、Tag / Chip

### 9.1 类型
- 静态标签：HSK 1-9 / 类型标签
- 可选 chip：筛选条件
- 可删除 chip：搜索词

## 十、Tooltip

### 10.1 触发
- 桌面：hover 500ms 延迟
- 移动：长按 500ms

### 10.2 视觉
- 毛玻璃 `.glass-tooltip` + 三角形指针
- 自动定位（top / bottom / left / right）

## 十一、Popover

类似 tooltip 但可含按钮 / 表单 / 复杂内容。

## 十二、Switch / Checkbox / Radio

### 12.1 Switch
- 32×20 胶囊
- 开 → rose-600 + 白圆点
- 关 → text-tertiary + 白圆点

### 12.2 Checkbox
- 20×20 圆角 sm
- 选中 → rose-600 + 白勾

### 12.3 Radio
- 20×20 圆形
- 选中 → 内圆 rose-600

## 十三、Slider

### 13.1 用途
- 学习进度
- 音频进度
- 字号调节
- 阅读偏好

### 13.2 视觉
- 轨道：高 4px，圆角 full
- 已填充：rose 渐变
- 拇指：18×18 圆形 + 白边 + 阴影
- 标注：数值显示在拇指上方

## 十四、Progress

### 14.1 线性
- 高度 4px / 6px / 8px
- 圆角 full
- 动画填充

### 14.2 圆形
- 28 / 40 / 64 / 96 直径
- 中心显示百分比 / 图标

### 14.3 阶梯（Step Progress）
- 横向，节点 + 连线
- 当前节点高亮

## 十五、Empty State

```
┌─────────────────────────┐
│        [插画]            │
│                         │
│      没有内容             │
│   引导文字 / 按钮         │
└─────────────────────────┘
```
- 插画：100×100 SVG
- 文字 + CTA

## 十六、Skeleton

- 灰色矩形（亮）/ 深灰矩形（暗）
- shimmer 动画 1.5s 循环
- 模拟真实内容尺寸（卡片 / 头像 / 文字行）

## 十七、AudioPlayer (DC/CR/NV 共用)

### 17.1 视觉
```
┌─────────────────────────────────────┐
│ [▶/⏸] [─────●──────] 0:12 / 1:23 [⚙] │
└─────────────────────────────────────┘
```
- 播放/暂停按钮（左）
- 进度条（中）
- 时间（右）
- 设置（语速 0.5-1.5x / 音色 / 循环）

### 17.2 句子级播放
- 点击句子 → 播放该句
- 播放中句子高亮 + 进度边框

## 十八、PinyinTextRenderer

### 18.1 视觉
```
   xué       xí
   学        习
```
- 拼音上标，汉字下方
- 字号比 2:3
- 声调用颜色 / 数字 / 隐藏 三模式

### 18.2 props
```tsx
<PinyinText
  zh="学习"
  pinyin="xué xí"
  toneMode="color" | "number" | "none"
  size="base" | "lg" | "xl"
/>
```

## 十九、SentenceCard (DC/CR/NV 复用)

### 19.1 结构
```
┌────────────────────────────────────┐
│ 1.  晨光里的咖啡香气弥漫了整条街道。  │
│     chénguāng lǐ de kāfēi xiāngqì… │
│     (越南文翻译)                    │
│ ─────────────────────────────────  │
│ [▶ 播放]  [📝 笔记]  [⭐ 收藏]      │
└────────────────────────────────────┘
```

### 19.2 长按菜单
- 长按句子 → 弹出菜单：
  - 翻译
  - 单字解析
  - 加入生词本
  - 朗读
  - 分享

## 二十、IconButton

- 仅图标，正方形
- 尺寸：32 / 36 / 44 / 52
- 形状：rounded-full / rounded-md
- hover bg + scale 1.05

## 二十一、Divider

- 水平 / 垂直
- 实线 / 虚线
- 含文字（中间分隔）：`──── 或者 ────`

## 二十二、Breadcrumb

```
首页 > 课程 > 日常 > 第3阶段
```
- 分隔符：`>` 或 `/`
- 当前页不可点（text-tertiary）

## 二十三、Component Library 交付清单

| 组件 | 文件 |
|---|---|
| Button | `packages/ui/src/Button.tsx` |
| Input | `packages/ui/src/Input.tsx` |
| Card | `packages/ui/src/Card.tsx` |
| Modal | `packages/ui/src/Modal.tsx` |
| Tabs | `packages/ui/src/Tabs.tsx` |
| List | `packages/ui/src/List.tsx` |
| Avatar | `packages/ui/src/Avatar.tsx` |
| Badge | `packages/ui/src/Badge.tsx` |
| Tag | `packages/ui/src/Tag.tsx` |
| Tooltip | `packages/ui/src/Tooltip.tsx` |
| Switch / Checkbox / Radio | `packages/ui/src/Switch.tsx` |
| Slider | `packages/ui/src/Slider.tsx` |
| Progress | `packages/ui/src/Progress.tsx` |
| Skeleton | `packages/ui/src/Skeleton.tsx` |
| AudioPlayer | `packages/ui/src/AudioPlayer.tsx` |
| PinyinText | `packages/ui/src/PinyinText.tsx` |
| SentenceCard | `packages/ui/src/SentenceCard.tsx` |

每个组件含 `.stories.tsx` (Storybook) + `.test.tsx` (Vitest)。

## 二十四、检查清单

- [ ] 全部组件支持 ref forward
- [ ] 全部组件支持 className 合并
- [ ] 全部组件可用 dark / light 切换无破坏
- [ ] 全部组件键盘可达
- [ ] 全部组件 Storybook 可见
- [ ] 全部组件 a11y label 完整

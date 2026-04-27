# 05 · 布局与响应式

## 一、布局理念

知语布局参考“书页章法”：内容有清晰起承转合，重要信息留白，工具操作贴近手边。应用端偏沉浸，后台偏密度。

## 二、断点

| Token | 宽度 | 用途 |
|---|---:|---|
| `xs` | 360 | 小屏手机 |
| `sm` | 390 | 主流手机 |
| `md` | 768 | 平板/窄桌面 |
| `lg` | 1024 | 后台桌面 |
| `xl` | 1280 | 宽屏后台 |
| `2xl` | 1536 | 数据大屏/宽表格 |

## 三、应用端 PWA

- Mobile first，主内容宽度 100%。
- 桌面浏览器中应用端主栏最大 768px，居中显示，两侧为 `surface-wash`。
- TabBar 固定底部，含 safe-area；沉浸阅读、学习节、游戏画布隐藏。
- 阅读正文最大行长：中文 20-24 字，英文/拉丁 60-70 字符。
- 学习句子卡必须稳定高度边界，播放/收藏/笔记状态不得导致布局跳动。

## 四、后台布局

```
┌──────────────┬──────────────────────────────────┐
│ Sidebar      │ TopBar + Breadcrumb              │
│              ├──────────────────────────────────┤
│              │ FilterBar                        │
│              ├──────────────────────────────────┤
│              │ Table / Editor / Workbench       │
└──────────────┴──────────────────────────────────┘
```

- Sidebar 256px，可折叠到 72px。
- TopBar 56px，sticky。
- 表格页优先占满宽度，不使用营销式大卡片。
- 编辑器可双栏或三栏，字段区与预览区保持可拖拽宽度。
- 移动端后台仅保证基础可用：Sidebar 转抽屉，表格转卡片列表或横滚。

## 五、版式 token

| 场景 | Padding | Gap |
|---|---:|---:|
| App 页面 | 16/20 | 16 |
| App 阅读 | 20/24 | 20 |
| App 沉浸学习 | 16 | 12 |
| Admin 页面 | 24 | 16 |
| Admin 表格工具栏 | 12/16 | 12 |
| Modal | 20/24 | 16 |

## 六、页面结构

应用端：
- Header
- Main content
- Optional sticky action
- TabBar

后台：
- Sidebar
- TopBar + Breadcrumb
- Page title + primary action
- Filter/Search
- Content region
- Pagination / batch action

## 七、固定格式控件

- 游戏画布：设计基准 1280×720，等比缩放。
- 类目网格：手机 3 列，平板 4 列，桌面应用壳 4 列。
- 图标按钮：固定 44×44 命中区。
- 进度条、Tab、计数器、HUD 必须定义 min/max，不因文案改变尺寸。

## 八、安全区

- 所有 fixed 元素使用 `env(safe-area-inset-*)`。
- BottomSheet 底部 padding = `max(16px, safe-area-inset-bottom)`。
- 横屏游戏左右 padding = `max(16px, safe-area-inset-left/right)`。

## 九、验收

- [ ] 360px、390px、768px、1024px、1280px 均无重叠与截断。
- [ ] 按钮/Tab/表格操作命中区达标。
- [ ] 后台列表、筛选、分页在桌面高效可扫。
- [ ] 应用端桌面两侧背景是低调水墨雾带，不是彩色渐变块。
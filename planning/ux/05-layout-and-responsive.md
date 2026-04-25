# 05 · 布局与响应式（Layout & Responsive）

## 一、断点（Breakpoints）

| 名称 | 宽度 | 设备 | 主要场景 |
|---|---|---|---|
| `xs` | 320-639 | iPhone SE / 小屏 Android | 移动竖屏（应用主战场） |
| `sm` | 640-767 | 大屏手机横屏 | 移动横屏（游戏） |
| `md` | 768-1023 | 平板竖屏 | 平板（应用） |
| `lg` | 1024-1279 | 平板横 / 笔电 | 后台 / 桌面应用 |
| `xl` | 1280-1535 | 标准桌面 | 后台主战场 |
| `2xl` | ≥ 1536 | 大屏 | 后台宽屏增强（侧栏 + 详情双栏） |

**移动优先**：所有样式 mobile-first 写法，向上加 `sm:` `md:` `lg:` 等修饰符。

## 二、应用端布局（PWA）

### 2.1 全局结构
```
┌─────────────────────────────┐
│ Safe Area Top                │ env(safe-area-inset-top)
├─────────────────────────────┤
│ [Header（可选）56px]          │ sticky
├─────────────────────────────┤
│                             │
│       内容滚动区              │
│       (px-4 / sm:px-6)      │
│                             │
├─────────────────────────────┤
│ TabBar 64px (毛玻璃)          │ fixed bottom
├─────────────────────────────┤
│ Safe Area Bottom             │ env(safe-area-inset-bottom)
└─────────────────────────────┘
```

### 2.2 内容区限宽
- 移动 (xs - md)：100% 宽
- 桌面 (lg+)：内容居中限宽 `max-w-screen-md (768px)`，两侧空白显示 MeshGradient
- 极宽 (2xl)：保持 768px 居中（PWA 不为桌面用户增宽，保持沉浸）

### 2.3 通用 padding
```css
.page-container {
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  padding-top: 12px;
  padding-bottom: calc(64px + env(safe-area-inset-bottom) + 16px);
  /* 64 = TabBar 高，确保最后内容不被遮 */
}
```

## 三、后台布局（Web Admin）

### 3.1 全局结构（lg+ 默认）
```
┌──────────┬──────────────────────────────┐
│          │ TopBar 56px                   │
│          ├──────────────────────────────┤
│ Sidebar  │                              │
│ 240px    │     主内容区                   │
│ (毛玻璃) │     padding: 24px             │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

### 3.2 折叠 Sidebar (md - lg)
```
┌────┬────────────────────────────────────┐
│ 64 │ TopBar                              │
├────┼────────────────────────────────────┤
│ I  │                                    │
│ I  │                                    │
│ I  │     主内容区                         │
│ I  │                                    │
└────┴────────────────────────────────────┘
```
仅显示图标，hover 弹出文字。

### 3.3 移动端后台（< md）
```
┌────────────────────────────────────────┐
│ TopBar [≡] [Logo] [User]                │
├────────────────────────────────────────┤
│                                        │
│       主内容（单栏）                     │
│                                        │
└────────────────────────────────────────┘
```
点击 [≡] 抽屉式弹出 Sidebar。

## 四、栅格系统（Grid）

### 4.1 应用端
- 12 列栅格，gutter 16px
- 移动 4 列基础（每列 78px @ 375 屏）
- 平板 8 列
- 桌面 12 列

### 4.2 卡片网格
| 屏幕 | 列数 | gap | 用途 |
|---|---|---|---|
| xs | 1 | 12 | 全宽列表 |
| sm | 2 | 16 | 双列卡片（DC 文章、NV 小说） |
| md | 3 | 16 | 三列（CR 课程） |
| lg | 4 | 20 | 四列（GM 游戏） |

### 4.3 后台栅格
- 12 列固定
- 表格全宽
- 表单：单列 (xs), 双列 (lg+)

## 五、安全区与刘海屏

### 5.1 SafeArea CSS
```css
:root {
  --safe-top:    env(safe-area-inset-top, 0);
  --safe-right:  env(safe-area-inset-right, 0);
  --safe-bottom: env(safe-area-inset-bottom, 0);
  --safe-left:   env(safe-area-inset-left, 0);
}
.safe-pt { padding-top: var(--safe-top); }
.safe-pb { padding-bottom: var(--safe-bottom); }
.safe-px { padding-left: var(--safe-left); padding-right: var(--safe-right); }
```

### 5.2 关键应用点
- TabBar：`padding-bottom: env(safe-area-inset-bottom)`
- Header：`padding-top: env(safe-area-inset-top)`
- 横屏游戏：左右 safe-area 避让（iPhone 横屏刘海在左/右）

### 5.3 viewport meta
```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
```

## 六、横竖屏处理

### 6.1 应用端默认竖屏
所有应用屏（DC / CR / NV / 个人中心）默认竖屏布局。
- 横屏时不变（因为内容主要垂直滚动）
- 不强制锁定，但内容布局以竖屏优化

### 6.2 游戏强制横屏
点击游戏卡 → 检测当前方向：
- 已横屏 → 直接进入游戏画布
- 竖屏 → 显示 `OrientationMask`（详见 13）

### 6.3 后台横屏优先
后台默认桌面，移动端访问亦适配。

## 七、滚动行为

### 7.1 主滚动区
应用端：`<main>` 区滚动，`<header>` `<TabBar>` fixed 不动。
后台：主内容区独立滚动，Sidebar 不动。

### 7.2 sticky 元素
- Header（应用端）：滚动 > 100px 时增加阴影
- 章节列表锚点：sticky top-0 显示当前章节
- 后台表格表头：sticky

### 7.3 下拉刷新（移动）
仅在列表页（DC 类目 / CR 课程 / NV 小说 / GM 游戏）支持：
- 下拉 ≥ 80px 触发 → 显示弹簧 spinner
- 完成后 toast 显示"已更新"

### 7.4 无限滚动
- 文章列表 / 小说列表：触底加载下一页
- 页码 = 20 / 页
- 加载中显示 3 个骨架卡片

## 八、间距密度

| 密度 | 应用 | 后台 |
|---|---|---|
| 卡片间距 | 16px | 12px |
| 卡片内 padding | 16px | 12-16px |
| 列表项间距 | 8px | 0px (紧贴 + divider) |
| 表单字段间距 | 16-20px | 12-16px |
| 段落间距 | 16-24px | 12-16px |
| 区段间距 | 32-48px | 24px |

## 九、典型页面骨架

### 9.1 应用端：列表页
```
[Header 56px - sticky 含搜索 / 筛选]
[Tab 切换 44px 可选]
[骨架卡片 × N - virtual scroll]
[底部 TabBar]
```

### 9.2 应用端：详情页
```
[Header 56px - 含返回 / 收藏 / 分享]
[Cover 16:9 图]
[标题 + 元信息]
[正文 - 句子卡片列表]
[底部固定 CTA：开始 / 继续 / 复习]
[底部 TabBar]
```

### 9.3 应用端：表单页
```
[Header 56px - 含返回 / 保存]
[字段组 1]
[字段组 2]
[底部固定 CTA：提交]
```

### 9.4 后台：列表页
```
[TopBar - 含面包屑 / 用户菜单]
[筛选区（可折叠）]
[操作栏：批量操作 + 搜索 + 新增]
[Table - 虚拟滚动]
[Pagination]
```

### 9.5 后台：详情 / 编辑页
```
[TopBar]
[面包屑 + 返回]
[标题 + 操作按钮（保存 / 删除 / 复制）]
[Tab 内容区（基本信息 / 高级设置 / 历史）]
```

## 十、特殊容器

### 10.1 Bottom Sheet
- 高度：50% 视口（默认）/ 70% / 90% / 全屏
- 顶部圆角 `rounded-t-3xl`
- 拖拽手柄 `w-12 h-1.5 bg-text-tertiary` 居中
- 滑下 ≥ 100px 关闭
- ESC 关闭

### 10.2 Drawer
- 仅后台移动端 / 应用端长菜单
- 从左滑出，宽度 280px
- 背景遮罩 `bg-black/40 backdrop-blur-sm`

### 10.3 Modal
- 居中显示，max-width 480px
- 移动端：`bottom-sheet` 形式呈现

### 10.4 Toast
- 顶部，`top-4 + safe-top`，居中（应用） / 右上（后台）
- 最多 3 个堆叠

## 十一、可视字数 / 行长

| 内容 | 行长 |
|---|---|
| 中文正文 | ≤ 20 字 / 行 |
| 英文正文 | ≤ 70 字符 / 行 |
| 拼音注音 | 跟随汉字 |
| 母语注释 | 同英文规则 |

强制 `max-w-prose` (≈ 65ch) 限制宽度提升可读性。

## 十二、检查清单

- [ ] 320px 最小屏可用（横向无溢出）
- [ ] iPhone 14 Pro 灵动岛适配
- [ ] iPad 平板尺寸双列布局生效
- [ ] 后台 1920×1080 不浪费空间
- [ ] 横屏游戏全部 device 测试
- [ ] 安全区 padding 全部页面应用
- [ ] 下拉刷新 / 无限滚动手感顺滑

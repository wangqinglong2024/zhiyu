# T12-006: 前端 — 文章编辑页 (Article Editor Page)

> 分类: 12-管理后台-内容管理 (Admin Content Management)
> 状态: 📋 待开发
> 复杂度: L(大)
> 预估文件数: 12+

## 需求摘要

实现管理后台「文章编辑页」，包含左右分栏布局（左侧主编辑区 70% + 右侧设置区 30%）、多语言 Tab 切换编辑（中文/英文/越南语）、富文本编辑器（含拼音 `<ruby>` 标注核心特色功能）、封面图上传裁剪、底部操作栏（取消/保存草稿/上架发布），以及全屏预览弹窗（手机端模拟 + 语言/模式切换）。编辑器支持自动保存（30s 间隔）和离开保护。

## 相关上下文

- 产品需求: `product/admin/02-admin-content/01-article-management.md` §二（新建/编辑）+ §三（预览）
- 非功能需求: `product/admin/02-admin-content/04-data-nonfunctional.md` §2.1（编辑器性能）+ §2.2（图片上传）
- 设计规范: `grules/06-ui-design.md`
- 全局架构: `grules/01-rules.md` §一 — 设计系统
- 编码规范: `grules/05-coding-standards.md` §二
- API 依赖: T12-001 — 文章 CRUD API
- 关联任务: T12-005（列表页跳转入口）

## 技术方案

### 路由配置

```typescript
// 新建: /admin/content/articles/new
// 编辑: /admin/content/articles/:id/edit
// 面包屑: 内容管理 > 文章管理 > 新建文章 / 编辑文章「{文章标题}」
```

### 页面布局

```
┌──────────────────────────────────────────────────────────────┐
│ 面包屑: 内容管理 > 文章管理 > 新建文章                          │
│                                                              │
│ ┌─── 左侧主编辑区 (70%) ────────┐ ┌── 右侧设置区 (30%) ──┐  │
│ │ [文章分类 ▾]                   │ │ 关联课程 [▾ 无关联]   │  │
│ │ [封面图上传 📷]                │ │ 排序权重 [0___]      │  │
│ │ [标签输入...]                  │ │ SEO 描述 [________]  │  │
│ │                               │ │                      │  │
│ │ ┌─ 语言 Tab ───────────────┐  │ │ (fixed 随滚动)       │  │
│ │ │ [中文版*] [英文版] [越南语]│  │ └──────────────────────┘  │
│ │ └───────────────────────────┘  │                            │
│ │ 文章标题: [____________] X/50  │                            │
│ │                               │                            │
│ │ ┌─ 富文本编辑器 ────────────┐  │                            │
│ │ │ H▾ B I 1. • " — 拼 🖼 ▶ ♪│  │                            │
│ │ │ ↶ ↷                       │  │                            │
│ │ │                           │  │                            │
│ │ │ [编辑区域]                │  │                            │
│ │ │                           │  │                            │
│ │ └───────────────────────────┘  │                            │
│ └─────────────────────────────────┘                            │
│                                                              │
│ ┌── 底部操作栏 (固定) ─────────────────────────────────────┐  │
│ │ [取消]                    [保存草稿] [上架发布]            │  │
│ │                     自动保存于 14:30:05                    │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 组件结构

```
frontend/src/pages/admin/content/
├── ArticleEditorPage.tsx             — 编辑页主组件
└── components/
    ├── ArticleBasicInfo.tsx           — 基本信息（分类 + 封面 + 标签）
    ├── ArticleLanguageTabs.tsx        — 多语言 Tab 切换
    ├── ArticleRichEditor.tsx          — 富文本编辑器（含拼音标注）
    ├── PinyinAnnotator.tsx            — 拼音标注浮层组件（核心）
    ├── ArticleSidebar.tsx             — 右侧设置区
    ├── ArticleActionBar.tsx           — 底部操作栏
    ├── ArticlePreviewModal.tsx        — 全屏预览弹窗
    ├── CoverImageUploader.tsx         — 封面图上传+裁剪
    └── PhonePreviewFrame.tsx          — 手机预览框组件
```

### 富文本编辑器技术选型

```typescript
// 推荐使用 TipTap（基于 ProseMirror）
// 原因：可扩展性强，支持自定义 Node/Mark（用于 ruby 拼音标注）
// 依赖：@tiptap/react + @tiptap/starter-kit + 自定义 ruby extension

// 工具栏按钮（从左到右）:
// H▾(H2/H3/H4) | B | I | 1.(有序列表) | •(无序列表) | "(引用) | —(分隔线)
// | 拼(拼音标注，仅中文Tab) | 🖼(图片) | ▶(视频) | ♪(音频) | ↶(撤销) | ↷(重做)
```

### 拼音标注功能（核心特色）

```typescript
// PinyinAnnotator 组件实现方案:
// 1. 用户选中中文文字 → 获取选区文本
// 2. 点击「拼」按钮 → 弹出浮层（定位在选区正上方）
// 3. 浮层内容:
//    - 显示选中的汉字
//    - 每个汉字对应一个拼音输入框（横排）
//    - 调用拼音转换服务自动填充建议（pinyin-pro 库）
//    - 支持声调符号输入 + 数字声调自动转换
// 4. 确认 → 插入 <ruby> HTML 到编辑器
// 5. 已标注文字以浅蓝色底纹高亮

// 全文自动标注:
// 「拼」按钮下拉菜单 → 「全文自动标注」
// 遍历正文所有中文字符 → 批量生成拼音 → 用户逐一检查多音字

// 已标注内容编辑:
// 双击已标注文字 → 重新弹出浮层 → 可修改拼音
// 选中 + Delete → 弹出选择「删除拼音标注」/「删除文字和标注」

// HTML 输出格式:
// <ruby>中<rp>(</rp><rt>zhōng</rt><rp>)</rp></ruby>
```

### 多语言 Tab 交互

```typescript
// - 切换 Tab 时自动保存当前内容到内存（非持久化）
// - Tab 标签显示填写进度:
//   中文版: 固定红色星号（必填）
//   英文版/越南语版: 「待翻译」(灰色) / 「已填写」(绿色)
// - 进度判断: 标题和正文均有内容 → 已填写
// - 拼音标注按钮仅在中文版 Tab 显示
```

### 自动保存

```typescript
// 编辑器内容变化后 30s 自动保存草稿
// 页面底部显示「自动保存于 HH:mm:ss」灰色小字
// beforeunload 事件拦截未保存修改
```

### 预览弹窗

```typescript
// 全屏 Modal
// 左侧控制面板 (240px): 语言切换 + 显示模式 + 外观模式
// 右侧手机预览框 (375x812px, iPhone 比例): 渲染富文本内容
// 中文版支持「拼音+中文」/「纯中文」模式切换
// 英文/越南语未填写时显示「该语言版本尚未填写」
```

### 封面图上传裁剪

```typescript
// 使用 react-image-crop 或 react-easy-crop
// 裁剪比例锁定 16:9
// 格式: JPG/PNG/WebP, ≤ 2MB, 最小 800×450px
// 上传到 Supabase Storage → 获取 URL → 存入表单
```

### 操作按钮逻辑

```typescript
// 取消: 有未保存修改 → 确认弹窗「继续编辑」/「放弃修改」
// 保存草稿: 仅校验中文标题+分类 → 状态保持 draft
// 上架发布: 校验全部必填（三语言标题+正文+分类+封面图）
//   → 任一失败 → 滚动到第一个错误字段 + Toast
//   → 全部通过 → 二次确认弹窗 → 状态 → published
```

## 范围（做什么）

- 创建 ArticleEditorPage 页面组件（新建/编辑复用）
- 实现左右分栏布局（70%/30%，右侧 fixed 定位）
- 实现多语言 Tab 切换（中文/英文/越南语）+ 填写进度标记
- 集成 TipTap 富文本编辑器 + 全部工具栏按钮
- 实现拼音标注核心功能（选中标注 + 全文标注 + 编辑已标注 + ruby HTML 输出）
- 实现封面图上传 + 16:9 裁剪
- 实现标签输入组件
- 实现右侧设置区（关联课程 + 排序权重 + SEO 描述）
- 实现底部操作栏（取消/保存草稿/上架发布 + 校验逻辑）
- 实现自动保存（30s 间隔 + 显示保存时间）
- 实现 beforeunload 离开保护
- 实现全屏预览弹窗（手机端模拟 + 语言/模式切换）

## 边界（不做什么）

- 不实现后端 API（T12-001 已完成）
- 不实现列表页（T12-005 已完成）
- 不实现文章版本历史（P1 功能）

## 涉及文件

- 新建: `frontend/src/pages/admin/content/ArticleEditorPage.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleBasicInfo.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleLanguageTabs.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleRichEditor.tsx`
- 新建: `frontend/src/pages/admin/content/components/PinyinAnnotator.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleSidebar.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticleActionBar.tsx`
- 新建: `frontend/src/pages/admin/content/components/ArticlePreviewModal.tsx`
- 新建: `frontend/src/pages/admin/content/components/CoverImageUploader.tsx`
- 新建: `frontend/src/pages/admin/content/components/PhonePreviewFrame.tsx`
- 修改: `frontend/src/router/index.tsx` — 注册编辑页路由

## 依赖

- 前置: T12-001（API）、T12-005（列表页跳转入口）
- 后续: T12-010（内容审核工作流）、T12-011（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 点击文章列表页「+ 新建文章」按钮  
   **WHEN** 编辑页加载完成  
   **THEN** 显示空表单，面包屑「内容管理 > 文章管理 > 新建文章」，编辑器初始化 ≤ 1.5s

2. **GIVEN** 在中文版 Tab 输入正文  
   **WHEN** 选中 2 个汉字并点击「拼」按钮  
   **THEN** 拼音浮层在选区上方弹出（≤ 300ms），每个汉字一个输入框，已自动填充拼音建议

3. **GIVEN** 拼音浮层已弹出  
   **WHEN** 修改某个多音字拼音并点击「确认」  
   **THEN** 编辑器中汉字上方显示小号拼音，浅蓝色底纹高亮，HTML 输出为 `<ruby>` 格式

4. **GIVEN** 点击「拼」下拉菜单的「全文自动标注」  
   **WHEN** 正文有 500 字中文内容  
   **THEN** 2 秒内完成全文标注，Toast「已自动标注 X 个汉字的拼音，请检查多音字是否正确」

5. **GIVEN** 切换到英文版 Tab  
   **WHEN** 输入英文标题和正文  
   **THEN** Tab 标签从「待翻译」变为「已填写」（绿色），切换回中文版数据不丢失

6. **GIVEN** 编辑页有未保存修改  
   **WHEN** 点击「取消」按钮  
   **THEN** 弹出确认弹窗「当前页面有未保存的修改，确定离开吗？」，选项「继续编辑」/「放弃修改」

7. **GIVEN** 仅填写了中文标题和分类（未填英文/越南语/封面图）  
   **WHEN** 点击「上架发布」  
   **THEN** 滚动到第一个错误字段并标红，Toast「请完善必填信息」

8. **GIVEN** 打开预览弹窗  
   **WHEN** 切换语言为英文版 + 外观模式为深色  
   **THEN** 手机预览框正确渲染英文内容 + 深色背景，拼音标注以 ruby 样式展示（仅中文版有效）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建前后端
2. Browser MCP 打开 `http://localhost:5173/admin/content/articles/new`
3. 测试基本信息填写（分类 + 封面图 + 标签）
4. 测试多语言 Tab 切换 + 内容不丢失
5. 测试富文本编辑器全部工具栏按钮
6. 测试拼音标注（选中标注 + 全文标注 + 编辑已标注）
7. 测试保存草稿 + 上架发布 + 校验逻辑
8. 测试预览弹窗（语言/模式切换）
9. 测试自动保存
10. 验证响应式 + Light/Dark 双模式
11. 截图保存

### 测试通过标准

- [ ] Docker 构建成功
- [ ] 编辑器初始化 ≤ 1.5s
- [ ] 拼音标注功能完整（选中/全文/编辑/删除）
- [ ] 多语言 Tab 切换数据不丢失
- [ ] 封面图上传 + 16:9 裁剪
- [ ] 保存草稿 / 上架发布校验逻辑正确
- [ ] 预览弹窗正常
- [ ] 自动保存 + 离开保护
- [ ] Light/Dark 双模式
- [ ] 无紫色，毛玻璃效果正确

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/12-admin-content/` 下创建同名结果文件

结果文件路径: `/tasks/result/12-admin-content/T12-006-fe-article-editor.md`

## 自检重点

- [ ] TipTap 编辑器正确配置，无额外大型依赖
- [ ] 拼音标注输出标准 `<ruby>` HTML
- [ ] 全文自动标注性能 ≤ 2s（1000 字以内）
- [ ] 自动保存间隔 30s，显示保存时间
- [ ] beforeunload 拦截未保存修改
- [ ] 封面图裁剪比例锁定 16:9
- [ ] 上架校验三语言标题+正文+分类+封面图全部必填
- [ ] 预览弹窗手机比例 375×812px
- [ ] Tailwind CSS v4，无 tailwind.config.js
- [ ] 色彩规范，无紫色

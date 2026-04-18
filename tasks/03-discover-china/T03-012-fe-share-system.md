# T03-012: 前端 — 分享系统

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 4

## 需求摘要

实现文章分享卡片生成功能，复用 T03-010 的分享框架（SharePreviewSheet + ShareActions）。用户在文章详情页点击分享按钮后，使用 Canvas 生成文章分享卡片图片（1080×1350px，4:5 比例），包含文章封面图 + 标题 + 摘要 + 品牌 Logo + 二维码。支持保存和 Web Share API 分享。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/04-share-system.md` §三 — 文章分享卡片规格
- 产品需求: `product/apps/02-discover-china/03-article-detail.md` §二 — 分享按钮行为
- 设计规范: `grules/06-ui-design.md` — UI/UX 设计规范
- 前置组件: T03-010（SharePreviewSheet, ShareActions, use-share, canvas-share 工具）
- API 依赖: T03-004（GET /api/v1/articles/:id — 文章详情 + coverUrl）

## 技术方案

### 组件结构

```
frontend/src/features/discover-china/
├── components/share/
│   ├── ArticleShareCanvas.tsx    -- 新建：Canvas 文章卡片生成器
│   ├── QuoteShareCanvas.tsx      -- 已有（T03-010）
│   ├── SharePreviewSheet.tsx     -- 复用（T03-010）
│   └── ShareActions.tsx          -- 复用（T03-010）
└── utils/
    └── canvas-share.ts           -- 扩展：文章卡片绘图函数
```

### Canvas 文章分享卡片规格

| 属性 | 值 |
|------|-----|
| 尺寸 | 1080 × 1350px（4:5 比例） |
| 格式 | PNG |
| 文件大小 | ≤ 500KB |

**卡片构成**：

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│         [文章封面图]              │  ← 上半部（60%，648px）
│                                  │
│                                  │
├──────────────────────────────────┤
│                                  │
│  秦始皇统一六国的传奇              │  ← 中文标题（36px 白色）
│  The Legend of Emperor Qin's     │  ← 英文标题（20px 白色 70%）
│  Unification of Six States       │
│                                  │
│  秦始皇是中国历史上第一位皇帝，     │  ← 摘要（18px 白色 60%）
│  他统一六国开创了中华统一大业...     │
│                                  │
├──────────────────────────────────┤
│  [Logo]              [二维码]     │  ← 底部品牌栏
│  知语 Zhiyu — 有趣的中文学习平台  │  ← Slogan
└──────────────────────────────────┘
```

**样式详情**：
- 封面图区域：上半部分 60%（648px），`object-fit: cover`
- 文字区域：下半部分 40%（702px），深色背景 `#0f172a`
- 中文标题：36px 白色，最多 2 行
- 英文标题：20px 白色 70% opacity（始终英文），最多 2 行
- 摘要：18px 白色 60% opacity，最多 3 行
- Logo：底部左侧，距底 40px，距左 48px，高度 36px
- 二维码：底部右侧，距底 40px，距右 48px，80×80px
- Slogan：底部居中，距底 16px，12px 白色 40% opacity

### Canvas 绘图函数

```typescript
// canvas-share.ts 扩展
async function generateArticleShareImage(article: ArticleDetail): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d')!;
  
  // 1. 绘制封面图（上半 60%）
  // 2. 绘制深色文字区域（下半 40%）
  // 3. 绘制中文标题 + 英文标题 + 摘要
  // 4. 绘制品牌 Logo + 二维码 + Slogan
  
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}
```

### 文章详情页分享集成

- 导航栏分享按钮 + 元信息区分享按钮 → 共用同一分享逻辑
- 点击 → 按钮 loading → Canvas 生成图片（≤ 3s）→ SharePreviewSheet 弹出

## 范围（做什么）

- 创建 `ArticleShareCanvas.tsx` — Canvas 文章卡片生成器
- 扩展 `canvas-share.ts` — 添加文章卡片绘图函数
- 在 `ArticleDetailPage.tsx` 集成分享逻辑（导航栏 + 元信息区两个按钮）
- 复用 SharePreviewSheet + ShareActions（T03-010）

## 边界（不做什么）

- 不修改金句分享功能（T03-010 已完成）
- 不实现分享统计追踪
- 不实现分享到特定平台（仅 Web Share API 通用调用）

## 涉及文件

- 新建: `frontend/src/features/discover-china/components/share/ArticleShareCanvas.tsx`
- 修改: `frontend/src/features/discover-china/utils/canvas-share.ts` — 添加文章卡片生成函数
- 修改: `frontend/src/features/discover-china/pages/ArticleDetailPage.tsx` — 集成分享按钮逻辑

## 依赖

- 前置: T03-009（文章详情页已创建）, T03-010（分享框架组件已创建）
- 后续: T03-013（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 文章详情页已加载  
   **WHEN** 点击导航栏分享按钮  
   **THEN** 按钮 loading → 3 秒内生成卡片图片 → 弹出 SharePreviewSheet

2. **GIVEN** 分享预览面板已弹出  
   **WHEN** 查看生成的文章卡片  
   **THEN** 包含：封面图 + 中文标题 + 英文标题 + 摘要 + Logo + 二维码

3. **GIVEN** 文章卡片已生成  
   **WHEN** 点击「保存到相册」  
   **THEN** PNG 图片下载成功，1080×1350px，≤ 500KB

4. **GIVEN** 文章详情页元信息区  
   **WHEN** 点击元信息区的分享按钮  
   **THEN** 与导航栏分享按钮行为一致（生成同一张卡片）

5. **GIVEN** 文章无封面图  
   **WHEN** 生成分享卡片  
   **THEN** 封面区域使用类目默认封面或品牌渐变背景降级

6. **GIVEN** Canvas 图片生成失败  
   **WHEN** 点击分享按钮  
   **THEN** 红色 Toast「图片生成失败，请稍后重试」，按钮恢复可点击

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 通过 Browser MCP 进入文章详情页
4. 点击分享按钮验证卡片生成
5. 截图验证卡片内容完整性
6. 测试保存功能
7. 测试无封面图降级
8. 切换 Light/Dark 模式验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 文章卡片生成 ≤ 3 秒
- [ ] PNG 1080×1350px，≤ 500KB
- [ ] 卡片包含所有必要元素
- [ ] 保存功能正常
- [ ] 无封面图降级正确
- [ ] Light + Dark 模式 Bottom Sheet 正确
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-012-fe-share-system.md`

## 自检重点

- [ ] Canvas 绘图：封面 60% + 文字 40% 比例正确
- [ ] Canvas 绘图：文字换行处理（标题最多 2 行、摘要最多 3 行）
- [ ] 性能：图片生成 ≤ 3s，文件 ≤ 500KB
- [ ] 安全：Canvas 跨域图片 crossOrigin 设置
- [ ] 降级：无封面图/生成失败有合理降级
- [ ] 复用：SharePreviewSheet + ShareActions 与金句分享共用

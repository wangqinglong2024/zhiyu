# T03-010: 前端 — 每日金句与分享

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 6

## 需求摘要

实现每日金句的分享功能：用户点击金句卡片分享按钮后，使用 Canvas 生成精美的分享图片（1080×1920px 竖版），包含金句文字 + 毛玻璃文字区 + 背景图 + 品牌 Logo + 二维码 + Slogan。生成后弹出 Bottom Sheet 预览面板，支持保存到相册和分享到社交平台（Web Share API）。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/04-share-system.md` §二 — 金句分享图片规格
- 产品需求: `product/apps/02-discover-china/01-category-homepage.md` §2.3 — 分享按钮行为
- 设计规范: `grules/06-ui-design.md` — UI/UX 设计规范
- API 依赖: T03-005（GET /api/v1/daily-quotes/today — 获取金句 + bgImageUrl）

## 技术方案

### 组件结构

```
frontend/src/features/discover-china/
├── components/
│   ├── share/
│   │   ├── QuoteShareCanvas.tsx      -- Canvas 金句图片生成器
│   │   ├── SharePreviewSheet.tsx     -- 分享预览 Bottom Sheet
│   │   └── ShareActions.tsx          -- 保存/分享操作按钮
│   └── DailyQuoteCard.tsx            -- 已有，补充分享逻辑
├── hooks/
│   └── use-share.ts                  -- 分享逻辑 Hook
└── utils/
    └── canvas-share.ts               -- Canvas 绘图工具函数
```

### Canvas 金句图片规格

| 属性 | 值 |
|------|-----|
| 尺寸 | 1080 × 1920px（9:16 竖版） |
| 格式 | PNG |
| 文件大小 | ≤ 500KB |

**图片构成**：
1. **背景图**：全幅铺满（`object-fit: cover`），叠加暗色遮罩 `rgba(0, 0, 0, 0.35)`
2. **毛玻璃文字区**：居中卡片（`rgba(0, 0, 0, 0.25)` + 模拟模糊效果，圆角 32px）
   - 中文金句：48px 白色，居中
   - 拼音：24px 白色 80% opacity
   - 出处：20px Amber `#fde68a`
   - 英文翻译：22px 白色 70% opacity（始终英文，不受用户配置影响）
3. **品牌 Logo**：底部左侧，距底 80px，距左 60px，高度 48px，白色
4. **二维码**：底部右侧，距底 80px，距右 60px，100×100px，白色
5. **Slogan**：底部居中，距底 40px，14px 白色 50% opacity

**金句文字规则**：分享图片始终显示完整内容（中文+拼音+出处+英文翻译），不受用户个人多语言配置影响。

### Canvas 绘图流程

```typescript
async function generateQuoteImage(quote: DailyQuote): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d')!;
  
  // 1. 绘制背景图 + 暗色遮罩
  // 2. 绘制毛玻璃文字区域（模拟：圆角矩形 + 半透明填充）
  // 3. 绘制金句文字（居中排版）
  // 4. 绘制品牌 Logo
  // 5. 绘制二维码
  // 6. 绘制 Slogan
  
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}
```

### 分享预览 Bottom Sheet

- 从底部上滑弹出，背景模糊遮罩
- 显示生成的图片预览（缩小展示）
- 两个操作按钮：
  - 「保存到相册」：触发下载（`<a>` download 或 Blob URL）
  - 「分享」：调用 Web Share API（`navigator.share()`），不支持时隐藏

### Web Share API 降级

```typescript
if (navigator.canShare && navigator.canShare({ files: [file] })) {
  await navigator.share({ files: [file], title: '知语每日金句' });
} else {
  // 降级：仅保存到相册
}
```

## 范围（做什么）

- 创建 `QuoteShareCanvas.tsx` — Canvas 金句图片生成
- 创建 `SharePreviewSheet.tsx` — 分享预览 Bottom Sheet
- 创建 `ShareActions.tsx` — 保存/分享操作
- 创建 `canvas-share.ts` — Canvas 绘图工具函数
- 创建 `use-share.ts` — 分享逻辑 Hook
- 完善 `DailyQuoteCard.tsx` 分享按钮联动逻辑

## 边界（不做什么）

- 不实现文章分享卡片（T03-012）
- 不实现服务端图片生成（前端 Canvas 生成）
- 不实现节日装饰元素（P2 延后）
- 不实现分享统计追踪（后续迭代）

## 涉及文件

- 新建: `frontend/src/features/discover-china/components/share/QuoteShareCanvas.tsx`
- 新建: `frontend/src/features/discover-china/components/share/SharePreviewSheet.tsx`
- 新建: `frontend/src/features/discover-china/components/share/ShareActions.tsx`
- 新建: `frontend/src/features/discover-china/utils/canvas-share.ts`
- 新建: `frontend/src/features/discover-china/hooks/use-share.ts`
- 修改: `frontend/src/features/discover-china/components/DailyQuoteCard.tsx` — 分享按钮逻辑

## 依赖

- 前置: T03-005（金句 API，bgImageUrl 字段）、T03-007（DailyQuoteCard.tsx 组件，分享按钮需修改该组件）
- 后续: T03-012（复用 SharePreviewSheet 和 ShareActions）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 当日金句已显示  
   **WHEN** 点击金句卡片的分享按钮  
   **THEN** 按钮进入 loading 态（图标旋转 150ms）→ 3 秒内生成图片 → 弹出预览 Bottom Sheet

2. **GIVEN** 分享预览面板已弹出  
   **WHEN** 查看生成的图片  
   **THEN** 包含：中文金句 + 拼音 + 出处 + 英文翻译 + 背景图 + Logo + 二维码 + Slogan

3. **GIVEN** 分享预览面板已弹出  
   **WHEN** 点击「保存到相册」  
   **THEN** 图片下载成功（PNG 格式，≤ 500KB），Toast "已保存"

4. **GIVEN** 浏览器支持 Web Share API  
   **WHEN** 点击「分享」按钮  
   **THEN** 调出系统分享面板

5. **GIVEN** 浏览器不支持 Web Share API  
   **WHEN** 查看分享预览面板  
   **THEN** 「分享」按钮隐藏，仅显示「保存到相册」

6. **GIVEN** 金句图片生成失败（如背景图加载失败）  
   **WHEN** 点击分享按钮  
   **THEN** Toast 错误提示「图片生成失败，请稍后重试」（红色，需手动关闭），按钮恢复可点击

7. **GIVEN** 金句分享图片  
   **WHEN** 检查图片内容  
   **THEN** 始终包含完整内容（中文+拼音+出处+英文翻译），不受用户多语言配置影响

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. 通过 Browser MCP 访问类目首页
5. 点击金句分享按钮，验证图片生成
6. 截图验证：Bottom Sheet 预览 + 图片内容完整性
7. 测试保存功能
8. 测试生成失败降级处理
9. 切换 Light/Dark 模式验证 Bottom Sheet 样式

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Canvas 图片生成 ≤ 3 秒
- [ ] 生成的 PNG ≤ 500KB
- [ ] 图片包含所有必要元素（金句+Logo+二维码）
- [ ] 保存功能正常
- [ ] 生成失败有正确错误提示
- [ ] Light + Dark 模式 Bottom Sheet 样式正确
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-010-fe-daily-quote-share.md`

## 自检重点

- [ ] Canvas 绘图：文字居中、字体大小、颜色与 PRD 一致
- [ ] 性能：图片生成 ≤ 3s，文件 ≤ 500KB
- [ ] 安全：Canvas 跨域图片需 crossOrigin 设置
- [ ] 降级：Web Share API 不可用时隐藏分享按钮
- [ ] 毛玻璃：Bottom Sheet 遵循 Cosmic Refraction 设计

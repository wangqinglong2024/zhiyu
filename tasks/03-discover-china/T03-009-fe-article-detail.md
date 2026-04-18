# T03-009: 前端 — 文章详情页

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 12

## 需求摘要

实现文章详情阅读页，是「发现中国」模块内容消费的核心页面。包含：多语言内容渲染（5 种配置组合：拼音+中文/纯中文 × 解释语言开关 × UI 语言=汉语）、音频播放条（播放/暂停/进度/倍速）、长按选词浮层（汉字+拼音+释义）、字体大小调节（三档）、收藏/分享按钮、图片点击放大。需覆盖 7 种页面状态。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/03-article-detail.md` — 文章详情页完整 PRD
- 产品需求: `product/apps/02-discover-china/00-index.md` §1.3 — 多语言配置项
- 设计规范: `grules/06-ui-design.md` — UI/UX 设计规范
- API 依赖: T03-004（GET /api/v1/articles/:id）, T03-006（收藏 API）

## 技术方案

### 页面结构

```
ArticleDetailPage/
├── StickyNavBar              -- 吸顶导航栏
│   ├── BackButton            -- 返回按钮
│   ├── FontSizeButton        -- 字体调节
│   └── ShareButton           -- 分享按钮（→ T03-012）
├── ArticleHeader             -- 标题区
│   ├── TitleZh               -- 中文大标题
│   ├── TitleLocale           -- 解释语言标题
│   └── MetaInfo              -- 元信息（日期+浏览量+收藏+分享）
├── ArticleContent            -- 正文内容区
│   ├── ParagraphRenderer     -- 段落渲染器（多语言配置驱动）
│   ├── ImageViewer           -- 图片查看（点击放大）
│   └── LongPressPopover      -- 长按选词浮层
├── AudioPlayer               -- 音频播放条（悬浮底部）
├── VocabularyCards           -- 核心词汇横滑卡片（P1）
├── QuizSection               -- 趣味小测验（P1）
├── RecommendSection          -- 相关推荐（P1）
└── hooks/
    ├── use-article-detail.ts -- 文章详情数据
    ├── use-audio-player.ts   -- 音频播放控制
    └── use-long-press.ts     -- 长按选词
```

### 前端架构

```
frontend/src/features/discover-china/
├── pages/
│   └── ArticleDetailPage.tsx         -- 文章详情页
├── components/
│   ├── ArticleHeader.tsx             -- 标题 + 元信息区
│   ├── ArticleContent.tsx            -- 正文渲染容器
│   ├── ParagraphRenderer.tsx         -- 段落渲染器（核心）
│   ├── AudioPlayer.tsx               -- 音频播放条
│   ├── LongPressPopover.tsx          -- 长按选词浮层
│   ├── FontSizeControl.tsx           -- 字体大小调节
│   ├── ImageViewer.tsx               -- 图片放大查看
│   ├── VocabularyCards.tsx           -- 词汇表横滑卡片（P1）
│   ├── QuizSection.tsx               -- 小测验（P1）
│   └── ArticleDetailSkeleton.tsx     -- 骨架屏
├── hooks/
│   ├── use-article-detail.ts         -- 文章详情数据
│   ├── use-audio-player.ts           -- 音频播放
│   └── use-long-press.ts             -- 长按选词检测
```

### 多语言正文渲染（核心）

`ParagraphRenderer` 是最关键的组件，根据用户配置动态渲染每个段落：

```
用户配置:
  - learningMode: 'pinyin-zh' | 'zh-only'
  - explanationEnabled: boolean
  - uiLanguage: 'zh' | 'en' | 'vi'

渲染规则:
  配置1: pinyin-zh + explanation ON → 拼音行 + 中文行 + 解释语言行
  配置2: pinyin-zh + explanation OFF → 拼音行 + 中文行
  配置3: zh-only + explanation ON → 中文行 + 解释语言行
  配置4: zh-only + explanation OFF → 中文行
  配置5: uiLanguage=zh → 自动关闭解释语言 → 拼音行(可选) + 中文行
```

**排版规格**：
- 拼音行：14px Inter 400，次要文字色 60%，行高 1.5
- 中文行：18px 默认（可调），主要文字色，行高 1.7
- 解释语言行：16px Inter 400，次要文字色 70%，行高 1.6
- 拼音与中文间距：4px
- 中文与解释语言间距：4px
- 段间距：24px

### 音频播放条

- 悬浮固定底部（Tab Bar 上方），`.glass-elevated` 毛玻璃材质
- 播放/暂停：Lucide `Play`/`Pause` 24px Rose 色
- 进度条：高度 4px，Rose 色已播放部分，可拖拽
- 时间显示：MM:SS / MM:SS
- 倍速选择：0.5x / 1x（默认）/ 1.5x / 2x，Popover 选择
- 无音频时完全隐藏播放条
- 离开页面/切换 Tab → 音频暂停，返回后保持暂停位置

### 长按选词

- 触发：长按中文文字 400ms
- Haptic 反馈（设备支持时）
- 浮层内容：汉字 + 拼音 + 解释语言释义
- 浮层样式：`.glass-elevated` 毛玻璃，圆角 16px
- 点击浮层外关闭

### 字体大小调节

- 三档：小(16px) / 默认(18px) / 大(20px)
- 即时生效，记住用户选择（localStorage）
- 触发方式：导航栏 "A" 按钮 → 弹出 Popover

### 图片放大

- 点击正文图片 → 全屏预览（黑色背景 + 图片居中）
- 支持双指缩放
- 点击空白区域或下拉关闭

## 范围（做什么）

- 创建 `ArticleDetailPage.tsx` 页面
- 创建 `ParagraphRenderer.tsx` 多语言正文渲染器（5 种配置组合）
- 创建 `AudioPlayer.tsx` 音频播放条（含倍速选择）
- 创建 `LongPressPopover.tsx` 长按选词浮层
- 创建 `FontSizeControl.tsx` 字体调节
- 创建 `ImageViewer.tsx` 图片放大
- 创建 `ArticleHeader.tsx` 标题+元信息区
- 创建数据和播放 Hook
- 实现 7 种页面状态
- 注册路由

## 边界（不做什么）

- 不实现分享图片生成（T03-012）
- 不实现核心词汇表（P1，骨架预留）
- 不实现趣味小测验（P1，骨架预留）
- 不实现相关推荐（P1，骨架预留）
- 不实现收藏按钮完整动画封装（T03-011）

## 涉及文件

- 新建: `frontend/src/features/discover-china/pages/ArticleDetailPage.tsx`
- 新建: `frontend/src/features/discover-china/components/ArticleHeader.tsx`
- 新建: `frontend/src/features/discover-china/components/ArticleContent.tsx`
- 新建: `frontend/src/features/discover-china/components/ParagraphRenderer.tsx`
- 新建: `frontend/src/features/discover-china/components/AudioPlayer.tsx`
- 新建: `frontend/src/features/discover-china/components/LongPressPopover.tsx`
- 新建: `frontend/src/features/discover-china/components/FontSizeControl.tsx`
- 新建: `frontend/src/features/discover-china/components/ImageViewer.tsx`
- 新建: `frontend/src/features/discover-china/components/ArticleDetailSkeleton.tsx`
- 新建: `frontend/src/features/discover-china/hooks/use-article-detail.ts`
- 新建: `frontend/src/features/discover-china/hooks/use-audio-player.ts`
- 新建: `frontend/src/features/discover-china/hooks/use-long-press.ts`
- 修改: `frontend/src/router/index.tsx` — 注册路由

## 依赖

- 前置: T03-004（文章详情 API）, T03-006（收藏 API）
- 后续: T03-012（文章分享系统）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户配置为「拼音+中文 + 解释语言开启 + UI=越南语」  
   **WHEN** 查看文章正文  
   **THEN** 每段显示三行：拼音行 + 中文行 + 越南语行，排版间距正确

2. **GIVEN** 用户配置为「纯中文 + 解释语言关闭」  
   **WHEN** 查看文章正文  
   **THEN** 每段仅显示中文行，无拼音、无解释语言

3. **GIVEN** 用户配置为「UI 语言=汉语」  
   **WHEN** 查看文章正文  
   **THEN** 解释语言自动关闭，不显示解释语言行

4. **GIVEN** 文章有音频  
   **WHEN** 查看文章详情页  
   **THEN** 底部显示音频播放条，点击播放可正常播放音频

5. **GIVEN** 音频正在播放  
   **WHEN** 用户离开页面（返回或切换 Tab）  
   **THEN** 音频暂停，返回后保持暂停位置

6. **GIVEN** 正文包含中文文字  
   **WHEN** 用户长按某个中文汉字 400ms  
   **THEN** 弹出词义浮层（汉字 + 拼音 + 释义），Haptic 反馈

7. **GIVEN** 字体为默认大小（18px）  
   **WHEN** 点击导航栏字体按钮选择"大"  
   **THEN** 正文中文行字体即时变为 20px，刷新后仍保持 20px

8. **GIVEN** 正文包含图片  
   **WHEN** 点击图片  
   **THEN** 全屏预览（黑色背景 + 居中显示），支持双指缩放

9. **GIVEN** 文章无音频  
   **WHEN** 查看文章详情  
   **THEN** 音频播放条完全隐藏，不占用底部空间

10. **GIVEN** Light/Dark 模式切换  
    **WHEN** 切换主题  
    **THEN** 正文排版、音频播放条、浮层样式在两种模式下均正确

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 frontend` — 前端构建成功
4. 通过 Browser MCP 从文章列表点击进入文章详情
5. 截图验证 5 种多语言配置组合的渲染效果
6. 测试音频播放：播放/暂停/进度/倍速
7. 测试长按选词浮层
8. 测试字体调节（三档）
9. 测试图片放大
10. 切换 Light/Dark 模式截图对比
11. 响应式测试：375px / 768px / 1280px

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 5 种多语言配置组合渲染全部正确
- [ ] 音频播放条功能完整（播放/暂停/进度/倍速）
- [ ] 长按选词浮层正确弹出和关闭
- [ ] 字体调节三档即时生效且记住选择
- [ ] 图片点击放大和缩放
- [ ] Light + Dark 模式均正确
- [ ] UI 符合 Cosmic Refraction 设计系统
- [ ] 响应式测试通过（375px / 768px / 1280px）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-009-fe-article-detail.md`

## 自检重点

- [ ] 多语言渲染：5 种配置组合全覆盖，排版间距精确
- [ ] 音频播放：离开页面暂停、倍速切换、播放完毕重置
- [ ] 长按选词：仅中文行触发，400ms 阈值，Haptic 反馈
- [ ] 字体调节：持久化存储，即时生效
- [ ] 无障碍：最小触控 44×44pt、图片 alt 文本
- [ ] 性能：正文图片懒加载（进入可视区域前 300px）
- [ ] 文章详情缓存至 localStorage（50 篇 LRU 淘汰）

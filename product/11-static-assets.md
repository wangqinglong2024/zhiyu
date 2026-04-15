# PlayLingo MVP — 静态资源清单与 AI 生成指南

> **文档编号**: PRD-11 | **优先级**: P0
> **关联文档**: [总览](00-index.md) | [世界地图](02-world-map.md) | [过场动画](05-cutscenes.md) | [响应式布局](10-responsive-layout.md)

---

## 一、资源总览

### 1.1 资源分类与数量

| 类别 | 预估数量 | 生成方式 | 详细文档 |
|------|---------|---------|---------|
| 世界地图插画 | 5 张 | Flux AI 生成 | [01-world-maps.md](static-assets/01-world-maps.md) |
| 角色立绘 | 7 角色 × 3-4 表情 ≈ 24 张 | Flux AI 生成 | [02-characters.md](static-assets/02-characters.md) |
| 过场动画背景 | 8 张（横屏 16:9） | Flux AI 生成 | [03-cutscene-backgrounds.md](static-assets/03-cutscene-backgrounds.md) |
| 预设头像 | 12 个 | Flux AI 生成 | [04-avatars.md](static-assets/04-avatars.md) |
| 落地页与营销素材 | 2 张 | Flux AI + 设计工具 | [05-hero-marketing.md](static-assets/05-hero-marketing.md) |
| 游戏内贴图 | 约 30-50 张 | Flux AI + HTML/CSS | [06-game-textures.md](static-assets/06-game-textures.md) |
| 徽章图标 | 25 个 | Flux AI 生成 | [07-badges.md](static-assets/07-badges.md) |
| UI 图标 | 约 40 个 | SVG / 图标库 | [08-ui-icons.md](static-assets/08-ui-icons.md) |
| 音效与 TTS 语音 | 15 音效 + 440 TTS | 音效库 + TTS API | [09-audio-tts.md](static-assets/09-audio-tts.md) |

### 1.2 横竖屏与响应式处理总策略

| 资源类别 | 使用场景 | 方向 | 适配策略 |
|---------|---------|------|---------|
| 世界地图背景 | 非游戏模式（地图浏览） | H5 竖屏纵向长图 / PC 竖屏限宽居中 | 统一竖向长图，H5 和 PC 共用同一张，PC 端居中显示不裁剪 |
| 过场动画背景 | 游戏模式（横屏 16:9） | 横屏 | 统一 1920×1080，H5 和 PC 共用，按 16:9 canvas 铺满（object-fit: cover 微调） |
| 角色立绘 | 游戏模式（过场动画、Boss 战） | 横屏内覆盖 | 透明背景 PNG，按画布高度等比缩放，无需单独适配 |
| 落地页主图 | 非游戏模式（落地页） | 响应式 | 提供 1 张宽幅原图 1920×800，H5 端使用 CSS `object-fit: cover` 截取中央区域，PC 端完整显示 |
| 分享海报 | 非游戏模式（社交分享） | 竖屏 | 固定 1080×1920 竖屏，社交媒体分享标准尺寸 |
| 预设头像 | 非游戏模式（个人主页） | 方形 | 256×256 正方形，CSS 圆形裁切，无方向问题 |
| 徽章图标 | 非游戏模式（成就页面） | 方形 | 128×128（2x: 256×256），CSS 圆形裁切 |
| 游戏内贴图 | 游戏模式（横屏内） | 横屏内使用 | 按游戏引擎 sprite 尺寸制作，无需响应式 |

### 1.3 图片优化要求

| 格式 | 用途 | 压缩策略 |
|------|------|---------|
| WebP（主用） | 地图背景、过场背景、落地页 | 质量 80%，比 PNG 小 60-80% |
| PNG（透明） | 角色立绘、有透明度的元素 | TinyPNG 压缩，保留 Alpha |
| SVG（矢量） | UI 图标 | SVGO 优化 |
| MP3 + OGG | 音效、语音 | 128kbps / 44.1kHz |

- 提供 1x 和 2x 两套（或使用 `<picture>` + `srcset`）
- 大图使用懒加载 + 渐进式 WebP
- CDN 缓存：图片 `max-age: 30d` + `immutable`

### 1.4 资源文件目录结构

```
/public/assets/
├── maps/                    ← 世界地图背景
│   ├── map-pinyin-islands.webp
│   ├── map-hanzi-valley.webp
│   ├── map-vocabulary-plains.webp
│   ├── map-grammar-fortress.webp
│   └── map-mini-game-island.webp
├── characters/              ← 角色立绘
│   ├── char-minh-happy.png
│   ├── char-minh-surprised.png
│   ├── char-xiaolong-happy.png
│   └── ...
├── backgrounds/             ← 过场动画横屏背景
│   ├── bg-vietnam-street.webp
│   ├── bg-pinyin-beach.webp
│   └── ...
├── avatars/                 ← 预设头像
│   ├── avatar-panda.png
│   ├── avatar-dragon.png
│   └── ...
├── badges/                  ← 成就徽章
│   ├── badge-first-step.png
│   └── ...
├── game/                    ← 游戏内贴图
│   ├── tone-block-1.png
│   ├── car-player.png
│   └── ...
├── ui/                      ← UI 图标
│   ├── heart-full.svg
│   ├── star-full.svg
│   └── ...
├── audio/                   ← 音效与语音
│   ├── sfx/
│   │   ├── sfx-tap.mp3
│   │   └── ...
│   └── tts/
│       ├── vocab/
│       ├── cutscene/
│       └── listening/
└── marketing/               ← 营销素材
    ├── hero-visual.webp
    └── share-poster-template.png
```

---

*各类资源的详细规格、使用场景和 Flux AI 提示词，请查阅 [static-assets/](static-assets/) 文件夹内的分类文档。*

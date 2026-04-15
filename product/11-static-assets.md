# PlayLingo MVP — 静态资源清单与 AI 生成指南

> **文档编号**: PRD-11 | **优先级**: P0
> **关联文档**: [总览](00-index.md) | [世界地图](02-world-map.md) | [过场动画](05-cutscenes.md) | [响应式布局](10-responsive-layout.md)

---

## 一、资源总览

### 1.1 资源分类与数量

| 类别 | 预估数量 | 生成方式 | 详细文档 |
|------|---------|---------|---------|
| 世界地图插画 | 5 张 | FLUX 2 生成 | [01-world-maps.md](static-assets/01-world-maps.md) |
| 角色立绘 | 3 主角 × 4 表情 + 4 Boss × 3 表情 = 24 张 | FLUX 2 生成 | [02-characters.md](static-assets/02-characters.md) |
| 过场动画背景 | 8 张（横屏 16:9） | FLUX 2 生成 | [03-cutscene-backgrounds.md](static-assets/03-cutscene-backgrounds.md) |
| 预设头像 | 12 个 | FLUX 2 生成 | [04-avatars.md](static-assets/04-avatars.md) |
| 落地页与营销素材 | 3 张 | FLUX 2 + 设计工具 | [05-hero-marketing.md](static-assets/05-hero-marketing.md) |
| 游戏内贴图 | 约 50-60 张（含 3 张迷你游戏背景） | FLUX 2 + HTML/CSS | [06-game-textures.md](static-assets/06-game-textures.md) |
| 徽章图标 | 25 个（6 类，对齐 PRD-09） | FLUX 2 生成 | [07-badges.md](static-assets/07-badges.md) |
| UI 图标 | 约 40 个 | SVG / Lucide React | [08-ui-icons.md](static-assets/08-ui-icons.md) |
| 音效与 TTS 语音 | 19 音效 + 6 BGM + ~540 TTS | ElevenLabs SFX + Suno AI BGM + Azure TTS | [09-audio-tts.md](static-assets/09-audio-tts.md) |

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
├── characters/              ← 角色立绘（3 主角 + 4 Boss，共 24 张）
│   ├── char-minh-happy.png
│   ├── char-minh-surprised.png
│   ├── char-minh-thinking.png
│   ├── char-minh-confident.png
│   ├── char-xiaolong-happy.png
│   ├── char-xiaolong-explain.png
│   ├── char-xiaolong-cheer.png
│   ├── char-xiaolong-nervous.png
│   ├── char-meili-smile.png
│   ├── char-meili-explain.png
│   ├── char-meili-approve.png
│   ├── char-meili-serious.png
│   ├── char-tone-guardian-stern.png
│   ├── char-tone-guardian-angry.png
│   ├── char-tone-guardian-defeated.png
│   ├── char-hanzi-sealer-mystery.png
│   ├── char-hanzi-sealer-attack.png
│   ├── char-hanzi-sealer-defeated.png
│   ├── char-market-master-sly.png
│   ├── char-market-master-smug.png
│   ├── char-market-master-defeated.png
│   ├── char-grammar-general-cold.png
│   ├── char-grammar-general-battle.png
│   └── char-grammar-general-defeated.png
├── backgrounds/             ← 过场动画横屏背景（8 张）
│   ├── bg-cutscene-pinyin-overview.webp
│   ├── bg-cutscene-tone-mountain.webp
│   ├── bg-cutscene-hanzi-academy.webp
│   ├── bg-cutscene-hanzi-seal-cave.webp
│   ├── bg-cutscene-food-street.webp
│   ├── bg-cutscene-market-square.webp
│   ├── bg-cutscene-grammar-gate.webp
│   └── bg-cutscene-grammar-throne.webp
├── avatars/                 ← 预设头像（12 个）
│   ├── avatar-panda.webp
│   ├── avatar-dragon.webp
│   ├── avatar-cat.webp
│   ├── avatar-rabbit.webp
│   ├── avatar-shiba.webp
│   ├── avatar-phoenix.webp
│   ├── avatar-monkey.webp
│   ├── avatar-koi.webp
│   ├── avatar-crane.webp
│   ├── avatar-tiger.webp
│   ├── avatar-snake.webp
│   └── avatar-moonrabbit.webp
├── badges/                  ← 成就徽章（25 个，6 类）
│   ├── badge-first-step.png
│   ├── badge-pinyin-graduate.png
│   ├── badge-hanzi-master.png
│   └── ... (共 25 个)
├── game/                    ← 游戏内贴图 & 迷你游戏背景
│   ├── tone-block-1.png ~ tone-block-4.png
│   ├── tone-crosshair.png
│   ├── tone-hit-effect.png
│   ├── radical-piece-template.png
│   ├── radical-target-frame.png
│   ├── radical-bomb.png
│   ├── drift-car.png
│   ├── drift-pinyin-pickup.png
│   ├── drift-obstacle.png
│   ├── drift-powerup-shield.png
│   ├── drift-powerup-slowmo.png
│   ├── drift-powerup-double.png
│   ├── drift-powerup-speed.png
│   ├── drift-road-tile.png
│   ├── heart-full.png / heart-half.png / heart-empty.png
│   ├── star-full.png / star-half.png / star-empty.png
│   ├── combo-fire.png
│   ├── boss-hp-frame.png
│   ├── progress-bar-frame.png
│   ├── bg-game-tone-sniper.webp
│   ├── bg-game-radical-blitz.webp
│   └── bg-game-pinyin-drift.webp
├── ui/                      ← UI 图标（Lucide React + 自定义 SVG）
│   └── ... (详见 08-ui-icons.md)
├── audio/                   ← 音效、BGM 与语音
│   ├── sfx/                 ← 19 个音效 (ElevenLabs + JSFXR)
│   │   ├── sfx-ui-tap.mp3
│   │   ├── sfx-quiz-correct.mp3
│   │   ├── sfx-brush-write.mp3
│   │   └── ... (共 19 个)
│   ├── bgm/                 ← 6 首 BGM (Suno AI)
│   │   ├── bgm-menu.mp3
│   │   ├── bgm-pinyin-zone.mp3
│   │   ├── bgm-hanzi-zone.mp3
│   │   ├── bgm-vocab-zone.mp3
│   │   ├── bgm-grammar-zone.mp3
│   │   └── bgm-boss-battle.mp3
│   └── tts/                 ← ~540 条 TTS (Azure Neural TTS)
│       ├── tts-initial-*.mp3
│       ├── tts-final-*.mp3
│       ├── tts-tone-*.mp3
│       ├── tts-char-*.mp3
│       ├── tts-word-*.mp3
│       ├── tts-sentence-*.mp3
│       └── tts-cutscene-*.mp3
└── marketing/               ← 营销素材
    ├── hero-landing.webp
    ├── share-poster-template.webp
    └── og-share-image.webp
```

---

*各类资源的详细规格、使用场景和 AI 生成提示词（FLUX 2 / ElevenLabs / Suno AI / Azure TTS），请查阅 [static-assets/](static-assets/) 文件夹内的分类文档。所有图像提示词已展开为完整独立版本，可直接复制到对应 AI 工具使用。*

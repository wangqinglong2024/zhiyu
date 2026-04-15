# PlayLingo MVP — 静态资源清单与 AI 生成指南

> **文档编号**: PRD-11 | **优先级**: P0
> **关联文档**: [总览](00-index.md) | [世界地图](02-world-map.md) | [过场动画](05-cutscenes.md)

---

## 一、资源总览

### 1.1 资源分类

| 类别 | 预估数量 | 生成方式 |
|------|---------|---------|
| 世界地图插画 | 4-5 张 | Flux AI 生成 |
| 角色立绘 | 8 组（每组 3-4 个表情） | Flux AI 生成 |
| 过场动画背景 | 8 张 | Flux AI 生成 |
| 预设头像 | 12 个 | Flux AI 生成 |
| Landing Page 主视觉 | 1 张 | Flux AI 生成 |
| 分享海报模板 | 1 张 | Flux AI + 设计工具 |
| UI 图标 | 约 40 个 | SVG 手工 / 图标库 |
| 游戏内贴图 | 约 30-50 张 | Flux AI 生成 + HTML/CSS |
| 徽章图标 | 约 25 个 | Flux AI 生成（批量统一风格） |
| 音效文件 | 约 15 个 | 免费音效库下载 |
| TTS 语音 | 约 200+ 条 | TTS API 批量生成 |

---

## 二、世界地图插画

### 2.1 资源清单

| 编号 | 文件名建议 | 内容 | 尺寸 |
|------|-----------|------|------|
| MAP-01 | map-pinyin-islands.png | 拼音群岛区域背景 | 1080 × 3840 px |
| MAP-02 | map-hanzi-valley.png | 汉字谷地区域背景 | 1080 × 2880 px |
| MAP-03 | map-vocabulary-plains.png | 词汇平原区域背景 | 1080 × 2880 px |
| MAP-04 | map-grammar-fortress.png | 语法要塞区域背景 | 1080 × 1920 px |
| MAP-05 | map-mini-game-island.png | 迷你游戏岛视觉 | 512 × 512 px |

> 地图背景为纵向长条，用户通过滚动浏览。高度按关卡数量计算（每关占约 180px 垂直空间）。

### 2.2 Flux AI 生成 Prompt

#### MAP-01 拼音群岛

```
Prompt:
A vertical scrolling fantasy game map of "Pinyin Islands", top-down isometric view, 
hand-drawn illustration style similar to Kingdom Rush. Features a chain of colorful 
tropical islands connected by wooden bridges and stone paths. Each island has a 
distinct landmark: lighthouses, huts, palm trees, waterfalls, and a pirate ship dock. 
The sea is turquoise with gentle waves. Clouds dot the sky. Warm golden sunlight. 
20 circular node spots along the winding path for level markers. 
Vibrant colors: teal ocean, green isles, sandy beaches, coral pink accents. 
No text, no UI elements, game art style, high detail, 1080x3840 pixels.

Negative prompt:
realistic photo, dark, gloomy, purple tones, modern buildings, low quality, blurry, 
text, letters, UI elements, watermark
```

#### MAP-02 汉字谷地

```
Prompt:
A vertical scrolling fantasy game map of "Hanzi Valley", top-down isometric view, 
hand-drawn illustration style similar to Kingdom Rush. A deep mountain valley with 
ancient Chinese-inspired architecture: pagodas, stone tablets, calligraphy brushes 
as landmarks, bamboo forests, misty waterfalls cascading into jade pools. Rocky 
cliff paths wind through the valley. Lanterns hang along pathways. 15 circular 
node spots along the path. Warm earthy tones: jade green, warm brown, misty white, 
gold accents. East-meets-fantasy aesthetic. No text, game art style, 1080x2880 pixels.

Negative prompt:
realistic photo, dark, gloomy, purple tones, modern city, low quality, blurry, 
text, letters, UI elements, watermark
```

#### MAP-03 词汇平原

```
Prompt:
A vertical scrolling fantasy game map of "Vocabulary Plains", top-down isometric view, 
hand-drawn illustration style similar to Kingdom Rush. A wide open grassland with 
rolling hills, wildflowers, windmills, cozy cottages, a bustling market town, 
haystacks, a river with a stone bridge. Paths wind through golden wheat fields. 
A hot air balloon floats above. 15 circular node spots along the path. 
Warm pastoral palette: golden yellow, grass green, sky blue, warm orange accents. 
Peaceful and inviting. No text, game art style, 1080x2880 pixels.

Negative prompt:
realistic photo, dark, gloomy, purple tones, industrial, low quality, blurry, 
text, letters, UI elements, watermark
```

#### MAP-04 语法要塞

```
Prompt:
A vertical scrolling fantasy game map of "Grammar Fortress", top-down isometric view, 
hand-drawn illustration style similar to Kingdom Rush. A grand medieval castle complex 
on a mountain plateau. Stone walls, watchtowers, a grand library with scrolls, 
training grounds, a throne room entrance, dragon statues guarding gates. Dramatic 
cloud formations. Path spirals upward toward the ultimate castle. 10 circular node 
spots along the ascending path. Epic palette: steel gray, deep blue, warm amber 
torch light, banner red accents. Majestic and challenging. No text, game art style, 
1080x1920 pixels.

Negative prompt:
realistic photo, dark, gloomy, purple tones, modern, low quality, blurry, 
text, letters, UI elements, watermark
```

---

## 三、角色立绘

### 3.1 资源清单

> 角色来自过场动画系统（PRD-05），每个角色需要多种表情变体。

| 编号 | 角色名 | 表情变体 | 文件名格式 | 单图尺寸 |
|------|--------|---------|-----------|---------|
| CHAR-01 | 阿明（Minh）—越南青年主角 | 开心、惊讶、思考、自信 | char-minh-{emotion}.png | 512 × 1024 px |
| CHAR-02 | 小龙（Xiǎo Lóng）—可爱龙精灵引导 | 开心、讲解、鼓励、紧张 | char-xiaolong-{emotion}.png | 512 × 1024 px |
| CHAR-03 | 美丽老师（Měi Lì）—汉字谷地 NPC | 微笑、讲解、赞许、严肃 | char-meili-{emotion}.png | 512 × 1024 px |
| CHAR-04 | 声调守卫—Boss 1 | 威严、生气、被击败 | char-boss-tone-{emotion}.png | 512 × 1024 px |
| CHAR-05 | 汉字封印师—Boss 2 | 神秘、攻击、被击败 | char-boss-seal-{emotion}.png | 512 × 1024 px |
| CHAR-06 | 集市掌柜—Boss 3 | 狡猰、得意、被击败 | char-boss-market-{emotion}.png | 512 × 1024 px |
| CHAR-07 | 语法将军—Boss 4 | 冷酷、战斗、被击败 | char-boss-grammar-{emotion}.png | 512 × 1024 px |

> 合计约 24 张角色立绘图片。

### 3.2 Flux AI Prompt — 角色统一风格

**风格约束前缀（所有角色 Prompt 共用）**：
```
Style prefix:
Anime-inspired game character illustration, full body standing pose, 
transparent background (or solid color background for easy removal), 
clean cel-shaded style, vibrant colors, soft lighting, 
consistent art style across all characters. 
Game visual novel character art. High quality, detailed but clean lines.
```

#### CHAR-01 阿明（开心）

```
{Style prefix}
A Vietnamese teenage boy, age ~20, wearing a modern casual outfit: 
white t-shirt with a small star logo, light blue jacket, jeans, sneakers. 
Short black hair, bright cheerful expression, giving a thumbs up. 
Energetic and relatable protagonist character.
Standing pose, transparent background, 512x1024 pixels.

Negative prompt:
dark, gloomy, purple, low quality, western features, child
```

#### CHAR-02 小龙（开心）

```
{Style prefix}
A cute small Chinese dragon character, chibi proportions (large head, small body), 
sky blue scales with golden belly, short rounded horns, big expressive sparkling eyes, 
wide joyful smile showing tiny fangs, small wings flapping excitedly, holding a 
tiny Chinese scroll. Friendly and approachable mascot character.
Standing on nothing, transparent background, 512x1024 pixels.

Negative prompt:
scary, realistic dragon, western dragon, dark, purple, gloomy, low quality
```

#### CHAR-03 美丽老师（微笑）

```
{Style prefix}
A kind young Chinese woman teacher, age ~25, wearing a modern qipao-inspired 
top (sky blue with white cloud patterns) and dark skirt. Long straight black 
hair with a small hairpin. Warm gentle smile, holding an open book. 
Glasses optional. Elegant and approachable. Teacher character.
Standing pose, transparent background, 512x1024 pixels.

Negative prompt:
revealing clothing, sexy, dark, purple, gloomy, low quality, western features
```

---

## 四、过场动画背景

### 4.1 资源清单

| 编号 | 场景 | 文件名 | 尺寸 |
|------|------|--------|------|
| BG-01 | 越南街头（胡志明市） | bg-vietnam-street.png | 1080 × 1920 px |
| BG-02 | 拼音群岛海滩 | bg-pinyin-beach.png | 1080 × 1920 px |
| BG-03 | 拼音群岛课堂（户外小凉亭） | bg-pinyin-classroom.png | 1080 × 1920 px |
| BG-04 | 汉字谷地入口（山谷通道） | bg-hanzi-entrance.png | 1080 × 1920 px |
| BG-05 | 汉字谷地书法洞穴 | bg-hanzi-cave.png | 1080 × 1920 px |
| BG-06 | 词汇平原集市 | bg-vocab-market.png | 1080 × 1920 px |
| BG-07 | 语法要塞城门前 | bg-grammar-gate.png | 1080 × 1920 px |
| BG-08 | 语法要塞王座大厅 | bg-grammar-throne.png | 1080 × 1920 px |

### 4.2 Flux AI Prompt

#### BG-01 越南街头

```
Prompt:
A vibrant Ho Chi Minh City street scene at golden hour, anime/visual novel 
background style. Bustling street with motorbikes, street food vendors, 
colorful shophouses, string lights, and trees. A warm tropical evening atmosphere. 
Slightly stylized, not photorealistic. Clean composition with space for 
character overlay in the lower third. Warm orange and teal color palette. 
Game visual novel background, 1080x1920 portrait orientation.

Negative prompt:
realistic photo, people/characters, dark, gloomy, purple, low quality, 
watermark, text
```

#### BG-02 拼音群岛海滩

```
Prompt:
A fantasy tropical island beach, anime/visual novel background style. 
Crystal clear turquoise water, white sand, palm trees swaying, colorful 
seashells, a wooden dock with a small boat, distant islands on the horizon. 
Bright sunny day with fluffy clouds. Magical sparkles in the air. 
Clean composition for character overlay. Vibrant tropical palette. 
Game visual novel background, 1080x1920 portrait orientation.

Negative prompt:
realistic photo, people, dark, gloomy, purple, low quality, watermark, text
```

#### BG-05 汉字谷地书法洞穴

```
Prompt:
An ancient mystical cave interior, anime/visual novel background style. 
Massive stone walls covered in glowing Chinese calligraphy characters. 
A stone desk with ink brushes, ink stone, and rice paper. Soft golden light 
beams entering from above through a crack. Crystals embedded in walls 
casting colorful reflections. Mysterious but inviting atmosphere. 
Clean composition for character overlay. Warm amber and jade color palette. 
Game visual novel background, 1080x1920 portrait orientation.

Negative prompt:
realistic photo, people, dark and scary, purple, low quality, watermark, text
```

> 其余背景 Prompt 结构类似，按场景描述替换关键内容即可。

---

## 五、预设头像

### 5.1 资源清单

| 编号 | 描述 | 文件名 |
|------|------|--------|
| AVT-01 | 可爱熊猫 | avatar-panda.png |
| AVT-02 | 微笑小龙 | avatar-dragon.png |
| AVT-03 | 竹子猫 | avatar-cat.png |
| AVT-04 | 学者兔 | avatar-rabbit.png |
| AVT-05 | 武士狗 | avatar-dog.png |
| AVT-06 | 凤凰鸟 | avatar-phoenix.png |
| AVT-07 | 功夫猴 | avatar-monkey.png |
| AVT-08 | 锦鲤鱼 | avatar-koi.png |
| AVT-09 | 仙鹤 | avatar-crane.png |
| AVT-10 | 小老虎 | avatar-tiger.png |
| AVT-11 | 竹叶蛇 | avatar-snake.png |
| AVT-12 | 月兔 | avatar-moonrabbit.png |

尺寸：256 × 256 px（正方形，圆形裁切显示）

### 5.2 Flux AI Prompt（统一风格）

```
Batch prompt prefix:
Cute chibi animal avatar icon, circular composition, anime style, 
vibrant colors, soft gradient background (pastel), clean vector-like 
rendering, friendly expression. Game profile avatar icon.
256x256 pixels.

AVT-01: A cute chibi panda bear, sitting, holding a small bamboo shoot, 
pastel green circular background.

AVT-02: A cute chibi Chinese dragon (same as mascot Xiǎo Lóng), 
winking, sky blue circular background.

AVT-03: A cute chibi cat wearing a tiny bamboo hat, playing with 
a yarn ball, pastel yellow circular background.

AVT-04: A cute chibi rabbit wearing round glasses and reading a book, 
pastel blue circular background.

AVT-05: A cute chibi shiba inu dog wearing a tiny samurai headband, 
pastel orange circular background.

AVT-06: A cute chibi phoenix bird with colorful tail feathers spread, 
pastel red circular background.

AVT-07: A cute chibi monkey doing a kung fu pose, golden headband, 
pastel peach circular background.

AVT-08: A cute chibi koi fish jumping out of water with sparkles, 
red-gold scales, pastel aqua circular background.

AVT-09: A cute chibi crane bird standing gracefully, white feathers 
with red cap, pastel lavender circular background.

AVT-10: A cute chibi baby tiger cub sitting, orange stripes, big 
sparkly eyes, pastel coral circular background.

AVT-11: A cute chibi green snake coiled playfully around a bamboo 
branch, friendly expression, pastel mint circular background.

AVT-12: A cute chibi rabbit sitting on a crescent moon, holding a 
tiny mortar and pestle (jade rabbit myth), pastel purple circular 
background.

Negative prompt (all):
scary, realistic, dark, purple, low quality, blurry, text, watermark
```

---

## 六、UI 图标

### 6.1 建议使用图标库

MVP 优先使用现成图标库，减少定制成本：
- **Lucide Icons**（推荐）：开源、风格一致、支持 React 组件
- **Heroicons**：备选
- **自定义**：仅在图标库无法满足时制作 SVG

### 6.2 需要的图标清单

| 类别 | 图标 | 来源建议 |
|------|------|---------|
| **导航** | 地图、游戏手柄、书本、用户、设置、返回箭头 | Lucide |
| **游戏状态** | 心形（体力）、星星、金币、钻石、火焰（streak）| 自定义 SVG |
| **关卡** | 锁、解锁、横向三星、Boss 骷髅 | 自定义 SVG |
| **操作** | 播放音频、暂停、跳过、重试、分享、复制 | Lucide |
| **反馈** | 对勾（正确）、叉号（错误）、奖杯、徽章 | Lucide + 自定义 |
| **支付** | 信用卡、锁盾牌、皇冠（会员） | Lucide |
| **社交** | Facebook、Google、邮箱、外部链接 | 品牌图标 SVG |

### 6.3 自定义图标风格

- 线条粗细：2px stroke
- 圆角：2px radius
- 颜色：单色（跟随主题色 / 使用 `currentColor`）
- 尺寸：24 × 24 px 基准，可缩放
- 格式：SVG（内联使用）

---

## 七、游戏内贴图

### 7.1 迷你游戏贴图

| 游戏 | 贴图名称 | 数量 | 说明 |
|------|---------|------|------|
| Tone Sniper | tone-block-1.png ~ tone-block-4.png | 4 | 四个声调对应的方块颜色 |
| Tone Sniper | tone-arrow-up/down/left/right.png | 4 | 方向指示箭头 |
| Radical Blitz | radical-bomb.png | 1 | 炸弹道具 |
| Radical Blitz | radical-piece-{id}.png | ~50 | 常用偏旁部首贴图 |
| Pinyin Drift | car-player.png | 1 | 玩家赛车 |
| Pinyin Drift | road-obstacle.png | 3 | 路障 |
| Pinyin Drift | powerup-shield/slow/2x.png | 3 | 道具 |

> 偏旁部首贴图可以用 **HTML Canvas + 字体渲染** 动态生成，无需提前制作图片。仅在需要特殊视觉效果（如发光、手绘风格）时使用 Flux AI 生成。

### 7.2 关卡内贴图

| 贴图 | 数量 | 说明 |
|------|------|------|
| heart-full.png / heart-empty.png | 2 | 体力心形 |
| star-full.png / star-empty.png | 2 | 星级评分 |
| progress-bar-fill.png | 1 | 进度条填充（可 CSS 替代）|
| combo-fire-{1,2,3}.png | 3 | 连击效果火焰帧 |
| correct-checkmark.png | 1 | 答对动效（可用 Lottie 替代） |
| wrong-cross.png | 1 | 答错动效 |
| boss-hp-bar.png | 1 | Boss 血条边框 |

> 大部分可用 **CSS + SVG** 实现，仅少数需要贴图。

### 7.3 可用 CSS/HTML 实现的元素（不需要图片）

| 元素 | 实现方式 |
|------|---------|
| 进度条 | CSS `background` + `width` 动画 |
| 按钮（选项/CTA） | Tailwind CSS glass 组件 |
| 卡片 | CSS glassmorphism (`backdrop-blur`) |
| 动态汉字展示 | HTML `<span>` + `Noto Sans SC` 字体 + CSS 动画 |
| 拼音展示 | HTML 文本 + CSS 声调颜色 |
| 米字格 | CSS `border` + 对角线 `linear-gradient` |
| 星级展示 | SVG inline + CSS 颜色切换 |
| 数字计数器 | CSS counter / JS 数字滚动动画 |

---

## 八、徽章图标

### 8.1 资源清单

25 个徽章（详见 [成就系统](09-achievement-honor.md)），每个需要：
- 彩色版（已解锁）：64 × 64 px
- 灰色版（未解锁）：自动通过 CSS `filter: grayscale(1) opacity(0.4)` 实现

### 8.2 Flux AI Prompt（批量统一风格）

```
Batch prompt prefix:
Game achievement badge icon, circular medal design with metallic border, 
vibrant center illustration, clean flat style with subtle depth/shadow, 
game UI icon, polished and professional. 
64x64 pixels, transparent background.

示例：

Badge "Bước đầu tiên" (First Step):
{prefix} A golden footprint icon in the center, blue metallic circular border, 
sparkle effects. Achievement unlocked style.

Badge "Tốt nghiệp Pīnyīn" (Pinyin Graduate):
{prefix} A graduation cap with a tiny sound wave symbol, teal metallic border, 
celebratory confetti dots.

Badge "7 ngày liên tục" (7-day Streak):
{prefix} A flame icon with the number 7, orange-red gradient center, 
copper metallic border.
```

> 为保持一致性，建议**一次性生成全部 25 个徽章**，使用相同的 Style prefix 和 Negative prompt。

---

## 九、Landing Page 主视觉

### 9.1 资源

| 编号 | 文件名 | 用途 | 尺寸 |
|------|--------|------|------|
| HERO-01 | hero-visual.png | Landing Page 主图 | 1200 × 800 px |

### 9.2 Flux AI Prompt

```
Prompt:
A vibrant hero illustration for a Chinese language learning game. Shows a cheerful 
Vietnamese teen and a cute blue dragon mascot standing together on a colorful fantasy 
island. Behind them, a scrolling world map with islands, valleys, and castles is 
visible. Floating Chinese characters (你好, 学习) glow softly in the air. Game 
controllers, books, and sparkles surround them. Bright, energetic, inspiring. 
Modern game promotional art style. Sky blue, coral pink, golden yellow palette. 
Wide composition, 1200x800 pixels.

Negative prompt:
realistic photo, dark, gloomy, purple, low quality, blurry, text overlay, watermark
```

---

## 十、音效资源

### 10.1 音效清单

| 编号 | 文件名 | 场景 | 时长 | 来源建议 |
|------|--------|------|------|---------|
| SFX-01 | sfx-tap.mp3 | 通用按钮点击 | 0.1s | Freesound.org |
| SFX-02 | sfx-correct.mp3 | 答题正确 | 0.3s | Freesound.org |
| SFX-03 | sfx-wrong.mp3 | 答题错误 | 0.3s | Freesound.org |
| SFX-04 | sfx-combo.mp3 | 连击触发 | 0.5s | Freesound.org |
| SFX-05 | sfx-star-1.mp3 | 获得 1 星 | 0.5s | Freesound.org |
| SFX-06 | sfx-star-2.mp3 | 获得 2 星 | 0.7s | Freesound.org |
| SFX-07 | sfx-star-3.mp3 | 获得 3 星 | 1.0s | Freesound.org |
| SFX-08 | sfx-level-up.mp3 | 升级 | 1.5s | Freesound.org |
| SFX-09 | sfx-achievement.mp3 | 成就解锁 | 1.5s | Freesound.org |
| SFX-10 | sfx-coin.mp3 | 获得金币 | 0.3s | Freesound.org |
| SFX-11 | sfx-heart-lose.mp3 | 失去体力 | 0.5s | Freesound.org |
| SFX-12 | sfx-card-flip.mp3 | 闪卡翻转 | 0.3s | Freesound.org |
| SFX-13 | sfx-boss-appear.mp3 | Boss 出场 | 2.0s | Freesound.org |
| SFX-14 | sfx-boss-defeat.mp3 | Boss 击败 | 2.0s | Freesound.org |
| SFX-15 | sfx-streak.mp3 | Streak 延续提示 | 0.5s | Freesound.org |

### 10.2 音效规格

- 格式：MP3（通用兼容） + OGG（备用）
- 采样率：44.1kHz
- 比特率：128kbps
- 响度：统一标准化到 -14 LUFS
- MVP 无背景音乐（用户选择）

---

## 十一、TTS 语音

### 11.1 用途

- 词汇发音（汉字 + 拼音朗读）
- 过场动画角色对白
- 关卡内听力题目
- 迷你游戏内语音提示

### 11.2 生成方案

- **中文 TTS**：使用 Dify AI 工作流调用 TTS API（如 Azure Cognitive Services 或 阿里云 TTS）
- **越南语 TTS**：辅助翻译语音（可选，V2）

### 11.3 语音资源估算

| 类别 | 数量 | 说明 |
|------|------|------|
| 词汇发音 | ~200 条 | 所有教学词汇的标准发音 |
| 过场动画对白 | ~80 条 | 8 个动画的中文对话 |
| 听力题目音频 | ~60 条 | 听力挑战关卡的题目 |
| 例句朗读 | ~100 条 | 词库详情页例句 |

> 总计约 **440 条** TTS 语音。建议建立**语音资源表**（Excel/Sheet），列出：文本内容、语速、情感标记，然后批量通过 TTS API 生成。

---

## 十二、资源文件组织

### 12.1 建议目录结构

```
/public/assets/
├── maps/
│   ├── map-pinyin-islands.png
│   ├── map-hanzi-valley.png
│   ├── map-vocabulary-plains.png
│   ├── map-grammar-fortress.png
│   └── map-mini-game-island.png
├── characters/
│   ├── char-xiaolong-happy.png
│   ├── char-xiaolong-surprised.png
│   ├── char-meili-smile.png
│   └── ...
├── backgrounds/
│   ├── bg-vietnam-street.png
│   ├── bg-pinyin-beach.png
│   └── ...
├── avatars/
│   ├── avatar-panda.png
│   ├── avatar-dragon.png
│   └── ...
├── badges/
│   ├── badge-first-step.png
│   ├── badge-pinyin-graduate.png
│   └── ...
├── game/
│   ├── tone-block-1.png
│   ├── radical-bomb.png
│   ├── car-player.png
│   └── ...
├── ui/
│   ├── heart-full.svg
│   ├── heart-empty.svg
│   ├── star-full.svg
│   └── ...
├── audio/
│   ├── sfx/
│   │   ├── sfx-tap.mp3
│   │   ├── sfx-correct.mp3
│   │   └── ...
│   └── tts/
│       ├── vocab/
│       │   ├── ni3.mp3
│       │   ├── hao3.mp3
│       │   └── ...
│       ├── cutscene/
│       │   ├── cs01-line01.mp3
│       │   └── ...
│       └── listening/
│           ├── l01-q01.mp3
│           └── ...
└── marketing/
    ├── hero-visual.png
    └── share-poster-template.png
```

### 12.2 图片优化要求

| 格式 | 用途 | 压缩 |
|------|------|------|
| PNG | 角色立绘、有透明度的元素 | TinyPNG 压缩，保留透明 |
| WebP | 地图背景、过场背景 | 质量 80%，比 PNG 小 60-80% |
| SVG | UI 图标 | 已优化（SVGO） |
| MP3 | 音效、语音 | 128kbps |

- 所有图片提供 1x 和 2x 两套（或使用 `<picture>` + `srcset`）
- 大图（地图背景）考虑懒加载 + 渐进式 JPEG/WebP
- Cloudflare CDN 缓存：图片 max-age 30 天 + immutable

---

## 十三、Flux AI 生成通用注意事项

### 13.1 风格一致性

1. **所有 Prompt 统一包含**：
   - `game art style` 或 `anime/visual novel style`（根据场景选择）
   - 明确的色彩要求（禁止紫色）
   - `no text, no UI elements, no watermark`

2. **Negative prompt 必须包含**：
   ```
   realistic photo, purple, dark gloomy, low quality, blurry, text, 
   watermark, UI elements, NSFW
   ```

3. **批量生成建议**：
   - 同类资源（如 6 个头像）使用相同 Seed 或相似 Prompt 结构
   - 先生成 1 张满意后，复制风格到其余
   - 使用 Flux 的 img2img 功能以已生成图片为参考

### 13.2 后期处理

- 去除背景：使用 Remove.bg 或 Photoshop 抠图（角色立绘）
- 色彩校准：确保与设计系统色彩一致
- 尺寸裁切：统一裁切到规定尺寸
- 压缩优化：通过 TinyPNG / Squoosh 优化文件大小

---

## 十四、验收标准

| 项目 | 标准 |
|------|------|
| 世界地图 | 4 个区域地图背景完成，风格一致 |
| 角色立绘 | 6 个角色各表情变体完成，透明背景 |
| 过场背景 | 8 张场景背景完成 |
| 头像 | 12 个预设头像完成 |
| 图标 | 所有 UI 图标可用（SVG） |
| 徽章 | 25 个徽章彩色版完成 |
| 音效 | 15 个音效文件可播放 |
| TTS | 至少区域 1（拼音群岛）的全部语音完成 |
| 文件组织 | 按规定目录结构存放 |
| 图片优化 | 所有图片经过压缩，WebP 备选 |

---

*本文档列出 PlayLingo MVP 所需全部静态资源清单，并提供 Flux AI 生成 Prompt 模板及资源管理规范。*

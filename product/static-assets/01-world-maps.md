# 世界地图插画 — 详细规格与 Flux 提示词

> **关联文档**: [世界地图 PRD](../02-world-map.md) | [响应式布局](../10-responsive-layout.md)

---

## 总体说明

世界地图属于**非游戏模式**页面，H5 端竖屏纵向滚动浏览，PC 端居中限宽显示。因此地图背景为**竖向长条图**，H5 和 PC 共用同一套图片，PC 通过居中 + 深色两侧留白适配。

### 风格统一要求

- **俯视角手绘风插画地图**，类似《Kingdom Rush》/《旅行青蛙》的世界地图
- 融合东南亚热带色彩与中国文化元素
- **时尚年轻化**：色彩饱和度高、加入霓虹光效点缀、整体明亮温暖
- 每张图顶部和底部留出过渡区域（50px），便于区域拼接时自然过渡

---

## MAP-01: 拼音群岛（Quần đảo Pinyin）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `map-pinyin-islands.webp` + `map-pinyin-islands@2x.webp` |
| 尺寸 | 1x: 1080 × 3840 px / 2x: 2160 × 7680 px |
| 使用位置 | 世界地图页面 → 拼音群岛区域背景 |
| 承载关卡 | 20 个关卡节点（需沿路径预留 20 个圆形节点位置，每个约 180px 垂直间距） |
| 特殊节点 | 1 个迷你游戏岛（声调狙击手入口）+ 1 个 Boss 节点（第 20 关加大） |

### 使用场景

- H5 竖屏：用户从下往上滑动浏览，当前进度节点自动居中
- PC 横屏：居中显示在 max-width 640px 容器内，两侧深色留白背景
- 关卡节点以 UI 层叠加在背景图之上（非合成在图中）

### Flux 提示词

```
Prompt:
A vertical scrolling fantasy game world map of tropical "Pinyin Islands", 
top-down isometric perspective, hand-painted illustration style inspired by 
Kingdom Rush and Monument Valley.

Scene description: A chain of vibrant tropical islands connected by glowing 
wooden bridges, rope bridges and stone stepping paths over crystal turquoise 
ocean. Islands feature: coconut palm trees with neon-tipped leaves, colorful 
coral reefs visible through clear water, a lighthouse with a spinning beacon, 
thatched bamboo huts with lanterns, a small pirate ship docked at a wooden pier, 
waterfalls with rainbow mist, and a volcanic hill with gentle smoke at the top 
section (Boss area).

20 evenly spaced circular clearing spots along the winding path for game level 
markers. One special larger island with a game controller icon for the mini-game 
zone. The path flows from bottom to top.

Art style: Bright saturated colors, clean linework, slight cel-shading, 
warm golden sunlight, trendy Gen-Z aesthetic with subtle neon accents on key 
landmarks (glowing bridge rails, luminescent flowers). 

Color palette: Turquoise ocean, emerald green islands, sandy golden beaches, 
coral pink and electric blue accents, warm amber sunlight.

Technical: Vertical composition 1080x3840 pixels, seamless edges top and bottom 
for tiling, no text, no UI elements, no characters, game art style, 
high detail, clean.

Negative prompt:
realistic photograph, 3D render, dark moody, purple/violet dominant, 
modern buildings, cars, low quality, blurry, text, letters, numbers, 
UI elements, watermark, signature, border, frame
```

---

## MAP-02: 汉字谷地（Thung lũng Hán tự）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `map-hanzi-valley.webp` |
| 尺寸 | 1080 × 2880 px |
| 使用位置 | 世界地图页面 → 汉字谷地区域背景 |
| 承载关卡 | 15 个节点 + 1 个迷你游戏岛（部首大爆炸）+ 1 个 Boss 节点 |

### 使用场景

同 MAP-01，竖向滚动浏览，此区域在拼音群岛上方。

### Flux 提示词

```
Prompt:
A vertical scrolling fantasy game world map of "Hanzi Valley" (Chinese character 
valley), top-down isometric perspective, hand-painted illustration style.

Scene description: A deep mountain canyon with ancient Chinese-inspired 
architecture blended with fantasy elements. Features: multi-layered pagodas 
with glowing roof tiles, giant stone tablets covered in faintly glowing Chinese 
calligraphy, bamboo forests with fireflies, a jade-colored river winding through 
the valley, misty waterfalls cascading into luminescent pools, stone bridges 
with carved dragon railings, an ink brush monument, and a mysterious sealed 
cave entrance at the top (Boss area).

15 circular clearing spots along the winding canyon path. One special island 
area with a puzzle piece icon for the mini-game zone. Path flows bottom to top.

Art style: Hand-painted, warm earthy tones with mystical glow effects, 
East-meets-fantasy aesthetic, trendy with subtle neon jade accents on key 
landmarks (glowing calligraphy, luminescent water).

Color palette: Jade green, warm brown earth, misty white fog, amber gold 
lantern light, soft teal glow accents.

Technical: Vertical composition 1080x2880 pixels, seamless edges, no text, 
no UI, no characters, game art, high detail.

Negative prompt:
realistic photograph, 3D render, dark moody, purple dominant, modern city, 
low quality, blurry, text, letters, UI elements, watermark
```

---

## MAP-03: 词汇平原（Đồng bằng Từ vựng）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `map-vocabulary-plains.webp` |
| 尺寸 | 1080 × 2880 px |
| 使用位置 | 世界地图页面 → 词汇平原区域背景 |
| 承载关卡 | 15 个节点 + 1 个迷你游戏岛（拼音漂移）+ 1 个 Boss 节点 |

### 使用场景

同上，接在汉字谷地上方。

### Flux 提示词

```
Prompt:
A vertical scrolling fantasy game world map of "Vocabulary Plains", 
top-down isometric perspective, hand-painted illustration style.

Scene description: A wide open pastoral landscape with rolling green hills, 
golden wheat fields, wildflower meadows, and a bustling Vietnamese-Chinese 
fusion market town at the center. Features: colorful market stalls with 
hanging lanterns and neon signs, a stone bridge over a gentle river, windmills 
with spinning blades, cozy cottages with smoking chimneys, a hot air balloon 
floating above, haystacks, a small train track with a cute steam engine, 
and a large market hall at the top (Boss area).

15 circular clearing spots along rolling paths through fields. One special 
area with a racing flag icon for mini-game zone. Path flows bottom to top.

Art style: Hand-painted, warm pastoral with trendy pop color accents, 
inviting and cheerful, Gen-Z friendly with neon market signs and 
colorful bunting.

Color palette: Golden yellow wheat, grass green, sky blue, warm orange 
sunset accents, electric pink and cyan neon signs on market stalls.

Technical: Vertical composition 1080x2880 pixels, seamless edges, no text, 
no UI, no characters, game art, high detail.

Negative prompt:
realistic photograph, 3D render, dark, gloomy, purple, industrial, 
low quality, blurry, text, letters, UI elements, watermark
```

---

## MAP-04: 语法要塞（Pháo đài Ngữ pháp）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `map-grammar-fortress.webp` |
| 尺寸 | 1080 × 1920 px |
| 使用位置 | 世界地图页面 → 语法要塞区域背景（最终区域） |
| 承载关卡 | 10 个节点 + 1 个 Boss 节点（终极 Boss） |

### Flux 提示词

```
Prompt:
A vertical scrolling fantasy game world map of "Grammar Fortress", 
top-down isometric perspective, hand-painted illustration style.

Scene description: A grand castle complex built on a dramatic mountain 
plateau. Features: massive stone walls with glowing rune inscriptions, 
watchtowers with beacon fires, a grand library dome with floating books 
visible through glass ceiling, military training grounds with practice 
dummies shaped like Chinese characters, dragon statues guarding the main 
gate, a spiraling path ascending the mountain, red and gold banners 
fluttering, and a magnificent throne room entrance at the peak (final Boss).

10 circular clearing spots along the ascending spiral path. 
Path flows from bottom gate to mountain peak.

Art style: Hand-painted, epic and majestic, dramatic cloud formations, 
trendy with glowing rune effects and neon-lit torches.

Color palette: Steel gray stone, deep royal blue sky, warm amber torch 
light, crimson red banners, gold trim accents, subtle electric blue 
rune glow.

Technical: Vertical composition 1080x1920 pixels, seamless bottom edge, 
no text, no UI, no characters, game art, high detail.

Negative prompt:
realistic photograph, 3D render, dark horror, purple, modern, 
low quality, blurry, text, letters, UI elements, watermark
```

---

## MAP-05: 迷你游戏岛（通用图标）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `map-mini-game-island.webp` |
| 尺寸 | 512 × 512 px |
| 使用位置 | 世界地图上各区域内的迷你游戏入口节点 |

### 使用场景

作为地图上的特殊节点图标，比普通关卡节点大 2 倍，点击后进入小游戏选择。

### Flux 提示词

```
Prompt:
A cute floating fantasy island game icon, isometric top-down view, 
hand-painted style. A small colorful island with a giant arcade 
game cabinet, neon "PLAY" lights, palm trees, bouncing stars and 
sparkles around it. Floating in the sky with small clouds beneath. 
Vibrant, fun, eye-catching. Game UI element style.
512x512 pixels, transparent background.

Negative prompt:
realistic, dark, gloomy, low quality, text, watermark
```

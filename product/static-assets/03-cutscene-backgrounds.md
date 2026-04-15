# 过场动画背景 — 详细规格与 Flux 提示词

> **关联文档**: [过场动画 PRD](../05-cutscenes.md) | [响应式布局 PRD](../10-responsive-layout.md)

---

## 总体说明

过场动画背景用于**游戏模式横屏 16:9** 播放的全屏动画。角色立绘叠加在背景之上。所有背景均为**不透明**横版画面。

### 尺寸与适配

| 属性 | 值 |
|------|-----|
| 标准尺寸 | 1920 × 1080 px（16:9 横屏） |
| 格式 | WebP（质量 80）+ PNG 备用 |
| H5 与 PC | 共用同一张背景图，按设备长边等比缩放，短边居中裁剪 |
| 安全区 | 核心内容集中在中央 1600 × 900 区域内，边缘 160px 为安全裁剪区 |

### 风格统一要求

```
Style Prefix（所有过场背景共用）:
Digital illustration game background, wide cinematic 16:9 landscape 
composition, vibrant saturated colors, warm and inviting atmosphere, 
hand-painted semi-realistic style blending Vietnamese and Chinese cultural 
elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom 
glow effects, dreamy bokeh particles. High detail foreground, softer 
background layers with atmospheric perspective. Fantasy adventure game 
quality, story book illustration feel.

Negative Prefix:
realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, 
text, watermark, UI elements, characters, people
```

---

## BG-01: 拼音群岛概览（动画 #1 — 欢迎来到汉字大陆）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `bg-cutscene-pinyin-overview.webp` |
| 尺寸 | 1920 × 1080 px |
| 使用位置 | 过场动画 #1：首次进入拼音群岛，小龙迎接阿明 |
| 画面氛围 | 壮阔海洋、热带岛屿远景、冒险起点 |

### 使用场景
动画 #1 开场：阿明站在海边，远处是拼音群岛全貌。小龙从天而降，欢迎阿明来到汉字大陆。画面需要传达"冒险的起点"和"辽阔新世界"的感觉。

角色显示在画面左侧 1/3 处，右侧 2/3 需要展示壮阔的岛屿远景。

### Flux 提示词

```
Digital illustration game background, wide cinematic 16:9 landscape composition, vibrant saturated colors, warm and inviting atmosphere, hand-painted semi-realistic style blending Vietnamese and Chinese cultural elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom glow effects, dreamy bokeh particles. High detail foreground, softer background layers with atmospheric perspective. Fantasy adventure game quality, story book illustration feel.

A wide cinematic panoramic view of a magical tropical archipelago from a beach viewpoint, 16:9 composition. Foreground: golden sandy beach with soft waves lapping the shore, tropical plants and palm fronds framing the left edge. Middle ground: crystal turquoise ocean stretching out. Background: a chain of fantastical islands visible in the distance — each island has a distinct shape, with the largest featuring rock formations that subtly resemble Chinese Pinyin letters. Tiny glowing tone marks (ˉ ˊ ˇ ˋ) float above the islands like fireflies. The sky is a dramatic sunrise gradient from warm golden-orange on the horizon to soft blue above, with wispy clouds. Volumetric god rays streaming through cloud gaps. A faint rainbow arcs across the sky. Dreamy bokeh light particles in the air. The scene conveys wonder, adventure, and a new beginning.
1920x1080 pixels.

Negative prompt: realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, text, watermark, UI elements, characters, people
```

---

## BG-02: 声调山脚（动画 #2 — 声调的魔法）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `bg-cutscene-tone-mountain.webp` |
| 尺寸 | 1920 × 1080 px |
| 使用位置 | 过场动画 #2：拼音群岛第 18 关后，Boss 战前 |
| 画面氛围 | 神秘山脚、云雾缭绕、紧张感 |

### 使用场景
拼音群岛 Boss（声调守卫）出场前的剧情。阿明和小龙来到声调山脚下，山顶隐约可见声调守卫的剪影。云雾缭绕，远处有四声符号状的山峰。

角色在画面中央偏左，声调守卫的远景剪影需要出现在右上方。

### Flux 提示词

```
Digital illustration game background, wide cinematic 16:9 landscape composition, vibrant saturated colors, warm and inviting atmosphere, hand-painted semi-realistic style blending Vietnamese and Chinese cultural elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom glow effects, dreamy bokeh particles. High detail foreground, softer background layers with atmospheric perspective. Fantasy adventure game quality, story book illustration feel.

A dramatic mountain base scene, wide 16:9. Foreground: a rocky path winding upward from the bottom-left, with glowing Pinyin letters embedded in the stones. Middle ground: swirling mist and clouds wrapping around the mountain face. The mountain has four distinct peaks in the background, each shaped like one of the four Chinese tone marks — one flat, one rising, one dipping then rising (V-shape), one falling. The peaks glow faintly in different colors: blue, green, gold, red respectively. Near the summit of the highest peak: a dark silhouette of a warrior figure (the Tone Guardian) standing imposingly, backlit by dramatic orange light. Mystical atmosphere — volumetric fog, floating particles, subtle lightning in distant clouds. Color palette: cool misty blue-gray foreground transitioning to warm orange-gold at the mountain peaks. Ominous but exciting, a challenge ahead.
1920x1080 pixels.

Negative prompt: realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, text, watermark, UI elements, characters, people
```

---

## BG-03: 汉字源头书院（动画 #3 — 文字的秘密）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `bg-cutscene-hanzi-academy.webp` |
| 尺寸 | 1920 × 1080 px |
| 使用位置 | 过场动画 #3：首次进入汉字谷地，美丽老师讲解汉字起源 |
| 画面氛围 | 古老书院、神秘知性、象形文字壁画 |

### 使用场景
进入汉字谷地后的第一个场景。美丽老师在一座古老书院中，展示象形文字到现代汉字的演变（"日月山水"的象形演变）。小龙说"汉字是画出来的文字"。

角色出现在画面左右两侧对话，中间背景需要有足够的墙面/壁画空间用于叠加教学文字特效。

### Flux 提示词

```
Digital illustration game background, wide cinematic 16:9 landscape composition, vibrant saturated colors, warm and inviting atmosphere, hand-painted semi-realistic style blending Vietnamese and Chinese cultural elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom glow effects, dreamy bokeh particles. High detail foreground, softer background layers with atmospheric perspective. Fantasy adventure game quality, story book illustration feel.

Interior of an ancient Chinese academy/study hall, wide 16:9. A grand hall with tall wooden pillars and traditional upturned beam ceiling. The central back wall features a large stone mural/relief showing the evolution of Chinese characters — from ancient pictographs (sun as a circle, moon as a crescent, mountain as three peaks, water as wavy lines) carved into the stone with faint golden glow. Bookshelves line the side walls, filled with scrolls and ancient texts. A long wooden table in the center with ink brush sets, rice paper, and an open thread-bound book. Traditional Chinese paper lanterns hang from the ceiling, casting warm amber light. Dust particles float in sunbeams coming through lattice windows. A small incense brazier with wisps of smoke. The atmosphere is scholarly, ancient, reverent. Warm amber and jade green color palette.
1920x1080 pixels.

Negative prompt: realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, text, watermark, UI elements, characters, people
```

---

## BG-04: 汉字封印洞窟（动画 #4 — 古老的封印）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `bg-cutscene-hanzi-seal-cave.webp` |
| 尺寸 | 1920 × 1080 px |
| 使用位置 | 过场动画 #4：汉字谷地第 13 关后，汉字封印师 Boss 前 |
| 画面氛围 | 神秘博物馆/洞穴、古老封印、发光文字 |

### 使用场景
阿明进入一个博物馆般的洞穴深处，汉字封印师现身。墙壁上有被封印的汉字在发光，需要写出正确汉字才能解除封印。

角色在画面左侧，右侧需要有空间展现封印师出场的戏剧效果。

### Flux 提示词

```
Digital illustration game background, wide cinematic 16:9 landscape composition, vibrant saturated colors, warm and inviting atmosphere, hand-painted semi-realistic style blending Vietnamese and Chinese cultural elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom glow effects, dreamy bokeh particles. High detail foreground, softer background layers with atmospheric perspective. Fantasy adventure game quality, story book illustration feel.

Interior of a mystical museum-like cavern, wide 16:9. The cave walls are smooth and covered with sealed Chinese characters — each character is trapped behind a translucent magical barrier that glows with different colors (jade green, amber gold, sapphire blue). Some characters pulse brighter as if trying to break free. In the center of the cave: a large ancient stone altar with a luminous scroll floating above it, surrounded by orbiting seal symbols. The ceiling has crystal formations that refract light into rainbow patterns. Display pedestals along the walls (museum-like) hold ancient artifacts — bronze vessels with inscriptions, oracle bone fragments, bamboo slip bundles. A mystical purple-blue ambient light fills the lower half, while warm golden light emanates from the sealed characters above. Mysterious fog at ground level. The scene feels like entering a forbidden archive of ancient knowledge.
1920x1080 pixels.

Negative prompt: realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, text, watermark, UI elements, characters, people
```

---

## BG-05: 美食街（动画 #5 — 阿明来到美食街）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `bg-cutscene-food-street.webp` |
| 尺寸 | 1920 × 1080 px |
| 使用位置 | 过场动画 #5：首次进入词汇平原 |
| 画面氛围 | 热闹美食街、越南+中国风情混搭、日常生活感 |

### 使用场景
阿明来到一条越南风格的中国美食街，需要看懂中文菜单。街道两旁有各种餐馆和小吃摊，招牌用中文写着菜名。这是一个日常化的场景，衔接进入词汇学习。

角色在画面左侧 1/3 区域，右侧展示热闹的美食街景。

### Flux 提示词

```
Digital illustration game background, wide cinematic 16:9 landscape composition, vibrant saturated colors, warm and inviting atmosphere, hand-painted semi-realistic style blending Vietnamese and Chinese cultural elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom glow effects, dreamy bokeh particles. High detail foreground, softer background layers with atmospheric perspective. Fantasy adventure game quality, story book illustration feel.

A vibrant food street scene combining Vietnamese and Chinese culinary culture, wide 16:9. A bustling narrow street with restaurants and food stalls on both sides. Left side shops have Chinese menu boards with dishes written in Chinese characters: "牛肉粉" "春卷" "火锅" on colorful signboards with neon underglow. Right side: a Vietnamese pho stall with steaming bowls, a bánh mì cart, Chinese BBQ (char siu) hanging in windows. Red paper lanterns strung across the street. Steam and aroma wisps rising from food stalls. Customers' tables with dim sum baskets and chopsticks visible (but no people shown). Warm evening lighting — golden street lamps mixed with colorful neon restaurant signs. Vietnamese tiles on the ground, Chinese-style wooden shop fronts above. Tropical plants in pots along the street. Mouthwatering, lively, cultural fusion atmosphere.
1920x1080 pixels.

Negative prompt: realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, text, watermark, UI elements, characters, people
```

---

## BG-06: 集市广场（动画 #6 — 集市的考验）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `bg-cutscene-market-square.webp` |
| 尺寸 | 1920 × 1080 px |
| 使用位置 | 过场动画 #6：词汇平原第 13 关后，集市掌柜 Boss 前 |
| 画面氛围 | 精明商贩、热闹集市、买卖考验 |

### 使用场景
阿明来到集市的中心广场，集市掌柜 Boss 准备考核。场景需要体现"量词+数字+价格"的商业氛围。摊位上有各种货物，价格标签用中文标注。

角色在画面两侧对话，中间是集市广场。

### Flux 提示词

```
Digital illustration game background, wide cinematic 16:9 landscape composition, vibrant saturated colors, warm and inviting atmosphere, hand-painted semi-realistic style blending Vietnamese and Chinese cultural elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom glow effects, dreamy bokeh particles. High detail foreground, softer background layers with atmospheric perspective. Fantasy adventure game quality, story book illustration feel.

A bustling fantasy marketplace central square, wide 16:9. An open area surrounded by colorful merchant stalls and shops. Each stall displays different goods: fruits with Chinese price tags, silk fabric rolls, ceramic pots, herbal medicine jars. A large abacus-shaped fountain in the center square. Merchant stalls have ornate awnings in red, gold, and jade green. Price tags and signs in Chinese calligraphy with golden frames. Stacks of gold coins and counting beads scattered decoratively. A large weighing scale balanced on a wooden post. String of calculating beads (abacus beads) as decorative garlands above. Warm late-afternoon golden light. Lanterns beginning to glow as evening approaches. Cultural fusion of Vietnamese market handicrafts and Chinese merchant aesthetics. Prosperous, busy, a place of commerce and challenge.
1920x1080 pixels.

Negative prompt: realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, text, watermark, UI elements, characters, people
```

---

## BG-07: 语法要塞大门（动画 #7 — 组合的力量）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `bg-cutscene-grammar-gate.webp` |
| 尺寸 | 1920 × 1080 px |
| 使用位置 | 过场动画 #7：首次进入语法要塞 |
| 画面氛围 | 壮观科幻、中式机械、语法结构可视化 |

### 使用场景
进入最终区域——语法要塞。小龙演示"单独的词→组成句子→有了力量"的概念。大门上有旋转的句型结构图（主语-谓语-宾语），暗示最终挑战。

角色在画面中央偏左，右侧展示宏伟的要塞大门。

### Flux 提示词

```
Digital illustration game background, wide cinematic 16:9 landscape composition, vibrant saturated colors, warm and inviting atmosphere, hand-painted semi-realistic style blending Vietnamese and Chinese cultural elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom glow effects, dreamy bokeh particles. High detail foreground, softer background layers with atmospheric perspective. Fantasy adventure game quality, story book illustration feel.

A massive futuristic-ancient Chinese fortress gate, wide 16:9 cinematic. A colossal wall stretching across the frame, combining ancient Chinese Great Wall architecture with futuristic technology — stone blocks with glowing circuit patterns, traditional upturned roof tiles made of holographic material. The central gate is enormous with two red doors featuring golden dragon knockers. Above the gate: a holographic projection showing rotating Chinese sentence structure diagrams (Subject-Verb-Object patterns) in glowing blue light. Guard towers with searchlight beams. Dramatic sky with golden light breaking through clouds above the fortress. Individual Chinese characters floating in the air on the left side (单独), forming into complete sentences on the right side (组合) — visualizing the "words combine into sentences" concept. Red, gold, steel blue color scheme.
1920x1080 pixels.

Negative prompt: realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, text, watermark, UI elements, characters, people
```

---

## BG-08: 语法王座大厅（动画 #8 — 最终对话）

### 基本信息

| 属性 | 值 |
|------|-----|
| 文件名 | `bg-cutscene-grammar-throne.webp` |
| 尺寸 | 1920 × 1080 px |
| 使用位置 | 过场动画 #8：语法要塞第 8 关后，语法将军最终 Boss 前 |
| 画面氛围 | 威严恢宏、决战前夜、史诗级场景 |

### 使用场景
要塞最深处的王座大厅。语法将军用连续的中文句子质问阿明，阿明需要理解并回答。这是最终对决前的紧张对峙。语法将军在画面右侧（立绘叠加），阿明在左侧进场。

角色在画面左右两侧对峙。

### Flux 提示词

```
Digital illustration game background, wide cinematic 16:9 landscape composition, vibrant saturated colors, warm and inviting atmosphere, hand-painted semi-realistic style blending Vietnamese and Chinese cultural elements. Trendy Gen-Z aesthetic — subtle neon accent lights, soft bloom glow effects, dreamy bokeh particles. High detail foreground, softer background layers with atmospheric perspective. Fantasy adventure game quality, story book illustration feel.

An epic throne hall interior, wide 16:9 cinematic. Grand Chinese palace hall reimagined with sci-fi technology. Massive red pillars with golden dragon carvings line both sides, ascending to a high vaulted ceiling with holographic Chinese grammar formulas floating in the air (sentence patterns, measure words, complement structures displayed as glowing diagrams). At the far end: an imposing throne on elevated steps, made of stacked ancient books and scrolls forming a chair shape, with energy shields orbiting around it. Red carpet runner leading to the throne. Floor is polished dark marble reflecting the holograms. Dramatic backlighting behind the throne — golden rays mixed with crimson energy. Side alcoves display trophy scrolls. The atmosphere is tense, epic, final-battle energy. Rich red, gold, and deep blue color palette.
1920x1080 pixels.

Negative prompt: realistic photo, dark gloomy horror, desaturated, ugly, low quality, blurry, text, watermark, UI elements, characters, people
```

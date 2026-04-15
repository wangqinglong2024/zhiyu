# 角色立绘 — 详细规格与 Flux 提示词

> **关联文档**: [过场动画 PRD](../05-cutscenes.md) | [关卡系统](../03-level-system.md)

---

## 总体说明

角色立绘用于**游戏模式**（横屏 16:9）的过场动画和 Boss 战场景。立绘叠加在横屏背景上，居左或居右显示。所有立绘需要**透明背景**。

### 风格统一要求

所有角色共享以下风格前缀（Style Prefix），确保 Flux 批量生成时视觉风格一致：

```
Style Prefix（所有角色 Prompt 前必须加上）:
Modern anime-inspired game character illustration, full body standing pose, 
transparent background, clean cel-shaded style with soft gradient shading, 
vibrant saturated colors, warm studio lighting, consistent art style. 
Trendy Gen-Z character design — fashionable clothing details, expressive 
features, dynamic pose energy. Visual novel / gacha game character quality.
High resolution, detailed but clean linework, slight glow rim lighting.

Negative Prefix（所有角色共用）:
realistic photo, western cartoon, chibi/SD proportions (unless specified), 
dark gloomy, purple dominant, low quality, blurry, 
background scenery, text, watermark, multiple characters
```

### 尺寸与适配

| 属性 | 值 |
|------|-----|
| 单图尺寸 | 768 × 1536 px（1:2 比例，透明背景 PNG） |
| 游戏内显示 | 按 16:9 画布高度等比缩放，立绘高度 ≈ 画布高度的 70-85% |
| H5 与 PC | 共用同一套立绘，无需单独适配 |

---

## CHAR-01: 阿明（Minh）— 越南青年主角

### 角色设定
- 20 岁越南青年，主角
- 穿着：时尚街头风——白色 oversized T 恤配小星星 logo、浅蓝色工装夹克、卷边牛仔裤、白色 Air Force 运动鞋
- 短黑发、有点翘的刘海，浓眉大眼，阳光自信
- 全程出场（8 段过场动画 + Boss 战）

### 表情变体

| 变体 | 文件名 | 表情描述 | 使用场景 |
|------|--------|---------|---------|
| 开心 | `char-minh-happy.png` | 灿烂笑容 + 竖大拇指 | 通关成功、剧情积极时刻 |
| 惊讶 | `char-minh-surprised.png` | 嘴巴微张 + 眼睛睁大 | 发现新区域、遇到 Boss |
| 思考 | `char-minh-thinking.png` | 手托下巴 + 微皱眉 | 教学阶段、难题出现 |
| 自信 | `char-minh-confident.png` | 双手叉腰 + 微笑 + 眼神坚定 | Boss 战前、挑战开始 |

### Flux 提示词 — 阿明（开心）

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design — fashionable clothing details, expressive features, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

A Vietnamese young man, age 20, trendy streetwear fashion: white oversized t-shirt with a small golden star logo on chest, light blue utility jacket with rolled sleeves, cuffed dark denim jeans, white sneakers. Short black hair with slightly messy styling and swept bangs, thick eyebrows, warm brown eyes, bright cheerful smile showing teeth, giving a thumbs up with right hand. Energetic and relatable protagonist.
Full body standing pose, slight forward lean, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, chibi/SD proportions, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

### Flux 提示词 — 阿明（惊讶）

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design — fashionable clothing details, expressive features, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Vietnamese young man character (Minh), same outfit (white t-shirt, blue jacket, jeans, white sneakers). Surprised expression: mouth slightly open in an "O" shape, eyes wide with sparkle effects, eyebrows raised high, one hand raised near face in shock gesture. Body leaning back slightly.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, chibi/SD proportions, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

> 思考、自信变体同理：保持服装完全一致，只改变表情和肢体动作。

---

## CHAR-02: 小龙（Xiǎo Lóng）— 可爱龙精灵引导角色

### 角色设定
- Q 版可爱中国龙精灵，chibi 大头比例
- 天蓝色鳞片 + 金色肚皮，短圆角、大圆闪亮眼睛
- 小翅膀不断扇动，尾巴末端有小火焰
- 漂浮在空中，教学引导角色，全程出场

### 表情变体

| 变体 | 文件名 | 表情描述 | 使用场景 |
|------|--------|---------|---------|
| 开心 | `char-xiaolong-happy.png` | 大笑 + 眼睛弯月形 + 挥爪 | 答对、剧情欢乐 |
| 讲解 | `char-xiaolong-explain.png` | 一只爪指向前方 + 认真表情 | 教学引导 |
| 鼓励 | `char-xiaolong-cheer.png` | 双爪举高 + 闪亮眼睛 + 火焰加大 | 连击、高分 |
| 紧张 | `char-xiaolong-nervous.png` | 冒汗 + 缩身 + 眼睛变小圆点 | Boss 出场、危险时刻 |

### Flux 提示词 — 小龙（开心）

```
Modern anime-inspired game character illustration, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Adorable chibi/super-deformed proportions. Visual novel / gacha game mascot quality. High resolution, detailed but clean linework, slight glow rim lighting.

A cute chibi Chinese dragon mascot character, large head and small body proportions (super-deformed style), sky blue smooth scales covering body, golden/cream belly patch, short rounded horns on head, very large round sparkly eyes with star-shaped catchlights, wide joyful open-mouth smile showing tiny cute fangs, small bat-like wings flapping, stubby arms waving happily, tail tip has a small warm flame. Floating in air with tiny sparkle particles around. Adorable and friendly game mascot.
Transparent background, 768x1536 pixels.

Negative prompt: realistic dragon, scary, western dragon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

---

## CHAR-03: 美丽老师（Měi Lì）— 汉字谷地 NPC

### 角色设定
- 25 岁中国女教师，温柔知性
- 穿着：现代改良旗袍上衣（天蓝底 + 白云纹）+ 深色长裙 + 绣花布鞋
- 长直黑发 + 古典发簪、可选圆框眼镜、手持打开的线装书
- 出场于动画 #3、#4

### 表情变体

| 变体 | 文件名 | 使用场景 |
|------|--------|---------|
| 微笑 | `char-meili-smile.png` | 日常讲解 |
| 讲解 | `char-meili-explain.png` | 教学重点 |
| 赞许 | `char-meili-approve.png` | 玩家答对 |
| 严肃 | `char-meili-serious.png` | Boss 前警告 |

### Flux 提示词 — 美丽老师（微笑）

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design — fashionable clothing details, expressive features, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

A kind young Chinese woman teacher, age 25, wearing a modern cheongsam-inspired blouse (sky blue fabric with delicate white cloud patterns, mandarin collar) paired with a dark navy A-line skirt and embroidered flat shoes. Long straight black hair flowing past shoulders with an elegant jade hairpin. Optional round thin-frame glasses. Warm gentle smile, holding an open traditional thread-bound book in left hand, right hand gesturing gracefully. Elegant, intellectual, approachable.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, chibi/SD proportions, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters, revealing clothing, sexy
```

---

## CHAR-04 ~ CHAR-07: Boss 角色

### CHAR-04: 声调守卫（Boss 1 — 拼音群岛）

| 属性 | 描述 |
|------|------|
| 设定 | 穿着发光铠甲的武士，头盔上有四声符号装饰 |
| 表情 | 威严、生气、被击败（3 变体） |
| 出场 | 动画 #2、拼音群岛 Boss 关 |

#### CHAR-04a: 声调守卫 — 威严（默认）

| 文件名 | `char-tone-guardian-stern.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

A fierce fantasy warrior guardian character, "Tone Guardian", wearing glowing translucent armor with Chinese tone mark symbols (ˉ ˊ ˇ ˋ) engraved and glowing on the chest plate. Samurai-inspired helmet with a horn-like crest shaped like a rising tone mark. Holding a large energy sword that emits sound wave visual effects. Strong muscular build, stern authoritative expression with narrowed eyes and firm jaw, legs planted wide in battle stance. Armor has neon blue and gold color scheme. Imposing but not evil.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-04b: 声调守卫 — 生气

| 文件名 | `char-tone-guardian-angry.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Tone Guardian warrior character (same armor, same helmet, same weapon design). Angry attack expression: eyebrows furrowed deeply, mouth open in a battle shout, eyes glowing with intense blue light. Sword raised high above head in attack pose, sound wave energy crackling along the blade. Armor tone marks glowing brighter red. Aggressive forward-leaning battle stance with one foot forward. Visible energy aura around body.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-04c: 声调守卫 — 被击败

| 文件名 | `char-tone-guardian-defeated.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Tone Guardian warrior character (same armor design). Defeated expression: kneeling on one knee, sword planted in ground for support, helmet cracked with light leaking through cracks. Tone mark symbols on armor flickering and fading. Head bowed slightly, expression of respectful acknowledgment — a faint impressed smile. Armor dimmed, energy dissipating as fading blue particles. Dignified defeat, not humiliated.
Full body pose (kneeling), transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters

#### CHAR-04b: 声调守卫 — 生气

| 文件名 | `char-tone-guardian-angry.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Tone Guardian warrior character (same armor, same helmet, same weapon design). Angry attack expression: eyebrows furrowed deeply, mouth open in a battle shout, eyes glowing with intense blue light. Sword raised high above head in attack pose, sound wave energy crackling along the blade. Armor tone marks glowing brighter red. Aggressive forward-leaning battle stance with one foot forward. Visible energy aura around body.
Full body standing pose, transparent background, 768x1536 pixels.
#### CHAR-05a: 汉字封印师 — 神秘（默认）

| 文件名 | `char-hanzi-sealer-mystery.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

A mysterious ancient seal master character, "Hanzi Sealer", wearing a flowing traditional Hmong-inspired embroidered robe in deep indigo with silver geometric patterns. Long white beard, ancient wise face with glowing jade-green eyes, a knowing enigmatic half-smile. Holding a luminous scroll that unfurls with floating Chinese characters swirling around it. A mystical aura of golden calligraphy surrounds the character. Staff with jade orb in other hand. Enigmatic and powerful, not evil but challenging.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-05b: 汉字封印师 — 攻击

| 文件名 | `char-hanzi-sealer-attack.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Hanzi Sealer character (same robe, same beard, same staff design). Attack casting expression: eyes glowing bright gold, mouth chanting ancient words, both arms raised commanding the scroll which unfurls explosively. Chinese characters flying outward from the scroll like projectiles, each character surrounded by golden seal energy. Robe billowing from magical wind force. Staff jade orb pulsing with green light. Powerful spell-casting dynamic pose.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-05c: 汉字封印师 — 被击败

| 文件名 | `char-hanzi-sealer-defeated.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Hanzi Sealer character (same robe design). Defeated expression: sitting on ground cross-legged, scroll rolled up beside him, staff laid down. Head slightly tilted with a gentle approving smile and closed eyes. A few remaining Chinese characters float gently around him, fading into golden dust. Hands resting on knees in meditative pose. Peaceful acceptance of defeat, impressed by the challenger. Magical aura dimmed to a soft warm glow.
Full body pose (sitting), transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple charactersn warrior character (same armor design). Defeated expression: kneeling on one knee, sword planted in ground for support, helmet cracked with light leaking through cracks. Tone mark symbols on armor flickering and fading. Head bowed slightly, expression of respectful acknowledgment — a faint impressed smile. Armor dimmed, energy dissipating as fading blue particles. Dignified defeat, not humiliated.
Full body pose (kneeling), transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

### CHAR-05: 汉字封印师（Boss 2 — 汉字谷地）

| 属性 | 描述 |
|------|------|
| 设定 | 古老神秘的封印师，披苗族风格长袍，手持发光文字卷轴 |
#### CHAR-06a: 集市掌柜 — 狡猾（默认）

| 文件名 | `char-market-master-sly.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

A shrewd market merchant boss character, "Market Master", a middle-aged Vietnamese-Chinese man wearing a traditional merchant vest over a white mandarin-collar shirt, dark pants, cloth apron with golden dragon embroidery. Holding a large Chinese abacus in one hand, other hand making a counting gesture. Shrewd narrow eyes with a sly confident grin, thin mustache. Surrounded by floating price tags and coin visual effects. Stacks of goods visible at his feet. Tricky but fair opponent.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-06b: 集市掌柜 — 得意

| 文件名 | `char-market-master-smug.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Market Master character (same vest, shirt, apron, abacus design). Smug triumphant expression: eyes closed in a self-satisfied squint, wide grin showing teeth, one hand on hip and other hand shaking the abacus smugly. Chin tilted upward in arrogant pose. Gold coins floating around him in a shower, golden aura of wealth. Posture leaning back confidently. He thinks the player cannot beat him.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-06c: 集市掌柜 — 被击败

| 文件名 | `char-market-master-defeated.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Market Master character (same outfit design). Defeated expression: jaw dropped open in comedic shock, eyes wide and round, abacus dropped and beads scattering. Both hands up near face in a "I can't believe it" gesture. Sweat drops on forehead. Price tags around him showing discount marks. A single gold coin spinning on the ground at his feet. Comical defeat, not angry — grudgingly impressed. Good-natured sore loser.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple charactersg pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-05b: 汉字封印师 — 攻击

| 文件名 | `char-hanzi-sealer-attack.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.
#### CHAR-07a: 语法将军 — 冷酷（默认）

| 文件名 | `char-grammar-general-cold.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

The final boss character, "Grammar General", a commanding military general wearing a fusion of ancient Chinese armor and futuristic tech-armor. Gold and crimson color scheme with glowing circuit-like patterns on armor plates. Flowing red cape, large shoulder pauldrons with Chinese character "文" (literature) embossed. Holding a massive book-shaped energy shield in one hand and a glowing sentence-diagram sword in the other. Stern cold expression, sharp calculating eyes looking down at the viewer, hair tied back in a warrior topknot. Imposing, powerful, the ultimate challenge.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-07b: 语法将军 — 战斗

| 文件名 | `char-grammar-general-battle.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Grammar General character (same armor, cape, pauldrons design). Dynamic battle expression: eyes blazing with crimson energy, teeth gritted in fierce determination, cape billowing dramatically behind. Sword swung forward in powerful attack arc leaving a trail of glowing Chinese sentence diagrams (Subject-Verb-Object floating in the slash trail). Shield held at angle deflecting incoming attacks. Armor circuit patterns fully illuminated. Ground-cracking power stance with forward momentum. Epic final boss battle energy.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-07c: 语法将军 — 被击败

| 文件名 | `char-grammar-general-defeated.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Grammar General character (same armor design). Noble defeat pose: kneeling on one knee with sword planted tip-down as support, shield lowered to side. Armor circuit patterns flickering and fading. Cape torn slightly. Expression is one of deep respect — a genuine proud smile with closed eyes, nodding in acknowledgment. One hand placed over chest in a salute gesture. A few Chinese grammar formula holograms dissolving peacefully around him. Dignified and honorable defeat, the general has found a worthy successor.
Full body pose (kneeling), transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple charactersired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Hanzi Sealer character (same robe design). Defeated expression: sitting on ground cross-legged, scroll rolled up beside him, staff laid down. Head slightly tilted with a gentle approving smile and closed eyes. A few remaining Chinese characters float gently around him, fading into golden dust. Hands resting on knees in meditative pose. Peaceful acceptance of defeat, impressed by the challenger. Magical aura dimmed to a soft warm glow.
Full body pose (sitting), transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

### CHAR-06: 集市掌柜（Boss 3 — 词汇平原）

| 属性 | 描述 |
|------|------|
| 设定 | 精明的越南华裔商贩老板，围裙 + 算盘 + 狡黠笑容 |
| 表情 | 狡猾、得意、被击败（3 变体） |
| 出场 | 动画 #6、词汇平原 Boss 关 |

#### CHAR-06a: 集市掌柜 — 狡猾（默认）

| 文件名 | `char-market-master-sly.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

A shrewd market merchant boss character, "Market Master", a middle-aged Vietnamese-Chinese man wearing a traditional merchant vest over a white mandarin-collar shirt, dark pants, cloth apron with golden dragon embroidery. Holding a large Chinese abacus in one hand, other hand making a counting gesture. Shrewd narrow eyes with a sly confident grin, thin mustache. Surrounded by floating price tags and coin visual effects. Stacks of goods visible at his feet. Tricky but fair opponent.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-06b: 集市掌柜 — 得意

| 文件名 | `char-market-master-smug.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Market Master character (same vest, shirt, apron, abacus design). Smug triumphant expression: eyes closed in a self-satisfied squint, wide grin showing teeth, one hand on hip and other hand shaking the abacus smugly. Chin tilted upward in arrogant pose. Gold coins floating around him in a shower, golden aura of wealth. Posture leaning back confidently. He thinks the player cannot beat him.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-06c: 集市掌柜 — 被击败

| 文件名 | `char-market-master-defeated.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Market Master character (same outfit design). Defeated expression: jaw dropped open in comedic shock, eyes wide and round, abacus dropped and beads scattering. Both hands up near face in a "I can't believe it" gesture. Sweat drops on forehead. Price tags around him showing discount marks. A single gold coin spinning on the ground at his feet. Comical defeat, not angry — grudgingly impressed. Good-natured sore loser.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

### CHAR-07: 语法将军（Boss 4 — 语法要塞）

| 属性 | 描述 |
|------|------|
| 设定 | 威严军装将军，融合中国古代盔甲与未来科技风 |
| 表情 | 冷酷、战斗、被击败（3 变体） |
| 出场 | 动画 #8、语法要塞 Boss 关（最终 Boss） |

#### CHAR-07a: 语法将军 — 冷酷（默认）

| 文件名 | `char-grammar-general-cold.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

The final boss character, "Grammar General", a commanding military general wearing a fusion of ancient Chinese armor and futuristic tech-armor. Gold and crimson color scheme with glowing circuit-like patterns on armor plates. Flowing red cape, large shoulder pauldrons with Chinese character "文" (literature) embossed. Holding a massive book-shaped energy shield in one hand and a glowing sentence-diagram sword in the other. Stern cold expression, sharp calculating eyes looking down at the viewer, hair tied back in a warrior topknot. Imposing, powerful, the ultimate challenge.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-07b: 语法将军 — 战斗

| 文件名 | `char-grammar-general-battle.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Grammar General character (same armor, cape, pauldrons design). Dynamic battle expression: eyes blazing with crimson energy, teeth gritted in fierce determination, cape billowing dramatically behind. Sword swung forward in powerful attack arc leaving a trail of glowing Chinese sentence diagrams (Subject-Verb-Object floating in the slash trail). Shield held at angle deflecting incoming attacks. Armor circuit patterns fully illuminated. Ground-cracking power stance with forward momentum. Epic final boss battle energy.
Full body standing pose, transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

#### CHAR-07c: 语法将军 — 被击败

| 文件名 | `char-grammar-general-defeated.png` |

```
Modern anime-inspired game character illustration, full body standing pose, transparent background, clean cel-shaded style with soft gradient shading, vibrant saturated colors, warm studio lighting, consistent art style. Trendy Gen-Z character design, dynamic pose energy. Visual novel / gacha game character quality. High resolution, detailed but clean linework, slight glow rim lighting.

Same Grammar General character (same armor design). Noble defeat pose: kneeling on one knee with sword planted tip-down as support, shield lowered to side. Armor circuit patterns flickering and fading. Cape torn slightly. Expression is one of deep respect — a genuine proud smile with closed eyes, nodding in acknowledgment. One hand placed over chest in a salute gesture. A few Chinese grammar formula holograms dissolving peacefully around him. Dignified and honorable defeat, the general has found a worthy successor.
Full body pose (kneeling), transparent background, 768x1536 pixels.

Negative prompt: realistic photo, western cartoon, dark gloomy, purple dominant, low quality, blurry, background scenery, text, watermark, multiple characters
```

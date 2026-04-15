# 用户头像 — 详细规格与 Flux 提示词

> **关联文档**: [用户系统 PRD](../01-user-system.md) | [成就荣誉 PRD](../09-achievement-honor.md)

---

## 总体说明

用户头像用于**非游戏模式**的 UI 界面——个人中心、排行榜、评论区等。用户注册时从 12 个预设头像中选择，也可后续在设置中更换。

### 尺寸与适配

| 属性 | 值 |
|------|-----|
| 原始尺寸 | 256 × 256 px（正方形） |
| 显示方式 | 圆形裁剪（CSS `border-radius: 50%`）|
| 格式 | WebP（质量 90，需保留透明背景） |
| H5 与 PC | 共用同一套头像，按 UI 组件大小缩放（32-64px）|

### 风格统一要求

```
Style Prefix（所有头像共用）:
Cute kawaii-style animal portrait icon, face and upper body only, centered 
composition, circular safe area, soft pastel background gradient, clean 
vector-like cel-shaded illustration, large expressive eyes with sparkle 
catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle 
decorations. Friendly, approachable, appealing to young adults.
256x256 pixels, transparent background outside the circular area.

Negative Prefix:
realistic photo, scary, dark, ugly, full body, multiple animals, text, 
watermark, low quality, blurry, complex background
```

---

## AVA-01 ~ AVA-12: 预设头像

### AVA-01: 熊猫（Panda）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-panda.webp` |
| 描述 | 微笑可爱大熊猫，吃竹子，中国文化象征 |
| 默认 | ✅ 注册时的默认首选头像 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute baby panda face portrait, round fluffy face, classic black and white coloring, big round sparkling black eyes, tiny pink tongue peeking out, holding a small bamboo branch near mouth, happy content expression. Soft mint green pastel background gradient with tiny star sparkles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-02: 小龙（Dragon）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-dragon.webp` |
| 描述 | 与游戏角色小龙呼应的可爱龙脸 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute Chinese dragon face portrait, sky blue smooth scales, small golden horns, large round sparkly eyes with star catchlights, wide friendly smile showing tiny fangs, small whiskers, wispy clouds around face. Soft warm golden-yellow pastel background gradient with floating sparkle particles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-03: 橘猫（Cat）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-cat.webp` |
| 描述 | 慵懒可爱橘猫，东亚流行萌宠 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute orange tabby cat face portrait, fluffy round face, warm orange and cream striped fur, half-closed contented eyes with a peaceful smile, tiny pink nose, small pointed ears with pink insides. Soft lavender pastel background gradient with tiny heart sparkles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-04: 兔子（Rabbit）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-rabbit.webp` |
| 描述 | 可爱白兔，越南和中国文化中均受喜爱 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute white rabbit face portrait, fluffy soft white fur, long upright ears with pink inner lining, big round pink-tinted eyes with sparkle catchlights, tiny twitching pink nose, small happy mouth. Soft pink pastel background gradient with floating cherry blossom petals.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-05: 柴犬（Dog）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-shiba.webp` |
| 描述 | 微笑柴犬，互联网文化代表 meme 宠物 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute Shiba Inu dog face portrait, fluffy cream and gold fur, characteristic Shiba smile with squinted happy eyes, pointed ears, round face. Classic "doge" style cheerful expression. Soft warm peach pastel background gradient with tiny paw print sparkles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-06: 凤凰（Phoenix）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-phoenix.webp` |
| 描述 | 传说瑞鸟，中越共有神话元素，华丽尾羽 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute stylized phoenix bird face portrait, elegant head with ornate golden crown feathers flowing upward, warm gradient plumage from crimson red to golden orange to sunshine yellow. Large kind eyes with flame-shaped catchlights, small refined beak. Soft warm coral-red pastel background gradient with tiny flame sparkle particles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-07: 猴子（Monkey）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-monkey.webp` |
| 描述 | 调皮金丝猴，致敬孙悟空 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute golden snub-nosed monkey face portrait, fluffy golden-orange fur framing a pale pink face, large mischievous bright eyes with star catchlights, playful grin, small upturned nose. A tiny golden headband (nod to Sun Wukong) sits on forehead. Soft warm amber pastel background gradient with cloud sparkle effects.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-08: 锦鲤（Koi）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-koi.webp` |
| 描述 | 好运象征，红白锦鲤 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute stylized koi fish face portrait, viewed from a slight angle, round body visible, beautiful red and white (kohaku) pattern, large gentle eyes with water-ripple catchlights, small "O" shaped mouth as if blowing bubbles, flowing elegant fins. Soft cool aqua-blue pastel background gradient with tiny bubble sparkles and water ripple effects.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-09: 仙鹤（Crane）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-crane.webp` |
| 描述 | 优雅丹顶鹤，长寿吉祥象征 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute stylized red-crowned crane face portrait, elegant white plumage, distinctive red crown patch on top of head, long slender neck slightly curved, kind wise eyes with gentle expression, slender beak. Graceful and dignified but approachable. Soft cool icy-blue pastel background gradient with tiny snowflake sparkles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-10: 老虎（Tiger）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-tiger.webp` |
| 描述 | 威风小老虎，可爱版中国虎 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute baby tiger face portrait, fluffy round face, classic orange and black stripe pattern, white chin and cheeks, large round amber eyes with bold star catchlights, tiny pink nose, confident friendly smile showing no teeth. The Chinese character "王" (king) subtly visible on forehead in the stripe pattern. Soft warm orange-gold pastel background gradient with tiny lightning bolt sparkles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-11: 蛇（Snake）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-snake.webp` |
| 描述 | 可爱花蛇，2025 蛇年 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute stylized snake face portrait, coiled body visible around the face area, smooth jade-green scales with subtle golden pattern accents, large round friendly eyes with diamond-shaped pupils and sparkle catchlights, tiny flickering tongue, wearing a miniature flower crown. Not scary at all — adorable and charming. Soft cool jade-green pastel background gradient with tiny leaf sparkles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

### AVA-12: 月兔（Moon Rabbit）

| 属性 | 值 |
|------|-----|
| 文件名 | `avatar-moonrabbit.webp` |
| 描述 | 中秋月兔，捣年糕的月亮兔子 |

```
Cute kawaii-style animal portrait icon, face and upper body only, centered composition, circular safe area, soft pastel background gradient, clean vector-like cel-shaded illustration, large expressive eyes with sparkle catchlights. Trendy Gen-Z aesthetic — subtle neon glow rim, tiny star/sparkle decorations. Friendly, approachable, appealing to young adults. 256x256 pixels, transparent background outside the circular area.

A cute mythical moon rabbit face portrait, luminous white-silver fur with a subtle glow effect, large dreamy purple-tinted eyes reflecting a tiny crescent moon in each eye, long flowing ears decorated with tiny star pins, holding a tiny golden mortar (for moon cake making). Ethereal moonlight aura around the character. Soft cool purple-silver pastel background gradient with crescent moon and star sparkles.

Negative prompt: realistic photo, scary, dark, ugly, full body, multiple animals, text, watermark, low quality, blurry, complex background
```

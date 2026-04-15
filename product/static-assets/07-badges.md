# 成就徽章 — 详细规格与 FLUX 2 提示词

> **关联文档**: [成就荣誉 PRD](../09-achievement-honor.md)
> **对齐版本**: 严格对齐 PRD-09 定义的 25 枚徽章

---

## 总体说明

成就徽章用于**非游戏模式**的成就/荣誉展示页面，以及解锁弹窗动画。每个徽章是一个独立的圆形奖牌。

### 尺寸与适配

| 属性 | 值 |
|------|-----|
| 原始尺寸 | 256 × 256 px（@2x，显示为 128 × 128 逻辑像素） |
| 格式 | WebP（质量 90，透明背景） |
| 显示方式 | 圆形展示，已完成的全彩，未完成的显示为灰度加锁 |
| H5 与 PC | 共用同一套，按组件大小缩放 |

### 风格统一要求

所有徽章共享"圆形奖牌"基础造型，不同等级用不同边框颜色区分：

| 等级 | 边框 | 说明 |
|------|------|------|
| 铜 | 铜棕色金属边框 | 基础成就 |
| 银 | 亮银色金属边框 | 进阶成就 |
| 金 | 璀璨金色金属边框 + 微发光 | 高级成就 |

---

## 一、学习进度类（7 枚）

### BADGE-01: 第一步（Bước đầu tiên）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-first-step.webp` |
| 等级 | 铜 |
| 解锁条件 | 完成第 1 关 |
| 图标描述 | 一只小脚印踏出第一步，背景是一条发光的路 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Bronze metallic circular frame border with warm copper-brown sheen. Inside the medal: a single cute footprint stepping onto a glowing golden path that extends into the distance with sparkle effects. The footprint glows softly. Background inside the circle is a warm sunrise gradient from orange to soft yellow. Clean cel-shaded illustration style, vibrant colors, clear and readable at small sizes. Trendy modern mobile game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-02: 拼音毕业（Tốt nghiệp Pīnyīn）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-pinyin-graduate.webp` |
| 等级 | 银 |
| 解锁条件 | 通关拼音群岛全部 20 关 |
| 图标描述 | 毕业帽放在拼音字母上方，海浪装饰 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished shine. Inside the medal: a small graduation cap (mortarboard) floating above a stylized Pinyin letter "ā" with a cute face, surrounded by tropical ocean waves and palm tree silhouettes. Turquoise and silver color scheme with sparkle confetti effects. Clean cel-shaded illustration style, vibrant colors, readable at small sizes. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-03: 汉字大师（Bậc thầy Hán tự）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-hanzi-master.webp` |
| 等级 | 银 |
| 解锁条件 | 通关汉字谷地全部 15 关 |
| 图标描述 | 毛笔在金色墨水中写字，古风山谷背景 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished sheen. Inside the medal: an elegant Chinese calligraphy brush writing a luminous golden Chinese character with flowing strokes, ink splatter sparkle effects. Behind the brush: a misty jade-green mountain valley silhouette. Dark navy background contrasting with golden calligraphy. Clean cel-shaded illustration style, scholarly and elegant. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-04: 词汇之王（Vua từ vựng）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-vocab-king.webp` |
| 等级 | 银 |
| 解锁条件 | 通关词汇平原全部 15 关 |
| 图标描述 | 装满发光汉字的宝箱，集市灯笼装饰 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with warm sheen. Inside the medal: an open ornate treasure chest overflowing with glowing Chinese characters floating upward. Small red paper lanterns hanging at top corners. Characters in warm colors (gold, amber, coral). Sparkle and light ray effects emanating from the chest. Clean cel-shaded illustration style, vibrant colors. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-05: 旅途完成（Hoàn thành hành trình）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-journey-complete.webp` |
| 等级 | 金 |
| 解锁条件 | 通关全部 60 关（4 个区域） |
| 图标描述 | 学士帽 + 卷轴 + 四区域小图标环绕 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Gold metallic circular frame border with brilliant golden glow and sparkle effects. Inside the medal: a graduation cap (mortarboard) floating above a rolled diploma scroll tied with red ribbon. Around the cap: four tiny icons representing game zones — a turquoise wave (Pinyin Islands), a jade mountain (Hanzi Valley), a golden market stall (Vocab Plains), a steel castle tower (Grammar Fortress). Confetti and star particles celebrating. Warm golden light fills the scene. Clean cel-shaded illustration, premium and celebratory. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-06: 完美之星（Sao hoàn hảo）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-perfect-star.webp` |
| 等级 | 铜 |
| 解锁条件 | 任意关卡获得 3 星 |
| 图标描述 | 三颗金星叠放，发光光芒 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Bronze metallic circular frame border with warm copper sheen. Inside the medal: three brilliant five-pointed golden stars arranged in a row, each star has a glossy metallic shine with white highlight at top point. Warm golden glow and starburst light rays radiating outward. Small sparkle particles scattered around the stars. Sky blue gradient background inside. Clean cel-shaded illustration, bright and rewarding. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-07: 绝对完美（Hoàn hảo tuyệt đối）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-absolute-perfect.webp` |
| 等级 | 金 |
| 解锁条件 | 全部 60 关都获得 3 星 |
| 图标描述 | 钻石棱镜折射三星光芒 + 皇冠 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Gold metallic circular frame border with radiant golden glow and elaborate filigree engravings. Inside the medal: a sparkling diamond prism in the center refracting rainbow light into three large brilliant golden stars arranged in a triangle formation. A small golden crown floats above the prism. Lens flare and starburst effects. Dazzling premium feel. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

---

## 二、连续学习类（4 枚）

### BADGE-08: 周打卡（7 ngày liên tục）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-streak-7.webp` |
| 等级 | 铜 |
| 解锁条件 | 连续学习 7 天 |
| 图标描述 | 一周日历图标，每天都有火焰标记 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Bronze metallic circular frame border with warm copper sheen. Inside the medal: a stylized calendar week view with 7 columns, each topped with a small burning flame icon forming a continuous fire streak across all 7 days. Calendar in warm cream color, flames in orange-to-gold gradient. Dynamic upward energy feeling. Clean cel-shaded illustration, vibrant warm colors. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-09: 月打卡（30 ngày kiên trì）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-streak-30.webp` |
| 等级 | 银 |
| 解锁条件 | 连续学习 30 天 |
| 图标描述 | 火焰变成凤凰形状 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished shine. Inside the medal: a magnificent stylized flame that has transformed into a phoenix bird shape with wings spread wide and flaming tail feathers. Golden-orange-red fire gradient coloring. Sparkle particle trail behind the phoenix. Majestic and impressive, symbolizing sustained dedication. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-10: 百日不停（100 ngày không dừng）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-streak-100.webp` |
| 等级 | 金 |
| 解锁条件 | 连续学习 100 天 |
| 图标描述 | 金龙环绕的 "100" |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Gold metallic circular frame border with elaborate ornate engravings and glowing rim. Inside the medal: the number "100" in bold golden 3D metallic text, with a small cute golden Chinese dragon coiled around the numbers. Dragon eyes sparkle with star catchlights. Firework-like particle effects in the background. Premium and celebratory feel. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-11: 一年同行（Một năm đồng hành）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-streak-365.webp` |
| 等级 | 金（传奇） |
| 解锁条件 | 连续学习 365 天 |
| 图标描述 | 金色太阳绕地球一圈 + 龙尾巴光迹 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Gold metallic circular frame border with diamond-encrusted sparkling rim and animated glow effect. Inside the medal: a golden sun orbiting around a small stylized Earth globe, leaving a trail of golden dragon-tail fire that forms a complete circle. The trail is made of 365 tiny sparkle dots. Background is deep space indigo with star constellations. Epic and legendary achievement feel. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

---

## 三、词汇掌握类（4 枚）

### BADGE-12: 初识十词（10 từ đầu tiên）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-vocab-10.webp` |
| 等级 | 铜 |
| 解锁条件 | 掌握度 ≥ 80% 的词达到 10 个 |
| 图标描述 | 一本打开的小书，10 个汉字浮出 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Bronze metallic circular frame border with warm copper sheen. Inside the medal: a small open book with pages fanning out, ten tiny glowing Chinese characters floating upward from the pages in a gentle arc. Characters glow in warm amber-gold color. Small sparkle effects around each character. Soft warm gradient background. Clean cel-shaded illustration, inviting and encouraging. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-13: 五十精通（50 từ thành thạo）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-vocab-50.webp` |
| 等级 | 银 |
| 解锁条件 | 掌握度 ≥ 80% 的词达到 50 个 |
| 图标描述 | 书架上的多本书 + 发光汉字旋涡 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished shine. Inside the medal: a small ornate bookshelf with multiple colorful books, above it a spiral vortex of glowing Chinese characters swirling upward. Characters in varying warm colors (gold, amber, coral, jade). Energy sparkle effects within the vortex. Rich scholarly atmosphere. Clean cel-shaded illustration, vibrant colors. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-14: 百词大师（100 từ bậc thầy）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-vocab-100.webp` |
| 等级 | 金 |
| 解锁条件 | 掌握度 ≥ 80% 的词达到 100 个 |
| 图标描述 | 脑中发光 + "100" + 汉字光环 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Gold metallic circular frame border with brilliant golden glow. Inside the medal: a stylized human head silhouette profile facing right, brain area glowing with golden light. The number "100" in metallic gold text overlaid on the brain. A halo of tiny Chinese characters orbiting around the head like electrons around an atom. Knowledge and mastery symbolism. Clean cel-shaded illustration, premium feel. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-15: 全词库通关（Toàn bộ từ vựng）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-vocab-all.webp` |
| 等级 | 金 |
| 解锁条件 | 所有词汇掌握度 ≥ 80% |
| 图标描述 | 金色宝典发光 + 勾选标记 + 汉字光芒 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Gold metallic circular frame border with radiant golden glow and sparkle rim. Inside the medal: a large ornate golden book (treasure tome) standing upright, cover engraved with Chinese dragon motif. A bright green check mark hovers above the book. Chinese characters burst outward from the opened top in a fountain of golden light. Completion and mastery symbolism. Clean cel-shaded illustration, premium celebratory feel. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

---

## 四、迷你游戏类（4 枚）

### BADGE-16: 游戏玩家（Game thủ）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-gamer.webp` |
| 等级 | 铜 |
| 解锁条件 | 任意迷你游戏玩满 10 次 |
| 图标描述 | 游戏手柄 + "10" + 星星 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Bronze metallic circular frame border with warm copper sheen. Inside the medal: a cute stylized game controller/gamepad in neon turquoise and gold colors, glowing softly. The number "10" in small bold text at bottom. Three small stars scattered around the controller. Playful sparkle effects. Clean cel-shaded illustration, fun and inviting. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-17: 声调射手（Xạ thủ thanh điệu）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-tone-shooter.webp` |
| 等级 | 银 |
| 解锁条件 | Tone Sniper 最高连击 ≥ 50 |
| 图标描述 | 准星中心命中声调符号 + "50" 连击 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished shine. Inside the medal: a cyan-blue neon crosshair reticle with a golden tone mark "ˇ" in the exact center, hit effect burst radiating outward in warm gold sparks. Small "x50" combo text in neon cyan at bottom. Precise and satisfying visual. Clean cel-shaded illustration, dynamic energy. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-18: 组装师（Nhà lắp ráp）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-assembler.webp` |
| 等级 | 银 |
| 解锁条件 | Radical Blitz 单局 ≥ 500 分 |
| 图标描述 | 汉字从碎片完美组合 + "500" 分 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished shine. Inside the medal: a Chinese character "好" assembled from glowing puzzle pieces clicking into place with assembly completion sparkle effect. A small golden "500" score text at the bottom. Jade green and warm gold color scheme. Clean cel-shaded illustration, satisfying puzzle-complete feel. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-19: 拼音赛车手（Tay đua Pīnyīn）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-pinyin-racer.webp` |
| 等级 | 银 |
| 解锁条件 | Pinyin Drift 连续正确 ≥ 30 |
| 图标描述 | 赛车拖着拼音字母尾迹 + "30" 连正确 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished shine. Inside the medal: a small turquoise racing car speeding from left to right, leaving a trail of glowing Pinyin letters (a, o, e, i, u) in its wake like exhaust trail. Motion blur speed lines. Small "x30" text in neon cyan at bottom right. Dynamic speed feeling. Clean cel-shaded illustration, neon cyan and gold colors. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

---

## 五、社交类（3 枚）

### BADGE-20: 推荐人（Người giới thiệu）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-referral-1.webp` |
| 等级 | 铜 |
| 解锁条件 | 成功推荐 1 位好友注册 |
| 图标描述 | 两个手拉手的小人 + 心形 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Bronze metallic circular frame border with warm copper sheen. Inside the medal: two cute simplified character silhouettes holding hands, one slightly taller than the other. A small glowing chain-link icon connecting them. A heart sparkle floats above their joined hands. Warm friendly colors — turquoise silhouettes on soft warm gold background. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-21: 大使（Đại sứ）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-ambassador.webp` |
| 等级 | 银 |
| 解锁条件 | 成功推荐 10 位好友注册 |
| 图标描述 | 扩音器 + 人群聚集 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished shine. Inside the medal: a stylized megaphone loudspeaker icon emitting colorful sound waves, multiple tiny character silhouettes gathering around in a semi-circle below. "10+" subtly shown in small text. Community and influence feeling. Warm coral and gold color scheme with sparkle effects. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-22: 影响力大师（Người có ảnh hưởng）

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-influencer.webp` |
| 等级 | 金 |
| 解锁条件 | 成功推荐 50 位好友注册 |
| 图标描述 | 金色皇冠 + 人群网络 + 光芒 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Gold metallic circular frame border with premium golden sparkle glow. Inside the medal: a golden crown at the top, below it a network graph of connected glowing dots representing a large referral network. "50" in bold golden metallic text at center. Golden light rays emanating outward. VIP and prestigious feeling. Rich gold and royal purple accent colors. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

---

## 六、特殊/隐藏类（3 枚）

### BADGE-23: 夜猫子（Cú đêm）🔒

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-night-owl.webp` |
| 等级 | 铜（隐藏） |
| 解锁条件 | 凌晨 0:00-5:00 期间完成关卡 |
| 图标描述 | 可爱猫头鹰 + 月亮 + 小书 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Bronze metallic circular frame border with warm copper sheen. Inside the medal: a cute little owl with large round glowing yellow eyes, perched on a small branch. A crescent moon behind it in the night sky with tiny stars. The owl holds a tiny open book in its talons. Cozy midnight blue and warm golden moon colors. Clean cel-shaded illustration, adorable and charming. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-24: 闪电学习（Học nhanh）🔒

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-speed-learner.webp` |
| 等级 | 银（隐藏） |
| 解锁条件 | 30 分钟内完成一整章关卡 |
| 图标描述 | 闪电击穿书本 + 翻页特效 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Silver metallic circular frame border with polished shine and electric sparkle accents. Inside the medal: a bold neon-yellow lightning bolt striking through an open book that is rapidly flipping pages, pages flying outward in all directions. Speed lines and electric sparkle effects. Dynamic and energetic feeling. Cyan and gold color accents on deep blue background. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

### BADGE-25: 语言桥梁（Cầu nối ngôn ngữ）🔒

| 属性 | 值 |
|------|-----|
| 文件名 | `badge-language-bridge.webp` |
| 等级 | 金（隐藏） |
| 解锁条件 | 使用全部 4 种 UI 语言各完成至少 1 个关卡 |
| 图标描述 | 四面小旗帜组成的桥 + 多语河流 |

```
A circular game achievement medal icon, 256x256 pixels, transparent background outside the circle. Gold metallic circular frame border with rainbow-shimmer border effect. Inside the medal: a small ornate arching bridge spanning across, with four tiny flags planted on it — Vietnamese flag (red with yellow star), Chinese flag (red with stars), US/UK flag, and Indonesian flag (red and white). Below the bridge: a flowing river of glowing text characters from all four languages. Multicultural celebration atmosphere with warm inclusive colors. Clean cel-shaded illustration. Modern game achievement aesthetic.

Negative prompt: realistic photo, dark gloomy, blurry, low quality, text, watermark, non-circular shape, complex background, multiple icons
```

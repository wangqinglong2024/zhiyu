# 15 · 资产与图标（Assets & Iconography）

## 一、Logo

### 1.1 主 Logo
- 文件：`assets/logo/zhiyu-logo.svg`
- 中文 "知语" + 英文 "Zhiyu"
- 主色：rose-600
- 适用：启动屏 / Header / 后台

### 1.2 Logo Mark（仅图标）
- 简化符号
- 用于 favicon / app icon / 角标

### 1.3 变体
- 全色 / 单色白 / 单色黑
- 横版 / 竖版 / 纯图标

### 1.4 安全留白
- 至少 logo 高度 50% 留白

## 二、App Icon (PWA)

### 2.1 尺寸
- 512×512 maskable
- 192×192 maskable
- 180×180 (iOS apple-touch-icon)
- 32×32 favicon
- 16×16 favicon

### 2.2 设计
- 圆角 (iOS 自动)
- maskable 区域留 80% 中央

### 2.3 文件
```
public/
  icons/
    icon-512.png
    icon-512-maskable.png
    icon-192.png
    icon-192-maskable.png
    apple-touch-icon.png
    favicon.ico
    favicon-32.png
    favicon-16.png
```

## 三、Splash 启动图（iOS）

iOS PWA 自动生成 splash，含主要尺寸：
- iPhone 14 Pro Max
- iPhone 14 / 13 / 12
- iPhone SE
- iPad Pro 12.9 / 11 / iPad Air

工具：`pwa-asset-generator`

## 四、图标库

### 4.1 主库
- `lucide-react` v0.x（轻量、统一）
- 1000+ 图标

### 4.2 图标使用规范
- 默认尺寸：16 / 20 / 24 / 32
- stroke-width：1.5（默认）/ 2（强调）
- 颜色：currentColor（继承文字色）

### 4.3 自定义图标
- 中文文化主题图标（如灯笼、龙、汉字偏旁）
- SVG 格式
- 24×24 viewBox 标准
- stroke 1.5
- 文件：`packages/ui/src/icons/`

### 4.4 国旗
- `country-flag-icons` v1.x
- 圆形 / 方形两版

## 五、插画

### 5.1 风格
- 扁平 + 轻微渐变
- 配色匹配 Cosmic Refraction
- 含中国文化元素（不刻板）

### 5.2 用途
| 场景 | 插画 |
|---|---|
| Empty State | 空盒子 / 空书签 / 空菜单 |
| 404 | 迷路熊猫 |
| 500 | 修理工具 + 哭脸 |
| 庆祝 | 烟花 / 红包 / 灯笼 |
| Onboarding | 学习场景 / 旅游场景 |
| 引导 | 引导手势 |

### 5.3 来源
- 自绘（设计师）
- Lottie 库（动效）
- 部分 unDraw 二次创作

### 5.4 文件
```
packages/ui/src/illustrations/
  empty-favorites.svg
  empty-search.svg
  error-404.svg
  error-500.svg
  celebrate-stage.json (Lottie)
  celebrate-game.json (Lottie)
  onboarding-1.svg
  ...
```

## 六、Cover 图

### 6.1 用途
- 文章 / 课程 / 小说 / 游戏 详情封面

### 6.2 比例
- 16:9（默认）
- 21:9（Hero / 宽屏）
- 1:1（卡片）

### 6.3 尺寸
| 用途 | 渲染尺寸 | 源尺寸 |
|---|---|---|
| Hero (详情) | 1920×1080 | 2560×1440 |
| 卡片 (列表) | 800×450 | 1280×720 |
| 缩略图 | 320×180 | 640×360 |
| OG 图 (分享) | 1200×630 | 1200×630 |

### 6.4 生成方式
- 优先 AI 生成（DALL-E / Midjourney）
- 风格统一（毛玻璃叠层）
- 含中文标题（自动叠加）
- 多比例自动裁剪

### 6.5 优化
- WebP / AVIF
- 响应式 srcset
- 懒加载（IntersectionObserver）
- Cloudflare CDN
- placeholder：blurhash 或 dominant color

## 七、音频资源

### 7.1 学习音频
- 句子级 + 单词级
- TTS 生成（DeepSeek TTS / Azure / 阿里云）+ 真人审校
- 格式：mp3（128kbps）+ aac
- 命名：`audio/{content_id}/{sentence_id}.mp3`

### 7.2 UI 音效
- 按钮点击 click.mp3
- 答对 correct.mp3
- 答错 wrong.mp3
- 通关 victory.mp3
- 失败 fail.mp3
- Toast 提示 ding.mp3
- 音量 50%（默认）
- 总大小 < 500KB

### 7.3 BGM
- 学习 BGM (3 套：宁静 / 活力 / 中国风)
- 游戏 BGM (12 款各 1 套)
- 格式：ogg + mp3
- 单曲 < 3MB
- 默认关闭，用户可开启

### 7.4 音频库
- Howler.js v2
- WebAudio API

## 八、视频资源（v1.5）

### 8.1 教学视频
- 1080p mp4 + h.264
- 字幕 vtt
- 缩略图 jpg

### 8.2 推广视频
- 短视频（TikTok 比例 9:16）
- 长视频（YouTube 16:9）

## 九、字体

详见 14-i18n-fonts.md

## 十、SVG 优化

### 10.1 工具
- SVGO
- @svgr/webpack（React 组件）

### 10.2 规则
- 移除 metadata
- 优化 path
- 单色图标用 currentColor
- 多色图标保留色彩

## 十一、图片优化

### 11.1 流程
- 上传原图（高清）
- Cloudflare Image Resizing 实时变换
- 输出 WebP / AVIF
- 多尺寸 srcset

### 11.2 命名
```
images/
  covers/
    {category}/
      {slug}-original.jpg
  thumbnails/
  avatars/
  illustrations/
```

### 11.3 CDN
- Cloudflare R2 存储
- Cloudflare CDN 分发
- 缓存 30 天 (内容)
- 缓存 7 天 (用户上传)

## 十二、品牌素材库（推广）

### 12.1 内容
- 海报模板（多尺寸）
- 短视频脚本
- 文案 5 种语言
- 二维码 + 分销码生成器

### 12.2 文件
```
brand/
  posters/
  templates/
  scripts/
  qr-templates/
```

## 十三、第三方资源许可

| 资源 | 许可 |
|---|---|
| Lucide Icons | ISC |
| Noto Sans | OFL |
| Lottie 动画 | 自创 / 购买 |
| 插画 | 自创 / unDraw (MIT) |
| Cover 图 | AI 生成 (商用授权) |
| 音效 | 购买 (Envato) |
| BGM | 购买 / Royalty-free |

## 十四、检查清单

- [ ] App Icon 各尺寸齐全
- [ ] Splash 主流设备覆盖
- [ ] Cover 图 WebP 优化
- [ ] 音频文件 < 限额
- [ ] 图标库 lucide 引入
- [ ] 自定义图标 SVGO 优化
- [ ] Lottie 动画 < 100KB / 个
- [ ] CDN 全部资源
- [ ] 第三方许可记录在案

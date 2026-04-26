# ZY-09-08 · 词包加载 + 拼音渲染

> Epic：E09 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 汉字游戏
**I want** 标准词包结构 + 拼音 / 释义渲染组件
**So that** 12 款游戏复用同一题库与字形美化。

## 上下文
- 词包结构：`{ id, hsk_level, items:[{ char, pinyin, gloss_i18n, audio_id }] }`
- 来源：`system/packages/data/wordpacks/*.json`（HSK 1-6 ＋ 自定义）
- 渲染：PixiText + 拼音上方 ruby（自绘）
- TTS 触发用 ZY-09-06 audio voice 群组

## Acceptance Criteria
- [ ] WordPackLoader 按 level 加载
- [ ] PixiHanziWithPinyin 组件：字 + 上拼音 + 可点
- [ ] 性能：500 字快速渲染 ≤ 100ms
- [ ] 单测：拼音对齐、字号缩放

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test wordpack hanzi.render
```

## DoD
- [ ] 多级词包可切

## 依赖
- 上游：ZY-09-04 / 06

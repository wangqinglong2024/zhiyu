# ZY-06-03 · 文章沉浸阅读页（拼音切换 / 字号 / 朗读 / 收藏）

> Epic：E06 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 沉浸阅读一篇文章，可切换拼音注音 / 调字号 / 听朗读 / 收藏 / 分享
**So that** 文化阅读同时也是中文学习场。

## 上下文
- 路由：`/discover/:category/:slug`
- 拼音：BE 预生成（接 jieba + pypinyin），FE 控制是否显示（ruby 标签）。
- TTS：浏览器 SpeechSynthesis API（无外部 SaaS）；句级高亮当前句。
- 收藏 → `zhiyu.favorites`（用户 × 实体）。
- 分享：原生 share API + fallback 复制链接。

## Acceptance Criteria
- [ ] `GET /api/v1/articles/:slug` 返回正文 + 拼音版本（按 lng）
- [ ] FE 阅读页：可切拼音 on/off、字号小/中/大、暗色模式跟随主题
- [ ] TTS 段落朗读 + 当前句高亮 + 速度 0.75/1/1.25
- [ ] 收藏 toggle，`/me/favorites` 列表可见（接 ZY-06-04）
- [ ] 阅读到底自动写 `reading_progress`（接 ZY-06-05）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run articles.detail
```
- MCP Puppeteer：开拼音 → 朗读 → 收藏 → 关闭后再打开恢复进度

## DoD
- [ ] TTS 在 Chrome / Safari 可用
- [ ] 收藏与进度跨设备同步

## 不做
- AI 问答（v1.5）

## 依赖
- 上游：ZY-06-01 / ZY-04
- 下游：ZY-06-04 / 05

# Epic E06 · 中国发现（Discover China）

> 阶段：M2 · 优先级：P0 · 估算：3 周
>
> 顶层约束：[planning/00-rules.md](../00-rules.md)

## 摘要
12 大文化分类的浏览 / 阅读 / 互动学习；句子级阅读器（拼音 / 翻译 / 音频）；单字弹窗；收藏 / 笔记。

## 范围
- 分类 / 文章 / 句子 数据模型（Supabase）
- 文章列表 + 详情（沉浸阅读）
- 单字弹窗（释义 + 音频 + 加生词）
- 收藏 / 笔记
- 阅读进度 / 时长（接 E07）
- 全文搜索（Postgres FTS）

## 非范围
- 真实 TTS 接入（用 `TTSAdapter` fake，返回固定 wav 占位）
- AI 生成（在 E16，且 v1.5）
- 评论 / 社交（未来）

## Stories（按需 6）

### ZY-06-01 · 分类 / 文章 / 句子表 + CRUD API
**AC**
- [ ] `categories` / `articles` / `sentences` 表（schema `zhiyu`）
- [ ] 状态机：draft → review → published
- [ ] BE CRUD（含管理员操作；前台只读已发布）
- [ ] RLS：published 可读；admin 角色全权
**Tech**：spec/05、ux/09
**估**：M

### ZY-06-02 · 文章列表页
**AC**
- [ ] 12 类分类切换
- [ ] HSK 等级筛选
- [ ] 卡片瀑布流
- [ ] 分页 / 滚动加载
**估**：M

### ZY-06-03 · 文章详情（沉浸阅读 + 音频）
**AC**
- [ ] 句子级布局（中文 / 拼音 / 翻译三行）
- [ ] 翻译 / 拼音开关；字号调节
- [ ] 句子点击播放、全篇连播、速度 0.75/1/1.25x；当前句高亮
- [ ] 音频 URL 由 `TTSAdapter` 提供（fake：占位 wav；真实：未来）
**估**：L

### ZY-06-04 · 单字弹窗 + 收藏 / 笔记
**AC**
- [ ] 长按 / 双击单字弹窗：拼音 / 释义 / 例句 / 音频
- [ ] 加入生词本 / 加入收藏
- [ ] `favorites` / `notes` 表 + CRUD
- [ ] `/me/notes` 个人页
**估**：M

### ZY-06-05 · 阅读进度 / 时长 / 多语切换
**AC**
- [ ] 滚动位置记忆 + 累计阅读时长，调 E07 学习引擎累加 XP
- [ ] 翻译按 UI 语言（接 E04 多语 API）；缺失 fallback；切换无重载
**估**：M

### ZY-06-06 · 文章全文搜索（Postgres FTS）
**AC**
- [ ] BE `/api/v1/discover/search?q=&lang=`：Postgres `tsvector` + `pg_trgm`，中文走 zhparser 或 jieba ts_token（容器内可装）
- [ ] 标题 + 内容；高亮命中
- [ ] 桌面双栏 / 移动单栏响应式
**估**：L

## DoD
- [ ] 12 类各种子 ≥ 5 篇（手工导入 fixtures）可读
- [ ] 4 语翻译完整
- [ ] 阅读体验 60fps（zhiyu-app-fe 容器 + Chrome DevTools 在 IP+3100 上验）
- [ ] FTS 搜索命中、容器内 jieba 安装成功
- [ ] **种子数据（§11.1 DC）**：总篇数 ≥ 36（12 类各 ≥ 3 篇），JSON 置于 `system/packages/db/seed/discover-china/articles.json`，提供 4 语 `i18n` + `seed://` 封面路径；幂等重跑
- [ ] **ZY-06-07** 已完成（评分 / 未登录预览 / 相关推荐 / 阅读统计 4 项 PRD FR）

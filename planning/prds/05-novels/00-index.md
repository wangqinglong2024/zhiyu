# 05 · 小说专区（Novels · NV）

> **代号**：NV | **优先级**：P0 | **目标**：12 类目沉浸式中文小说，句子级阅读

## 文件结构
- [01-functional-requirements.md](./01-functional-requirements.md) — 通用功能需求
- [02-data-model-api.md](./02-data-model-api.md) — 数据模型与 API
- [03-acceptance-criteria.md](./03-acceptance-criteria.md) — 验收准则
- [04-v1-launch-titles.md](./04-v1-launch-titles.md) — **v1 五部启动小说选题 + 12 类目排期 + 内容审查标准（2026-04-25 补全）**

## 12 类目（参考 `/novels/`）
都市言情 / 古代言情 / 仙侠修真 / 玄幻奇幻 / 穿越重生 / 武侠 / 历史架空 / 悬疑推理 / 恐怖盗墓 / 科幻末世 / 电竞游戏 / 耽美 BL

## 关键决策
- v1 上 5 部启动小说（每类目 1 部，由 PM 选 5 类目）
- 每部 10 章首发，每章 ≤ 3000 字
- v1 全免费（流量与口碑入口）
- 复用 DC 的句子级阅读组件（zh + 拼音 + 母语 + TTS）
- 章末 3-5 题快测（可选）：识词测验（Q1-Q3 题型），错题入 SRS
- 收藏 / 笔记 / 评分 / 分享 同 DC
- 评论 / 弹幕：v1.5 上线
- 章节"难度自适应建议"：根据用户 HSK 等级推荐起读

## 与其他模块关系
依赖 UA / I18N / SC / CF；提供 错题 → LE

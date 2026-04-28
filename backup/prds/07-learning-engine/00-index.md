# 07 · 学习引擎（Learning Engine · LE）

> **代号**：LE | **优先级**：P0 | **核心**：FSRS-5 SRS + 错题集 + 温故知新 + 学习仪表板

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 算法：FSRS-5（ts-fsrs 库）
- 调度对象：question_id（题目级，非词级，避免反复测同 KP 同方向）
- 默认每日复习上限：20 张
- 优先级：到期错题 > 到期新题 > 提前复习
- 错题来源：节小测 / 章测 / 阶段考 / 游戏错误 / 学习系统内用户主动加入
- 排除来源：发现中国与小说不进入 SRS / wrong-set；历史文档中的 `novel_quiz` 或小说筛选视为已废弃。
- 学习仪表板：今日 / 本周 / 累计；掌握率热力图（按 HSK / 主题）
- 4 种"学习模式"：温故知新（SRS）/ 今日新题 / 错题专攻 / 自由练习（按主题筛选）
- 推送提醒：每日 1 次（用户偏好时间），邮件 + 浏览器推送（v1.5）

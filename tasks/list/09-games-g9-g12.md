# 09 — 游戏 G9-G12 (Games G9-G12)

> **优先级**: P2/P3
> **目标文件夹**: `/tasks/09-games-g9-g12/`
> **产品依据**: `product/apps/08-games-g9-g12/` 全部文件
> **内容参考**: `/game/09-hsk-adventure.md` ~ `/game/12-literary-master.md` + `/course/level-09.md` ~ `/course/level-12.md`
> **前置依赖**: 06-游戏通用系统 完成 + 08-游戏G5-G8 参考
> **预计任务数**: 8

---

## 一、分类概述

高级四款游戏，对应课程 L9-L12，面向高级到母语级学习者：
- **G9 HSK 大冒险** (L9)：RPG 闯关 + HSK 专题
- **G10 辩论擂台** (L10)：选论点打字辩论
- **G11 诗词大会** (L11)：诗词知识竞赛对决
- **G12 文豪争霸** (L12)：文学鉴赏综合挑战

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T09-001 | G9 HSK 大冒险 — 后端题库与游戏逻辑 | L | T06-013 | HSK 专题题库 + RPG 关卡配置 + 闯关计分 |
| T09-002 | G9 HSK 大冒险 — Phaser 游戏前端 | L | T09-001 | RPG 场景 + 关卡地图 + 战斗答题 + 角色成长 |
| T09-003 | G10 辩论擂台 — 后端题库与游戏逻辑 | L | T06-013 | 辩题库 + 论点评判 + 打字速度 + AI 评分 |
| T09-004 | G10 辩论擂台 — Phaser 游戏前端 | L | T09-003 | 擂台场景 + 论点选择 + 打字输入 + 评委判定 |
| T09-005 | G11 诗词大会 — 后端题库与游戏逻辑 | L | T06-013 | 诗词知识库 + 多题型（飞花令/接句/识别）+ 计分 |
| T09-006 | G11 诗词大会 — Phaser 游戏前端 | L | T09-005 | 大会舞台 + 答题面板 + 评委打分 + PK 对决 |
| T09-007 | G12 文豪争霸 — 后端题库与游戏逻辑 | L | T06-013 | 文学鉴赏题库 + 综合评判 + 多维度计分 |
| T09-008 | G12 文豪争霸 — Phaser 游戏前端 | L | T09-007 | 书房场景 + 鉴赏答题 + 创作挑战 + 综合排名 |

---

## 三、详细任务文件命名

```
/tasks/09-games-g9-g12/
├── T09-001-g9-hsk-adventure-backend.md
├── T09-002-g9-hsk-adventure-frontend.md
├── T09-003-g10-debate-arena-backend.md
├── T09-004-g10-debate-arena-frontend.md
├── T09-005-g11-poetry-contest-backend.md
├── T09-006-g11-poetry-contest-frontend.md
├── T09-007-g12-literary-master-backend.md
└── T09-008-g12-literary-master-frontend.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师兼游戏设计师，现在需要为「知语 Zhiyu」的高级游戏 G9-G12 生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构
2. /grules/05-coding-standards.md — 编码规范
3. /grules/09-task-workflow.md — 任务执行工作流
4. /product/apps/08-games-g9-g12/ — G9-G12 游戏 PRD（全部文件）
   - 00-index.md → 模块总览
   - 01-g9-hsk-adventure.md → G9 HSK 大冒险详细 PRD
   - 02-g10-debate-arena.md → G10 辩论擂台详细 PRD
   - 03-g11-poetry-contest.md → G11 诗词大会详细 PRD
   - 04-g12-literary-master.md → G12 文豪争霸详细 PRD
5. /product/apps/05-game-common/ — 游戏通用系统 PRD
6. /game/ — 各游戏详细设计文档
   - 09-hsk-adventure.md → G9 完整玩法设计
   - 10-debate-arena.md → G10 完整玩法设计
   - 11-poetry-contest.md → G11 完整玩法设计
   - 12-literary-master.md → G12 完整玩法设计
7. /course/level-09.md ~ level-12.md — L9-L12 课程内容
8. /china/09-philosophy-wisdom.md — 哲学思想（G10 辩论话题参考）
9. /china/07-classic-literature.md — 文学经典（G11/G12 参考）

【任务目标】
生成任务 T09-{NNN} 的详细任务文件。

【特别要求】
- 高级游戏复杂度最高，需要更丰富的游戏机制
- G9 HSK 大冒险是 RPG 类型，需要关卡系统 + 角色成长 + 战斗（答题）系统
- G10 辩论擂台涉及打字输入，需要实时打字同步和 AI 辅助评判
- G11 诗词大会需要完整的诗词知识库，支持飞花令/接句/识别多种题型
- G12 文豪争霸是综合挑战，需要文学鉴赏 + 创作能力的多维度评判
- 所有高级游戏的 AI 对战对手需要更智能（模拟不同水平的对手）

【🚨 强制规则 — 以下规则适用于本分类所有任务，不可跳过】

1. **Docker 测试铁律**（参考 grules/08-qa-testing.md）:
   - ⛔ 绝对禁止在宿主机环境安装依赖或运行测试
   - ⛔ 绝对禁止使用 npm run dev / npm start 在宿主机直接启动服务
   - 所有测试必须通过 `docker compose up -d --build` 构建后，在容器内验证
   - Browser MCP（Puppeteer）做真实浏览器端到端测试
   - Docker 构建失败 = 任务未完成，必须修复后重新构建

2. **UI 设计规范铁律**（参考 grules/01-rules.md §一 + grules/06-ui-design.md）:
   - 严格遵循 Cosmic Refraction（宇宙折射）毛玻璃设计系统
   - 色彩仅限 Rose/Sky/Amber + 中性色，严禁出现紫色 (Purple)
   - 毛玻璃基线参数：blur(24px) saturate(1.8)
   - Tailwind CSS v4（@import "tailwindcss" + @theme），禁止存在 tailwind.config.js
   - Light/Dark 双模式必须验证
   - 响应式必须覆盖 375px / 768px / 1280px 三个断点

3. **自动化验证闭环**:
   - 编码完成 → Docker 构建 → 容器健康检查 → 功能验证 → 验收标准逐条验证
   - 发现问题 → 修复 → 重新 Docker 全量构建 → 重新全量测试（不能只测修复部分）
   - 所有 GIVEN-WHEN-THEN 验收标准 ✅ 通过 + 自检清单全绿 → 才能声明完成
   - 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

4. **结果报告铁律**:
   - 任务完成后，必须在 `/tasks/result/{分类文件夹}/` 下创建同名结果报告
   - 报告格式严格遵循 `/tasks/list/00-index.md` §八.2 结果文件模板
   - 报告必须包含：执行摘要、新增/修改文件、Docker 测试结果、验收标准检验、问题修复记录
   - 明确告知用户需要做什么（或"无需用户操作"）
   - ⚠️ 没有写结果报告 = 任务未完成
```

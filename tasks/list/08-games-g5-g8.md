# 08 — 游戏 G5-G8 (Games G5-G8)

> **优先级**: P1/P2
> **目标文件夹**: `/tasks/08-games-g5-g8/`
> **产品依据**: `product/apps/07-games-g5-g8/` 全部文件
> **内容参考**: `/game/05-idiom-chain.md` ~ `/game/08-reading-detective.md` + `/course/level-05.md` ~ `/course/level-08.md`
> **前置依赖**: 06-游戏通用系统 完成 + 07-游戏G1-G4 参考
> **预计任务数**: 8

---

## 一、分类概述

中级四款游戏，对应课程 L5-L8，面向中级学习者：
- **G5 成语接龙大战** (L5)：尾字接首字速度赛
- **G6 汉字华容道** (L6)：拆解重组汉字偏旁部首
- **G7 古诗飞花令** (L7)：含指定字诗句对决
- **G8 阅读侦探社** (L8)：阅读短文找线索答题

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T08-001 | G5 成语接龙大战 — 后端题库与游戏逻辑 | L | T06-013 | 成语库 + 接龙验证 + 速度赛计分 |
| T08-002 | G5 成语接龙大战 — Phaser 游戏前端 | L | T08-001 | 接龙链展示 + 输入框 + 倒计时 + PK 同步 |
| T08-003 | G6 汉字华容道 — 后端题库与游戏逻辑 | L | T06-013 | 偏旁部首拆解题 + 组合验证 + 计分 |
| T08-004 | G6 汉字华容道 — Phaser 游戏前端 | L | T08-003 | 华容道滑块 + 偏旁拖拽 + 组合动画 |
| T08-005 | G7 古诗飞花令 — 后端题库与游戏逻辑 | L | T06-013 | 诗词库 + 飞花令验证（含指定字）+ 计分 |
| T08-006 | G7 古诗飞花令 — Phaser 游戏前端 | L | T08-005 | 诗句展示 + 输入 + 评判动画 + PK 对决 |
| T08-007 | G8 阅读侦探社 — 后端题库与游戏逻辑 | L | T06-013 | 短文阅读题 + 线索验证 + 推理计分 |
| T08-008 | G8 阅读侦探社 — Phaser 游戏前端 | L | T08-007 | 侦探场景 + 短文阅读 + 线索收集 + 答题 |

---

## 三、详细任务文件命名

```
/tasks/08-games-g5-g8/
├── T08-001-g5-idiom-chain-backend.md
├── T08-002-g5-idiom-chain-frontend.md
├── T08-003-g6-hanzi-puzzle-backend.md
├── T08-004-g6-hanzi-puzzle-frontend.md
├── T08-005-g7-poem-flyorder-backend.md
├── T08-006-g7-poem-flyorder-frontend.md
├── T08-007-g8-reading-detective-backend.md
└── T08-008-g8-reading-detective-frontend.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师兼游戏设计师，现在需要为「知语 Zhiyu」的中级游戏 G5-G8 生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构
2. /grules/05-coding-standards.md — 编码规范
3. /grules/09-task-workflow.md — 任务执行工作流
4. /product/apps/07-games-g5-g8/ — G5-G8 游戏 PRD（全部文件）
   - 00-index.md → 模块总览
   - 01-g5-idiom-chain.md → G5 成语接龙详细 PRD
   - 02-g6-hanzi-puzzle.md → G6 汉字华容道详细 PRD
   - 03-g7-poem-flyorder.md → G7 古诗飞花令详细 PRD
   - 04-g8-reading-detective.md → G8 阅读侦探社详细 PRD
5. /product/apps/05-game-common/ — 游戏通用系统 PRD（匹配、结算、HUD）
6. /game/ — 各游戏详细设计文档
   - 05-idiom-chain.md → G5 完整玩法设计
   - 06-hanzi-puzzle.md → G6 完整玩法设计
   - 07-poem-flyorder.md → G7 完整玩法设计
   - 08-reading-detective.md → G8 完整玩法设计
7. /course/level-05.md ~ level-08.md — L5-L8 课程内容（题库来源）
8. /china/08-idioms-allusions.md — 成语典故内容（G5 成语库参考）
9. /china/07-classic-literature.md — 文学经典内容（G7 诗词库参考）

【任务目标】
生成任务 T08-{NNN} 的详细任务文件。

【特别要求】
- 与 G1-G4 相同的技术规范（Phaser 3 + WebSocket + 服务端计分 + 防作弊）
- G5 成语接龙需要一个完整的成语库，验证首字接尾字的逻辑
- G6 汉字华容道需要偏旁部首拆解数据，支持拖拽和滑动操作
- G7 古诗飞花令需要完整的诗词库，验证诗句中是否包含指定字
- G8 阅读侦探需要短文理解能力，支持多线索收集和推理
- 参考 /china/ 下的成语和文学内容丰富题库
- 中级游戏的难度曲线应明显高于 G1-G4

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

# 07 — 游戏 G1-G4 (Games G1-G4)

> **优先级**: P0（G1-G3 MVP）/ P1（G4）
> **目标文件夹**: `/tasks/07-games-g1-g4/`
> **产品依据**: `product/apps/06-games-g1-g4/` 全部文件
> **内容参考**: `/game/01-hanzi-slash.md` ~ `/game/04-grammar-chef.md` + `/course/level-01.md` ~ `/course/level-04.md`
> **前置依赖**: 06-游戏通用系统 完成
> **预计任务数**: 8

---

## 一、分类概述

初级四款游戏，对应课程 L1-L4，面向零基础到初级学习者：
- **G1 汉字切切切** (L1)：滑动切开正确汉字/拼音，水果忍者式玩法
- **G2 拼音泡泡龙** (L2)：发射泡泡消除拼音组合，经典泡泡龙式
- **G3 词语消消乐** (L3)：匹配中文-释义消除方块，消消乐式
- **G4 语法大厨** (L4)：按语序组合"菜肴"句子，料理式玩法

**技术要点**：所有游戏使用 Phaser 3 引擎，强制横屏，支持单人和 1v1 PK 模式，题库来自对应 Level 课程内容。

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T07-001 | G1 汉字切切切 — 后端题库与游戏逻辑 | L | T06-013 | 出题 API + 服务端计分 + 游戏规则引擎 |
| T07-002 | G1 汉字切切切 — Phaser 游戏前端 | L | T07-001 | 切割手势 + 汉字飞行物 + 特效 + 计分 + PK 同步 |
| T07-003 | G2 拼音泡泡龙 — 后端题库与游戏逻辑 | L | T06-013 | 出题 API + 泡泡组合验证 + 计分 |
| T07-004 | G2 拼音泡泡龙 — Phaser 游戏前端 | L | T07-003 | 泡泡发射 + 消除动画 + 物理引擎 + PK 同步 |
| T07-005 | G3 词语消消乐 — 后端题库与游戏逻辑 | L | T06-013 | 词语-释义配对出题 + 消除验证 + 计分 |
| T07-006 | G3 词语消消乐 — Phaser 游戏前端 | L | T07-005 | 方块网格 + 匹配消除动画 + 连击特效 + PK 同步 |
| T07-007 | G4 语法大厨 — 后端题库与游戏逻辑 | L | T06-013 | 语序出题 + 句子正确性校验 + 计分 |
| T07-008 | G4 语法大厨 — Phaser 游戏前端 | L | T07-007 | 厨房场景 + 食材拖拽组合 + 烹饪动画 + PK 同步 |

---

## 三、详细任务文件命名

```
/tasks/07-games-g1-g4/
├── T07-001-g1-hanzi-slash-backend.md
├── T07-002-g1-hanzi-slash-frontend.md
├── T07-003-g2-pinyin-bubble-backend.md
├── T07-004-g2-pinyin-bubble-frontend.md
├── T07-005-g3-word-match-backend.md
├── T07-006-g3-word-match-frontend.md
├── T07-007-g4-grammar-chef-backend.md
└── T07-008-g4-grammar-chef-frontend.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师兼游戏设计师，现在需要为「知语 Zhiyu」的初级游戏 G1-G4 生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构（§三 后端高并发 + WebSocket）
2. /grules/05-coding-standards.md — 编码规范（并发安全）
3. /grules/09-task-workflow.md — 任务执行工作流
4. /product/apps/06-games-g1-g4/ — G1-G4 游戏 PRD（全部 4 个文件）
   - 00-index.md → 模块总览
   - 01-g1-hanzi-slash.md → G1 汉字切切切详细 PRD
   - 02-g2-pinyin-bubble.md → G2 拼音泡泡龙详细 PRD
   - 03-g3-word-match.md → G3 词语消消乐详细 PRD
   - 04-g4-grammar-chef.md → G4 语法大厨详细 PRD
5. /product/apps/05-game-common/ — 游戏通用系统 PRD（匹配、结算、HUD）
6. /game/ — 各游戏详细设计文档
   - 01-hanzi-slash.md → G1 完整玩法设计
   - 02-pinyin-bubble.md → G2 完整玩法设计
   - 03-word-match.md → G3 完整玩法设计
   - 04-grammar-chef.md → G4 完整玩法设计
7. /course/level-01.md ~ level-04.md — L1-L4 课程内容（题库来源）

【任务目标】
生成任务 T07-{NNN} 的详细任务文件。

【特别要求】
- 每款游戏分为后端（题库+逻辑+计分）和前端（Phaser 3 游戏场景）两个任务
- 题库 100% 来自对应 Level 课程内容，必须参考 /course/level-{N}.md 理解词汇和知识点
- 参考 /game/ 下的游戏设计文档获取完整的玩法规则、计分机制、难度曲线
- Phaser 3 场景必须封装为独立模块，通过游戏通用框架（T06-010）的容器加载
- 所有游戏必须支持单人练习和 1v1 PK 两种模式
- PK 模式通过 WebSocket 实时同步双方进度
- 服务端出题 + 服务端计分 + 时间校验（防作弊三件套）
- 游戏画面必须支持皮肤系统（主题/角色/背景/特效可更换）
- 移动端 H5 和 Web 桌面端都必须流畅运行（Phaser 3 自适应）

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

# 06 — 游戏通用系统 (Game Common)

> **优先级**: P0
> **目标文件夹**: `/tasks/06-game-common/`
> **产品依据**: `product/apps/05-game-common/` 全部文件
> **内容参考**: `/game/00-index.md` 游戏总览
> **前置依赖**: 02-全局框架 完成
> **预计任务数**: 13

---

## 一、分类概述

游戏通用系统是所有 12 款游戏共享的基础设施。包含游戏大厅、模式选择（单人/1v1 PK/多人）、WebSocket 实时匹配、游戏结算、段位系统（青铜→王者）、排行榜、皮肤商城、横屏 HUD（Heads-Up Display）等。

**核心技术栈**：
- 游戏引擎：Phaser 3（HTML5 2D）
- 实时通信：WebSocket (Supabase Realtime)
- 屏幕方向：强制横屏（landscape）
- 变现：皮肤/特效（纯装饰，不影响平衡）

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T06-001 | 数据库 Schema — 游戏基础 | L | T02-014 | games 表 + game_sessions 表 + game_results 表 + RLS |
| T06-002 | 数据库 Schema — 段位系统 | L | T06-001 | user_ranks 表 + rank_history + 段位配置表 + 赛季表 |
| T06-003 | 数据库 Schema — 皮肤商城 | M | T06-001 | skins 表 + user_skins 表 + 分类 + 价格 + RLS |
| T06-004 | 后端 API — 游戏大厅 | M | T06-001 | 游戏列表 + 用户游戏统计 + 游戏配置 |
| T06-005 | 后端 API — 匹配系统 | L | T06-001 | WebSocket 匹配 + 匹配队列 + 超时 AI 对战 + 段位匹配 |
| T06-006 | 后端 API — 游戏会话与结算 | L | T06-002 | 创建/结束会话 + 服务端计分 + 段位变更 + 知语币奖励 |
| T06-007 | 后端 API — 段位与排行榜 | M | T06-002 | 段位查询 + 排行榜（全局/单游戏）+ 赛季重置 |
| T06-008 | 后端 API — 皮肤商城 | M | T06-003 | 皮肤列表 + 购买 + 装备 + 付费用户折扣 |
| T06-009 | 前端 — 游戏大厅 | L | T06-004 | 游戏列表 + 段位展示 + 皮肤商城入口 + 排行榜入口 |
| T06-010 | 前端 — 匹配与对战框架 | L | T06-005 | 模式选择 + 匹配动画 + 倒计时 + Phaser 3 游戏容器 + 横屏切换 |
| T06-011 | 前端 — 结算页面 | M | T06-006 | 胜负展示 + 段位变化动画 + 知识点回顾 + 再来一局 |
| T06-012 | 前端 — 段位排行榜 + 皮肤商城 | M | T06-007, T06-008 | 排行榜列表 + 皮肤预览/购买/装备 |
| T06-013 | 游戏通用系统集成验证 | M | 全部 | 完整流程：大厅 → 选模式 → 匹配 → (模拟游戏) → 结算 → 段位变更 |

---

## 三、详细任务文件命名

```
/tasks/06-game-common/
├── T06-001-db-game-base.md
├── T06-002-db-rank-system.md
├── T06-003-db-skin-shop.md
├── T06-004-api-game-hall.md
├── T06-005-api-matching.md
├── T06-006-api-session-settlement.md
├── T06-007-api-rank-leaderboard.md
├── T06-008-api-skin-shop.md
├── T06-009-fe-game-hall.md
├── T06-010-fe-matching-framework.md
├── T06-011-fe-settlement.md
├── T06-012-fe-rank-skin.md
└── T06-013-integration-verification.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」中文学习平台的「游戏通用系统」模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构（§三 后端高并发、WebSocket）
2. /grules/04-api-design.md — API 设计规约
3. /grules/05-coding-standards.md — 编码规范（并发安全、乐观锁/悲观锁）
4. /grules/06-ui-design.md — UI/UX 设计规范
5. /grules/09-task-workflow.md — 任务执行工作流
6. /product/apps/05-game-common/ — 游戏通用系统 PRD（全部 8 个文件）
   - 00-index.md → 模块总览
   - 01-game-hall.md → 游戏大厅 PRD
   - 02-mode-select.md → 模式选择 PRD
   - 03-matching.md → 匹配系统 PRD
   - 04-settlement.md → 结算系统 PRD
   - 05-rank-system.md → 段位系统 PRD
   - 06-leaderboard.md → 排行榜 PRD
   - 07-skin-shop.md → 皮肤商城 PRD
   - 08-hud-landscape.md → 横屏 HUD PRD
7. /product/00-product-overview.md §五.4 — 游戏段位系统规则
8. /game/00-index.md — 游戏总览（通用规则、防作弊）

【任务目标】
生成任务 T06-{NNN} 的详细任务文件。

【特别要求】
- 匹配系统必须基于 WebSocket（Supabase Realtime），支持段位相近匹配
- 匹配超时 30 秒 → AI 对战选项（AI 对战不影响段位）
- 计分必须在服务端完成（防作弊：服务端出题 + 服务端计分 + 时间校验）
- 段位系统精确实现：青铜→白银→黄金→铂金→钻石→星耀→王者，每段 III→II→I，星数制
- 赢 +1 星，输 -1 星，最低不跌破青铜 III 1 星
- 皮肤商城用知语币购买，付费用户享折扣
- Phaser 3 游戏容器需要封装为 React 组件，支持横屏切换
- 赛季 3 个月一季，结束时段位软重置
- PK 5 连胜奖励 1 知语币
- 段位晋级必须有专属星光粒子动画

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

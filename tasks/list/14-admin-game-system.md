# 14 — 管理后台-游戏管理与系统设置 (Admin Game & System)

> **优先级**: P1
> **目标文件夹**: `/tasks/14-admin-game-system/`
> **产品依据**: `product/admin/04-admin-game-system/` 全部文件
> **前置依赖**: 11-管理后台-登录仪表盘 完成 + 06-游戏通用系统数据库
> **预计任务数**: 12

---

## 一、分类概述

管理后台的游戏运营和系统配置模块。包含皮肤商城管理（上架/下架/定价）、赛季配置与管理、排行榜查看与干预、推送通知管理、多语言文案管理（i18n）、管理员账号管理、系统操作日志等。

**权限控制**：
- 皮肤/赛季/排行榜：游戏运营 + 超级管理员
- 推送/多语言/管理员/日志：超级管理员

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T14-001 | 后端 API — 皮肤管理 | M | T06-003, T11-003 | 皮肤 CRUD + 上架/下架 + 定价 + 分类 + 限定标签 |
| T14-002 | 后端 API — 赛季管理 | M | T06-002, T11-003 | 赛季 CRUD + 开始/结束 + 段位重置配置 + 奖励配置 |
| T14-003 | 后端 API — 排行榜管理 | M | T06-007 | 排行榜查看 + 异常数据干预 + 排行快照 |
| T14-004 | 后端 API — 推送管理 | M | T02-009, T11-003 | 推送模板 + 目标用户筛选 + 定时推送 + 推送历史 |
| T14-005 | 后端 API — 多语言管理 | M | T02-006, T11-003 | i18n 文案 CRUD + 语言包导入/导出 + 缺失翻译检测 |
| T14-006 | 后端 API — 系统操作日志 | M | T11-001 | 日志记录中间件 + 日志查询 + 筛选 + 导出 |
| T14-007 | 前端 — 皮肤管理页 | M | T14-001 | 皮肤列表 + 上传皮肤资源 + 定价/上架/下架 + 预览 |
| T14-008 | 前端 — 赛季管理页 | M | T14-002 | 赛季列表 + 新建赛季 + 段位重置预览 + 赛季数据统计 |
| T14-009 | 前端 — 排行榜与推送管理页 | M | T14-003, T14-004 | 排行榜查看 + 推送编辑器 + 用户筛选 + 推送历史 |
| T14-010 | 前端 — 多语言管理页 | M | T14-005 | 翻译文案表格编辑 + 导入/导出 + 缺失项高亮 |
| T14-011 | 前端 — 系统日志页 | M | T14-006 | 日志时间线 + 筛选（操作人/操作类型/时间）+ 详情 |
| T14-012 | 游戏管理与系统设置集成验证 | M | 全部 | 完整流程：上架皮肤 → 配置赛季 → 发送推送 → 查看日志 |

---

## 三、详细任务文件命名

```
/tasks/14-admin-game-system/
├── T14-001-api-skin-management.md
├── T14-002-api-season-management.md
├── T14-003-api-leaderboard-management.md
├── T14-004-api-push-management.md
├── T14-005-api-i18n-management.md
├── T14-006-api-system-logs.md
├── T14-007-fe-skin-management.md
├── T14-008-fe-season-management.md
├── T14-009-fe-leaderboard-push.md
├── T14-010-fe-i18n-management.md
├── T14-011-fe-system-logs.md
└── T14-012-integration-verification.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」管理后台的「游戏管理与系统设置」模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构
2. /grules/04-api-design.md — API 设计规约
3. /grules/05-coding-standards.md — 编码规范
4. /grules/06-ui-design.md — UI/UX 设计规范
5. /grules/09-task-workflow.md — 任务执行工作流
6. /product/admin/04-admin-game-system/ — 游戏管理与系统设置 PRD（全部 7 个文件）
   - 00-index.md → 模块总览
   - 01-skin-management.md → 皮肤管理 PRD
   - 02-season-management.md → 赛季管理 PRD
   - 03-leaderboard.md → 排行榜管理 PRD
   - 04-push-management.md → 推送管理 PRD
   - 05-i18n-management.md → 多语言管理 PRD
   - 06-admin-management.md → 管理员管理 PRD
   - 07-system-logs.md → 系统日志 PRD
7. /product/00-product-overview.md §五.4 — 游戏段位系统
8. /game/00-index.md — 游戏总览（皮肤系统、赛季规则）

【任务目标】
生成任务 T14-{NNN} 的详细任务文件。

【特别要求】
- 皮肤管理需要支持图片/动画资源上传（Supabase Storage）
- 皮肤定价以知语币为单位，付费用户显示折扣价
- 赛季管理需要段位软重置配置（重置规则、重置后段位映射）
- 排行榜管理需要能干预异常数据（如发现作弊可移除/重置）
- 推送管理需要精准的用户筛选（按段位/付费状态/活跃度/地区等）
- 推送支持定时发送和即时发送
- 多语言管理需要检测缺失翻译并高亮提示
- 系统日志需要记录所有管理员操作，粒度到字段级变更
- 日志不可删除、不可修改（只追加）
- 所有管理操作必须有操作确认弹窗

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

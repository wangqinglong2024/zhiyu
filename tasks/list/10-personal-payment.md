# 10 — 个人中心与支付 (Personal Center & Payment)

> **优先级**: P0
> **目标文件夹**: `/tasks/10-personal-payment/`
> **产品依据**: `product/apps/09-personal-payment/` 全部文件
> **前置依赖**: 02-全局框架 完成
> **预计任务数**: 14

---

## 一、分类概述

应用端 Tab 4 个人中心，以及贯穿全局的支付和经济体系。包含个人资料管理、我的课程、我的收藏、知语币体系（获取/消费/负数余额）、Paddle 支付集成、推荐返利系统、我的证书、基础设置等。

**核心业务规则**：
- 知语币比价：1 币 = $0.01（固定），不可提现/转让/充值，上限 100,000 币
- 来源：推荐付费（20%）、每日签到（1-10 币概率分布）、游戏连胜（5 连胜 1 币）、新手引导（100 币）
- 支付通道：Paddle MoR（Web 端），iOS Apple IAP（$7.99/级，后续）
- 推荐码：注册时填写，被推荐人付费 → 双方各得 20% 知语币，30 天无退款后到账

---

## 二、任务清单

| 任务 ID | 任务标题 | 复杂度 | 依赖 | 说明 |
|---------|---------|--------|------|------|
| T10-001 | 数据库 Schema — 知语币 | L | T02-014 | user_coins 表 + coin_transactions 表 + 余额快照 + 并发安全 + RLS |
| T10-002 | 数据库 Schema — 推荐系统 | M | T10-001 | referral_codes 表 + referral_records 表 + 关联奖励 + RLS |
| T10-003 | 数据库 Schema — 每日签到 | M | T10-001 | daily_checkins 表 + 签到日历 + 概率配置 |
| T10-004 | 后端 API — 知语币系统 | L | T10-001 | 余额查询 + 收支明细 + 获取/扣除（幂等）+ 负数余额处理 |
| T10-005 | 后端 API — Paddle 支付集成 | L | T10-001 | 创建订单 + Paddle Checkout + Webhook 回调 + 签名验证 |
| T10-006 | 后端 API — 退款处理 | L | T10-005 | 退款发起 + Paddle 退款 + 课程权限回收 + 知语币扣除（可至负数）|
| T10-007 | 后端 API — 推荐与签到 | M | T10-002, T10-003 | 推荐码生成/验证 + 每日签到（概率分布）+ 付费用户双倍 |
| T10-008 | 后端 API — 个人资料 | M | T01-006 | 个人信息 CRUD + 头像上传（Supabase Storage）|
| T10-009 | 前端 — 个人中心首页 | L | T10-004, T10-008 | 头像/昵称 + 段位卡片 + 功能列表入口 |
| T10-010 | 前端 — 我的课程 + 我的收藏 | M | T04-006, T03-006 | 课程进度总览 + 有效期展示 + 收藏列表 |
| T10-011 | 前端 — 知语币 + 签到 | M | T10-004, T10-007 | 余额展示 + 收支明细 + 每日签到日历 + 负数余额说明 |
| T10-012 | 前端 — 课程购买 + Paddle 支付 | L | T10-005 | 可购买 Level 列表 + Paddle Checkout 集成 + 购买成功回调 |
| T10-013 | 前端 — 基础设置 + 隐私协议 | M | T02-007, T02-008 | 语言/主题/推送设置 + 隐私政策/服务条款 + 清除缓存 |
| T10-014 | 个人中心与支付集成验证 | M | 全部 | 全流程：签到 → 购买课程 → 支付 → 课程解锁 → 知语币变动 |

---

## 三、详细任务文件命名

```
/tasks/10-personal-payment/
├── T10-001-db-coins.md
├── T10-002-db-referral.md
├── T10-003-db-daily-checkin.md
├── T10-004-api-coins.md
├── T10-005-api-paddle-payment.md
├── T10-006-api-refund.md
├── T10-007-api-referral-checkin.md
├── T10-008-api-profile.md
├── T10-009-fe-personal-center.md
├── T10-010-fe-courses-favorites.md
├── T10-011-fe-coins-checkin.md
├── T10-012-fe-purchase-payment.md
├── T10-013-fe-settings-privacy.md
└── T10-014-integration-verification.md
```

---

## 四、AI 生成详细任务的提示词

```
你是一名顶级全栈架构师，现在需要为「知语 Zhiyu」的「个人中心与支付」模块生成详细的任务文件。

【必须先阅读的文件】
1. /grules/01-rules.md — 全局架构（§三 并发安全、幂等处理）
2. /grules/04-api-design.md — API 设计规约（Webhook、签名验证）
3. /grules/05-coding-standards.md — 编码规范（金额操作、行锁、乐观锁）
4. /grules/06-ui-design.md — UI/UX 设计规范
5. /grules/09-task-workflow.md — 任务执行工作流
6. /product/apps/09-personal-payment/ — 个人中心与支付 PRD（全部 7 个文件）
   - 00-index.md → 模块总览
   - 01-personal-center.md → 个人中心首页 PRD
   - 02-my-courses.md → 我的课程 PRD
   - 03-favorites-certificates.md → 收藏与证书 PRD
   - 04-zhiyu-coins.md → 知语币系统 PRD
   - 05-purchase-payment.md → 课程购买与支付 PRD
   - 06-referral.md → 推荐返利 PRD
   - 07-data-nonfunctional.md → 数据模型与非功能需求
7. /product/00-product-overview.md — §五.1 课程购买 + §五.2 知语币体系

【任务目标】
生成任务 T10-{NNN} 的详细任务文件。

【特别要求】
- 知语币操作必须使用数据库行锁（SELECT ... FOR UPDATE）保证并发安全
- 每笔知语币变动必须有 idempotency_key 幂等保护
- Paddle 支付必须有完整的 Webhook 签名验证
- 退款流程：退款 → 课程权限回收 → 推荐奖励知语币扣除（余额可至负数）
- 每日签到概率分布必须精确实现（1 币=40%, 2 币=20%, ...）
- 付费用户签到双倍奖励
- 推荐码系统：30 天无退款后知语币才到账（延迟到账机制）
- 课程有效期 3 年，到期前 30/7/1 天推送提醒
- 续购享 20% 折扣
- 头像上传走 Supabase Storage，Bucket 权限遵循 RLS

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

# Epic E01 · 平台基础设施（Platform Foundation）

> 阶段：M0 · 优先级：P0 · 估算：4 周

## 摘要
搭建 monorepo、CI/CD、环境变量、基础部署管道，为所有后续 Epic 提供工程基础。

## 价值
所有团队可并行开发；从第一行代码起就有自动化测试 / 部署 / 监控。

## 范围
- pnpm + turborepo monorepo
- 4 apps（app / admin / web / api）+ 基础 packages
- TypeScript strict 全栈
- ESLint / Prettier / commitlint / husky
- GitHub Actions CI（lint / test / build）
- Cloudflare Pages + Render 部署
- Doppler secrets
- Sentry / PostHog / Better Stack 接入桩

## 非范围
- 业务功能
- UI 实现
- 数据库 schema（E03 引入）

## Stories

### ZY-01-01 · 初始化 Monorepo
**As a** 开发者 **I want** 标准 monorepo 骨架 **So that** 快速增加新包
**AC**
- [ ] pnpm workspace 配置
- [ ] turbo.json 任务定义
- [ ] tsconfig base + 各 app extend
- [ ] 4 apps + 5 packages 占位
- [ ] `pnpm i && pnpm build` 全绿
**Tech**：spec/03 § 1
**估**: M

### ZY-01-02 · TypeScript 严格配置
**AC**
- [ ] tsconfig strict + noUncheckedIndexedAccess
- [ ] 路径别名 `@zhiyu/*`
- [ ] 全包通过 typecheck
**估**: S

### ZY-01-03 · ESLint + Prettier + Commitlint
**AC**
- [ ] .eslintrc + .prettierrc 共享配置
- [ ] husky pre-commit + commit-msg
- [ ] commitlint 验 conventional commits
**估**: S

### ZY-01-04 · GitHub Actions CI
**AC**
- [ ] PR workflow: lint / typecheck / test / build
- [ ] Turbo remote cache
- [ ] PR comment 失败明细
- [ ] Bundle size check
**Tech**：spec/08 § 6
**估**: M

### ZY-01-05 · Cloudflare Pages 部署 (4 站)
**AC**
- [ ] app / admin / web / storybook 4 项目
- [ ] PR preview URL
- [ ] main → staging 自动
- [ ] tag → prod 手动审批
- [ ] 自定义域名配好
**Tech**：spec/08 § 4
**估**: M

### ZY-01-06 · Render API + Worker 部署
**AC**
- [ ] Dockerfile API + Worker
- [ ] Render service 配置（SG region）
- [ ] 健康检查 /health /ready
- [ ] Blue-green 部署
- [ ] 环境变量从 Doppler 注入
**Tech**：spec/08 § 5
**估**: L

### ZY-01-07 · Doppler Secrets 管理
**AC**
- [ ] 3 环境（dev/staging/prod）
- [ ] 本地 doppler run
- [ ] CI 注入
- [ ] Zod 启动校验
**Tech**：spec/09 § 15
**估**: S

### ZY-01-08 · Sentry FE/BE 接入
**AC**
- [ ] 前端 SDK + source map 上传
- [ ] 后端 SDK + 中间件
- [ ] release tracking
- [ ] 自定义 fingerprint 规则
**Tech**：spec/10 § 2
**估**: M

### ZY-01-09 · PostHog + Better Stack 接入
**AC**
- [ ] PostHog SDK + identify
- [ ] Better Stack 日志 transport（pino）
- [ ] 仪表板模板
**Tech**：spec/10 § 3, § 10
**估**: M

### ZY-01-10 · Supabase 初始化
**AC**
- [ ] 3 项目（dev/staging/prod, SG region）
- [ ] 网络连接测试
- [ ] PITR 启用
- [ ] 备份 cron
**Tech**：spec/05
**估**: S

### ZY-01-11 · Redis (Upstash) + BullMQ 骨架
**AC**
- [ ] Upstash 实例 SG
- [ ] BullMQ 连接 + 演示 job
- [ ] 健康检查包含
**Tech**：spec/04 § 5
**估**: M

### ZY-01-12 · 文档站 + Storybook 初始化
**AC**
- [ ] storybook.zhiyu.io 上线
- [ ] docs.zhiyu.io 占位
- [ ] CONTRIBUTING.md
- [ ] PR 模板 + ISSUE 模板
**估**: S

## 风险
- Cloudflare + Render 跨厂账单分散 → 早期月度 review
- Supabase region SG 容量限制 → 提前申请

## DoD
- [ ] PR 合入即触发 CI 全绿
- [ ] Preview URL 自动评论
- [ ] Staging 每日有部署
- [ ] 三件套监控有数据

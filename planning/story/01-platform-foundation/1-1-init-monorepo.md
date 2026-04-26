# ZY-01-01 · 初始化 Monorepo 骨架

> Epic：E01 · 估算：M · 状态：ready-for-dev
>
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 开发者
**I want** pnpm + Turborepo 标准 monorepo 骨架
**So that** 后续可直接增加业务包，不用反复处理基础脚手架

## 上下文
- 仓库根：`/opt/projects/zhiyu`（仅规划/文档/agent 配置）
- **代码根**：`/opt/projects/zhiyu/system`（`apps/`、`packages/`、`docker/`、`turbo.json`、`package.json`、`pnpm-workspace.yaml` 全部在此）
- 已有规划/文档目录（china/course/games/...）保留在仓库根，但**不进 docker 镜像**（见 §测试 + `.dockerignore`）。
- 4 个业务 app + 1 worker；4 个共享 package。

## Acceptance Criteria
- [ ] 根 `package.json`（私有）+ `pnpm-workspace.yaml` + `turbo.json`
- [ ] `apps/` 下：`web`（C 端 PWA）、`api`（C 端 BE）、`admin`（B 端 PWA）、`admin-api`（B 端 BE）、`worker`（BullMQ 消费者）
- [ ] `packages/` 下：`config`（共享 eslint/tsconfig/prettier）、`ui`（占位）、`sdk`（API client + supabase wrapper 占位）、`i18n`（占位）
- [ ] 根 `tsconfig.base.json`：`strict: true`、`noUncheckedIndexedAccess: true`、`exactOptionalPropertyTypes: true`
- [ ] 各 app/package extend base，并自定义 `paths`（路径别名 `@zhiyu/*`）
- [ ] `pnpm install --frozen-lockfile` 成功
- [ ] `pnpm turbo build typecheck` 全绿（容器内）
- [ ] 每个 app 占位首页/根接口（`apps/web` 输出 "Hello Zhiyu"，`apps/api` 暴露 `GET /api/v1/_ping` 返回 `{ ok: true }`）

## 技术参考
- spec/02 §一、§十一
- spec/03 §一（Monorepo 结构）

## 测试方法
```bash
cd system/docker
docker compose run --rm zhiyu-app-be pnpm -w typecheck
docker compose run --rm zhiyu-app-be pnpm -w build
```

## DoD
- [ ] 上述命令在 `115.159.109.23` 上执行成功
- [ ] 不引入禁用关键词（Cloudflare/Render/Doppler/Sentry/PostHog/Better Stack/Dify）
- [ ] PR 描述包含 `pnpm-lock.yaml` 校验和

## 不做
- 容器编排（属 ZY-01-03）
- ESLint/Prettier 具体规则（属 ZY-01-02）

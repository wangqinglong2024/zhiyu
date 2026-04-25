# 08 · 部署与 CI/CD（Deployment）

## 一、环境

| 环境 | 用途 | 触发 | 域名 |
|---|---|---|---|
| local | 本地开发 | `pnpm dev` | localhost |
| dev | 持续集成 | PR push | dev.zhiyu.io |
| staging | 预发 | main merge | staging.zhiyu.io |
| prod | 生产 | tag release | app.zhiyu.io / admin.zhiyu.io / api.zhiyu.io |

## 二、域名规划

```
zhiyu.io                  # 营销站
app.zhiyu.io              # 应用 PWA
admin.zhiyu.io            # 管理后台
api.zhiyu.io              # API 主域
ws.zhiyu.io               # WebSocket（IM）
cdn.zhiyu.io              # 静态资源（R2 自定义）
audio.zhiyu.io            # 音频 CDN
images.zhiyu.io           # 图片 CDN
status.zhiyu.io           # 状态页
storybook.zhiyu.io        # Storybook
docs.zhiyu.io             # 开发文档
```

## 三、部署目标

| 服务 | 平台 | 配置 |
|---|---|---|
| App PWA | Cloudflare Pages | Vite SPA |
| Admin | Cloudflare Pages | Vite SPA |
| Marketing | Cloudflare Pages | Vite SSG |
| API | Render (SG) | Node 20 Docker |
| Worker | Render (SG) | Node 20 Docker |
| Cron | Render Cron | - |
| Postgres | Supabase Cloud SG | Pro plan |
| Redis | Upstash SG | Standard |
| Storage | Cloudflare R2 | - |
| Storybook | Cloudflare Pages | - |

## 四、Cloudflare 配置

### 4.1 Pages 项目
- 4 个 Project（app / admin / marketing / storybook）
- Build 命令：`pnpm turbo build --filter=...`
- Output：`apps/<name>/dist`
- 环境变量按环境
- Preview URL 每 PR 自动

### 4.2 DNS
- 主区 zhiyu.io
- 子域 CNAME → Pages / Render

### 4.3 WAF Rules
- Bot 防护
- Rate Limit 全站 (10k/IP/hour)
- 关键端点限速
- 国家允许列表（可选）

### 4.4 Page Rules / Cache
- 静态资源 `/assets/*` → Cache Everything 1y
- HTML → no-cache
- API 透传

### 4.5 Workers
- 边缘函数（v1.5）
- 地理路由
- A/B 测试

### 4.6 R2
- 4 桶（images / audio / uploads / backups）
- Custom domain CDN
- Lifecycle policy（自动归档旧文件）

## 五、Docker

### 5.1 API Dockerfile
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/ ./packages/
RUN corepack enable && pnpm i --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm turbo build --filter=api

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 5.2 Worker Dockerfile
- 类似，CMD 指向 worker entry

## 六、CI/CD (GitHub Actions)

### 6.1 PR Workflow
```yaml
name: ci
on: [pull_request]
jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint typecheck test build --cache-dir=.turbo
      - uses: actions/upload-artifact@v4
        with: { name: build, path: apps/*/dist }
```

### 6.2 Preview Deploy
- PR 自动部署到 Cloudflare Pages preview
- API preview 部署（Render preview env）
- Bot 评论预览 URL

### 6.3 Main Merge → Staging
```yaml
on: { push: { branches: [main] } }
jobs:
  deploy-staging:
    steps:
      - deploy-pages (staging)
      - deploy-render (staging)
      - run-e2e (Playwright against staging)
      - notify-slack
```

### 6.4 Tag Release → Prod
```yaml
on: { push: { tags: ['v*.*.*'] } }
jobs:
  deploy-prod:
    environment: production  # GitHub manual approval
    steps:
      - deploy-pages (prod)
      - deploy-render (prod, blue-green)
      - smoke-tests
      - notify-slack
```

### 6.5 必备 Action
- Lint + Typecheck + Test
- Build with cache (Turborepo + remote cache)
- Bundle size check
- Lighthouse CI
- Sentry release
- Slack notify

## 七、数据库迁移

### 7.1 流程
```
1. 开发本地 drizzle generate
2. PR 包含 migration SQL
3. CI 验证（dryrun against shadow DB）
4. main merge → staging 自动 apply
5. 验证
6. tag release → prod 手动 apply（受控窗口）
```

### 7.2 安全
- 破坏性迁移分两步（add column → backfill → drop）
- 大表迁移分批（pgrm）
- 回滚脚本必备

### 7.3 工具
- Drizzle Kit
- Supabase CLI
- 备份在迁移前自动触发

## 八、Secrets

- Doppler 集中管理
- 各环境独立
- GitHub Actions 通过 Doppler CLI 注入
- 应用启动 Zod 校验

## 九、发布策略

### 9.1 Blue-Green
- API 双副本，新版本上线后切流
- Render 自带支持
- 失败回滚

### 9.2 灰度
- Cloudflare Workers 边缘灰度
- 按用户 ID hash → 1% → 10% → 100%

### 9.3 Feature Flag
- 重大功能 Flag 控制
- Flag 默认 off
- 灰度开启

## 十、监控部署

### 10.1 Sentry Release
- 自动上报 release version
- 关联 commit / PR
- Source map 上传

### 10.2 部署事件
- 通过 PostHog 标注 release
- 帮助识别回归

### 10.3 健康检查
- /health endpoint
- /ready endpoint
- /metrics (Prometheus 格式)

## 十一、备份与恢复

### 11.1 数据库
- Supabase PITR 7 天
- 每日 logical backup → R2
- 30 天保留

### 11.2 R2
- Versioning 启用关键桶
- 跨区复制（v1.5）

### 11.3 灾难恢复
- RTO: 4 小时
- RPO: 1 小时
- 演练每季度

## 十二、回滚

### 12.1 应用
- Cloudflare Pages 一键回滚到上一 deployment
- Render Docker tag 回滚

### 12.2 数据库
- 迁移回滚脚本
- PITR 恢复
- 业务数据可逆操作（软删 / 事件溯源）

### 12.3 全链路回滚演练
- 每季度
- 文档化 runbook

## 十三、容量监控

### 13.1 指标
- DB CPU / RAM / IOPS / 连接数
- API CPU / RAM / 请求数
- Worker 队列深度
- Redis 内存

### 13.2 告警
- > 70% 警告
- > 90% 紧急
- 自动扩缩 (Render)

## 十四、跨区域（v2）

### 14.1 阶段
- v1 单区（SG）
- v1.5 评估 HK 备
- v2 多区主动

### 14.2 数据
- DB read replica
- 写入主区
- 跨区 sync (Supabase)

## 十五、检查清单

- [ ] 4 环境完整
- [ ] PR 自动 preview
- [ ] main → staging 自动
- [ ] tag → prod 手动审批
- [ ] 数据库迁移自动 + 手动审
- [ ] Secrets 集中
- [ ] 备份自动 + 演练
- [ ] 回滚可一键
- [ ] 健康检查 + 监控

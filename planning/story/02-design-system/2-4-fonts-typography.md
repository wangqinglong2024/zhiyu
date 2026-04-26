# ZY-02-04 · 字体与排版（自托管，无 CDN）

> Epic：E02 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 多语言用户（en / es / zh / ar）
**I want** 在不同语种下都能看到清晰美观且高性能的字体
**So that** 阅读不疲劳，且首屏不出现 FOIT / FOUT。

## 上下文
- 自托管字体文件，**禁止** Google Fonts / Adobe Fonts CDN（违反"无外部 SaaS"铁律）。
- 字体文件放 `system/packages/ui/src/fonts/`，subset 后由 Vite 静态打包。
- 西文：Inter VF（拉丁子集）；中文：Noto Sans SC（GB2312 子集 + 常用 7000 字）；阿语：Noto Sans Arabic VF；日韩备用 system stack。
- 排版规则：定义 6 级（display / h1 / h2 / h3 / body / caption），每级双值（移动 / 桌面）。
- RTL 阿语下 `direction:rtl` + 镜像 padding/margin（Tailwind logical properties）。

## Acceptance Criteria
- [ ] 所有字体本地打包，体积 ≤ 350 KB gzip 总和
- [ ] `font-display: swap` 防止 FOIT；预加载 Inter regular + 当前语言主字
- [ ] 排版工具类 `.text-display / .text-h1 / ... / .text-caption`
- [ ] `dir="rtl"` 切换后 padding/margin 自动镜像
- [ ] 字体 license 文件（OFL）放在 `system/packages/ui/LICENSES/`

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web build && \
docker compose exec zhiyu-app-fe du -sh apps/web/dist/assets/fonts
```
- MCP Puppeteer：4 语切换截图；Lighthouse Performance ≥ 90

## DoD
- [ ] 字体体积达标
- [ ] 4 语视觉无回退到 system fallback（除非 system stack 故意）
- [ ] LICENSE 齐

## 不做
- 字体 lazy 加载（v1.5）
- 自定义可变字体设计（未来）

## 依赖
- 上游：ZY-02-01
- 下游：ZY-04 i18n

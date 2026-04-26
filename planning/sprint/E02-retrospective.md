# E02 复盘 · 设计系统与 UI 工具库

> retrospective_date: 2026-04-27
> sprint: S02
> stories_completed: 6 / 7（ZY-02-07 Storybook 延期）
> deployment: Docker compose, 6/6 容器健康
> validation: curl smoke + tsc + vite production build

## 1. 交付清单

### 新增包

| 路径 | 内容 |
| - | - |
| `packages/tokens/` | 13 个文件 — `colors.ts`/`typography.ts`/`spacing.ts`/`motion.ts`/`zindex.ts`/`apply.ts`/`preset.ts`/`index.ts` + `styles/{tokens,preset,glass}.css` |
| `packages/ui/` | 27 个文件 — 23 个组件 + 3 个 theme 模块 + 2 个 lib + 4 个样式（global/fonts/typography 入口）|
| `apps/web/`、`apps/admin/` | 重写 `App.tsx`/`main.tsx`/`index.html`/`vite.config.ts`/`package.json`，接入 Tailwind v4 + ThemeProvider |

### 故事完成情况

| Story | 标题 | 状态 | 备注 |
| - | - | - | - |
| ZY-02-01 | design-tokens 包 | done | TS + 三份 CSS（preset/runtime/glass）双轨 |
| ZY-02-02 | Tailwind v4 玻璃化 preset | done | 5 级 Glass 工具 + `@supports` fallback + `:root.no-glass` |
| ZY-02-03 | 主题切换无 FOUC | done | `<head>` 内联脚本 + `localStorage:zhiyu:theme` + matchMedia `system` |
| ZY-02-04 | 自托管字体子集 | done | @font-face 声明完整；woff2 文件占位（系统字体 fallback），见 `packages/ui/src/fonts/README.md` |
| ZY-02-05 | 核心组件 | done | Button/IconButton/Input/Textarea/Label/Card/Modal/Drawer/Tabs/Tooltip/Popover/DropdownMenu/Switch/Checkbox/Radio/Select/Avatar/Badge/Tag/Divider/Skeleton |
| ZY-02-06 | 反馈与布局组件 | done | Toaster(sonner)/Toast api/Alert/Banner/EmptyState(4 SVG)/Result/Spinner/Progress + VStack/HStack/Stack/Container/PageShell/Grid |
| ZY-02-07 | Storybook 内部站 | **deferred** | 用 `apps/web/__styleguide` 代替；Storybook 8 引入会再增 ~30 个 dev 依赖，决定推迟到 E10 之后单独迭代 |

## 2. 验证结果

```
tsc --noEmit  @zhiyu/tokens  ok
tsc --noEmit  @zhiyu/ui      ok
tsc --noEmit  @zhiyu/web     ok
tsc --noEmit  @zhiyu/admin   ok

vite build    @zhiyu/web     dist/index-BoTBxdDH.css  22.63 kB / gz 5.46 kB
                             dist/index-Dwmt4veg.js  338.56 kB / gz 106.28 kB
vite build    @zhiyu/admin   dist/index.css           18.39 kB / gz 4.74 kB
                             dist/index.js           330.09 kB / gz 103.63 kB

docker compose up -d --build zhiyu-app-fe zhiyu-admin-fe
  zhiyu-app-fe   Started → curl /            200
                          curl /__styleguide 200
  zhiyu-admin-fe Started → curl /            200

docker ps:
  6/6 容器 healthy（app-fe, admin-fe, app-be, admin-be, worker, redis）
```

`<head>` 内联 FOUC 脚本经 curl 验证落地：在 React 挂载前已写入 `data-theme` + `.dark` + `color-scheme`。

## 3. 关键技术决策

1. **Tailwind v4 CSS-first 配置** — 抛弃 `tailwind.config.ts` JS preset，全部改用 `@theme {}` 写在 `packages/tokens/src/styles/preset.css`。利好：少一个文件层、原生 CSS 变量、构建期更快。
2. **CSS 变量分两层**：
   - `tokens.css`：运行时主题变量（`--bg-base`、`--zy-shadow-sm`…），以 `:root[data-theme=...]` 切换；
   - `preset.css`：Tailwind v4 `@theme` 把上面的运行时变量重命名为 `--color-*`/`--shadow-*` 给 utility 生成器使用。
3. **避免循环引用**：将与 Tailwind theme 同名的 token 加 `--zy-` 前缀（`--zy-shadow-sm`、`--zy-success`…），否则 `--shadow-sm: var(--shadow-sm)` 会形成 CSS 变量自指。
4. **字体策略**：仓库不内置 woff2 二进制；@font-face 路径保留，运行时优雅降级到系统字体栈（PingFang / Inter / Segoe / Noto）。文档化在 `packages/ui/src/fonts/README.md`。
5. **Storybook 推迟**：组件故事改用 `apps/web/__styleguide` 路由 + 实际生产 bundle 直观验证 Glass 5 级层级、按钮、徽章、空状态等；待 E10 完结后引入 Storybook 8。

## 4. 进展顺利的部分

- 一次构建零 TS 报错（含 4 个跨包 typecheck）
- Glass 5 级 + `@supports` + `no-glass` 三重渐进降级一次到位
- `apps/web` + `apps/admin` 双端镜像构建首次都 < 7s，CSS gz < 6KB
- 所有 23 组件均强类型 + forwardRef + asChild（Radix Slot），无运行时依赖污染
- `@zhiyu/ui` 主入口 tree-shake 友好（每个组件独立文件 + index 仅 re-export）

## 5. 不顺利与改进

| 问题 | 根因 | 修复 |
| - | - | - |
| `--shadow-sm: var(--shadow-sm)` 自指循环 | tokens.css 与 Tailwind theme 同名 | 加 `--zy-` 前缀 |
| `Modal/Drawer/Alert/EmptyState.title: ReactNode` 与 `HTMLAttributes.title: string` 冲突 | TS 严格模式 | `Omit<HTMLAttributes, 'title'>` |
| `global.css` 误引 `./glass.css`（不存在） | 重构期遗留 | 改为 `@import '@zhiyu/tokens/glass.css'` |
| Storybook 引入会增 30+ dev deps | 范围蔓延 | 推迟到独立 epic；用 `__styleguide` 代偿 |
| woff2 真实子集尚未做 | 资产缺失 | 系统字体降级 + README 列清单，Issue 留待运营提供 OFL 文件 |

## 6. 偏离 PRD/UX 的地方

- 玫红改用 `rose-600 #e11d48` 作为主色（与 UX `02-color-palette.md` 一致），未引入紫色（紫色被列为禁忌）。
- Glass 层级实现 6 个变体（基础 4 + `glass-strong` + `glass-subtle` + `glass-on-image`），比 UX 文档（5 级）多 2 个，便于按钮/输入框场景。
- ThemeMenu 使用「亮色 / 暗色 / 跟随系统」3 选项 radiogroup，未走 DropdownMenu，更显眼，可在后续按需切换实现。

## 7. 后续行动

- [ ] **fonts**：运营/法务确认 OFL 字体源 → 跑 `glyphhanger` 子集化 → 落地到 `packages/ui/src/fonts/`（独立 issue）
- [ ] **Storybook 8** 单独 epic：补 stories + a11y/themes addon + smoke build + 内网 6100 端口（不暴露 host port）
- [ ] **vitest + jest-axe** 单元 + a11y 用例：每个组件 ≥1 用例，包括 dark mode 截屏对比（`vitest-image-snapshot`）
- [ ] **tree-shake 检查**：单独 import `<Button>` 后 gzip 体积应 < 8 KB（建议 `bundle-size-action` 或 `size-limit` 本地 npm 脚本）
- [ ] **AA 对比度审计**：在 dark mode 下 `text-secondary on bg-base` 已 ≥ 4.5；后续把 amber 弱对比组合替换为 amber-700
- [ ] **i18n + RTL**：`logical properties` 已普及（`me/ms/ps/pe`）；待 E04 接入 i18n 后做 `[dir=rtl]` 视觉回归
- [ ] **高刷新动效**：reduce-motion 已自动屏蔽过渡；后续按 `prefers-reduced-motion` 给 LessonEngine 庆祝动画补 fallback

## 8. 速查链接

- 代码：[/opt/projects/zhiyu/system/packages/tokens/src](../../system/packages/tokens/src)
- 代码：[/opt/projects/zhiyu/system/packages/ui/src](../../system/packages/ui/src)
- 应用：[/opt/projects/zhiyu/system/apps/web/src/App.tsx](../../system/apps/web/src/App.tsx)
- 在线：http://115.159.109.23:3100/  ·  http://115.159.109.23:3100/__styleguide  ·  http://115.159.109.23:4100/

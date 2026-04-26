# ZY-01-02 · 代码风格与本地 hooks

> Epic：E01 · 估算：S · 状态：ready-for-dev
>
> 顶层约束：[planning/00-rules.md](../../00-rules.md)（不引入任何托管 CI / commitlint）

## User Story
**As a** 开发者
**I want** 共享的 ESLint/Prettier 配置 + 本地 git hooks
**So that** 代码风格统一，不依赖外部 CI 把关

## Acceptance Criteria
- [ ] `packages/config/eslint.cjs`：基础规则（typescript-eslint + react + tailwindcss + import）
- [ ] `packages/config/prettier.cjs`：缩进 2、尾分号、单引号、`printWidth: 100`
- [ ] `packages/config/tsconfig.base.json`：strict 系列
- [ ] 每个 app/package 的 eslint/prettier 都 `extends` 共享配置
- [ ] 根装 `husky` + `lint-staged`：
  - `pre-commit`：`lint-staged` 跑 `eslint --fix` + `prettier --write` + 仅相关 typecheck
- [ ] **不**引入 commitlint / commitizen / husky `commit-msg` 钩子
- [ ] **不**新增 `.github/workflows/`、`.gitlab-ci.yml`、`.circleci/` 等任何 CI 配置
- [ ] README 写明：克隆仓库后跑 `pnpm install` 即自动装 hooks

## 技术参考
- spec/02 §十一、§十二

## 测试方法
- 本地修改一个 ts 文件加 unused import，`git add` + `git commit -m test`，应被 lint-staged 阻止或自动修复
- `grep -rE "github/workflows|gitlab-ci|circleci" .` 在 PR 中应无新增匹配

## DoD
- [ ] 测试方法步骤通过
- [ ] PR 描述含 `cat .husky/pre-commit` 输出截图

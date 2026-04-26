# ZY-04-01 · i18next 接入 (4 语 + 命名空间分包)

> Epic：E04 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 多语言用户
**I want** 应用界面支持 en / es / zh / ar 四语并按需懒加载
**So that** 首屏体积不被未用语言拖累。

## 上下文
- 物理路径：`system/packages/i18n/src/locales/<lng>/<ns>.json`
- 命名空间按页面/模块拆分：`common / auth / discover / courses / games / novels / payment / referral / customer / admin`
- i18next + react-i18next；后端用 i18next 同包跨平台共享文件。

## Acceptance Criteria
- [ ] `system/packages/i18n` export `i18n` 实例 + `useT(ns)` hook
- [ ] 4 语种切换不刷新页面；持久化 `localStorage:lng` & `<html lang>`、`<html dir>` 同步
- [ ] 命名空间懒加载（动态 import json）
- [ ] 缺 key 兜底：fallback en + console.warn（dev only）
- [ ] BE：`req.t(key)` 中间件（按 `Accept-Language`）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/i18n test
```
- MCP Puppeteer：4 语切换截图

## DoD
- [ ] 4 语切换无 FOUC
- [ ] BE 错误 i18n 命中

## 不做
- 翻译管理后台（属 ZY-04-04）
- 字体（属 ZY-02-04）

## 依赖
- 上游：ZY-02-04
- 下游：所有 FE/BE 文案

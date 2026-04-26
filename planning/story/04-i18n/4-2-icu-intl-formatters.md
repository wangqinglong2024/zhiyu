# ZY-04-02 · ICU 复数 / 性别 / 数字 / 日期 / 货币

> Epic：E04 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 多语言用户
**I want** 数字 / 日期 / 货币按本地习惯显示
**So that** 不会出现"$1,234.56" 在阿语下颠倒或汉字日期错位。

## 上下文
- 用 `Intl.NumberFormat` / `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat`；i18next 用 `i18next-icu` 处理 plural / select。
- 货币默认 USD；中国区 CNY；切换通过 user settings + 地理推断。
- ar 用 latn 数字（避免阿拉伯-印度数字混淆问题）。

## Acceptance Criteria
- [ ] 工具：`fmtNumber / fmtDate / fmtRelative / fmtCurrency` 在 `@zhiyu/i18n`
- [ ] ICU 模板：`'{count, plural, one {# item} other {# items}}'` 在 4 语全覆盖
- [ ] 单元测试 4 语 × 5 场景（普通 / 复数 / 0 / 大数 / RTL）
- [ ] 默认时区 `Asia/Shanghai`，可被 user_settings 覆盖

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/i18n test format
```

## DoD
- [ ] 4 语 × 5 场景全绿

## 不做
- 自定义日历（藏历 / 农历 v1.5）

## 依赖
- 上游：ZY-04-01

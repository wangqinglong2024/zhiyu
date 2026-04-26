# ZY-03-04 · 个人资料与头像上传

> Epic：E03 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 编辑昵称 / 简介 / 学习目标 / HSK 自评，并上传头像
**So that** 个性化首屏推荐 & 社区可识别。

## 上下文
- 头像走 supabase-storage `images/avatars/<uid>/<ts>.webp`；FE 自切到 webp 并裁 1:1。
- 单图最大 2 MB；后端二次校验 mimetype + magic bytes。
- 编辑表单字段：display_name / username（仅一次免费修改 / 30 天后再次需消耗 100 ZC，接 ZY-12）/ bio (≤ 200) / hsk_self_level / goal / locale。

## Acceptance Criteria
- [ ] `PATCH /api/v1/me` { ...fields } 校验 + 写库 + 触发 audit_log
- [ ] `POST /api/v1/me/avatar` 上传到 storage，返回 url
- [ ] FE `/me/edit` 页：表单 + 头像剪裁
- [ ] username 修改逻辑：免费一次 → 之后扣 100 ZC（调 ZY-12-03 spend API）
- [ ] 必填校验 + i18n 错误

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run me.profile
```
- MCP Puppeteer：上传 jpg/png 自动转 webp + 显示

## DoD
- [ ] 头像渲染正常
- [ ] 大文件被拒
- [ ] 不存到本地磁盘

## 不做
- 个人主页公开 URL（v1.5）
- 关注/粉丝（v1.5）

## 依赖
- 上游：ZY-03-01 / ZY-12-03
- 下游：社区相关

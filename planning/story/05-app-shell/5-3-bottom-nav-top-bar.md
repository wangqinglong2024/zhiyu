# ZY-05-03 · 底部导航 + 顶栏（C 端 4 区）

> Epic：E05 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 主流应用风格的底部 4 tab + 顶部状态栏
**So that** 一眼找到 学/玩/读/我 四大入口，频道切换不迷路。

## 上下文
- 4 tab：发现 / 课程 / 游戏 & 小说 / 我；中间 +号 加 fab（推荐 today）。
- 顶栏：左 logo + lng 切换；右 通知铃铛（接 ZY-05-06）+ 头像菜单（含主题 / 退出 / 设置）。
- 仅在 `mobile` 显示底部导航；桌面侧边导航。
- 切换 tab 不重渲染兄弟 tab（保留 scroll 状态）。

## Acceptance Criteria
- [ ] `<BottomNav>` + `<TopBar>` + `<SideNav>` 组件
- [ ] 当前 tab 高亮 + 微动效（缩放 + 颜色切）
- [ ] 切 tab 保留 scroll 位置
- [ ] aria-current="page" 正确
- [ ] 通知铃铛 badge 数字（接 ZY-05-06 数据）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run shell
```
- MCP Puppeteer：iPhone viewport 切 4 tab，截图

## DoD
- [ ] 视觉对照 ux 稿
- [ ] tab 切换 ≤ 80ms

## 依赖
- 上游：ZY-02 / ZY-05-02 / ZY-05-06

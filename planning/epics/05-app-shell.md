# Epic E05 · 应用骨架与导航（App Shell）

> 阶段：M1 · 优先级：P0 · 估算：3 周

## 摘要
PWA 骨架、TanStack Router 路由、底部导航、顶栏、首屏发现页框架。

## 范围
- PWA manifest + Service Worker
- TanStack Router 路由结构
- 底部 5 项导航（玩 / 学 / 发现 / 知语币 / 我）
- 顶部栏（搜索 / 通知 / 知语币）
- 加载策略（骨架 + 渐进）
- 离线兜底页

## Stories

### ZY-05-01 · PWA Manifest + 图标
**AC**
- [ ] manifest.json 完整
- [ ] 图标全尺寸（含 maskable）
- [ ] iOS splash screen
- [ ] 安装提示 UX
**估**: M

### ZY-05-02 · Service Worker（Workbox）
**AC**
- [ ] 静态资源 cache-first
- [ ] API stale-while-revalidate（GET）
- [ ] 离线兜底页
- [ ] 自动更新提示
**估**: L

### ZY-05-03 · TanStack Router 配置
**AC**
- [ ] 文件路由 + 类型生成
- [ ] 受保护路由（auth）
- [ ] 嵌套布局
- [ ] 滚动恢复
**Tech**：ux/06-navigation-routing.md
**估**: M

### ZY-05-04 · TanStack Query 配置
**AC**
- [ ] QueryClient + persister
- [ ] 错误兜底
- [ ] 全局重试策略
- [ ] DevTools dev only
**估**: S

### ZY-05-05 · 底部导航 5 项
**AC**
- [ ] 玻璃态 sticky
- [ ] 激活态高亮
- [ ] 安全区适配
- [ ] 切换动画
**Tech**：ux/06 § 3
**估**: M

### ZY-05-06 · 顶栏 + 搜索入口
**AC**
- [ ] 知语 logo
- [ ] 搜索图标 → 全站搜索 modal
- [ ] 通知图标 + 红点
- [ ] 知语币入口
**Tech**：ux/06 § 2
**估**: M

### ZY-05-07 · 全站搜索 modal
**AC**
- [ ] cmdk 命令面板
- [ ] 多源（课程 / 文章 / 小说 / 词）
- [ ] 历史 + 推荐
**估**: L

### ZY-05-08 · 首屏发现页骨架
**AC**
- [ ] Hero + 推荐 + 持续学习 + 内容卡片
- [ ] 横向滚动模块
- [ ] 骨架占位
- [ ] 错误兜底
**Tech**：ux/09-screens-app-discover.md
**估**: L

### ZY-05-09 · 通知中心 sheet
**AC**
- [ ] 列表 + 已读 / 未读
- [ ] 类型过滤
- [ ] 单条点击跳转
**估**: M

### ZY-05-10 · App 容器响应（手机 / 平板 / 桌面）
**AC**
- [ ] < 640 移动栈
- [ ] 640-1024 平板优化
- [ ] > 1024 侧栏 + 内容
- [ ] 容器 query 适配
**Tech**：ux/05
**估**: M

## 风险
- iOS PWA 限制（推送 16.4+）→ UX 提示

## DoD
- [ ] Lighthouse PWA ≥ 95
- [ ] 离线兜底可用
- [ ] 路由全部正常
- [ ] 全屏适配 3 端

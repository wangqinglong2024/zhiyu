# T13-007: 前端 — 用户列表页 (FE User List Page)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

实现管理后台「用户管理」列表页。包含：① 药丸形毛玻璃搜索栏（500ms 防抖，≥2 字符触发，命中文字 Amber 高亮），② 6 维度筛选栏（用户类型/注册日期/最近活跃/国家/段位/状态），③ 11 列毛玻璃数据表格（3 列可排序，行高 56px），④ 分页组件（每页 20 条），⑤ CSV 导出（异步生成 + 自动下载），⑥ 操作列（查看详情/封禁/解封），⑦ 7 个状态矩阵（Empty/Loading/FirstLoad/Success/Error/Partial/Offline）。严格遵循 Cosmic Refraction 设计系统。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/01-user-list.md` — 用户列表完整 PRD
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 后端 API: T13-001 — 用户列表与搜索 API
- 管理后台框架: T11-001/T11-002 — 管理后台全局布局、路由
- 封禁弹窗: T13-009 — 封禁管理前端（弹窗组件复用）

## 技术方案

### 路由

```
/admin/users → UserListPage
```

### 页面布局

```
┌─────────────────────────────────────────────────────────┐
│ [H2] 用户管理          [导出 CSV] [🔍 搜索框 360px]      │
├─────────────────────────────────────────────────────────┤
│ [用户类型▼] [注册日期📅] [最近活跃📅] [国家▼] [段位▼] [状态▼] [重置筛选] │
├─────────────────────────────────────────────────────────┤
│ .glass-card 表格                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ID | 用户信息 | 邮箱 | 注册日期↓ | 活跃 | 类型 | ...│ │
│ │ ...                                                 │ │
│ │ 共 X 条记录 · 第 1/Y 页    [< 上一页] [下一页 >]     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 组件结构

```typescript
// frontend/src/pages/admin/users/UserListPage.tsx
// 页面主组件，组装搜索 + 筛选 + 表格 + 分页

// frontend/src/pages/admin/users/components/UserSearchBar.tsx
// 药丸形毛玻璃搜索框，500ms 防抖，Lucide Search + X 清除

// frontend/src/pages/admin/users/components/UserFilters.tsx
// 6 维度筛选栏：用户类型/注册日期/活跃日期/国家/段位/状态 + 重置按钮

// frontend/src/pages/admin/users/components/UserTable.tsx
// 毛玻璃表格，11 列定义，斑马纹，行 Hover，3 列排序

// frontend/src/pages/admin/users/components/UserTableRow.tsx
// 单行渲染：头像+昵称、邮箱截断 Tooltip、类型标签色、段位图标、状态圆点、操作按钮

// frontend/src/pages/admin/users/hooks/useUserList.ts
// 数据获取 Hook：搜索/筛选/排序/分页状态管理 + API 调用
```

### Cosmic Refraction 设计要点

```
搜索框: .glass-input, rounded-full, w-[360px]
筛选项: .glass-input, rounded-md (12px), 间距 12px
表格容器: .glass-card, rounded-2xl (24px), padding 0
表头背景: rgba(255,255,255,0.03), 文字 12px/600/灰#a3a3a3/大写/letter-spacing 0.08em
行高: 56px, Hover 背景 rgba(255,255,255,0.04) transition 150ms
斑马纹: 偶数行 rgba(255,255,255,0.02)
导出按钮: .glass-button-secondary, rounded-full, Lucide Download 16px
颜色限定: Rose/Sky/Amber 仅三色，绝对禁止 purple
用户类型标签: 游客=灰, 免费=Sky#0284c7, 付费=Amber#d97706
状态: 正常=绿色圆点#22c55e, 封禁中=红色圆点#ef4444
搜索高亮: Amber 背景 #fde68a
超过 30 天未活跃: 文字红色 #ef4444
```

### 排序交互（三态循环）

```
点击列头 → 未排序(ArrowUpDown) → 降序(ArrowDown) → 升序(ArrowUp) → 未排序
同一时间仅一列排序，切换新列时重置旧列
可排序列: 注册日期(默认降序) / 最近活跃 / 累计消费
```

### CSV 导出流程

```
点击"导出 CSV" → 按钮变 Loading + "生成中…"
→ GET /api/v1/admin/users/export?{当前筛选参数}
→ 成功 → 自动触发下载 + Toast "导出完成"
→ 超时(30s) → Toast "导出超时，请缩小数据范围后重试"
→ 失败 → Toast 错误提示
文件名: zhiyu_users_YYYYMMDD_HHmmss.csv
```

### 7 状态矩阵

| 状态 | UI 表现 |
|------|--------|
| Empty | 表格区 Lucide `UserX` 48px 灰 + "未找到匹配用户" + "重置筛选" CTA (Sky) |
| Loading | 10行×11列 Skeleton 骨架屏，行高 56px |
| FirstLoad | 页面整体骨架屏：搜索栏 + 筛选栏 + 表格骨架 |
| Success | 正常展示 + "共 X 条记录" |
| Error | Lucide `AlertCircle` 48px 红 + "数据加载失败" + "重试" (Rose) |
| Partial | 当前页透明度 40% + 底部 3 行骨架叠加 |
| Offline | 顶部 Banner 黄色 "网络连接已断开，显示的数据可能不是最新的" |

## 范围（做什么）

- 创建 `UserListPage` 页面组件（路由 `/admin/users`）
- 实现搜索栏组件（药丸形/防抖/最少2字符/清除/命中高亮）
- 实现 6 维度筛选栏组件（含日期范围选择器校验）
- 实现 11 列数据表格组件（毛玻璃/斑马纹/排序/分页）
- 实现 CSV 导出功能（异步下载 + Loading 态 + 超时处理）
- 实现操作列（查看详情跳转 / 封禁+解封按钮条件显示）
- 实现完整 7 状态矩阵 UI
- 实现 `useUserList` 自定义 Hook（状态管理 + API 集成）

## 边界（不做什么）

- 不实现封禁/解封弹窗（T13-009）
- 不实现后端 API（T13-001 已完成）
- 不实现用户详情页跳转后的页面（T13-008）
- 不实现列表实时刷新（手动刷新即可）

## 涉及文件

- 新建: `frontend/src/pages/admin/users/UserListPage.tsx` — 页面主组件
- 新建: `frontend/src/pages/admin/users/components/UserSearchBar.tsx` — 搜索栏
- 新建: `frontend/src/pages/admin/users/components/UserFilters.tsx` — 筛选栏
- 新建: `frontend/src/pages/admin/users/components/UserTable.tsx` — 数据表格
- 新建: `frontend/src/pages/admin/users/components/UserTableRow.tsx` — 表格行
- 新建: `frontend/src/pages/admin/users/hooks/useUserList.ts` — 数据 Hook
- 修改: `frontend/src/router/admin.tsx` — 注册 `/admin/users` 路由
- 修改: `frontend/src/components/admin/Sidebar.tsx` — 侧边栏添加"用户管理"导航项

## 依赖

- 前置: T13-001（后端 API）、T11-001/T11-002（管理后台框架）
- 后续: T13-008（用户详情页）、T13-009（封禁管理弹窗）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员登录后台
   **WHEN** 进入 `/admin/users`
   **THEN** 展示用户列表页：搜索栏 + 6 筛选项 + 毛玻璃表格 + 分页，默认按注册日期降序

2. **GIVEN** 搜索框输入 "zh"（≥2 字符）
   **WHEN** 500ms 防抖触发
   **THEN** 表格数据根据搜索结果过滤，命中文字 Amber 高亮

3. **GIVEN** 选择筛选项：用户类型=付费用户，注册日期=2024-01-01~2024-12-31
   **WHEN** 筛选自动触发
   **THEN** 表格仅展示匹配用户，分页更新

4. **GIVEN** 用户点击"注册日期"列头
   **WHEN** 当前为降序
   **THEN** 切换为升序，图标变为 ArrowUp

5. **GIVEN** 用户点击"导出 CSV"
   **WHEN** 当前有 1000 条筛选结果
   **THEN** 按钮变 Loading + "生成中…" → 下载完成 → Toast "导出完成"

6. **GIVEN** 用户状态为"正常"
   **WHEN** 查看操作列
   **THEN** 显示"查看详情"(Sky) + "封禁"(红) 两个按钮

7. **GIVEN** 用户状态为"封禁中"
   **WHEN** 查看操作列
   **THEN** 显示"查看详情"(Sky) + "解封"(绿) 两个按钮

8. **GIVEN** 筛选无结果
   **WHEN** 页面展示
   **THEN** 表格区域显示 UserX 图标 + "未找到匹配用户" + "重置筛选" 按钮

9. **GIVEN** 搜索框输入 1 个字符
   **WHEN** 等待任意时间
   **THEN** 不触发搜索，保持全量列表

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. Browser MCP 访问 `/admin/users` — 验证页面渲染
3. 搜索栏输入测试：防抖触发 + 高亮 + 清除
4. 筛选交互测试：各筛选项选择/重置
5. 表格排序测试：三态循环切换
6. 分页测试：翻页 + 页码显示
7. CSV 导出测试：Loading 态 + 下载
8. 操作列测试：封禁/解封按钮条件显示
9. 空状态/错误状态 UI 测试

### 测试通过标准

- [ ] Docker 构建成功，前端容器正常运行
- [ ] 页面完整渲染（搜索栏 + 筛选 + 表格 + 分页）
- [ ] 搜索防抖 500ms + ≥2 字符触发 + Amber 高亮
- [ ] 6 维度筛选正确联动表格
- [ ] 3 列排序三态循环正确
- [ ] CSV 导出 Loading 态 + 自动下载
- [ ] 操作按钮条件显示正确
- [ ] 7 个状态矩阵 UI 正确
- [ ] 毛玻璃效果 + Cosmic Refraction 设计规范一致
- [ ] 无 purple 色出现
- [ ] Tailwind CSS v4 语法（`@import "tailwindcss"` + `@theme`）

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-007-fe-user-list.md`

## 自检重点

- [ ] Cosmic Refraction 设计系统：毛玻璃、blur(24px) saturate(1.8)
- [ ] 严格 Rose/Sky/Amber 三色，无 purple
- [ ] Tailwind CSS v4 — 无 tailwind.config.js
- [ ] 搜索防抖 500ms（使用 useMemo + setTimeout / lodash debounce）
- [ ] 日期范围校验（起始 ≤ 结束）
- [ ] 表格列宽符合 PRD 定义
- [ ] 邮箱列超长 ellipsis + Hover Tooltip
- [ ] 累计消费右对齐 + tabular-nums
- [ ] 无 console.log / any 类型

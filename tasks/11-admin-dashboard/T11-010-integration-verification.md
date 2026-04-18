# T11-010: 端到端集成验证

> 分类: 11-管理后台-登录与仪表盘 (Admin Dashboard)
> 状态: 📋 待开发
> 复杂度: L(较大)
> 预估文件数: 2

## 需求摘要

对 T11-001 至 T11-009 的全部开发成果进行端到端集成验证。通过 Docker 容器启动完整系统，使用 Browser MCP (Puppeteer) 执行全流程自动化测试：数据库 Schema 验证 → 后端 API 功能验证 → 前端登录流程 → 权限验证 → 仪表盘数据展示 → 管理员管理操作。覆盖所有 PRD 验收标准（L-01~L-13、P-01~P-09、N-01~N-11、D-01~D-18），汇总所有截图和测试结果到最终报告。

## 相关上下文

- 产品需求: `product/admin/01-admin-dashboard/05-data-nonfunctional.md` §三 — **全部 51 项验收标准汇总**
- 产品需求: `product/admin/01-admin-dashboard/01-login.md` — 登录 PRD
- 产品需求: `product/admin/01-admin-dashboard/02-permissions.md` — 权限 PRD
- 产品需求: `product/admin/01-admin-dashboard/03-navigation.md` — 导航 PRD
- 产品需求: `product/admin/01-admin-dashboard/04-dashboard.md` — 仪表盘 PRD
- 测试标准: `grules/08-qa-testing.md` — QA 测试规范
- 任务流程: `grules/09-task-workflow.md` — 结果报告模板
- 环境配置: `grules/env.md` — Docker 环境、端口配置
- 关联任务: 前置 T11-001 至 T11-009 全部完成

## 技术方案

### 验证阶段总览

```
阶段 1: 环境搭建与健康检查
阶段 2: 数据库 Schema 验证
阶段 3: 后端 API 功能验证
阶段 4: 前端登录流程 E2E
阶段 5: 权限系统 E2E
阶段 6: 导航布局 E2E
阶段 7: 仪表盘页面 E2E
阶段 8: 管理员管理 E2E
阶段 9: 响应式与 UI 规范验证
阶段 10: 性能与安全基础验证
```

### 阶段 1: 环境搭建与健康检查

```bash
# 1.1 构建并启动全部服务
docker compose up -d --build

# 1.2 验证所有容器状态
docker compose ps
# 预期: 所有服务 Running（frontend, backend, postgres/supabase）

# 1.3 验证端口可达
curl -s http://localhost:8100/health  # 后端健康检查
curl -s http://localhost:3100/         # 前端可访问

# 1.4 查看日志确认无启动错误
docker compose logs --tail=50 backend | grep -i error
docker compose logs --tail=50 frontend | grep -i error
```

### 阶段 2: 数据库 Schema 验证

```bash
# 2.1 验证表结构
docker compose exec db psql -U postgres -d zhiyu -c "
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'admin_roles', 'admin_audit_logs');
"
# 预期: 3 张表存在

# 2.2 验证 ENUM 类型
docker compose exec db psql -U postgres -d zhiyu -c "
  SELECT typname, enumlabel FROM pg_enum
  JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
  WHERE typname IN ('admin_role', 'admin_status')
  ORDER BY typname, enumsortorder;
"
# 预期: admin_role (4 值) + admin_status (3 值)

# 2.3 验证种子数据
docker compose exec db psql -U postgres -d zhiyu -c "
  SELECT name, role FROM admin_users;
"
# 预期: 至少 1 条初始超级管理员 (admin@ideas.top)

# 2.4 验证角色权限数据
docker compose exec db psql -U postgres -d zhiyu -c "
  SELECT role, jsonb_array_length(permissions) as perm_count FROM admin_roles;
"
# 预期: 4 个角色，各有不同数量的权限

# 2.5 验证索引
docker compose exec db psql -U postgres -d zhiyu -c "
  SELECT indexname FROM pg_indexes WHERE tablename = 'admin_users';
"
# 预期: email 唯一索引 + role 索引 + status 索引

# 2.6 验证 RLS 策略
docker compose exec db psql -U postgres -d zhiyu -c "
  SELECT tablename, policyname FROM pg_policies
  WHERE tablename IN ('admin_users', 'admin_roles', 'admin_audit_logs');
"
# 预期: deny all 策略（仅服务端 service_role 可访问）
```

### 阶段 3: 后端 API 功能验证

```bash
# 3.1 登录 API
LOGIN_RESP=$(curl -s -X POST http://localhost:8100/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ideas.top","password":"Zhiyu@2026"}')
echo $LOGIN_RESP | jq .
# 预期: { success: true, data: { access_token, refresh_token, admin: {...} } }

ACCESS_TOKEN=$(echo $LOGIN_RESP | jq -r '.data.access_token')

# 3.2 获取当前管理员信息
curl -s http://localhost:8100/api/v1/admin/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
# 预期: { success: true, data: { id, email, name, role } }

# 3.3 获取角色列表
curl -s http://localhost:8100/api/v1/admin/roles \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
# 预期: 4 个角色及其权限

# 3.4 获取仪表盘指标
curl -s http://localhost:8100/api/v1/admin/dashboard/metrics \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
# 预期: { success: true, data: { total_users, active_users_today, ... } }

# 3.5 获取趋势数据
curl -s "http://localhost:8100/api/v1/admin/dashboard/trends?period=7d" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
# 预期: { success: true, data: { user_growth: [...], revenue: [...], game_dau: [...] } }

# 3.6 获取在线用户数
curl -s http://localhost:8100/api/v1/admin/dashboard/online-count \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
# 预期: { success: true, data: { count: number } }

# 3.7 获取管理员列表
curl -s "http://localhost:8100/api/v1/admin/users?page=1&page_size=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
# 预期: 分页管理员列表

# 3.8 错误密码登录测试
curl -s -X POST http://localhost:8100/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ideas.top","password":"wrong_password"}' | jq .
# 预期: { success: false, error: { code: "AUTH_INVALID_CREDENTIALS", remaining_attempts: 4 } }

# 3.9 无 Token 访问保护 API
curl -s http://localhost:8100/api/v1/admin/dashboard/metrics | jq .
# 预期: { success: false, error: { code: "AUTH_TOKEN_MISSING" } }

# 3.10 Token 刷新
curl -s -X POST http://localhost:8100/api/v1/admin/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$(echo $LOGIN_RESP | jq -r '.data.refresh_token')\"}" | jq .
# 预期: 新的 access_token
```

### 阶段 4: 前端登录流程 E2E（Browser MCP）

```
4.1 访问 http://localhost:3100/admin/login
    → 截图 [S01-login-page.png]
    → 验证: 深色背景 + 毛玻璃卡片 + Logo + "知语 Zhiyu" + "管理后台"

4.2 测试邮箱校验
    → 输入 "invalid-email" → Tab 键离开
    → 截图 [S02-email-validation.png]
    → 验证: 红色错误提示 "请输入有效的邮箱地址"

4.3 测试空密码校验
    → 输入邮箱 "admin@ideas.top" → 不输入密码 → 点击登录
    → 截图 [S03-password-required.png]
    → 验证: "请输入密码" 提示

4.4 测试错误密码
    → 输入 "admin@ideas.top" + "wrong_pass"
    → 点击登录
    → 截图 [S04-login-error.png]
    → 验证: 红色横幅 "邮箱或密码错误，还剩 X 次尝试机会" + 密码框抖动

4.5 测试正确登录
    → 输入 "admin@ideas.top" + "Zhiyu@2026"
    → 点击登录
    → 等待跳转
    → 截图 [S05-login-success.png]
    → 验证: 跳转到 /admin/dashboard + Toast "登录成功"

4.6 测试密码显隐切换
    → 返回登录页 → 输入密码 → 点击眼睛图标
    → 截图 [S06-password-toggle.png]
    → 验证: 密码可见/不可见切换
```

### 阶段 5: 权限系统 E2E（Browser MCP）

```
5.1 以 content_ops 角色登录（需先创建测试账号）
    → 截图 [S07-content-ops-sidebar.png]
    → 验证: 侧边栏仅显示 "仪表盘" + "内容管理"

5.2 以 content_ops 直接访问 /admin/users/list
    → 截图 [S08-no-permission.png]
    → 验证: 显示 NoPermissionPage（ShieldX 图标 + "无权限访问"）

5.3 以 content_ops 直接访问 /admin/system/admins
    → 截图 [S09-no-permission-admin.png]
    → 验证: 显示 NoPermissionPage

5.4 以 super_admin 登录 → 访问 /admin/system/admins
    → 截图 [S10-admin-management.png]
    → 验证: 正常显示管理员管理页面
```

### 阶段 6: 导航布局 E2E（Browser MCP）

```
6.1 以 super_admin 登录
    → 截图 [S11-full-layout-1280.png] (1280px 宽)
    → 验证: 侧边栏展开 (240px) + 6 个一级菜单 + 顶部栏

6.2 点击侧边栏折叠按钮
    → 截图 [S12-sidebar-collapsed.png]
    → 验证: 侧边栏收缩至 64px，仅显示图标

6.3 刷新页面
    → 验证: 侧边栏保持折叠状态（localStorage 记忆）

6.4 Hover 折叠态一级菜单图标
    → 截图 [S13-collapsed-tooltip.png]
    → 验证: 显示 Tooltip 菜单名称

6.5 Hover 折叠态含子菜单的一级图标
    → 截图 [S14-collapsed-popover.png]
    → 验证: 弹出浮层面板显示二级菜单

6.6 导航到文章管理页
    → 截图 [S15-menu-active.png]
    → 验证: "内容管理" 展开，"文章管理" Rose 色高亮 + 左侧竖条

6.7 查看面包屑
    → 截图 [S16-breadcrumb.png]
    → 验证: "内容管理 / 文章管理" + 点击"内容管理"可跳转

6.8 调整窗口到 1024px
    → 截图 [S17-small-desktop.png]
    → 验证: 侧边栏默认折叠

6.9 调整窗口到 800px
    → 截图 [S18-tablet-overlay.png]
    → 验证: 侧边栏隐藏 + 汉堡按钮可见 + 点击弹出 overlay
```

### 阶段 7: 仪表盘页面 E2E（Browser MCP）

```
7.1 以 super_admin 访问 /admin/dashboard
    → 截图 [S19-dashboard-full.png]
    → 验证: 6 个指标卡片 + 趋势图 + 内容概览 + 快捷操作 + 操作日志

7.2 验证指标卡片格式
    → 截图 [S20-metric-cards.png]
    → 验证: 千分位格式化、¥万 格式、百分比、环比指示

7.3 切换趋势图周期到 30 天
    → 点击 "30天" 按钮
    → 截图 [S21-trend-30d.png]
    → 验证: 三张折线图数据更新

7.4 Hover 折线图数据点
    → 截图 [S22-chart-tooltip.png]
    → 验证: 毛玻璃 Tooltip 显示日期和数值

7.5 验证内容概览饼图
    → 截图 [S23-content-pie.png]
    → 验证: 三色饼图 + 热门 Top5 列表

7.6 点击刷新按钮
    → 截图 [S24-dashboard-refresh.png]
    → 验证: 刷新图标旋转 + Toast "数据已刷新"

7.7 以 content_ops 登录查看仪表盘
    → 截图 [S25-dashboard-content-ops.png]
    → 验证: 仅显示课程完成率卡片 + 内容概览 + 操作日志

7.8 以 game_ops 登录查看仪表盘
    → 截图 [S26-dashboard-game-ops.png]
    → 验证: 仅显示游戏日活卡片 + 游戏 DAU 趋势图 + 操作日志
```

### 阶段 8: 管理员管理 E2E（Browser MCP）

```
8.1 以 super_admin 访问 /admin/system/admins
    → 截图 [S27-admin-list.png]
    → 验证: 管理员列表表格正确渲染

8.2 搜索管理员
    → 输入关键词 → 等待 300ms 防抖
    → 截图 [S28-admin-search.png]
    → 验证: 列表正确过滤

8.3 新增管理员
    → 点击 [+ 新增管理员] → 填写表单 → 创建
    → 截图 [S29-create-admin.png]
    → 截图 [S30-temp-password.png]
    → 验证: 临时密码弹窗显示 + 列表刷新

8.4 编辑管理员
    → 操作菜单 → 编辑信息 → 修改姓名 → 保存
    → 截图 [S31-edit-admin.png]
    → 验证: Toast "管理员信息已更新"

8.5 变更角色
    → 操作菜单 → 变更角色 → 选择新角色
    → 截图 [S32-change-role.png]
    → 验证: 影响提示显示 + 确认后角色更新

8.6 测试超管保护
    → 对唯一超管尝试变更角色/禁用
    → 截图 [S33-superadmin-protection.png]
    → 验证: 操作被阻止 + 提示信息

8.7 禁用管理员
    → 操作菜单 → 禁用 → 确认
    → 截图 [S34-disable-admin.png]
    → 验证: 状态变为"已禁用"

8.8 重置密码
    → 操作菜单 → 重置密码 → 确认
    → 截图 [S35-reset-password.png]
    → 验证: 新临时密码弹窗
```

### 阶段 9: 响应式与 UI 规范验证

```
9.1 1280px 宽度完整截图
    → 截图 [S36-responsive-1280.png]

9.2 1024px 宽度截图
    → 截图 [S37-responsive-1024.png]

9.3 800px 宽度截图
    → 截图 [S38-responsive-800.png]

9.4 UI 规范检查清单:
    - [ ] 毛玻璃效果: blur(24px) saturate(1.8)
    - [ ] 色彩: 仅 Rose/Sky/Amber，无紫色出现
    - [ ] 边框: rgba(255,255,255,0.06)
    - [ ] 圆角: 8px (小元素) / 16px (卡片) / 9999px (药丸按钮)
    - [ ] 字体: 14px body / 12px caption / 20px subtitle / 24px title
    - [ ] 动效: 过渡 150-300ms，无突兀跳变
```

### 阶段 10: 性能与安全基础验证

```bash
# 10.1 登录响应时间
time curl -s -X POST http://localhost:8100/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ideas.top","password":"Zhiyu@2026"}' > /dev/null
# 预期: < 2s

# 10.2 仪表盘 API 响应时间
time curl -s http://localhost:8100/api/v1/admin/dashboard/metrics \
  -H "Authorization: Bearer $ACCESS_TOKEN" > /dev/null
# 预期: < 2s

# 10.3 无 Token 访问保护
curl -s http://localhost:8100/api/v1/admin/users | jq .status
# 预期: 401

# 10.4 前端控制台错误检查（Browser MCP）
# 通过 console.error 监听，验证无 Error 级别日志

# 10.5 安全响应头检查
curl -sI http://localhost:8100/api/v1/admin/auth/login | grep -i "x-content-type\|x-frame\|strict-transport"
```

## 范围（做什么）

- 执行 10 个阶段的完整端到端验证
- 拍摄至少 38 张截图记录测试过程
- 验证所有 PRD 验收标准（L-01~L-13、P-01~P-09、N-01~N-11、D-01~D-18）
- 发现问题时立即修复并重新验证
- 汇总所有测试结果到最终报告

## 边界（不做什么）

- 不编写自动化测试框架代码（使用 Browser MCP 手动验证）
- 不做压力测试/负载测试
- 不做跨浏览器兼容性测试
- 不做移动端适配测试（管理后台为桌面端优先）

## 涉及文件

- 可能修改: T11-001 至 T11-009 创建的所有文件（修复发现的问题）
- 新建: `/tasks/result/11-admin-dashboard/T11-010-integration-verification.md` — 最终测试报告

## 依赖

- 前置: T11-001 至 T11-009 全部完成
- 后续: 无（本模块收尾任务）

## 验收标准（GIVEN-WHEN-THEN）

> 汇总所有子任务验收标准

### 登录验收 (L-01 ~ L-13)

1. L-01: 正确凭证 → 2s 内跳转仪表盘 + 欢迎 Toast
2. L-02: 非法邮箱 → 即时红色校验提示
3. L-03: 空密码 → "请输入密码" 提示
4. L-04: 错误密码 → 剩余次数横幅 + 密码框抖动
5. L-05: 5 次失败 → 按钮锁定 + 分秒倒计时
6. L-06: 眼睛图标 → 密码明文/密文切换
7. L-07: 勾选记住我 → 7 天 Token 持久化
8. L-08: 未勾选记住我 → 2h 后会话过期遮罩
9. L-10: 临时密码 → 强制改密弹窗
10. L-11: 退出登录 → 确认弹窗 → 安全退出
11. L-12: Enter 键 → 触发登录
12. L-13: Loading 态 → Spinner + "登录中..." + 不可重复

### 权限验收 (P-01 ~ P-09)

13. P-01: content_ops → 仅看到仪表盘 + 内容管理菜单
14. P-02: user_ops → 仅看到仪表盘 + 用户管理 + 订单管理
15. P-03: game_ops → 仅看到仪表盘 + 游戏管理
16. P-04: super_admin → 看到全部 6 个一级菜单
17. P-05: 无权限 URL → NoPermissionPage
18. P-06: 管理员管理页正确渲染
19. P-07: 搜索过滤管理员
20. P-08: 超管保护规则
21. P-09: 角色变更终止会话

### 导航验收 (N-01 ~ N-11)

22. N-01: 当前页菜单高亮（Rose 色 + 左侧竖条）
23. N-02: 折叠/展开动画（240px ↔ 64px，300ms）
24. N-03: 折叠态 Tooltip
25. N-04: 折叠态二级菜单浮层
26. N-05: 面包屑导航和点击跳转
27. N-06: 管理员信息 + 角色标签
28. N-08: 折叠状态 localStorage 记忆
29. N-09: 1024-1279px 默认折叠
30. N-10: 768-1023px overlay 模式
31. N-11: < 768px 设备提示页

### 仪表盘验收 (D-01 ~ D-18)

32. D-01: 6 卡片正确加载
33. D-02: 千分位格式化
34. D-03: ¥万格式
35. D-04: 正增长绿色 ↑
36. D-05: 负增长红色 ↓
37. D-06: 三张折线图 + 默认 7 天
38. D-07: 周期切换 + 折线重绘动画
39. D-08: 骨架屏加载态
40. D-09: 内容概览饼图 + Top5
41. D-10: 快捷操作跳转
42. D-11: 操作日志 10 条 + 查看全部链接
43. D-12: 在线用户数 + 30s 轮询
44. D-13: content_ops 仪表盘数据过滤
45. D-14: user_ops 仪表盘数据过滤
46. D-15: game_ops 仪表盘数据过滤
47. D-16: 刷新按钮
48. D-17: API 错误降级
49. D-18: 图表 Hover Tooltip

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 启动流程

```bash
# 1. 清理旧容器和卷（确保干净环境）
docker compose down -v

# 2. 构建并启动
docker compose up -d --build

# 3. 等待所有服务就绪
docker compose ps

# 4. 验证健康检查
curl -sf http://localhost:8100/health && echo "Backend OK" || echo "Backend FAIL"
curl -sf http://localhost:3100/ && echo "Frontend OK" || echo "Frontend FAIL"
```

### 测试通过标准

- [ ] Docker 构建成功，所有容器 Running
- [ ] TypeScript 零编译错误（前后端）
- [ ] 所有 49 项验收标准通过
- [ ] 38+ 张截图完整记录
- [ ] 前端控制台无 Error 级别日志
- [ ] API 响应时间 < 2s
- [ ] UI 完全符合 Cosmic Refraction 设计系统
- [ ] 安全基础验证通过（无 Token 拦截、权限隔离）

### 测试不通过处理

- 发现问题 → 定位到具体任务 → 修复代码 → 重新 Docker 构建 → 重新验证该阶段
- 单个阶段内同一问题 3 次修复失败 → 标记阻塞，记录到报告
- 所有阶段完成后，阻塞问题 ≤ 2 个 → 整体通过（标记为 P1 后续修复）
- 阻塞问题 > 2 个 → 整体不通过，需要回溯修复

## 执行结果报告

结果文件路径: `/tasks/result/11-admin-dashboard/T11-010-integration-verification.md`

### 报告模板

```markdown
# T11-010 集成验证报告

## 基本信息
- 执行日期: YYYY-MM-DD
- 执行环境: Docker (docker compose)
- 总验收项: 49
- 通过项: X
- 失败项: X
- 阻塞项: X

## 阶段验证结果

### 阶段 1: 环境搭建
| 检查项 | 结果 | 备注 |
|--------|------|------|
| Docker 构建 | ✅/❌ | |
| 后端健康检查 | ✅/❌ | |
| 前端可访问 | ✅/❌ | |

### 阶段 2: 数据库 Schema
... (每个阶段同理)

## 截图索引
| 编号 | 文件名 | 描述 |
|------|--------|------|
| S01 | S01-login-page.png | 登录页面 |
| ... | ... | ... |

## 发现的问题
| ID | 严重度 | 描述 | 所属任务 | 修复状态 |
|----|--------|------|----------|----------|
| ... | ... | ... | ... | ... |

## 最终结论
整体验证: ✅ 通过 / ❌ 不通过
```

## 自检重点

- [ ] 环境: Docker 容器全部正常运行
- [ ] 覆盖率: 49 项验收标准全部验证
- [ ] 截图: 38+ 张截图完整无遗漏
- [ ] 修复: 发现的问题已即时修复并重新验证
- [ ] 报告: 结果报告格式完整、数据准确
- [ ] 安全: 权限隔离、Token 验证、超管保护全部通过

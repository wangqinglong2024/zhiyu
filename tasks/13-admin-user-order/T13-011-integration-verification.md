# T13-011: 用户与订单管理集成验证 (Integration Verification)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 0（纯测试验证，不产生业务代码）

## 需求摘要

对「用户与订单管理」模块进行端到端（E2E）集成验证。覆盖完整业务流程：管理员登录 → 用户搜索 → 查看用户详情 → 封禁用户 → 解封用户 → 订单查询 → 查看订单详情 → 发起退款 → 退款完成 → 知语币手动调整 → 审计日志验证。所有测试在 Docker 容器内通过 Browser MCP (Puppeteer) 执行。

## 相关上下文

- 测试规范: `grules/08-qa-testing.md` — Docker 测试铁律
- 任务工作流: `grules/09-task-workflow.md` — 集成验证标准
- 前置任务: T13-001 ~ T13-010（本分类所有前置任务）

## 集成验证流程

### Flow 1: 用户搜索 → 详情 → 封禁 → 解封

```
Step 1: 管理员登录后台（super_admin 角色）
Step 2: 进入 /admin/users 用户管理页
Step 3: 搜索栏输入测试用户昵称 → 验证搜索结果 + 命中高亮
Step 4: 切换筛选条件（用户类型=付费用户）→ 验证列表过滤
Step 5: 点击"查看详情" → 进入用户详情页
Step 6: 验证基本信息卡完整性（头像/昵称/邮箱/注册时间/类型/段位/状态）
Step 7: 逐个切换 6 个 Tab → 验证数据加载（学习/游戏/消费/知语币/推荐/封禁历史）
Step 8: 点击"封禁用户" → 填写表单（原因:作弊行为, 期限:7天）→ 二次确认 → 执行
Step 9: 验证用户状态变为"封禁中" + 操作列按钮变为"解封"
Step 10: 返回用户列表 → 筛选状态=封禁中 → 验证封禁用户出现
Step 11: 点击"解封" → 确认 → 验证状态恢复"正常"
Step 12: 进入用户详情 → 封禁历史 Tab → 验证封禁/解封记录
```

### Flow 2: 订单查询 → 详情 → 退款完整流程

```
Step 1: 进入 /admin/orders 订单管理页
Step 2: 验证 4 统计卡数据显示（总订单/总金额/退款数/退款金额）
Step 3: 搜索订单号 → 验证搜索结果
Step 4: 筛选 status=completed + levels=L4 → 验证表格 + 统计卡联动
Step 5: 排序切换（金额降序/升序）→ 验证排序正确
Step 6: 点击"查看详情" → 进入订单详情页
Step 7: 验证 6 信息区块完整：订单/用户/课程/支付(Paddle费)/推荐返利/退款
Step 8: 点击用户昵称 → 验证跳转到用户详情页 → 返回
Step 9: 在 completed 订单上点击"发起退款"
Step 10: 验证影响预览（课程回收 + 返利扣回金额 + 推荐人余额变化）
Step 11: 填写退款表单 → 二次确认 → 执行退款
Step 12: 验证订单状态变为 refunding → Toast 提示
Step 13: 进入 /admin/refunds → 验证退款列表出现该记录
```

### Flow 3: 知语币管理

```
Step 1: 进入 /admin/coins 知语币管理页
Step 2: 验证 4 统计卡（累计发放/消耗/流通/负余额人数）
Step 3: 验证 30 天趋势图渲染
Step 4: 查看流水记录 Tab → 筛选 source=admin_manual → 验证
Step 5: 点击"手动调整余额"
Step 6: 输入 user_id + type=add + amount=500 + reason → 确认
Step 7: 验证流水记录新增 + 统计卡更新
Step 8: 切换到"负余额监控" Tab → 验证列表
Step 9: 切换到"大额告警" Tab → 验证列表
```

### Flow 4: 权限控制验证

```
Step 1: 使用 user_operator 角色登录 → 验证可访问用户/订单管理
Step 2: 使用普通用户(非管理员)登录 → 验证 /admin/* 路由拒绝访问（403/重定向）
Step 3: 未登录状态访问 /admin/* → 验证重定向到登录页
```

### Flow 5: CSV 导出验证

```
Step 1: 在用户列表页点击"导出 CSV"
Step 2: 验证按钮变 Loading + "生成中…"
Step 3: 验证文件下载完成 + Toast "导出完成"
Step 4: 验证 CSV 文件内容（UTF-8 BOM + 字段完整 + 无密码/IP等 GDPR 禁止字段）
```

### Flow 6: 边界场景验证

```
Step 1: 对已退款的订单点击"发起退款" → 验证按钮不显示或返回 409
Step 2: 搜索不存在的用户 → 验证空状态 UI
Step 3: 访问不存在的用户 ID → 验证 404 页面
Step 4: 访问不存在的订单 ID → 验证 404 页面
Step 5: 知语币手动增加至超过 100,000 → 验证拦截
Step 6: 封禁已封禁的用户 → 验证拒绝或按钮不显示
```

## 范围（做什么）

- 编写并执行 6 个完整 E2E 流程的自动化测试脚本
- 覆盖完整业务链路：搜索 → 详情 → 封禁 → 解封 → 订单 → 退款 → 知语币
- 验证权限控制（3 种角色）
- 验证 CSV 导出完整性和 GDPR 合规
- 验证边界场景和错误处理
- 生成集成验证结果报告

## 边界（不做什么）

- 不编写单元测试（各子任务自行覆盖）
- 不测试 Paddle 真实支付（使用测试数据）
- 不测试 Paddle Webhook 异步回调（模拟数据）
- 不做性能压测（非本任务范围）

## 涉及文件

- 新建: `e2e/tests/admin-user-order.spec.ts` — E2E 测试脚本
- 新建: `e2e/fixtures/admin-user-order.ts` — 测试数据 fixtures
- 不动: 所有业务代码（本任务不产生业务代码）

## 依赖

- 前置: T13-001 ~ T13-010（本分类全部任务）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Docker 环境正常运行
   **WHEN** 执行 Flow 1（用户搜索→详情→封禁→解封）
   **THEN** 全部步骤通过，状态变更正确，封禁历史记录完整

2. **GIVEN** Docker 环境正常运行
   **WHEN** 执行 Flow 2（订单→详情→退款）
   **THEN** 全部步骤通过，退款影响预览正确，订单状态变更正确，退款列表记录正确

3. **GIVEN** Docker 环境正常运行
   **WHEN** 执行 Flow 3（知语币管理）
   **THEN** 统计卡数据正确，手动调整成功，流水记录完整

4. **GIVEN** Docker 环境正常运行
   **WHEN** 执行 Flow 4（权限控制）
   **THEN** super_admin 和 user_operator 可访问，普通用户和未登录被拒绝

5. **GIVEN** Docker 环境正常运行
   **WHEN** 执行 Flow 5（CSV 导出）
   **THEN** 文件下载成功，内容完整，无 GDPR 禁止字段

6. **GIVEN** Docker 环境正常运行
   **WHEN** 执行 Flow 6（边界场景）
   **THEN** 所有边界场景正确处理（409/404/空态/拦截）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 等待所有服务健康检查通过
3. 执行种子数据脚本（创建测试用户、订单、知语币记录等）
4. Browser MCP 依次执行 Flow 1 ~ Flow 6
5. 收集所有断言结果

### 测试通过标准

- [ ] Docker 构建成功，所有容器正常运行
- [ ] Flow 1: 用户搜索→详情→封禁→解封 全部通过
- [ ] Flow 2: 订单→详情→退款 全部通过
- [ ] Flow 3: 知语币管理 全部通过
- [ ] Flow 4: 权限控制 全部通过
- [ ] Flow 5: CSV 导出 全部通过
- [ ] Flow 6: 边界场景 全部通过
- [ ] 前端无 console.error
- [ ] 后端无 500 错误
- [ ] 所有操作有 admin_logs 审计记录
- [ ] UI 符合 Cosmic Refraction 设计规范

### 测试不通过处理

- 发现问题 → 定位具体子任务 → 修复 → 重新 `docker compose up -d --build` → 重新执行全部 Flow
- 同一 Flow 3 次失败 → 标记 🚫 阻塞，记录失败详情

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-011-integration-verification.md`

## 自检重点

- [ ] 测试数据(seed)覆盖所有场景（正常用户/封禁用户/有订单/有推荐等）
- [ ] Browser MCP 选择器稳定（使用 data-testid 而非 CSS class）
- [ ] 每个 Flow 可独立执行，不依赖前一个 Flow 的状态
- [ ] 断言清晰：预期值 vs 实际值
- [ ] 测试环境清理：每次执行前重置种子数据

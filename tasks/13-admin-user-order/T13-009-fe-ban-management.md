# T13-009: 前端 — 封禁管理 (FE Ban Management)

> 分类: 13-管理后台-用户与订单管理 (Admin User & Order)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 6

## 需求摘要

实现管理后台封禁/解封的前端交互组件。包含：① 封禁操作弹窗（表单 3 字段：原因/补充/期限 + 表单校验），② 二次确认弹窗（叠加在封禁弹窗上，永久封禁额外红色警告），③ 解封确认弹窗（ShieldCheck 图标 + 封禁信息回显），④ 封禁成功/解封成功后的状态刷新和 Toast 通知。这些组件被用户列表页（T13-007）和用户详情页（T13-008）共同复用。

## 相关上下文

- 产品需求: `product/admin/03-admin-user-order/03-user-ban.md` — 封禁管理完整 PRD
- UI 规范: `grules/06-ui-design.md` — Cosmic Refraction 设计系统
- 后端 API: T13-003 — 封禁与解封 API
- 复用方: T13-007（用户列表页操作列）、T13-008（用户详情页操作按钮）

## 技术方案

### 组件结构

```typescript
// frontend/src/pages/admin/users/components/BanUserModal.tsx
// 封禁操作弹窗：480px Modal, 3 字段表单 + 校验 + "确认封禁"危险按钮
// → 表单通过后打开二次确认弹窗

// frontend/src/pages/admin/users/components/BanConfirmDialog.tsx
// 二次确认弹窗：400px, AlertTriangle Amber 图标, 叠加在封禁弹窗上方
// → 永久封禁时显示额外红色警告文字
// → 确认后调用 API + Loading 态 + 关闭弹窗 + Toast + 刷新

// frontend/src/pages/admin/users/components/UnbanConfirmDialog.tsx
// 解封确认弹窗：400px, ShieldCheck 绿色图标
// → 回显当前封禁原因和期限
// → 确认后调用 API + Loading 态 + 关闭弹窗 + Toast + 刷新

// frontend/src/pages/admin/users/hooks/useBanActions.ts
// 封禁/解封操作 Hook：API 调用 + 状态管理 + 回调
```

### 封禁操作弹窗（BanUserModal）

```
弹窗: Modal Level 4 阴影, 480px
标题: H3(20px) "封禁用户"
副标题: Body S, 灰色, "即将封禁用户：{昵称}（ID: {用户ID}）"

表单字段:
1. 封禁原因 — 下拉单选（必填）
   选项: 违规言论 / 作弊行为 / 异常操作 / 其他
2. 补充说明 — 多行文本（选择"其他"时必填，其他可选）
   最大 200 字, Placeholder "请补充封禁原因详情…"
3. 封禁期限 — 下拉单选（必填）
   选项: 1 天 / 7 天 / 30 天 / 永久

按钮:
- 取消: .glass-button-secondary, rounded-full, 左侧
- 确认封禁: 危险按钮(#ef4444), rounded-full, 右侧 → 校验通过后打开二次确认

校验规则:
- 原因未选: 红色边框 + "请选择封禁原因"
- "其他"但补充为空: 红色边框 + "请填写封禁原因详情"
- 期限未选: 红色边框 + "请选择封禁期限"
```

### 二次确认弹窗（BanConfirmDialog）

```
弹窗: 400px, 叠加在封禁弹窗上方
图标: Lucide AlertTriangle 48px Amber #d97706, 居中
标题: H3 居中 "确认封禁？"
内容: Body 居中 "你即将封禁用户 **{昵称}**，期限为 **{期限}**。封禁后该用户将无法使用任何功能。"
永久额外警告: 红色文字 "⚠️ 永久封禁仅可由管理员手动解除"

按钮:
- 取消: 次要按钮 → 关闭二次确认，返回封禁弹窗
- 确认: 危险按钮 → Loading 态 → POST ban API
  → 成功: 关闭所有弹窗 + Toast "用户已封禁" + 回调刷新
  → 失败: Toast 错误信息
```

### 解封确认弹窗（UnbanConfirmDialog）

```
弹窗: 400px
图标: Lucide ShieldCheck 48px 成功色 #22c55e, 居中
标题: H3 居中 "确认解封？"
内容: Body "即将解封用户 **{昵称}**。当前封禁原因：{原因}，原封禁期限：{期限}。解封后用户将立即恢复所有功能。"

按钮:
- 取消: 次要按钮 → 关闭弹窗
- 确认解封: 成功按钮(#22c55e) → Loading 态 → POST unban API
  → 成功: 关闭弹窗 + Toast "用户已解封" + 回调刷新
  → 失败: Toast 错误信息
```

### Hook 设计

```typescript
// frontend/src/pages/admin/users/hooks/useBanActions.ts
export function useBanActions(options: {
  onBanSuccess?: () => void;
  onUnbanSuccess?: () => void;
}) {
  // 封禁弹窗状态
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<UserBrief | null>(null);

  // 解封弹窗状态
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [unbanTarget, setUnbanTarget] = useState<BannedUserBrief | null>(null);

  // 操作方法
  const openBanModal = (user: UserBrief) => { ... };
  const openUnbanDialog = (user: BannedUserBrief) => { ... };

  // API 调用
  const executeBan = async (data: BanFormData) => { ... };
  const executeUnban = async (userId: string) => { ... };

  return {
    banModalOpen, banTarget, openBanModal,
    unbanDialogOpen, unbanTarget, openUnbanDialog,
    executeBan, executeUnban,
    BanUserModal, BanConfirmDialog, UnbanConfirmDialog,
  };
}
```

## 范围（做什么）

- 创建 `BanUserModal` 封禁操作弹窗（3 字段表单 + 校验）
- 创建 `BanConfirmDialog` 二次确认弹窗（永久封禁额外警告）
- 创建 `UnbanConfirmDialog` 解封确认弹窗（封禁信息回显）
- 创建 `useBanActions` Hook（状态管理 + API 集成 + 回调）
- 封禁/解封 API 调用 + Loading 态 + Toast 通知
- 操作后自动刷新父组件数据

## 边界（不做什么）

- 不实现后端 API（T13-003 已完成）
- 不实现用户列表页/详情页本身（T13-007/T13-008）
- 不实现封禁后的用户端弹窗（用户端 App 独立实现）
- 不实现封禁历史列表展示（T13-008 BanHistoryTab 处理）

## 涉及文件

- 新建: `frontend/src/pages/admin/users/components/BanUserModal.tsx` — 封禁弹窗
- 新建: `frontend/src/pages/admin/users/components/BanConfirmDialog.tsx` — 二次确认
- 新建: `frontend/src/pages/admin/users/components/UnbanConfirmDialog.tsx` — 解封确认
- 新建: `frontend/src/pages/admin/users/hooks/useBanActions.ts` — 操作 Hook
- 修改: `frontend/src/pages/admin/users/components/UserTableRow.tsx` — 接入封禁/解封操作
- 修改: `frontend/src/pages/admin/users/components/UserBasicInfoCard.tsx` — 接入封禁/解封操作

## 依赖

- 前置: T13-003（后端 API）、T13-007（用户列表页）、T13-008（用户详情页）
- 后续: T13-011（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 在用户列表点击"封禁"按钮
   **WHEN** 封禁弹窗打开
   **THEN** 显示弹窗标题 + 用户昵称/ID + 3 个表单字段

2. **GIVEN** 封禁原因未选择
   **WHEN** 点击"确认封禁"
   **THEN** 下拉框红色边框 + 错误提示 "请选择封禁原因"

3. **GIVEN** 选择"其他"但补充说明为空
   **WHEN** 点击"确认封禁"
   **THEN** 补充说明输入框红色边框 + "请填写封禁原因详情"

4. **GIVEN** 表单填写完整（原因+期限）
   **WHEN** 点击"确认封禁"
   **THEN** 打开二次确认弹窗，叠加在封禁弹窗上

5. **GIVEN** 封禁期限选择"永久"
   **WHEN** 二次确认弹窗展示
   **THEN** 显示额外红色警告："⚠️ 永久封禁仅可由管理员手动解除"

6. **GIVEN** 二次确认弹窗中点击"确认"
   **WHEN** API 调用中
   **THEN** 按钮变 Loading 态 → 成功后关闭所有弹窗 + Toast "用户已封禁" + 列表/详情刷新

7. **GIVEN** 在用户列表点击"解封"按钮
   **WHEN** 解封确认弹窗打开
   **THEN** 显示 ShieldCheck 绿色图标 + 当前封禁原因和期限信息

8. **GIVEN** 解封确认弹窗中点击"确认解封"
   **WHEN** API 调用成功
   **THEN** 关闭弹窗 + Toast "用户已解封" + 按钮从"解封"变为"封禁"

9. **GIVEN** 封禁/解封 API 调用失败
   **WHEN** 请求返回错误
   **THEN** Toast 展示错误信息，弹窗保持打开，可重试

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. Browser MCP 访问用户列表页，点击"封禁"
3. 测试封禁弹窗表单校验（空值/其他必填）
4. 测试二次确认弹窗（普通+永久）
5. 测试封禁执行 → Toast + 状态刷新
6. 测试解封确认弹窗 → 解封执行 → Toast + 状态刷新
7. 在用户详情页重复上述测试

### 测试通过标准

- [ ] Docker 构建成功
- [ ] 封禁弹窗 3 字段表单渲染正确
- [ ] 表单校验逻辑完整
- [ ] 二次确认弹窗叠加显示正确
- [ ] 永久封禁额外红色警告显示
- [ ] 封禁成功 → Toast + 状态刷新
- [ ] 解封确认弹窗信息回显正确
- [ ] 解封成功 → Toast + 状态刷新
- [ ] 两个入口（列表+详情）都能正常触发
- [ ] Loading 态 + 错误处理正确
- [ ] Cosmic Refraction 设计规范一致
- [ ] 无 purple 色

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/13-admin-user-order/` 下创建同名结果文件

结果文件路径: `/tasks/result/13-admin-user-order/T13-009-fe-ban-management.md`

## 自检重点

- [ ] 弹窗叠加层级正确（二次确认在封禁弹窗上方）
- [ ] "取消"二次确认 → 返回封禁弹窗（非全部关闭）
- [ ] 补充说明条件必填逻辑（仅"其他"时必填）
- [ ] 永久封禁红色警告仅在选择"永久"时显示
- [ ] API 失败弹窗不关闭，可重试
- [ ] 操作成功后父组件数据刷新（回调模式）
- [ ] Rose/Sky/Amber 三色限定
- [ ] 无 console.log / any 类型

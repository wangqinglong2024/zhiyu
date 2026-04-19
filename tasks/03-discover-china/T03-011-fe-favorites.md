# T03-011: 前端 — 收藏系统

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 8

## 需求摘要

实现完整的收藏系统前端功能，包含：收藏按钮组件（心形弹跳动画 + 乐观 UI）、收藏状态全局管理（列表页与详情页实时同步）、我的收藏列表页（个人中心入口）、取消收藏确认对话框。收藏按钮需封装为可复用组件，在文章列表和详情页共用。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/05-favorite-system.md` — 收藏系统完整 PRD
- 设计规范: `grules/06-ui-design.md` — 动效设计（Spring 缓动曲线）
- API 依赖: T03-006（收藏 API：POST/DELETE/GET/check）

## 技术方案

### 组件结构

```
frontend/src/features/discover-china/
├── components/
│   ├── FavoriteButton.tsx            -- 收藏按钮组件（核心，可复用）
│   └── FavoriteConfirmDialog.tsx     -- 取消收藏确认对话框
├── pages/
│   └── MyFavoritesPage.tsx           -- 我的收藏列表页
├── hooks/
│   └── use-favorites.ts              -- 收藏状态管理 Hook
└── stores/
    └── favorite-store.ts             -- 收藏状态全局 Store
```

### FavoriteButton 组件（核心）

```typescript
interface FavoriteButtonProps {
  articleId: string;
  isFavorited: boolean;
  size?: number;        // 默认 20px
  showLabel?: boolean;  // 是否显示文字标签（详情页用）
}
```

**收藏动画**：
- 收藏：心形 `scale(1) → scale(1.3) → scale(1)` + Spring 缓动 `cubic-bezier(0.34, 1.56, 0.64, 1)`，300ms
- 取消：心形 `scale(1) → scale(0.8) → scale(1)`，100ms
- 颜色过渡：空心→实心 Rose（`#e11d48`），100ms 过渡

**乐观 UI 策略**：
1. 点击 → 立即切换 UI 状态 + 动画
2. 同时发送 API 请求
3. 成功 → Toast 提示
4. 失败 → 回退 UI + 红色 Toast

**未登录处理**：
- 点击 → 触发全局登录弹窗
- 登录成功 → 自动执行收藏操作
- 登录取消 → 不执行

### 收藏状态全局管理

使用 Zustand store 管理收藏状态，确保：
- 文章列表页收藏 → 详情页同步
- 详情页取消收藏 → 列表页同步
- 同步方式：前端本地状态，无需重新请求列表

```typescript
// favorite-store.ts
interface FavoriteStore {
  favorites: Map<string, boolean>;  // articleId → isFavorited
  toggle: (articleId: string) => Promise<void>;
  check: (articleIds: string[]) => Promise<void>;
}
```

### 我的收藏列表页

- 位于个人中心 → 我的收藏入口
- 列表样式：与文章列表的 ArticleCard 一致
- 按收藏时间倒序
- 支持分页（每页 20 篇）
- 取消收藏：点击心形 → 弹出确认对话框 → 确认后卡片向左滑出 + 列表收缩

### 取消收藏确认对话框

- 仅在「我的收藏」列表页使用（破坏性操作）
- 毛玻璃模态对话框
- 标题：「确认取消收藏？」
- 说明：「取消后可重新收藏」
- 按钮：「取消」(Ghost) + 「确认取消」(Rose 药丸)
- 多语言支持

### Toast 文案

| 场景 | 汉语 | 英语 | 越南语 |
|------|------|------|--------|
| 收藏成功 | 已收藏 | Saved | Đã lưu |
| 取消成功 | 已取消收藏 | Unsaved | Đã bỏ lưu |
| 收藏失败 | 收藏失败，请重试 | Save failed, please retry | Lưu thất bại, vui lòng thử lại |
| 取消失败 | 操作失败，请重试 | Action failed, please retry | Thao tác thất bại, vui lòng thử lại |

## 范围（做什么）

- 创建 `FavoriteButton.tsx` 可复用收藏按钮（含动画 + 乐观 UI + 未登录处理）
- 创建 `FavoriteConfirmDialog.tsx` 取消确认对话框
- 创建 `MyFavoritesPage.tsx` 我的收藏列表页
- 创建 `use-favorites.ts` 收藏 Hook
- 创建 `favorite-store.ts` 收藏状态全局管理
- 将 FavoriteButton 集成到 ArticleCard 和 ArticleHeader

## 边界（不做什么）

- 不修改收藏 API（T03-006 已完成）
- 不实现收藏夹分组
- 不实现收藏排序/筛选（MVP 仅按时间倒序）

## 涉及文件

- 新建: `frontend/src/features/discover-china/components/FavoriteButton.tsx`
- 新建: `frontend/src/features/discover-china/components/FavoriteConfirmDialog.tsx`
- 新建: `frontend/src/features/discover-china/pages/MyFavoritesPage.tsx`
- 新建: `frontend/src/features/discover-china/hooks/use-favorites.ts`
- 新建: `frontend/src/features/discover-china/stores/favorite-store.ts`
- 修改: `frontend/src/features/discover-china/components/ArticleCard.tsx` — 集成 FavoriteButton
- 修改: `frontend/src/features/discover-china/components/ArticleHeader.tsx` — 集成 FavoriteButton
- 修改: `frontend/src/router/index.tsx` — 注册我的收藏路由

## 依赖

- 前置: T03-006（收藏 API）、T03-008（ArticleCard.tsx 组件，需集成 FavoriteButton）、T03-009（ArticleHeader.tsx 组件，需集成 FavoriteButton）
- 后续: T03-013（集成验证）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 已登录用户，文章未收藏  
   **WHEN** 点击收藏按钮  
   **THEN** 心形立即变实心 Rose 色 + 弹跳动画（Spring 300ms）→ Toast "已收藏"

2. **GIVEN** 已登录用户，文章已收藏  
   **WHEN** 点击收藏按钮  
   **THEN** 心形立即变空心 + 缩小动画（100ms）→ Toast "已取消收藏"

3. **GIVEN** 收藏请求失败  
   **WHEN** API 返回错误  
   **THEN** 心形 UI 回退到操作前状态 + 红色 Toast "收藏失败，请重试"

4. **GIVEN** 未登录用户  
   **WHEN** 点击收藏按钮  
   **THEN** 触发登录弹窗 → 登录成功后自动收藏 → 弹跳动画 + Toast

5. **GIVEN** 在文章列表页收藏某文章  
   **WHEN** 进入该文章详情页  
   **THEN** 详情页收藏按钮已为实心状态（状态同步）

6. **GIVEN** 在文章详情页取消收藏  
   **WHEN** 返回文章列表页  
   **THEN** 该文章卡片收藏图标已为空心状态（状态同步）

7. **GIVEN** 我的收藏列表有文章  
   **WHEN** 点击某文章的收藏按钮  
   **THEN** 弹出确认对话框 → 确认后卡片向左滑出 → 列表收缩

8. **GIVEN** 我的收藏列表确认对话框  
   **WHEN** 点击「取消」按钮或对话框外区域  
   **THEN** 对话框关闭，不执行取消操作

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 通过 Browser MCP 测试收藏完整流程
4. 验证心形动画效果（截图/录制）
5. 验证列表页 ↔ 详情页状态同步
6. 验证我的收藏列表页功能
7. 验证取消收藏确认对话框
8. 测试未登录 → 登录 → 自动收藏流程
9. 切换 Light/Dark 模式验证

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 收藏/取消动画流畅正确
- [ ] 乐观 UI 正确（成功确认/失败回退）
- [ ] 列表页与详情页状态实时同步
- [ ] 未登录收藏 → 登录弹窗 → 自动收藏
- [ ] 我的收藏列表分页正确
- [ ] 取消确认对话框行为正确
- [ ] Toast 多语言文案正确
- [ ] Light + Dark 模式正确

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-011-fe-favorites.md`

## 自检重点

- [ ] 动效：Spring 缓动曲线 `cubic-bezier(0.34, 1.56, 0.64, 1)` 正确
- [ ] 乐观 UI：失败回退无闪烁
- [ ] 状态同步：列表页 ↔ 详情页无延迟
- [ ] 无障碍：心形按钮最小 44×44pt 触控，aria-label
- [ ] 多语言：Toast、对话框文案三语言

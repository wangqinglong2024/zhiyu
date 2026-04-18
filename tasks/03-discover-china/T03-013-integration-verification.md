# T03-013: 集成验证与全链路测试

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: L(大)
> 预估文件数: 2

## 需求摘要

全链路集成验证：将 T03-001 ~ T03-012 所有任务的交付物串联，端到端验证完整的「发现中国」模块功能。覆盖用户从类目首页浏览到文章阅读、收藏、分享的全部核心流程，确保数据库、API、前端三层协调一致。验收标准覆盖 `06-data-nonfunctional.md` §三 全部 50 条 AC（AC-01 ~ AC-50）。

## 相关上下文

- 验收标准: `product/apps/02-discover-china/06-data-nonfunctional.md` §三 — AC-01 ~ AC-50
- 产品总纲: `product/apps/02-discover-china/01-category-homepage.md` ~ `06-data-nonfunctional.md`
- 全部前置任务: T03-001 ~ T03-012
- QA 测试规范: `grules/08-qa-testing.md`
- 编码规范: `grules/05-coding-standards.md`

## 技术方案

### 测试环境

全部测试在 Docker 容器内执行，绝对禁止宿主机直接测试。

```bash
# 1. 完整环境构建
docker compose up -d --build

# 2. 确认所有服务
docker compose ps
# 期望：frontend, backend, supabase-kong, supabase-db, supabase-auth 全部 Running

# 3. 数据库迁移验证
docker compose exec supabase-db psql -U postgres -c "\dt public.*" | grep -E "categories|articles|article_translations|article_views|daily_quotes|user_favorites"
```

### 全链路测试场景

#### 场景一：未登录用户 — 类目首页浏览

```
1. 访问 http://localhost:3100 → Tab 1 发现中国
2. 验证每日金句卡片正常渲染（AC-02）
3. 验证 12 类目卡片网格：01-03 可点击，04-12 灰色遮罩 + 锁定标签（AC-08, AC-09）
4. 点击 04-12 任一类目 → 弹出登录弹窗（AC-10）
5. 点击 01 中国历史 → 进入文章列表
```

#### 场景二：文章列表 + 排序 + 分页

```
1. 进入中国历史文章列表
2. 验证封面大图 + 类目简介 + 10 篇文章卡片（AC-14, AC-16）
3. 默认「最新」排序 → 切换「最热」→ 列表刷新（AC-15）
4. 滚动到底 → 触底加载更多 → 加载指示器（AC-17）
5. 无更多数据时显示「没有更多了」
```

#### 场景三：文章详情阅读

```
1. 点击任一文章 → 进入详情页
2. 验证正文多语言渲染（默认 中文+拼音+英文翻译）（AC-21）
3. 验证音频播放条（播放/暂停/进度拖拽/倍速切换）（AC-22）
4. 离开页面 → 返回 → 音频暂停在上次位置（AC-23）
5. 长按中文文字 → 词义浮层弹出（AC-24）
6. 字体大小 A+/A- 调节即时生效（AC-25）
7. 图片点击放大查看（AC-29）
```

#### 场景四：登录 → 收藏流程

```
1. 未登录点击收藏按钮 → 登录弹窗（AC-38）
2. 登录成功 → 自动收藏 + 心形弹跳动画 + Toast（AC-38, AC-39）
3. 再次点击 → 取消收藏 + 动画 + Toast（AC-39）
4. 在详情页收藏 → 返回列表页 → 收藏状态同步（AC-41）
5. 进入我的收藏列表 → 显示已收藏文章（AC-42）
6. 取消收藏 → 确认对话框 → 确认 → 卡片滑出（AC-43）
```

#### 场景五：分享系统

```
1. 金句分享：点击分享 → 生成图片（≤3s）→ 预览面板（AC-04, AC-34）
2. 验证金句图片内容：1080×1920，金句+Logo+二维码（AC-05, AC-32）
3. 保存到相册正常（AC-35）
4. 文章分享：详情页点击分享 → 生成卡片（≤3s）→ 预览面板（AC-34）
5. 验证文章卡片内容：1080×1350，封面+标题+摘要+Logo+二维码（AC-33）
6. Web Share API 调用或降级处理（AC-36）
```

#### 场景六：全局检查

```
1. Light ↔ Dark 模式切换：所有页面样式正确（AC-44）
2. 三语切换（汉语/英语/越南语）：所有文案正确（AC-45）
3. 触控尺寸 ≥ 44×44pt（AC-46）
4. 色彩对比度 WCAG AA（AC-47）
5. 无紫色元素（AC-48）
6. 所有页面骨架屏覆盖（AC-49）
7. Toast 顶部居中，最多 3 个（AC-50）
```

### 性能验证

| 指标 | 目标 | 验证方式 |
|------|------|----------|
| 类目首页首屏 | ≤ 2 秒 | Performance API 或 Lighthouse |
| 文章列表首页 | ≤ 1.5 秒 | Performance API |
| 文章详情页 | ≤ 2 秒 | Performance API |
| 金句图片生成 | ≤ 3 秒 | console.time 计时 |
| 文章卡片生成 | ≤ 3 秒 | console.time 计时 |
| 收藏响应 | ≤ 300ms | Network panel 检测 |
| 音频播放启动 | ≤ 1 秒 | 手动验证 |

### RLS 安全验证

```sql
-- 验证未认证用户仅能访问公开类目
-- 在 Supabase 中以 anon key 查询
SELECT id, is_public FROM categories ORDER BY id;
-- 期望：12 条记录，is_public=true 仅 01-03

-- 验证收藏表 RLS（用户 A 无法看到用户 B 的收藏）
-- 模拟用户 A 登录后查询
SELECT * FROM user_favorites;
-- 期望：仅返回用户 A 自己的收藏记录
```

## 范围（做什么）

- 在 Docker 环境中完整构建并启动所有服务
- 按 6 个测试场景依次验证全链路功能
- 验证 AC-01 ~ AC-50 全部 50 条验收标准（P0 + P1 必须通过，P2 记录状态）
- 验证性能指标达标
- 验证 RLS 安全策略
- 验证 Light/Dark 双模式 + 三语言
- 生成详尽的测试报告

## 边界（不做什么）

- 不开发新功能
- 不执行压力/负载测试（后续迭代）
- 不测试管理后台功能
- 不测试支付/订阅流程

## 涉及文件

- 新建: `tasks/result/03-discover-china/T03-013-integration-verification.md` — 集成测试结果报告
- 可能修改: T03-001 ~ T03-012 涉及的任何文件（修复集成时发现的 Bug）

## 依赖

- 前置: T03-001 ~ T03-012（全部完成）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 全部 T03-001 ~ T03-012 任务已交付  
   **WHEN** 运行 `docker compose up -d --build`  
   **THEN** 所有容器 Running（frontend, backend, supabase-kong, supabase-db, supabase-auth），无启动报错

2. **GIVEN** 所有服务已启动  
   **WHEN** 执行数据库迁移检查  
   **THEN** 所有表已创建（categories, articles, article_translations, article_views, daily_quotes, user_favorites），RLS 策略已启用，种子数据已写入

3. **GIVEN** Docker 环境正常  
   **WHEN** 通过 Browser MCP 执行场景一~六全链路测试  
   **THEN** 全部 P0 验收标准（AC-01~AC-50 中 P0 部分）通过；P1 标准通过 ≥ 80%

4. **GIVEN** 全链路测试完成  
   **WHEN** 检查性能指标  
   **THEN** 类目首页 ≤ 2s、文章列表 ≤ 1.5s、文章详情 ≤ 2s、分享图片 ≤ 3s、收藏 ≤ 300ms

5. **GIVEN** 全链路测试完成  
   **WHEN** 检查 RLS 安全策略  
   **THEN** 未认证用户仅可访问 is_public=true 的类目；用户仅能查看/操作自己的收藏

6. **GIVEN** 全链路测试完成  
   **WHEN** 切换 Light/Dark 模式 + 三语言  
   **THEN** 所有页面样式正确，无紫色元素，文案三语言覆盖

7. **GIVEN** 发现集成 Bug  
   **WHEN** 修复 Bug  
   **THEN** 重新 Docker 构建验证，修复后不引入新问题

8. **GIVEN** 全部测试完成  
   **WHEN** 生成结果报告  
   **THEN** 报告包含：通过/失败/跳过的 AC 清单 + 性能数据 + 截图证据 + Bug 修复记录

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 完整测试步骤

```bash
# 1. 清理旧容器（确保干净环境）
docker compose down -v

# 2. 完整构建
docker compose up -d --build

# 3. 等待服务就绪（最长 120 秒）
# 轮询健康检查：frontend, backend, supabase

# 4. 确认所有容器状态
docker compose ps

# 5. 检查后端日志
docker compose logs --tail=50 backend

# 6. 检查前端构建
docker compose logs --tail=30 frontend

# 7. 数据库表验证
docker compose exec supabase-db psql -U postgres -c "\dt public.*"

# 8. 种子数据验证
docker compose exec supabase-db psql -U postgres -c "SELECT id, is_public FROM categories ORDER BY id"
docker compose exec supabase-db psql -U postgres -c "SELECT count(*) FROM daily_quotes WHERE status='published'"

# 9. API 健康检查
curl http://localhost:8100/api/v1/categories
curl http://localhost:8100/api/v1/daily-quotes/today

# 10. Browser MCP 全链路测试（6 个场景）
# 按场景一~六依次执行

# 11. 性能测试
# 使用 Performance API 或 Lighthouse

# 12. 截图存档
# 每个关键步骤截图保存
```

### 测试通过标准

- [ ] 所有容器 Running，无启动报错
- [ ] 数据库表 + RLS + 种子数据正确
- [ ] API 健康检查全部通过
- [ ] 场景一：未登录用户类目浏览通过
- [ ] 场景二：文章列表 + 排序 + 分页通过
- [ ] 场景三：文章详情阅读通过
- [ ] 场景四：登录 → 收藏全流程通过
- [ ] 场景五：分享系统（金句+文章）通过
- [ ] 场景六：全局检查（双模式+三语言+无障碍）通过
- [ ] 性能指标全部达标
- [ ] RLS 安全验证通过
- [ ] P0 验收标准 100% 通过
- [ ] P1 验收标准 ≥ 80% 通过
- [ ] 控制台无 Error 级别日志
- [ ] 无紫色元素

### 测试不通过处理

- 发现 Bug → 定位所属任务 → 修复 → 重新 Docker 构建 → 回归验证
- 同一 Bug 3 次修复失败 → 标记为阻塞项，在报告中详细记录
- P2 标准未通过 → 记录在报告中，不阻塞集成验证通过

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-013-integration-verification.md`

### 报告模板

```markdown
# T03-013 集成验证结果报告

## 基本信息
- 执行日期: YYYY-MM-DD
- 执行人: AI Agent
- Docker 构建版本: [commit hash]
- 测试耗时: XX 分钟

## 验收标准通过率
- P0: XX/XX 通过 (XX%)
- P1: XX/XX 通过 (XX%)
- P2: XX/XX 通过 (XX%)
- 总计: XX/50 通过

## 详细结果

### AC-01 ~ AC-50 逐条记录
| AC# | 描述 | 状态 | 备注 |
|-----|------|------|------|
| AC-01 | 每日金句自动刷新 | ✅/❌/⏭️ | ... |
| ... | ... | ... | ... |

### 性能数据
| 指标 | 目标 | 实测 | 状态 |
|------|------|------|------|
| 类目首页首屏 | ≤ 2s | X.Xs | ✅/❌ |
| ... | ... | ... | ... |

### Bug 修复记录
| Bug# | 描述 | 所属任务 | 修复状态 |
|------|------|---------|----------|
| ... | ... | ... | ... |

### 截图证据
- [截图说明]
```

## 自检重点

- [ ] 全部 6 个场景已覆盖
- [ ] AC-01 ~ AC-50 每条有明确的通过/失败/跳过记录
- [ ] 性能指标有数据支撑
- [ ] Bug 修复无遗漏
- [ ] 截图证据完整
- [ ] 报告格式规范

# T02-014: 全局框架集成验证

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 4

## 需求摘要

对 02-全局框架所有子任务（T02-001 至 T02-013）的完整集成验证。确保 Tab 导航、认证系统、多语言、主题切换、推送通知、全局状态、UI 组件库、PWA 等全部模块协同工作，满足非功能性需求（性能/无障碍/安全/兼容性）。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/09-nonfunctional.md` — 非功能性验收标准
  - 性能: FCP ≤ 2s, Tab 切换 ≤ 100ms
  - 无障碍: WCAG 2.1 AA
  - 兼容: Chrome ≥ 90, Safari ≥ 14, Firefox ≥ 90
  - 安全: XSS/CSRF 防护, CSP 策略
- 所有 T02 任务 PRD 文件: `product/apps/01-global-framework/` 目录
- 关联任务: T02-001 至 T02-013 全部完成 → 本任务

## 技术方案

### 集成验证矩阵

| 组合场景 | 验证要点 |
|---------|---------|
| Tab 导航 + 登录墙 | 未登录点击 Tab 2/3/4 → 拦截 → 登录 → 回跳 |
| 登录 + 语言 | 登录成功后语言偏好从 profiles 恢复 |
| 登录 + 主题 | 登录成功后主题偏好从 profiles 恢复 |
| 语言 + 主题 | 切换语言不影响主题，切换主题不影响语言 |
| 推送 + 登录 | 仅登录用户可注册推送 |
| 全局状态 + 离线 | 断网 → OfflineBanner + 缓存内容展示 |
| UI 组件 + 主题 | 所有组件在 Light/Dark 下正确渲染 |
| UI 组件 + 语言 | 所有组件文案跟随语言切换 |
| PWA + 离线 | 离线后 App Shell 可访问 |
| PWA + 更新 | 新版本检测 + 更新 Banner |

### 性能验证

| 指标 | 目标 | 测试方法 |
|------|------|---------|
| FCP (First Contentful Paint) | ≤ 2s | Lighthouse |
| Tab 切换响应时间 | ≤ 100ms | Performance API |
| 主题切换过渡 | 300ms 无卡顿 | 视觉验证 |
| 语言切换响应 | ≤ 500ms | 视觉验证 |
| 登录弹窗弹出 | ≤ 300ms | 视觉验证 |

### 安全验证

| 检查项 | 验证方法 |
|--------|---------|
| XSS 防护 | 尝试在输入框注入 `<script>alert(1)</script>` |
| CSRF 防护 | 验证 API 请求携带正确 Token |
| CSP 策略 | 检查 response header Content-Security-Policy |
| JWT 安全 | 验证 token 不在 URL/localStorage 明文暴露 |
| 密码安全 | 验证密码字段不可明文查看 |

### 无障碍验证

| 检查项 | 标准 |
|--------|------|
| 颜色对比度 | WCAG 2.1 AA (≥ 4.5:1 文字, ≥ 3:1 大文字) |
| 键盘导航 | Tab 键可访问所有交互元素 |
| 屏幕阅读器 | aria-label / role 属性完备 |
| 焦点管理 | Modal/BottomSheet 焦点陷阱 |
| 语义化 | 正确使用 heading/nav/main/section |

### 兼容性验证

| 浏览器 | 最低版本 | 测试项 |
|--------|---------|--------|
| Chrome | ≥ 90 | 全功能 |
| Safari | ≥ 14 | PWA 差异、safe-area |
| Firefox | ≥ 90 | backdrop-filter 支持 |
| Edge | ≥ 90 | 全功能（Chromium 内核） |

## 范围（做什么）

- 创建集成测试脚本/检查清单
- 执行全部组合场景验证
- 执行性能基线测试
- 执行安全基线检查
- 执行无障碍审计
- 执行跨浏览器兼容验证
- 修复发现的集成问题
- 生成完整的集成验证报告

## 边界（不做什么）

- 不实现新功能（仅验证已有功能集成）
- 不实现自动化端到端测试框架（后续 QA 阶段）
- 不修复超出 02-全局框架范围的问题

## 涉及文件

- 新建: `tasks/result/02-global-framework/T02-014-global-integration.md`（验证报告）
- 可能修改: T02-001 至 T02-013 任意文件（修复集成问题）

## 依赖

- 前置: T02-001 至 T02-013 全部完成

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 全部 T02 任务代码已合并  
   **WHEN** `docker compose up -d --build`  
   **THEN** 所有容器启动成功，前后端无编译错误

2. **GIVEN** 未登录用户访问  
   **WHEN** 浏览 Tab 1 → 点击 Tab 2  
   **THEN** 登录墙拦截 → 登录弹窗 → 登录成功 → 自动跳转 Tab 2 → 语言/主题偏好恢复

3. **GIVEN** 已登录用户  
   **WHEN** 切换语言为 vi + 切换主题为 Dark  
   **THEN** 所有 UI 组件文案切换越南语 + 颜色切换深色 + 无闪烁

4. **GIVEN** 已登录用户首次完成课程  
   **WHEN** 课程完成  
   **THEN** 推送引导弹窗正确弹出

5. **GIVEN** 断网状态  
   **WHEN** 访问已缓存页面  
   **THEN** App Shell 显示 + OfflineBanner + 缓存内容

6. **GIVEN** Lighthouse 审计  
   **WHEN** 运行 Performance 审计  
   **THEN** FCP ≤ 2s

7. **GIVEN** 所有输入框  
   **WHEN** 输入 `<script>alert(1)</script>`  
   **THEN** 不触发 XSS，内容被转义显示

8. **GIVEN** Tab 键导航  
   **WHEN** 按 Tab 键遍历  
   **THEN** 可访问所有交互元素，焦点顺序合理

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose down -v && docker compose up -d --build` — 全新构建
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs` — 确认无错误日志
4. 按集成验证矩阵逐项测试
5. Lighthouse 审计（Performance + Accessibility + Best Practices + PWA）
6. 安全基线检查
7. 跨浏览器快速验证（Chrome + Safari 截图对比）
8. 生成集成验证报告

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 全新构建成功
- [ ] 10 个组合场景全部通过
- [ ] FCP ≤ 2s
- [ ] Tab 切换 ≤ 100ms
- [ ] WCAG 2.1 AA 基本合规
- [ ] XSS/CSRF 防护验证通过
- [ ] Chrome ≥ 90 + Safari ≥ 14 兼容
- [ ] 颜色系统仅 Rose/Sky/Amber（无紫色）
- [ ] 无 tailwind.config.js（Tailwind v4 @theme）
- [ ] 毛玻璃效果正确（blur 24px + saturate 1.8）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 定位所属子任务 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-014-global-integration.md`

报告应包含：
1. 集成验证矩阵结果（每项 PASS/FAIL）
2. Lighthouse 审计分数截图
3. 性能基线数据
4. 安全检查结果
5. 无障碍审计结果
6. 跨浏览器截图
7. 发现的问题列表及修复状态
8. 总体评估与后续建议

## 自检重点

- [ ] 绝对红线：颜色仅 Rose/Sky/Amber，确认无紫色
- [ ] 绝对红线：无 tailwind.config.js，使用 Tailwind v4 @theme + CSS 变量
- [ ] 绝对红线：毛玻璃 blur(24px) saturate(1.8) 基线参数
- [ ] 绝对红线：Docker 环境测试，非宿主机
- [ ] 全链路：未登录 → 登录 → 偏好恢复 → 正常使用完整链路
- [ ] 类型安全：全局无 `any` 类型

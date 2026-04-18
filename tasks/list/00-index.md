# 知语 Zhiyu — 全局任务清单索引

> **版本**: v2.0 | **创建日期**: 2026-04-18 | **更新**: 2026-04-18
> **角色**: 技术架构师 + 项目经理视角
> **依据**: `/grules/` 开发规范 + `/product/` 产品需求文档 + `/china/` `/course/` `/game/` 内容详情

---

## 一、任务分类总览

按照**产品模块 × 技术依赖序**进行二维拆解，共 14 类任务：

| 编号 | 分类 | 优先级 | 任务数 | 目标文件夹 | 说明 |
|------|------|--------|--------|-----------|------|
| 01 | [基础架构搭建](01-foundation.md) | **P0** | 12 | `/tasks/01-foundation/` | 项目脚手架、Docker、数据库基础、设计系统 |
| 02 | [全局框架](02-global-framework.md) | **P0** | 14 | `/tasks/02-global-framework/` | Tab 导航、认证、多语言、主题、PWA、通用组件 |
| 03 | [发现中国](03-discover-china.md) | **P0** | 13 | `/tasks/03-discover-china/` | 类目首页、文章列表/详情、每日金句、收藏、分享 |
| 04 | [系统课程-学习](04-course-learning.md) | **P0** | 14 | `/tasks/04-course-learning/` | 入学测试、Level 地图、付费墙、课时学习、SRS |
| 05 | [系统课程-考核](05-course-assessment.md) | **P0** | 11 | `/tasks/05-course-assessment/` | 题型引擎、课时小测、单元测评、级别考核、证书 |
| 06 | [游戏通用系统](06-game-common.md) | **P0** | 13 | `/tasks/06-game-common/` | 游戏大厅、匹配、结算、段位、排行、皮肤商城、HUD |
| 07 | [游戏 G1-G4](07-games-g1-g4.md) | **P0/P1** | 8 | `/tasks/07-games-g1-g4/` | 汉字切切切、拼音泡泡龙、词语消消乐、语法大厨 |
| 08 | [游戏 G5-G8](08-games-g5-g8.md) | **P1/P2** | 8 | `/tasks/08-games-g5-g8/` | 成语接龙、汉字华容道、古诗飞花令、阅读侦探 |
| 09 | [游戏 G9-G12](09-games-g9-g12.md) | **P2/P3** | 8 | `/tasks/09-games-g9-g12/` | HSK 大冒险、辩论擂台、诗词大会、文豪争霸 |
| 10 | [个人中心与支付](10-personal-payment.md) | **P0** | 14 | `/tasks/10-personal-payment/` | 个人中心、课程管理、收藏、知语币、Paddle 支付、推荐 |
| 11 | [管理后台-登录仪表盘](11-admin-dashboard.md) | **P0** | 10 | `/tasks/11-admin-dashboard/` | 后台登录、权限、导航、数据看板 |
| 12 | [管理后台-内容管理](12-admin-content.md) | **P0** | 11 | `/tasks/12-admin-content/` | 文章管理、课程管理、每日金句管理 |
| 13 | [管理后台-用户订单](13-admin-user-order.md) | **P0** | 11 | `/tasks/13-admin-user-order/` | 用户列表/详情、封禁、订单、退款、知语币管理 |
| 14 | [管理后台-游戏系统](14-admin-game-system.md) | **P1** | 12 | `/tasks/14-admin-game-system/` | 皮肤管理、赛季、排行、推送、多语言、管理员、日志 |
| 15 | [横切关注点与运维保障](15-cross-cutting.md) | **P1** | 12 | `/tasks/15-cross-cutting/` | Dify 集成、监控、邮件、TTS、API 文档、合规、备份 |

---

## 二、全局依赖关系图

```
01-基础架构 ──────────────────────────────────────┐
  ↓                                                │
02-全局框架 ──────────────────────────────────────┐│
  ↓            ↓           ↓           ↓          ││
03-发现中国  04-课程学习  06-游戏通用  10-个人支付  ││
               ↓                ↓                  ││
            05-课程考核   07-游戏G1-G4              ││
                               ↓                   ││
                          08-游戏G5-G8              ││
                               ↓                   ││
                          09-游戏G9-G12             ││
                                                   ↓↓
11-管理后台登录 ──→ 12-管理内容 + 13-管理用户订单 + 14-管理游戏系统
                                                    │
01-基础架构 ──→ 15-横切关注点（与业务模块并行推进） ←─┘
```

**关键依赖原则**：
1. `01-基础架构` 是一切的基石，必须最先完成
2. `02-全局框架` 是所有业务模块的前提
3. 应用端模块（03-10）可并行开发，但内部有依赖
4. 管理后台（11-14）依赖基础架构，与应用端可并行
5. 游戏 G5-G8、G9-G12 分别依赖前一组完成

---

## 三、版本迭代映射

| 版本 | 包含分类 | 里程碑 |
|------|---------|--------|
| **MVP v1.0** | 01 + 02 + 03 + 04 + 05 + 06 + 07(G1-G3) + 10 + 11 + 12 + 13 + 15(001-005,007,008) | 核心闭环上线 |
| **v1.1** | 07(G4) + 08(G5-G6) + 14 + 15(006,009-012) | 中级游戏 + 管理扩展 + 运维完善 |
| **v2.0** | 08(G7-G8) + 09(G9-G10) | 高级游戏上线 |
| **v3.0** | 09(G11-G12) | 全部游戏完成 |

---

## 四、任务文件规范

### 4.1 目录结构约定

```
tasks/
├── list/                          # 任务清单（本目录）
│   ├── 00-index.md               # 本文件：全局索引
│   ├── 01-foundation.md          # 各分类任务清单
│   ├── ...
│   ├── 14-admin-game-system.md
│   └── 15-cross-cutting.md       # 横切关注点与运维保障
│
├── 01-foundation/                 # 各分类的详细任务文件夹
│   ├── T01-001-project-scaffold.md
│   ├── T01-002-docker-compose.md
│   └── ...
├── 02-global-framework/
│   ├── T02-001-tab-navigation-db.md
│   └── ...
├── ...
├── 15-cross-cutting/
│   ├── T15-001-dify-integration.md
│   └── ...
│
└── result/                        # 执行结果报告（与分类目录一一对应）
    ├── 01-foundation/
    │   ├── T01-001-project-scaffold.md
    │   └── ...
    ├── 02-global-framework/
    │   └── ...
    ├── ...
    └── 15-cross-cutting/
        └── ...
```

### 4.2 任务文件命名规则

```
T{分类编号}-{任务序号}-{英文短标题}.md

示例：
T01-001-project-scaffold.md      → 基础架构第 1 个任务
T03-005-article-detail-frontend.md → 发现中国第 5 个任务
T07-002-g1-hanzi-slash-game.md    → G1 游戏第 2 个任务
```

### 4.3 任务文件模板（遵循 grules/09-task-workflow.md）

每个详细任务文件必须包含：

```markdown
# T{XX}-{NNN}: {任务标题}

> 分类: {分类名称}
> 状态: 📋 待开发 | 🚧 开发中 | ✅ 已完成 | 🚫 阻塞
> 复杂度: S(简单) / M(中等) / L(复杂)
> 预估文件数: {N}

## 需求摘要
（3-5 句话描述任务目标）

## 相关上下文
- 产品需求: `product/xxx.md` §{章节}
- 设计规范: `grules/xxx.md` §{章节}
- 内容参考: `china/xxx.md` 或 `course/xxx.md` 或 `game/xxx.md`
- 现有代码: `src/features/{module}/`
- 数据库: 表 `{table_name}`
- 关联任务: T{XX}-{NNN}

## 技术方案
### 数据库设计
### API 设计
### 前端架构

## 范围（做什么）
- {具体事项}

## 边界（不做什么）
- {明确排除}

## 涉及文件
- 新建: `path/to/new-file.ts`
- 修改: `path/to/existing-file.ts`

## 依赖
- 前置: T{x}-{y}
- 后续: T{x}-{z}

## 验收标准（GIVEN-WHEN-THEN）
1. GIVEN ... WHEN ... THEN ...
2. GIVEN ... WHEN ... THEN ...

## Docker 自动化测试（强制）
> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤
1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. `docker compose logs --tail=30 frontend` — 前端构建成功
5. 通过 Browser MCP（Puppeteer）执行功能验证
6. 验证所有 GIVEN-WHEN-THEN 验收标准
7. 截图记录关键验证结果

### 测试通过标准
- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 前端页面正常渲染（Light + Dark 模式）
- [ ] API 端点返回正确数据
- [ ] 控制台无 Error 级别日志
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过
- [ ] UI 符合 Cosmic Refraction 设计系统（毛玻璃、色彩、圆角、动效）
- [ ] 响应式测试通过（375px / 768px / 1280px）

### 测试不通过处理
- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告
> 任务完成后，必须在 `/tasks/result/{分类文件夹}/` 下创建同名结果文件

结果文件路径: `/tasks/result/{分类文件夹}/T{XX}-{NNN}-{英文短标题}.md`
结果文件模板见本文 §六

## 自检重点
- [ ] 安全 [ ] 性能 [ ] 类型同步 [ ] RLS
- [ ] UI 设计规范（grules/06-ui-design.md）
- [ ] Docker 测试通过（grules/08-qa-testing.md）
```

---

## 五、AI 生成详细任务时的通用准则

> 以下准则适用于 AI 展开任何一类任务清单中的具体任务文件时，**必须严格遵守**。

### 5.1 必读规范文件（按任务类型选择性加载）

| 任务类型 | 必读规范 |
|---------|---------|
| **所有任务** | `grules/00-index.md` + `grules/09-task-workflow.md` |
| **数据库** | `grules/05-coding-standards.md` §四 + `grules/env.md` |
| **后端 API** | `grules/04-api-design.md` + `grules/05-coding-standards.md` §三 |
| **前端页面** | `grules/01-rules.md` §一 + `grules/06-ui-design.md` |
| **全栈功能** | 上述全部 + `grules/02-project-structure.md` |
| **测试验证** | `grules/08-qa-testing.md` |

### 5.2 必读产品文档

每类任务清单文件中会标注该类任务对应的 product 文档，AI 生成具体任务时**必须先完整阅读**对应的产品需求文档。

### 5.3 标准依赖序列（每个功能模块内部）

```
T-{X}.DB:    数据库 Schema（建表/Migration/RLS）
T-{X}.ZOD:   后端 Zod Schema + TypeScript 类型
T-{X}.REPO:  后端 Repository 层
T-{X}.SVC:   后端 Service 层
T-{X}.API:   后端 Router 层（API 端点）
T-{X}.TYPE:  前端类型同步
T-{X}.FSVC:  前端 API Service 层
T-{X}.HOOK:  前端 Hook 层
T-{X}.UI:    前端组件 + 页面
T-{X}.INT:   集成联调 + Docker 构建验证
```

### 5.4 质量门禁

每个任务完成后必须通过 `grules/09-task-workflow.md` §五 定义的 Gate 0-8 质量门禁。

### 5.5 代码审查自检

每个任务完成后执行 `grules/09-task-workflow.md` §五.2 的自检清单（功能正确性 + 代码质量 + 安全性 + 性能 + 可维护性）。

---

## 六、🚨 Docker 自动化测试铁律（贯穿所有任务）

> **本章规则适用于所有 14 类任务的每一个具体任务，没有例外。**
> **来源**: `grules/08-qa-testing.md` + `grules/01-rules.md` §四

### 6.1 绝对禁止事项

```
⛔ 绝对禁止在宿主机环境安装依赖或运行测试
⛔ 绝对禁止使用 npm run dev / npm start 在宿主机直接启动服务
⛔ 绝对禁止跳过 Docker 构建直接验收
⛔ 绝对禁止在测试未全部通过的情况下标记任务完成
```

### 6.2 强制测试流程

```
每个任务完成编码后，必须执行以下验证链路（不可跳过任何一步）：

Step 1: Docker 构建
  $ docker compose up -d --build
  → 确认构建零错误

Step 2: 容器健康检查
  $ docker compose ps
  → 所有容器状态为 Running/Up
  $ docker compose logs --tail=30 backend
  → 后端无 Error 日志
  $ docker compose logs --tail=30 frontend
  → 前端构建成功，Nginx 启动正常

Step 3: API 功能验证（后端任务）
  → 通过 curl 或 Browser MCP 验证 API 端点
  → 验证请求/响应数据格式符合 grules/04-api-design.md

Step 4: 前端页面验证（前端任务）
  → Browser MCP 导航到目标页面
  → 截图记录 Light + Dark 模式
  → 截图记录 375px + 768px + 1280px 三个断点
  → 检查控制台无 Error

Step 5: 验收标准逐条验证
  → 按 GIVEN-WHEN-THEN 逐条执行
  → 每条标记 ✅ 通过 或 ❌ 失败

Step 6: 自检清单
  → 执行 grules/09-task-workflow.md §五.2 的完整自检

Step 7: 测试数据清理
  → 清除本次测试产生的所有 Mock/测试数据
  → 确认数据库无残留脏数据
```

### 6.3 测试失败处理

```
发现问题时：
1. 记录错误现场（日志 + 截图）
2. 诊断根因（区分编译/运行时/逻辑错误）
3. 修复代码
4. 重新执行 Step 1-7 完整验证（不能只重测修复的部分）
5. 同一问题 3 次修复失败 → 标记 🚫 阻塞，在结果报告中详述
```

### 6.4 AI 任务完成的唯一标准

**只有当以下所有条件同时满足时，AI 才能声明任务完成并停止：**

```
✅ Docker 构建零错误（docker compose up -d --build 成功）
✅ 所有容器 Running
✅ 控制台无 Error 级别日志
✅ 所有 GIVEN-WHEN-THEN 验收标准通过
✅ 自检清单全部打勾
✅ 结果报告已写入 /tasks/result/ 对应目录
```

**任何一项未满足 → AI 必须继续修复，禁止停止。**

---

## 七、🎨 UI 设计规范强制遵循（贯穿所有前端任务）

> **来源**: `grules/01-rules.md` §一 + `grules/06-ui-design.md` 完整体系

### 7.1 设计系统名称

**Cosmic Refraction（宇宙折射）**— 渐变网格毛玻璃设计系统。所有前端任务必须遵循。

### 7.2 前端任务必检清单

每个涉及前端 UI 的任务，完成后必须验证：

```
色彩体系：
  □ 仅使用 Rose/Sky/Amber 三色 + 中性色
  □ 严禁出现任何紫色 (Purple)
  □ Light/Dark 双模式均正常

毛玻璃效果：
  □ 使用 .glass / .glass-card / .glass-elevated 语义类
  □ backdrop-filter: blur(24px) saturate(1.8) 基线参数
  □ 嵌套毛玻璃不超过 2 层
  □ 移动端性能降级已处理

样式规范：
  □ Tailwind CSS v4（@import "tailwindcss" + @theme）
  □ 不存在 tailwind.config.js 文件（绝对红线）
  □ CSS 变量驱动（var(--xxx)）
  □ 圆角使用 rounded-3xl（卡片）/ rounded-full（按钮/输入框）

交互动效：
  □ 所有状态切换带 transition-all duration-300 ease-out
  □ Hover 带 translateY(-1px) 微悬浮
  □ Focus 使用弥散光晕（非默认 ring）
  □ Disabled 为 opacity-0.45 + cursor-not-allowed

响应式：
  □ Mobile-First 移动端优先
  □ 375px / 768px / 1280px 三断点截图验证
  □ 管理后台桌面端优先（1280px 起）
  □ 游戏强制横屏（landscape）

无障碍：
  □ 装饰元素带 aria-hidden="true"
  □ 图片含 alt 文本
  □ prefers-reduced-motion 时关闭动画
  □ 颜色对比度 WCAG 2.1 AA
```

### 7.3 游戏 UI 额外规范

```
  □ Phaser 3 引擎，强制横屏
  □ 进入游戏时提示旋转设备
  □ HUD 覆盖层不遮挡核心游戏区
  □ 皮肤系统预留（主题/角色/背景/特效可更换）
  □ 移动端 H5 和 Web 桌面端均流畅
```

---

## 八、📋 执行结果报告规范（每个任务强制输出）

> AI 完成每个任务后，**必须**在 `/tasks/result/` 下创建结果报告文件，**然后才能声明任务完成**。

### 8.1 结果目录结构

```
tasks/
├── result/                          # 执行结果报告（与分类目录一一对应）
│   ├── 01-foundation/
│   │   ├── T01-001-project-scaffold.md
│   │   ├── T01-002-docker-compose.md
│   │   └── ...
│   ├── 02-global-framework/
│   │   ├── T02-001-tab-navigation.md
│   │   └── ...
│   ├── ...
│   └── 14-admin-game-system/
│       └── ...
```

### 8.2 结果文件模板

```markdown
# 执行结果: T{XX}-{NNN} — {任务标题}

> 执行日期: YYYY-MM-DD
> 执行状态: ✅ 完成 | ⚠️ 完成但有顾虑 | 🚫 阻塞 | ❓ 需要上下文

---

## 一、执行摘要
（3-5 句话描述本次任务的执行情况）

## 二、完成内容

### 新增文件
| 文件路径 | 说明 |
|---------|------|
| `path/to/file.ts` | {简述} |

### 修改文件
| 文件路径 | 变更说明 |
|---------|---------|
| `path/to/file.ts` | {简述} |

## 三、Docker 测试结果

### 构建结果
- Docker 构建: ✅ 成功 / ❌ 失败
- 容器状态: ✅ 全部 Running / ❌ 有异常
- 后端日志: ✅ 无错误 / ⚠️ 有警告 / ❌ 有错误

### 验收标准检验
| # | 验收标准 (GIVEN-WHEN-THEN) | 结果 |
|---|--------------------------|------|
| 1 | GIVEN ... WHEN ... THEN ... | ✅/❌ |
| 2 | GIVEN ... WHEN ... THEN ... | ✅/❌ |

### UI 设计规范检查（前端任务）
- 色彩体系: ✅/❌
- 毛玻璃效果: ✅/❌
- Light/Dark 模式: ✅/❌
- 响应式 (375/768/1280): ✅/❌
- 无障碍: ✅/❌

### 自检清单
- 功能正确性: ✅/❌
- 代码质量: ✅/❌
- 安全性: ✅/❌
- 性能: ✅/❌
- 可维护性: ✅/❌

## 四、问题与修复记录
（如有，记录发现的问题和修复过程）

| # | 问题描述 | 根因 | 修复方案 | 状态 |
|---|---------|------|---------|------|
| 1 | {问题} | {原因} | {修复} | ✅ 已修复 |

## 五、遗留风险（如有）
- {风险描述} — {影响} — {建议处理方式}

## 六、需要用户做什么

> 如果需要用户提供信息、做决策或执行操作，在这里明确列出。
> 如果不需要，写"无需用户操作，任务已完全完成。"

- [ ] {需要用户做的事情 1}
- [ ] {需要用户做的事情 2}

---
*本报告由 AI 在任务完成后自动生成，对应任务文件: `/tasks/{分类}/{任务文件名}`*
```

### 8.3 报告要求

1. **报告必须诚实**：如实反映执行过程中的问题，不掩盖缺陷
2. **截图作为证据**：前端任务必须附上关键截图路径或描述
3. **用户操作项明确**：如果需要用户提供 API Key、做配置、做决策等，必须在 §六 清晰列出
4. **不需要用户操作时明确告知**：写"无需用户操作，任务已完全完成。"
5. **报告是任务完成的必要条件**：没写报告 = 任务未完成

---

## 九、AI 生成详细任务时的通用提示词模板

> 以下是 AI 展开每个任务清单文件为具体任务文件时，**每个任务文件的提示词中都必须包含**的通用部分。
> 各分类清单文件的 §四 提示词是该分类的专属补充，两者结合使用。

```
【通用强制规则 — 所有任务必须遵守】

1. 规范遵循（铁律）:
   - 编码前必读 grules/05-coding-standards.md
   - 前端 UI 必读 grules/01-rules.md §一 + grules/06-ui-design.md
   - 测试必读 grules/08-qa-testing.md
   - 任务流程必读 grules/09-task-workflow.md

2. Docker 测试（铁律）:
   - 绝对禁止在宿主机环境测试
   - 必须通过 docker compose up -d --build 构建后测试
   - 所有功能验证必须在 Docker 容器环境中完成
   - Browser MCP（Puppeteer）做真实浏览器测试
   - 测试未全部通过前，禁止声明任务完成

3. UI 设计规范（前端任务铁律）:
   - 严格遵循 Cosmic Refraction 设计系统
   - 色彩仅限 Rose/Sky/Amber，严禁紫色
   - 毛玻璃参数：blur(24px) saturate(1.8) 基线
   - Tailwind CSS v4，禁止 tailwind.config.js
   - Light/Dark 双模式 + 响应式（375/768/1280）

4. 自动化验证闭环:
   - 编码 → Docker 构建 → 自动测试 → 验收标准逐条验证
   - 发现问题 → 修复 → 重新 Docker 构建 → 重新全量测试
   - 所有验收标准通过 + 自检清单全绿 → 才可完成
   - 3 次修复失败 → 阻塞，停止任务

5. 结果报告（铁律）:
   - 任务完成后，必须在 /tasks/result/{分类}/ 下创建结果报告
   - 报告格式遵循 /tasks/list/00-index.md §八.2 模板
   - 明确告知用户：执行了什么、结果如何、需要用户做什么
   - 不需要用户操作时也要明确告知
   - 没写报告 = 任务未完成
```

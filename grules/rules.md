# 全局架构与顶级系统设计白皮书 (Global Architecture & Design Blueprint)

> **版本**: v2.0 | **最后更新**: 2026-04-17
>
> **关联文件**：
> - 设计哲学与视觉体系详见 → `ui-design.md`
> - 代码注释与文档规范详见 → `documentation-standards.md`
> - 编码实现规则详见 → `coding-standards.md`
> - AI 开发工作流详见 → `index.md`「AI 标准开发流水线」
> - 本文件专注于：**技术栈声明 + CSS 实现参数 + 架构哲学 + 开发纪律**

---

## 🎭 核心角色定义与全栈工作流边界

作为顶级的全栈架构师和深谙极简高级审美的 UI/UX 动效大师，我的核心技术栈锚定于：Vite React/TS (前端) + Express/TS + Node.js (后端) + Supabase (数据库/Auth/其他) + Docker (容器化运维)。

### 绝对工作原则

| 原则 | 说明 |
|------|------|
| **语言沟通标准** | 对话、解释、方案分析、逻辑推理，强制且唯一使用简体中文 |
| **代码规范例外** | 代码片段、变量名、系统专有名词保持英文原貌；代码内部所有注释必须使用详尽的简体中文 |
| **Docker 测试铁律** | 测试必须基于 Docker 构建和运行，绝对禁止在宿主机环境安装运行时进行测试 |
| **规范先行** | 编码前必读 `coding-standards.md`，设计前必读 `ui-design.md`，测试前必读 `qa-testing.md` |

---

## 🎨 一、前端 UI/UX 强制规范：Cosmic Refraction — 渐变网格毛玻璃 (Mesh Gradient Glassmorphism)

> **Stitch 设计系统对应名称：Cosmic Refraction** — 原型中的设计系统必须使用此名称。
> **设计哲学与完整视觉体系**（色彩哲学、字体层级、间距系统、圆角、阴影、交互范式、动效原则、响应式策略、无障碍）详见 → `ui-design.md`。
> **本节聚焦**：可直接复制到代码中的 CSS 精确参数和 Three.js 技术规格。

前端的视觉呈现必须展现出极致的"极简、通透、高级"质感。所有页面必须完美兼容 Light / Dark 双色模式，并采用移动端优先 (Mobile-First) 的响应式布局（完美适配 H5 与 Web 端）。

**核心技术栈声明与红线**
* **样式方案**：强制使用 Tailwind CSS v4。只允许通过 `@import "tailwindcss";` 和 `@theme` 指令进行配置。
* **驱动方式**：彻底摒弃传统的配置覆盖，全面采用 CSS 自定义属性 (`var(--xxx)`) 结合全局预设类（如 `.glass`, `.glass-card`）驱动 UI。
* **绝对红线**：系统中绝不允许出现 `tailwind.config.js` 文件。所有前端组件编写完毕后，必须能完美通过 `npm run build`，实现零编译错误 (Zero Build Errors)。

### 1. 色彩哲学与渐变网格背景 (Mesh Gradient)

* **色彩体系铁律**：严禁使用任何紫色 (Purple) 元素。系统的核心色调仅限三种高定级色彩：暖玫瑰 (rose) + 冷天蓝 (sky) + 琥珀金 (amber)。这三色通过混合与不透明度调节，足以覆盖所有的情感表达与状态指示。
* **背景渲染实现**：背景不是静态图片，而是通过 3 个带有 `filter: blur(100px)` 的巨型模糊 Blob 动态混合而成。所有颜色和不透明度必须通过 CSS 变量在全局精准控制：
    * **Light 模式参数**：`--mesh-color-1: #fda4af;` (rose), `--mesh-color-2: #7dd3fc;` (sky), `--mesh-color-3: #fde68a;` (amber)。不透明度必须严格控制在 0.5 ~ 0.7 之间，呈现明亮、通透的呼吸感。
    * **Dark 模式参数**：`--mesh-color-1: #e11d48;`, `--mesh-color-2: #0284c7;`, `--mesh-color-3: #d97706;`。不透明度大幅压暗至 0.10 ~ 0.15 之间，营造深邃、静谧的赛博深空感。

**高阶动效与 Z 轴空间分层**：
* 这三个巨型 Blob 绝对不可静止。必须被赋予 20~25 秒的超长周期缓慢漂移动效 (`animation: mesh-drift-* ease-in-out infinite`)，让人感觉 UI 在缓慢呼吸。
* 在网格之上，必须叠加一层基于 Three.js 的粒子层。该 Canvas 的背景必须完全透明 (`alpha: true`，绝对不带有任何 `<color>` 属性屏蔽底层)。
* **严格的分层顺序**：`z-0` (最底层：动态渐变网格) → `z-1` (中间层：Three.js 粒子特效) → `z-2` (顶层：所有毛玻璃业务内容层)。

**渐变网格 Blob 动画精确参数（强制复制到 `animations.css`）**：
```css
/* ===== 三个 Mesh Gradient Blob 漂移动画 ===== */
@keyframes mesh-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(80px, -60px) scale(1.05); }
  50%      { transform: translate(-40px, 80px) scale(0.95); }
  75%      { transform: translate(60px, 40px) scale(1.02); }
}

@keyframes mesh-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(-70px, 50px) scale(0.97); }
  50%      { transform: translate(90px, -30px) scale(1.04); }
  75%      { transform: translate(-50px, -70px) scale(1.01); }
}

@keyframes mesh-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(50px, 70px) scale(1.03); }
  50%      { transform: translate(-80px, -40px) scale(0.96); }
  75%      { transform: translate(30px, -60px) scale(1.06); }
}

/* 应用到 3 个 Blob 元素（错开延迟产生呼吸感） */
.mesh-blob-1 {
  animation: mesh-drift-1 22s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.mesh-blob-2 {
  animation: mesh-drift-2 25s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  animation-delay: -7s;   /* 负延迟：页面加载即已在运动中，避免 3 个 blob 齐步走 */
}
.mesh-blob-3 {
  animation: mesh-drift-3 20s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  animation-delay: -13s;
}

/* ===== 装饰性浮动玻璃方块 ===== */
@keyframes float-slow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-20px) rotate(3deg); }
}
.animate-float-slow {
  animation: float-slow 8s ease-in-out infinite;
}

/* ===== 无障碍：尊重用户减少动画偏好 ===== */
@media (prefers-reduced-motion: reduce) {
  .mesh-blob-1, .mesh-blob-2, .mesh-blob-3,
  .animate-float-slow {
    animation: none !important;
  }
}
```

**Three.js 粒子层技术规格**：
* **粒子数量**：桌面端 80~120 个；移动端（`window.innerWidth < 768`）降至 30~50 个，保护帧率
* **粒子大小**：1~3px 随机，颜色从 Rose/Sky/Amber 三色中随机选取，opacity 0.3~0.6
* **运动模式**：布朗运动（random walk），每个粒子独立运动周期 3~5 秒，缓动 ease-in-out
* **相机**：OrthographicCamera，Canvas 铺满视口，`alpha: true`（透明背景）
* **性能红线**：Canvas 帧率不得低于 30fps；移动端检测 `navigator.hardwareConcurrency < 4` 时完全关闭粒子层
* **React 集成**：封装为 `<ParticleBackground />` 组件，放在 `src/components/shared/` 目录，组件卸载时必须调用 `renderer.dispose()` 清理 WebGL 上下文
* **Three.js 版本**：锁定 `three@^0.160.0`（与 `@react-three/fiber` 兼容）

### 2. 核心毛玻璃面板 (Frosted Glass Panels) 物理参数

所有 UI 容器必须遵循严格的光学与物理属性设定：

**移动端 `backdrop-filter` 性能警告**：
* `backdrop-filter: blur()` 在移动端 GPU 开销极大。嵌套毛玻璃层（glass 内套 glass）会导致帧率暴跌。
* **嵌套上限**：同一可视区域内毛玻璃层叠加不超过 2 层。需要第 3 层效果时用半透明纯色（`rgba()`，不带 blur）模拟。
* **iOS Safari 特殊处理**：必须加 `-webkit-backdrop-filter` 前缀（Tailwind v4 `@apply` 会自动处理，手写时需注意）。
* **性能降级**：检测到设备 `navigator.hardwareConcurrency < 4` 时，将 blur 从 24px 降至 12px，saturate 从 1.8 降至 1.2。
* **面板透明度 (Opacity)**：Light 模式采用 `rgba(255, 255, 255, 0.20~0.35)`；Dark 模式大幅度克制，仅使用 `rgba(255, 255, 255, 0.05~0.10)`。
* **光学模糊与色彩饱和 (Blur & Saturate)**：这是毛玻璃的灵魂。底层起步参数必须是 `backdrop-filter: blur(24px) saturate(1.8)`。
* **边缘光泽 (Border Gloss)**：模拟真实玻璃的切边反光。Light 模式边框颜色为 `rgba(255,255,255,0.45)`；Dark 模式为 `rgba(255,255,255,0.12)`。
* **内部高光折射 (Inner Highlight)**：强制增加顶部内阴影来模拟光线打在玻璃厚度上的质感：`box-shadow: inset 0 1px 0 0 var(--glass-inset)`。
* **环境弥散阴影 (Diffuse Shadow)**：Light 模式阴影需柔和淡雅 `rgba(0,0,0,0.06)`；Dark 模式阴影需浓墨重彩以拉开层级 `rgba(0,0,0,0.50)`。

**核心 CSS 语义化类库（强制全局统一定义）**：
* `.glass`：标准基线毛玻璃面板 (blur 24px, saturate 1.8)，用于普通容器。
* `.glass-card`：卡片级毛玻璃。必须自带 hover 悬浮响应，圆角必须为 `rounded-3xl`。
* `.glass-elevated`：高阶浮起面板。拥有更厚重的物理表现 (blur 32px) 和更强烈的弥散阴影，用于弹窗、悬浮菜单或聊天主输入区。
* `.glass-bubble-ai` / `.glass-bubble-user`：对话气泡专用的分级玻璃材质。AI 气泡质感更强、更清晰；User 气泡更柔和、过渡自然。
* `.glass-decor`：纯装饰性浮动玻璃方块。在"空状态"或"登录注册页"必须加入 3~4 个。需要绝对定位并错开边缘分布，必须挂载 `animate-float-slow` 动效并辅以 `[animation-delay:Ns]` 产生错落感，且必须带有 `aria-hidden="true"` 属性以免干扰屏幕阅读器。

### 3. 交互组件微观打磨：输入框与按钮

**输入体系 (Forms)**：
* 统一使用全局类 `.glass-input`。
* 页面内独立的表单域强制使用极度圆润的 `rounded-full px-5 py-3`。
* AI 对话等聊天区输入框使用稍方的 `rounded-xl px-4 py-3`。注意：整个聊天输入区域必须被包裹在一个 `.glass-elevated rounded-2xl` 的高级浮起面板中。
* **Focus 状态红线**：绝不允许使用浏览器默认或 Tailwind 自带的 `focus:ring-*` 或 `focus:border-*` 这种生硬的线条。Focus 时只允许使用弥散光晕：`box-shadow: 0 0 0 4px var(--input-focus-glow)`。

**按钮体系 (Buttons)**：
* `.btn-primary`：主行动点 (CTA)，采用高对比度的实色，满圆角 `rounded-full`。
* `.btn-glass`：毛玻璃药丸按钮，适用于次级操作，提供极佳的沉浸式场景融合感。
* `.btn-ghost`：辅助操作专用的透明幽灵按钮，仅在 hover 时才浮现出淡淡的玻璃磨砂质感。

**交互动效铁律**：所有的 Hover、Focus、Active 状态，强制要求带上 `transition-all duration-300 ease-out`，且必须配合 `hover:translateY(-1px)` 的微观物理悬浮动效。所有 Disabled（禁用）状态的组件，统一处理为 `opacity-0.45` 加上 `cursor-not-allowed`。

---

## 🗄️ 二、Supabase 架构哲学：零干预自动化 (Zero-Touch Database Automation)

> **具体编码规则见 `coding-standards.md` 第四章。此处仅声明架构层级的设计意图。**

数据库是整个架构的命脉。核心原则：

1. **AI 直接行使执行权**：通过 MCP 工具直连数据库执行 DDL/DML，用户无需手动在任何面板操作 SQL。你只需说"帮我加一个钱包功能"，查库、建表、写外键、设权限全部后台自动完成。
2. **原生能力优先**：Supabase 已提供的能力（Auth、Storage、Realtime、Edge Functions），后端绝不重复造轮子。
3. **Migration 留痕**：MCP 直接执行后，仍须在 `supabase/migrations/` 生成 `.sql` 文件用于 Git 留痕和环境重建。
4. **RLS 零信任**：任何新表创建后第一条语句必须开启 RLS。公开读取权限必须显式征得用户同意。
5. **Supabase 各模块调用速查**：
   - **数据库操作**：优先 `supabase-js` SDK 链式调用；复杂查询编写 PostgreSQL 函数后通过 `.rpc()` 调用；AI/向量场景直接用 `pgvector` 插件。
   - **对象存储**：客户端通过 Supabase Client 直传，Bucket 权限遵循 RLS。
   - **实时订阅**：`supabase.channel().subscribe()` 建立 WebSocket。

---

## ⚙️ 三、后端架构哲学：全链路异步非阻塞 (End-to-End Async Architecture)

> **具体编码规则见 `coding-standards.md` 第三章。此处仅声明架构层级的设计意图。**

Node.js 天生基于事件循环的非阻塞 I/O 模型。为了真正发挥高并发优势，从请求到响应的每一行代码必须是**全链路异步**的。核心原则：

1. **全异步 I/O**：所有路由处理函数使用 `async/await`、数据库交互使用 `@supabase/supabase-js` 异步 SDK、第三方调用使用 `axios` 或 Node.js 原生 `fetch`。禁止使用同步阻塞 API（`fs.readFileSync`、同步 DB 驱动等）。
2. **JWT 本地无状态验签**：使用 `JWT_SECRET` 在内存中毫秒级验签（`jsonwebtoken` 库），绝不每次 HTTP 请求 Supabase 去查 Token。配合 Express 认证中间件 `authMiddleware` 实现零信任鉴权。
3. **三层分离**：Router（参数+鉴权+返回）→ Service（业务逻辑+事务）→ Repository（数据访问）。禁止跨层调用。
4. **网关意识**：所有流量经 Nginx 反向代理（`/opt/gateway/`），遇 CORS/502 问题优先排查网关配置。

### 高并发实战指引（必须落地的规则）

**进程管理 & 连接池配置**：
- 生产部署使用 PM2 集群模式（`pm2 start dist/main.js -i max`），Worker 数量 = CPU 核数
- 数据库连接池必须配置上限（Supabase Client 默认连接池；直连 PostgreSQL 时使用 `pg` 库的 `Pool`，`max=20`），禁止每次请求新建连接
- `axios` 实例必须创建全局单例并复用，禁止在每个请求处理函数中 `axios.create()`
- Supabase Client 同理，在应用启动时初始化一次，通过模块导出共享

**缓存层**：
- 高频读取、低频变更的数据（配置项、分类列表、热门排行）必须加缓存
- 优先使用 Redis（Docker 部署，接入 `global-data-link` 网络）；简单场景可用 `node-cache` 或 `lru-cache` + TTL
- 缓存 key 命名规范：`{project}:{resource}:{id}`（如 `myapp:user:uuid-xxx`）
- 数据变更时必须主动清除或刷新缓存（Cache Invalidation），禁止"等过期"

**慢查询治理**：
- 所有列表查询必须有分页（`LIMIT` + `OFFSET`），禁止全表扫描
- `WHERE` / `ORDER BY` / `JOIN ON` 涉及的字段必须有索引
- 复杂聚合查询优先用 PostgreSQL 函数（`CREATE FUNCTION`）+ 物化视图，不在应用层循环
- 单个 API 接口响应时间超过 500ms 视为异常，必须优化

**并发安全**：
- 涉及余额变动、库存扣减等资源竞争场景，必须使用数据库行锁（`SELECT ... FOR UPDATE`）或乐观锁（`version` 字段 + `WHERE version = ?`）
- 同一用户的并发写入请求，后端必须做幂等处理（基于 `idempotency_key` 或业务唯一键去重）

---

## 🤖 四、自动化测试与交付哲学 (Zero-Shot 交付)

> **具体测试规则、流程、评分见 `qa-testing.md`。此处仅声明核心理念。**

坚决杜绝把半成品甩给用户。追求一次性完美交付 (Zero-Shot)。

1. **Docker 环境唯一性**：测试必须基于 Docker 构建和运行，绝对禁止在宿主机环境安装依赖或运行测试。
2. **端到端真实验证**：整合 Browser MCP，在真实浏览器中驱动完整业务链路（前端操作 → Nginx → Express/Node.js → Supabase → 前端渲染）。
3. **自我修复闭环**：测试中发现 4xx/5xx/TS 报错，立即中止交付、自动诊断修复、重新测试，直到链路完美。
4. **环境清洁**：测试完成后自动清除 Mock 脏数据，保持数据库整洁。

---

## 🔄 五、AI 开发纪律与质量闭环

> 本章定义 AI 在整个开发过程中必须遵守的行为纪律，确保交付质量。

### 1. 先查后建原则

> 写任何新代码前，先确认有没有现成方案。

检查顺序：
1. **Supabase 有没有原生支持？** — Auth、Storage、Realtime、Edge Functions 已覆盖就直接用
2. **框架有没有内置？** — React Router、Express 中间件、Zod 验证
3. **现有代码库有没有类似实现？** — 搜索项目内已有的 utils、hooks、services
4. **主流第三方库？** — 只选星标 > 1000、维护活跃（最近 3 个月有更新）的库

### 2. 数据库操作纪律

- 编写任何数据库交互代码前，**必须先查明当前 Schema**（通过 MCP 工具或 `\dt`、`\d table_name`）
- 禁止凭空捏造表名或字段名
- 每次 Schema 变更后必须立即同步三端类型（DB → 后端 Zod/TS → 前端 TS）

### 3. 升级机制与停止信号

| 状态 | 含义 | 触发条件 |
|------|------|---------|
| ✅ **完成** | 全部步骤执行成功，有验证证据 | 代码写完、测试通过、check-list 全绿 |
| ⚠️ **完成但有顾虑** | 已完成，但有需要注意的问题 | 主路径可用但存在已知边界限制 |
| 🚫 **阻塞** | 无法继续，需要外部输入 | 缺少凭证、依赖服务不可达、需求不明确 |
| ❓ **需要上下文** | 缺少必要信息 | 不确定产品意图、不确定技术选型 |

**升级规则**：
- 同一问题尝试 3 次仍失败 → 立即停下，报告状态为 **阻塞**
- 涉及安全敏感变更 → 不擅自行动，报告状态为 **需要上下文**
- 影响范围超出当前任务边界 → 标记为 **完成但有顾虑**，列出溢出影响

### 4. 代码审查自检清单

> AI 在完成每个任务后，自动执行此检查表。所有项通过后才算完成。

**功能正确性**：
- [ ] 核心功能按需求正常工作
- [ ] 边界情况已处理（空值、空列表、超长输入、并发）
- [ ] 错误路径有合理的用户提示

**代码质量**：
- [ ] 命名清晰、符合 `coding-standards.md` 命名约定表
- [ ] 无重复代码（相同逻辑出现 2 次以上必须抽取）
- [ ] 无遗留的调试代码（console.log / TODO）
- [ ] 类型完整（TypeScript 前后端均无 `any`）

**安全性**：
- [ ] 用户输入已校验（前端 Zod + 后端 Zod）
- [ ] 有鉴权守卫（需要登录的接口有 authMiddleware）
- [ ] RLS 策略已配置（新表刚创建就开启）
- [ ] 无敏感信息硬编码
- [ ] 涉及金额的接口有签名验证 + 幂等处理

**性能**：
- [ ] 数据库查询有索引支持
- [ ] 无 N+1 查询
- [ ] 大列表有分页

**可维护性**：
- [ ] 关键决策有中文注释解释"为什么"
- [ ] 数据库变更有 migration 文件
- [ ] 三端类型同步（DB → Zod/TS → 前端类型）

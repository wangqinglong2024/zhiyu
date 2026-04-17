# 产品设计全流程规范 (Product Design Standards)

> **版本**: v2.0 | **最后更新**: 2025-07-16
>
> **本文件是整套规范体系中「产品设计阶段」的权威文档**。
> 覆盖：PRD 撰写 → 信息架构 → 交互设计 → 原型审查 → Stitch MCP 操作手册 → 设计系统同步。
> 它是编码开发的"上游"，确保需求清晰、原型可验证、设计与开发完全一致后再进入开发阶段。
>
> **参考来源**：Apple HIG、Google Material Design 3、Atlassian Design System、Ant Design Pro 最佳实践。

---

## 一、产品需求文档（PRD）全维度规范

### 1. PRD 质量铁律（8 维度检查矩阵）

每份 PRD 必须通过以下 8 个维度的检查，AI 才能进入需求分析阶段：

| 维度 | 要求 | 反例（禁止） | 检查方法 |
|------|------|-------------|---------|
| **用户故事** | 每个功能必须有"作为 XX，我想要 XX，以便 XX" | "加一个搜索功能" | 逐功能检查三段式 |
| **边界条件** | 必须描述异常/极端情况的处理方式 | 只描述正常流程 | 追问"如果失败了呢？" |
| **优先级** | P0（必须有）/ P1（应该有）/ P2（最好有） | 所有功能都"很重要" | 强制用户排序 |
| **验收标准** | 每个功能必须有可测量的验收条件 | "用户体验要好" | 能写成测试用例 |
| **数据流向** | 涉及数据的功能必须说明数据来源和去向 | "展示用户信息" | 画数据流图 |
| **非功能需求** | 性能指标、并发量、可用性目标 | 没提性能要求 | 首屏 <2s?、并发量?、SLA? |
| **情感化设计** | 关键页面的情绪目标（愉悦/信任/紧迫） | 只关注功能 | 每个核心页面附情绪关键词 |
| **商业指标** | 核心功能对应的商业目标/度量指标 | 没有度量标准 | 转化率/留存率/ARPU |

### 2. PRD 优化模板（增强版）

用户提交的原始需求经过 AI 优化后，必须符合以下结构：

```markdown
# 产品名称：XXX

## 一、产品定位
- **一句话描述**：（20 字以内，说清楚产品核心价值）
- **目标用户画像**：
  - 主要用户：年龄、职业、使用场景、核心痛点
  - 次要用户：（如有）
- **竞品参考**：（列出参考产品 + 差异化亮点）
- **商业模式**：免费/增值/订阅/交易抽成

## 二、功能清单（按优先级排列）

### P0 - 核心功能（MVP 必须实现）
| # | 功能名称 | 用户故事 | 验收标准 | 情绪目标 |
|---|---------|---------|---------|---------|
| 1 | 手机号登录 | 作为新用户，我想通过手机号快速登录，以便无需记密码 | 输入手机号→收到验证码→登录成功→跳转首页 | 简洁、信任 |

### P1 - 重要功能（第二迭代）
| # | 功能名称 | 用户故事 | 验收标准 | 情绪目标 |

### P2 - 锦上添花（时间允许再做）
| # | 功能名称 | 用户故事 | 验收标准 | 情绪目标 |

## 三、信息架构 (IA)

### 页面层级树
（用缩进表示层级关系）
- 首页（Tab 1）
  - 内容卡片 → 详情页
  - 搜索 → 搜索结果
- 发现（Tab 2）
  - 分类列表 → 分类详情
- 我的（Tab 3）
  - 个人资料编辑
  - 设置
  - 关于

### 页面清单
| 页面名称 | 对应 Stitch 屏幕 | 核心功能 | 入口/出口 | 页面情绪 |
|---------|-----------------|---------|----------|---------|
| 首页 | — | 内容展示、导航 | 启动 → 详情/个人中心 | 探索、愉悦 |

### 核心用户动线（Happy Path）
```
打开 App → 首页浏览 → 点击内容 → 查看详情 → 操作（收藏/购买）→ 反馈成功 → 返回首页
```

### 异常流动线（Sad Path）
```
操作失败 → 错误提示（说人话）→ 引导重试/替代方案 → 成功
```

## 四、交互设计规范

### 状态矩阵（每个核心页面必须覆盖）
| 状态 | 描述 | 设计要求 |
|------|------|---------|
| 空状态 (Empty) | 无数据时 | 插画 + 引导文案 + CTA 按钮 |
| 加载状态 (Loading) | 数据请求中 | Skeleton 骨架屏，禁止纯 Spinner |
| 成功状态 (Success) | 操作完成 | 轻量 Toast / 页面内反馈 |
| 错误状态 (Error) | 操作失败 | 说人话的错误提示 + 重试按钮 |
| 部分加载 (Partial) | 列表加载更多 | 底部加载指示器 + Pull-to-refresh |

### 手势与触控规范
- 核心操作按钮必须在「拇指热区」（屏幕下半部 2/3）
- 可点击元素最小尺寸：44×44pt（Apple HIG）/ 48×48dp（Material）
- 滑动操作必须有视觉预览（如左滑删除要露出红色背景）
- 禁止隐藏式手势作为唯一操作入口

### 反馈与微交互
- 每个用户操作必须有即时反馈（< 100ms 视觉响应）
- 按钮点击后禁止无反应（最少有 loading 态或 disable 态）
- 表单提交成功后清空表单 + 展示成功状态
- 危险操作（删除、支付）必须二次确认

## 五、数据需求（大白话版）
| 数据 | 说明 | 举例 |
|------|------|------|
| 用户需要填什么 | 具体字段 | 昵称、头像、手机号 |
| 系统需要存什么 | 业务数据 | 订单记录、收藏列表 |
| 页面需要展示什么 | 展示字段 | 标题、封面图、点赞数 |
| 需要实时更新的 | Realtime 数据 | 聊天消息、通知计数 |

## 六、非功能需求
- **性能**：首屏加载 < 2s，API 响应 < 500ms
- **并发**：预期峰值 XX 并发用户
- **可用性**：99.9% SLA（全年宕机 < 8.7h）
- **支付**：微信支付 / 无
- **第三方对接**：列出全部外部服务
- **合规**：实名认证、内容审核、隐私协议
- **国际化**：暂不需要 / 预留多语言

## 七、度量指标（北极星指标 + 辅助指标）
| 指标类型 | 指标名 | 目标 | 统计方式 |
|---------|--------|------|---------|
| 北极星 | MAU / 交易额 / 内容发布量 | — | — |
| 获客 | 注册转化率 | >60% | 注册成功/访问首页 |
| 激活 | 首日完成核心操作率 | >40% | — |
| 留存 | 次日留存 / 7日留存 | >30% / >15% | — |
| 变现 | 付费转化率 / ARPU | — | — |
```

### 3. AI 优化 PRD 的工作协议

当用户提供原始需求时，AI 必须按以下步骤优化：

1. **8 维度扫描**：逐项检查质量铁律的 8 个维度，缺失的部分向用户提问或合理推断
2. **信息架构梳理**：从功能清单推导出页面层级树和用户动线
3. **状态矩阵补全**：为每个核心页面补充 5 种状态的设计要求
4. **歧义消除**：将模糊描述转化为具体可执行的描述
5. **冲突检测**：检查功能之间是否存在逻辑冲突
6. **技术可行性预审**：结合 `rules.md` 和 `coding-standards.md`，标记技术风险
7. **商业指标关联**：确认每个 P0 功能至少关联一个度量指标
8. **输出优化后的 PRD**：使用上述模板格式，保存到 `product/` 目录

### 4. 竞品分析框架（Competitive Analysis）

> 参考 AARRR 海盗指标 + Kano 模型，从产品视角快速定位差异化。

在 PRD 的竞品参考部分，必须使用以下结构化模板：

```markdown
### 竞品分析

#### 直接竞品（相同品类）
| 竞品 | 核心卖点 | 用户量级 | 定价模式 | 我们的差异化 |
|------|---------|---------|---------|------------|
| 产品A | ... | ~10万 MAU | 免费+增值 | 我们更 ... |

#### 间接竞品（替代方案）
| 竞品 | 用户为什么用它 | 它的痛点 | 我们如何切入 |
|------|-------------|---------|------------|

#### 功能对标矩阵（Kano 分类）
| 功能 | 我们 | 竞品A | 竞品B | Kano 分类 |
|------|------|-------|-------|----------|
| 核心功能1 | ✅ | ✅ | ✅ | 必备型(M) |
| 差异功能1 | ✅ | ❌ | ❌ | 魅力型(A) |
| 基础功能1 | ✅ | ✅ | ✅ | 期望型(O) |

> Kano 分类说明：
> - **M(Must-be)**：没有会被骂，有了不加分 → 必须做
> - **O(One-dimensional)**：做得越好分越高 → 做到 80 分
> - **A(Attractive)**：没有不扣分，有了大加分 → 差异化重点
> - **I(Indifferent)**：做不做用户无感 → 不做
```

### 5. 用户旅程地图模板（User Journey Map）

> 参考 IDEO 设计思维 + NN/g (Nielsen Norman Group) 旅程地图方法论。

对于每个核心用户角色，必须绘制至少一张旅程地图：

```markdown
### 用户旅程：[角色名] — [完成某个核心目标]

| 阶段 | 用户行为 | 触点(Touchpoint) | 用户想法 | 情绪曲线 | 痛点/机会 |
|------|---------|-----------------|---------|---------|----------|
| 认知 | 朋友推荐/广告 | 社交媒体/应用商店 | "这是什么？" | 😐 中性 | 首印象决定下载 |
| 获取 | 下载→打开→注册 | App Store→启动页→注册页 | "注册别太烦" | 😐→😊 | 减少步骤,1 步注册 |
| 激活 | 完成首个核心操作 | 首页→功能引导→操作完成 | "原来是这么用的" | 😊 上升 | Aha Moment 设计 |
| 留存 | 第二天回来继续用 | 推送通知→首页→内容 | "还有新东西？" | 😊→😍 | 个性化推荐 |
| 推荐 | 分享给朋友 | 分享按钮→社交平台 | "这个给你看看" | 😍 高点 | 降低分享摩擦 |
| 变现 | 付费/订阅 | 付费墙→支付→确认 | "值不值？" | 😐 关键 | 付费前体验价值 |

**Aha Moment 定义**（关键留存节点）：
- 用户在 [时间窗口] 内完成 [具体操作] 次，留存率显著提升
- 示例："注册后 24h 内发布 1 条内容的用户，7 日留存率是未发布用户的 3 倍"
```

### 6. 无障碍设计基线（Accessibility Baseline）

> 参考 WCAG 2.1 AA 标准 + Apple HIG 无障碍章节。

所有 PRD 必须在非功能需求中声明无障碍等级。最低要求：

| 规则 | 要求 | 检查方式 |
|------|------|---------|
| 色彩对比度 | 正文 ≥ 4.5:1、大标题 ≥ 3:1 | Chrome DevTools Lighthouse |
| 触控尺寸 | 可点击区域 ≥ 44×44pt (iOS) / 48×48dp (Android) | 原型标注 |
| 屏幕阅读器 | 装饰性元素 `aria-hidden="true"`；交互元素有 `aria-label` | 代码审查 |
| 键盘导航 | 所有核心操作可通过 Tab/Enter 完成 | 浏览器测试 |
| 动效敏感 | 支持 `prefers-reduced-motion`，可关闭动画 | 代码审查 |
| 文案可读性 | 核心文案不超过初中阅读水平（≤ 8 年级） | 人工审核 |

### 7. 设计评审检查清单（Design Review Checklist）

> 参考 Google HEART 指标框架 + Atlassian 设计评审流程。

每次 Stitch 原型/PRD 评审会议，使用以下结构化检查：

| 维度 | 检查项 | 评分 (1-5) | 备注 |
|------|--------|-----------|------|
| **H - Happiness** | 用户看到界面的第一反应是正面的吗？ | | |
| **E - Engagement** | 核心功能的操作路径 ≤ 3 步吗？ | | |
| **A - Adoption** | 新用户 5 秒内能理解产品价值吗？ | | |
| **R - Retention** | 有明确的"回来"理由吗（通知/新内容/任务）？ | | |
| **T - Task Success** | 核心任务完成率预估 ≥ 80% 吗？ | | |
| **一致性** | 设计系统/色彩/字体/间距在所有页面一致吗？ | | |
| **容错性** | 误操作可撤销？错误提示指导用户解决问题？ | | |
| **信息密度** | 每屏信息量适中（不空也不密）？ | | |

---

## 一-B、产品决策记录（PDR — Product Decision Record）

> 参考 ADR (Architecture Decision Record) 模式，用于追踪重要产品决策。

当产品需求存在多种方案时，AI 必须记录决策过程到 `product/decisions/` 目录：

```markdown
# PDR-NNN: [决策标题]

## 状态
已采纳 / 已废弃 / 讨论中

## 背景
简述面临的问题或选择。

## 可选方案
### 方案 A: [名称]
- 优点：...
- 缺点：...
- 工期估算：...

### 方案 B: [名称]
- 优点：...
- 缺点：...
- 工期估算：...

## 决策
选择方案 X，原因：...

## 影响
- 受影响的页面/模块：...
- 技术约束：...
- 后续可能需要：...
```

---

## 二、Stitch 原型工作流

### 1. Stitch MCP 能力清单

| 能力 | MCP 工具 | 何时使用 |
|------|---------|---------|
| 查看所有项目 | `list_projects` | 了解现有原型全貌 |
| 查看项目详情 | `get_project` | 获取项目的设计主题和配置 |
| 查看所有屏幕 | `list_screens` | 了解一个项目包含哪些页面 |
| 查看单个屏幕 | `get_screen` | 获取屏幕的 HTML 代码和截图 |
| 从文本生成屏幕 | `generate_screen_from_text` | 根据 PRD 需求描述自动生成原型 |
| 编辑已有屏幕 | `edit_screens` | 根据审查结果修改原型 |
| 生成变体方案 | `generate_variants` | 对同一屏幕生成多种设计方案供选择 |
| 查看设计系统 | `list_design_systems` | 了解现有设计规范 |
| 创建设计系统 | `create_design_system` | 建立统一设计语言 |
| 更新设计系统 | `update_design_system` | 迭代设计规范 |
| 应用设计系统 | `apply_design_system` | 将设计规范批量应用到项目 |

### 2. Stitch 原型审查规则

当审查 Stitch 原型时，AI 必须对照以下检查清单：

**与 PRD 一致性检查**：
- [ ] 每个 PRD 中的页面在 Stitch 中都有对应屏幕
- [ ] 屏幕的功能区块与 PRD 描述的功能点一一对应
- [ ] 核心用户动线在屏幕间的跳转逻辑合理
- [ ] 没有 PRD 中未提及的多余功能（防止范围蔓延）

**与 `rules.md` + `ui-design.md` UI 规范一致性检查**：
- [ ] 项目已应用 "Cosmic Refraction" 设计系统
- [ ] 色彩体系正确：Primary=Rose (#e11d48)、Secondary=Sky (#0284c7)、Tertiary=Amber (#d97706)
- [ ] **无任何紫色元素**（按钮、链接、装饰、背景、阴影）
- [ ] 背景为渐变网格（3 个模糊 blob），非纯色填充
- [ ] 容器使用毛玻璃效果（`backdrop-filter: blur`），无实色不透明背景
- [ ] 按钮为全圆角药丸形状 (`rounded-full`)
- [ ] 边框为低透明度白色 ghost border，非 1px 实线
- [ ] 字体：标题 Manrope、正文 Inter
- [ ] 移动端优先、响应式布局

**可用性检查**：
- [ ] 信息层级清晰（标题 > 副标题 > 正文 > 辅助说明）
- [ ] 核心操作按钮突出且易于触达（拇指热区）
- [ ] 空状态、加载状态、错误状态都有考虑
- [ ] 文案简洁无歧义

### 3. Stitch 工作流（三步走）

```
┌──────────────────┐
│  步骤 0：设计系统 │  确认项目已应用正确的设计系统
│  Design System   │  工具：list_design_systems → apply_design_system
└───────┬──────────┘
        ▼
┌──────────────────┐
│  步骤 1：审查     │  读取 Stitch 原型 → 对照 PRD + UI 规范 → 输出审查报告
│  Review          │  工具：list_screens → get_screen（逐屏审查）
└───────┬──────────┘
        ▼
┌──────────────────┐
│  步骤 2：修改     │  根据审查意见 → 编辑屏幕 / 生成新屏幕
│  Modify          │  工具：edit_screens / generate_screen_from_text
└───────┬──────────┘
        ▼
┌──────────────────┐
│  步骤 3：确认     │  修改后重新审查 → 确认通过 → 进入开发阶段
│  Confirm         │  工具：get_screen（验证修改效果）
└──────────────────┘
```

### 4. 审查报告输出格式

```markdown
## Stitch 原型审查报告

**项目**：[项目名称]
**审查日期**：[日期]
**屏幕总数**：X 个

### 逐屏审查结果

#### 屏幕 1：[屏幕标题]
- **PRD 对应**：✅ 对应 / ⚠️ 部分对应 / ❌ 缺失
- **UI 规范符合度**：✅ 符合 / ⚠️ 需调整
- **问题清单**：
  1. [具体问题描述]
  2. [具体问题描述]
- **修改建议**：
  1. [具体修改方案]

#### 屏幕 2：[屏幕标题]
...

### 总结
- **可以直接进入开发的页面**：[列表]
- **需要修改后再开发的页面**：[列表]
- **PRD 中有但原型中缺失的页面**：[列表]
```

---

## 三、Stitch 设计系统 ↔ rules.md 强制同步规范

> **核心目标**：Stitch 原型生成出来就是「开发可用」的风格，无需另行翻译。
> 原型不是草图，而是最终 UI 的高保真蓝本。

### 1. 官方设计系统配置（唯一合法配置）

所有 Stitch 项目必须统一使用以下设计系统，对应 `rules.md` 第一章的 UI 规范：

| Stitch 参数 | 值 | 对应 rules.md 规则 |
|------------|-----|-------------------|
| `displayName` | `Cosmic Refraction` (Mesh Gradient Glassmorphism) | — |
| `overridePrimaryColor` | `#e11d48` | Rose 暖玫瑰 |
| `overrideSecondaryColor` | `#0284c7` | Sky 冷天蓝 |
| `overrideTertiaryColor` | `#d97706` | Amber 琥珀金 |
| `overrideNeutralColor` | `#0e0e0e` | Dark 模式深底 |
| `customColor` (seed) | `#e11d48` | Rose 为主色种子 |
| `colorMode` | `DARK` | 默认暗色模式（开发时 Light/Dark 双模式） |
| `colorVariant` | `FIDELITY` | 高保真色彩还原 |
| `headlineFont` | `MANROPE` | 标题字体 |
| `bodyFont` / `labelFont` | `INTER` | 正文/标签字体 |
| `roundness` | `ROUND_FULL` | 按钮全圆角 (`rounded-full`)，卡片 `rounded-3xl` |
| `designMd` | 完整 Glassmorphism 规范 | 毛玻璃物理参数 + 组件规范 + Do/Don't |

**绝对红线**：
- 🚫 **严禁使用任何紫色** (Purple/Violet/Lavender) 作为 Primary、Secondary、Tertiary 或任何色彩角色
- 🚫 **严禁实色不透明容器背景** — 所有面板必须是毛玻璃（`backdrop-filter: blur(24px) saturate(1.8)`）
- 🚫 **严禁 1px 实线边框** — 只允许 `rgba(255,255,255, 0.12)` 的玻璃折射边缘

### 2. designMd 必须包含的内容

`designMd` 字段是 Stitch 生成屏幕时的「设计宪法」，必须完整覆盖以下章节：

| 章节 | 必须包含 | 来源 |
|------|---------|------|
| Color Philosophy | Rose/Sky/Amber 三色定义 + "NO PURPLE" 禁令 | `rules.md` §一-1 |
| Mesh Gradient Background | 3 个 blob + blur 100px + 漂移动画 + 不透明度 | `rules.md` §一-1 |
| Glassmorphism Parameters | `.glass` / `.glass-card` / `.glass-elevated` 的 blur/opacity/border/shadow | `rules.md` §一-2 |
| Typography | Manrope(标题) + Inter(正文) + 杂志式层级对比 | `rules.md` §一-3 |
| Components | 按钮（pill/glass/ghost）+ 卡片 + 输入框 + 导航 | `rules.md` §一-3 |
| Animation | 300ms+ ease-out + hover lift + 20-25s mesh drift | `rules.md` §一-3 |
| Do's and Don'ts | 完整列出所有禁止项 | `rules.md` §一 全文 |

### 3. 设计系统与前端代码的映射表

| Stitch 设计系统属性 | 前端代码对应 | 同步方式 |
|-------------------|-------------|---------|
| `overridePrimaryColor` (#e11d48) | `--mesh-color-1` (Dark) / `--color-primary` | `@theme` 中声明 |
| `overrideSecondaryColor` (#0284c7) | `--mesh-color-2` (Dark) / `--color-secondary` | `@theme` 中声明 |
| `overrideTertiaryColor` (#d97706) | `--mesh-color-3` (Dark) / `--color-tertiary` | `@theme` 中声明 |
| `overrideNeutralColor` (#0e0e0e) | `--color-surface` / `--color-background` | `@theme` 中声明 |
| `headlineFont` (MANROPE) | `font-family: 'Manrope', sans-serif` | CSS `@font-face` |
| `bodyFont` (INTER) | `font-family: 'Inter', sans-serif` | CSS `@font-face` |
| `roundness` (ROUND_FULL) | `.btn-*` → `rounded-full`; `.glass-card` → `rounded-3xl` | Tailwind class |
| Glass blur (designMd) | `.glass { backdrop-filter: blur(24px) saturate(1.8) }` | 全局 CSS 类 |
| Glass elevated (designMd) | `.glass-elevated { backdrop-filter: blur(32px) }` | 全局 CSS 类 |

### 4. 设计系统变更流程

```
rules.md UI 规范变更
    ↓ (同步)
Stitch 设计系统更新 → update_design_system
    ↓
应用到所有项目 → apply_design_system（选中全部屏幕）
    ↓
同步更新前端 CSS 变量 → @theme + 全局样式文件
    ↓
Docker 重建前端 → docker compose up -d --build frontend
    ↓
Browser MCP 截图验证 → 确认视觉一致
```

**双向同步铁律**：
- `rules.md` 变 → Stitch 设计系统必须同步变
- Stitch 设计系统变 → `rules.md` 和前端代码必须同步变
- 三方（rules.md、Stitch designMd、前端 CSS）在任何时刻必须完全一致

### 5. 新项目创建时的设计系统操作

```
1. 在 Stitch 中创建项目
2. 查询现有设计系统：list_design_systems
3. 找到 "Cosmic Refraction"  （即 Mesh Gradient Glassmorphism Rose/Sky/Amber）
4. 应用到项目的所有屏幕：apply_design_system
5. 验证：get_screen 检查颜色/字体/圆角是否正确
```

禁止在 Stitch 中手动调整单个屏幕的设计主题（会导致不一致），统一通过设计系统批量应用。

### 6. Stitch 原型审查新增项：设计系统合规检查

在原有的审查清单基础上，增加以下强制检查：

- [ ] 项目使用的设计系统是 "Cosmic Refraction"
- [ ] Primary/Secondary/Tertiary 颜色值正确（Rose/Sky/Amber）
- [ ] **无任何紫色元素**（重点检查按钮、链接、装饰色）
- [ ] 背景是渐变网格而非纯色（检查 HTML 中是否有 mesh gradient 相关代码）
- [ ] 容器使用毛玻璃效果（`backdrop-filter: blur`）而非实色背景
- [ ] 按钮为全圆角 pill 形状
- [ ] 边框使用低透明度白色（ghost border）而非实线
- [ ] 字体为 Manrope (标题) + Inter (正文)

---

## 四、Stitch MCP API 调用手册（避坑指南）

> **本章记录了经过验证的正确调用方式**，AI 必须按照此处的参数格式调用，禁止猜测参数结构。

### 1. 项目 ID 提取规则

Stitch 项目的 `name` 格式为 `projects/{projectId}`。提取数字 ID：
```
项目 name = "projects/16788480236501982720"
→ projectId = "16788480236501982720"
```

屏幕的 `name` 格式为 `projects/{projectId}/screens/{screenId}`：
```
屏幕 name = "projects/16788480236501982720/screens/899fc74a66354b57bffdcb43e9b4832d"
→ screenId = "899fc74a66354b57bffdcb43e9b4832d"
```

### 2. 各 API 正确调用示例

#### list_projects — 列出所有项目
```
参数：无需参数
返回：{ projects: [{ name, title, designTheme, screenInstances, ... }] }
注意：返回结果可能很大（50KB+），可能写入临时文件，需要用 read_file 读取
```

#### list_screens — 列出项目的所有屏幕
```
参数：
  projectId: "16788480236501982720"  ← 纯数字字符串

返回：{ screens: [{ name, title, htmlCode, screenshot, ... }] }
```

#### get_screen — 获取单个屏幕详情
```
参数：
  projectId: "16788480236501982720"
  screenId: "899fc74a66354b57bffdcb43e9b4832d"

返回：{ name, title, htmlCode: { downloadUrl }, screenshot: { downloadUrl }, ... }
```

#### create_design_system — 创建设计系统 ✅ 已验证
```
参数（必须传嵌套对象）：
  projectId: "16788480236501982720"
  designSystem: {
    "displayName": "设计系统名称",
    "theme": {
      "bodyFont": "INTER",          ← 必须大写枚举值
      "colorMode": "DARK",          ← DARK 或 LIGHT
      "colorVariant": "FIDELITY",   ← FIDELITY / TONAL_SPOT / VIBRANT 等
      "customColor": "#e11d48",     ← 种子色（影响 Material 调色板生成）
      "designMd": "完整的设计规范 Markdown 文本...",
      "headlineFont": "MANROPE",
      "labelFont": "INTER",
      "overrideNeutralColor": "#0e0e0e",
      "overridePrimaryColor": "#e11d48",
      "overrideSecondaryColor": "#0284c7",
      "overrideTertiaryColor": "#d97706",
      "roundness": "ROUND_FULL"     ← ROUND_FULL / ROUND_LARGE / ROUND_MEDIUM 等
    }
  }

返回：{ designSystem: {...}, name: "assets/{assetId}", version: "1" }

⚠️ 常见错误：
  ❌ 把 theme 的字段放在顶层（必须嵌套在 designSystem.theme 内）
  ❌ 传 font 字段（应该传 bodyFont / headlineFont / labelFont 分开传）
  ❌ 传 spacingScale（不是必需字段，省略不传不会报错）
  ❌ 传 namedColors（系统会根据 override*Color 自动生成完整调色板）
```

#### apply_design_system — 应用设计系统到项目 ✅ 已验证
```
参数：
  projectId: "16788480236501982720"
  assetId: "7049197233499121350"    ← 从 create 返回的 name 中提取数字
  selectedScreenInstances: [        ← 必须是对象数组，不是字符串数组！
    {
      "id": "899fc74a66354b57bffdcb43e9b4832d",
      "sourceScreen": "projects/16788480236501982720/screens/899fc74a66354b57bffdcb43e9b4832d"
    },
    {
      "id": "cdfe5eb3d7fe4b668c8a970840e0b540",
      "sourceScreen": "projects/16788480236501982720/screens/cdfe5eb3d7fe4b668c8a970840e0b540"
    }
    // ... 每个屏幕一个对象
  ]

⚠️ 常见错误：
  ❌ selectedScreenInstances 传字符串数组 ["id1", "id2"]（必须传对象数组）
  ❌ 用 designSystemName 代替 assetId（必须传 assetId）
  ❌ 漏掉 sourceScreen 字段（id 和 sourceScreen 都必须传）

💡 screenInstances 数据来源：
  方式 1：从 list_projects 返回的 project.screenInstances 中获取
  方式 2：从 list_screens 返回的 screens 中提取 name → 作为 sourceScreen，
          screens.name 最后一段作为 id
```

#### edit_screens — 编辑屏幕（文本指令驱动）
```
参数：
  projectId: "16788480236501982720"
  screenId: "899fc74a66354b57bffdcb43e9b4832d"
  editInstruction: "将背景改为 Rose/Sky/Amber 三色渐变网格，所有容器使用毛玻璃效果..."

注意：editInstruction 是自然语言指令，Stitch 会据此重新生成屏幕内容
```

#### generate_screen_from_text — 从文本生成新屏幕
```
参数：
  projectId: "16788480236501982720"
  prompt: "生成一个登录页面，暗色毛玻璃风格，Rose 色 CTA 按钮..."
```

#### list_design_systems — 查询已有设计系统
```
参数：
  projectId: "16788480236501982720"

返回：{ designSystems: [{ designSystem: { displayName, theme }, name: "assets/{id}", version }] }
```

### 3. 标准操作流程（SOP）

#### SOP-A：为新项目应用设计系统
```
步骤 1: list_design_systems(projectId) → 找到 "Cosmic Refraction" 的 assetId
步骤 2: list_screens(projectId) → 获取所有 screenId + sourceScreen
步骤 3: apply_design_system(projectId, assetId, selectedScreenInstances) → 批量应用
步骤 4: get_screen(projectId, screenId) → 验证结果
```

#### SOP-B：创建全新设计系统并应用
```
步骤 1: create_design_system(projectId, designSystem) → 获得返回的 assetId
步骤 2: list_screens(projectId) → 获取 screenInstances
步骤 3: apply_design_system(projectId, assetId, selectedScreenInstances) → 应用
步骤 4: 逐屏 get_screen 验证
```

#### SOP-C：修改不合规的屏幕样式
```
步骤 1: get_screen(projectId, screenId) → 审查当前状态
步骤 2: edit_screens(projectId, screenId, editInstruction) → 发送修改指令
步骤 3: get_screen(projectId, screenId) → 验证修改结果
如不满意 → 重复步骤 2-3
```

---

## 五、Story File 模板（BMAD 灵感 — 自包含任务文件）

> **核心理念**：每个开发任务必须拥有一个自包含的 Story File，包含该任务所需的全部上下文。
> AI 打开一个 Story File 就能完全理解「做什么、为什么、怎么做、怎么验收」，无需额外询问。
> 参考 BMAD Method 的 Context-Engineered Development 模式。

### Story File 标准模板

```markdown
# STORY-{模块}.{序号}: {任务标题}

## 状态
待开发 / 开发中 / 待测试 / 已完成

## 上下文
- **所属 PRD**：product/prd-{项目名}.md
- **对应页面**：{页面名称}（Stitch 屏幕 ID: xxx）
- **优先级**：P0 / P1 / P2
- **依赖**：STORY-{x}.{y}（如有）

## 目标
用一句话描述这个任务要达成什么业务目标。

## 验收标准（Acceptance Criteria）
1. GIVEN {前置条件} WHEN {用户操作} THEN {预期结果}
2. GIVEN {前置条件} WHEN {用户操作} THEN {预期结果}
3. GIVEN {异常条件} WHEN {用户操作} THEN {错误处理}

## 技术方案

### 数据库变更
- 新建表 / 修改字段 / 无变更
- RLS 策略：{描述}
- Migration 文件：`supabase/migrations/YYYYMMDD_xxx.sql`

### 后端 API
| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | /api/v1/xxx | authMiddleware | 创建资源 |

### 前端组件
- 页面：`src/pages/XxxPage.tsx`
- 组件：`src/features/{module}/components/Xxx.tsx`
- Hook：`src/features/{module}/hooks/use-xxx.ts`

### 涉及文件清单
- [ ] `supabase/migrations/xxx.sql`
- [ ] `backend/src/services/xxx-service.ts`
- [ ] `backend/src/routers/v1/xxx.ts`
- [ ] `frontend/src/features/xxx/...`

## 设计参考
- Stitch 屏幕截图 / UI 规范引用
- 关键交互说明

## 边界情况与风险
- {风险 1}：{应对措施}
- {风险 2}：{应对措施}

## 测试要点
- 冒烟：{核心路径}
- 边界：{空值/超长/并发}
- 安全：{鉴权/RLS/注入}
```

### Story File 使用规则
1. **AI 在开发前必须先生成 Story File**：保存到 `product/stories/` 目录
2. **用户确认后才能开始编码**：Story File 是开发合同，双方达成一致才动手
3. **Story File 不可变**：开发过程中发现需要变更，先更新 Story File 再改代码
4. **一个 Story = 一个 PR**：每个 Story File 对应一次原子提交或 PR

---

## 五-B、product/ 目录管理规范

### 1. 目录结构

```
product/
├── prd-{项目名}.md          # 优化后的产品需求文档
├── review-{项目名}.md       # Stitch 原型审查报告
├── changelog-{项目名}.md    # 需求变更记录（可选）
├── decisions/               # 产品决策记录（PDR）
│   └── PDR-NNN-{标题}.md
├── stories/                 # Story Files（开发任务文件）
│   └── STORY-{模块}.{序号}.md
└── assets/                  # 需求相关的图片/附件（可选）
    └── ...
```

### 2. 文件命名规则

- PRD 文件：`prd-{项目名}.md`（如 `prd-boundless-waters.md`）
- 审查报告：`review-{项目名}.md`
- 变更记录：`changelog-{项目名}.md`
- 所有文件名小写，单词用 `-` 连接

### 3. 需求变更管理

需求变更时必须记录（追加到 `changelog-{项目名}.md`）：

```markdown
## [日期] 变更 #N

### 变更内容
- 功能 X：从 A 改为 B
- 新增功能 Y

### 变更原因
[简述原因]

### 影响范围
- 受影响的 Stitch 屏幕：[列表]
- 受影响的开发任务：[列表]
- 是否需要数据库变更：是/否
```

---

## 六、PRD → 原型 → 开发的完整衔接

### 1. 阶段门禁（Gate）

```
PRD 编写/优化
    │
    ▼
[Gate 1] PRD 质量检查（8 维度全部达标？）
    │  ❌ → 补充完善后重新检查
    ▼  ✅
Stitch 设计系统检查 → 必须为 "Cosmic Refraction"
    │  ❌ → apply_design_system 应用正确的设计系统
    ▼  ✅
Stitch 原型审查（或从 PRD 生成原型）
    │
    ▼
[Gate 2] 原型审查通过？（功能 + UI 规范 + 设计系统合规）
    │  ❌ → 修改原型后重新审查
    ▼  ✅
进入 index.md「AI 标准开发流水线」❹ 技术分析阶段
```

### 2. 与开发流水线的衔接

本文件覆盖 `index.md`「AI 标准开发流水线」中 ❶❷❸ 三个阶段的详细规范：

| 阶段 | 负责文件 | 输出 |
|------|---------|------|
| **❶ 需求理解** | **本文件** + `index.md` | 确认理解无偏差 |
| **❷ PRD 优化** | **本文件** | 优化后的 PRD → `product/` 目录 |
| **❸ 原型审查** | **本文件** + `ui-design.md` | 审查报告 → `product/` 目录 |
| ❹ 技术分析 | `rules.md` + `coding-standards.md` | 功能模块 + 数据库 + API 清单 |
| ❺ 任务拆解 | `index.md` | 开发任务列表 |
| ❻ 逐任务开发 | `coding-standards.md` + `project-structure.md` | 可运行的代码 |
| ❼ QA 测试 | `qa-testing.md` | 测试报告 + 健康评分 |
| ❽ 交付确认 | `index.md` + `documentation-standards.md` | 交付清单 + 完成状态 |

### 3. AI 处理 PRD + Stitch 的标准对话模板

#### 场景 A：用户提供了原始需求描述
```
请按照 grules/product-design.md 的规范，帮我优化这份需求文档。
优化后保存到 product/ 目录。
如果 Stitch 中已有相关原型，一并进行审查。
```

#### 场景 B：用户发来 Stitch 原型，要求审查
```
请审查 Stitch 项目 [项目名] 中的所有屏幕。
对照 product/prd-xxx.md 中的需求以及 grules/rules.md 中的 UI 规范。
输出审查报告并保存到 product/review-xxx.md。
```

#### 场景 C：需要从 PRD 生成新原型
```
请根据 product/prd-xxx.md 中的页面清单，
使用 Stitch 为每个页面生成原型屏幕。
生成后按审查规则验证并报告结果。
```

#### 场景 D：审查后需要修改原型
```
请根据 product/review-xxx.md 中的修改建议，
使用 Stitch 编辑对应的屏幕。
修改完成后重新审查并更新审查报告。
```

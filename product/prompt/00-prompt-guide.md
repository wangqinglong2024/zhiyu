# 知语 Zhiyu — PRD 生成提示词使用指南

> 版本：V1.0 | 日期：2026-04-17
> 模型：Claude Opus 4.6（Copilot）

---

## 一、总体规划

### 1.1 现有文档评估

当前 `/product/` 下有 3 个总纲文件，定位正确：

| 文件 | 定位 | 状态 |
|------|------|------|
| `00-product-overview.md` | 产品需求总纲（全局索引） | ✅ 内容完整，无需修改 |
| `admin/00-admin-overview.md` | 管理后台需求概述 | ✅ 内容完整，无需修改 |
| `apps/00-apps-overview.md` | 应用端需求概述 | ⚠️ 内容完整，但部分游戏名称与 plan/04 不一致（G6/G8/G12） |

> 这 3 个文件是**概述级**文档，已覆盖模块划分、访问规则、核心业务规则、MVP 范围。
> 但它们缺少：逐页面的交互细节、按钮级行为定义、字段校验规则、状态矩阵、边界处理、验收标准。
> 本系列提示词的目标：**生成 13 份开发级 PRD**，补全所有细节，开发人员可直接照此开发。

### 1.2 已知命名不一致（需在生成时统一）

| 游戏 | plan/04 名称 | apps/00 名称 | 统一使用 |
|------|-------------|-------------|---------|
| G6 | 汉字华容道 | 汉字拼图 | **汉字华容道** |
| G8 | 阅读侦探社 | 阅读神探 | **阅读侦探社** |
| G12 | 文豪争霸 | 文学宗师 | **文豪争霸** |

---

## 二、13 轮 PRD 生成计划

### 应用端（9 轮）

| 轮次 | 提示词文件 | 输出文件 | 覆盖范围 |
|------|----------|---------|---------|
| 1 | `01-global-framework.md` | `apps/01-global-framework.md` | Tab 导航、登录注册、语言设置、主题切换、推送处理、全局状态、通用组件 |
| 2 | `02-discover-china.md` | `apps/02-discover-china.md` | 发现中国类目首页、每日金句、文章列表、文章详情、收藏/分享/选词 |
| 3 | `03-course-learning.md` | `apps/03-course-learning.md` | 入学测试、Level 地图、单元列表、课时学习页、SRS 复习 |
| 4 | `04-course-assessment.md` | `apps/04-course-assessment.md` | 课时小测验、单元测评、级别综合考核、证书系统、补考机制 |
| 5 | `05-game-common.md` | `apps/05-game-common.md` | 游戏大厅、模式选择、匹配流程、结算页、段位系统、排行榜、皮肤商城 |
| 6 | `06-games-g1-g4.md` | `apps/06-games-g1-g4.md` | G1 汉字切切切、G2 拼音泡泡龙、G3 词语消消乐、G4 语法大厨 |
| 7 | `07-games-g5-g8.md` | `apps/07-games-g5-g8.md` | G5 成语接龙大战、G6 汉字华容道、G7 古诗飞花令、G8 阅读侦探社 |
| 8 | `08-games-g9-g12.md` | `apps/08-games-g9-g12.md` | G9 HSK 大冒险、G10 辩论擂台、G11 诗词大会、G12 文豪争霸 |
| 9 | `09-personal-payment.md` | `apps/09-personal-payment.md` | 个人中心首页、我的课程、收藏、知语币、课程购买、证书、设置、推荐系统 |

### 管理后台（4 轮）

| 轮次 | 提示词文件 | 输出文件 | 覆盖范围 |
|------|----------|---------|---------|
| 10 | `10-admin-dashboard.md` | `admin/01-admin-dashboard.md` | 后台登录、角色权限、数据看板、快捷操作 |
| 11 | `11-admin-content.md` | `admin/02-admin-content.md` | 发现中国文章管理、课程内容管理、每日金句管理 |
| 12 | `12-admin-user-order.md` | `admin/03-admin-user-order.md` | 用户管理、订单管理、退款处理、知语币管理 |
| 13 | `13-admin-game-system.md` | `admin/04-admin-game-system.md` | 皮肤管理、赛季配置、推送管理、多语言管理、管理员管理、系统日志 |

---

## 三、使用方法

### 3.1 操作流程

1. 按轮次顺序，打开对应的 `prompt/XX-xxx.md` 文件
2. **复制文件全部内容**作为提示词发送给 Claude Opus 4.6
3. 等待 AI 生成完整 PRD 文档
4. 检查生成结果，确认无遗漏后保存到指定的输出路径
5. 进入下一轮

### 3.2 注意事项

- **严格按顺序执行**：后续轮次可能引用前面已生成的 PRD
- **每轮一个独立对话**：避免上下文溢出，确保每轮都有完整的 token 预算
- **检查完整性**：每轮结束后对照提示词中的「输出结构」检查是否所有章节都已生成
- **不要修改提示词中的参考文件路径**：这些是 AI 需要读取的上下文来源

### 3.3 每份 PRD 的质量标准（来自 product-design.md）

每份 PRD 必须满足 8 维度质量铁律：

| 维度 | 要求 |
|------|------|
| 用户故事 | 每个功能有「作为 XX，我想要 XX，以便 XX」 |
| 边界条件 | 描述异常/极端情况的处理 |
| 优先级 | P0/P1/P2 标注 |
| 验收标准 | 可测量的验收条件 |
| 数据流向 | 数据来源和去向 |
| 非功能需求 | 性能、并发、可用性 |
| 情感化设计 | 关键页面的情绪目标 |
| 商业指标 | 对应的度量指标 |

### 3.4 PRD 中禁止出现的内容

- ❌ 禁止定义数据库字段英文名（如 `user_id`、`created_at`）
- ❌ 禁止定义 API 接口路径（如 `GET /api/v1/courses`）
- ❌ 禁止定义 TypeScript 类型（如 `interface Course {}`）
- ❌ 禁止定义 CSS 类名（如 `.glass-card`）
- ✅ 必须用自然语言描述每个字段的名称、类型、规则
- ✅ 必须用自然语言描述每个按钮的标签、触发条件、操作后效果
- ✅ 必须用自然语言描述每个页面的 7 种状态表现

---

## 四、最终文件结构预览

```
product/
  00-product-overview.md              ← 已有（总纲索引）
  admin/
    00-admin-overview.md              ← 已有（后台概述）
    01-admin-dashboard.md             ← 第 10 轮生成
    02-admin-content.md               ← 第 11 轮生成
    03-admin-user-order.md            ← 第 12 轮生成
    04-admin-game-system.md           ← 第 13 轮生成
  apps/
    00-apps-overview.md               ← 已有（应用端概述）
    01-global-framework.md            ← 第 1 轮生成
    02-discover-china.md              ← 第 2 轮生成
    03-course-learning.md             ← 第 3 轮生成
    04-course-assessment.md           ← 第 4 轮生成
    05-game-common.md                 ← 第 5 轮生成
    06-games-g1-g4.md                 ← 第 6 轮生成
    07-games-g5-g8.md                 ← 第 7 轮生成
    08-games-g9-g12.md                ← 第 8 轮生成
    09-personal-payment.md            ← 第 9 轮生成
  prompt/
    00-prompt-guide.md                ← 本文件
    01-global-framework.md            ← 第 1 轮提示词
    02-discover-china.md              ← 第 2 轮提示词
    ...
    13-admin-game-system.md           ← 第 13 轮提示词
```

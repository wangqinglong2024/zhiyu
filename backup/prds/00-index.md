# 知语 Zhiyu · PRD 总目录

> **作者**：PM Agent (BMAD `bmad-create-prd`)
> **基于**：`/docs/01-brainstorming` ~ `/docs/05-product-brief`
> **目标读者**：架构师 / 开发团队 / 测试 / 产品 / 法务 / 运营
> **产物语言**：中文（简体）
> **版本**：v1.0（MVP 范围）

## 一、文档结构

### 总体需求

| 路径 | 内容 |
|---|---|
| [`01-overall/00-index.md`](./01-overall/00-index.md) | 总体目录 |
| [`01-overall/01-introduction.md`](./01-overall/01-introduction.md) | 引言、范围、词汇表 |
| [`01-overall/02-goals-vision.md`](./01-overall/02-goals-vision.md) | 产品目标、愿景、北极星 |
| [`01-overall/03-personas-jtbd.md`](./01-overall/03-personas-jtbd.md) | 用户画像与待办任务 |
| [`01-overall/04-scope-mvp.md`](./01-overall/04-scope-mvp.md) | 范围 In/Out + 优先级 |
| [`01-overall/05-functional-map.md`](./01-overall/05-functional-map.md) | 功能总图（模块矩阵） |
| [`01-overall/06-non-functional.md`](./01-overall/06-non-functional.md) | 非功能需求（性能/安全/合规） |
| [`01-overall/07-success-metrics.md`](./01-overall/07-success-metrics.md) | 验收指标 |
| [`01-overall/08-constraints-assumptions.md`](./01-overall/08-constraints-assumptions.md) | 约束与假设 |
| [`01-overall/09-release-plan.md`](./01-overall/09-release-plan.md) | 发布计划 |

### 模块需求

| # | 模块 | 路径 |
|:---:|---|---|
| 02 | 发现中国 | [`02-discover-china/`](./02-discover-china/) |
| 03 | 系统课程 | [`03-courses/`](./03-courses/) |
| 04 | 游戏专区 | [`04-games/`](./04-games/) |
| 05 | 小说专区 | [`05-novels/`](./05-novels/) |
| 06 | 用户/账户/认证 | [`06-user-account/`](./06-user-account/) |
| 07 | 学习引擎与 SRS | [`07-learning-engine/`](./07-learning-engine/) |
| 08 | 知语币经济 | [`08-economy/`](./08-economy/) |
| 09 | 分销裂变 | [`09-referral/`](./09-referral/) |
| 10 | 支付与订阅 | [`10-payment/`](./10-payment/) |
| 11 | 客服 IM | [`11-customer-service/`](./11-customer-service/) |
| 12 | 管理后台 | [`12-admin/`](./12-admin/) |
| 13 | 反爬与安全 | [`13-security/`](./13-security/) |
| 14 | 内容工厂（AI Pipeline · **v1.5**） | [`14-content-factory/`](./14-content-factory/) |
| 15 | 多语国际化 | [`15-i18n/`](./15-i18n/) |

## 二、PRD 阅读顺序建议

### 给架构师
1. `01-overall/01~09`（背景）
2. `13-security/`（安全约束）
3. `14-content-factory/`（数据生命周期）
4. 各模块（按模块拆分系统）

### 给前端开发
1. `01-overall/01,04,05,06`
2. `06-user-account/`、`02-discover-china/`、`03-courses/`、`04-games/`、`05-novels/`
3. `15-i18n/`

### 给后端开发
1. `01-overall/04,06`
2. `06-user-account/`、`07-learning-engine/`、`08-economy/`、`09-referral/`、`10-payment/`
3. `13-security/`、`14-content-factory/`

### 给测试
1. 全文通读
2. 重点：每模块的 acceptance-criteria 文件

### 给法务/合规
1. `01-overall/06,08`
2. `06-user-account/`（用户协议/隐私）
3. `10-payment/`（退款/争议）
4. `13-security/`（数据保护）

## 三、需求 ID 命名规则

- 模块代号：DC（发现中国）/ CR（课程）/ GM（游戏）/ NV（小说）/ UA（账户）/ LE（学习引擎）/ EC（经济）/ RF（分销）/ PY（支付）/ CS（客服）/ AD（管理后台）/ SC（安全）/ CF（内容工厂）/ I18N
- 需求 ID 格式：`<模块>-<类型>-<编号>`，类型 = FR（功能需求）/ NFR（非功能）/ DM（数据模型）/ UX（交互）
- 例：`CR-FR-001` 表示课程模块第 1 条功能需求

## 四、状态字段

每条需求标注：
- **Priority**：P0（必须）/ P1（应当）/ P2（可以）
- **Phase**：MVP / v1.5 / v2
- **Status**：Draft / Approved / Implemented / Deprecated
- **Acceptance**：可测试的验收准则

## 五、变更治理

- PRD 修改 → 在相应文件 `Change Log` 表格新增记录
- 修改 P0 需求需团队同意（PM + CTO + 设计）
- 每个迭代结束做 PRD vs 实际功能 review

## 六、与下游文档关系

- PRD → 架构师产出 `Solution Design Doc` → 拆分 Epic / Story
- PRD → 设计师产出 UX 详稿
- PRD → 测试产出 Test Plan
- PRD → 法务产出协议条款

PRD 是事实唯一来源（Single Source of Truth）。

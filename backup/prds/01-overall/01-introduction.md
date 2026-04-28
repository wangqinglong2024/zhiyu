> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 1.1 · 引言

## 一、产品概述

**知语 (Zhiyu)** 是一款面向东南亚（越南 / 泰国 / 印尼）的 AI 驱动中文学习平台，用学习者母语进行讲解，提供"发现中国 / 系统课程 / 游戏专区 / 小说专区"四大模块的完整学习闭环。

## 二、文档目的

本 PRD 给出 MVP（v1.0）阶段的产品需求规范，用于：
- 指导架构师设计技术方案
- 指导开发团队实现功能
- 指导测试团队制定测试计划
- 指导法务团队拟定合同条款
- 指导运营团队规划内容生产与营销

## 三、目标读者

| 读者 | 关注重点 |
|---|---|
| 架构师 | 整体架构、非功能需求、模块边界 |
| 前端开发 | UX 流程、组件、交互细节 |
| 后端开发 | 数据模型、业务规则、API |
| QA 测试 | 验收准则、回归用例 |
| 产品经理 | 范围、优先级、迭代规划 |
| 法务/合规 | 隐私 / 协议 / 跨境数据 |
| 运营 | 内容生产、定价、营销 |

## 四、产品范围（v1.0 MVP）

### 4.1 In Scope
- 4 模块（发现中国 / 课程 / 游戏 / 小说）
- 用户体系（注册 / 登录 / 偏好）
- 学习引擎（FSRS-5 SRS / 多题型）
- 知语币经济
- 永久二级分销
- Paddle 订阅 + 单段付费
- 客服 IM
- 管理后台
- 反爬 / 安全
- AI 内容工厂（LangGraph，**v1.5 启用**；MVP 阶段手工入库）
- 4 语 UI（英 / 越 / 泰 / 印尼）
- 4 语内容讲解
- TTS 音频
- PWA Web 应用

### 4.2 Out of Scope（v2+）
- 原生 iOS / Android App
- 实时多人对战
- ASR 语音评测
- 1v1 真人课
- AI 助教（RAG）
- 直播课
- 高级会员档（$20/月）
- B2B 自助平台
- 中国大陆市场

## 五、词汇表

| 术语 | 含义 |
|---|---|
| **WAL** | Weekly Active Learners，每周活跃学习者，北极星指标 |
| **MAU** | Monthly Active Users，月活用户 |
| **DAU** | Daily Active Users，日活用户 |
| **ARPU** | Average Revenue Per User，每用户平均收入 |
| **LTV** | Lifetime Value，用户生命周期价值 |
| **CAC** | Customer Acquisition Cost，获客成本 |
| **MRR / ARR** | Monthly / Annual Recurring Revenue |
| **NPS** | Net Promoter Score，净推荐值 |
| **PMF** | Product-Market Fit，产品市场契合度 |
| **MoR** | Merchant of Record，记录商家（Paddle 模式） |
| **FSRS-5** | Free Spaced Repetition Scheduler v5，记忆调度算法 |
| **SRS** | Spaced Repetition System，间隔重复系统 |
| **HSK** | 汉语水平考试（Hanyu Shuiping Kaoshi） |
| **HSK 1-9** | HSK 1-6 + HSK 7-9（高阶） |
| **TTS** | Text-To-Speech，语音合成 |
| **PWA** | Progressive Web App |
| **WAF** | Web Application Firewall |
| **CDN** | Content Delivery Network |
| **RLS** | Row Level Security，Postgres 行级安全 |
| **HMAC** | Hash-based Message Authentication Code |
| **轨道（Track）** | 课程的 4 个学习方向：电商、工厂、HSK、日常 |
| **阶段（Stage）** | 每轨道 12 个阶段（HSK 1, 2, 3, ..., 9 等） |
| **章（Chapter）** | 每阶段 12 章 |
| **节（Lesson）** | 每章 12 节 |
| **知识点（Knowledge Point）** | 每节 12 个知识点 |
| **节小测** | 学完一节后的 10 题测验 |
| **章测** | 章末综合测验 |
| **阶段考** | 阶段末大考 |
| **温故知新** | SRS 复习首页 |
| **知语币（Zhiyu Coins）** | 应用内积分货币 |
| **PDPL / PDPA / UU PDP** | 越南 / 泰国 / 印尼数据保护法 |
| **DPO** | Data Protection Officer，数据保护官 |

## 六、参考文档

- 产品简报：[`/docs/05-product-brief/`](../../../docs/05-product-brief/)
- 技术研究：[`/docs/04-technical-research/`](../../../docs/04-technical-research/)
- 市场研究：[`/docs/03-market-research/`](../../../docs/03-market-research/)
- 领域研究：[`/docs/02-domain-research/`](../../../docs/02-domain-research/)
- 头脑风暴：[`/docs/01-brainstorming/`](../../../docs/01-brainstorming/)
- 通用规则：[`/_bmad/bmm/`](../../../_bmad/bmm/)

## 七、术语标准化（中英对照）

| 中文 | 英文（代码标识） |
|---|---|
| 发现中国 | discover-china (`dc`) |
| 系统课程 | courses (`cr`) |
| 游戏专区 | games (`gm`) |
| 小说专区 | novels (`nv`) |
| 知识点 | knowledge_point |
| 句子 | sentence |
| 拼音 | pinyin |
| 节小测 | lesson_quiz |
| 章测 | chapter_test |
| 阶段考 | stage_exam |
| 温故知新 | review |
| 错题集 | wrong_set |
| 收藏 | favorite |
| 笔记 | note |
| 关键点 | key_point |

## 八、需求来源追溯

每条需求都可回溯到：
- 用户访谈结论
- 竞品分析
- 市场数据
- 法律法规
- 内部产品决策

需求 ID 在元数据中标注 `Source` 字段（在各模块 PRD 中体现）。

## 九、变更日志

| 版本 | 日期 | 改动 | 作者 |
|---|---|---|---|
| 1.0 | 2026-04-25 | 初稿 | PM Agent |

进入 [`02-goals-vision.md`](./02-goals-vision.md)。

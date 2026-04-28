> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 1.8 · 约束与假设（Constraints & Assumptions）

## 一、技术约束

### 1.1 必须使用
- ✅ **前端**：Vite + React 18 + TypeScript + Tailwind v4 + shadcn/ui
- ✅ **后端**：Express + TypeScript + tsoa
- ✅ **数据库**：Supabase Postgres
- ✅ **AI 工作流**：LangGraph (TS) + Vercel AI SDK
- ✅ **支付**：Paddle MoR（备援 LemonSqueezy）
- ✅ **CDN/WAF**：Cloudflare
- ✅ **TTS**：Azure Speech（备援 ElevenLabs）
- ✅ **游戏引擎**：PixiJS v8 + Howler.js + Matter.js
- ✅ **Schema**：dev_zhiyu / stg_zhiyu / public

### 1.2 禁止使用
- ❌ 紫色（设计系统规则）
- ❌ ElasticSearch / OpenSearch（用 PostgreSQL FTS）
- ❌ 自建数据库（必须 Supabase）
- ❌ 不安全协议（HTTP / 明文密码）
- ❌ 国内 CDN / 国内云（避免合规风险）

### 1.3 部署约束
- 三环境（dev / stg / prod）
- W0-M+6：单 VPS 三环境
- M+6+：拆出 prod 独立 VPS
- 容器化：Docker

## 二、业务约束

### 2.1 市场顺序
- 必须按 越南 → 泰国 → 印尼 顺序推进
- 不允许提前进入印尼（合规风险）
- 不允许进入中国大陆

### 2.2 定价
- 月 $4 / 半年首发 $12 / 年 $40 → MVP 锁定
- M+3 后可调整半年价（首发促销结束）
- 不允许低于 $3/月（毛利不够）

### 2.3 内容
- 4 模块全部覆盖（不能砍模块）
- 课程 4 轨道全部上线（不能砍轨道）
- 4 语种内容全部覆盖（不能砍语种）

### 2.4 团队
- 3 人核心（W0）
- 必须包括 1 名 AI 工程师
- 母语审校外包（不自雇）

## 三、合规约束

### 3.1 数据保护
- 越南 PDPL：用户数据 6 月内可删 / 跨境传输明示同意
- 泰国 PDPA：DPO 必备 / 同意管理
- 印尼 UU PDP：M+6 后评估当地代表

### 3.2 内容
- 严禁政治 / 宗教 / 民族敏感
- 严禁泰国王室相关内容
- 严禁 1979 / 1998 / 2014 等敏感历史
- 严禁加密货币 / 投机 / 涉黄涉赌

### 3.3 商业
- Paddle 服务条款遵守
- 不接受高风险国（朝/伊朗/古巴等）

## 四、财务约束

### 4.1 预算
- 自筹 $30K-50K（M+0 → M+6）
- 不融资（v1）
- 月 burn ≤ $12K（稳态）

### 4.2 单位经济
- LTV/CAC ≥ 3
- Payback < 6 月
- Gross margin > 70%

## 五、时间约束

### 5.1 W0 上线
- 按 W0 节点上线
- 内容必须 W-2 全部到位
- 法务必须 W-1 完成

### 5.2 PMF 决策
- M+3 必须有 PMF 决策（go/no-go）
- 不通过 → 4-8 周迭代

## 六、关键假设

### 6.1 用户假设

| 假设 | 验证状态 | 验证方法 |
|---|:---:|---|
| 东南亚用户偏好母语讲解 | ✅ 已验证 | 用户访谈 + 调研 |
| 现有竞品价格偏贵 | ✅ 已验证 | 竞品分析 |
| HSK 7-9 / 工厂 / 电商场景缺货 | ✅ 已验证 | 竞品分析 |
| $4/月是甜点价 | ⚠️ 待验证 | A/B 测试 |
| 12 款游戏不会过多 | ⚠️ 待验证 | 上线后用户行为 |

### 6.2 商业假设

| 假设 | 验证状态 |
|---|:---:|
| Paddle 接受越南 / 印尼信用卡 | ⚠️ W-3 联调 |
| 永久二级分销不被薅 | ⚠️ 上线后监控 |
| 知语币经济能驱动留存 | ⚠️ A/B |
| 工厂 B2B 团购可行 | ⚠️ M+5 试点 |

### 6.3 技术假设

| 假设 | 验证状态 |
|---|:---:|
| LangGraph 内容工厂月产能 5,000 | ⏳ v1.5 验证；MVP 以手工产出为主 |
| 单条内容生产 < $0.05 | ⚠️ W-6 验证 |
| FSRS-5 在中文学习有效 | ✅ 算法理论 + 类似产品 |
| Cloudflare 反爬足够 | ⚠️ 上线后 |
| Supabase Edge Function 性能 | ⚠️ W-4 压测 |

### 6.4 增长假设

| 假设 | 验证状态 |
|---|:---:|
| TikTok / FB 在东南亚有效 | ✅ 行业常识 |
| KOL 性价比高（$300-500/单） | ⚠️ 接洽中 |
| SEO 6-12 月起效 | ✅ 行业常识 |

## 七、依赖（External Dependencies）

| 依赖 | 来源 | 风险 | 备援 |
|---|---|:---:|---|
| Paddle | Paddle.com | 拒批 | LemonSqueezy |
| Cloudflare | cloudflare.com | 误伤 | 直连 |
| Supabase | supabase.com | 单点 | 自建 PostgreSQL（v3） |
| Azure Speech | azure.com | 限速 | ElevenLabs |
| Claude | anthropic.com | 限速/涨价 | DeepSeek |
| DeepSeek | deepseek.com | 不稳定 | Claude |
| Vercel | vercel.com | - | 自部署 |
| Google OAuth | google.com | 政策 | Email-only fallback |

## 八、范围内 vs 范围外（再确认）

### 范围内 ✅
- 所有 14 模块
- 4 语 UI / 内容
- 三市场（越/泰/印尼）
- v1 全部 P0 / P1 功能

### 范围外 ❌
- 中国大陆
- 1v1 真人课
- 原生 App
- 实时多人游戏
- 直播
- ASR
- AI 助教
- 高级会员档
- B2B 自助平台
- 中文以外语种

## 九、风险敞口

### 9.1 技术债允许范围
- 内容工厂 v1.5 上线后验证单 LLM 成本与质量后再切换双 LLM
- 业务仪表盘 v1 简版（M+1 升级）
- 客服 IM v1 无 AI 辅助（v1.5）

### 9.2 不允许的技术债
- 数据库 schema 不一致
- 核心 API 无类型保护
- 支付链路无幂等
- 用户密码无 hash

## 十、灵活度（Flex Areas）

### 10.1 必须严守（不可妥协）
- 母语原生质量
- 反爬安全
- 支付链路正确
- 数据合规

### 10.2 可以妥协（必要时）
- **12 款游戏一次性首发**（无 coming_soon）
- 单段付费先 9 段（不必按章节）
- v1 仅 Web（不必上 App）
- 业务仪表盘简版（不必豪华）

进入 [`09-release-plan.md`](./09-release-plan.md)。

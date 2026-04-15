# PlayLingo — 技术架构方案

> 架构设计文档，不涉及具体代码实现
> 版本：v2.0 | 日期：2026-04-15

---

## 一、整体架构

### 1.1 系统架构总览

```
用户设备（Web/PWA/WebView App）
        │
        ▼
┌─────────────────────────────────────────┐
│           Cloudflare（CDN + WAF）         │
│   · 全球边缘缓存静态资源（游戏美术/音频）  │
│   · DDoS 防护 + Bot 防护                 │
│   · SSL 终结                             │
│   · Cloudflare R2（对象存储，美术/音频）    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         腾讯云 · 新加坡节点                  │
│                                          │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Nginx       │  │  React 静态资源    │   │
│  │  反向代理     │  │  (Phaser 游戏包)   │   │
│  └──────┬──────┘  └─────────────────┘   │
│         │                                │
│         ▼                                │
│  ┌─────────────────────────────────┐    │
│  │      FastAPI 应用服务器            │    │
│  │  · 用户/游戏/支付/内容 API        │    │
│  │  · JWT 验签                      │    │
│  │  · WebSocket（PvP 对战，v1.1）    │    │
│  │  · 异步任务队列                   │    │
│  └──────┬──────────────┬───────────┘    │
│         │              │                 │
│         ▼              ▼                 │
│  ┌────────────┐ ┌──────────────┐        │
│  │  Supabase   │ │   Redis       │        │
│  │  PostgreSQL  │ │   缓存/排行榜  │        │
│  │  Auth/RLS    │ │   会话存储     │        │
│  │  Realtime    │ │   PvP匹配(v1.1)│       │
│  └────────────┘ └──────────────┘        │
│                                          │
│  ┌────────────────────────────────┐     │
│  │         Dify 实例                │     │
│  │  · 内容生成工作流                 │     │
│  │  · AI 对话编排（v1.1）           │     │
│  │  · 批量内容生产 Pipeline          │     │
│  └────────────────────────────────┘     │
│                                          │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│           外部服务                         │
│  · Azure Speech（发音评估/TTS）           │
│  · OpenAI / DeepSeek（LLM，通过 Dify）   │
│  · Stripe + MoMo/Midtrans（支付）        │
│  · Firebase Cloud Messaging（推送）       │
│  · Cloudflare R2（对象存储）              │
└─────────────────────────────────────────┘
```

### 1.2 为什么选新加坡节点

**结论：新加坡是服务东南亚的最佳服务器节点。**

| 维度 | 分析 |
|------|------|
| **地理位置** | 位于东南亚中心，到越南/印尼/泰国/马来/菲律宾均为最短路径 |
| **网络基础设施** | 全球海底光缆最密集的枢纽之一，AWS/GCP/Azure/腾讯云/阿里云均有新加坡节点 |
| **到越南延迟** | 预估 25-40ms RTT（胡志明市），对于非实时竞技游戏完全满足 |
| **到印尼延迟** | 预估 15-30ms RTT（雅加达），极低 |
| **数据合规** | 新加坡 PDPA 法规成熟，是东南亚数据存储的首选地 |
| **CDN 加速** | Cloudflare 在东南亚有大量边缘节点，静态资源（图片/音频/游戏资源包）通过 CDN 分发，实际用户体验延迟极低 |
| **成本** | 腾讯云新加坡 vs AWS 新加坡，腾讯云成本更低约 30-40% |

**延迟对本产品的影响分析**：
- MVP 版（单人闯关为主）：对延迟不敏感，200ms 以内均可接受
- v1.1 PvP 对战：需要 <100ms，新加坡到越南/印尼满足
- 静态资源（美术/音频）：走 CDN，不经过新加坡源站

**备选方案**（如需多节点）：
- 优先级 1：新加坡（主节点）
- 优先级 2：雅加达（印尼市场增长后增设边缘节点）
- 暂不需要：暂时不需要多 Region 部署，等用户量到 10 万级再评估

---

## 二、前端技术栈

### 2.1 技术选型（架构层面）

| 层级 | 技术 | 职责 |
|------|------|------|
| **主框架** | React + TypeScript + Vite | SPA 架构，管理非游戏页面（登录/设置/商城/排行榜） |
| **游戏引擎** | Phaser 3 (TypeScript) | 2D 游戏核心（关卡/小游戏/过场动画/世界地图） |
| **状态管理** | Zustand | 全局状态（用户信息/游戏进度/词库），轻量且 TS 友好 |
| **服务端数据** | TanStack Query | API 数据缓存管理，减少重复请求 |
| **路由** | React Router | 页面路由（游戏/设置/商城/社交等） |
| **UI 样式** | Tailwind CSS | 原子化 CSS，快速构建精致 UI |

### 2.2 React 与 Phaser 的集成架构

```
整体思路：React 管理页面路由和非游戏 UI，Phaser 管理游戏 Canvas

React App (主框架)
├── 非游戏页面（React 组件）
│   ├── 登录/注册页
│   ├── 个人主页/设置
│   ├── 世界地图（可选：用 React 实现或 Phaser 实现）
│   ├── 词库管理页
│   ├── 排行榜/社交（v1.1）
│   ├── 商城/皮肤预览（v1.1）
│   └── AI 功能入口（v1.1）
│
├── 游戏容器（React 组件包装 Phaser Canvas）
│   └── Phaser 3 Game Instance
│       ├── 关卡场景 (LevelScene) — 知识教学/词汇战役/汉字书写/听力挑战
│       ├── 小游戏场景 (MiniGameScene) — 声调狙击手/部首大爆炸/拼音漂移
│       ├── 过场动画场景 (CutsceneScene) — 剧情对话 + 字幕
│       └── PvP 场景 (PvPScene, v1.1)
│
└── 共享通信层
    ├── React → Phaser：通过 EventEmitter 传递用户数据/指令
    └── Phaser → React：通过 EventEmitter 传递游戏结果/进度
```

### 2.3 发布形态

```
优先级排序：

1. PWA（首选，MVP 即支持）
   · 浏览器访问，"添加到主屏幕"
   · Service Worker 缓存游戏资源，已下载关卡可离线
   · 无需应用商店审核，快速迭代
   · 规避 Apple/Google 30% 抽成

2. Android WebView App（v1.1, Google Play 上架）
   · Capacitor/TWA 包装 PWA
   · 提升可信度和应用商店曝光
   · 小型开发者 15% 抽成

3. iOS WebView App（v1.1, App Store 上架）
   · Capacitor 包装
   · 引导用户到网页端订阅（规避 30% 抽成）
```

---

## 三、后端技术栈

### 3.1 FastAPI 服务模块划分

```
/api/v1/
├── /auth/          # 认证（注册/登录/OAuth/刷新 Token）
├── /users/         # 用户信息（资料/设置/词库/学习统计）
├── /game/          # 游戏核心
│   ├── /progress/  # 关卡进度（解锁/评分/星级）
│   ├── /levels/    # 关卡数据分发（题目/剧本/素材 URL）
│   ├── /review/    # SRS 复习队列（待复习词汇/复习提交）
│   ├── /battle/    # PvP 对战（v1.1：匹配/结算/段位）
│   ├── /shop/      # 商城（v1.1：皮肤/装饰/货币兑换）
│   └── /social/    # 社交（v1.2：好友/军团/排行榜）
├── /ai/            # AI 功能（v1.1）
│   ├── /chat/      # AI 对话（透传 Dify API）
│   ├── /pronounce/ # 发音评估（透传 Azure Speech）
│   └── /writing/   # 作文批改（透传 Dify）
├── /payment/       # 支付
│   ├── /subscribe/ # 会员订阅
│   ├── /coins/     # Coins 充值
│   └── /webhook/   # 支付回调
├── /referral/      # 推广链接自动绑定佣金系统
│   ├── /bindlink/  # 推广链接生成 + 注册时自动绑定推荐关系
│   ├── /stats/     # 推荐统计数据
│   └── /withdraw/  # 佣金提现
└── /admin/         # 管理后台 API
    ├── /content/   # 内容管理
    └── /analytics/ # 数据分析
```

### 3.2 关键架构原则

```
1. 全异步（Async-First）
   · 所有 API 路由使用异步处理
   · 数据库访问：异步连接池
   · 外部 HTTP 请求：异步客户端
   · 重型任务：后台任务队列 + Redis

2. JWT 本地验签
   · 使用 Supabase JWT_SECRET 在内存中验签
   · 毫秒级验证，零外部依赖

3. 内容分发 CDN 化
   · 关卡静态数据（题目 JSON、美术 URL、音频 URL）经 Cloudflare CDN 缓存
   · FastAPI 只处理动态数据（用户进度、实时交互）
   · 大幅降低源站负载

4. 关卡数据结构化
   · 每个关卡是一个 JSON 数据包
   · 包含：题目池、过关条件、星级标准、素材引用
   · 前端根据 JSON 数据驱动渲染关卡
   · 新增关卡 = 新增 JSON + 素材，无需改代码
```

### 3.3 PvP 对战架构（v1.1）

```
匹配与对战流程：

1. 客户端 → 请求匹配
   · 携带：用户段位、当前词汇等级
   · 服务端将用户加入 Redis 匹配队列

2. 匹配引擎（后台任务，定期扫描）
   · 按段位 ±1 级范围匹配
   · 15 秒内匹配成功 → 创建对战房间
   · 30 秒超时 → 匹配 AI 对手

3. 匹配成功 → 双方收到 WebSocket 通知
   · 返回：room_id + 对手信息 + 题目列表

4. 对战实时通信
   · 双方通过 WebSocket 同步答题状态
   · 服务端校验答案正确性（防作弊，客户端不持有正确答案）
   · 实时广播双方得分变化

5. 对战结束
   · 服务端计算胜负 → 更新段位 → 发放奖励
   · 记录对战日志
```

---

## 四、数据库设计（Supabase/PostgreSQL）

### 4.1 核心表结构（概览）

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| **profiles** | 用户扩展信息 | display_name, locale, level, gold, diamonds, streak_days, subscription_tier, referral_code |
| **level_progress** | 关卡进度 | user_id, level_id, stars, best_score, attempts, completed_at |
| **user_vocabulary** | 用户已学词汇 | user_id, word, pinyin, meaning_vi, hsk_level, mastery_level, next_review_at |
| **subscriptions** | 会员订阅记录 | user_id, plan, status, payment_provider, amount, starts_at, expires_at |
| **referrals** | 推荐关系 | referrer_id, referred_id, status, commission_rate, total_commission |
| **commission_logs** | 佣金明细 | referrer_id, referred_id, amount, status(pending/settled/withdrawn) |
| **pvp_battles** (v1.1) | PvP 对战记录 | player1_id, player2_id, winner_id, scores, tier_at_battle |
| **user_inventory** (v1.1) | 皮肤/装饰 | user_id, item_type, item_id, equipped |
| **ai_usage_logs** (v1.1) | AI 使用记录 | user_id, feature, tokens_used, coins_charged |
| **guilds** (v1.2) | 军团 | name, leader_id, member_count |

### 4.2 安全架构

```
Row Level Security（RLS）：
  · 每张表开启 RLS
  · 用户只能读写自己的数据
  · 公开数据（排行榜/军团信息）通过 View 控制可见字段
  · 敏感操作（支付/佣金/段位变更）只能由后端 Service Role 执行

数据访问原则：
  · 前端 → Supabase Client（受限于 RLS，只能操作自己的数据）
  · 后端 → Supabase Service Client（绕过 RLS，用于系统操作）
  · 管理后台 → 后端管理 API（权限校验 + 审计日志）
```

---

## 五、Dify 集成方案

### 5.1 Dify 的职责定位

```
职责一：内容生产工厂（离线/批量）
  → 生成关卡剧本、题目、过场动画脚本
  → 生成词汇解释和例句
  → 批量翻译（中文 → 越南语/印尼语）
  → 定时触发，生产完毕后入库

职责二：AI 功能编排（在线/实时，v1.1）
  → AI 对话练习：System Prompt + 对话管理 + 输出格式化
  → AI 作文批改：批改逻辑 + 结构化输出
  → AI 语法解释：多语言解释工作流
```

### 5.2 关键工作流

```
工作流 1：关卡内容生成
  输入：主题 + HSK 级别 + 目标词汇 + 语法点
  输出：结构化 JSON（题目库 + Boss 对话 + 动画脚本 + 词汇卡）
  模型：Claude/GPT-4 生成初稿 → 人工审校

工作流 2：AI 对话练习（v1.1）
  输入：用户语音/文字 + 用户等级 + 对话历史
  System Prompt：根据用户 HSK 等级调整对话复杂度
  输出：回复文本 + TTS 音频 URL

工作流 3：AI 作文批改（v1.1）
  输入：用户作文 + HSK 级别
  输出：评分 + 修改建议 + 改进版本（结构化 JSON）

部署：腾讯云新加坡节点 Docker 容器，与 FastAPI 同一 VPC 内网通信
```

---

## 六、支付架构

### 6.1 支付通道

```
越南市场：
  · MoMo（越南最大电子钱包，覆盖率最高）
  · VNPay（银行转账/ATM/信用卡）
  · ZaloPay（Zalo 生态用户）
  · Stripe（国际信用卡）

印尼市场（v1.3）：
  · Midtrans 聚合（GoPay/OVO/Dana/银行转账）
  · Stripe（国际信用卡）

支付流程：
  用户选择套餐 → 选择支付方式 → 跳转支付 → Webhook 回调 →
  后端验证签名 → 更新订阅状态 → 通知前端
```

### 6.2 佣金结算架构

```
佣金流转：
  被推荐人付费 → 支付 Webhook 触发 →
  后端计算佣金（基于推荐人等级的费率） →
  佣金进入 pending 状态（30天冷却期） →
  冷却期结束且无退款 → 佣金变为 available →
  推荐人申请提现（最低 $10） →
  后端审核 → 通过本地支付渠道打款

防作弊：
  · 设备指纹 + IP 检测（防同一人多号）
  · 支付工具关联检测（同一支付方式最多关联 3 个账号）
  · 30 天冷却期（被推荐人退款则佣金取消）
  · 单人单日推荐 >10 人触发人工审核
```

---

## 七、监控与运维

### 7.1 监控体系

```
应用层：
  · API 响应时间 / 错误率 / QPS
  · 游戏资源加载时间
  · 支付成功率 / 失败原因

基础设施：
  · 服务器 CPU/内存/磁盘/网络
  · 数据库连接数/慢查询
  · Redis 内存使用/命中率

业务指标：
  · DAU/MAU/注册转化/付费转化
  · 关卡完成率 / 各关卡通关率
  · 佣金系统实时数据

工具选型（低成本）：
  · Sentry（错误追踪，免费版够用）
  · Uptime Robot（可用性监控，免费）
  · 腾讯云自带监控（基础设施）
  · 自建仪表盘（Supabase SQL + 简单前端）
```

---

*本文档为 PlayLingo 技术架构方案 v2.0。仅描述架构设计，不涉及具体代码实现。*

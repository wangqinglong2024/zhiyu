# 技术架构设计

> 知语 Zhiyu 技术选型与系统设计
> 版本：V1.0 | 日期：2026-04-17

---

## 一、技术选型总览

### 1.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 18+ / TypeScript | 组件化、生态成熟 |
| **样式方案** | Tailwind CSS v4 | 原子化 CSS，开发效率高 |
| **状态管理** | Zustand | 轻量、简洁，适合中型项目 |
| **数据请求** | React Query (TanStack Query) | 缓存、重试、乐观更新 |
| **国际化** | i18next + react-i18next | 多语言切换（zh/en/vi → 后续 id/th/ms） |
| **PWA** | Workbox | 离线缓存、推送通知 |
| **后端框架** | Node.js + TypeScript (Hono/Fastify) | 异步高并发、全栈 TS 统一 |
| **认证** | Supabase Auth + JWT | 邮箱/手机/OAuth 登录 |
| **数据库** | Supabase PostgreSQL | 托管 PostgreSQL + RLS 行级安全 |
| **缓存** | Redis (Upstash) | Serverless Redis，排行榜/会话/限流 |
| **内容引擎** | Dify | AI 内容生产工具（生成后写入 Supabase） |
| **支付** | Paddle MoR | Merchant of Record 模式，代处理全球税务，支持中国大陆公司签约 |
| **CDN / 存储** | Cloudflare CDN + R2 | 全球加速 + 对象存储 |
| **TTS** | Azure TTS（或备选） | 中文语音合成，支持多种声色 |
| **部署** | PWA 优先 → Capacitor (Android/iOS) | 一套代码多端发布 |

### 1.2 服务器部署

| 配置 | 说明 |
|------|------|
| 区域 | **新加坡** |
| 延迟 | 到越南 25-40ms（东南亚首发市场最优） |
| 扩展 | 后期可加入印尼/泰国边缘节点 |

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────┐
│                   Client Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ PWA Web  │  │ Android  │  │   iOS (后期)  │  │
│  │ (React)  │  │(Capacitor)│ │  (Capacitor)  │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       └──────────────┼───────────────┘          │
│                      │ HTTPS                    │
└──────────────────────┼──────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────┐
│              Cloudflare CDN / R2                │
│         (静态资源、图片、音频、视频)              │
└──────────────────────┼──────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────┐
│                  API Gateway                    │
│              (Cloudflare Workers)               │
│         限流 / 路由 / CORS / 日志               │
└──────────────────────┼──────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────┐
│              Backend Services                   │
│  ┌───────────────────┼───────────────────────┐  │
│  │        Node.js + TypeScript               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ 用户服务  │ │ 课程服务  │ │ 游戏服务  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ 支付服务  │ │ 内容服务  │ │ AI 服务   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘  │  │
│  └───────────────────────────────────────────┘  │
└──────────────────────┼──────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────┐
│                Data Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Supabase │  │  Redis   │  │    Dify      │  │
│  │PostgreSQL│  │ (Upstash)│  │  知识库+AI    │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```

### 2.2 服务模块划分

| 服务 | 职责 |
|------|------|
| **用户服务** | 注册/登录/Profile/偏好设置/学习进度/成就系统 |
| **课程服务** | 课程大纲/课时内容/练习题/考试/证书 |
| **游戏服务** | 12 款 2D 游戏（Phaser 3）/实时 PK（WebSocket）/星数段位/匹配系统/积分/排行榜/皮肤 |
| **内容服务** | 发现中国文章/多语言内容/Supabase 内容查询 |
| **支付服务** | Paddle MoR Webhook/课程购买管理/订单记录/退款 |
| **AI 服务** | 口语评测/写作批改/智能推题/SRS 调度 |

---

## 三、前端架构

### 3.1 项目结构

```
src/
  ├── app/                    # 路由入口
  ├── components/             # 通用组件
  │     ├── ui/               # 基础 UI 组件
  │     ├── layout/           # 布局组件
  │     └── shared/           # 业务通用组件
  ├── features/               # 功能模块
  │     ├── auth/             # 认证
  │     ├── discover/         # 发现中国
  │     ├── courses/          # 系统课程
  │     ├── games/            # 游戏模式
  │     ├── profile/          # 个人中心
  │     └── payment/          # 支付
  ├── hooks/                  # 自定义 Hook
  ├── stores/                 # Zustand stores
  ├── services/               # API 调用层
  ├── i18n/                   # 国际化资源
  │     ├── zh.json
  │     ├── en.json
  │     └── vi.json
  ├── utils/                  # 工具函数
  ├── types/                  # TypeScript 类型
  └── assets/                 # 静态资源
```

### 3.2 路由设计

```
/                           # 首页（发现中国入口）
/discover                   # 发现中国
/discover/:category         # 发现中国子模块
/discover/:category/:id     # 文章详情
/courses                    # 课程列表
/courses/:level             # Level 课程页
/courses/:level/:unit       # 单元页
/courses/:level/:unit/:lesson  # 课时页
/courses/:level/exam        # 级别综合考核
/games                      # 游戏大厅
/games/:id                  # 游戏页（12 款独立游戏）
/games/ranking              # 排行榜
/profile                    # 个人中心
/profile/progress           # 学习进度
/profile/achievements       # 成就
/settings                   # 设置
/purchases                  # 课程购买
/placement-test             # 入学测试
```

### 3.3 PWA 策略

| 策略 | 说明 |
|------|------|
| 缓存优先 | 静态资源（JS/CSS/图片）Cache First |
| 网络优先 | API 数据 Network First + 本地缓存兜底 |
| 离线支持 | 已下载的课程内容离线可学 |
| 推送通知 | 学习提醒、签到提醒、活动通知 |
| 安装提示 | 引导用户添加到主屏幕 |

### 3.4 响应式设计

| 断点 | 布局 |
|------|------|
| < 640px | 移动端单列（主要） |
| 640-1024px | 平板双栏 |
| > 1024px | 桌面多栏 |

> 移动端优先设计（目标用户 90%+ 使用手机）

---

## 四、后端架构

### 4.1 后端项目结构

```
server/
  ├── src/
  │     ├── index.ts            # 应用入口
  │     ├── config.ts           # 配置管理
  │     ├── routes/             # 路由模块
  │     │     ├── auth.ts
  │     │     ├── users.ts
  │     │     ├── courses.ts
  │     │     ├── games.ts
  │     │     ├── discover.ts
  │     │     ├── payments.ts
  │     │     └── admin.ts
  │     ├── services/           # 业务逻辑层
  │     ├── models/             # 数据模型（Drizzle ORM / Prisma）
  │     ├── schemas/            # Zod 校验 schemas
  │     ├── middleware/         # 中间件
  │     ├── ws/                 # WebSocket 对战服务
  │     └── utils/              # 工具函数
  ├── package.json
  └── tsconfig.json
```

### 4.2 认证流程

```
用户登录 → Supabase Auth 验证 → 返回 JWT
     ↓
请求携带 JWT → Node.js 中间件验证 → 访问受保护资源
     ↓
Token 过期 → Refresh Token 刷新 → 新 JWT
```

支持的登录方式：
- 邮箱 + 密码
- 手机号 + 验证码
- Google OAuth
- Facebook OAuth（东南亚主流）

### 4.3 API 设计原则

- RESTful 风格
- 版本化：`/api/v1/`
- 统一响应格式：`{ code, message, data }`
- 分页：`?page=1&size=20`
- 限流：Redis 令牌桶（普通用户 60 次/分钟，付费用户 120 次/分钟）

---

## 五、数据库设计

### 5.1 核心表结构

```sql
-- 用户表
users
  ├── id (UUID, PK)
  ├── email
  ├── phone
  ├── display_name
  ├── avatar_url
  ├── ui_language (zh/en/vi)
  ├── content_language_mode (pinyin_zh/zh_only)
  ├── explanation_language (vi/en/off)
  ├── current_level (1-12)
  ├── purchased_levels (INTEGER[], 已购买的课程级别列表)
  ├── level_expires_at (JSONB, 各级别到期时间 {level: expires_at})
  ├── referral_code
  ├── referred_by
  ├── zhiyu_coins (INTEGER, 知语币余额，1 币 = $0.01 等价值，不可提现)
  ├── zhiyu_coins_earned_total (历史累计获得数)
  ├── zhiyu_coins_spent_total (历史累计花费数)
  ├── created_at
  └── updated_at

-- 课程进度表
course_progress
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── level (1-12)
  ├── unit
  ├── lesson
  ├── status (not_started/in_progress/completed)
  ├── score
  └── completed_at

-- 级别综合考核记录
level_exams
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── level
  ├── listening_score
  ├── speaking_score
  ├── reading_score
  ├── writing_score
  ├── culture_score
  ├── total_score
  ├── passed (boolean)
  └── taken_at

-- 游戏记录表
game_records
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── game_id (1-12, 对应 12 款游戏)
  ├── mode (solo_classic/solo_timed/pk_1v1/multiplayer)
  ├── score
  ├── best_score
  ├── star_count (总星数，1-91+)
  ├── rank_tier (bronze/silver/gold/platinum/diamond/star/king)
  └── played_at

-- SRS 复习表
srs_items
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── item_type (character/word/idiom/poem/grammar)
  ├── item_id
  ├── ease_factor
  ├── interval_days
  ├── next_review_at
  ├── review_count
  └── last_reviewed_at

-- 订单表
orders
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── paddle_transaction_id
  ├── product_type (course_level/skin/season_pass)
  ├── product_id
  ├── amount
  ├── currency
  ├── status (pending/completed/refunded)
  └── created_at

-- 推荐关系表
referrals
  ├── id (UUID, PK)
  ├── referrer_id (FK → users)
  ├── referred_id (FK → users)
  ├── trigger_order_id (FK → orders, 触发返佣的订单)
  ├── commission_coins (INTEGER, 本次奖励的知语币数量)
  ├── commission_status (pending/credited/reversed)
  ├── credited_at
  └── created_at

-- 知语币流水表（虚拟币全流水账本，审计+防作弊）
coin_transactions
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── direction (credit/debit)
  ├── amount (INTEGER, 正整数，单位：币)
  ├── reason (referral_reward / signin_bonus / skin_purchase / course_redeem / season_pass / admin_adjust)
  ├── related_id (UUID, 关联订单/推荐记录/签到记录等)
  ├── balance_after (INTEGER, 交易后余额快照)
  └── created_at
```

> ⚠️ 知语币铁律：**所有余额变动必须通过 coin_transactions 表记录**，余额字段 zhiyu_coins 只是快照。绝不允许直接 UPDATE users.zhiyu_coins。退款/撤销时写反向流水，而非修改历史记录。

### 5.2 RLS 策略

利用 Supabase 的行级安全策略：

- 用户只能读写自己的数据
- 课程内容对所有认证用户可读（付费内容由后端逻辑控制）
- 排行榜数据所有用户可读
- 管理员可访问所有数据

---

## 六、内容存储与 Dify 集成

### 6.1 架构

```
Supabase PostgreSQL（内容主存储）
  ├── 发现中国文章表
  ├── 课程内容表（按 Level/Unit/Lesson 结构化）
  ├── 练习题库表
  └── 古诗文表

Dify AI 工作流（内容生产工具，生成后写入 Supabase）
  ├── 课程内容生成 Workflow
  ├── 练习题生成 Workflow
  ├── 多语言翻译 Workflow
  └── AI 评测 Workflow
```

### 6.2 内容格式

知识库中每条内容的结构：

```json
{
  "id": "course_l1_u1_lesson1_001",
  "level": 1,
  "unit": 1,
  "lesson": 1,
  "type": "teaching",
  "module": "M1",
  "content": {
    "pinyin": "Nǐ hǎo, wǒ jiào Xiǎomíng.",
    "zh": "你好，我叫小明。",
    "vi": "Xin chào, tôi tên là Tiểu Minh.",
    "en": "Hello, my name is Xiaoming."
  },
  "audio": {
    "zh": "https://cdn.zhiyu.app/audio/l1u1l1_001.mp3"
  },
  "metadata": {
    "characters": ["你", "好", "我", "叫"],
    "grammar": ["self_introduction"],
    "difficulty": 1
  }
}
```

### 6.3 调用流程

```
前端请求课时内容 → Node.js API → 查询 Supabase 数据库 → 根据用户语言偏好筛选字段 → 返回前端
```

---

## 七、AI 功能技术方案

### 7.1 口语评测

```
用户录音 → 音频上传 → Azure Speech SDK 语音识别 → 发音评分 → 返回结果
                                                          ├── 准确度分数
                                                          ├── 流利度分数
                                                          ├── 声调评分
                                                          └── 错误音素标注
```

### 7.2 写作批改

```
用户提交作文 → Node.js API → Dify AI Workflow → GPT/Claude 批改 → 返回结果
                                                                ├── 总分
                                                                ├── 语法错误列表
                                                                ├── 用词建议
                                                                ├── 结构评价
                                                                └── 改进建议
```

### 7.3 SRS 间隔重复

```typescript
// 核心算法（简化版 SM-2）
function calculateNextReview(easeFactor: number, interval: number, quality: number) {
  if (quality >= 3) { // 答对
    if (interval === 0) interval = 1;
    else if (interval === 1) interval = 2;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * 0.08);
  } else { // 答错
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }
  return { interval, easeFactor };
}
```

---

## 八、性能与安全

### 8.1 性能目标

| 指标 | 目标 |
|------|------|
| 首页加载 | < 2 秒 |
| API 响应 | < 200ms（P95） |
| 音频加载 | < 1 秒 |
| 离线启动 | < 1.5 秒 |

### 8.2 安全措施

| 措施 | 说明 |
|------|------|
| HTTPS | 全站强制 |
| JWT + Refresh Token | 短期 Access Token(15min) + 长期 Refresh Token(7d) |
| RLS | 数据库行级安全 |
| 限流 | Redis 令牌桶 |
| CORS | 白名单域名 |
| 输入验证 | Zod Schema 严格校验 |
| SQL 注入防护 | ORM + 参数化查询 |
| XSS 防护 | React 默认转义 + CSP Header |
| 敏感数据加密 | AES-256 加密存储 |

### 8.3 监控

| 工具 | 用途 |
|------|------|
| Sentry | 前端/后端错误追踪 |
| Uptime Robot | 服务可用性监控 |
| Cloudflare Analytics | 流量/性能分析 |
| 自建 Dashboard | 业务指标看板 |

---

## 九、部署策略

### 9.1 发布优先级

```
Phase 1: PWA (Web) — 首发，覆盖所有平台
Phase 2: Android (Capacitor 打包) — 上架 Google Play
Phase 3: iOS (Capacitor 打包) — 上架 App Store（Web 购买优先，规避苹果 30% 抽成）
```

### 9.2 CI/CD

```
代码提交 → GitHub Actions → 自动测试 → 构建 → 部署到 Cloudflare Pages (前端)
                                              → 部署到服务器 (后端)
```

### 9.3 环境

| 环境 | 用途 |
|------|------|
| development | 本地开发 |
| staging | 预发布测试 |
| production | 生产环境 |
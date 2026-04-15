# HanYu — 技术架构与系统建设方案

> Supabase + FastAPI + React/TS + Phaser 3 + Dify | 腾讯云新加坡节点
> 版本：v1.0 | 日期：2026-04-15

---

## 一、整体架构

```
用户设备（Web/PWA/WebView App）
        │
        ▼
┌─────────────────────────────────────────┐
│           Cloudflare（CDN + WAF）         │
│   · 全球边缘缓存静态资源                    │
│   · DDoS 防护                             │
│   · SSL 终结                              │
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
│  │  · JWT 本地验签                   │    │
│  │  · WebSocket（PvP 对战）          │    │
│  │  · 异步任务队列                   │    │
│  └──────┬──────────────┬───────────┘    │
│         │              │                 │
│         ▼              ▼                 │
│  ┌────────────┐ ┌──────────────┐        │
│  │  Supabase   │ │   Redis       │        │
│  │  PostgreSQL  │ │   缓存/排行榜  │        │
│  │  Auth/RLS    │ │   PvP 匹配池  │        │
│  │  Realtime    │ │   会话存储     │        │
│  └────────────┘ └──────────────┘        │
│                                          │
│  ┌────────────────────────────────┐     │
│  │         Dify 实例                │     │
│  │  · 内容生成工作流                 │     │
│  │  · AI 对话编排                   │     │
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

---

## 二、前端技术栈

### 2.1 主框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 19+ | 主框架，SPA 架构 |
| **TypeScript** | 5.x | 全量 TS，严格模式 |
| **Vite** | 6.x | 构建工具，HMR 极快 |
| **React Router** | 7.x | 路由管理 |
| **Zustand** | 5.x | 全局状态管理（轻量、TS 友好） |
| **TanStack Query** | 5.x | 服务端状态/缓存管理 |
| **Tailwind CSS** | 4.x | 原子化 CSS，快速构建 UI |

### 2.2 游戏引擎层

| 技术 | 版本 | 用途 |
|------|------|------|
| **Phaser 3** | 3.80+ | 2D 游戏引擎核心 |
| **phaser3-rex-plugins** | latest | Phaser 扩展插件（UI、特效等） |
| **PixiJS** | 8.x | 游戏外的 UI 粒子特效/动画（可选） |

### 2.3 React 与 Phaser 的集成方案

```typescript
// 核心思路：React 管理页面路由和非游戏 UI，
// Phaser 管理游戏 Canvas，通过事件总线通信

// GameContainer.tsx — React 组件包装 Phaser
import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { gameConfig } from '@/game/config'
import { useGameStore } from '@/stores/gameStore'

export function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      gameRef.current = new Phaser.Game({
        ...gameConfig,
        parent: containerRef.current,
      })
    }
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}

// 通信方式：Phaser Scene ↔ React Store
// Phaser 内通过 EventEmitter 发事件
// React 侧通过 Zustand store 订阅和推送
```

### 2.4 PWA + WebView App 策略

```
发布形态优先级：

1. PWA（首选）
   · 用户通过浏览器访问，可"添加到主屏幕"
   · Service Worker 缓存游戏资源（离线可玩已下载关卡）
   · 无需应用商店审核，快速迭代
   · 避免 Apple/Google 30% 抽成

2. Android WebView App（Google Play 上架）
   · 用 Capacitor/TWA 包装 PWA
   · Google Play 上架提升可信度和曝光
   · 小型开发者 15% 抽成（年收入 <$1M）

3. iOS WebView App（App Store 上架）
   · Capacitor 包装
   · 引导用户到网页端订阅（规避 30% 抽成）
   · Apple 小型开发者项目 15% 抽成

为什么不用 React Native？
  · 游戏场景需要 Canvas/WebGL，RN 不擅长
  · Phaser 3 原生运行在 Web 上，PWA 是最自然的载体
  · 一套代码，一次部署，全平台可用
```

---

## 三、后端技术栈

### 3.1 FastAPI 服务

```
API 模块划分：

/api/v1/
├── /auth/          # 认证相关（注册/登录/OAuth/刷新Token）
├── /users/         # 用户信息（资料/设置/词库）
├── /game/          # 游戏核心
│   ├── /progress/  # 关卡进度（解锁/评分/领地状态）
│   ├── /battle/    # PvP 对战（匹配/结算/段位）
│   ├── /shop/      # 商城（皮肤/装饰/货币兑换）
│   └── /social/    # 社交（好友/军团/排行榜）
├── /content/       # 内容分发
│   ├── /levels/    # 关卡数据（题目/剧本/素材URL）
│   ├── /cutscenes/ # 过场动画数据
│   └── /vocab/     # 词汇库数据
├── /ai/            # AI 功能
│   ├── /chat/      # AI 对话（透传 Dify API）
│   ├── /pronounce/ # 发音评估（透传 Azure Speech）
│   └── /writing/   # 作文批改（透传 Dify）
├── /payment/       # 支付
│   ├── /subscribe/ # 会员订阅
│   ├── /coins/     # HanYu Coins 充值
│   └── /webhook/   # 支付回调
└── /admin/         # 管理后台 API
    ├── /content/   # 内容管理
    ├── /users/     # 用户管理
    └── /analytics/ # 数据分析
```

### 3.2 关键设计原则

```
1. 全异步（Async-First）
   · 所有路由 async def
   · 数据库：asyncpg（通过 Supabase Python Client async）
   · 外部请求：httpx（异步 HTTP）
   · 重型任务：BackgroundTasks / Celery + Redis

2. JWT 本地验签
   · 使用 Supabase JWT_SECRET 在内存中验签
   · 不每次请求都调用 Supabase Auth API
   · 毫秒级验证，零外部依赖

3. WebSocket for PvP
   · FastAPI WebSocket + Redis Pub/Sub
   · PvP 对战通过 WebSocket 实时通信
   · Supabase Realtime 用于非实时场景（好友状态等）

4. 内容分发 CDN 化
   · 关卡静态数据（题目 JSON、素材 URL）缓存到 Cloudflare
   · FastAPI 只处理动态数据（用户进度、实时对战）
   · 减轻服务器压力，加快加载速度
```

### 3.3 PvP 对战技术方案

```
匹配与对战流程：

1. 客户端 → POST /api/v1/game/battle/match
   · 携带：用户段位、当前词汇等级
   · 服务端将用户加入 Redis 匹配队列

2. 匹配引擎（后台任务，每 2 秒扫描一次）
   · 按段位 ±1 级范围匹配
   · 15 秒内匹配成功 → 创建对战房间
   · 15-30 秒 → 扩大匹配范围
   · 30 秒超时 → 匹配 AI 对手

3. 匹配成功 → 双方收到 WebSocket 通知
   · 返回：room_id + 对手信息 + 题目列表

4. 对战进行中
   · 双方通过 WebSocket 实时同步答题状态
   · 服务端校验答案正确性（防作弊）
   · 实时广播双方 HP 变化

5. 对战结束
   · 服务端计算胜负 → 更新段位 → 发放奖励
   · 双方收到结算通知
   · 记录对战日志
```

---

## 四、数据库设计（Supabase/PostgreSQL）

### 4.1 核心表结构

```sql
-- 用户扩展信息（public.profiles，关联 auth.users）
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  locale TEXT DEFAULT 'vi',          -- 界面语言：vi/id/en
  military_rank TEXT DEFAULT 'recruit', -- 军衔
  pvp_tier TEXT DEFAULT 'bronze_3',   -- PvP 段位
  pvp_points INTEGER DEFAULT 0,       -- 战功点
  gold INTEGER DEFAULT 0,             -- 金币
  diamonds INTEGER DEFAULT 0,         -- 钻石
  hanyu_coins DECIMAL(10,2) DEFAULT 0, -- AI 代币
  streak_days INTEGER DEFAULT 0,      -- 连续打卡天数
  streak_freeze INTEGER DEFAULT 0,    -- Streak 保险卡数量
  total_words_learned INTEGER DEFAULT 0,
  total_levels_cleared INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free', -- free/premium
  subscription_expires_at TIMESTAMPTZ,
  referral_code TEXT UNIQUE,          -- 邀请码
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 游戏进度
CREATE TABLE public.level_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL,             -- 关卡标识（如 "daily_plain.food_3"）
  stars INTEGER DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  best_score INTEGER DEFAULT 0,
  best_time_seconds INTEGER,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, level_id)
);
ALTER TABLE public.level_progress ENABLE ROW LEVEL SECURITY;

-- 词汇库（用户已学词汇）
CREATE TABLE public.user_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,                 -- 汉字
  pinyin TEXT NOT NULL,               -- 拼音
  meaning_vi TEXT,                    -- 越南语释义
  meaning_id TEXT,                    -- 印尼语释义
  hsk_level INTEGER,                 -- HSK 级别
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  next_review_at TIMESTAMPTZ,        -- 间隔重复复习时间
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, word)
);
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;

-- PvP 对战记录
CREATE TABLE public.pvp_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES public.profiles(id),
  player2_id UUID REFERENCES public.profiles(id), -- NULL = AI 对手
  winner_id UUID REFERENCES public.profiles(id),
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  tier_at_battle TEXT,                -- 对战时的段位
  duration_seconds INTEGER,
  battle_data JSONB,                  -- 详细对战数据
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pvp_battles ENABLE ROW LEVEL SECURITY;

-- 皮肤/装饰所有权
CREATE TABLE public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,            -- skin/frame/title/pet/decoration
  item_id TEXT NOT NULL,              -- 物品标识
  equipped BOOLEAN DEFAULT false,     -- 是否装备中
  acquired_at TIMESTAMPTZ DEFAULT now(),
  acquired_from TEXT,                 -- shop/achievement/season/event
  UNIQUE(user_id, item_id)
);
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- 会员订阅记录
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,                 -- monthly/quarterly/yearly/lifetime
  status TEXT NOT NULL DEFAULT 'active', -- active/cancelled/expired
  payment_provider TEXT,              -- stripe/momo/midtrans
  provider_subscription_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- AI 功能使用记录（用于透明计费）
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,              -- chat/pronounce/writing
  tokens_used INTEGER,               -- LLM tokens
  api_cost DECIMAL(10,6),            -- 实际 API 成本
  coins_charged DECIMAL(10,2),       -- 扣除的 HanYu Coins
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 推荐/裂变追踪
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'registered',   -- registered/active/paid
  referred_paid_at TIMESTAMPTZ,
  referrer_rewarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referred_id)                 -- 每人只能被推荐一次
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 军团
CREATE TABLE public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  leader_id UUID NOT NULL REFERENCES public.profiles(id),
  description TEXT,
  member_count INTEGER DEFAULT 1,
  total_xp BIGINT DEFAULT 0,
  emblem TEXT,                        -- 军团徽章标识
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.guild_members (
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',         -- leader/officer/member
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
```

### 4.2 RLS 策略示例

```sql
-- profiles: 用户只能读自己和公开信息，只能改自己
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can read others public info"
  ON public.profiles FOR SELECT
  USING (true); -- 公开字段通过 View 控制

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- level_progress: 用户只能读写自己的进度
CREATE POLICY "Users own level progress"
  ON public.level_progress FOR ALL
  USING (auth.uid() = user_id);

-- user_inventory: 用户只能读自己的物品，写入由后端控制
CREATE POLICY "Users can read own inventory"
  ON public.user_inventory FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 五、Dify 集成方案

### 5.1 Dify 的角色定位

Dify 在本项目中承担两个核心角色：

```
角色一：内容生产工厂（离线/批量）
  → 生成关卡剧本、题目、过场动画脚本
  → 生成词汇解释和例句
  → 批量翻译（中文→越南语/印尼语）
  → 定时触发，生产完毕后入库

角色二：AI 功能编排（在线/实时）
  → AI 对话练习：编排 System Prompt + 对话管理
  → AI 作文批改：编排批改逻辑 + 结构化输出
  → AI 语法解释：编排多语言解释工作流
```

### 5.2 关键工作流设计

```
工作流 1：关卡内容生成
  触发：手动/定时
  流程：
    1. 输入节点：主题 + HSK 级别 + 目标词汇 + 语法点
    2. LLM 节点（Claude/GPT-4）：生成关卡剧本初稿
    3. LLM 节点（Claude/GPT-4）：生成题目库（JSON 格式）
    4. LLM 节点：生成过场动画对话脚本
    5. LLM 节点：翻译为越南语/印尼语
    6. HTTP 节点：调用 Azure TTS 生成配音
    7. 输出节点：结构化 JSON → 写入数据库/对象存储

工作流 2：AI 对话（实时）
  触发：用户调用 AI 对话功能
  流程：
    1. 输入：用户语音/文字 + 用户等级 + 对话历史
    2. System Prompt：
       "你是一个中文教师，根据用户的 HSK {level} 水平
        用简单的中文和用户对话。如果用户用 {locale} 提问，
        用 {locale} 解释，但始终鼓励用户用中文回答。
        纠正发音和语法错误时要友善。"
    3. LLM 节点：生成回复
    4. 输出：回复文本 + TTS 音频 URL

工作流 3：AI 作文批改（实时）
  触发：用户提交作文
  流程：
    1. 输入：用户作文 + HSK 级别
    2. LLM 节点：分析语法/用词/标点
    3. 结构化输出：
       {
         "score": 85,
         "corrections": [...],
         "suggestions": [...],
         "improved_version": "..."
       }
```

### 5.3 Dify 部署方案

```
部署：腾讯云新加坡节点上的 Docker 容器
  · Dify Community Edition（开源版本）
  · Docker Compose 部署
  · 与 FastAPI 同一 VPC 内网通信
  · Dify 自带的向量数据库存储词汇/语法知识库

资源需求：
  · 2vCPU + 4GB RAM（基本够用）
  · 离线内容生产时可临时扩容
```

---

## 六、服务器部署方案（腾讯云新加坡）

### 6.1 腾讯云选型理由

| 优势 | 说明 |
|------|------|
| **新加坡节点延迟** | 越南 ~25ms，印尼 ~40ms |
| **中国企业生态** | 中文文档、人民币计费、中国发票 |
| **成本优势** | 同配置比 AWS 便宜 20-30% |
| **Lighthouse 轻量服务器** | 适合初创阶段，配置简单 |
| **COS 对象存储** | 有新加坡节点，配合 CDN |
| **云函数 SCF** | 可用于定时任务和 Webhook |

### 6.2 初始部署配置

```
Phase 1 - MVP 阶段（月成本约 $150-200）：

腾讯云 CVM 标准型 S5（新加坡）
  · 规格：2vCPU + 4GB RAM + 60GB SSD
  · 用途：FastAPI + Dify + Nginx + Redis
  · 月费：约 $60-80

Supabase Cloud（新加坡区域）
  · Plan：Pro（$25/月）
  · 8GB RAM + 100GB 存储
  · 足够支撑初期 10K 用户

Cloudflare
  · Plan：Free（初期）→ Pro（$20/月）
  · CDN + DDoS 防护 + SSL

腾讯云 COS（对象存储）
  · 存储游戏素材（图片/音频/动画）
  · 新加坡节点
  · 按量计费，初期几乎免费

总计：约 $150-200/月
```

### 6.3 扩容路径

```
Phase 2 - 增长阶段（1万+ 用户，月成本约 $400-600）：

CVM 升级：4vCPU + 8GB RAM
  或分离：
  · CVM-1：FastAPI 应用服务器
  · CVM-2：Dify + Redis + 后台任务

Supabase Pro 继续使用（自动扩容）

新增：
  · 腾讯云 CLB（负载均衡）
  · 腾讯云 COS + CDN 加速

Phase 3 - 规模化（10万+ 用户，月成本约 $1,500-3,000）：

容器化部署：
  · 腾讯云 TKE（Kubernetes）
  · FastAPI 多副本
  · Dify 独立实例
  · Redis 集群

数据库：
  · Supabase Pro → 考虑自建 PostgreSQL on CVM
  · 读写分离
```

### 6.4 Docker 部署架构

```yaml
# docker-compose.yml 核心结构
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    # SSL 由 Cloudflare 处理，Nginx 做反向代理

  api:
    build: ./backend
    # FastAPI 应用
    environment:
      - SUPABASE_URL=...
      - SUPABASE_JWT_SECRET=...
      - DIFY_API_URL=http://dify-api:5001
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    # 缓存 + 排行榜 + PvP 匹配 + 会话

  dify-api:
    # Dify 社区版容器
    # 内容生成 + AI 对话编排

  dify-worker:
    # Dify 异步任务 Worker

  dify-db:
    image: postgres:16-alpine
    # Dify 自用数据库（与 Supabase 分离）
```

---

## 七、关卡数据格式规范

### 7.1 关卡定义（JSON Schema）

```json
{
  "level_id": "daily_plain.food.naicha_3",
  "region": "daily_plain",
  "area": "food",
  "name": {
    "zh": "奶茶店攻防战",
    "vi": "Trận chiến quán trà sữa",
    "id": "Pertempuran kedai bubble tea"
  },
  "hsk_level": 1,
  "type": "battle",
  "difficulty": 3,
  "prerequisites": ["daily_plain.food.naicha_2"],
  "target_vocab": ["奶茶", "大杯", "小杯", "加糖", "冰", "热", "一杯", "多少钱"],
  "target_grammar": ["想要...的句型", "还是...的选择问句"],
  "cutscene_before": {
    "script_url": "r2://cutscenes/food/naicha_3_intro.json",
    "audio_url": "r2://audio/cutscenes/food/naicha_3_intro.mp3",
    "duration_seconds": 35
  },
  "phases": [
    {
      "type": "vocab_collect",
      "time_limit_seconds": 15,
      "items": [
        {"image": "naicha.png", "correct": "奶茶", "distractors": ["咖啡", "果汁"]},
        {"image": "dabei.png", "correct": "大杯", "distractors": ["小杯", "中杯"]}
      ]
    },
    {
      "type": "sentence_assembly",
      "time_limit_seconds": 20,
      "sentences": [
        {
          "correct_order": ["我", "想", "要", "一杯", "冰", "奶茶"],
          "audio_url": "r2://audio/sentences/wo_xiang_yao_naicha.mp3"
        }
      ]
    },
    {
      "type": "boss_dialog",
      "boss_name": "奶茶店员",
      "questions": [
        {
          "audio_url": "r2://audio/boss/dabei_xiaobei.mp3",
          "text_zh": "大杯还是小杯？",
          "options": [
            {"text": "大杯", "correct": true},
            {"text": "热的", "correct": false}
          ]
        }
      ]
    }
  ],
  "rewards": {
    "xp": 30,
    "gold": 20,
    "title_unlock": "naicha_master"
  }
}
```

---

## 八、支付集成方案

### 8.1 支付渠道

| 地区 | 支付方式 | 集成方案 | 手续费 |
|------|---------|---------|--------|
| 越南 | MoMo | MoMo API 直连 | 1.5-2% |
| 越南 | ZaloPay | ZaloPay API | 1.5% |
| 越南 | 银行卡/ATM | VNPay | 1-1.5% |
| 印尼 | GoPay/OVO/Dana | Midtrans（聚合） | 2% |
| 印尼 | 银行转账 | Midtrans | 1% |
| 全球 | 信用卡 | Stripe | 2.9% + $0.30 |
| 全球 | Google Pay | Google Play Billing | 15%（<$1M） |
| 全球 | Apple Pay | Apple IAP | 15%（小型开发者） |

### 8.2 规避应用商店抽成策略

```
策略：Web 优先订阅

1. PWA 用户：直接网页支付（Stripe/本地支付），零商店抽成
2. Android App 用户：App 内引导到网页订阅页面
3. iOS App 用户：
   · 不在 App 内展示价格（Apple 政策）
   · 通过邮件/推送通知引导到网页订阅
   · App 内只展示"已是会员"的功能

实际预期：
  · 70-80% 用户通过 Web/PWA 订阅（零抽成）
  · 20-30% 用户通过应用商店订阅（15% 抽成）
  · 加权平均手续费：约 5-7%
```

---

## 九、监控与分析

```
监控栈：

应用监控：
  · Sentry（错误追踪，免费额度够用）
  · 腾讯云 CLS（日志服务）

性能监控：
  · 腾讯云云监控（服务器指标）
  · Cloudflare Analytics（CDN/安全指标）

业务分析：
  · PostHog（开源，自建）或 Mixpanel（免费额度）
  · 追踪：关卡通过率、PvP 参与率、付费转化漏斗
  · A/B 测试框架（PostHog 内置）

关键指标看板：
  · DAU/MAU/WAU
  · 关卡通过率（按关卡维度）
  · PvP 参与率和胜率分布
  · 付费转化漏斗（注册→试用→付费→续费）
  · AI 功能使用率和成本
  · 裂变系数（每用户带来的新用户数）
```

---

*本文档为 HanYu 技术架构方案。游戏设计详见 [01-game-design.md](01-game-design.md)，商业模式详见 [03-business-model.md](03-business-model.md)。*

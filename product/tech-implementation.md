# 技术实现方案详细文档

> 日期：2026-04-14

---

## 1. 系统架构总览

```
用户设备 (React Native App)
    |
    | HTTPS
    |
Cloudflare CDN (全球边缘节点)
    |
    |--- 静态资源 (课程图片/音频/视频) ---> Cloudflare R2
    |
    |--- API 请求
    |
Nginx (反向代理 + 负载均衡)
    |
    |--- /api/* ---> FastAPI 应用服务器集群
    |                   |
    |                   |--- Supabase PostgreSQL (主数据库)
    |                   |--- Redis (缓存 + 会话 + 排行榜)
    |                   |--- AI 服务层
    |                        |--- Azure Speech (语音识别 + 发音评估)
    |                        |--- OpenAI GPT-4o-mini (对话引擎)
    |                        |--- Azure TTS (语音合成)
    |
    |--- /realtime ---> Supabase Realtime (排行榜/消息)
```

---

## 2. 技术栈详细选型

### 2.1 前端（移动端）

| 技术 | 选择 | 版本 | 理由 |
|------|------|------|------|
| 框架 | React Native + Expo | SDK 52+ | 一套代码出 iOS/Android，Expo 简化构建 |
| 状态管理 | Zustand | 5.x | 轻量，比 Redux 简单 |
| 导航 | Expo Router | 4.x | 文件系统路由，开发效率高 |
| 网络请求 | Axios + React Query | - | 缓存 + 离线支持 |
| 音频 | expo-av | - | 录音和播放 |
| 动画 | react-native-reanimated | 3.x | 游戏和交互动画 |
| 手写 | react-native-canvas | - | 汉字手写练习 |
| 推送 | expo-notifications + FCM | - | 打卡提醒 |
| 支付 | react-native-iap + Stripe | - | 应用内购买 + 网页支付 |
| 国际化 | i18next | - | 越南语/印尼语/英语 |

### 2.2 后端

| 技术 | 选择 | 理由 |
|------|------|------|
| 框架 | FastAPI (Python 3.12+) | 异步高并发，AI 生态好 |
| ORM | SQLAlchemy 2.0 (async) | 异步查询，成熟稳定 |
| 缓存 | Redis 7.x | 排行榜、会话、限流 |
| 任务队列 | Celery + Redis | AI 异步处理、推送 |
| 认证 | Supabase Auth + JWT 本地验签 | 零信任，本地无状态验签 |
| API 文档 | FastAPI 自带 OpenAPI | 自动生成 |
| 日志 | structlog + Sentry | 结构化日志 + 错误追踪 |

### 2.3 数据库

| 技术 | 选择 | 理由 |
|------|------|------|
| 主数据库 | Supabase (PostgreSQL 15+) | Auth/Realtime/RLS/Storage 一体化 |
| 缓存层 | Redis | 热数据缓存、排行榜 |
| 搜索 | PostgreSQL FTS | 课程内容搜索，暂不需要 ES |
| 文件存储 | Cloudflare R2 | 音频/图片/视频，无出口费 |

### 2.4 AI 服务

| 功能 | 服务 | 接口 | 备选方案 |
|------|------|------|----------|
| 语音识别 | Azure Speech | REST API | Google STT / Whisper |
| 发音评估 | Azure Pronunciation Assessment | REST API | 自研（长期） |
| 对话生成 | OpenAI GPT-4o-mini | Chat Completions API | DeepSeek V3 / Claude Haiku |
| 语音合成 | Azure Neural TTS | REST API | CosyVoice（自建） |
| 手写识别 | Google ML Kit | 端侧 SDK | 自研 CNN 模型 |

### 2.5 基础设施

| 技术 | 选择 | 理由 |
|------|------|------|
| 云平台 | AWS (ap-southeast-1) | 新加坡节点，生态完善 |
| CDN | Cloudflare | 全球边缘，DDoS 防护 |
| 容器 | Docker + ECS | 弹性伸缩 |
| CI/CD | GitHub Actions | 免费额度够用 |
| 监控 | CloudWatch + Sentry | 基础监控 + 错误追踪 |
| 分析 | Mixpanel | 用户行为分析 |

---

## 3. 数据库 Schema 设计

### 3.1 核心表

```sql
-- 用户扩展信息（Supabase Auth 管理基础认证）
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    native_language TEXT DEFAULT 'vi',  -- vi / id / en
    chinese_level TEXT DEFAULT 'beginner',  -- beginner / elementary / intermediate / advanced
    streak_days INTEGER DEFAULT 0,
    streak_last_date DATE,
    total_xp INTEGER DEFAULT 0,
    league TEXT DEFAULT 'bronze',  -- bronze / silver / gold / diamond
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMPTZ,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    referral_count INTEGER DEFAULT 0,
    referral_paid_count INTEGER DEFAULT 0,
    ambassador_level TEXT DEFAULT 'none',  -- none / partner / expert / ambassador / city
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课程体系
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title JSONB NOT NULL,  -- {"zh": "拼音入门", "vi": "Nhập môn Pinyin", "id": "Pengenalan Pinyin"}
    description JSONB,
    hsk_level INTEGER,  -- 1-6, NULL for non-HSK
    sort_order INTEGER,
    is_free BOOLEAN DEFAULT FALSE,
    total_lessons INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课程单元
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title JSONB NOT NULL,
    lesson_type TEXT NOT NULL,  -- vocabulary / grammar / listening / speaking / reading / game
    content JSONB NOT NULL,  -- 课程内容的 JSON 结构
    sort_order INTEGER,
    xp_reward INTEGER DEFAULT 10,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户学习进度
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'locked',  -- locked / available / in_progress / completed
    score INTEGER,  -- 0-100
    xp_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0,
    UNIQUE(user_id, lesson_id)
);

-- 词汇库
CREATE TABLE public.vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chinese TEXT NOT NULL,  -- 汉字
    pinyin TEXT NOT NULL,  -- 拼音
    meaning JSONB NOT NULL,  -- {"vi": "xin chào", "id": "halo", "en": "hello"}
    hsk_level INTEGER,
    audio_url TEXT,  -- TTS 预生成的音频
    stroke_data JSONB,  -- 笔画数据（用于手写练习）
    example_sentences JSONB,  -- 例句列表
    tags TEXT[],  -- 标签：日常/商务/旅游等
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户词汇学习记录（SRS 间隔重复）
CREATE TABLE public.user_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vocabulary_id UUID REFERENCES public.vocabulary(id) ON DELETE CASCADE,
    familiarity INTEGER DEFAULT 0,  -- 0-5, SRS 等级
    next_review_at TIMESTAMPTZ,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    UNIQUE(user_id, vocabulary_id)
);

-- AI 对话记录
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scenario TEXT,  -- 场景标签：free_chat / restaurant / interview 等
    messages JSONB NOT NULL,  -- 对话历史
    duration_seconds INTEGER,
    ai_model TEXT DEFAULT 'gpt-4o-mini',
    token_usage JSONB,  -- {input: N, output: N}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 发音评估记录
CREATE TABLE public.pronunciation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    text_chinese TEXT NOT NULL,  -- 用户朗读的文本
    audio_url TEXT,  -- 用户录音
    accuracy_score FLOAT,  -- 准确度 0-100
    fluency_score FLOAT,  -- 流利度 0-100
    completeness_score FLOAT,  -- 完整度 0-100
    pronunciation_score FLOAT,  -- 总评分 0-100
    tone_scores JSONB,  -- 每个字的声调评分
    feedback JSONB,  -- AI 生成的详细反馈
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 推荐关系追踪
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered',  -- registered / active / paid / confirmed
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,  -- 完成 3 天学习
    paid_at TIMESTAMPTZ,  -- 首次付费
    confirmed_at TIMESTAMPTZ,  -- 30 天后确认
    reward_given BOOLEAN DEFAULT FALSE,
    UNIQUE(referrer_id, referred_id)
);

-- 推广大使收益
CREATE TABLE public.ambassador_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambassador_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES public.referrals(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',  -- pending / available / withdrawn
    available_at TIMESTAMPTZ,  -- 30 天冷却后
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 排行榜快照（每周刷新）
CREATE TABLE public.leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    league TEXT NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    rank INTEGER,
    promoted BOOLEAN DEFAULT FALSE,
    demoted BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, week_start)
);

-- 订阅记录
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,  -- monthly / quarterly / yearly / lifetime
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,  -- stripe / momo / gopay / appstore / playstore
    status TEXT DEFAULT 'active',  -- active / cancelled / expired
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 RLS 策略

```sql
-- 所有表启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronunciation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 课程和词汇对所有认证用户可读
CREATE POLICY "Authenticated users can view courses"
    ON public.courses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view lessons"
    ON public.lessons FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view vocabulary"
    ON public.vocabulary FOR SELECT
    TO authenticated
    USING (true);

-- 用户学习数据：仅限本人
CREATE POLICY "Users manage own progress"
    ON public.user_progress FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own vocabulary"
    ON public.user_vocabulary FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own conversations"
    ON public.ai_conversations FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own pronunciation"
    ON public.pronunciation_records FOR ALL
    USING (auth.uid() = user_id);
```

---

## 4. AI 服务集成详细方案

### 4.1 AI 对话服务

```python
# ai_chat_service.py 伪代码

SYSTEM_PROMPT_TEMPLATE = """
你是一个友好的中文老师，名字叫小明。你正在和一个{native_language}学生练习中文对话。

学生的中文水平：{level}
当前场景：{scenario}

规则：
1. 用简单的中文和学生对话，符合他的水平
2. 如果学生说错了，温和地纠正
3. 每次回复不超过 2-3 句话
4. 关键词汇用 {native_language} 在括号里解释
5. 鼓励学生多说
6. 如果学生用 {native_language} 说话，引导他用中文表达
"""

async def chat_with_ai(
    user_id: str,
    user_message: str,
    scenario: str = "free_chat",
    conversation_history: list = None
) -> dict:
    # 1. 检查用户配额（免费用户每天 3 次）
    # 2. 获取用户 profile（语言、等级）
    # 3. 构建 system prompt
    # 4. 调用 OpenAI API
    # 5. 保存对话记录
    # 6. 返回回复 + token 使用量
    pass
```

### 4.2 发音评估服务

```python
# pronunciation_service.py 伪代码

async def assess_pronunciation(
    user_id: str,
    audio_data: bytes,
    reference_text: str
) -> dict:
    # 1. 检查用户配额
    # 2. 调用 Azure Pronunciation Assessment API
    #    - 传入音频 + 参考文本
    #    - 获取：准确度、流利度、完整度、韵律评分
    #    - 获取每个字/音节的声调评分
    # 3. 用 GPT-4o-mini 生成个性化反馈
    #    - 哪些字发音有问题
    #    - 声调错误在哪里
    #    - 改进建议
    # 4. 保存记录
    # 5. 返回评分 + 反馈
    pass
```

### 4.3 AI 配额管理

```python
# quota_manager.py 伪代码

FREE_USER_LIMITS = {
    "ai_chat": 3,          # 每天 3 次 AI 对话
    "pronunciation": 10,    # 每天 10 次发音评分
    "writing_review": 0,    # 免费用户无作文批改
}

PREMIUM_USER_LIMITS = {
    "ai_chat": -1,          # 无限
    "pronunciation": -1,    # 无限
    "writing_review": 10,   # 每天 10 次
}

async def check_and_consume_quota(
    user_id: str,
    feature: str
) -> bool:
    # 1. 判断用户是否 Premium
    # 2. 查询 Redis 中今日使用次数
    # 3. 对比限额
    # 4. 如果未超限，Redis INCR
    # 5. 返回是否允许
    pass
```

---

## 5. 服务器配置与成本

### 5.1 初始配置（0-10K 用户）

| 资源 | 规格 | 月成本 |
|------|------|--------|
| API 服务器 | 1x t3.medium (2vCPU, 4GB) | $30 |
| Supabase | Pro Plan | $25 |
| Redis | ElastiCache t3.micro | $13 |
| Cloudflare | Pro Plan | $20 |
| Cloudflare R2 | 10GB 存储 | $2 |
| 域名 | .app 域名 | $1 |
| SSL | Cloudflare 免费 | $0 |
| **总计** | | **~$91/月** |

### 5.2 增长配置（10K-100K 用户）

| 资源 | 规格 | 月成本 |
|------|------|--------|
| API 服务器 | 2x t3.large (2vCPU, 8GB) + ALB | $140 |
| Supabase | Pro Plan (扩容) | $25-75 |
| Redis | ElastiCache t3.small | $25 |
| Cloudflare | Pro Plan | $20 |
| Cloudflare R2 | 100GB 存储 | $15 |
| Celery Workers | 1x t3.medium | $30 |
| **总计** | | **~$280/月** |

### 5.3 规模配置（100K+ 用户）

| 资源 | 规格 | 月成本 |
|------|------|--------|
| API 服务器 | ECS Fargate 自动伸缩 | $500-1000 |
| Supabase | Enterprise 或自建 PG | $200+ |
| Redis | ElastiCache m5.large | $100 |
| Cloudflare | Business Plan | $200 |
| Cloudflare R2 | 1TB+ | $50 |
| Celery Workers | 2-4x | $100 |
| **总计** | | **~$1500/月** |

---

## 6. 支付集成方案

### 6.1 支付架构

```
用户发起支付
    |
    |--- App Store / Play Store (应用内购买)
    |       |
    |       |--- react-native-iap 库处理
    |       |--- 服务端验证收据
    |       |--- 手续费：15-30%
    |
    |--- 网页支付（绕过商店抽成）
            |
            |--- Stripe Checkout (国际信用卡)
            |       手续费：2.9% + $0.30
            |
            |--- MoMo (越南)
            |       通过 Stripe 或直接 API
            |       手续费：1.5-2%
            |
            |--- Midtrans (印尼)
                    支持 GoPay / OVO / Dana / 银行转账
                    手续费：1-2%
```

### 6.2 绕过商店抽成策略

- App 内不直接展示付费按钮（遵守商店规则）
- 通过"账户管理"网页入口引导用户到网页端支付
- 网页端提供更优惠的价格（比应用内购便宜 10-15%）
- 利用 Google Play / Apple 小型开发者 15% 费率（年收入 <$1M）

---

## 7. MVP 开发时间估算

### 7.1 基于创始人自己开发 + AI 辅助

| 模块 | 工时 | 说明 |
|------|------|------|
| 项目初始化 + 架构 | 3 天 | Expo + FastAPI + Supabase |
| 用户系统 | 3 天 | 注册/登录/Profile/Supabase Auth |
| 拼音教学模块 | 5 天 | 交互式拼音课程 |
| HSK 1 课程 | 7 天 | 词汇 + 句型 + 练习 |
| 汉字手写练习 | 3 天 | Canvas + 笔画判断 |
| AI 对话集成 | 3 天 | OpenAI API + 配额管理 |
| 基础发音评分 | 3 天 | Azure Speech API |
| 汉字消消乐游戏 | 3 天 | 游戏逻辑 + 动画 |
| 声调过山车游戏 | 3 天 | 游戏逻辑 + 动画 |
| 打卡 + 排行榜 | 3 天 | Redis + Realtime |
| 推荐裂变系统 | 5 天 | 邀请码 + 追踪 + 奖励 |
| 越南语界面 | 3 天 | i18n 翻译 |
| 支付集成 | 5 天 | Stripe + IAP |
| 测试 + 修 Bug | 7 天 | 端到端测试 |
| App Store 上架 | 3 天 | 截图 + 描述 + 审核 |
| **总计** | **~60 天** | **约 3 个月（按每天 4-6 小时）** |

---

*本文档为技术实现的详细参考，实际开发中需根据技术栈版本更新和 API 变化做相应调整。*

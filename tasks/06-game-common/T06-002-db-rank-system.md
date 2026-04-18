# T06-002: 数据库 Schema — 段位系统

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 3+

## 需求摘要

创建段位系统的完整数据库结构，包括 `user_ranks`（用户段位表）、`rank_history`（段位变更历史）、`rank_config`（段位配置表）、`seasons`（赛季表）。段位系统采用 7 大段位 × 星数制，12 款游戏共享统一段位。支持赛季软重置机制。新用户初始为青铜 III · 1 星。

## 相关上下文

- 产品需求: `product/apps/05-game-common/05-rank-system.md` — 段位层级定义、胜负规则、晋级/掉段规则、保护机制、赛季机制、王者特殊规则（**核心依据**）
- 产品需求: `product/00-product-overview.md` §五.4 — 游戏段位系统规则
- 设计规范: `grules/05-coding-standards.md` §四 — 数据库规范
- 关联任务: T06-001 → 本任务 → T06-006, T06-007

## 技术方案

### 数据库设计

#### 1. `rank_config` — 段位配置表（静态配置）

```sql
CREATE TABLE rank_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier VARCHAR(20) NOT NULL,                       -- 大段: bronze/silver/gold/platinum/diamond/star/king
  tier_name_zh VARCHAR(10) NOT NULL,               -- 中文名: 青铜/白银/黄金/铂金/钻石/星耀/王者
  tier_name_en VARCHAR(20) NOT NULL,               -- 英文名: Bronze/Silver/Gold/Platinum/Diamond/Star/King
  tier_order INTEGER NOT NULL,                      -- 大段排序: 1=bronze, ..., 7=king
  sub_tier VARCHAR(10),                            -- 小段: V/IV/III/II/I（王者为 NULL）
  sub_tier_order INTEGER,                          -- 小段排序: 1=V, 2=IV, ..., 5=I
  stars_required INTEGER NOT NULL,                 -- 该小段需要的星数
  cumulative_stars_start INTEGER NOT NULL,          -- 该小段累计星数起始值
  cumulative_stars_end INTEGER NOT NULL,            -- 该小段累计星数结束值
  icon_color VARCHAR(50),                          -- 图标主色调描述
  sort_order INTEGER NOT NULL,                     -- 全局排序（用于匹配范围计算）
  
  UNIQUE(tier, sub_tier)
);

CREATE INDEX idx_rank_config_sort ON rank_config(sort_order);
CREATE INDEX idx_rank_config_cumulative ON rank_config(cumulative_stars_start, cumulative_stars_end);
```

#### 2. `seasons` — 赛季表

```sql
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL UNIQUE,           -- 赛季序号: 1, 2, 3...
  season_name VARCHAR(20) NOT NULL,                -- 赛季名: S1, S2, S3...
  start_date TIMESTAMPTZ NOT NULL,                 -- 开始时间
  end_date TIMESTAMPTZ NOT NULL,                   -- 结束时间
  is_active BOOLEAN NOT NULL DEFAULT false,        -- 当前是否活跃赛季
  rewards_distributed BOOLEAN NOT NULL DEFAULT false, -- 奖励是否已发放
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CHECK (end_date > start_date)
);

CREATE INDEX idx_seasons_active ON seasons(is_active) WHERE is_active = true;
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);
```

#### 3. `user_ranks` — 用户段位表

```sql
CREATE TABLE user_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  total_stars INTEGER NOT NULL DEFAULT 1,          -- 累计总星数（最低 1）
  current_tier VARCHAR(20) NOT NULL DEFAULT 'bronze',
  current_sub_tier VARCHAR(10) DEFAULT 'III',
  current_stars_in_sub INTEGER NOT NULL DEFAULT 1, -- 当前小段已获星数
  king_points INTEGER NOT NULL DEFAULT 0,          -- 王者积分（仅王者段使用）
  king_rank INTEGER,                               -- 王者排名（仅王者段使用）
  season_id UUID REFERENCES seasons(id),           -- 当前赛季
  total_pk_wins INTEGER NOT NULL DEFAULT 0,        -- 总 PK 胜场
  total_pk_losses INTEGER NOT NULL DEFAULT 0,      -- 总 PK 负场
  total_pk_games INTEGER NOT NULL DEFAULT 0,       -- 总 PK 对局数
  current_win_streak INTEGER NOT NULL DEFAULT 0,   -- 当前连胜
  max_win_streak INTEGER NOT NULL DEFAULT 0,       -- 历史最高连胜
  newbie_protection_remaining INTEGER NOT NULL DEFAULT 10, -- 新手保护剩余局数
  promotion_protection_remaining INTEGER NOT NULL DEFAULT 0, -- 晋级保护剩余局数
  season_escape_count INTEGER NOT NULL DEFAULT 0,  -- 本赛季逃跑次数
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CHECK (total_stars >= 1),
  CHECK (current_win_streak >= 0),
  CHECK (newbie_protection_remaining >= 0)
);

CREATE INDEX idx_user_ranks_tier ON user_ranks(current_tier, current_sub_tier);
CREATE INDEX idx_user_ranks_total_stars ON user_ranks(total_stars DESC);
CREATE INDEX idx_user_ranks_king_points ON user_ranks(king_points DESC) WHERE current_tier = 'king';
CREATE INDEX idx_user_ranks_season ON user_ranks(season_id);
```

#### 4. `rank_history` — 段位变更历史

```sql
CREATE TABLE rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID REFERENCES game_sessions(id),    -- 触发变更的游戏会话
  season_id UUID REFERENCES seasons(id),
  change_type VARCHAR(20) NOT NULL,                -- star_gain / star_loss / promotion / demotion / season_reset / king_points
  before_tier VARCHAR(20) NOT NULL,
  before_sub_tier VARCHAR(10),
  before_stars INTEGER NOT NULL,
  before_total_stars INTEGER NOT NULL,
  after_tier VARCHAR(20) NOT NULL,
  after_sub_tier VARCHAR(10),
  after_stars INTEGER NOT NULL,
  after_total_stars INTEGER NOT NULL,
  king_points_change INTEGER DEFAULT 0,            -- 王者积分变化
  reason VARCHAR(100),                             -- 变更原因描述
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rank_history_user ON rank_history(user_id, created_at DESC);
CREATE INDEX idx_rank_history_session ON rank_history(session_id);
CREATE INDEX idx_rank_history_season ON rank_history(season_id);
```

#### 5. 段位配置初始数据

```sql
-- 青铜（Bronze）: 3 小段，每段 3 星
INSERT INTO rank_config (tier, tier_name_zh, tier_name_en, tier_order, sub_tier, sub_tier_order, stars_required, cumulative_stars_start, cumulative_stars_end, icon_color, sort_order) VALUES
('bronze', '青铜', 'Bronze', 1, 'III', 3, 3, 1, 3, '铜褐色', 1),
('bronze', '青铜', 'Bronze', 1, 'II', 2, 3, 4, 6, '铜褐色', 2),
('bronze', '青铜', 'Bronze', 1, 'I', 1, 3, 7, 9, '铜褐色', 3),
-- 白银（Silver）: 3 小段，每段 3 星
('silver', '白银', 'Silver', 2, 'III', 3, 3, 10, 12, '银灰色', 4),
('silver', '白银', 'Silver', 2, 'II', 2, 3, 13, 15, '银灰色', 5),
('silver', '白银', 'Silver', 2, 'I', 1, 3, 16, 18, '银灰色', 6),
-- 黄金（Gold）: 4 小段，每段 3 星
('gold', '黄金', 'Gold', 3, 'IV', 4, 3, 19, 21, '金黄色', 7),
('gold', '黄金', 'Gold', 3, 'III', 3, 3, 22, 24, '金黄色', 8),
('gold', '黄金', 'Gold', 3, 'II', 2, 3, 25, 27, '金黄色', 9),
('gold', '黄金', 'Gold', 3, 'I', 1, 3, 28, 30, '金黄色', 10),
-- 铂金（Platinum）: 4 小段，每段 4 星
('platinum', '铂金', 'Platinum', 4, 'IV', 4, 4, 31, 34, '铂白色', 11),
('platinum', '铂金', 'Platinum', 4, 'III', 3, 4, 35, 38, '铂白色', 12),
('platinum', '铂金', 'Platinum', 4, 'II', 2, 4, 39, 42, '铂白色', 13),
('platinum', '铂金', 'Platinum', 4, 'I', 1, 4, 43, 46, '铂白色', 14),
-- 钻石（Diamond）: 5 小段，每段 4 星
('diamond', '钻石', 'Diamond', 5, 'V', 5, 4, 47, 50, '冰蓝色', 15),
('diamond', '钻石', 'Diamond', 5, 'IV', 4, 4, 51, 54, '冰蓝色', 16),
('diamond', '钻石', 'Diamond', 5, 'III', 3, 4, 55, 58, '冰蓝色', 17),
('diamond', '钻石', 'Diamond', 5, 'II', 2, 4, 59, 62, '冰蓝色', 18),
('diamond', '钻石', 'Diamond', 5, 'I', 1, 4, 63, 66, '冰蓝色', 19),
-- 星耀（Star）: 5 小段，每段 5 星
('star', '星耀', 'Star', 6, 'V', 5, 5, 67, 71, '紫金色', 20),
('star', '星耀', 'Star', 6, 'IV', 4, 5, 72, 76, '紫金色', 21),
('star', '星耀', 'Star', 6, 'III', 3, 5, 77, 81, '紫金色', 22),
('star', '星耀', 'Star', 6, 'II', 2, 5, 82, 86, '紫金色', 23),
('star', '星耀', 'Star', 6, 'I', 1, 5, 87, 91, '紫金色', 24),
-- 王者（King）: 无小段
('king', '王者', 'King', 7, NULL, NULL, 0, 92, 9999, '金红色', 25);
```

#### 6. 赛季初始数据

```sql
-- 首赛季（产品上线所在季度）
INSERT INTO seasons (season_number, season_name, start_date, end_date, is_active) VALUES
(1, 'S1', '2026-07-01 00:00:00+07', '2026-09-30 23:59:59+07', true);
```

#### 7. RLS 策略

```sql
-- rank_config 表：所有人可读
ALTER TABLE rank_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rank_config_select_all" ON rank_config FOR SELECT USING (true);

-- seasons 表：所有人可读
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_select_all" ON seasons FOR SELECT USING (true);

-- user_ranks 表：用户可读自己的，排行榜查询需要服务端 API
ALTER TABLE user_ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_ranks_select_own" ON user_ranks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_ranks_select_leaderboard" ON user_ranks FOR SELECT USING (true);

-- rank_history 表：用户可读自己的
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rank_history_select_own" ON rank_history FOR SELECT USING (user_id = auth.uid());
```

#### 8. PostgreSQL 函数 — 根据总星数计算段位

```sql
CREATE OR REPLACE FUNCTION calculate_rank_from_stars(p_total_stars INTEGER)
RETURNS TABLE(tier VARCHAR, sub_tier VARCHAR, stars_in_sub INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT rc.tier, rc.sub_tier, 
         (p_total_stars - rc.cumulative_stars_start + 1)::INTEGER AS stars_in_sub
  FROM rank_config rc
  WHERE p_total_stars >= rc.cumulative_stars_start 
    AND p_total_stars <= rc.cumulative_stars_end
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Migration 文件

```
supabase/migrations/
└── 20260418100100_rank_system_tables.sql
```

## 范围（做什么）

- 创建 `rank_config` 段位配置表及 25 条初始数据（24 个小段 + 1 王者）
- 创建 `seasons` 赛季表及首赛季数据
- 创建 `user_ranks` 用户段位表
- 创建 `rank_history` 段位变更历史表
- 创建 `calculate_rank_from_stars` PostgreSQL 函数
- 所有表开启 RLS
- 生成 Migration SQL 文件

## 边界（不做什么）

- 不编写段位变更业务逻辑（T06-006 后端 Service 负责）
- 不编写赛季重置逻辑（T06-007 负责）
- 不涉及前端展示
- 不创建排行榜视图（T06-007 负责）

## 涉及文件

- 新建: `supabase/migrations/20260418100100_rank_system_tables.sql`
- 不动: `supabase/migrations/20260418100000_game_base_tables.sql`

## 依赖

- 前置: T06-001（`game_sessions` 表存在，外键引用）
- 后续: T06-006（游戏会话与结算）, T06-007（段位与排行榜 API）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN Migration 已执行 WHEN 查询 `rank_config` THEN 返回 25 条记录，累计星数连续无间断（1-3, 4-6, ..., 87-91, 92-9999）
2. GIVEN 段位配置已写入 WHEN 调用 `calculate_rank_from_stars(1)` THEN 返回 (bronze, III, 1)
3. GIVEN 段位配置已写入 WHEN 调用 `calculate_rank_from_stars(47)` THEN 返回 (diamond, V, 1)
4. GIVEN 段位配置已写入 WHEN 调用 `calculate_rank_from_stars(91)` THEN 返回 (star, I, 5)
5. GIVEN `user_ranks` 表已创建 WHEN 新用户注册后插入默认记录 THEN total_stars=1, current_tier='bronze', current_sub_tier='III', newbie_protection_remaining=10
6. GIVEN `seasons` 表已创建 WHEN 查询 `is_active = true` THEN 返回当前赛季 S1，日期范围正确
7. GIVEN RLS 已启用 WHEN 用户 A 查询 `rank_history` THEN 仅返回 user_id = A 的记录

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 执行 T06-001 + T06-002 的 Migration SQL
4. 验证 `rank_config` 数据完整性：25 行，星数范围连续
5. 验证 `calculate_rank_from_stars` 函数正确性：多个边界值测试
6. 验证 RLS 策略
7. 验证 `seasons` 首赛季数据

### 测试通过标准

- [ ] Docker 构建成功，所有容器 Running
- [ ] 4 张表全部创建成功
- [ ] 25 条段位配置数据完整
- [ ] PostgreSQL 函数计算正确
- [ ] 赛季数据正确
- [ ] RLS 策略验证通过
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-002-db-rank-system.md`

## 自检重点

- [ ] 段位配置数据与 PRD 完全一致（星数、小段数量）
- [ ] 累计星数范围无间隙、无重叠
- [ ] 王者段特殊处理（无小段、积分制）
- [ ] 赛季日期使用 UTC+7 时区
- [ ] `user_ranks` 默认值正确（青铜 III 1 星）
- [ ] 新手保护默认 10 局

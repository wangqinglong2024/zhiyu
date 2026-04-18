# T06-001: 数据库 Schema — 游戏基础

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 5+

## 需求摘要

创建游戏系统的核心数据库表结构，包括 `games`（12 款游戏配置表）、`game_sessions`（游戏会话记录表）、`game_results`（游戏结果详情表）。每张表必须开启 RLS（Row Level Security），并按照 `coding-standards.md` §四 规范建表。此任务是整个游戏模块的数据基石，后续所有游戏相关任务均依赖此表结构。

## 相关上下文

- 产品需求: `product/apps/05-game-common/00-index.md` — 游戏访问规则、共享段位、MVP 范围
- 产品需求: `product/apps/05-game-common/04-settlement.md` §六 — 数据流向（game_results 字段定义）
- 产品需求: `product/apps/05-game-common/02-mode-select.md` §三 — 游戏模式（单人/1v1/多人）、各游戏子模式
- 产品需求: `product/apps/05-game-common/08-hud-landscape.md` §十二 — 逃跑记录
- 设计规范: `grules/05-coding-standards.md` §四 — 数据库命名、字段规范
- 环境配置: `grules/env.md` — Schema 隔离策略
- 游戏总览: `game/00-index.md` — 12 款游戏列表、通用规则、防作弊
- 关联任务: T02-014 (全局框架数据库完成) → 本任务 → T06-002, T06-003, T06-004, T06-005, T06-006

## 技术方案

### 数据库设计

#### 1. `games` — 游戏配置表

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code VARCHAR(10) NOT NULL UNIQUE,          -- 游戏编号: G1, G2, ..., G12
  name_zh VARCHAR(50) NOT NULL,                    -- 中文名: 汉字切切切
  name_en VARCHAR(50) NOT NULL,                    -- 英文名: Hanzi Slash
  name_vi VARCHAR(50),                             -- 越南语名
  description_zh TEXT,                             -- 中文描述
  description_en TEXT,                             -- 英文描述
  description_vi TEXT,                             -- 越南语描述
  level_id INTEGER NOT NULL,                       -- 对应课程 Level (1-12)
  cover_image_url TEXT,                            -- 封面图 URL
  cover_style VARCHAR(100),                        -- 封面风格描述
  game_type VARCHAR(20) NOT NULL DEFAULT 'puzzle', -- 游戏类型: puzzle/match/chain/quiz/debate/rpg
  min_players INTEGER NOT NULL DEFAULT 1,          -- 最少玩家数
  max_players INTEGER NOT NULL DEFAULT 4,          -- 最多玩家数
  supports_1v1 BOOLEAN NOT NULL DEFAULT true,      -- 是否支持 1v1
  supports_multi BOOLEAN NOT NULL DEFAULT true,    -- 是否支持多人
  multi_player_range VARCHAR(20),                  -- 多人模式人数范围描述: "2-4人"
  sub_modes JSONB NOT NULL DEFAULT '[]',           -- 单人子模式配置 [{name_zh, name_en, description_zh, description_en}]
  priority VARCHAR(5) NOT NULL DEFAULT 'P0',       -- 优先级: P0/P1/P2/P3
  is_active BOOLEAN NOT NULL DEFAULT true,         -- 是否上线
  sort_order INTEGER NOT NULL DEFAULT 0,           -- 排序权重
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_games_game_code ON games(game_code);
CREATE INDEX idx_games_is_active ON games(is_active);
CREATE INDEX idx_games_sort_order ON games(sort_order);
```

#### 2. `game_sessions` — 游戏会话表

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  mode VARCHAR(20) NOT NULL,                       -- 模式: solo_classic / solo_timed / solo_endless / pk_1v1 / pk_multi
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',   -- 状态: waiting / matched / playing / finished / cancelled / timeout
  host_user_id UUID NOT NULL REFERENCES auth.users(id),
  ai_match BOOLEAN NOT NULL DEFAULT false,         -- 是否 AI 对战
  ai_difficulty VARCHAR(10),                       -- AI 难度: easy/medium/hard
  max_players INTEGER NOT NULL DEFAULT 2,          -- 本局最大人数
  current_players INTEGER NOT NULL DEFAULT 1,      -- 当前已加入人数
  started_at TIMESTAMPTZ,                          -- 实际开始时间
  ended_at TIMESTAMPTZ,                            -- 实际结束时间
  duration_seconds INTEGER,                        -- 游戏时长（秒）
  season_id UUID,                                  -- 所属赛季（关联 T06-002 的 seasons 表）
  metadata JSONB DEFAULT '{}',                     -- 额外游戏数据（题目集合等）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_host_user ON game_sessions(host_user_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_mode ON game_sessions(mode);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at DESC);
```

#### 3. `game_results` — 游戏结果表

```sql
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id UUID NOT NULL REFERENCES games(id),
  mode VARCHAR(20) NOT NULL,                       -- 冗余存储模式方便查询
  score INTEGER NOT NULL DEFAULT 0,                -- 得分
  rank_position INTEGER,                           -- 多人模式中的排名（1=冠军）
  is_winner BOOLEAN NOT NULL DEFAULT false,        -- 是否胜利
  is_escape BOOLEAN NOT NULL DEFAULT false,        -- 是否逃跑退出
  is_ai_match BOOLEAN NOT NULL DEFAULT false,      -- 是否 AI 对战
  star_change INTEGER NOT NULL DEFAULT 0,          -- 星数变化: +1, -1, 0
  before_total_stars INTEGER,                      -- 对局前总星数
  after_total_stars INTEGER,                       -- 对局后总星数
  before_rank_tier VARCHAR(30),                    -- 对局前段位: "黄金 II"
  after_rank_tier VARCHAR(30),                     -- 对局后段位
  is_promotion BOOLEAN NOT NULL DEFAULT false,     -- 是否发生晋级（大段）
  is_demotion BOOLEAN NOT NULL DEFAULT false,      -- 是否发生掉段（大段）
  coin_reward INTEGER NOT NULL DEFAULT 0,          -- 知语币奖励
  knowledge_points JSONB DEFAULT '[]',             -- 知识点回顾 [{point, correct, detail}]
  duration_seconds INTEGER,                        -- 个人游玩时长
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_game_results_session_id ON game_results(session_id);
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_game_id ON game_results(game_id);
CREATE INDEX idx_game_results_user_game ON game_results(user_id, game_id);
CREATE INDEX idx_game_results_created_at ON game_results(created_at DESC);

-- 唯一约束：一个会话中一个用户只有一条结果
CREATE UNIQUE INDEX idx_game_results_session_user ON game_results(session_id, user_id);
```

#### 4. `game_session_players` — 游戏会话玩家表

```sql
CREATE TABLE game_session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_ready BOOLEAN NOT NULL DEFAULT false,
  is_ai BOOLEAN NOT NULL DEFAULT false,            -- 是否 AI 玩家
  connection_status VARCHAR(20) NOT NULL DEFAULT 'connected', -- connected / disconnected / reconnecting
  
  UNIQUE(session_id, user_id)
);

CREATE INDEX idx_game_session_players_session ON game_session_players(session_id);
CREATE INDEX idx_game_session_players_user ON game_session_players(user_id);
```

#### 5. `user_escape_records` — 逃跑记录表

```sql
CREATE TABLE user_escape_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID NOT NULL REFERENCES game_sessions(id),
  season_id UUID,                                  -- 所属赛季
  escaped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_escape_records_user_season ON user_escape_records(user_id, season_id);
```

#### 6. RLS 策略

```sql
-- games 表：所有登录用户可读
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_select_all" ON games FOR SELECT USING (true);
CREATE POLICY "games_manage_admin" ON games FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- game_sessions 表：用户可读自己参与的会话
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON game_sessions FOR SELECT USING (
  host_user_id = auth.uid() OR
  id IN (SELECT session_id FROM game_session_players WHERE user_id = auth.uid())
);
CREATE POLICY "sessions_insert_auth" ON game_sessions FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- game_results 表：用户可读自己的结果
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "results_select_own" ON game_results FOR SELECT USING (
  user_id = auth.uid()
);

-- game_session_players 表
ALTER TABLE game_session_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_players_select" ON game_session_players FOR SELECT USING (
  user_id = auth.uid() OR
  session_id IN (SELECT id FROM game_sessions WHERE host_user_id = auth.uid())
);

-- user_escape_records 表
ALTER TABLE user_escape_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escape_select_own" ON user_escape_records FOR SELECT USING (
  user_id = auth.uid()
);
```

#### 7. 初始数据 — 12 款游戏

```sql
INSERT INTO games (game_code, name_zh, name_en, level_id, min_players, max_players, supports_1v1, supports_multi, multi_player_range, priority, sort_order, sub_modes) VALUES
('G1', '汉字切切切', 'Hanzi Slash', 1, 1, 4, true, true, '2-4人', 'P0', 1,
 '[{"name_zh":"经典","name_en":"Classic","desc_zh":"无尽挑战个人最高分"},{"name_zh":"限时","name_en":"Timed","desc_zh":"60秒切最多汉字"}]'),
('G2', '拼音泡泡龙', 'Pinyin Bubble', 2, 1, 4, true, true, '4人', 'P0', 2,
 '[{"name_zh":"生存","name_en":"Survival","desc_zh":"泡泡下降坚持最久"},{"name_zh":"清屏","name_en":"Clear Screen","desc_zh":"逐屏消除无限循环"}]'),
('G3', '词语消消乐', 'Word Match', 3, 1, 4, true, true, '4人', 'P1', 3,
 '[{"name_zh":"无尽","name_en":"Endless","desc_zh":"无限消除最高分"},{"name_zh":"限步","name_en":"Limited Steps","desc_zh":"30步内最高分"}]'),
('G4', '语法大厨', 'Grammar Chef', 4, 1, 2, true, true, '2人协作', 'P1', 4,
 '[{"name_zh":"经营","name_en":"Business","desc_zh":"无尽顾客挑战服务数"},{"name_zh":"限时","name_en":"Timed","desc_zh":"90秒最多订单"}]'),
('G5', '成语接龙大战', 'Idiom Chain', 5, 1, 6, true, true, '3-6人', 'P1', 5,
 '[{"name_zh":"无尽","name_en":"Endless","desc_zh":"与AI无限接龙"},{"name_zh":"限时","name_en":"Timed","desc_zh":"60秒接最多成语"}]'),
('G6', '汉字华容道', 'Hanzi Puzzle', 6, 1, 4, true, true, '4人', 'P2', 6,
 '[{"name_zh":"无尽","name_en":"Endless","desc_zh":"连续解题3超时结束"},{"name_zh":"极速","name_en":"Speed","desc_zh":"3分钟解最多题"}]'),
('G7', '古诗飞花令', 'Poem Flyorder', 7, 1, 8, true, true, '4-8人', 'P2', 7,
 '[{"name_zh":"练习","name_en":"Practice","desc_zh":"vs AI，AI难度可调"},{"name_zh":"主题挑战","name_en":"Theme Challenge","desc_zh":"每日特殊关键字"}]'),
('G8', '阅读侦探社', 'Reading Detective', 8, 1, 4, true, true, '4人', 'P2', 8,
 '[{"name_zh":"破案","name_en":"Case","desc_zh":"独立解谜追求评分"}]'),
('G9', 'HSK大冒险', 'HSK Adventure', 9, 1, 4, true, true, '2-4人', 'P2', 9,
 '[{"name_zh":"冒险","name_en":"Adventure","desc_zh":"无尽地牢角色养成"}]'),
('G10', '辩论擂台', 'Debate Arena', 10, 1, 4, true, true, '4人', 'P3', 10,
 '[{"name_zh":"练习","name_en":"Practice","desc_zh":"vs AI辩手难度可调"}]'),
('G11', '诗词大会', 'Poetry Contest', 11, 1, 12, true, true, '6-12人', 'P3', 11,
 '[{"name_zh":"挑战","name_en":"Challenge","desc_zh":"无尽模式3错出局"},{"name_zh":"限时","name_en":"Timed","desc_zh":"2分钟答对最多"}]'),
('G12', '文豪争霸', 'Literary Master', 12, 1, 16, true, true, '8-16人', 'P3', 12,
 '[{"name_zh":"无尽","name_en":"Endless","desc_zh":"连续闯轮越来越难"}]');
```

### Migration 文件

```
supabase/migrations/
└── 20260418100000_game_base_tables.sql
```

## 范围（做什么）

- 创建 `games` 表及完整字段
- 创建 `game_sessions` 表及完整字段
- 创建 `game_results` 表及完整字段
- 创建 `game_session_players` 表及完整字段
- 创建 `user_escape_records` 表及完整字段
- 所有表开启 RLS 并配置合理策略
- 创建必要索引
- 写入 12 款游戏初始数据（含子模式 JSONB）
- 生成 Migration SQL 文件

## 边界（不做什么）

- 不创建段位相关表（T06-002 负责）
- 不创建皮肤相关表（T06-003 负责）
- 不创建赛季表（T06-002 负责）
- 不编写后端 API 代码（T06-004+ 负责）
- 不涉及前端代码

## 涉及文件

- 新建: `supabase/migrations/20260418100000_game_base_tables.sql`
- 不动: `supabase/migrations/` 下已有文件

## 依赖

- 前置: T02-014（全局框架数据库完成，`auth.users` 表可用）
- 后续: T06-002, T06-003, T06-004, T06-005, T06-006

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN Migration 文件已执行 WHEN 查询 `games` 表 THEN 返回 12 条游戏记录，字段完整且类型正确
2. GIVEN 12 款游戏已插入 WHEN 查询 `SELECT game_code, name_zh, sub_modes FROM games ORDER BY sort_order` THEN G1~G12 依次返回，`sub_modes` 为合法 JSONB 数组
3. GIVEN `game_sessions` 表已创建 WHEN 插入一条会话记录（mode='pk_1v1', status='waiting'）THEN 插入成功，`created_at` 自动填充
4. GIVEN `game_results` 表已创建 WHEN 插入同一 session_id + user_id 的两条记录 THEN 第二条插入被唯一约束拒绝
5. GIVEN RLS 已启用 WHEN 用户 A 查询 `game_results` THEN 仅返回 user_id = A 的记录，不可见其他用户结果
6. GIVEN RLS 已启用 WHEN 匿名用户查询 `games` 表 THEN 可成功读取所有游戏列表（公开读取）
7. GIVEN `user_escape_records` 表已创建 WHEN 插入逃跑记录并按 user_id + season_id 查询 THEN 正确返回该用户该赛季的逃跑次数

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 进入后端容器或通过 Supabase MCP 执行 Migration SQL
4. 验证所有表创建成功：`\dt` 查看表列表
5. 验证 12 款游戏种子数据已写入
6. 验证 RLS 策略：使用不同角色查询验证权限边界
7. 验证索引已创建：`\di` 查看索引列表

### 测试通过标准

- [ ] TypeScript 零编译错误（后端类型生成无问题）
- [ ] Docker 构建成功，所有容器 Running
- [ ] 5 张表全部创建成功
- [ ] 12 条游戏初始数据写入成功
- [ ] RLS 策略全部验证通过
- [ ] 索引全部创建成功
- [ ] `game_results` 唯一约束生效
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/06-game-common/` 下创建同名结果文件

结果文件路径: `/tasks/result/06-game-common/T06-001-db-game-base.md`

## 自检重点

- [ ] 安全: RLS 策略是否完备，用户只能访问自己的数据
- [ ] 性能: 索引是否覆盖常用查询路径（user_id, game_id, session_id, created_at）
- [ ] 类型同步: Migration 执行后 `supabase gen types` 能正常生成 TypeScript 类型
- [ ] 数据完整性: 外键、唯一约束、NOT NULL 约束是否合理
- [ ] 命名规范: 表名 snake_case 复数、字段名 snake_case

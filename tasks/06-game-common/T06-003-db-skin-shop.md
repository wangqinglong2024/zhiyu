# T06-003: 数据库 Schema — 皮肤商城

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 2+

## 需求摘要

创建皮肤商城相关数据库表结构，包括 `skins`（皮肤配置表）和 `user_skins`（用户皮肤记录表）。皮肤为纯装饰性付费内容，不影响游戏平衡。支持分类浏览（角色皮肤/背景/特效/音效）、知语币购买、按游戏装备/卸下。付费用户享受折扣。

## 相关上下文

- 产品需求: `product/apps/05-game-common/07-skin-shop.md` — 完整皮肤商城 PRD（**核心依据**）
- 产品需求: `product/apps/05-game-common/07-skin-shop.md` §八 — 数据流向
- 商业规则: `plan/06-business-model.md` §四 — 游戏皮肤变现策略
- 设计规范: `grules/05-coding-standards.md` §四 — 数据库规范
- 关联任务: T06-001 → 本任务 → T06-008

## 技术方案

### 数据库设计

#### 1. `skins` — 皮肤配置表

```sql
CREATE TABLE skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh VARCHAR(50) NOT NULL,                    -- 中文名: 火焰刀光
  name_en VARCHAR(50) NOT NULL,                    -- 英文名: Flame Slash
  name_vi VARCHAR(50),                             -- 越南语名
  description_zh TEXT,                             -- 中文描述
  description_en TEXT,                             -- 英文描述
  description_vi TEXT,                             -- 越南语描述
  category VARCHAR(20) NOT NULL,                   -- 分类: character/background/effect/sound
  game_id UUID REFERENCES games(id),               -- 适用游戏（NULL = 全游戏通用）
  game_code VARCHAR(10),                           -- 冗余游戏编号方便查询
  preview_image_url TEXT,                          -- 静态预览图 URL
  preview_animation_url TEXT,                      -- 动画预览 URL（GIF/WebP）
  price_coins INTEGER NOT NULL DEFAULT 0,          -- 知语币价格
  discount_price_coins INTEGER,                    -- 付费用户折扣价（NULL=无折扣）
  is_season_limited BOOLEAN NOT NULL DEFAULT false, -- 是否赛季限定
  season_id UUID REFERENCES seasons(id),           -- 所属赛季（赛季限定时关联）
  is_active BOOLEAN NOT NULL DEFAULT true,         -- 是否上架
  sort_order INTEGER NOT NULL DEFAULT 0,           -- 排序权重
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_skins_category ON skins(category);
CREATE INDEX idx_skins_game_id ON skins(game_id);
CREATE INDEX idx_skins_game_code ON skins(game_code);
CREATE INDEX idx_skins_is_active ON skins(is_active);
CREATE INDEX idx_skins_season_limited ON skins(is_season_limited) WHERE is_season_limited = true;
```

#### 2. `user_skins` — 用户皮肤记录表

```sql
CREATE TABLE user_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  skin_id UUID NOT NULL REFERENCES skins(id),
  game_id UUID REFERENCES games(id),               -- 装备到哪款游戏（NULL=未装备）
  is_equipped BOOLEAN NOT NULL DEFAULT false,       -- 是否已装备
  purchased_price INTEGER NOT NULL,                -- 购买时实际价格
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  equipped_at TIMESTAMPTZ,                         -- 装备时间
  
  UNIQUE(user_id, skin_id)                         -- 每个用户每个皮肤只能购买一次
);

-- 索引
CREATE INDEX idx_user_skins_user ON user_skins(user_id);
CREATE INDEX idx_user_skins_skin ON user_skins(skin_id);
CREATE INDEX idx_user_skins_equipped ON user_skins(user_id, game_id, is_equipped) WHERE is_equipped = true;

-- 同类互斥约束：同一游戏同一类型只能装备一个
-- 通过后端 Service 层逻辑保证（因为需要联查 skins 表的 category）
```

#### 3. `skin_purchase_logs` — 皮肤购买流水表

```sql
CREATE TABLE skin_purchase_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  skin_id UUID NOT NULL REFERENCES skins(id),
  original_price INTEGER NOT NULL,                 -- 原价
  actual_price INTEGER NOT NULL,                   -- 实际支付价格
  is_discounted BOOLEAN NOT NULL DEFAULT false,    -- 是否享受了折扣
  coin_balance_before INTEGER NOT NULL,            -- 购买前余额
  coin_balance_after INTEGER NOT NULL,             -- 购买后余额
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skin_purchase_logs_user ON skin_purchase_logs(user_id, created_at DESC);
```

#### 4. RLS 策略

```sql
-- skins 表：所有登录用户可读
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skins_select_all" ON skins FOR SELECT USING (true);
CREATE POLICY "skins_manage_admin" ON skins FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- user_skins 表：用户可读/写自己的
ALTER TABLE user_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_skins_select_own" ON user_skins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_skins_insert_own" ON user_skins FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_skins_update_own" ON user_skins FOR UPDATE USING (user_id = auth.uid());

-- skin_purchase_logs 表：用户可读自己的
ALTER TABLE skin_purchase_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_logs_select_own" ON skin_purchase_logs FOR SELECT USING (user_id = auth.uid());
```

### Migration 文件

```
supabase/migrations/
└── 20260418100200_skin_shop_tables.sql
```

## 范围（做什么）

- 创建 `skins` 皮肤配置表
- 创建 `user_skins` 用户皮肤记录表
- 创建 `skin_purchase_logs` 购买流水表
- 所有表开启 RLS 并配置策略
- 创建必要索引和约束
- 生成 Migration SQL 文件

## 边界（不做什么）

- 不插入皮肤种子数据（由管理后台 T14 负责创建皮肤）
- 不编写购买/装备业务逻辑（T06-008 负责）
- 不涉及前端代码
- 不涉及知语币扣减逻辑（T06-008 调用个人中心钱包接口）

## 涉及文件

- 新建: `supabase/migrations/20260418100200_skin_shop_tables.sql`
- 不动: 已有 Migration 文件

## 依赖

- 前置: T06-001（`games` 表存在，外键引用）
- 后续: T06-008（皮肤商城 API）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN Migration 已执行 WHEN 查询 `skins` 表结构 THEN 所有字段类型和约束正确
2. GIVEN `skins` 表存在 WHEN 插入一条皮肤记录（category='effect', game_code='G1'）THEN 插入成功
3. GIVEN `user_skins` 表存在 WHEN 同一用户对同一皮肤插入两条记录 THEN 第二条被唯一约束拒绝
4. GIVEN RLS 已启用 WHEN 用户 A 查询 `user_skins` THEN 仅返回 user_id = A 的记录
5. GIVEN RLS 已启用 WHEN 任意登录用户查询 `skins` THEN 可读取所有上架皮肤
6. GIVEN `skin_purchase_logs` 存在 WHEN 记录购买流水 THEN 正确保存购买前后余额

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. 执行 T06-001 + T06-002 + T06-003 的 Migration SQL
3. 验证 3 张表创建成功
4. 验证唯一约束和外键约束生效
5. 验证 RLS 策略

### 测试通过标准

- [ ] Docker 构建成功，所有容器 Running
- [ ] 3 张表全部创建成功
- [ ] 唯一约束、外键约束生效
- [ ] RLS 策略验证通过
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-003-db-skin-shop.md`

## 自检重点

- [ ] 安全: RLS 策略完备，皮肤公开可读、用户数据私有
- [ ] 数据完整性: 唯一约束防止重复购买
- [ ] 类型规范: category 枚举值与 PRD 一致（character/background/effect/sound）
- [ ] 购买流水: 余额快照防止争议
- [ ] 装备互斥: 预留后端 Service 层实现同类互斥逻辑

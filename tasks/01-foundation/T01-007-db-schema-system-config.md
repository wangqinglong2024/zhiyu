# T01-007: 数据库基础 Schema — 系统配置

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 3

## 需求摘要

创建知语平台的系统配置基础表，包括 `system_configs`（系统配置键值对）和 `i18n_translations`（多语言翻译表）。系统配置表用于存储可动态调整的全局参数（如每日签到规则、知语币上限等），多语言翻译表用于存储 UI 文案的多语言版本。

## 相关上下文

- 产品需求: `product/00-product-overview.md` §四 — 多语言体系（UI 语言：汉/英/越）
- 产品需求: `product/00-product-overview.md` §五 — 核心业务规则（需要动态配置的参数）
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构哲学
- 编码规范: `grules/05-coding-standards.md` §一.2 — 表名 snake_case 复数
- 关联任务: 前置 T01-005（Supabase 连接） → 后续 T02（全局框架-多语言模块）

## 技术方案

### 数据库设计

#### system_configs 表（系统配置）

```sql
-- supabase/migrations/20260418000002_create_system_configs.sql

-- =====================================================
-- 系统配置表：全局动态参数，管理后台可编辑
-- =====================================================

CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 配置键（唯一标识）
  config_key VARCHAR(100) NOT NULL UNIQUE,

  -- 配置值（JSON 格式，支持复杂结构）
  config_value JSONB NOT NULL DEFAULT '{}',

  -- 配置分类（便于管理后台分组展示）
  category VARCHAR(50) NOT NULL DEFAULT 'general',

  -- 描述（中文，方便运营理解）
  description TEXT,

  -- 是否公开（前端可直接读取，无需登录）
  is_public BOOLEAN NOT NULL DEFAULT FALSE,

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_system_configs_key ON system_configs(config_key);
CREATE INDEX idx_system_configs_category ON system_configs(category);
CREATE INDEX idx_system_configs_public ON system_configs(is_public) WHERE is_public = TRUE;

-- =====================================================
-- RLS 策略
-- =====================================================
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- 策略 1：公开配置项允许匿名读取
CREATE POLICY "system_configs_select_public"
  ON system_configs FOR SELECT
  USING (is_public = TRUE);

-- 策略 2：登录用户可读取所有配置
CREATE POLICY "system_configs_select_authenticated"
  ON system_configs FOR SELECT
  TO authenticated
  USING (TRUE);

-- 注意：写操作仅 service_role 可执行（管理后台通过后端 API）

-- =====================================================
-- 自动更新 updated_at
-- =====================================================
CREATE TRIGGER system_configs_updated_at
  BEFORE UPDATE ON system_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 初始种子数据
-- =====================================================
INSERT INTO system_configs (config_key, config_value, category, description, is_public) VALUES

-- 知语币配置
('coin_daily_checkin_rules', '{
  "distribution": [
    {"coins": 1, "probability": 0.40},
    {"coins": 2, "probability": 0.20},
    {"coins": 3, "probability": 0.08},
    {"coins": 4, "probability": 0.08},
    {"coins": 5, "probability": 0.06},
    {"coins": 6, "probability": 0.06},
    {"coins": 7, "probability": 0.04},
    {"coins": 8, "probability": 0.04},
    {"coins": 9, "probability": 0.02},
    {"coins": 10, "probability": 0.02}
  ],
  "paid_user_multiplier": 2
}', 'coins', '每日签到知语币发放规则', FALSE),

('coin_max_balance', '{"max": 100000}', 'coins', '单用户知语币余额上限', FALSE),

('coin_referral_reward_rate', '{"rate": 0.20, "lock_days": 30}', 'coins', '推荐奖励比例和锁定期', FALSE),

-- 课程配置
('course_pricing', '{
  "free_levels": [1, 2, 3],
  "paid_price_usd": 6,
  "validity_years": 3,
  "bundle_price_usd": 54,
  "apple_iap_price_usd": 7.99,
  "renewal_discount": 0.20
}', 'course', '课程定价配置', TRUE),

('course_assessment', '{
  "unit_pass_score": 70,
  "level_pass_score": 85,
  "level_min_section_score": 60,
  "retry_cooldown_hours": 24
}', 'course', '考核通过标准', FALSE),

-- 游戏配置
('game_rank_config', '{
  "ranks": ["bronze_3","bronze_2","bronze_1","silver_3","silver_2","silver_1","gold_3","gold_2","gold_1","platinum_3","platinum_2","platinum_1","diamond_3","diamond_2","diamond_1","star_3","star_2","star_1","master"],
  "stars_per_rank": 3,
  "win_stars": 1,
  "lose_stars": -1,
  "min_rank": "bronze_3",
  "min_stars": 1,
  "season_months": 3
}', 'game', '游戏段位配置', TRUE),

-- 应用通用
('app_supported_languages', '{"ui": ["zh","en","vi"], "future": ["id","th","ms"]}', 'general', '支持的 UI 语言列表', TRUE),

('app_version', '{"current": "0.1.0", "min_supported": "0.1.0"}', 'general', '应用版本信息', TRUE);

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE system_configs IS '系统配置键值表：动态参数，管理后台可编辑';
COMMENT ON COLUMN system_configs.config_value IS 'JSONB 格式配置值，支持复杂嵌套结构';
COMMENT ON COLUMN system_configs.is_public IS '是否允许未登录用户读取';
```

#### i18n_translations 表（多语言翻译）

```sql
-- supabase/migrations/20260418000003_create_i18n_translations.sql

-- =====================================================
-- 多语言翻译表：UI 文案的多语言版本
-- =====================================================

CREATE TABLE i18n_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 翻译键（如 "nav.home"、"btn.submit"）
  translation_key VARCHAR(200) NOT NULL,

  -- 语言代码
  language language_code NOT NULL,

  -- 翻译值
  translation_value TEXT NOT NULL,

  -- 命名空间（按模块分组：common, auth, course, game 等）
  namespace VARCHAR(50) NOT NULL DEFAULT 'common',

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 唯一约束：同一命名空间下，一个 key + 一种语言只有一条记录
  UNIQUE (namespace, translation_key, language)
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_i18n_namespace_lang ON i18n_translations(namespace, language);
CREATE INDEX idx_i18n_key ON i18n_translations(translation_key);

-- =====================================================
-- RLS 策略
-- =====================================================
ALTER TABLE i18n_translations ENABLE ROW LEVEL SECURITY;

-- 翻译表公开可读（前端需要加载多语言文案）
CREATE POLICY "i18n_select_public"
  ON i18n_translations FOR SELECT
  USING (TRUE);

-- 写操作仅 service_role 可执行（管理后台通过后端 API）

-- =====================================================
-- 自动更新 updated_at
-- =====================================================
CREATE TRIGGER i18n_updated_at
  BEFORE UPDATE ON i18n_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE i18n_translations IS '多语言翻译表：UI 文案的多语言版本，管理后台可编辑';
COMMENT ON COLUMN i18n_translations.namespace IS '命名空间：common/auth/course/game 等';
```

### 后端类型定义 — `backend/src/models/common.ts`

```typescript
import { z } from 'zod'

// ===== 系统配置 =====
export const SystemConfigSchema = z.object({
  config_key: z.string().min(1).max(100),
  config_value: z.record(z.unknown()),
  category: z.string().max(50).default('general'),
  description: z.string().optional(),
  is_public: z.boolean().default(false),
})

export type SystemConfig = z.infer<typeof SystemConfigSchema>

export interface SystemConfigResponse {
  id: string
  config_key: string
  config_value: Record<string, unknown>
  category: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

// ===== 多语言翻译 =====
export const I18nTranslationSchema = z.object({
  translation_key: z.string().min(1).max(200),
  language: z.enum(['zh', 'en', 'vi', 'id', 'th', 'ms']),
  translation_value: z.string().min(1),
  namespace: z.string().max(50).default('common'),
})

export type I18nTranslation = z.infer<typeof I18nTranslationSchema>

// ===== 统一响应格式 =====
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// ===== 分页 =====
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type Pagination = z.infer<typeof PaginationSchema>

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

## 范围（做什么）

- 创建 `supabase/migrations/20260418000002_create_system_configs.sql`
- 创建 `supabase/migrations/20260418000003_create_i18n_translations.sql`
- 更新 `backend/src/models/common.ts`（Zod Schema + TypeScript 类型）
- 插入初始种子数据（系统配置默认值）

## 边界（不做什么）

- 不创建管理后台配置编辑 API（T12）
- 不实现前端多语言切换逻辑（T02 全局框架）
- 不导入完整的翻译内容（后续内容任务）
- 不创建缓存层（后续横切任务）

## 涉及文件

- 新建: `zhiyu/supabase/migrations/20260418000002_create_system_configs.sql`
- 新建: `zhiyu/supabase/migrations/20260418000003_create_i18n_translations.sql`
- 修改: `zhiyu/backend/src/models/common.ts`（从占位变为完整实现）

## 依赖

- 前置: T01-005（Supabase 连接可用）、T01-006（依赖 update_updated_at 函数和 language_code 枚举）
- 后续: T02（全局框架-多语言模块需要 i18n 表）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Migration SQL 已执行  
   **WHEN** 查询 `\d system_configs`  
   **THEN** 表存在，包含 config_key、config_value(JSONB)、category、is_public 字段

2. **GIVEN** system_configs 种子数据已插入  
   **WHEN** 查询 `SELECT config_key FROM system_configs`  
   **THEN** 包含 coin_daily_checkin_rules、course_pricing、game_rank_config 等初始配置

3. **GIVEN** 使用 ANON_KEY 查询 system_configs  
   **WHEN** 查询 is_public = TRUE 的配置  
   **THEN** 可以读取（如 course_pricing），但 is_public = FALSE 的不可读

4. **GIVEN** i18n_translations 表已创建  
   **WHEN** 插入相同 namespace + key + language 的记录  
   **THEN** 违反唯一约束，插入失败

5. **GIVEN** backend/src/models/common.ts 已更新  
   **WHEN** 使用 SystemConfigSchema 校验数据  
   **THEN** config_value 必须是对象，config_key 不能为空

6. **GIVEN** i18n_translations RLS 已配置  
   **WHEN** 使用 ANON_KEY 查询翻译表  
   **THEN** 可以读取所有翻译（公开可读）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. 通过 Supabase MCP 或 psql 依次执行 Migration SQL
3. 验证表结构：`\d system_configs` 和 `\d i18n_translations`
4. 验证种子数据：`SELECT config_key, category FROM system_configs`
5. 验证 RLS：用 ANON_KEY 查询 is_public = FALSE 的配置（应返回空）
6. 验证唯一约束：尝试插入重复 i18n 记录

### 测试通过标准

- [ ] 两张表创建成功
- [ ] 种子数据完整（≥ 7 条系统配置）
- [ ] RLS 策略正确（公开/认证区分）
- [ ] 唯一约束生效
- [ ] Zod Schema 校验正确
- [ ] 索引已创建

### 测试不通过处理

- 发现问题 → 立即修复 SQL → 删表重建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-007-db-schema-system-config.md`

## 自检重点

- [ ] 安全：RLS 已开启
- [ ] 安全：写操作仅 service_role
- [ ] 数据完整性：唯一约束正确
- [ ] 类型同步：Zod Schema 与 SQL 字段一致
- [ ] 种子数据：业务参数与产品需求文档一致

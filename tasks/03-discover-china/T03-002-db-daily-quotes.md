# T03-002: 数据库 Schema — 每日金句

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 2

## 需求摘要

为「每日金句」功能创建数据库表。金句由运营后台创建并排期，用户端每日 0:00 UTC 自动刷新展示。需支持多语言字段（中文金句 + 拼音 + 出处 + 英文翻译 + 越南语翻译 + 解读文字）、发布日期排期（支持提前 30 天）、节日金句标记与优先级、分享背景图配置。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/01-category-homepage.md` §二 — 每日金句卡片
- 产品需求: `product/apps/02-discover-china/06-data-nonfunctional.md` §一.1 — 金句数据流向
- 产品需求: `product/apps/02-discover-china/04-share-system.md` §二 — 金句分享图片规格
- 设计规范: `grules/05-coding-standards.md` §十 — 数据库设计铁律
- 关联任务: T03-001（categories/articles 表）

## 技术方案

### 数据库设计

#### daily_quotes 表

```sql
CREATE TABLE daily_quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 中文金句（始终存在）
  quote_zh        TEXT NOT NULL,                    -- 中文金句正文
  quote_pinyin    TEXT NOT NULL,                    -- 拼音
  source_zh       VARCHAR(200),                    -- 出处中文（如「老子《道德经》」）
  interpretation_zh TEXT,                           -- 中文解读（2-3 句）
  
  -- 英文翻译
  quote_en        TEXT,                            -- 英文翻译
  interpretation_en TEXT,                          -- 英文解读
  
  -- 越南语翻译
  quote_vi        TEXT,                            -- 越南语翻译
  interpretation_vi TEXT,                          -- 越南语解读
  
  -- 排期与节日
  scheduled_date  DATE NOT NULL,                   -- 排期日期（唯一）
  is_holiday      BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否节日金句
  holiday_name    VARCHAR(100),                    -- 节日名称（如「春节」）
  holiday_type    SMALLINT NOT NULL DEFAULT 5,     -- 节日优先级 1-5（1=四大传统节日，5=常规）
  
  -- 分享配置
  bg_image_url    TEXT,                            -- 分享背景图 URL
  
  -- 状态管理
  status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft / published
  published_at    TIMESTAMPTZ,                     -- 发布时间
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE UNIQUE INDEX idx_daily_quotes_date ON daily_quotes(scheduled_date) WHERE status = 'published';
CREATE INDEX idx_daily_quotes_holiday ON daily_quotes(scheduled_date, holiday_type) WHERE is_holiday = true AND status = 'published';
CREATE INDEX idx_daily_quotes_latest ON daily_quotes(scheduled_date DESC) WHERE status = 'published';
```

### RLS 策略

```sql
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

-- 任何人可读已发布金句（金句不需要登录即可访问）
CREATE POLICY "daily_quotes_select_published" ON daily_quotes
  FOR SELECT USING (status = 'published');
```

### 金句查询逻辑（供 API 层使用）

```sql
-- 获取当日金句的优先级查询：
-- 1. 当天节日金句（按 holiday_type ASC，优先级高的在前）
-- 2. 当天排期的常规金句
-- 3. 降级：最近一天的已发布金句

-- 查询示例（在 API 层实现）：
SELECT * FROM daily_quotes
WHERE status = 'published'
  AND scheduled_date <= CURRENT_DATE
ORDER BY
  CASE WHEN scheduled_date = CURRENT_DATE AND is_holiday = true THEN 0 ELSE 1 END,
  holiday_type ASC,
  CASE WHEN scheduled_date = CURRENT_DATE THEN 0 ELSE 1 END,
  scheduled_date DESC
LIMIT 1;
```

### 自动更新触发器

```sql
CREATE TRIGGER set_daily_quotes_updated_at BEFORE UPDATE ON daily_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 范围（做什么）

- 创建 Supabase 迁移文件：daily_quotes 表
- 配置排期日期唯一索引（同一天仅一条已发布金句）
- 配置节日优先级索引
- 配置 RLS 策略（任何人可读已发布金句）
- 创建 updated_at 自动触发器

## 边界（不做什么）

- 不写金句 API 接口（T03-005）
- 不写金句前端组件（T03-007, T03-010）
- 不配置运营后台的金句管理页面（Admin 模块任务）
- 不实现节日装饰元素（P2 延后）

## 涉及文件

- 新建: `supabase/migrations/20260418_004_create_daily_quotes.sql`

## 依赖

- 前置: T03-001（需要 update_updated_at_column 函数已存在）
- 后续: T03-005（金句 API）, T03-007（类目首页金句展示）, T03-010（金句分享）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 迁移文件已执行  
   **WHEN** 查询 `\d daily_quotes`  
   **THEN** 表结构包含所有必要字段：quote_zh, quote_pinyin, source_zh, quote_en, quote_vi, scheduled_date, is_holiday, holiday_type 等

2. **GIVEN** daily_quotes 表存在  
   **WHEN** 插入两条同一 scheduled_date 的 published 金句  
   **THEN** 唯一索引冲突，第二条插入失败

3. **GIVEN** 已插入若干金句  
   **WHEN** 查询当日金句，当日既有节日金句（holiday_type=1）又有常规金句  
   **THEN** 节日金句优先返回（holiday_type=1 排在最前）

4. **GIVEN** 当日无排期金句  
   **WHEN** 执行降级查询  
   **THEN** 返回最近一天的已发布金句

5. **GIVEN** RLS 策略已启用  
   **WHEN** 未认证用户查询 daily_quotes  
   **THEN** 仅返回 status='published' 的记录，draft 状态不可见

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 在 Supabase 容器内执行迁移文件
4. 验证 daily_quotes 表结构和索引
5. 插入测试金句数据，验证唯一索引约束
6. 测试金句优先级查询逻辑
7. 验证 RLS 策略

### 测试通过标准

- [ ] Docker 构建成功，所有容器 Running
- [ ] daily_quotes 表创建成功，字段完整
- [ ] scheduled_date 唯一索引生效
- [ ] 节日优先级查询正确
- [ ] RLS 策略仅暴露 published 状态记录
- [ ] updated_at 触发器正常工作

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-002-db-daily-quotes.md`

## 自检重点

- [ ] 安全：RLS 策略确保 draft 金句不可被前端访问
- [ ] 性能：排期日期索引支持高效的当日金句查询
- [ ] 数据完整性：scheduled_date 唯一约束防止同一天多条发布
- [ ] 多语言：zh/en/vi 三语言字段全部到位
- [ ] 节日优先级：1-5 级优先级覆盖 PRD 中的 5 级定义

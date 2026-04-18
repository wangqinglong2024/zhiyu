# T03-003: 数据库 Schema — 收藏

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: S(简单)
> 预估文件数: 1

## 需求摘要

为「收藏系统」创建 user_favorites 表，存储用户与文章的收藏关系。需要联合唯一索引防止重复收藏，RLS 策略确保用户只能操作自己的收藏数据。支持乐观 UI 所需的快速查询和收藏状态同步。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/05-favorite-system.md` — 收藏系统完整 PRD
- 产品需求: `product/apps/02-discover-china/06-data-nonfunctional.md` §一.3 — 收藏数据存储
- 设计规范: `grules/05-coding-standards.md` §十 — 数据库设计铁律
- 关联任务: T03-001（articles 表）

## 技术方案

### 数据库设计

#### user_favorites 表

```sql
CREATE TABLE user_favorites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id    UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 联合唯一：同一用户不能重复收藏同一篇文章
  CONSTRAINT uq_user_article_favorite UNIQUE (user_id, article_id)
);

-- 索引
CREATE INDEX idx_favorites_user_created ON user_favorites(user_id, created_at DESC);
CREATE INDEX idx_favorites_article ON user_favorites(article_id);
```

### RLS 策略

```sql
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的收藏
CREATE POLICY "favorites_select_own" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能创建自己的收藏
CREATE POLICY "favorites_insert_own" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的收藏
CREATE POLICY "favorites_delete_own" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);
```

### 收藏计数同步（文章表冗余字段）

```sql
-- 收藏数 +1 触发器
CREATE OR REPLACE FUNCTION increment_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles SET favorite_count = favorite_count + 1 WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 收藏数 -1 触发器
CREATE OR REPLACE FUNCTION decrement_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles SET favorite_count = favorite_count - 1 WHERE id = OLD.article_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_favorite_insert AFTER INSERT ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION increment_favorite_count();

CREATE TRIGGER after_favorite_delete AFTER DELETE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION decrement_favorite_count();
```

## 范围（做什么）

- 创建 Supabase 迁移文件：user_favorites 表
- 创建联合唯一索引（user_id + article_id）
- 创建用户维度收藏查询索引（按收藏时间倒序）
- 配置 RLS 策略（用户仅可操作自己的收藏）
- 创建收藏计数同步触发器（articles.favorite_count 冗余字段自动更新）

## 边界（不做什么）

- 不写收藏 API 接口（T03-006）
- 不写收藏前端组件（T03-011）
- 不实现收藏数量上限（MVP 不限制）
- 不处理「我的收藏」列表页面（属于个人中心模块）

## 涉及文件

- 新建: `supabase/migrations/20260418_005_create_user_favorites.sql`

## 依赖

- 前置: T03-001（articles 表已创建，favorite_count 字段已存在）
- 后续: T03-006（收藏 API）, T03-011（收藏前端）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 迁移文件已执行  
   **WHEN** 查询 `\d user_favorites`  
   **THEN** 表包含 id, user_id, article_id, created_at 字段，且 (user_id, article_id) 有唯一约束

2. **GIVEN** 用户 A 已收藏文章 X  
   **WHEN** 用户 A 再次插入对文章 X 的收藏  
   **THEN** 唯一约束冲突，操作失败

3. **GIVEN** RLS 策略已启用  
   **WHEN** 用户 A 查询 user_favorites  
   **THEN** 仅返回 user_id = A 的收藏记录，B 的收藏不可见

4. **GIVEN** RLS 策略已启用  
   **WHEN** 用户 A 尝试删除用户 B 的收藏记录  
   **THEN** 操作被 RLS 拦截，删除失败

5. **GIVEN** 用户收藏了文章 X  
   **WHEN** 查询 articles 表的 favorite_count  
   **THEN** 对应文章的 favorite_count 已自动 +1

6. **GIVEN** 用户取消收藏文章 X  
   **WHEN** 查询 articles 表的 favorite_count  
   **THEN** 对应文章的 favorite_count 已自动 -1

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 在 Supabase 容器内执行迁移文件
4. 创建测试用户和测试文章
5. 测试收藏操作：插入 → 验证唯一约束 → 删除
6. 验证 RLS：用户 A 不可见用户 B 的收藏
7. 验证 favorite_count 触发器自动更新

### 测试通过标准

- [ ] Docker 构建成功，所有容器 Running
- [ ] user_favorites 表创建成功
- [ ] 联合唯一索引正确阻止重复收藏
- [ ] RLS 策略正确隔离用户数据
- [ ] 收藏/取消触发器正确更新 articles.favorite_count
- [ ] 用户删除时级联删除其收藏（ON DELETE CASCADE）

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-003-db-favorites.md`

## 自检重点

- [ ] 安全：RLS 策略 100% 隔离用户收藏数据
- [ ] 性能：user_id + created_at DESC 索引支持收藏列表快速分页
- [ ] 数据完整性：外键 CASCADE 确保文章删除时收藏同步清理
- [ ] 触发器：favorite_count 增减逻辑无并发竞态风险（使用原子操作 +1/-1）

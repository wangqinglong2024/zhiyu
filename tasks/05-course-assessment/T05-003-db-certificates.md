# T05-003: 数据库 Schema — 证书

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 2

## 需求摘要

创建电子证书相关的数据库表 `user_certificates`，用于存储用户通过级别综合考核后获得的学习成就证书。每张证书包含用户昵称、Level 信息、HSK/CEFR 等级、考核分数、签发日期、唯一证书编号等。证书按 Level 最多 12 张，重考通过不覆盖首次证书。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/05-certificate.md` — 电子证书完整 PRD
- 产品需求: `product/apps/04-course-assessment/06-data-nonfunctional.md` §一.4 — 证书数据流
- 编码规范: `grules/05-coding-standards.md` §四 — 数据库编码规范
- 关联任务: T05-002（考核记录表，前置）→ T05-007（证书签发 API）、T05-010（前端展示）

## 技术方案

### 数据库设计

#### user_certificates 表

```sql
CREATE TABLE user_certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),

  -- 关联考核
  attempt_id      UUID NOT NULL REFERENCES quiz_attempts(id), -- 关联的综合考核记录
  level_id        UUID NOT NULL REFERENCES levels(id),

  -- 证书内容
  certificate_no  TEXT NOT NULL UNIQUE,                       -- 唯一证书编号，格式 ZY-L{XX}-{YYYYMMDD}-{4位随机}
  user_nickname   TEXT NOT NULL,                              -- 签发时的用户昵称（快照，不随用户修改而变）
  level_name_zh   TEXT NOT NULL,                              -- Level 名称（中文快照）
  level_name_en   TEXT NOT NULL,                              -- Level 名称（英文快照）
  level_number    INTEGER NOT NULL,                           -- Level 编号（1-12）
  hsk_level       TEXT NOT NULL,                              -- HSK 等级（如 "HSK 3"）
  cefr_level      TEXT NOT NULL,                              -- CEFR 等级（如 "CEFR B1"）
  total_score     DECIMAL(5,2) NOT NULL,                      -- 综合成绩
  module_scores   JSONB,                                      -- 各模块分数

  -- 签发时间
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),         -- 证书签发时间

  -- 证书类型
  certificate_type TEXT NOT NULL DEFAULT 'level',             -- 'level'（级别证书）/ 'stage'（阶段证书，P2）

  -- 状态
  is_active       BOOLEAN NOT NULL DEFAULT true,              -- 是否有效（预留撤销用）

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 一个用户一个 Level 只有一张级别证书（首次通过签发，重考不覆盖）
CREATE UNIQUE INDEX idx_certificates_user_level ON user_certificates(user_id, level_id, certificate_type)
  WHERE is_active = true;

-- 其他索引
CREATE INDEX idx_certificates_user ON user_certificates(user_id);
CREATE INDEX idx_certificates_level ON user_certificates(level_id);
CREATE INDEX idx_certificates_no ON user_certificates(certificate_no);
CREATE INDEX idx_certificates_issued ON user_certificates(issued_at DESC);
```

#### 证书编号生成函数

```sql
CREATE OR REPLACE FUNCTION generate_certificate_no(p_level_number INTEGER)
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_date TEXT;
  v_random TEXT;
  v_no TEXT;
  v_exists BOOLEAN;
BEGIN
  v_date := TO_CHAR(now(), 'YYYYMMDD');
  LOOP
    -- 生成 4 位随机字母数字
    v_random := UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 4));
    v_no := 'ZY-L' || LPAD(p_level_number::TEXT, 2, '0') || '-' || v_date || '-' || v_random;

    -- 检查唯一性
    SELECT EXISTS(SELECT 1 FROM user_certificates WHERE certificate_no = v_no) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_no;
    END IF;
  END LOOP;
END;
$$;
```

#### HSK/CEFR 等级映射参考

```
Level 1  → HSK 1 / CEFR A1
Level 2  → HSK 2 / CEFR A2
Level 3  → HSK 3 / CEFR B1
Level 4  → HSK 4 / CEFR B1+
Level 5  → HSK 4+ / CEFR B2
Level 6  → HSK 5 / CEFR B2
Level 7  → HSK 5 / CEFR B2+
Level 8  → HSK 5+ / CEFR C1
Level 9  → HSK 6 / CEFR C1
Level 10 → HSK 6 / CEFR C1+
Level 11 → HSK 6+ / CEFR C2
Level 12 → HSK 6+ / CEFR C2
```

#### RLS 策略

```sql
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的证书
CREATE POLICY "certificates_user_read" ON user_certificates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 证书只能由服务端创建（通过 SERVICE_ROLE_KEY）
-- 用户无 INSERT/UPDATE/DELETE 权限
```

## 范围（做什么）

- 创建 `user_certificates` 表
- 创建唯一约束（用户+Level+类型 唯一）
- 创建证书编号生成函数 `generate_certificate_no`
- 创建所有必要索引
- 启用 RLS 并创建策略（用户只读自己证书）
- 生成 Migration SQL 文件
- 创建后端 TypeScript 类型和 Zod Schema

## 边界（不做什么）

- 不写证书签发 API（T05-007）
- 不写证书 Canvas 图片生成（T05-010 前端任务）
- 不写阶段证书逻辑（P2 功能）
- 不写证书验证/分享 URL 功能（MVP 不做）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_certificates.sql`
- 新建: `backend/src/models/certificate.ts` — 证书类型和 Zod Schema

## 依赖

- 前置: T05-002（quiz_attempts 表）
- 后续: T05-007（证书签发逻辑）、T05-010（前端证书展示）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Migration 已执行  
   **WHEN** 查询 `\dt`  
   **THEN** `user_certificates` 表存在

2. **GIVEN** 证书编号生成函数已创建  
   **WHEN** 调用 `SELECT generate_certificate_no(3)`  
   **THEN** 返回格式为 `ZY-L03-YYYYMMDD-XXXX` 的唯一编号

3. **GIVEN** 用户 A 已有 Level 3 的有效证书  
   **WHEN** 尝试为用户 A 再插入一条 Level 3 级别证书（is_active=true）  
   **THEN** 唯一约束冲突，插入失败

4. **GIVEN** 用户 A 已有 Level 3 证书  
   **WHEN** 为用户 A 插入 Level 4 证书  
   **THEN** 插入成功（不同 Level 不冲突）

5. **GIVEN** RLS 已启用  
   **WHEN** 用户 A 查询 user_certificates  
   **THEN** 仅返回 user_id = A 的证书

6. **GIVEN** RLS 已启用  
   **WHEN** 以 authenticated 角色尝试 INSERT 一条证书  
   **THEN** 操作被拒绝（只能由 service_role 创建）

7. **GIVEN** TypeScript 类型文件已创建  
   **WHEN** 编译 `backend/src/models/certificate.ts`  
   **THEN** 零类型错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. 执行 Migration SQL
3. 验证表结构：`\d user_certificates`
4. 测试 `generate_certificate_no` 函数（多次调用确认唯一性）
5. 测试唯一约束（同用户同 Level 重复插入）
6. 验证 RLS（用户隔离、禁止 authenticated 角色写入）
7. 编译检查：`docker compose exec backend npx tsc --noEmit`

### 测试通过标准

- [ ] Migration SQL 执行零错误
- [ ] 表结构正确
- [ ] 证书编号生成函数可用且唯一
- [ ] 唯一约束正确（同用户同 Level 不可重复）
- [ ] RLS 策略正确（用户只读自己的、只有 service_role 可写）
- [ ] TypeScript 类型编译零错误

### 测试不通过处理

- 发现问题 → 修复 → 重新 Migration → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-003-db-certificates.md`

## 自检重点

- [ ] 证书编号格式 `ZY-L{XX}-{YYYYMMDD}-{XXXX}` 严格正确
- [ ] 唯一约束含 `WHERE is_active = true` 条件
- [ ] 用户昵称为快照字段（签发时冻结，不随用户后续修改变化）
- [ ] HSK/CEFR 等级与 Level 映射准确
- [ ] RLS 禁止前端直接写入证书（只能 service_role）

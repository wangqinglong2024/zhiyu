# T05-011: 集成验证 — 考核全流程 E2E

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 3

## 需求摘要

对课程考核模块进行端到端（E2E）集成验证，覆盖从学习完成到考核触发、答题、判分、证书签发的完整链路。验证三级考核体系（课时小测验 → 单元测评 → 级别综合考核）之间的衔接逻辑、进度解锁、SRS 错题写入、证书签发等全流程闭环。

## 相关上下文

- 所有考核模块任务: T05-001 ~ T05-010
- QA 测试规范: `grules/08-qa-testing.md` — 测试标准和流程
- 任务工作流: `grules/09-task-workflow.md` — 验收流程
- 产品需求: `product/apps/04-course-assessment/` — 全部 PRD

## 技术方案

### E2E 测试场景设计

#### 场景 1: 课时小测验完整链路

```
准备: 用户 A 已注册，Level 1 / Unit 1 / Lesson 1 的课时学习已完成
步骤:
  1. 前端进入课时小测验页面
  2. 后端返回 3-5 道题目
  3. 逐题答题，每题提交后获得即时反馈
  4. 答对 3 题，答错 2 题
  5. 完成测验，查看结果页
验证:
  - 返回题目数量正确（3-5 道）
  - 即时反馈正确（答对显示正确，答错显示错误+解析）
  - 结果页显示总分和正确率
  - 2 道错题已写入 SRS 系统
  - 小测验无通过门槛（passed 始终为 true）
```

#### 场景 2: 单元测评通过 → 解锁下一单元

```
准备: 用户 A 已完成 Unit 1 所有课时（含小测验）
步骤:
  1. 前端进入单元测评页面
  2. 后端返回 10-15 道题目
  3. 自由答题（前后翻页）
  4. 中途刷新页面，验证进度恢复
  5. 答完所有题，提交
  6. 得分 >= 70 分
验证:
  - 进度保存/恢复正常
  - 判分结果正确
  - passed=true
  - 下一单元（Unit 2）已解锁
  - 错题已写入 SRS
```

#### 场景 3: 单元测评不通过 → 立即重考

```
准备: 用户 A 已完成 Unit 2 所有课时
步骤:
  1. 开始单元测评
  2. 故意答错大量题（得分 < 70）
  3. 提交，查看不通过结果页
  4. 立即点击重考
  5. 重新答题，得分 >= 70
验证:
  - 第一次不通过，passed=false
  - 可以立即重考（无冷却时间）
  - 第二次通过后解锁下一单元
  - SRS 中不重复写入相同错题
```

#### 场景 4: 级别综合考核通过 → 证书签发

```
准备: 用户 A 已完成 Level 1 所有单元测评
步骤:
  1. 检查考核资格（eligible=true）
  2. 开始综合考核，4 个模块题目加载
  3. 按模块答题（切换 Tab）
  4. 保存进度 → 恢复进度
  5. 全部答完，提交
  6. 总分 >= 85 且每模块 >= 60
验证:
  - 资格检查通过
  - 4 模块题目正确加载
  - 进度保存/恢复正常
  - 总分和各模块分数计算正确
  - 证书自动签发（user_certificates 表有记录）
  - 证书编号格式正确：ZY-L01-{date}-{code}
  - 前端庆祝动画触发
  - 证书 Canvas 图片可生成和下载
  - 下一 Level 已解锁
```

#### 场景 5: 级别综合考核不通过 → 24h 冷却

```
准备: 用户 A 已完成 Level 2 所有单元测评
步骤:
  1. 开始 Level 2 综合考核
  2. 故意一个模块得分 < 60（或总分 < 85）
  3. 提交，查看不通过结果
  4. 立即尝试重考
  5. 等待 24h 后重考
验证:
  - 不通过时 passed=false
  - 不通过原因明确（总分不足/某模块不足）
  - 立即重考返回 403，显示冷却倒计时
  - nextRetakeAt 正确（当前时间 +24h）
  - 24h 后重考资格恢复
  - 不签发证书
```

#### 场景 6: 重考通过不覆盖首次证书

```
准备: 用户 A 已有 Level 1 证书（第一次通过签发）
步骤:
  1. 重考 Level 1（满足 24h 冷却）
  2. 再次通过
验证:
  - 不签发新证书
  - 原有证书不受影响
  - hasCertificate=true（资格检查 API）
```

#### 场景 7: 完整三级考核链路

```
准备: 全新用户 B
步骤:
  1. 完成 Level 1 / Unit 1 / Lesson 1 学习
  2. 完成课时小测验
  3. 完成 Unit 1 所有课时 + 小测验
  4. 通过 Unit 1 单元测评
  5. 完成 Level 1 所有单元 + 单元测评
  6. 通过 Level 1 综合考核
  7. 查看证书
  8. 验证 Level 2 已解锁
验证:
  - 完整链路无断裂
  - 每一步的解锁条件正确
  - SRS 数据累积正确
  - 证书信息完整且正确
```

### 测试数据准备

```sql
-- 种子数据要求
-- 1. 创建测试用户（2个）
-- 2. 创建 Level 1-2 的课程结构（Level → Unit → Lesson）
-- 3. 创建各课时/单元/级别的题库（每种题型至少 10 道）
-- 4. 模拟课时学习完成进度
-- 5. 模拟单元测评通过记录
```

### 验证脚本

```bash
#!/bin/bash
# e2e-assessment-test.sh

BASE_URL="http://localhost:8100/api/v1"
TOKEN="" # 登录获取

echo "=== 场景 1: 课时小测验 ==="
# POST /lessons/{id}/quiz
# POST /assessments/{id}/answers (逐题)
# POST /assessments/{id}/submit

echo "=== 场景 2: 单元测评通过 ==="
# POST /units/{id}/test
# PUT /assessments/{id}/progress
# GET /assessments/{id}/progress
# POST /assessments/{id}/submit

echo "=== 场景 4: 综合考核通过 ==="
# GET /levels/{id}/exam/eligibility
# POST /levels/{id}/exam
# POST /assessments/{id}/submit
# GET /certificates/{no}

echo "=== 场景 5: 24h 冷却 ==="
# POST /levels/{id}/exam → 403
```

## 范围（做什么）

- 编写 7 个 E2E 测试场景的测试脚本
- 准备测试种子数据（SQL）
- 执行全流程 API 调用和验证
- 验证前后端联调
- 验证数据库状态（quiz_attempts、quiz_answers、user_certificates、SRS）
- 记录测试结果

## 边界（不做什么）

- 不做性能测试（P2）
- 不做并发测试（P2）
- 不做安全渗透测试
- 不做浏览器兼容性测试

## 涉及文件

- 新建: `tests/e2e/assessment/seed-data.sql` — 测试种子数据
- 新建: `tests/e2e/assessment/e2e-assessment-test.sh` — E2E 测试脚本
- 新建: `tests/e2e/assessment/README.md` — 测试说明文档

## 依赖

- 前置: T05-001 ~ T05-010（所有考核模块任务全部完成）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 所有 T05-001 ~ T05-010 任务已完成  
   **WHEN** 执行 E2E 测试脚本  
   **THEN** 全部 7 个场景通过

2. **GIVEN** 场景 1 执行完  
   **WHEN** 查询 SRS 表  
   **THEN** 错题记录存在

3. **GIVEN** 场景 2 执行完  
   **WHEN** 查询课程进度  
   **THEN** Unit 2 已解锁

4. **GIVEN** 场景 4 执行完  
   **WHEN** 查询 user_certificates 表  
   **THEN** Level 1 证书记录存在，编号格式正确

5. **GIVEN** 场景 5 执行完  
   **WHEN** 立即重考  
   **THEN** 返回 403 + 冷却时间

6. **GIVEN** 场景 6 执行完  
   **WHEN** 查询 user_certificates 表  
   **THEN** 仍只有 1 张 Level 1 证书（首次签发的）

7. **GIVEN** 场景 7 执行完  
   **WHEN** 检查整个链路  
   **THEN** 课时→单元→级别→证书全流程闭环

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建全部服务
2. `docker compose ps` — 确认所有容器 Running
3. 执行全部 Migration
4. 导入种子数据：`docker compose exec supabase-db psql -f /tests/e2e/assessment/seed-data.sql`
5. 执行 E2E 测试脚本：`docker compose exec backend bash /tests/e2e/assessment/e2e-assessment-test.sh`
6. 检查所有场景的输出（PASS/FAIL）
7. 验证前端页面流程（手动或截图）

### 测试通过标准

- [ ] Docker 全部服务启动正常
- [ ] 种子数据导入成功
- [ ] 场景 1（课时小测验）PASS
- [ ] 场景 2（单元测评通过）PASS
- [ ] 场景 3（单元测评不通过+重考）PASS
- [ ] 场景 4（综合考核通过+证书）PASS
- [ ] 场景 5（综合考核不通过+24h冷却）PASS
- [ ] 场景 6（重考不覆盖证书）PASS
- [ ] 场景 7（完整三级链路）PASS
- [ ] 前端页面流程可走通

### 测试不通过处理

- 单个场景失败 → 定位问题所在任务 → 修复 → 重新执行该场景
- 多个场景连锁失败 → 从最早的失败场景开始排查
- 同一问题 3 次修复失败 → 标记阻塞并回退到对应任务

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-011-integration-verification.md`

## 自检重点

- [ ] 7 个场景全部覆盖
- [ ] 种子数据充足（各题型均有题目）
- [ ] 测试脚本可重复执行（每次运行前清理测试数据）
- [ ] 测试结果明确标注 PASS/FAIL
- [ ] 失败场景有详细错误日志
- [ ] 三级考核链路无断裂
- [ ] 24h 冷却逻辑正确（可通过修改 DB 时间戳模拟）

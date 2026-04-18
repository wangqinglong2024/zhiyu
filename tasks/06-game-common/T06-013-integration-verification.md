# T06-013: 集成验证 — 游戏通用系统端到端

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 2-3（验证脚本 + 结果报告）

## 需求摘要

对游戏通用系统（T06-001 ~ T06-012）进行端到端集成验证。验证完整用户旅程：游戏大厅 → 模式选择 → 匹配等待 → Mock 游戏对战 → 结算 → 段位变化 → 排行榜查看 → 皮肤购买装备。使用 Mock 游戏场景替代真实游戏逻辑，确保通用系统各模块的协作正确性。

## 相关上下文

- 产品需求: `product/apps/05-game-common/00-index.md` — 模块总览
- 任务规范: `tasks/list/00-index.md` §五 — 集成验证流程
- 关联任务: T06-001 ~ T06-012 全部完成后执行本任务

## 技术方案

### 端到端验证流程

```
Flow 1: PK 对战全流程
━━━━━━━━━━━━━━━━━━━━
Step 1: 游戏大厅（T06-009）
  → 访问 /games
  → 验证 12 款游戏网格展示
  → 验证段位概览卡片
  → 点击 G1（汉字斩）卡片

Step 2: 模式选择（T06-009）
  → 弹出详情弹窗
  → 选择 "PK 1v1" 模式
  → 导航到 /games/G1/match?mode=pk_1v1

Step 3: 匹配等待（T06-010 + T06-005）
  → 展示匹配动画 + 倒计时
  → WebSocket 连接建立
  → 模拟对手加入匹配
  → 收到 match_found 事件
  → VS 动画展示，跳转对战页

Step 4: 游戏对战（T06-010 + T06-006）
  → 强制横屏检测
  → Phaser 容器加载（Mock Scene）
  → HUD 面板显示（计时/分数）
  → 模拟提交答题结果（3-5 题）
  → 游戏结束，调用 finish API

Step 5: 结算（T06-011 + T06-006）
  → 导航到结算页
  → 验证胜利/失败页面展示
  → 验证段位变化动画
  → 验证知识点回顾
  → 验证知语币奖励（如满足 5 连胜）

Step 6: 段位验证（T06-007）
  → 查询用户段位，确认变化正确
  → 访问排行榜页面
  → 验证排名数据

Flow 2: AI 对战流程
━━━━━━━━━━━━━━━━━━
Step 1: 选择 PK 模式，加入匹配
Step 2: 等待 30 秒匹配超时
Step 3: 选择 AI 对战
Step 4: 验证 AI 对战会话创建（ai_match=true）
Step 5: Mock 游戏对战
Step 6: 结算页验证 "AI 对战不影响段位"
Step 7: 确认段位未变化

Flow 3: 皮肤商城流程
━━━━━━━━━━━━━━━━━━
Step 1: 进入皮肤商城
Step 2: 浏览皮肤分类
Step 3: 购买一个皮肤（验证余额扣减）
Step 4: 装备到 G1（验证互斥）
Step 5: 进入 G1 对战，验证已装备皮肤信息传递

Flow 4: 段位边界验证
━━━━━━━━━━━━━━━━━━
Step 1: Mock 用户至大段满星（如黄金 I 满星）
Step 2: PK 胜利 → 验证大段晋级动画触发
Step 3: Mock 用户至小段 1 星
Step 4: PK 失败 → 验证掉段逻辑
Step 5: Mock 用户为新手（前 10 局保护）
Step 6: PK 失败 → 验证新手保护（不扣星）
Step 7: Mock 用户至青铜 III 1 星（最低）
Step 8: PK 失败 → 验证最低保护（不扣星）
```

### Mock 游戏场景

```typescript
// 创建 Mock Phaser Scene 用于集成测试
// frontend/src/pages/games/__tests__/MockGameScene.ts
class MockGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MockGame' })
  }
  
  create() {
    // 展示简单界面，5 秒后自动结束
    this.add.text(400, 300, 'Mock Game - 集成测试', { fontSize: '32px' })
    this.time.delayedCall(5000, () => {
      // 触发游戏结束回调
      this.game.events.emit('game-finish', { score: 850 })
    })
  }
}
```

### 验证脚本

```typescript
// scripts/verify-game-common.ts
// 使用 API 调用模拟完整流程

async function verifyPKFlow() {
  // 1. 登录获取 token
  // 2. 查询游戏列表
  // 3. 加入匹配
  // 4. 模拟匹配成功（创建会话）
  // 5. 提交答题结果
  // 6. 结束游戏
  // 7. 验证段位变化
  // 8. 查询排行榜
}

async function verifyAIFlow() { ... }
async function verifySkinFlow() { ... }
async function verifyRankBoundaries() { ... }
```

## 范围（做什么）

- 编写 Mock 游戏场景（简单 Phaser Scene 替代真实游戏）
- 编写 API 集成测试脚本（模拟完整 PK 流程）
- 验证 PK 全流程（大厅→匹配→对战→结算→段位变化）
- 验证 AI 对战流程（超时→AI 对战→不影响段位）
- 验证皮肤商城流程（浏览→购买→装备→互斥）
- 验证段位边界（晋级/掉段/新手保护/最低保护）
- 验证前后端数据一致性
- 编写验证结果报告

## 边界（不做什么）

- 不实现新的业务功能
- 不修复非集成问题（单模块问题应在对应任务中修复）
- 不实现真实游戏对战逻辑（仅 Mock）

## 涉及文件

- 新建: `frontend/src/pages/games/__tests__/MockGameScene.ts`
- 新建: `scripts/verify-game-common.ts`
- 新建: `tasks/result/06-game-common/T06-013-integration-verification.md`（结果报告）

## 依赖

- 前置: T06-001 ~ T06-012 全部完成

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 所有 T06 任务已完成 WHEN 执行 PK 全流程验证 THEN 大厅→匹配→对战→结算全链路无错误
2. GIVEN PK 胜利后 WHEN 查询用户段位 THEN 段位变化与结算返回值一致
3. GIVEN AI 对战流程 WHEN 游戏结束后查询段位 THEN 段位未变化
4. GIVEN 皮肤购买流程 WHEN 购买成功 THEN 余额扣减正确、皮肤标记为已拥有
5. GIVEN 大段晋级场景 WHEN 胜利结算 THEN 结算页播放晋级动画、段位正确更新
6. GIVEN 前端访问所有页面 WHEN 控制台检查 THEN 零 Error 级别日志
7. GIVEN API 集成脚本 WHEN 执行全部测试 THEN 所有断言通过
8. GIVEN 集成验证通过 WHEN 编写报告 THEN 报告覆盖 4 个 Flow 的验证结果

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running（frontend + backend + supabase）
3. `docker compose logs --tail=50 backend` — 后端无报错
4. `docker compose logs --tail=50 frontend` — 前端构建成功
5. 执行 API 集成测试脚本:
   ```bash
   docker compose exec backend npx tsx scripts/verify-game-common.ts
   ```
6. 浏览器手动验证 4 个 Flow:
   - Flow 1: PK 对战全流程
   - Flow 2: AI 对战流程
   - Flow 3: 皮肤商城流程
   - Flow 4: 段位边界验证
7. 验证数据库数据一致性:
   ```bash
   docker compose exec supabase psql -c "SELECT count(*) FROM game_sessions WHERE status='finished'"
   docker compose exec supabase psql -c "SELECT * FROM user_ranks LIMIT 5"
   docker compose exec supabase psql -c "SELECT * FROM rank_history ORDER BY created_at DESC LIMIT 10"
   ```

### 测试通过标准

- [ ] Docker 全部容器 Running
- [ ] API 集成脚本全部通过
- [ ] Flow 1 PK 全流程通过
- [ ] Flow 2 AI 对战流程通过
- [ ] Flow 3 皮肤商城流程通过
- [ ] Flow 4 段位边界验证通过
- [ ] 前端控制台零 Error
- [ ] 后端控制台零 Error
- [ ] 数据库数据一致性验证通过
- [ ] 结果报告已生成

### 测试不通过处理

- 发现问题 → 定位到具体任务模块 → 回退修复 → 重新 Docker 构建 → 重新验证
- 集成问题（非单模块）→ 在本任务中修复
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-013-integration-verification.md`

### 报告模板

```markdown
# T06-013 集成验证结果报告

## 验证时间
- 开始: YYYY-MM-DD HH:MM
- 完成: YYYY-MM-DD HH:MM

## 环境信息
- Docker 版本: X.X.X
- Node.js 版本: X.X.X
- 数据库: Supabase (PostgreSQL 15)

## Flow 1: PK 对战全流程
| 步骤 | 状态 | 备注 |
|------|------|------|
| 游戏大厅展示 | ✅/❌ | |
| 模式选择弹窗 | ✅/❌ | |
| 匹配等待 | ✅/❌ | |
| WebSocket 事件 | ✅/❌ | |
| 对战页加载 | ✅/❌ | |
| HUD 面板 | ✅/❌ | |
| 结算页展示 | ✅/❌ | |
| 段位变化 | ✅/❌ | |

## Flow 2: AI 对战流程
...

## Flow 3: 皮肤商城流程
...

## Flow 4: 段位边界验证
...

## 发现的问题
| # | 严重度 | 描述 | 归属任务 | 状态 |
|---|--------|------|----------|------|

## 总结
- 总测试项: X
- 通过: X
- 失败: X
- 阻塞: X
```

## 自检重点

- [ ] 数据一致性: 前端展示的段位与数据库记录一致
- [ ] 事件链完整: 匹配→对战→结算→段位更新无断裂
- [ ] WebSocket 稳定: 匹配事件正确触发
- [ ] 跨模块调用: API 之间的数据传递格式一致
- [ ] 边界覆盖: 晋级/掉段/保护/王者/最低保护全部验证
- [ ] 结果报告: 覆盖所有 Flow，问题归属正确

# T06-008: 后端 API — 皮肤商城

> 分类: 06-游戏通用系统 (Game Common)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 6+

## 需求摘要

实现皮肤商城后端 API。包括皮肤列表查询（按分类过滤）、皮肤详情、皮肤购买（知语币扣除）、皮肤装备/卸下。付费用户享受折扣价。装备互斥：同一类别同一游戏只能装备一个皮肤。

## 相关上下文

- 产品需求: `product/apps/05-game-common/07-skin-shop.md` — 完整皮肤商城 PRD（**核心依据**）
  - §二 商城入口与布局
  - §三 皮肤分类（角色/背景/特效/音效）
  - §四 皮肤详情（预览、试用）
  - §五 购买流程与定价
  - §六 装备管理
- 编码规范: `grules/05-coding-standards.md` §三 — 事务处理
- API 规范: `grules/04-api-design.md` — RESTful 设计
- 关联任务: T06-003 → 本任务 → T06-012（前端皮肤商城）

## 技术方案

### API 设计

#### 1. 获取皮肤列表

```
GET /api/v1/skins?category=character&game_code=G1&page=1&page_size=20
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "skin_id": "uuid",
        "name": "火焰战士",
        "description": "燃烧吧！文字的力量！",
        "category": "character",
        "rarity": "rare",
        "preview_url": "https://...",
        "price_coins": 50,
        "discount_price_coins": 40,
        "applicable_games": ["G1", "G2", "G3"],
        "owned": false,
        "equipped": false
      }
    ],
    "total": 80,
    "page": 1,
    "page_size": 20,
    "has_next": true
  }
}
```

#### 2. 获取皮肤详情

```
GET /api/v1/skins/:skinId
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "skin_id": "uuid",
    "name": "火焰战士",
    "description": "燃烧吧！文字的力量！",
    "category": "character",
    "rarity": "rare",
    "preview_url": "https://...",
    "preview_animation_url": "https://...",
    "price_coins": 50,
    "discount_price_coins": 40,
    "applicable_games": ["G1", "G2", "G3"],
    "owned": false,
    "equipped": false,
    "unlock_condition": null,
    "unlock_description": null
  }
}
```

#### 3. 购买皮肤

```
POST /api/v1/skins/:skinId/purchase
Headers: Authorization: Bearer {token}

Response 201:
{
  "code": 0,
  "message": "success",
  "data": {
    "skin_id": "uuid",
    "paid_coins": 40,
    "remaining_coins": 160,
    "is_discount": true
  }
}

Error 400 (余额不足):
{
  "code": 40001,
  "message": "知语币余额不足",
  "data": {
    "required": 40,
    "current_balance": 20
  }
}

Error 409 (已购买):
{
  "code": 40901,
  "message": "已拥有该皮肤"
}
```

#### 4. 装备皮肤

```
POST /api/v1/skins/:skinId/equip
Headers: Authorization: Bearer {token}
Body: { "game_code": "G1" }

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "skin_id": "uuid",
    "game_code": "G1",
    "category": "character",
    "previously_equipped_skin_id": "uuid-old"  // 之前装备的同类皮肤被自动卸下
  }
}
```

#### 5. 卸下皮肤

```
DELETE /api/v1/skins/:skinId/equip
Headers: Authorization: Bearer {token}
Body: { "game_code": "G1" }

Response 200:
{
  "code": 0,
  "message": "success",
  "data": null
}
```

#### 6. 获取用户已拥有皮肤

```
GET /api/v1/skins/owned?category=character
Headers: Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "skin_id": "uuid",
        "name": "火焰战士",
        "category": "character",
        "rarity": "rare",
        "preview_url": "https://...",
        "equipped_in_games": ["G1", "G3"]
      }
    ]
  }
}
```

### 购买事务处理

```typescript
async purchaseSkin(userId: string, skinId: string): Promise<PurchaseResult> {
  return await this.db.transaction(async (tx) => {
    // 1. 查询皮肤信息（锁定行）
    const skin = await tx.query('SELECT * FROM skins WHERE id = $1 FOR UPDATE', [skinId])
    if (!skin || !skin.is_active) throw new NotFoundError('皮肤不存在')
    
    // 2. 检查是否已拥有
    const owned = await tx.query('SELECT 1 FROM user_skins WHERE user_id = $1 AND skin_id = $2', [userId, skinId])
    if (owned) throw new ConflictError('已拥有该皮肤')
    
    // 3. 判断价格（付费用户折扣）
    const isPaidUser = await this.userService.isPaidUser(userId)
    const price = isPaidUser && skin.discount_price_coins ? skin.discount_price_coins : skin.price_coins
    
    // 4. 查询余额
    const wallet = await tx.query('SELECT coin_balance FROM user_wallets WHERE user_id = $1 FOR UPDATE', [userId])
    if (wallet.coin_balance < price) throw new BadRequestError('知语币余额不足')
    
    // 5. 扣除知语币
    await tx.query('UPDATE user_wallets SET coin_balance = coin_balance - $1 WHERE user_id = $2', [price, userId])
    
    // 6. 添加皮肤
    await tx.query('INSERT INTO user_skins (user_id, skin_id) VALUES ($1, $2)', [userId, skinId])
    
    // 7. 记录购买日志
    await tx.query(
      'INSERT INTO skin_purchase_logs (user_id, skin_id, price_paid, is_discount, balance_before, balance_after) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, skinId, price, isPaidUser, wallet.coin_balance, wallet.coin_balance - price]
    )
    
    return { skinId, paidCoins: price, remainingCoins: wallet.coin_balance - price, isDiscount: isPaidUser }
  })
}
```

### 装备互斥逻辑

```typescript
async equipSkin(userId: string, skinId: string, gameCode: string): Promise<EquipResult> {
  // 1. 验证已拥有
  // 2. 验证皮肤适用该游戏（applicable_games 包含 gameCode）
  // 3. 查找同游戏同类别当前装备的皮肤
  // 4. 如有，自动卸下（is_equipped=false）
  // 5. 装备新皮肤（is_equipped=true, equipped_game_code=gameCode）
}
```

### 后端架构

```
backend/src/
├── features/
│   └── game/
│       ├── skin.router.ts         # 皮肤路由
│       ├── skin.service.ts        # 皮肤业务逻辑
│       ├── skin.repository.ts     # 皮肤数据访问
│       ├── skin.schema.ts         # Zod 验证
│       └── skin.types.ts          # 类型定义
```

## 范围（做什么）

- 实现皮肤列表查询（支持 category + game_code 过滤、分页）
- 实现皮肤详情查询
- 实现皮肤购买（事务：余额检查→扣费→发放→日志）
- 实现付费用户折扣价判定
- 实现皮肤装备/卸下（互斥：同类同游戏只装一个）
- 实现已拥有皮肤列表查询
- 实现购买日志记录（含 before/after 余额）

## 边界（不做什么）

- 不实现知语币充值/钱包系统（依赖支付模块）
- 不实现皮肤管理后台（T13 管理端负责）
- 不实现前端皮肤商城页面（T06-012 负责）
- 不实现皮肤的 Phaser 渲染（各游戏模块负责）

## 涉及文件

- 新建: `backend/src/features/game/skin.router.ts`
- 新建: `backend/src/features/game/skin.service.ts`
- 新建: `backend/src/features/game/skin.repository.ts`
- 新建: `backend/src/features/game/skin.schema.ts`
- 新建: `backend/src/features/game/skin.types.ts`
- 修改: `backend/src/main.ts`（注册皮肤路由）

## 依赖

- 前置: T06-003（`skins`, `user_skins`, `skin_purchase_logs` 表存在）
- 后续: T06-012（前端皮肤商城）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 皮肤商城有数据 WHEN GET /api/v1/skins?category=character THEN 返回角色皮肤列表，含拥有状态、装备状态
2. GIVEN 过滤参数 game_code=G1 WHEN 查询皮肤列表 THEN 仅返回 applicable_games 包含 G1 的皮肤
3. GIVEN 用户有 200 知语币且皮肤价格 50 WHEN 购买皮肤 THEN 成功，余额变为 150，皮肤标记为已拥有
4. GIVEN 付费用户购买皮肤 WHEN 皮肤有折扣价 40 THEN 扣除 40 知语币（非 50）
5. GIVEN 用户余额不足 WHEN 购买皮肤 THEN 返回 400 错误，余额不变
6. GIVEN 用户已拥有皮肤 WHEN 再次购买 THEN 返回 409 冲突
7. GIVEN 用户拥有角色皮肤 A 且已装备在 G1 WHEN 装备角色皮肤 B 到 G1 THEN A 自动卸下，B 装备
8. GIVEN 用户拥有皮肤 WHEN 卸下皮肤 THEN 该皮肤在指定游戏中不再装备

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 验证皮肤列表/详情 API
5. 验证皮肤购买流程（正常购买、余额不足、重复购买）
6. 验证付费用户折扣逻辑
7. 验证装备/卸下互斥逻辑
8. 验证购买日志记录

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 皮肤 CRUD API 全部正常
- [ ] 购买事务完整（余额扣减+皮肤发放+日志记录在同一事务）
- [ ] 付费用户折扣逻辑正确
- [ ] 装备互斥逻辑正确
- [ ] 错误场景处理完善（余额不足/重复购买/皮肤不存在）
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/06-game-common/T06-008-api-skin-shop.md`

## 自检重点

- [ ] 事务安全: 购买流程中余额检查→扣费→发放必须在同一事务
- [ ] 幂等性: 重复购买不会扣两次费
- [ ] 并发安全: SELECT ... FOR UPDATE 防止余额超扣
- [ ] 互斥装备: 同类同游戏只能装一个，自动卸下旧的
- [ ] 折扣判定: 付费用户状态判定准确
- [ ] 日志完整: 每次购买都有 before/after 余额记录

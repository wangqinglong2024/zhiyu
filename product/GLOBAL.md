# 全局架构与配置（每次对话必带）

> 本文件包含产品定位、技术栈、系统架构、数据库Schema、安全规则、状态机、UI规范、合规要求。
> 所有模块开发前必须先加载本文件作为上下文基础。

---

## 一、产品定位

**产品名称（对外）：** 内观（暂定）
**产品名称（开发内部）：** AI认知镜

**一句话定位：** 描述你的困境，AI为你生成一份深度认知分析报告，帮你看清问题本质。

**变现方式：** 单次付费 ¥28.8，先付后看。
**分销方式：** 单级邀请分销，被邀请者付费后邀请人得 ¥8.64（30%）。
**合规定位：** 本产品为 AI 辅助认知工具，所有内容仅供参考，不构成专业建议。

---

## 二、技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | React + TypeScript + Tailwind CSS + Framer Motion | SPA 静态页面，Nginx 托管 |
| 后端 | FastAPI（Python，全异步 async/await） | |
| 数据库/认证 | Supabase（PostgreSQL + Supabase Auth） | 通过 MCP 直接操作 |
| AI 调用 | Dify 工作流编排（Claude/Deepseek） | 通过 Dify REST API |
| 支付 | 微信支付 H5(MWEB) + JSAPI / 支付宝H5 | |
| 短信 | 阿里云 SMS 或腾讯云 SMS | |
| 部署 | Docker + Nginx | |

---

## 三、系统架构

```
用户浏览器（H5）
      │ HTTPS
      ▼
  ┌─────────┐
  │  Nginx  │  静态文件托管（React SPA）+ 反向代理 API 请求
  └────┬────┘
       │ /api/*
       ▼
  ┌──────────┐         ┌──────────────┐
  │ FastAPI  │────────▶│   Supabase   │  PostgreSQL + Auth + Storage
  │ (异步)   │         │   (via MCP)  │
  └────┬─────┘         └──────────────┘
       │
       ├──▶ Dify REST API ──▶ AI 模型（Claude/Deepseek）
       ├──▶ 微信支付 API / 支付宝 API
       └──▶ 阿里云/腾讯云 SMS API

支付回调（独立入口，不经过 JWT 鉴权，只验签名）：
  微信支付服务器 ──POST──▶ /api/webhooks/wechat-pay
  支付宝服务器   ──POST──▶ /api/webhooks/alipay
```

---

## 四、数据库Schema（全表）

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| phone | varchar | 手机号（唯一） |
| wechat_openid | varchar | 微信 openid（可空） |
| invite_code | varchar(6) | 用户邀请码（唯一） |
| invited_by | uuid | 邀请人 user_id（可空） |
| is_frozen | boolean | 账号冻结标志（默认 false） |
| created_at | timestamp | 注册时间 |

### orders
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 购买者 |
| category | varchar | 类目（career/emotion） |
| input_content | text | 用户输入的困境 |
| report | jsonb | AI生成的报告（JSON） |
| status | varchar | pending/paid/generating/completed/failed/refunded |
| amount | decimal | 订单金额（28.8） |
| paid_at | timestamp | 支付时间 |
| created_at | timestamp | 创建时间 |

### commissions
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| beneficiary_id | uuid | 佣金受益人 |
| order_id | uuid | 触发佣金的订单 |
| type | varchar | self_cashback / referral |
| amount | decimal | 佣金金额（通常 8.64） |
| ratio | decimal | 佣金比例（0.3） |
| status | varchar | pending/settled/withdrawn |
| created_at | timestamp | 创建时间 |

### wallets
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户（唯一） |
| balance | decimal | 当前可提现余额 |
| total_earned | decimal | 历史累计佣金 |
| total_withdrawn | decimal | 历史累计已提现 |
| updated_at | timestamp | 最后更新时间 |

### withdrawals
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 申请人 |
| amount | decimal | 申请金额 |
| payee_name | varchar | 收款人真实姓名 |
| payee_account | varchar | 收款账号 |
| payee_method | varchar | 微信/支付宝 |
| status | varchar | pending/approved/rejected/paid |
| admin_note | text | 管理员备注 |
| created_at | timestamp | 申请时间 |

---

## 五、状态机

### 订单状态机
```
创建 ──▶ pending ──┬──▶ paid ──▶ generating ──┬──▶ completed ──▶ refunded（终态）
                   │                           └──▶ failed（可重试）
                   └──▶ expired（终态，30分钟超时）
```

### 提现状态机
```
申请 ──▶ pending（余额冻结）──┬──▶ approved ──▶ paid（终态，total_withdrawn累加）
                              └──▶ rejected（余额解冻返还）
```

---

## 六、安全规则（铁律）

### JWT 验签（FastAPI 本地验签，不回调 Supabase）
```python
decoded = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
user_id = decoded["sub"]  # uuid
```

### Admin JWT（独立签发，与用户 JWT 完全隔离）
```python
payload = {"sub": "admin", "role": "admin", "exp": now + 8h}
token = jwt.encode(payload, settings.ADMIN_JWT_SECRET, algorithm="HS256")
# 所有 /admin/* 接口验证 role == "admin"
```

### 支付 Webhook 签名验证（必须）
```python
# 微信支付 v3：result = wxpay.decrypt_callback(headers, body)
# 支付宝：verified = alipay.verify(params, sign)
```

### RLS 策略（每张表都必须启用）
```sql
-- users: 只能读自己
CREATE POLICY "users_self_only" ON users FOR ALL USING (auth.uid() = id);
-- orders: 只能读/写自己的订单
CREATE POLICY "orders_self_only" ON orders FOR ALL USING (auth.uid() = user_id);
-- commissions: 只能读自己的佣金
CREATE POLICY "commissions_self_only" ON commissions FOR SELECT USING (auth.uid() = beneficiary_id);
-- wallets: 只能读自己
CREATE POLICY "wallets_self_only" ON wallets FOR SELECT USING (auth.uid() = user_id);
-- 管理端: 通过 Admin JWT (service_role key) 绕过 RLS
```

---

## 七、全局UI规范

### 视觉基调
- **风格：** 极简暗色 + 鎏金点缀
- 背景：`#0A0A0F`（近黑）
- 面板：`rgba(255,255,255,0.06)` + `border: 1px solid rgba(255,255,255,0.1)`
- 强调色：`#C9A84C`（鎏金）
- 文字主色：`#F0EDE6`
- 文字次色：`rgba(240,237,230,0.5)`

### 毛玻璃
```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.06);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 16px;
```

### 其他
- 背景：固定 CSS Mesh Gradient 渐变，暗金色与深黑色系
- 字体：系统默认（`-apple-system, BlinkMacSystemFont, 'PingFang SC'`）
- 动效：Framer Motion 页面淡入淡出 + 按钮点击缩放
- 帧率：中端机（骁龙870级别）60fps
- 按钮：圆角矩形 `border-radius: 12px`；主按钮鎏金渐变+深色文字，次按钮透明+细边框

### 管理端UI规范
- 使用 Ant Design 或 shadcn/ui 组件库
- 浅色模式（白底灰字黑字），顶部导航深色（`#1a1a2e`）
- 不需要移动端适配，桌面端优先

---

## 八、合规要求

1. 名称不含"先知""预测""命运""玄学"等词，使用"认知分析""思维梳理""深度反思"
2. 每报告页底部固定免责声明：`本报告由 AI 根据您的描述生成，仅供参考，不构成专业职业、心理或法律建议。`
3. Dify Prompt 中禁止算命/预测/命运表述
4. 注册页必须勾选《用户协议》和《隐私政策》
5. 分销页面显示：`本平台采用单级分销机制，邀请人仅对直接邀请的用户产生佣金，与多级传销无关。`

---

## 九、佣金分配规则

| 场景 | 买家自得 | 邀请人得 | 平台净得 |
|------|---------|---------|---------|
| 无邀请人 | ¥8.64（自购返佣） | — | ¥20.16（70%） |
| 有邀请人 | ¥8.64 | ¥8.64 | ¥11.52（40%） |

- 每笔订单支付成功后立即结算，无延迟
- 佣金比例 MVP 固定 30%，管理后台可配置

---

## 十、API 总览

### 应用端
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/send-sms | 发送短信验证码 |
| POST | /auth/login | 手机号+验证码登录/注册 |
| POST | /auth/wechat | 微信登录 |
| POST | /orders/create | 创建订单（返回支付链接） |
| GET | /orders/{id}/status | 查询订单状态 |
| GET | /orders/my | 我的历史订单 |
| GET | /commissions/balance | 查询可提现余额 |
| POST | /withdrawals/apply | 申请提现 |
| GET | /withdrawals/my | 我的提现记录 |
| POST | /webhooks/wechat-pay | 微信支付回调 |
| POST | /webhooks/alipay | 支付宝回调 |

### 管理端
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /admin/stats/overview | Dashboard核心指标 |
| GET | /admin/stats/revenue-chart | 7天收入折线图 |
| GET | /admin/orders | 订单列表 |
| GET | /admin/orders/{id} | 订单详情 |
| POST | /admin/orders/{id}/refund | 退款 |
| GET | /admin/withdrawals | 提现列表 |
| POST | /admin/withdrawals/{id}/approve | 审核通过 |
| POST | /admin/withdrawals/{id}/reject | 审核拒绝 |
| POST | /admin/withdrawals/{id}/confirm-paid | 确认打款 |
| GET | /admin/users | 用户列表 |
| GET | /admin/users/{id} | 用户详情 |
| POST | /admin/users/{id}/freeze | 冻结 |
| POST | /admin/users/{id}/unfreeze | 解封 |
| GET | /admin/settings | 获取配置 |
| PUT | /admin/settings | 更新配置 |

---

## 十一、MVP 不做的功能

12个类目、社区广场、解压/ASMR、习惯打卡、WebGL 3D、空间音频、自动化晨报、星图关系可视化、账号注销、多设备同步、自动化退款佣金追回、多管理员、操作日志审计、数据导出、银企直联自动打款、自动代扣个税。

---

## 十二、产品演进路线

- **Phase 2（验证后3-6个月）：** 会员订阅制 ¥68/月，月3份报告+追问功能。触发条件：月活付费>100人
- **Phase 3（12个月后）：** 实物产品电商方向（认知笔记本、冥想辅助品等）

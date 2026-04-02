# 工程文档：后端项目结构（FastAPI）

> 技术栈：FastAPI + Python 3.11 + asyncpg/Supabase MCP + httpx
> 架构原则：全异步、本地 JWT 验签、模块边界清晰

---

## 一、目录结构

```
backend/
├── main.py                    # FastAPI app 入口，挂载所有 router
├── config.py                  # 环境变量读取（pydantic BaseSettings）
├── dependencies.py            # 公共依赖（JWT 验签、admin 验证、DB session）
│
├── routers/
│   ├── auth.py                # POST /auth/send-sms, /auth/login, /auth/wechat
│   ├── orders.py              # POST /orders/create, GET /orders/{id}/status, GET /orders/my
│   ├── commissions.py         # GET /commissions/balance
│   ├── withdrawals.py         # POST /withdrawals/apply, GET /withdrawals/my
│   ├── webhooks.py            # POST /webhooks/wechat-pay, /webhooks/alipay
│   └── admin/
│       ├── __init__.py
│       ├── stats.py           # GET /admin/stats/overview, /admin/stats/revenue-chart
│       ├── orders.py          # GET /admin/orders, POST /admin/orders/{id}/refund
│       ├── withdrawals.py     # 提现审核相关接口
│       ├── users.py           # 用户管理相关接口
│       └── settings.py        # 系统配置相关接口
│
├── services/
│   ├── sms.py                 # 阿里云/腾讯云短信发送
│   ├── payment.py             # 微信支付 + 支付宝支付封装
│   ├── dify.py                # Dify REST API 调用（async httpx）
│   ├── commission.py          # 佣金结算事务逻辑
│   └── report.py              # 报告生成触发 + 内容校验
│
├── models/
│   ├── user.py                # Pydantic v2 User models
│   ├── order.py               # Pydantic v2 Order models
│   ├── commission.py          # Pydantic v2 Commission models
│   ├── wallet.py              # Pydantic v2 Wallet models
│   └── withdrawal.py          # Pydantic v2 Withdrawal models
│
├── db/
│   ├── client.py              # Supabase 客户端初始化（MCP 通道）
│   └── queries/
│       ├── users.py           # 用户相关查询函数
│       ├── orders.py          # 订单相关查询函数
│       ├── commissions.py     # 佣金相关查询函数
│       └── withdrawals.py     # 提现相关查询函数
│
├── middleware/
│   ├── error_handler.py       # 全局异常捕获 → 标准化 JSON 响应
│   └── rate_limit.py          # 短信发送频率限制（进程内字典，单容器）
│
└── utils/
    ├── jwt_utils.py           # JWT 签发（Admin）和验签（用户/Admin）工具函数
    ├── invite_code.py         # 6位邀请码生成（字母数字，唯一性检查）
    └── phone_mask.py          # 手机号脱敏（138****8888）
```

---

## 二、核心模块说明

### 2.1 dependencies.py（公共依赖注入）

```python
# 用户 JWT 验签依赖（所有应用端接口使用）
async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """
    本地验签 Supabase JWT，提取 user_id（uuid）
    不发起 HTTP 请求，纯内存操作，毫秒级完成
    """
    decoded = jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated"
    )
    return decoded["sub"]  # uuid

# Admin JWT 验签依赖（所有 /admin/* 接口使用）
async def get_admin(token: str = Depends(oauth2_scheme)) -> None:
    decoded = jwt.decode(token, settings.ADMIN_JWT_SECRET, algorithms=["HS256"])
    if decoded.get("role") != "admin":
        raise HTTPException(status_code=403)
```

### 2.2 services/commission.py（佣金结算 - 原子事务）

```python
async def settle_commission(order_id: str, buyer_id: str, conn) -> None:
    """
    在同一个 DB 事务中完成：
    1. INSERT commissions（自购返佣）
    2. INSERT commissions（推荐佣金，若有邀请人）
    3. UPDATE wallets（买家 balance += 8.64）
    4. UPDATE wallets（邀请人 balance += 8.64，若有）
    任何一步失败 → 整体回滚
    金额从系统设置动态读取（commission_ratio × order.amount）
    """
```

### 2.3 middleware/error_handler.py（标准化错误响应）

```python
# 所有未捕获异常统一转为：
{
    "code": "INTERNAL_ERROR",
    "message": "服务异常，请稍后重试",
    "request_id": "uuid"
}
# 生产环境不暴露 traceback
```

---

## 三、接口响应格式约定

所有接口统一包装：

```json
{
  "success": true,
  "data": { ... },
  "message": ""
}
```

错误时：

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "金额不能低于 50 元"
}
```

---

## 四、关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| JWT 验签方式 | 本地验签（不回调 Supabase） | 高并发场景每次 HTTP 验签不可接受 |
| 外部 HTTP 调用 | httpx AsyncClient | requests 是阻塞的，会卡死 FastAPI event loop |
| 短信频率限制 | 进程内字典 | MVP 单容器，无需 Redis |
| 重型任务 | BackgroundTasks | AI 生成不阻塞支付响应 |
| DB 事务 | Supabase RPC 或 psycopg3 transaction | 佣金结算必须原子操作 |
| 密码存储 | 无 | 短信验证码登录，无密码 |
| Admin 密码存储 | 环境变量 bcrypt hash | 不入库，不写代码 |

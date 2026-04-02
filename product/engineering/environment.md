# 工程文档：环境变量参考

> 所有密钥放在 `.env` 文件中，严禁提交到 Git（已在 .gitignore 中排除）
> 本文件是变量清单说明，不含真实值

---

## 一、.env 文件模板

```bash
# =========================================
# Supabase
# =========================================
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...          # 前端使用，权限受 RLS 限制
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # 后端使用，绕过 RLS（管理端操作用）
SUPABASE_JWT_SECRET=your-jwt-secret   # 用于本地验签用户 JWT（Supabase 项目设置里找）

# =========================================
# Admin 认证（独立，与 Supabase 完全隔离）
# =========================================
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$...        # bcrypt hash，命令：python -c "import bcrypt; print(bcrypt.hashpw(b'your-password', bcrypt.gensalt()).decode())"
ADMIN_JWT_SECRET=another-random-secret-min-32chars
# Admin JWT 有效期：8小时（代码中写死）

# =========================================
# 微信支付
# =========================================
WECHAT_PAY_MCHID=1234567890           # 商户号
WECHAT_PAY_APPID=wx1234567890abcdef   # 公众号/APP AppID
WECHAT_PAY_API_V3_KEY=your-32char-key # APIv3 密钥
WECHAT_PAY_SERIAL_NO=xxxxx            # 证书序列号
WECHAT_PAY_PRIVATE_KEY_PATH=/app/certs/apiclient_key.pem  # 商户私钥路径

# =========================================
# 支付宝
# =========================================
ALIPAY_APP_ID=2021xxxxxxxx
ALIPAY_PRIVATE_KEY=MIIEow...          # 商户私钥（PKCS8）
ALIPAY_PUBLIC_KEY=MIIBIjAN...        # 支付宝公钥（用于验签回调）

# =========================================
# 短信服务（二选一）
# =========================================
SMS_PROVIDER=aliyun                   # aliyun | tencent
# 阿里云
ALIYUN_ACCESS_KEY_ID=LTAI5t...
ALIYUN_ACCESS_KEY_SECRET=xxxx
ALIYUN_SMS_SIGN_NAME=内观             # 短信签名
ALIYUN_SMS_TEMPLATE_CODE=SMS_xxx     # 验证码模板 ID
# 腾讯云（如用腾讯云则填这组）
# TENCENT_SECRET_ID=AKIDxxx
# TENCENT_SECRET_KEY=xxx
# TENCENT_SMS_APP_ID=14001xxx
# TENCENT_SMS_SIGN_NAME=内观
# TENCENT_SMS_TEMPLATE_ID=12345

# =========================================
# Dify AI
# =========================================
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-xxxxxxxxxxxx         # Dify 工作流 API Key
DIFY_WORKFLOW_TIMEOUT=60              # 最长等待秒数

# =========================================
# 应用配置
# =========================================
APP_ENV=production                    # development | production
APP_BASE_URL=https://your-domain.com  # 用于生成邀请链接、支付回调地址
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/webhooks/wechat-pay
ALIPAY_NOTIFY_URL=https://your-domain.com/api/webhooks/alipay
ALIPAY_RETURN_URL=https://your-domain.com/paying/{order_id}  # 支付宝同步回跳
```

---

## 二、变量分类说明

| 变量 | 使用方 | 安全级别 |
|------|--------|---------|
| `SUPABASE_ANON_KEY` | 前端（可公开，受 RLS 保护） | 低风险 |
| `SUPABASE_SERVICE_ROLE_KEY` | 后端（绕过 RLS） | **高度机密** |
| `SUPABASE_JWT_SECRET` | 后端（验签用户 token） | **高度机密** |
| `ADMIN_JWT_SECRET` | 后端（签发/验签 Admin token） | **高度机密** |
| `WECHAT_PAY_PRIVATE_KEY_PATH` | 后端（支付请求签名） | **高度机密** |
| `ALIPAY_PRIVATE_KEY` | 后端（支付请求签名） | **高度机密** |
| `DIFY_API_KEY` | 后端（调用 AI） | 高风险 |

---

## 三、开发环境 vs 生产环境

```bash
# 开发环境：.env.development
APP_ENV=development
APP_BASE_URL=http://localhost:8000
# 支付回调用 ngrok 临时暴露本地端口：
WECHAT_PAY_NOTIFY_URL=https://xxxx.ngrok.io/api/webhooks/wechat-pay
ALIPAY_NOTIFY_URL=https://xxxx.ngrok.io/api/webhooks/alipay

# 生产环境：.env（服务器上）
APP_ENV=production
APP_BASE_URL=https://your-domain.com
```

---

## 四、.gitignore 必须包含

```
.env
.env.*
!.env.example          # 只提交模板文件（不含真实值）
backend/certs/         # 微信支付私钥证书
*.pem
```

---

## 五、前端环境变量（Vite）

```bash
# frontend/.env.production
VITE_API_BASE_URL=/api                # 生产环境通过 Nginx 代理
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# frontend/.env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

"""
认证路由：短信验证码登录/注册 + 微信登录
"""
import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from supabase import AuthApiError

from config import settings
from db.client import get_admin_client
from db.queries.users import (
    get_user_by_phone,
    create_user,
    get_user_by_invite_code,
    update_wechat_openid,
)
from middleware.rate_limit import check_sms_rate_limit, check_admin_login_rate_limit
from models.user import SendSmsRequest, LoginRequest, WechatLoginRequest
from models.common import ok, fail
from services.sms import send_sms_code, verify_sms_code
from utils.jwt_utils import create_admin_token
from dependencies import get_current_user
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)
_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/send-sms")
async def send_sms(req: SendSmsRequest, request: Request):
    """发送短信验证码（手机号 60 秒 + IP 每 5 分钟 3 次双重限流）"""
    check_sms_rate_limit(req.phone, request)
    await send_sms_code(req.phone)
    return ok(message="验证码已发送")


@router.post("/login")
async def login(req: LoginRequest):
    """
    手机号 + 验证码 登录或注册
    - 验证码校验通过后，通过 Supabase Admin API 获取/创建用户
    - 返回 Supabase JWT access_token
    """
    if not verify_sms_code(req.phone, req.code):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")

    # 通过 service_role 为该手机号创建/获取 Supabase auth 用户
    # Supabase phone auth：signInWithOtp 或 admin.createUser
    existing = await get_user_by_phone(req.phone)

    if existing:
        # 已存在：直接通过 admin API 生成 session
        user_id = existing["id"]
        # 使用 admin.create_session 直接签发 token（无需发送验证码邮件）
        token_data = await get_admin_client().auth.admin.create_session(user_id)
    else:
        # 新用户：先在 auth.users 创建
        try:
            auth_user = await get_admin_client().auth.admin.create_user(
                {
                    "phone": req.phone,
                    "phone_confirm": True,
                    "email": f"phone_{req.phone}@ideas.top",  # 占位邮箱
                    "email_confirm": True,
                }
            )
            user_id = auth_user.user.id
        except AuthApiError as e:
            logger.error(f"Supabase create_user error: {e}")
            raise HTTPException(status_code=500, detail="注册失败，请稍后重试")

        # 解析邀请人
        referrer_id = None
        if req.invite_code:
            referrer = await get_user_by_invite_code(req.invite_code)
            if referrer:
                referrer_id = referrer["id"]

        # 在 public.users 和 wallets 创建记录
        await create_user(user_id, req.phone, referrer_id)
        token_data = await get_admin_client().auth.admin.create_session(user_id)

    access_token = token_data.session.access_token
    return ok(data={"access_token": access_token, "token_type": "bearer"})


@router.post("/wechat")
async def wechat_login(req: WechatLoginRequest):
    """
    微信网页授权登录
    1. 用 code 换取 openid（需要配置微信公众号 AppID/Secret）
    2. openid 关联/创建用户
    """
    appid = settings.wechat_pay_appid
    # 生产环境需单独配置公众号 AppSecret（此处复用支付 AppID，实际应独立）
    appsecret = ""  # TODO: 配置 WECHAT_MP_APP_SECRET

    if not appsecret:
        raise HTTPException(status_code=501, detail="微信登录暂未开放")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.weixin.qq.com/sns/oauth2/access_token",
            params={
                "appid": appid,
                "secret": appsecret,
                "code": req.code,
                "grant_type": "authorization_code",
            },
        )
        data = resp.json()

    if "errcode" in data:
        raise HTTPException(status_code=400, detail=f"微信授权失败: {data.get('errmsg')}")

    openid = data["openid"]

    # 查询是否已绑定
    result = await (
        get_admin_client().table("users")
        .select("id")
        .eq("wechat_openid", openid)
        .maybe_single()
        .execute()
    )
    user_record = result.data

    if user_record:
        user_id = user_record["id"]
    else:
        # 新微信用户：创建 auth 用户 + 绑定 openid
        auth_user = await get_admin_client().auth.admin.create_user(
            {"email": f"wx_{openid}@ideas.top", "email_confirm": True}
        )
        user_id = auth_user.user.id
        referrer_id = None
        if req.invite_code:
            referrer = await get_user_by_invite_code(req.invite_code)
            if referrer:
                referrer_id = referrer["id"]
        new_user = await create_user(user_id, f"wx_{openid[:8]}", referrer_id)
        await update_wechat_openid(user_id, openid)

    token_data = await get_admin_client().auth.admin.create_session(user_id)
    return ok(data={"access_token": token_data.session.access_token, "token_type": "bearer"})


@router.post("/admin/login")
async def admin_login(request: Request, body: dict):
    """
    管理员账号密码登录（bcrypt 验证，签发独立 Admin JWT）
    IP 限流：每分钟最多 5 次尝试，超限返回 429
    """
    check_admin_login_rate_limit(request)
    username = body.get("username", "")
    password = body.get("password", "")

    if username != settings.admin_username:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not _pwd_ctx.verify(password, settings.admin_password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_admin_token()
    return ok(data={"access_token": token, "token_type": "bearer"})


@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    """获取当前登录用户信息（含邀请码、手机号脱敏）"""
    from db.queries.users import get_user_by_id
    from utils.phone_mask import mask_phone
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    phone = user.get("phone", "")
    if phone and not phone.startswith("wx_"):
        phone = mask_phone(phone)
    return ok(data={
        "user_id": user_id,
        "phone_masked": phone,
        "invite_code": user.get("invite_code", ""),
        "created_at": str(user.get("created_at", "")),
    })

"""
短信发送服务（支持阿里云 / 腾讯云二选一）
验证码存储在进程内字典（MVP 单容器，无 Redis）
"""
import random
import time
import logging
from config import settings

logger = logging.getLogger(__name__)

# {phone: (code, expire_timestamp)}  — 验证码有效期 5 分钟
_code_store: dict[str, tuple[str, float]] = {}
CODE_EXPIRE_SECONDS = 300


def _generate_code() -> str:
    """生成 6 位数字验证码"""
    return str(random.randint(100000, 999999))


async def send_sms_code(phone: str) -> None:
    """
    发送短信验证码
    - 生成验证码并写入内存
    - 调用第三方 SMS API 发送
    - 若 KEY 未配置（开发/测试环境），仅记录日志，跳过真实发送
    """
    code = _generate_code()
    _code_store[phone] = (code, time.time() + CODE_EXPIRE_SECONDS)

    # 检测是否配置了真实 API KEY
    key_configured = bool(settings.aliyun_access_key_id and settings.aliyun_access_key_secret)
    if not key_configured:
        # 生产环境缺少 KEY：拒绝服务，不允许静默降级到 mock 模式
        # 这避免了 Secret 注入失败时 OTP 泄露到日志的安全风险
        if settings.app_env == "production":
            logger.error(f"[SMS ERROR] SMS API key not configured in production! Phone: {phone[:3]}****{phone[7:]}")
            raise RuntimeError("SMS service not configured")
        # 开发/演示模式：记录日志（不含 OTP 明文）
        logger.warning(f"[SMS MOCK] phone={phone[:3]}****{phone[7:]} (SMS key not configured, code stored in memory)")
        return

    try:
        if settings.sms_provider == "aliyun":
            await _send_aliyun(phone, code)
        else:
            await _send_tencent(phone, code)
        logger.info(f"SMS sent to {phone[:3]}****{phone[7:]}")
    except Exception as e:
        # SMS 发送失败：抛出异常让调用方感知，不静默降级（OTP 不入日志）
        logger.error(f"SMS send failed for {phone[:3]}****{phone[7:]}: {e}")
        raise RuntimeError("短信发送失败，请稍后重试") from e


async def _send_aliyun(phone: str, code: str) -> None:
    """阿里云短信发送"""
    from alibabacloud_dysmsapi20170525.client import Client
    from alibabacloud_dysmsapi20170525 import models as sms_models
    from alibabacloud_tea_openapi import models as open_api_models
    import json

    config = open_api_models.Config(
        access_key_id=settings.aliyun_access_key_id,
        access_key_secret=settings.aliyun_access_key_secret,
    )
    config.endpoint = "dysmsapi.aliyuncs.com"
    client = Client(config)

    request = sms_models.SendSmsRequest(
        phone_numbers=phone,
        sign_name=settings.aliyun_sms_sign_name,
        template_code=settings.aliyun_sms_template_code,
        template_param=json.dumps({"code": code}),
    )
    client.send_sms(request)


async def _send_tencent(phone: str, code: str) -> None:
    """腾讯云短信发送"""
    from tencentcloud.common import credential
    from tencentcloud.sms.v20210111 import sms_client, models as tc_models

    cred = credential.Credential(
        settings.aliyun_access_key_id,  # 腾讯云复用字段名
        settings.aliyun_access_key_secret,
    )
    client = sms_client.SmsClient(cred, "ap-guangzhou")
    req = tc_models.SendSmsRequest()
    req.SmsSdkAppId = settings.aliyun_sms_template_code  # 复用字段
    req.SignName = settings.aliyun_sms_sign_name
    req.TemplateId = settings.aliyun_sms_template_code
    req.TemplateParamSet = [code]
    req.PhoneNumberSet = [f"+86{phone}"]
    client.SendSms(req)


def verify_sms_code(phone: str, code: str) -> bool:
    """
    校验验证码
    - 验证码不存在或已过期：False
    - 验证通过后立即删除（一次性）
    """
    entry = _code_store.get(phone)
    if not entry:
        return False
    stored_code, expire_at = entry
    if time.time() > expire_at:
        del _code_store[phone]
        return False
    if stored_code != code:
        return False
    del _code_store[phone]
    return True

"""
频率限制中间件（进程内字典，MVP 单容器适用）
- SMS：同一手机号 60 秒内只允许发送 1 次 + 同一 IP 每 5 分钟最多 3 次（防 SMS 轰炸）
- Admin 登录：同一 IP 每分钟最多 5 次，超限锁定 60 秒
"""
import time
from collections import defaultdict
from fastapi import HTTPException, Request

# {phone: last_send_timestamp}
_sms_cooldown: dict[str, float] = defaultdict(float)
SMS_COOLDOWN_SECONDS = 60

# {ip: (attempt_count, window_start_timestamp)} — 防 IP 级 SMS 轰炸
_sms_ip_attempts: dict[str, tuple[int, float]] = defaultdict(lambda: (0, 0.0))
SMS_IP_MAX_ATTEMPTS = 3
SMS_IP_WINDOW_SECONDS = 300  # 5 分钟窗口

# {ip: (attempt_count, window_start_timestamp)}
_admin_login_attempts: dict[str, tuple[int, float]] = defaultdict(lambda: (0, 0.0))
ADMIN_MAX_ATTEMPTS = 5
ADMIN_WINDOW_SECONDS = 60


def check_sms_rate_limit(phone: str, request: Request) -> None:
    """
    双重限流：
    1. IP 维度：同一 IP 每 5 分钟最多发 3 次（防 SMS 轰炸）
    2. 手机号维度：同一号码 60 秒内只能发一次
    request 为必填参数，确保 IP 维度限流不被绕过
    """
    now = time.time()

    # --- IP 级别限流（防轰炸）---
    # Nginx 已设置 proxy_set_header X-Real-IP $remote_addr，不可被客户端伪造
    ip = (
        request.headers.get("x-real-ip")
        or (request.client.host if request.client else None)
        or "unknown"
    )
    count, window_start = _sms_ip_attempts[ip]
    if now - window_start > SMS_IP_WINDOW_SECONDS:
        _sms_ip_attempts[ip] = (1, now)
    else:
        if count >= SMS_IP_MAX_ATTEMPTS:
            remaining = int(SMS_IP_WINDOW_SECONDS - (now - window_start))
            raise HTTPException(
                status_code=429,
                detail=f"操作过于频繁，请 {remaining} 秒后重试",
            )
        _sms_ip_attempts[ip] = (count + 1, window_start)

    # --- 手机号维度限流 ---
    last_sent = _sms_cooldown[phone]
    if now - last_sent < SMS_COOLDOWN_SECONDS:
        remaining = int(SMS_COOLDOWN_SECONDS - (now - last_sent))
        raise HTTPException(
            status_code=429,
            detail=f"发送太频繁，请 {remaining} 秒后重试",
        )
    _sms_cooldown[phone] = now


def check_admin_login_rate_limit(request: Request) -> None:
    """
    按客户端 IP 限制管理员登录尝试次数
    同一 IP 每分钟最多 5 次，超限返回 429
    """
    # 优先使用网关透传的真实 IP，无法获取时降级为 "unknown"
    ip = (
        request.headers.get("x-real-ip")
        or (request.client.host if request.client else None)
        or "unknown"
    )
    now = time.time()
    count, window_start = _admin_login_attempts[ip]

    # 超出时间窗口则重置
    if now - window_start > ADMIN_WINDOW_SECONDS:
        _admin_login_attempts[ip] = (1, now)
        return

    if count >= ADMIN_MAX_ATTEMPTS:
        remaining = int(ADMIN_WINDOW_SECONDS - (now - window_start))
        raise HTTPException(
            status_code=429,
            detail=f"登录尝试过多，请 {remaining} 秒后再试",
        )

    _admin_login_attempts[ip] = (count + 1, window_start)

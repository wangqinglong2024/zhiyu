/** 全站常量。 */
export const APP_NAME = 'zhiyu';

/** 用户最多同时活跃 3 个设备会话（G3 Q5 决策硬编码）。 */
export const MAX_ACTIVE_SESSIONS = 3;

/** 未登录"发现中国"可浏览前 N 个主题（G2 Q3 决策）。 */
export const GUEST_DISCOVER_LIMIT = 3;

/** Cookie 名（G3 Q4 决策）。 */
export const COOKIE = {
  ACCESS_TOKEN: 'zhiyu-at',
  REFRESH_TOKEN: 'zhiyu-rt',
  CSRF: 'zhiyu-csrf',
  LOCALE: 'zhiyu-locale',
  THEME: 'zhiyu-theme',
} as const;

/** JWT 过期：access 1h，refresh 30d。 */
export const JWT_TTL = {
  ACCESS_SEC: 3600,
  REFRESH_SEC: 60 * 60 * 24 * 30,
} as const;

/**
 * 会话 Cookie 滚动有效期（30 天）。
 * 行为：
 * - 登录时 access/refresh/csrf cookie 的 maxAge 全部设为 30 天
 * - 每次 GET /auth/session 命中时，重写这三个 cookie 续期 30 天（rolling）
 * - 30 天内未访问 → cookie 过期 → 前端拿不到 session → 跳登录页
 * - JWT 本身仍然 1 小时过期；session 接口在拿到过期 JWT 时会用 refresh_token 静默换新
 */
export const SESSION_ROLLING_SEC = 60 * 60 * 24 * 30;

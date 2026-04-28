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

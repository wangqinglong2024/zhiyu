/** 角色定义（G3 §一）。本期仅 super_admin / user 两种。 */
export const ROLES = ['super_admin', 'user'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_DEFAULT: Role = 'user';

export function isAdminRole(role: string | null | undefined): role is 'super_admin' {
  return role === 'super_admin';
}

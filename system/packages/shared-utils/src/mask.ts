/** 中间脱敏：foo@bar.com → f**@bar.com，13800001234 → 138****1234。 */
export function maskEmail(email: string): string {
  const [u, d] = email.split('@');
  if (!u || !d) return email;
  if (u.length <= 1) return `${u}**@${d}`;
  return `${u[0]}**@${d}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

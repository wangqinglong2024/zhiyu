import { randomBytes } from 'node:crypto';

export function randomToken(byteLen = 32): string {
  return randomBytes(byteLen).toString('base64url');
}

export function randomDeviceId(): string {
  return randomBytes(16).toString('hex');
}

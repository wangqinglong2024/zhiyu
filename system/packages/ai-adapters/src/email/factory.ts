import { mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

export interface EmailAdapter {
  readonly name: string;
  readonly isMock: boolean;
  send(opts: { to: string; subject: string; html: string }): Promise<void>;
}

class MockboxEmailAdapter implements EmailAdapter {
  readonly name = 'mock-mailbox';
  readonly isMock = true;
  constructor(private readonly dir: string) {
    mkdirSync(this.dir, { recursive: true });
  }
  async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    const file = join(this.dir, 'inbox.log');
    const entry = JSON.stringify({ ts: new Date().toISOString(), ...opts }) + '\n';
    appendFileSync(file, entry, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`[mock-email] to=${opts.to} subject="${opts.subject}"`);
  }
}

export function createEmailAdapter(env: Record<string, string | undefined>): EmailAdapter {
  if (env.RESEND_API_KEY || env.SMTP_HOST) {
    // TODO(zhiyu, 2026-04): 接入 Resend / SMTP 真实实现。
    return new MockboxEmailAdapter('.dev/mailbox');
  }
  return new MockboxEmailAdapter('.dev/mailbox');
}

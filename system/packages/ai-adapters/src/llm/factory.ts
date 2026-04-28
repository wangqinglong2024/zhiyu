import type { LLMAdapter } from './types.ts';
import { MockLLMAdapter } from './mock.ts';

/** 缺 Key 自动 fallback 到 mock。本期 claude/deepseek 真实接入未实现，统一返回 mock。 */
export function createLLMAdapter(env: Record<string, string | undefined>): LLMAdapter {
  if (env.ANTHROPIC_API_KEY || env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY) {
    // TODO(zhiyu, 2026-04): 接入真实 SDK；当前阶段统一走 mock 以保证 dev 不阻塞。
    return new MockLLMAdapter('configured-but-deferred');
  }
  return new MockLLMAdapter('no-key');
}

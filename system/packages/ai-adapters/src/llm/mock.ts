import type { LLMAdapter, LLMRequest, LLMResponse } from './types.ts';

export class MockLLMAdapter implements LLMAdapter {
  readonly name = 'mock-llm';
  readonly isMock = true;
  constructor(private readonly reason: string) {}
  async complete(req: LLMRequest): Promise<LLMResponse> {
    const last = req.messages.at(-1);
    return {
      content: `[mock:${this.reason}] echo: ${last?.content ?? ''}`.slice(0, 4000),
      usage: { prompt: 0, completion: 0 },
      mock: true,
    };
  }
}

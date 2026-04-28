export type LLMMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type LLMRequest = {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
};
export type LLMResponse = { content: string; usage?: { prompt: number; completion: number }; mock?: boolean };

export interface LLMAdapter {
  readonly name: string;
  readonly isMock: boolean;
  complete(req: LLMRequest): Promise<LLMResponse>;
}

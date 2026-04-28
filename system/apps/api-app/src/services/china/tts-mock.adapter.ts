// china 域：TTS Mock 适配器
// 当 CHINA_TTS_PROVIDER=mock（或未配置真实 key）时使用
// 立即返回一个公开 URL 字符串，不实际上传音频字节（测试场景充分）。
// 真实供应商接入时替换本文件即可。
import type { Env } from '../../env.ts';

export interface TtsResult {
  url: string;
  duration_ms: number;
  provider: string;
  voice: string;
}

export interface TtsRequest {
  article_code: string;
  seq_no: number;
  text: string;
  voice?: string;
}

export function getTtsProvider(env: Env): string {
  return process.env.CHINA_TTS_PROVIDER ?? 'mock';
}

export async function synthesizeMock(env: Env, req: TtsRequest): Promise<TtsResult> {
  const seq = String(req.seq_no).padStart(4, '0');
  const url = `${env.SUPABASE_URL}/storage/v1/object/public/china-tts/${req.article_code}/${seq}.mp3`;
  // 模拟极短延迟
  await new Promise((r) => setTimeout(r, 5));
  // 中文每字约 0.25s 估算，最少 500ms
  const duration_ms = Math.max(500, req.text.length * 250);
  return {
    url,
    duration_ms,
    provider: 'mock',
    voice: req.voice ?? 'mock-zh-female-1',
  };
}

/** 统一入口：未来按 env 选择真实供应商 */
export async function synthesize(env: Env, req: TtsRequest): Promise<TtsResult> {
  const provider = getTtsProvider(env);
  if (provider !== 'mock') {
    // 缺密钥时按 zhiyu-docker-policy 回退 mock
    return synthesizeMock(env, req);
  }
  return synthesizeMock(env, req);
}

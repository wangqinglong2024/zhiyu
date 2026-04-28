// 应用端文章详情：句子卡片 + 单句 TTS + 全文朗读 + 进度记忆
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, GlassCard, Modal, SkeletonCard, Spinner, useToast } from '@zhiyu/ui-kit';
import { api } from '../../lib/http.ts';
import type { ChinaArticleDetail, ChinaSentence, Locale, SentenceAudio } from '../../lib/china-types.ts';
import { pickI18n } from '../../lib/china-types.ts';

type DetailResp = ChinaArticleDetail;
type ProgressResp = { last_seq_no: number; completed: boolean; updated_at?: string };

const PIN_KEY = 'china_pinyin_visible';

export function ChinaArticleDetailPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Locale;
  const params = useParams({ strict: false }) as { code?: string };
  const code = params.code ?? '';
  const nav = useNavigate();
  const toast = useToast();

  // 拼音偏好（PM 答 F3-Q9）：未登录读 localStorage；本期不读 user-account 域设置（接口未提供时容错）
  const [pinyinVisible, setPinyinVisible] = useState<boolean>(() => {
    try { const v = localStorage.getItem(PIN_KEY); return v === null ? true : v === 'true'; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem(PIN_KEY, String(pinyinVisible)); } catch { /* noop */ } }, [pinyinVisible]);

  const session = useQuery({
    queryKey: ['session'],
    queryFn: () => api<{ authenticated: boolean }>('/auth/session'),
    staleTime: 30_000,
  });
  const authed = session.data?.authenticated === true;

  const detail = useQuery({
    queryKey: ['china-article', code],
    queryFn: () => api<DetailResp>(`/china/articles/${encodeURIComponent(code)}`),
  });

  const sentencesQ = useQuery({
    queryKey: ['china-article-sentences', code],
    queryFn: () => api<{ items: ChinaSentence[] }>(`/china/articles/${encodeURIComponent(code)}/sentences`),
  });

  const progress = useQuery({
    queryKey: ['china-progress', code, authed],
    queryFn: () => api<ProgressResp>(`/china/me/articles/${encodeURIComponent(code)}/progress`),
    enabled: authed,
  });

  // 句子状态镜像（音频状态前端可即时变更，避免再调 C5）
  const [sentences, setSentences] = useState<ChinaSentence[]>([]);
  useEffect(() => {
    const raw = sentencesQ.data?.items ?? detail.data?.sentences;
    if (!raw) return;
    const normalized = raw.map((s) => {
      if (s.content && !s.content_zh) {
        return {
          ...s,
          content_zh: s.content.zh,
          content_en: s.content.en,
          content_vi: s.content.vi,
          content_th: s.content.th,
          content_id: s.content.id,
        };
      }
      return s;
    });
    setSentences(normalized);
  }, [detail.data, sentencesQ.data]);

  // 进度回填提示（C3-14）
  useEffect(() => {
    if (!authed || !progress.data) return;
    if (progress.data.last_seq_no === 0) {
      const localKey = `china_local_seq_${code}`;
      try {
        const local = Number(localStorage.getItem(localKey) ?? '0');
        if (local > 0) {
          toast.info(t('china.progress_reset', { defaultValue: '文章已更新，阅读进度已重置' }));
        }
        localStorage.removeItem(localKey);
      } catch { /* noop */ }
    } else {
      try { localStorage.setItem(`china_local_seq_${code}`, String(progress.data.last_seq_no)); } catch { /* noop */ }
    }
  }, [authed, progress.data, code, toast, t]);

  // 自动滚动到 last_seq_no
  useEffect(() => {
    if (!progress.data || progress.data.last_seq_no <= 0) return;
    const el = document.querySelector(`[data-seq="${progress.data.last_seq_no}"]`);
    if (el && 'scrollIntoView' in el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [progress.data]);

  // 在线/离线
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // 音频管理
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current && typeof Audio !== 'undefined') audioRef.current = new Audio();
  const inflightRef = useRef<Set<string>>(new Set());
  const fullPlayRef = useRef<{ playing: boolean; index: number; paused: boolean }>({ playing: false, index: 0, paused: false });
  const [fullPlayState, setFullPlayState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [activeSeq, setActiveSeq] = useState<number>(0);

  const reportProgress = useDebouncedReporter(authed, code);

  const requestTts = useCallback(async (s: ChinaSentence): Promise<SentenceAudio> => {
    if (inflightRef.current.has(s.id)) return s.audio ?? { status: s.audio_status ?? 'pending' };
    inflightRef.current.add(s.id);
    try {
      const out = await api<{ status: SentenceAudio['status']; audio?: SentenceAudio; url?: string; duration_ms?: number }>(
        `/china/sentences/${s.id}/tts`, { method: 'POST', body: JSON.stringify({}) }
      );
      const audio: SentenceAudio = out.audio ?? { status: out.status, url: out.url ?? null, duration_ms: out.duration_ms ?? null };
      setSentences((xs) => xs.map((x) => x.id === s.id ? { ...x, audio, audio_status: audio.status, audio_url: audio.url ?? null } : x));
      return audio;
    } catch (e) {
      const msg = (e as Error).message || 'tts_failed';
      setSentences((xs) => xs.map((x) => x.id === s.id ? { ...x, audio: { status: 'failed', reason: msg }, audio_status: 'failed' } : x));
      throw e;
    } finally {
      inflightRef.current.delete(s.id);
    }
  }, []);

  const pollUntilReady = useCallback(async (s: ChinaSentence): Promise<SentenceAudio> => {
    const start = Date.now();
    // 最多 30s，每 2s
    while (Date.now() - start < 30_000) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const out = await api<SentenceAudio>(`/china/sentences/${s.id}/audio`);
        if (out.status === 'ready' || out.status === 'failed') {
          setSentences((xs) => xs.map((x) => x.id === s.id ? { ...x, audio: out, audio_status: out.status, audio_url: out.url ?? null } : x));
          return out;
        }
      } catch { /* ignore one tick */ }
    }
    return { status: 'processing' };
  }, []);

  const playSentence = useCallback(async (s: ChinaSentence) => {
    if (!audioRef.current) return;
    let audio: SentenceAudio = s.audio ?? { status: s.audio_status ?? 'pending', url: s.audio_url ?? null };
    if (!audio.url || audio.status !== 'ready') {
      try {
        audio = await requestTts(s);
        if (audio.status === 'processing') {
          audio = await pollUntilReady(s);
        }
      } catch (e) {
        toast.error(t('china.tts_failed', { defaultValue: '语音生成失败/超时，请稍后重试' }));
        return;
      }
    }
    if (audio.status !== 'ready' || !audio.url) {
      toast.error(t('china.tts_pending', { defaultValue: '语音生成耗时较长，已加入队列，请稍后刷新页面查看' }));
      return;
    }
    setActiveSeq(s.seq_no);
    const a = audioRef.current;
    a.src = audio.url;
    try {
      await a.play();
    } catch (err) {
      // 自动播放策略可能阻拦；不算致命
    }
    return new Promise<void>((resolve) => {
      const onEnd = () => {
        a.removeEventListener('ended', onEnd);
        // 进度上报（C3-09）
        if (authed) {
          try { localStorage.setItem(`china_local_seq_${code}`, String(s.seq_no)); } catch { /* noop */ }
          reportProgress(s.seq_no, s.seq_no >= sentences.length);
        }
        resolve();
      };
      a.addEventListener('ended', onEnd);
    });
  }, [requestTts, pollUntilReady, toast, t, authed, code, sentences.length, reportProgress]);

  // 全文朗读
  const fullPlay = useCallback(async () => {
    if (!sentences.length) return;
    fullPlayRef.current = { playing: true, index: 0, paused: false };
    setFullPlayState('playing');
    for (let i = 0; i < sentences.length; i++) {
      if (!fullPlayRef.current.playing) break;
      while (fullPlayRef.current.paused) await new Promise((r) => setTimeout(r, 200));
      fullPlayRef.current.index = i;
      try {
        await playSentence(sentences[i]);
      } catch { break; }
      await new Promise((r) => setTimeout(r, 300));
    }
    fullPlayRef.current.playing = false;
    setFullPlayState('idle');
  }, [sentences, playSentence]);

  const toggleFullPlay = useCallback(() => {
    if (fullPlayState === 'idle') { void fullPlay(); return; }
    if (fullPlayState === 'playing') {
      fullPlayRef.current.paused = true;
      audioRef.current?.pause();
      setFullPlayState('paused');
    } else if (fullPlayState === 'paused') {
      fullPlayRef.current.paused = false;
      audioRef.current?.play().catch(() => undefined);
      setFullPlayState('playing');
    }
  }, [fullPlayState, fullPlay]);

  // 离线 → 暂停（A13）
  useEffect(() => {
    if (!online && fullPlayState === 'playing') {
      fullPlayRef.current.paused = true;
      audioRef.current?.pause();
      setFullPlayState('paused');
      toast.info(t('china.offline_pause', { defaultValue: '网络已断开，全文朗读已暂停' }));
    }
  }, [online, fullPlayState, toast, t]);

  // 重新开始
  const [confirmRestart, setConfirmRestart] = useState(false);
  async function doRestart() {
    setConfirmRestart(false);
    fullPlayRef.current = { playing: false, index: 0, paused: false };
    audioRef.current?.pause();
    setFullPlayState('idle');
    setActiveSeq(0);
    if (authed) {
      try {
        await api(`/china/me/articles/${encodeURIComponent(code)}/progress`, {
          method: 'PUT', body: JSON.stringify({ last_seq_no: 0, completed: false }),
        });
      } catch { /* ignore */ }
      try { localStorage.removeItem(`china_local_seq_${code}`); } catch { /* noop */ }
    }
    const first = document.querySelector('[data-seq="1"]');
    if (first && 'scrollIntoView' in first) (first as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (detail.isLoading) {
    return (
      <div className="zy-container">
        <div className="zy-stack">
          <SkeletonCard height={80} />
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={120} />)}
        </div>
      </div>
    );
  }

  if (detail.error) {
    return (
      <div className="zy-container">
        <div className="zy-state" data-testid="detail-error">
          <div className="zy-state-icon">⚠️</div>
          <div>{(detail.error as Error).message}</div>
          <Button onClick={() => detail.refetch()}>{t('common.retry')}</Button>
        </div>
      </div>
    );
  }

  const article = detail.data!;
  const total = sentences.length;
  const lastSeq = progress.data?.last_seq_no ?? 0;

  return (
    <div className="zy-container" data-testid="china-article-detail">
      {!online && <div className="zy-offline-bar" data-testid="offline-bar">{t('china.offline', { defaultValue: '当前已离线' })}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Button variant="ghost" data-testid="back-btn" onClick={() => nav({ to: '/china/categories/$code', params: { code: article.category?.code ?? '01' } })}>← {t('common.back')}</Button>
      </div>

      <header style={{ marginBottom: 12 }}>
        <div className="zy-pinyin" style={{ fontSize: 16 }}>{article.title_pinyin}</div>
        <h1 style={{ fontSize: 24, margin: '4px 0' }}>{pickI18n(article.title_i18n, 'zh')}</h1>
        {lang !== 'zh' && <div className="zy-trans" style={{ fontSize: 18 }}>{pickI18n(article.title_i18n, lang, ['en'])}</div>}
      </header>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Button data-testid="full-play" onClick={toggleFullPlay} disabled={total === 0 || !online}>
          {fullPlayState === 'playing' ? '⏸ ' : '▶ '}
          {fullPlayState === 'playing'
            ? t('china.full_pause', { defaultValue: '暂停朗读' })
            : t('china.full_play', { defaultValue: '全文朗读' })}
        </Button>
        <Button variant="ghost" data-testid="restart" onClick={() => setConfirmRestart(true)}>↻ {t('china.restart', { defaultValue: '重新开始' })}</Button>
        <label className="zy-switch" data-testid="pinyin-switch" style={{ marginLeft: 'auto' }}>
          <input type="checkbox" checked={pinyinVisible} onChange={(e) => setPinyinVisible(e.target.checked)} />
          <span className="zy-switch-track" />
          <span>{t('china.show_pinyin', { defaultValue: '显示拼音' })}</span>
        </label>
        <span style={{ color: 'var(--zy-fg-soft)', fontSize: 13 }} data-testid="progress-text">
          {authed
            ? `${t('china.progress', { defaultValue: '阅读进度' })}：${lastSeq} / ${total}`
            : t('china.progress_guest', { defaultValue: '未登录不保存进度' })}
        </span>
      </div>

      {total === 0 && (
        <div className="zy-state" data-testid="no-sentences">
          <div className="zy-state-icon">📭</div>
          <div>{t('china.empty_article', { defaultValue: '该文章暂无内容' })}</div>
        </div>
      )}

      <div className="zy-stack" data-testid="sentence-list">
        {sentences.map((s) => (
          <SentenceCard
            key={s.id}
            sentence={s}
            lang={lang}
            pinyinVisible={pinyinVisible}
            active={activeSeq === s.seq_no}
            onPlay={() => void playSentence(s)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
        <Button
          variant="ghost"
          data-testid="prev-article"
          disabled={!article.prev}
          onClick={() => article.prev && nav({ to: '/china/articles/$code', params: { code: article.prev.code } })}
        >‹ {article.prev ? pickI18n(article.prev.title_i18n, 'zh') : t('china.no_prev', { defaultValue: '已是首篇' })}</Button>
        <Button
          variant="ghost"
          data-testid="next-article"
          disabled={!article.next}
          onClick={() => article.next && nav({ to: '/china/articles/$code', params: { code: article.next.code } })}
        >{article.next ? pickI18n(article.next.title_i18n, 'zh') : t('china.no_next', { defaultValue: '已是末篇' })} ›</Button>
      </div>

      <Modal
        open={confirmRestart}
        onClose={() => setConfirmRestart(false)}
        width={380}
        title={t('china.confirm_restart_title', { defaultValue: '确定重新开始？' })}
        testId="confirm-restart"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmRestart(false)} data-testid="confirm-cancel">{t('common.cancel')}</Button>
          <Button onClick={doRestart} data-testid="confirm-ok">{t('common.confirm')}</Button>
        </>}
      >
        <p style={{ margin: 0 }}>{t('china.confirm_restart_body', { defaultValue: '阅读进度将重置（不可恢复）。' })}</p>
      </Modal>
    </div>
  );
}

// 单句卡片
function SentenceCard({ sentence: s, lang, pinyinVisible, active, onPlay }: {
  sentence: ChinaSentence;
  lang: Locale;
  pinyinVisible: boolean;
  active: boolean;
  onPlay: () => void;
}) {
  const status = (s.audio?.status ?? s.audio_status ?? 'pending') as SentenceAudio['status'];
  const localText = lang !== 'zh' ? (s as Record<string, unknown>)[`content_${lang}`] as string : '';
  return (
    <GlassCard data-testid={`sentence-${s.seq_no}`} data-seq={s.seq_no} style={active ? { borderColor: 'var(--zy-brand)' } : undefined}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div className="zy-seq" style={{ minWidth: 40 }}>{s.seq_label || String(s.seq_no).padStart(4, '0')}</div>
        <div style={{ flex: 1 }}>
          {pinyinVisible && <div className="zy-pinyin" data-testid="pinyin-line">{s.pinyin}</div>}
          <div className="zy-zh">{s.content_zh}</div>
          {lang !== 'zh' && localText && <div className="zy-trans">{localText}</div>}
        </div>
        <button
          type="button"
          className={`zy-icon-btn ${status === 'failed' ? 'zy-failed' : ''}`}
          data-testid={`play-${s.seq_no}`}
          onClick={onPlay}
          disabled={status === 'processing'}
          title={status}
        >
          {status === 'processing' ? <Spinner size={14} /> : status === 'failed' ? '!' : '🔊'}
        </button>
      </div>
    </GlassCard>
  );
}

function useDebouncedReporter(authed: boolean, code: string) {
  const timer = useRef<number | null>(null);
  const lastSent = useRef<number>(-1);
  return useCallback((seq: number, completed: boolean) => {
    if (!authed) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (seq <= lastSent.current && !completed) return;
      lastSent.current = seq;
      api(`/china/me/articles/${encodeURIComponent(code)}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ last_seq_no: seq, completed }),
      }).catch(() => undefined);
    }, 1000);
  }, [authed, code]);
}

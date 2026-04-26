/**
 * Fullscreen + landscape orientation lock (ZY-09-09)
 *
 * Browser support is uneven (iOS Safari refuses screen.orientation.lock),
 * so this module returns a normalized result the caller can show to the
 * user (e.g. "请手动旋转屏幕"). All DOM access is feature-detected so the
 * module imports cleanly in node/jsdom.
 */
export type FullscreenStatus = 'entered' | 'exited' | 'unsupported' | 'denied';

export interface FullscreenResult {
  status: FullscreenStatus;
  orientationLocked: boolean;
  reason?: string;
}

interface DocumentExt {
  fullscreenElement: Element | null;
  exitFullscreen?: () => Promise<void>;
  addEventListener: Document['addEventListener'];
  removeEventListener: Document['removeEventListener'];
}

interface ScreenOrientationExt extends ScreenOrientation {
  lock?: (orientation: 'landscape' | 'portrait' | 'natural') => Promise<void>;
}

export async function enterFullscreen(target?: HTMLElement): Promise<FullscreenResult> {
  if (typeof document === 'undefined') return { status: 'unsupported', orientationLocked: false };
  const el = target ?? (document.documentElement as HTMLElement);
  if (typeof el.requestFullscreen !== 'function') {
    return { status: 'unsupported', orientationLocked: false, reason: 'fullscreen_api_unavailable' };
  }
  try {
    await el.requestFullscreen();
  } catch (err) {
    return { status: 'denied', orientationLocked: false, reason: stringifyError(err) };
  }
  let locked = false;
  const so = (typeof screen !== 'undefined' ? (screen.orientation as ScreenOrientationExt | undefined) : undefined);
  if (so && typeof so.lock === 'function') {
    try {
      await so.lock('landscape');
      locked = true;
    } catch {
      // iOS Safari throws — caller should display the rotation prompt.
      locked = false;
    }
  }
  return { status: 'entered', orientationLocked: locked };
}

export async function exitFullscreen(): Promise<FullscreenResult> {
  if (typeof document === 'undefined') return { status: 'unsupported', orientationLocked: false };
  const doc = document as DocumentExt;
  if (!doc.fullscreenElement) return { status: 'exited', orientationLocked: false };
  try {
    await doc.exitFullscreen?.();
  } catch (err) {
    return { status: 'denied', orientationLocked: false, reason: stringifyError(err) };
  }
  return { status: 'exited', orientationLocked: false };
}

export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(document as DocumentExt).fullscreenElement;
}

export function isPortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(orientation: portrait)').matches ?? false;
}

/**
 * Subscribe to fullscreen-change events. Returns an unsubscribe.
 */
export function onFullscreenChange(cb: (active: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const handler = () => cb(isFullscreen());
  document.addEventListener('fullscreenchange', handler);
  return () => document.removeEventListener('fullscreenchange', handler);
}

function stringifyError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'unknown_error';
}

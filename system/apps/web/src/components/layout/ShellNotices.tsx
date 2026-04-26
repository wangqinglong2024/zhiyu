/**
 * Offline banner + service-worker update toast for ZY-05-01.
 */
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useT } from '@zhiyu/i18n/client';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function OfflineBanner(): JSX.Element | null {
  const [online, setOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  const { t } = useT('common');
  useEffect(() => {
    const on = (): void => setOnline(true);
    const off = (): void => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (online) return null;
  return (
    <div role="status" data-testid="offline-banner" className="fixed inset-x-0 top-0 z-50 bg-amber-500 text-amber-950 text-center text-small font-medium py-1.5">
      {t('shell.offline_title')} — {t('shell.offline_desc')}
    </div>
  );
}

export function UpdateToast(): JSX.Element | null {
  const { t } = useT('common');
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error) {
      // Service worker registration is best-effort; fall through quietly.
      // eslint-disable-next-line no-console
      console.warn('SW registration error', error);
    },
  });

  if (!needRefresh) return null;
  return (
    <div data-testid="sw-update" className="fixed bottom-20 right-4 z-50 glass-elevated rounded-2xl p-4 shadow-elevated max-w-xs">
      <p className="text-body font-medium">{t('shell.new_version')}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="rounded-md px-3 py-1.5 text-small text-text-secondary hover:bg-white/40"
        >
          {t('actions.cancel')}
        </button>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="rounded-md bg-rose-600 px-3 py-1.5 text-small font-semibold text-white hover:bg-rose-700"
        >
          {t('shell.reload')}
        </button>
      </div>
    </div>
  );
}

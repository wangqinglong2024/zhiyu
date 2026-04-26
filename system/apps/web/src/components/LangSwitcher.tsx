import { useEffect, useState } from 'react';
import {
  LOCALE_LABEL,
  UI_LOCALES,
  type UiLocale,
} from '@zhiyu/i18n';
import { changeLocale, getCurrentLocale, useT } from '@zhiyu/i18n/client';
import { loadFontsFor } from '@zhiyu/i18n/fonts';

/**
 * Compact radiogroup language picker (matches ThemeMenu visual language).
 * Persists via i18next (localStorage) and triggers font preload for the
 * picked locale.
 */
export function LangSwitcher(): JSX.Element {
  const { t } = useT('common');
  const [current, setCurrent] = useState<UiLocale>(getCurrentLocale());

  useEffect(() => {
    loadFontsFor(current);
  }, [current]);

  const onPick = async (next: UiLocale): Promise<void> => {
    if (next === current) return;
    await changeLocale(next);
    loadFontsFor(next);
    setCurrent(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('nav.language')}
      className="inline-flex gap-1 rounded-full glass-subtle p-1"
      data-testid="lang-switcher"
    >
      {UI_LOCALES.map((lng) => {
        const active = lng === current;
        return (
          <button
            key={lng}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              void onPick(lng);
            }}
            className={[
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition',
              active ? 'bg-rose-600 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
            data-testid={`lang-option-${lng}`}
            lang={lng}
          >
            <span className="uppercase">{lng}</span>
            <span className="hidden md:inline text-xs opacity-80">{LOCALE_LABEL[lng]}</span>
          </button>
        );
      })}
    </div>
  );
}

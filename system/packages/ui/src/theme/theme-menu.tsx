import { useTheme } from './theme-provider.js';
import type { ThemeMode } from '@zhiyu/tokens/apply';

const OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: '亮色', icon: '☀' },
  { value: 'dark', label: '暗色', icon: '☾' },
  { value: 'system', label: '跟随系统', icon: '⚙' },
];

export function ThemeMenu(): JSX.Element {
  const { mode, setMode } = useTheme();
  return (
    <div role="radiogroup" aria-label="主题" className="inline-flex gap-1 rounded-full glass-subtle p-1">
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(opt.value)}
            className={[
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition',
              active
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
            data-testid={`theme-option-${opt.value}`}
          >
            <span aria-hidden>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from 'react';

/**
 * Detects whether the device should render full glassmorphism.
 * Disables on low-power devices, prefers-reduced-motion, or browsers
 * without backdrop-filter support — sets `:root.no-glass` to allow
 * CSS-side fallbacks (see packages/tokens/src/styles/glass.css).
 */
export function useGlassSupport(): boolean {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supportsBlur =
      typeof CSS !== 'undefined' &&
      (CSS.supports('backdrop-filter', 'blur(1px)') ||
        CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));

    const lowPower =
      (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4) ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const ok = supportsBlur && !lowPower;
    setEnabled(ok);
    document.documentElement.classList.toggle('no-glass', !ok);
  }, []);

  return enabled;
}

/**
 * iOS / PWA safe-area inset reader (ZY-09-09)
 *
 * Reads `env(safe-area-inset-*)` and returns numeric pixel values for the
 * caller. Falls back to zero on platforms without the env var.
 */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const SIDES: (keyof SafeAreaInsets)[] = ['top', 'right', 'bottom', 'left'];

export function readSafeAreaInsets(): SafeAreaInsets {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.width = '1px';
  probe.style.height = '1px';
  for (const side of SIDES) {
    probe.style.setProperty(`padding-${side}`, `env(safe-area-inset-${side}, 0px)`);
  }
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const insets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  for (const side of SIDES) {
    insets[side] = parseFloat(style.getPropertyValue(`padding-${side}`)) || 0;
  }
  probe.remove();
  return insets;
}

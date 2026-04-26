export const duration = {
  instant: '0ms',
  fast: '150ms',
  base: '200ms',
  medium: '300ms',
  slow: '500ms',
  celebrate: '800ms',
  ambient: '8000ms',
} as const;

export const easing = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const fontSize = {
  caption: ['11px', { lineHeight: '14px' }],
  micro: ['12px', { lineHeight: '16px' }],
  small: ['13px', { lineHeight: '18px' }],
  body: ['14px', { lineHeight: '20px' }],
  'body-lg': ['16px', { lineHeight: '24px' }],
  title: ['20px', { lineHeight: '28px' }],
  h3: ['24px', { lineHeight: '32px' }],
  h2: ['30px', { lineHeight: '38px' }],
  h1: ['36px', { lineHeight: '44px' }],
  display: ['48px', { lineHeight: '60px' }],
  'zh-base': ['18px', { lineHeight: '32px', letterSpacing: '0.02em' }],
  'zh-lg': ['22px', { lineHeight: '36px', letterSpacing: '0.02em' }],
  'zh-xl': ['28px', { lineHeight: '44px', letterSpacing: '0.02em' }],
  'zh-hero': ['48px', { lineHeight: '60px', letterSpacing: '0.02em' }],
  'pinyin-sm': ['11px', { lineHeight: '14px' }],
  'pinyin-base': ['12px', { lineHeight: '16px' }],
  'pinyin-lg': ['16px', { lineHeight: '20px' }],
} as const;

export const fontWeight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const fontFamily = {
  en: "'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  zh: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
  ar: "'Noto Sans Arabic', 'Tahoma', sans-serif",
  th: "'Noto Sans Thai', 'Sarabun', system-ui, sans-serif",
  vi: "'Inter', 'Be Vietnam Pro', system-ui, sans-serif",
  id: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  display: "'Inter Display', 'Inter', system-ui, sans-serif",
} as const;

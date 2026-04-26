/**
 * Cosmic Refraction palette — see planning/ux/02-design-tokens.md
 * No purple. Brand triad: rose / sky / amber.
 */
export const brand = {
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    300: '#fda4af',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    900: '#881337',
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    300: '#7dd3fc',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    900: '#0c4a6e',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    300: '#fcd34d',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    900: '#78350f',
  },
} as const;

export const tones = {
  light: {
    1: '#0284c7',
    2: '#16a34a',
    3: '#d97706',
    4: '#dc2626',
    0: '#737373',
    coin: '#eab308',
  },
  dark: {
    1: '#7dd3fc',
    2: '#4ade80',
    3: '#fbbf24',
    4: '#f87171',
    0: '#a3a3a3',
    coin: '#facc15',
  },
} as const;

export const semantic = {
  light: {
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0284c7',
  },
  dark: {
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
  },
} as const;

/**
 * Surface, text, border, shadow & glass tokens — split per theme.
 * Keys mirror CSS custom properties (without the `--` prefix).
 */
export const themeColors = {
  light: {
    'bg-base': '#fafafa',
    'bg-surface': '#ffffff',
    'bg-elevated': '#ffffff',
    'bg-overlay': 'rgba(250,250,250,.85)',
    'text-primary': '#0a0a0a',
    'text-secondary': '#525252',
    'text-tertiary': '#737373',
    'text-disabled': '#d4d4d4',
    'text-inverse': '#fafafa',
    'border-default': 'rgba(0,0,0,.08)',
    'border-strong': 'rgba(0,0,0,.16)',
    'shadow-sm': '0 1px 2px rgba(0,0,0,.04)',
    'shadow-md': '0 4px 12px rgba(0,0,0,.06)',
    'shadow-lg': '0 12px 32px rgba(0,0,0,.10)',
    'shadow-xl': '0 24px 48px rgba(0,0,0,.14)',
    'shadow-card': '0 4px 12px rgba(0,0,0,.06)',
    'shadow-elevated': '0 12px 32px rgba(0,0,0,.10)',
    'shadow-glow': '0 0 24px rgba(225,29,72,.4)',
    'glass-bg': 'rgba(255,255,255,.45)',
    'glass-bg-elevated': 'rgba(255,255,255,.65)',
    'glass-bg-floating': 'rgba(255,255,255,.75)',
    'glass-bg-overlay': 'rgba(255,255,255,.85)',
    'glass-border': 'rgba(255,255,255,.6)',
    'glass-border-strong': 'rgba(255,255,255,.8)',
    'glass-inset': 'inset 0 1px 0 0 rgba(255,255,255,.7)',
    'glass-shadow': '0 8px 24px rgba(15,23,42,.08)',
    'glass-blur': '16px',
    'glass-saturate': '180%',
    'mesh-1': '#fda4af',
    'mesh-2': '#7dd3fc',
    'mesh-3': '#fcd34d',
  },
  dark: {
    'bg-base': '#0a0a0a',
    'bg-surface': '#171717',
    'bg-elevated': '#262626',
    'bg-overlay': 'rgba(10,10,10,.85)',
    'text-primary': '#fafafa',
    'text-secondary': '#a3a3a3',
    'text-tertiary': '#737373',
    'text-disabled': '#404040',
    'text-inverse': '#0a0a0a',
    'border-default': 'rgba(255,255,255,.08)',
    'border-strong': 'rgba(255,255,255,.16)',
    'shadow-sm': '0 1px 2px rgba(0,0,0,.4)',
    'shadow-md': '0 4px 12px rgba(0,0,0,.4)',
    'shadow-lg': '0 12px 32px rgba(0,0,0,.5)',
    'shadow-xl': '0 24px 48px rgba(0,0,0,.6)',
    'shadow-card': '0 4px 12px rgba(0,0,0,.4)',
    'shadow-elevated': '0 12px 32px rgba(0,0,0,.5)',
    'shadow-glow': '0 0 24px rgba(244,63,94,.6)',
    'glass-bg': 'rgba(23,23,23,.55)',
    'glass-bg-elevated': 'rgba(23,23,23,.7)',
    'glass-bg-floating': 'rgba(23,23,23,.8)',
    'glass-bg-overlay': 'rgba(10,10,10,.9)',
    'glass-border': 'rgba(255,255,255,.10)',
    'glass-border-strong': 'rgba(255,255,255,.18)',
    'glass-inset': 'inset 0 1px 0 0 rgba(255,255,255,.06)',
    'glass-shadow': '0 8px 24px rgba(0,0,0,.4)',
    'glass-blur': '20px',
    'glass-saturate': '150%',
    'mesh-1': '#881337',
    'mesh-2': '#0c4a6e',
    'mesh-3': '#78350f',
  },
} as const;

export type ThemeName = keyof typeof themeColors;

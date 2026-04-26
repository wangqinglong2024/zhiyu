/**
 * Token aggregator — useful for unit tests / Storybook docs / @zhiyu/ui consumption.
 * Tailwind v4 uses CSS-first configuration via `@theme` (see ./styles/preset.css).
 */
import { brand, semantic, themeColors, tones } from './colors.js';
import { fontFamily, fontSize, fontWeight } from './typography.js';
import { radius, screens, spacing } from './spacing.js';
import { duration, easing } from './motion.js';
import { zIndex } from './zindex.js';

export const tokens = {
  brand,
  semantic,
  tones,
  themeColors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  screens,
  spacing,
  duration,
  easing,
  zIndex,
} as const;

export type Tokens = typeof tokens;

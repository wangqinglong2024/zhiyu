import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export type BadgeTone = 'rose' | 'sky' | 'amber' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: 'solid' | 'soft';
}

const SOLID: Record<BadgeTone, string> = {
  rose: 'bg-rose-600 text-white',
  sky: 'bg-sky-600 text-white',
  amber: 'bg-amber-600 text-white',
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
  danger: 'bg-danger text-white',
  info: 'bg-info text-white',
  neutral: 'bg-bg-elevated text-text-primary border border-border-default',
};

const SOFT: Record<BadgeTone, string> = {
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  amber: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  neutral: 'bg-bg-elevated text-text-secondary',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone = 'neutral', variant = 'soft', ...rest },
  ref,
) {
  const tones = variant === 'solid' ? SOLID : SOFT;
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-medium',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
});

export const Tag = Badge;

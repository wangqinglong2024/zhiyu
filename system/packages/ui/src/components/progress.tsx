import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0..100
  tone?: 'rose' | 'sky' | 'amber' | 'success';
}

const TONES = {
  rose: 'bg-rose-600',
  sky: 'bg-sky-600',
  amber: 'bg-amber-600',
  success: 'bg-success',
} as const;

export function Progress({ value, tone = 'rose', className, ...rest }: ProgressProps): JSX.Element {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-bg-elevated', className)}
      {...rest}
    >
      <div
        className={cn('h-full rounded-full transition-[width]', TONES[tone])}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

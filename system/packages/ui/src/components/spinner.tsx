import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

export function Spinner({ className, size = 16, style, ...rest }: SpinnerProps): JSX.Element {
  return (
    <span
      role="status"
      aria-label="loading"
      style={{ width: size, height: size, ...style }}
      className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      {...rest}
    />
  );
}

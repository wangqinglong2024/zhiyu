import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn.ts';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
};

export function Button({ variant = 'primary', className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn('zy-btn', variant === 'primary' ? 'zy-btn-primary' : 'zy-btn-ghost', className)}
    >
      {children}
    </button>
  );
}

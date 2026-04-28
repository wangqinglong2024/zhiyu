import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn.ts';

type Props = HTMLAttributes<HTMLDivElement> & { children: ReactNode };
export function GlassCard({ className, children, ...rest }: Props) {
  return (
    <div {...rest} className={cn('zy-glass zy-card', className)}>
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from '../lib/cn.ts';

type Props = {
  left: ReactNode;
  right: ReactNode;
  glass?: boolean;
  className?: string;
};

export function TopNav({ left, right, glass = true, className }: Props) {
  return (
    <header className={cn('zy-topnav', glass && 'zy-glass', className)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>{left}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{right}</div>
    </header>
  );
}

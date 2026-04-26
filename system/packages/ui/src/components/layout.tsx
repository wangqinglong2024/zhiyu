import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
}

const GAP_CLASS = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
} as const;

export function VStack({ className, gap = 4, ...rest }: BoxProps): JSX.Element {
  return <div className={cn('flex flex-col', GAP_CLASS[gap], className)} {...rest} />;
}

export function HStack({ className, gap = 4, ...rest }: BoxProps): JSX.Element {
  return <div className={cn('flex flex-row items-center', GAP_CLASS[gap], className)} {...rest} />;
}

export function Stack({ className, gap = 4, ...rest }: BoxProps): JSX.Element {
  return <div className={cn('flex', GAP_CLASS[gap], className)} {...rest} />;
}

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const CONTAINER_SIZE = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-none',
} as const;

export function Container({ className, size = 'lg', ...rest }: ContainerProps): JSX.Element {
  return <div className={cn('mx-auto w-full px-4 sm:px-6', CONTAINER_SIZE[size], className)} {...rest} />;
}

export interface PageShellProps extends HTMLAttributes<HTMLDivElement> {
  withMesh?: boolean;
  withHeaderOffset?: boolean;
}

export function PageShell({ withMesh = true, withHeaderOffset = false, className, children, ...rest }: PageShellProps): JSX.Element {
  return (
    <div
      className={cn(
        'min-h-dvh w-full text-text-primary',
        withMesh && 'mesh-bg',
        withHeaderOffset && 'pt-[var(--header-h)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: BoxProps['gap'];
}

const COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-12',
} as const;

export function Grid({ className, cols = 3, gap = 4, ...rest }: GridProps): JSX.Element {
  return <div className={cn('grid', COLS[cols], GAP_CLASS[gap], className)} {...rest} />;
}

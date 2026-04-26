import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export type CardVariant = 'glass' | 'flat' | 'elevated';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

const VARIANTS: Record<CardVariant, string> = {
  glass: 'glass-card',
  flat: 'bg-bg-surface border border-border-default rounded-lg',
  elevated: 'bg-bg-elevated rounded-lg shadow-card',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant = 'glass', interactive, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'p-5 text-text-primary',
        VARIANTS[variant],
        interactive && 'cursor-pointer transition hover:-translate-y-0.5',
        className,
      )}
      {...rest}
    />
  );
});

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('mb-3', className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return <h3 className={cn('text-title font-semibold text-text-primary', className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): JSX.Element {
  return <p className={cn('text-small text-text-secondary', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('mt-4 flex items-center justify-end gap-2', className)} {...rest} />;
}

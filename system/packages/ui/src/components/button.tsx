import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
  iconOnly?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-700 shadow-sm focus-visible:ring-rose-500',
  secondary:
    'bg-bg-surface text-text-primary border border-border-default hover:bg-bg-elevated focus-visible:ring-sky-500',
  ghost:
    'text-text-primary hover:bg-bg-elevated focus-visible:ring-sky-500',
  danger:
    'bg-danger text-white hover:opacity-90 focus-visible:ring-danger',
  glass:
    'glass-subtle text-text-primary hover:bg-bg-overlay focus-visible:ring-sky-500',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-small rounded-full gap-1.5',
  md: 'h-10 px-5 text-body rounded-full gap-2',
  lg: 'h-12 px-7 text-body-lg rounded-full gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', asChild, loading, iconOnly, disabled, children, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  const classes = cn(
    'inline-flex items-center justify-center font-semibold tracking-tight select-none transition-all duration-150 ease-out [font-family:var(--font-button)]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
    'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]',
    VARIANTS[variant],
    SIZES[size],
    iconOnly && 'aspect-square px-0',
    className,
  );
  // When asChild, Radix Slot requires exactly ONE child element. Do not inject
  // sibling spinner nodes; instead pass the user's child element through and let
  // its own content stand. For the non-asChild path we keep the loading spinner.
  if (asChild) {
    return (
      <Comp
        ref={ref as never}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        className={classes}
        {...rest}
      >
        {children}
      </Comp>
    );
  }
  return (
    <Comp
      ref={ref as never}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </Comp>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, 'iconOnly'> {
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', variant = 'ghost', ...rest },
  ref,
) {
  return <Button ref={ref} iconOnly variant={variant} size={size} {...rest} />;
});

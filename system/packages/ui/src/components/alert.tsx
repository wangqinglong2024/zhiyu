import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<AlertTone, string> = {
  info: 'border-info/40 bg-info/10 text-info',
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  danger: 'border-danger/40 bg-danger/10 text-danger',
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone;
  title?: ReactNode;
  icon?: ReactNode;
}

export function Alert({ tone = 'info', title, icon, className, children, ...rest }: AlertProps): JSX.Element {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-small',
        TONE_CLASS[tone],
        className,
      )}
      {...rest}
    >
      {icon ? <span aria-hidden className="mt-0.5">{icon}</span> : null}
      <div className="flex-1 text-text-primary">
        {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
        <div className="text-text-secondary">{children}</div>
      </div>
    </div>
  );
}

export interface BannerProps extends AlertProps {
  onDismiss?: () => void;
}

export function Banner({ onDismiss, className, children, ...rest }: BannerProps): JSX.Element {
  return (
    <Alert
      className={cn('rounded-none border-x-0 px-4 py-2', className)}
      {...rest}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">{children}</div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="dismiss"
            className="rounded-md p-1 hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            ✕
          </button>
        ) : null}
      </div>
    </Alert>
  );
}

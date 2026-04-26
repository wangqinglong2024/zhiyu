import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  illustration?: 'inbox' | 'search' | 'error' | 'success';
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

const ILLUS: Record<NonNullable<EmptyStateProps['illustration']>, JSX.Element> = {
  inbox: (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden>
      <rect x="14" y="20" width="68" height="56" rx="10" fill="currentColor" opacity=".12" />
      <path d="M20 48l12 12h32l12-12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden>
      <circle cx="42" cy="42" r="22" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity=".08" />
      <path d="M58 58l16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden>
      <circle cx="48" cy="48" r="32" fill="currentColor" opacity=".12" />
      <path d="M36 36l24 24M60 36L36 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden>
      <circle cx="48" cy="48" r="32" fill="currentColor" opacity=".12" />
      <path d="M34 50l10 10 18-22" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function EmptyState({
  illustration = 'inbox',
  title,
  description,
  action,
  className,
  ...rest
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-16 text-center text-text-secondary', className)}
      {...rest}
    >
      <div className="text-text-tertiary">{ILLUS[illustration]}</div>
      <h3 className="mt-4 text-title font-semibold text-text-primary">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-body">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export interface ResultProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  status: 'success' | 'error' | 'info';
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
}

export function Result({ status, title, description, extra, className, ...rest }: ResultProps): JSX.Element {
  const illus = status === 'success' ? 'success' : status === 'error' ? 'error' : 'inbox';
  return (
    <EmptyState
      illustration={illus}
      title={title}
      description={description}
      action={extra}
      className={className}
      {...rest}
    />
  );
}

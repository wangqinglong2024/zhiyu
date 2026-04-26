import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = 'text', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-10 w-full rounded-md bg-bg-surface px-3 text-body text-text-primary',
        'border border-border-default placeholder:text-text-tertiary',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid && 'border-danger focus-visible:ring-danger',
        className,
      )}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex w-full rounded-md bg-bg-surface px-3 py-2 text-body text-text-primary',
        'border border-border-default placeholder:text-text-tertiary',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base resize-y',
        invalid && 'border-danger focus-visible:ring-danger',
        className,
      )}
      {...rest}
    />
  );
});

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...rest }: LabelProps): JSX.Element {
  return (
    <label className={cn('mb-1 inline-block text-small font-medium text-text-secondary', className)} {...rest}>
      {children}
      {required ? <span aria-hidden className="ms-1 text-danger">*</span> : null}
    </label>
  );
}

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxPrimitive.CheckboxProps>(function Checkbox(
  { className, ...rest },
  ref,
) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-5 w-5 shrink-0 rounded-md border border-border-strong bg-bg-surface',
        'data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 data-[state=checked]:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className,
      )}
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.5 8.5l3 3 6-6"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

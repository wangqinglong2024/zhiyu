import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export const Switch = forwardRef<HTMLButtonElement, SwitchPrimitive.SwitchProps>(function Switch(
  { className, ...rest },
  ref,
) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition',
        'data-[state=checked]:bg-rose-600 data-[state=unchecked]:bg-border-strong',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow ring-0 transition-transform data-[state=checked]:translate-x-[1.375rem]" />
    </SwitchPrimitive.Root>
  );
});

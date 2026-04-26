import * as RadioPrimitive from '@radix-ui/react-radio-group';
import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export const RadioGroup = RadioPrimitive.Root;

export const RadioItem = forwardRef<HTMLButtonElement, RadioPrimitive.RadioGroupItemProps>(function RadioItem(
  { className, ...rest },
  ref,
) {
  return (
    <RadioPrimitive.Item
      ref={ref}
      className={cn(
        'h-5 w-5 rounded-full border border-border-strong bg-bg-surface text-rose-600',
        'data-[state=checked]:border-rose-600',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className,
      )}
      {...rest}
    >
      <RadioPrimitive.Indicator className="flex h-full w-full items-center justify-center">
        <span className="block h-2.5 w-2.5 rounded-full bg-rose-600" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Item>
  );
});

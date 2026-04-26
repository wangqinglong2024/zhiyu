import * as PopoverPrimitive from '@radix-ui/react-popover';
import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = forwardRef<HTMLDivElement, PopoverPrimitive.PopoverContentProps>(
  function PopoverContent({ className, sideOffset = 6, ...rest }, ref) {
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          className={cn(
            'z-[var(--z-popover)] min-w-48 glass-elevated p-3 text-body text-text-primary',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            className,
          )}
          {...rest}
        />
      </PopoverPrimitive.Portal>
    );
  },
);

import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuLabel = DropdownPrimitive.Label;

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownPrimitive.DropdownMenuContentProps>(
  function DropdownMenuContent({ className, sideOffset = 6, ...rest }, ref) {
    return (
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          className={cn(
            'z-[var(--z-popover)] min-w-44 glass-elevated p-1 text-text-primary',
            className,
          )}
          {...rest}
        />
      </DropdownPrimitive.Portal>
    );
  },
);

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownPrimitive.DropdownMenuItemProps>(
  function DropdownMenuItem({ className, ...rest }, ref) {
    return (
      <DropdownPrimitive.Item
        ref={ref}
        className={cn(
          'flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-small outline-none',
          'data-[highlighted]:bg-bg-elevated data-[highlighted]:text-text-primary',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownPrimitive.DropdownMenuSeparatorProps>(
  function DropdownMenuSeparator({ className, ...rest }, ref) {
    return (
      <DropdownPrimitive.Separator
        ref={ref}
        className={cn('my-1 h-px bg-border-default', className)}
        {...rest}
      />
    );
  },
);

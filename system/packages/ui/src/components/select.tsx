import * as SelectPrimitive from '@radix-ui/react-select';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectPrimitive.SelectTriggerProps>(
  function SelectTrigger({ className, children, ...rest }, ref) {
    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-border-default bg-bg-surface px-3 text-body text-text-primary',
          'data-[placeholder]:text-text-tertiary',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...rest}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  },
);

export interface SelectContentProps extends SelectPrimitive.SelectContentProps {
  children: ReactNode;
}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(function SelectContent(
  { className, position = 'popper', children, ...rest },
  ref,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          'relative z-[var(--z-popover)] min-w-[8rem] overflow-hidden rounded-md glass-elevated p-1 text-body text-text-primary',
          className,
        )}
        {...rest}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<HTMLDivElement, SelectPrimitive.SelectItemProps>(function SelectItem(
  { className, children, ...rest },
  ref,
) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pe-2 ps-8 text-small outline-none',
        'data-[highlighted]:bg-bg-elevated data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    >
      <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path d="M3.5 8.5l3 3 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<HTMLDivElement, TabsPrimitive.TabsListProps>(function TabsList(
  { className, ...rest },
  ref,
) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1 rounded-full glass-subtle p-1',
        className,
      )}
      {...rest}
    />
  );
});

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsPrimitive.TabsTriggerProps>(function TabsTrigger(
  { className, ...rest },
  ref,
) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-small font-medium text-text-secondary transition-colors',
        'data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        className,
      )}
      {...rest}
    />
  );
});

export const TabsContent = TabsPrimitive.Content;

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps): JSX.Element {
  return (
    <TooltipRoot delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-[var(--z-tooltip)] glass-floating px-3 py-1.5 text-small text-text-primary border border-glass-border',
            'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-glass-border" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipRoot>
  );
}

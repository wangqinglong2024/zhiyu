import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  side?: DrawerSide;
  title?: ReactNode;
}

const SIDE_CLASS: Record<DrawerSide, string> = {
  left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-e',
  right: 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-s',
  top: 'inset-x-0 top-0 h-1/2 max-h-[80vh] border-b',
  bottom: 'inset-x-0 bottom-0 h-1/2 max-h-[80vh] border-t',
};

export function DrawerContent({
  className,
  side = 'right',
  title,
  children,
  ...rest
}: DrawerContentProps): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-black/40" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-[var(--z-modal)] glass-elevated p-5 text-text-primary border-glass-border',
          SIDE_CLASS[side],
          className,
        )}
        {...rest}
      >
        {title ? (
          <DialogPrimitive.Title className="text-title mb-3 font-semibold">{title}</DialogPrimitive.Title>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

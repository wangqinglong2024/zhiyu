import * as DialogPrimitive from '@radix-ui/react-dialog';
import { type ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

export interface ModalContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  /** Width preset, default `md` (480px). */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
} as const;

export function ModalContent({
  className,
  title,
  description,
  children,
  size = 'md',
  ...rest
}: ModalContentProps): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-[var(--z-modal)] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
          'glass-elevated p-6 text-text-primary',
          SIZES[size],
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          className,
        )}
        {...rest}
      >
        {title ? (
          <DialogPrimitive.Title className="text-h3 font-semibold mb-2">{title}</DialogPrimitive.Title>
        ) : null}
        {description ? (
          <DialogPrimitive.Description className="text-body text-text-secondary mb-4">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

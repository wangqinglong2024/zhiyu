import { Toaster as SonnerToaster, toast as sonnerToast, type ToasterProps } from 'sonner';
import { useTheme } from '../theme/theme-provider.js';
import { cn } from '../lib/cn.js';

export type ToastFn = typeof sonnerToast;
export const toast: ToastFn = sonnerToast;

export interface ToasterRootProps extends Omit<ToasterProps, 'theme'> {
  className?: string;
}

export function Toaster({ className, position = 'top-center', richColors = true, ...rest }: ToasterRootProps): JSX.Element {
  const { resolved } = useTheme();
  return (
    <SonnerToaster
      theme={resolved}
      position={position}
      richColors={richColors}
      className={cn('z-[var(--z-toast)]', className)}
      toastOptions={{
        classNames: {
          toast: 'glass-elevated text-text-primary border border-glass-border',
          title: 'text-body font-semibold',
          description: 'text-small text-text-secondary',
          actionButton: 'bg-rose-600 text-white',
        },
      }}
      {...rest}
    />
  );
}

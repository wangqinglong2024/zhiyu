import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export const Avatar = forwardRef<HTMLSpanElement, AvatarPrimitive.AvatarProps & { size?: number }>(
  function Avatar({ className, size = 40, style, ...rest }, ref) {
    return (
      <AvatarPrimitive.Root
        ref={ref}
        style={{ width: size, height: size, ...style }}
        className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full bg-bg-elevated', className)}
        {...rest}
      />
    );
  },
);

export const AvatarImage = forwardRef<HTMLImageElement, AvatarPrimitive.AvatarImageProps>(
  function AvatarImage({ className, ...rest }, ref) {
    return <AvatarPrimitive.Image ref={ref} className={cn('h-full w-full object-cover', className)} {...rest} />;
  },
);

export const AvatarFallback = forwardRef<HTMLSpanElement, AvatarPrimitive.AvatarFallbackProps>(
  function AvatarFallback({ className, ...rest }, ref) {
    return (
      <AvatarPrimitive.Fallback
        ref={ref}
        className={cn('flex h-full w-full items-center justify-center text-small font-medium text-text-secondary', className)}
        {...rest}
      />
    );
  },
);

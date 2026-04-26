import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { className, orientation = 'horizontal', ...rest },
  ref,
) {
  return (
    <hr
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'border-0 bg-border-default',
        orientation === 'horizontal' ? 'h-px w-full' : 'mx-2 h-full w-px self-stretch',
        className,
      )}
      {...rest}
    />
  );
});

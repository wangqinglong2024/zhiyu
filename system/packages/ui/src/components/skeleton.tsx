import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

export type SkeletonShape = 'rect' | 'circle' | 'line';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShape;
  width?: number | string;
  height?: number | string;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, shape = 'rect', width, height, style, ...rest },
  ref,
) {
  const computed: React.CSSProperties = {
    width,
    height: height ?? (shape === 'line' ? '0.875rem' : undefined),
    ...style,
  };
  return (
    <div
      ref={ref}
      role="status"
      aria-label="loading"
      style={computed}
      className={cn(
        'relative overflow-hidden bg-bg-elevated',
        shape === 'circle' && 'rounded-full',
        shape === 'rect' && 'rounded-md',
        shape === 'line' && 'rounded',
        className,
      )}
      {...rest}
    >
      <div
        aria-hidden
        className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]"
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  );
});

import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn.ts';

type Props = InputHTMLAttributes<HTMLInputElement>;
export function Input({ className, ...rest }: Props) {
  return <input {...rest} className={cn('zy-input', className)} />;
}

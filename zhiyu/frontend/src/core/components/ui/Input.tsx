import { type InputHTMLAttributes, type FC, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input: FC<InputProps> = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`glass-input w-full px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1 px-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

import { type TextareaHTMLAttributes, type FC, forwardRef } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
}

export const TextArea: FC<TextAreaProps> = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, label, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`glass-input w-full px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-y min-h-[80px] ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1 px-1">{error}</p>}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

import { type FC, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: Option[]
  label?: string
  error?: string
  placeholder?: string
}

export const Select: FC<SelectProps> = ({
  options,
  label,
  error,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={`glass-input w-full px-4 py-3 pr-10 text-sm text-[var(--text-primary)] appearance-none ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 px-1">{error}</p>}
    </div>
  )
}

Select.displayName = 'Select'

import { type FC, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Checkbox: FC<CheckboxProps> = ({ label, className = '', id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <label htmlFor={inputId} className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <span className="relative w-5 h-5">
        <input
          type="checkbox"
          id={inputId}
          className="peer sr-only"
          {...props}
        />
        <span className="absolute inset-0 rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm transition-all duration-200 peer-checked:bg-[var(--color-rose-primary)] peer-checked:border-[var(--color-rose-primary)] peer-disabled:opacity-45" />
        <Check
          size={14}
          className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150"
        />
      </span>
      {label && <span className="text-sm text-[var(--text-primary)]">{label}</span>}
    </label>
  )
}

Checkbox.displayName = 'Checkbox'

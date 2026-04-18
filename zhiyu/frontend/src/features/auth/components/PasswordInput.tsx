import { type FC, useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  id?: string
}

export const PasswordInput: FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = '密码',
  error,
  disabled,
  id,
}) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={`glass-input pr-12 ${error ? 'border-red-500' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e: FormEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
        disabled={disabled}
        autoComplete="current-password"
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
        aria-label={visible ? '隐藏密码' : '显示密码'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      {error && <p className="text-red-500 text-xs mt-1 px-1">{error}</p>}
    </div>
  )
}

PasswordInput.displayName = 'PasswordInput'

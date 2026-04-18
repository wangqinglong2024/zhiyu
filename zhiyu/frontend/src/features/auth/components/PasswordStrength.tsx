import type { FC } from 'react'

interface PasswordStrengthProps {
  password: string
}

function getStrength(pw: string): { level: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++

  if (score <= 1) return { level: 1, label: '弱', color: 'bg-red-500' }
  if (score <= 3) return { level: 2, label: '中', color: 'bg-[var(--color-accent-amber)]' }
  return { level: 3, label: '强', color: 'bg-green-500' }
}

export const PasswordStrength: FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null
  const { level, label, color } = getStrength(password)

  return (
    <div className="flex items-center gap-2 mt-1 px-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i <= level ? color : 'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
    </div>
  )
}

PasswordStrength.displayName = 'PasswordStrength'

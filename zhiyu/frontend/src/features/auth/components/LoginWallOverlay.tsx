import type { FC, ReactNode } from 'react'
import { Lock } from 'lucide-react'

interface LoginWallOverlayProps {
  children: ReactNode
  locked?: boolean
  onUnlock?: () => void
  label?: string
}

export const LoginWallOverlay: FC<LoginWallOverlayProps> = ({
  children,
  locked = false,
  onUnlock,
  label = '登录解锁',
}) => {
  if (!locked) return <>{children}</>

  return (
    <div className="relative" onClick={onUnlock} role="button" tabIndex={0} aria-label={label}>
      <div className="pointer-events-none select-none opacity-50 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-primary)]/40 backdrop-blur-[2px] rounded-[inherit] cursor-pointer">
        <Lock size={20} className="text-[var(--color-accent-rose)] mb-1" />
        <span className="text-xs font-medium text-[var(--color-accent-rose)]">{label}</span>
      </div>
    </div>
  )
}

LoginWallOverlay.displayName = 'LoginWallOverlay'

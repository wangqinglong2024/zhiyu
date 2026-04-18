import type { FC } from 'react'

interface TabBadgeProps {
  count?: number
  dot?: boolean
}

export const TabBadge: FC<TabBadgeProps> = ({ count, dot }) => {
  if (dot) {
    return (
      <span
        className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[var(--color-accent-rose)]"
        aria-hidden="true"
      />
    )
  }

  if (!count || count <= 0) return null

  const display = count > 99 ? '99+' : String(count)

  return (
    <span
      className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[var(--color-accent-rose)] text-white text-[10px] font-medium leading-none"
      aria-label={`${count}条通知`}
    >
      {display}
    </span>
  )
}

TabBadge.displayName = 'TabBadge'

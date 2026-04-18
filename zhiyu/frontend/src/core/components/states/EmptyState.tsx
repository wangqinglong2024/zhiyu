import type { FC, ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: FC<EmptyStateProps> = ({
  title = '暂无内容',
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="text-[var(--color-text-tertiary)] mb-4">
        {icon || <Inbox size={48} strokeWidth={1} />}
      </div>
      <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] text-center">{description}</p>
      )}
      {action && (
        <button className="btn-primary mt-5 px-6" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}

EmptyState.displayName = 'EmptyState'

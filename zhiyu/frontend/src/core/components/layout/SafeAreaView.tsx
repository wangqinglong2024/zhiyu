import { type FC, type ReactNode } from 'react'

interface SafeAreaViewProps {
  children: ReactNode
  top?: boolean
  bottom?: boolean
  className?: string
}

export const SafeAreaView: FC<SafeAreaViewProps> = ({
  children,
  top = true,
  bottom = true,
  className = '',
}) => {
  return (
    <div
      className={className}
      style={{
        paddingTop: top ? 'env(safe-area-inset-top, 0px)' : undefined,
        paddingBottom: bottom ? 'env(safe-area-inset-bottom, 0px)' : undefined,
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {children}
    </div>
  )
}

SafeAreaView.displayName = 'SafeAreaView'

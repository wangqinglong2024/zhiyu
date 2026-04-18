import { type FC, type ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export const PageContainer: FC<PageContainerProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <main
      className={`mx-auto w-full max-w-[480px] min-h-screen md:max-w-[720px] lg:max-w-[480px] ${
        noPadding ? '' : 'px-4'
      } ${className}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {children}
    </main>
  )
}

PageContainer.displayName = 'PageContainer'

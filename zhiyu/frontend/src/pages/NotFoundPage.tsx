import type { FC } from 'react'
import { Link } from 'react-router-dom'

export const NotFoundPage: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-6xl font-bold tracking-tight mb-4">404</h1>
        <p className="text-base opacity-70 mb-6">页面不存在</p>
        <Link to="/" className="btn-primary px-6 py-2">
          返回首页
        </Link>
      </div>
    </div>
  )
}

NotFoundPage.displayName = 'NotFoundPage'

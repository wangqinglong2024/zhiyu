import type { FC } from 'react'

export const HomePage: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          知语 Zhiyu
        </h1>
        <p className="text-base opacity-70">
          中文学习平台 · 基础架构搭建中
        </p>
      </div>
    </div>
  )
}

HomePage.displayName = 'HomePage'

import type { FC } from 'react'

/**
 * 装饰性浮动玻璃方块 — 用于空状态或登录注册页
 * 3~4 个绝对定位 + 错开延迟的浮动方块
 */
export const GlassDecorBlocks: FC = () => {
  return (
    <>
      <div
        className="glass-decor animate-float-slow absolute w-16 h-16 opacity-60"
        style={{ top: '15%', right: '10%', animationDelay: '0s' }}
        aria-hidden="true"
      />
      <div
        className="glass-decor animate-float-slow absolute w-12 h-12 opacity-40"
        style={{ top: '60%', left: '8%', animationDelay: '2s' }}
        aria-hidden="true"
      />
      <div
        className="glass-decor animate-float-slow absolute w-20 h-20 opacity-50"
        style={{ bottom: '20%', right: '15%', animationDelay: '4s' }}
        aria-hidden="true"
      />
      <div
        className="glass-decor animate-float-slow absolute w-10 h-10 opacity-30"
        style={{ top: '35%', left: '25%', animationDelay: '6s' }}
        aria-hidden="true"
      />
    </>
  )
}

GlassDecorBlocks.displayName = 'GlassDecorBlocks'

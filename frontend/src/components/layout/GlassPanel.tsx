/**
 * 毛玻璃面板通用组件（三层深度）
 * level 1（默认）：卡片底层 — surface-1，blur 20px
 * level 2：浮层/hover   — surface-2，blur 24px
 * level 3：模态框       — surface-3，blur 32px
 */
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  level?: 1 | 2 | 3
  className?: string
  hover?: boolean          // 是否启用 hover 增强
  onClick?: () => void
  as?: 'div' | 'article' | 'section'
}

const levelClass: Record<1 | 2 | 3, string> = {
  1: 'glass-card',
  2: 'glass-elevated',
  3: 'glass-elevated',
}

export default function GlassPanel({
  children,
  level = 1,
  className = '',
  hover = false,
  onClick,
}: Props) {
  const cls = [
    levelClass[level],
    hover ? 'hover:-translate-y-1' : '',
    onClick ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ')

  if (onClick) {
    return (
      <motion.div
        className={cls}
        onClick={onClick}
        whileTap={{ scale: 0.985, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={cls}>{children}</div>
}

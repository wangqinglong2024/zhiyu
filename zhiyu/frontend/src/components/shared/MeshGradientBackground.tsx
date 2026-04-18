import type { FC } from 'react'

/**
 * 渐变网格 Blob 背景 — Z 层级 z-[-20]（最底层）
 * 3 个带 blur(100px) 的巨型模糊 Blob 组成动态渐变背景
 */
export const MeshGradientBackground: FC = () => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden" aria-hidden="true">
      {/* Blob 1: Rose */}
      <div
        className="mesh-blob-1 absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'var(--mesh-color-1)',
          opacity: 'var(--mesh-opacity)',
          filter: 'blur(100px)',
          top: '-10%',
          left: '-5%',
        }}
      />
      {/* Blob 2: Sky */}
      <div
        className="mesh-blob-2 absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'var(--mesh-color-2)',
          opacity: 'var(--mesh-opacity)',
          filter: 'blur(100px)',
          top: '40%',
          right: '-10%',
        }}
      />
      {/* Blob 3: Amber */}
      <div
        className="mesh-blob-3 absolute w-[450px] h-[450px] rounded-full"
        style={{
          background: 'var(--mesh-color-3)',
          opacity: 'var(--mesh-opacity)',
          filter: 'blur(100px)',
          bottom: '-5%',
          left: '30%',
        }}
      />
    </div>
  )
}

MeshGradientBackground.displayName = 'MeshGradientBackground'

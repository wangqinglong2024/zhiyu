/**
 * 全局动态渐变网格背景
 * Rose + Sky + Amber 三色 Blob，filter: blur(100px)
 * 每个 Blob 20~25s 超长周期缓慢漂移
 * fixed 定位 z-index: 0（最底层），不遮挡任何业务内容
 */
export default function MeshBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: 'var(--bg)',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Blob 1：Rose，左上 */}
      <div
        style={{
          position: 'absolute',
          width: '75vw',
          height: '65vh',
          top: '-20vh',
          left: '-15vw',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, var(--mesh-color-1) 0%, transparent 70%)`,
          opacity: 'var(--mesh-opacity-1)',
          filter: 'blur(100px)',
          willChange: 'transform',
          animation: 'mesh-drift-1 22s ease-in-out infinite',
        }}
      />

      {/* Blob 2：Sky，右上 */}
      <div
        style={{
          position: 'absolute',
          width: '65vw',
          height: '60vh',
          top: '-10vh',
          right: '-15vw',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, var(--mesh-color-2) 0%, transparent 70%)`,
          opacity: 'var(--mesh-opacity-2)',
          filter: 'blur(100px)',
          willChange: 'transform',
          animation: 'mesh-drift-2 25s ease-in-out infinite',
        }}
      />

      {/* Blob 3：Amber，底部中央 */}
      <div
        style={{
          position: 'absolute',
          width: '70vw',
          height: '60vh',
          bottom: '-22vh',
          left: '10vw',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, var(--mesh-color-3) 0%, transparent 70%)`,
          opacity: 'var(--mesh-opacity-3)',
          filter: 'blur(100px)',
          willChange: 'transform',
          animation: 'mesh-drift-3 20s ease-in-out infinite',
        }}
      />

      {/* 四周暗化压感（深色模式下突出中央内容区） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 25%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </div>
  )
}

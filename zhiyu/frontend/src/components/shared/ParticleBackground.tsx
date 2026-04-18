import { useEffect, useRef, useState, type FC } from 'react'
import * as THREE from 'three'

// 粒子颜色池：Rose/Sky/Amber
const PARTICLE_COLORS = [
  new THREE.Color('#e11d48'),  // Rose
  new THREE.Color('#fda4af'),  // Rose Light
  new THREE.Color('#0284c7'),  // Sky
  new THREE.Color('#7dd3fc'),  // Sky Light
  new THREE.Color('#d97706'),  // Amber
  new THREE.Color('#fde68a'),  // Amber Light
]

interface ParticleData {
  velocity: THREE.Vector3
  targetVelocity: THREE.Vector3
  changeTimer: number
  changeDuration: number
}

/**
 * Three.js 粒子背景组件
 * Z 层级：z-[-10]（渐变网格之上，业务内容之下）
 * 性能红线：帧率 ≥ 30fps，低性能设备自动关闭
 */
export const ParticleBackground: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDisabled, setIsDisabled] = useState(false)

  useEffect(() => {
    // 性能检测：低性能设备完全关闭
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency < 4) {
      setIsDisabled(true)
      return
    }

    // 尊重减少动画偏好
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsDisabled(true)
      return
    }

    const container = containerRef.current
    if (!container) return

    const width = window.innerWidth
    const height = window.innerHeight
    const isMobile = width < 768

    // 粒子数量：桌面 80~120，移动 30~50
    const particleCount = isMobile
      ? Math.floor(Math.random() * 21) + 30
      : Math.floor(Math.random() * 41) + 80

    // ===== 场景 =====
    const scene = new THREE.Scene()

    // ===== 相机（正交投影） =====
    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      0.1, 1000
    )
    camera.position.z = 100

    // ===== 渲染器（透明背景） =====
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,  // 性能优化：粒子不需要抗锯齿
      powerPreference: 'low-power',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // ===== 创建粒子 =====
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const particleDataList: ParticleData[] = []

    for (let i = 0; i < particleCount; i++) {
      // 随机位置
      positions[i * 3] = (Math.random() - 0.5) * width
      positions[i * 3 + 1] = (Math.random() - 0.5) * height
      positions[i * 3 + 2] = 0

      // 随机颜色
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]!
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      // 随机大小：1~3px（移动端 1~2px）
      sizes[i] = isMobile
        ? Math.random() + 1
        : Math.random() * 2 + 1

      // 布朗运动数据
      particleDataList.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          0
        ),
        targetVelocity: new THREE.Vector3(),
        changeTimer: 0,
        changeDuration: Math.random() * 2 + 3, // 3~5 秒
      })
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // 粒子材质
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: isMobile ? 0.4 : 0.5,
      sizeAttenuation: false,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // ===== 动画循环 =====
    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const posAttr = geometry.attributes.position as THREE.BufferAttribute
      const posArray = posAttr.array as Float32Array

      for (let i = 0; i < particleCount; i++) {
        const data = particleDataList[i]!
        data.changeTimer += delta

        // 到达变向时间，生成新的目标速度（布朗运动）
        if (data.changeTimer >= data.changeDuration) {
          data.targetVelocity.set(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            0
          )
          data.changeTimer = 0
          data.changeDuration = Math.random() * 2 + 3
        }

        // 平滑过渡到目标速度（ease-in-out 效果）
        const t = 0.02
        data.velocity.lerp(data.targetVelocity, t)

        // 更新位置
        const ix = i * 3
        const iy = i * 3 + 1
        posArray[ix] = (posArray[ix] ?? 0) + data.velocity.x
        posArray[iy] = (posArray[iy] ?? 0) + data.velocity.y

        // 边界环绕
        const halfW = width / 2
        const halfH = height / 2
        if (posArray[ix]! > halfW) posArray[ix] = -halfW
        if (posArray[ix]! < -halfW) posArray[ix] = halfW
        if (posArray[iy]! > halfH) posArray[iy] = -halfH
        if (posArray[iy]! < -halfH) posArray[iy] = halfH
      }

      posAttr.needsUpdate = true
      renderer.render(scene, camera)
    }

    animate()

    // ===== 响应式 =====
    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.left = -w / 2
      camera.right = w / 2
      camera.top = h / 2
      camera.bottom = -h / 2
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    // ===== 清理（防止 WebGL 上下文泄漏） =====
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  if (isDisabled) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  )
}

ParticleBackground.displayName = 'ParticleBackground'

/**
 * Three.js 粒子层
 * z-index: 1，叠于 MeshBackground（z:0）之上，低于业务内容（z:2+）
 * Canvas 完全透明（alpha: true），不遮挡底层渐变
 * 粒子颜色：Rose / Sky / Amber 三色混合
 *
 * 注意：attribute 名称使用 aColor / aSize 避免与 Three.js
 * 内建 'color' / 'size' uniform/attribute 命名冲突
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 260

export default function ParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* ── Renderer：alpha:true 保证背景完全透明 ── */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    )
    camera.position.z = 4

    /* ── 粒子几何体 ── */
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const aColors   = new Float32Array(PARTICLE_COUNT * 3)
    const aSizes    = new Float32Array(PARTICLE_COUNT)

    // Rose: #fda4af  Sky: #38bdf8  Amber: #fde68a
    const palette = [
      new THREE.Color('#fda4af'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#fde68a'),
      new THREE.Color('#fb7185'),
      new THREE.Color('#7dd3fc'),
    ]

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 9
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3

      const c = palette[Math.floor(Math.random() * palette.length)]
      aColors[i * 3]     = c.r
      aColors[i * 3 + 1] = c.g
      aColors[i * 3 + 2] = c.b

      aSizes[i] = Math.random() * 2.2 + 0.8
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aColor',   new THREE.BufferAttribute(aColors,   3))
    geometry.setAttribute('aSize',    new THREE.BufferAttribute(aSizes,    1))

    /* ── ShaderMaterial：自定义 aColor / aSize，避免与 Three.js 内建名冲突 ── */
    const material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        attribute float aSize;
        attribute vec3  aColor;
        varying   vec3  vColor;

        void main() {
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (200.0 / -mvPosition.z);
          gl_Position  = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vColor;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.25, 0.5, d)) * 0.52;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent:  true,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
      // 不设 vertexColors:true，由自定义 aColor 属性完全接管颜色
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    /* ── 动画：缓慢旋转 ── */
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      points.rotation.y += 0.00011
      points.rotation.x += 0.000055
      renderer.render(scene, camera)
    }
    animate()

    /* ── 响应式 ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        1,
        pointerEvents: 'none',
        width:         '100%',
        height:        '100%',
        display:       'block',
      }}
    />
  )
}

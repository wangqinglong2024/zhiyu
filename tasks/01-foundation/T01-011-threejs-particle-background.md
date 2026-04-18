# T01-011: Three.js 粒子背景组件

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 3

## 需求摘要

实现基于 Three.js 的粒子背景组件 `<ParticleBackground />`。粒子层叠加在渐变网格 Blob 之上、业务内容之下（Z 轴中间层）。粒子从 Rose/Sky/Amber 三色中随机选取，执行布朗运动。需严格遵守 `grules/01-rules.md` 中的性能红线：桌面端 80~120 个粒子、移动端 30~50 个、Canvas 帧率不低于 30fps、低性能设备完全关闭。

## 相关上下文

- 架构白皮书: `grules/01-rules.md` §一 — Three.js 粒子层技术规格（**核心依据**）
- 设计规范: `grules/06-ui-design.md` §一 — 设计哲学（物理隐喻、即时反馈）
- 项目结构: `grules/02-project-structure.md` — `src/components/shared/` 目录
- 关联任务: 前置 T01-010（设计系统和 Z 轴分层） → 后续 T01-012（集成验证）

## 技术方案

### Three.js 粒子规格（强制复制自 grules/01-rules.md）

| 参数 | 桌面端 | 移动端 (< 768px) |
|------|--------|----------------|
| 粒子数量 | 80~120 | 30~50 |
| 粒子大小 | 1~3px 随机 | 1~2px 随机 |
| 粒子颜色 | Rose/Sky/Amber 三色随机 | 同左 |
| 粒子透明度 | 0.3~0.6 | 0.3~0.5 |
| 运动模式 | 布朗运动 (random walk) | 同左 |
| 运动周期 | 3~5 秒 | 同左 |
| 缓动 | ease-in-out | 同左 |
| 相机 | OrthographicCamera | 同左 |
| Canvas 背景 | alpha: true（透明） | 同左 |
| 帧率红线 | ≥ 30fps | ≥ 30fps |
| 关闭条件 | — | `navigator.hardwareConcurrency < 4` |

### frontend/src/components/shared/ParticleBackground.tsx

```tsx
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
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
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
      const posArray = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < particleCount; i++) {
        const data = particleDataList[i]
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
        posArray[i * 3] += data.velocity.x
        posArray[i * 3 + 1] += data.velocity.y

        // 边界环绕
        const halfW = width / 2
        const halfH = height / 2
        if (posArray[i * 3] > halfW) posArray[i * 3] = -halfW
        if (posArray[i * 3] < -halfW) posArray[i * 3] = halfW
        if (posArray[i * 3 + 1] > halfH) posArray[i * 3 + 1] = -halfH
        if (posArray[i * 3 + 1] < -halfH) posArray[i * 3 + 1] = halfH
      }

      geometry.attributes.position.needsUpdate = true
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
```

### 依赖安装

```bash
npm install three@^0.160.0
npm install -D @types/three
```

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Three.js 版本 | ^0.160.0 | grules/01-rules.md 锁定版本 |
| 渲染方式 | 原生 Three.js（非 R3F） | 粒子背景简单，不需要 React 声明式 API 的开销 |
| 相机类型 | OrthographicCamera | 2D 粒子场景，无透视畸变 |
| 抗锯齿 | false | 粒子点无需抗锯齿，节省 GPU |
| powerPreference | low-power | 节省电池，背景特效不需要高性能 GPU |
| 像素比 | min(devicePixelRatio, 2) | 高 DPI 屏幕限制上限，防止性能暴跌 |

## 范围（做什么）

- 安装 `three@^0.160.0` 和 `@types/three`
- 实现 `ParticleBackground.tsx` 组件
- 集成到 `App.tsx`（放在 MeshGradientBackground 和业务内容之间）
- 实现性能检测和自动关闭逻辑
- 实现 resize 响应式
- 实现组件卸载时 WebGL 上下文清理

## 边界（不做什么）

- 不使用 `@react-three/fiber`（简单场景不需要）
- 不实现鼠标交互/粒子跟随效果
- 不实现粒子连线效果

## 涉及文件

- 新建: `zhiyu/frontend/src/components/shared/ParticleBackground.tsx`
- 修改: `zhiyu/frontend/package.json`（添加 three 依赖）
- 修改: `zhiyu/frontend/src/App.tsx`（挂载 ParticleBackground）

## 依赖

- 前置: T01-010（设计系统提供色彩变量和 Z 轴分层约定）
- 后续: T01-012（集成验证完整视觉效果）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 前端页面加载完成  
   **WHEN** 观察背景  
   **THEN** 可见粒子在渐变网格之上缓慢随机移动

2. **GIVEN** 桌面端浏览器 (width ≥ 768px)  
   **WHEN** 统计 Canvas 上粒子数量  
   **THEN** 数量在 80~120 范围内

3. **GIVEN** 移动端浏览器 (width < 768px)  
   **WHEN** 统计粒子数量  
   **THEN** 数量在 30~50 范围内

4. **GIVEN** 粒子层 Canvas  
   **WHEN** 检查背景  
   **THEN** Canvas 背景完全透明（alpha: true），能看到底层渐变网格

5. **GIVEN** 粒子颜色  
   **WHEN** 观察粒子  
   **THEN** 仅使用 Rose/Sky/Amber 系列颜色，无紫色

6. **GIVEN** 低性能设备 (`navigator.hardwareConcurrency < 4`)  
   **WHEN** 页面加载  
   **THEN** ParticleBackground 不渲染（返回 null）

7. **GIVEN** 用户设置 `prefers-reduced-motion: reduce`  
   **WHEN** 页面加载  
   **THEN** 粒子层不渲染

8. **GIVEN** 组件被卸载（页面路由切换）  
   **WHEN** 检查 WebGL 上下文  
   **THEN** `renderer.dispose()` 被调用，无内存泄漏

9. **GIVEN** 页面全屏运行  
   **WHEN** 检查帧率  
   **THEN** Canvas 帧率 ≥ 30fps（性能红线）

10. **GIVEN** Z 轴分层  
    **WHEN** 检查粒子层 z-index  
    **THEN** 粒子层在 Blob 背景之上 (z-[-10])、业务内容之下 (z-[0])

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动
2. Browser MCP 导航到 `http://localhost:3100`
3. Browser MCP 截图 — 验证粒子可见
4. Browser MCP 检查控制台 — 无 WebGL 错误
5. Browser MCP 在 375px 宽度截图 — 验证移动端粒子减少
6. 检查 Z 轴层叠：Blob → 粒子 → 内容

### 测试通过标准

- [ ] 粒子可见且运动
- [ ] Canvas 背景透明
- [ ] 粒子颜色仅 Rose/Sky/Amber
- [ ] 移动端粒子数量减少
- [ ] Z 轴分层正确
- [ ] 控制台无 WebGL 错误
- [ ] 组件卸载清理正常

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新全量验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-011-threejs-particle-background.md`

## 自检重点

- [ ] 版本：Three.js ^0.160.0
- [ ] 性能：帧率 ≥ 30fps，低性能设备关闭
- [ ] 内存：组件卸载清理 renderer.dispose()
- [ ] 无障碍：aria-hidden="true"、prefers-reduced-motion
- [ ] 安全：pointer-events: none（不阻挡用户交互）

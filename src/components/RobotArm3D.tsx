import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { RobotAction } from '../data/scenario'

type RobotArm3DProps = {
  action: RobotAction
  running: boolean
  visible: boolean
}

/** WebGL 不可用时的降级面板：只降级 3D 画布，轨迹图与指标照常显示 */
export function RobotArmFallback({ action }: { action: RobotAction }) {
  return (
    <div className="robot3d-shell robot3d-fallback">
      <div className="robot3d-fallback-body">
        <strong>3D 仿真已降级</strong>
        <p>当前浏览器未启用 WebGL（常见于关闭了硬件加速）。下方目标 / 实际轨迹、控制误差与抓握力度不受影响。</p>
      </div>
      <span className="robot3d-action-chip">{action}</span>
    </div>
  )
}

type Pose = {
  shoulder: number
  elbow: number
  wrist: number
  grip: number
}

function poseFor(action: RobotAction, t: number): Pose {
  const wave = (Math.sin(t) + 1) / 2

  if (action === '肩部辅助抬升') {
    return { shoulder: -0.12 + wave * 0.7, elbow: 0.28, wrist: 0.1, grip: 0.35 }
  }

  if (action === '肘部屈伸') {
    return { shoulder: 0.24, elbow: 0.16 + wave * 1.18, wrist: 0.12, grip: 0.4 }
  }

  if (action === '手部抓握') {
    return { shoulder: 0.16, elbow: 0.52, wrist: 0.1, grip: 0.12 + wave * 0.82 }
  }

  const slow = (Math.sin(t * 0.5) + 1) / 2
  return { shoulder: -0.3 + slow * 0.08, elbow: 0.22 + slow * 0.06, wrist: 0.04, grip: 0.2 }
}

function lerpPose(a: Pose, b: Pose, k: number): Pose {
  return {
    shoulder: a.shoulder + (b.shoulder - a.shoulder) * k,
    elbow: a.elbow + (b.elbow - a.elbow) * k,
    wrist: a.wrist + (b.wrist - a.wrist) * k,
    grip: a.grip + (b.grip - a.grip) * k,
  }
}

export function RobotArm3D({ action, running, visible }: RobotArm3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ action, running, visible })
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    stateRef.current = { action, running, visible }
  }, [action, running, visible])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60)
    camera.position.set(4.6, 3.1, 5.6)

    // WebGL 被禁用 / 驱动黑名单拦截时，three.js 会在构造函数里抛错。
    // 不接住的话异常会冲出 effect，整个 React 树被卸载 —— 演示现场直接白屏。
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch (error) {
      console.warn('WebGL 不可用，3D 机械臂降级为静态面板：', error)
      setWebglFailed(true)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0.6, 1.65, 0)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minPolarAngle = 0.7
    controls.maxPolarAngle = 1.5
    // 单指手势映射到已禁用的 PAN（即无操作），移动端单指滑动交还给页面滚动，双指才旋转视角
    controls.touches.ONE = THREE.TOUCH.PAN
    controls.touches.TWO = THREE.TOUCH.ROTATE
    renderer.domElement.style.touchAction = 'pan-y'

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbcd8e8, 1.15))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0x7c6cf0, 0.4)
    rimLight.position.set(-5, 3, -4)
    scene.add(rimLight)

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf6fafc, roughness: 0.5, metalness: 0.12 })
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x4fb6e6, roughness: 0.35, metalness: 0.35 })
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x7c6cf0, roughness: 0.4, metalness: 0.3 })
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x2c4a5a, roughness: 0.6, metalness: 0.2 })

    const grid = new THREE.GridHelper(6, 14, 0xa8cde2, 0xd3e7f2)
    grid.position.y = 0
    scene.add(grid)

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.12, 40), bodyMat)
    plate.position.y = 0.06
    scene.add(plate)

    const plateRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 12, 48), jointMat)
    plateRing.rotation.x = Math.PI / 2
    plateRing.position.y = 0.13
    scene.add(plateRing)

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.35, 24), bodyMat)
    column.position.y = 0.8
    scene.add(column)

    const columnBand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24), accentMat)
    columnBand.position.y = 1.05
    scene.add(columnBand)

    const shoulderGroup = new THREE.Group()
    shoulderGroup.position.set(0, 1.52, 0)
    scene.add(shoulderGroup)

    const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 28), jointMat)
    shoulderGroup.add(shoulderJoint)

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 1.3, 20), bodyMat)
    upperArm.rotation.z = -Math.PI / 2
    upperArm.position.x = 0.65
    shoulderGroup.add(upperArm)

    const upperBand = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.08, 20), accentMat)
    upperBand.rotation.z = -Math.PI / 2
    upperBand.position.x = 1.0
    shoulderGroup.add(upperBand)

    const elbowGroup = new THREE.Group()
    elbowGroup.position.x = 1.3
    shoulderGroup.add(elbowGroup)

    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.18, 26, 26), jointMat)
    elbowGroup.add(elbowJoint)

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.05, 20), bodyMat)
    forearm.rotation.z = -Math.PI / 2
    forearm.position.x = 0.52
    elbowGroup.add(forearm)

    const wristGroup = new THREE.Group()
    wristGroup.position.x = 1.05
    elbowGroup.add(wristGroup)

    const wristJoint = new THREE.Mesh(new THREE.SphereGeometry(0.12, 22, 22), jointMat)
    wristGroup.add(wristJoint)

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.3), bodyMat)
    palm.position.x = 0.2
    wristGroup.add(palm)

    type Finger = { proximal: THREE.Group; distal: THREE.Group; sign: number }
    const fingers: Finger[] = []

    const fingerSpecs = [
      { y: 0.1, z: 0.09, sign: 1 },
      { y: 0.1, z: -0.09, sign: 1 },
      { y: -0.12, z: 0, sign: -1 },
    ]

    for (const spec of fingerSpecs) {
      const proximal = new THREE.Group()
      proximal.position.set(0.32, spec.y, spec.z)
      wristGroup.add(proximal)

      const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.06), gripMat)
      seg1.position.x = 0.1
      proximal.add(seg1)

      const distal = new THREE.Group()
      distal.position.x = 0.2
      proximal.add(distal)

      const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 0.055), gripMat)
      seg2.position.x = 0.08
      distal.add(seg2)

      fingers.push({ proximal, distal, sign: spec.sign })
    }

    let phase = 0
    let current = poseFor(stateRef.current.action, 0)
    let lastTime = performance.now()
    let frameId = 0

    function applyPose(pose: Pose) {
      shoulderGroup.rotation.z = pose.shoulder
      elbowGroup.rotation.z = pose.elbow
      wristGroup.rotation.z = pose.wrist

      for (const finger of fingers) {
        const close = pose.grip * (finger.sign > 0 ? -1 : 1) * 0.4
        finger.proximal.rotation.z = close
        finger.distal.rotation.z = close * 0.7
      }
    }

    function renderFrame(now: number) {
      frameId = window.requestAnimationFrame(renderFrame)

      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (!stateRef.current.visible) {
        return
      }

      const speed = stateRef.current.running ? 1.7 : 0.55
      phase += dt * speed

      const full = poseFor(stateRef.current.action, phase)
      const neutral = poseFor(stateRef.current.action, 0)
      const amplitude = stateRef.current.running ? 1 : 0.45
      const target = lerpPose(neutral, full, amplitude)

      current = lerpPose(current, target, Math.min(1, dt * 6))
      applyPose(current)

      controls.update()
      renderer.render(scene, camera)
    }

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) {
        return
      }
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    frameId = window.requestAnimationFrame(renderFrame)

    return () => {
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
      controls.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
        }
      })
      bodyMat.dispose()
      jointMat.dispose()
      accentMat.dispose()
      gripMat.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  if (webglFailed) {
    return <RobotArmFallback action={action} />
  }

  return (
    <div className="robot3d-shell active-panel-glow">
      <div ref={containerRef} className="robot3d-canvas" />
      <span className="robot3d-action-chip">{action}</span>
      <span className="robot3d-hint">拖动旋转视角</span>
    </div>
  )
}

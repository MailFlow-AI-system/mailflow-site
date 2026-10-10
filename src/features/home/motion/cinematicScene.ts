import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'

import { clampProgress, createFrameScheduler, getSceneSize } from './cinematicState'

export function createCinematicScene(
  host: HTMLElement,
  onReady: () => void,
  onUnavailable: () => void,
) {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.className = 'cinematic-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none'
  host.append(canvas)

  const scene = new Scene()
  const camera = new OrthographicCamera(-4, 4, 4, -4, 0.1, 50)
  camera.position.z = 12
  const paperGeometry = new PlaneGeometry(1, 1.28)
  const edgeGeometry = new EdgesGeometry(paperGeometry)
  const inkGeometry = new BufferGeometry().setFromPoints([
    new Vector3(-0.3, 0.32, 0.01),
    new Vector3(0.15, 0.32, 0.01),
    new Vector3(-0.3, 0.12, 0.01),
    new Vector3(0.3, 0.12, 0.01),
    new Vector3(-0.3, -0.05, 0.01),
    new Vector3(0.24, -0.05, 0.01),
    new Vector3(-0.3, -0.22, 0.01),
    new Vector3(0.05, -0.22, 0.01),
  ])
  const paperMaterial = new MeshBasicMaterial({
    color: 0xb7a3ff,
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
    depthWrite: false,
  })
  const edgeMaterial = new LineBasicMaterial({ color: 0xa388ff, transparent: true, opacity: 0.65 })
  const inkMaterial = new LineBasicMaterial({ color: 0xe2d9ff, transparent: true, opacity: 0.4 })
  const cards = Array.from({ length: 8 }, (_, index) => {
    const group = new Group()
    group.add(new Mesh(paperGeometry, paperMaterial))
    group.add(new LineSegments(edgeGeometry, edgeMaterial))
    group.add(new LineSegments(inkGeometry, inkMaterial))
    scene.add(group)
    const angle = index * 2.4
    return {
      group,
      start: new Vector3(
        Math.cos(angle) * (2.4 + index * 0.12),
        Math.sin(angle) * 2.8,
        index * -0.12,
      ),
      end: new Vector3(((index % 4) - 1.5) * 1.42, index < 4 ? 1.08 : -1.08, -0.9),
      rotation: (index % 2 ? -1 : 1) * (0.2 + index * 0.16),
    }
  })

  const ribbons = new Group()
  const ribbonMaterials = [0x8b5cf6, 0xc4b5fd].map(
    (color) =>
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.64,
        depthWrite: false,
      }),
  )
  const ribbonGeometries = [-1, 1].map((direction) => {
    const points = Array.from({ length: 9 }, (_, index) => {
      const angle = -1.15 + (index / 8) * 3.65
      return new Vector3(
        Math.cos(angle) * 3.6 * direction,
        Math.sin(angle) * 3.2,
        -1.5 + Math.sin(angle * 2) * 0.45,
      )
    })
    return new TubeGeometry(new CatmullRomCurve3(points), 80, 0.035, 6, false)
  })
  ribbonGeometries.forEach((geometry, index) => {
    ribbons.add(new Mesh(geometry, ribbonMaterials[index]))
  })
  scene.add(ribbons)

  const framePlane = new PlaneGeometry(6.3, 4.15)
  const frameGeometry = new EdgesGeometry(framePlane)
  framePlane.dispose()
  const frameMaterial = new LineBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0 })
  const workspace = new LineSegments(frameGeometry, frameMaterial)
  workspace.position.z = -1.2
  scene.add(workspace)

  let disposed = false
  let ready = false
  let progress = -1
  let frames = 0
  let resizes = 0
  let dark = true
  let size: ReturnType<typeof getSceneSize> = null
  const scheduler = createFrameScheduler(() => {
    if (!size) return
    try {
      renderer.render(scene, camera)
      host.dataset.sceneFrames = String(++frames)
      host.dataset.sceneDrawCalls = String(renderer.info.render.calls)
      host.dataset.sceneTriangles = String(renderer.info.render.triangles)
      if (!ready) {
        ready = true
        onReady()
      }
    } catch {
      dispose()
      onUnavailable()
    }
  })

  function resize(width: number, height: number) {
    if (disposed) return
    const next = getSceneSize(width, height, window.devicePixelRatio)
    if (!next) {
      size = null
      return
    }
    if (
      size?.width === next.width &&
      size.height === next.height &&
      size.pixelRatio === next.pixelRatio
    )
      return
    size = next
    renderer.setPixelRatio(next.pixelRatio)
    renderer.setSize(next.width, next.height, false)
    const halfHeight = 4.15
    const halfWidth = (halfHeight * next.width) / next.height
    camera.left = -halfWidth
    camera.right = halfWidth
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
    host.dataset.sceneResizes = String(++resizes)
    host.dataset.scenePixels = String(Math.floor(next.width * next.height * next.pixelRatio ** 2))
    scheduler.request()
  }

  function measure() {
    const { width, height } = host.getBoundingClientRect()
    resize(width, height)
  }

  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver((entries) => {
          const entry = entries[0]
          if (entry) resize(entry.contentRect.width, entry.contentRect.height)
        })
  observer?.observe(host)
  window.addEventListener('resize', measure, { passive: true })

  function contextLost(event: Event) {
    event.preventDefault()
    if (disposed) return
    dispose()
    onUnavailable()
  }

  canvas.addEventListener('webglcontextlost', contextLost)

  function setProgress(value: number) {
    if (disposed) return
    const next = clampProgress(value)
    if (next === progress) return
    progress = next
    const gathering = Math.min(1, next / 0.82)
    const eased = gathering * gathering * (3 - 2 * gathering)
    for (const { group, start, end, rotation } of cards) {
      group.position.lerpVectors(start, end, eased)
      group.rotation.set((1 - eased) * 0.24, (1 - eased) * rotation * 0.45, (1 - eased) * rotation)
      group.scale.setScalar(1 - eased * 0.12)
    }
    ribbons.rotation.z = (1 - eased) * -0.28
    ribbons.rotation.y = (1 - eased) * 0.25
    ribbons.scale.setScalar(1.08 - eased * 0.08)
    paperMaterial.opacity = (dark ? 0.2 : 0.14) - eased * 0.1
    inkMaterial.opacity = (dark ? 0.4 : 0.55) - eased * 0.16
    frameMaterial.opacity = Math.max(0, (next - 0.38) / 0.62) * 0.32
    workspace.scale.setScalar(0.86 + eased * 0.14)
    scheduler.request()
  }

  function setTheme(value: boolean) {
    if (disposed || dark === value) return
    dark = value
    inkMaterial.color.setHex(dark ? 0xe2d9ff : 0x6945bc)
    edgeMaterial.color.setHex(dark ? 0xa388ff : 0x7957c7)
    frameMaterial.color.setHex(dark ? 0xc4b5fd : 0x7957c7)
    const currentProgress = progress
    progress = -1
    setProgress(currentProgress)
  }

  function dispose() {
    if (disposed) return
    disposed = true
    scheduler.dispose()
    observer?.disconnect()
    window.removeEventListener('resize', measure)
    canvas.removeEventListener('webglcontextlost', contextLost)
    for (const geometry of [
      paperGeometry,
      edgeGeometry,
      inkGeometry,
      frameGeometry,
      ...ribbonGeometries,
    ])
      geometry.dispose()
    for (const material of [
      paperMaterial,
      edgeMaterial,
      inkMaterial,
      frameMaterial,
      ...ribbonMaterials,
    ])
      material.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()
  }

  measure()
  setProgress(0)

  return { setProgress, setTheme, setActive: scheduler.setActive, dispose }
}

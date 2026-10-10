export function clampProgress(progress: number): number {
  return Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0
}

export function getSceneSize(width: number, height: number, pixelRatio: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) return null

  width = Math.floor(width)
  height = Math.floor(height)
  return {
    width,
    height,
    pixelRatio: Math.min(
      Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1,
      1.5,
      Math.sqrt(2_000_000 / (width * height)),
    ),
  }
}

export function createFrameScheduler(render: () => void) {
  let active = false
  let dirty = false
  let disposed = false
  let frame: number | undefined

  function request() {
    if (disposed) return
    dirty = true
    if (!active || frame !== undefined) return
    frame = requestAnimationFrame(() => {
      frame = undefined
      if (disposed || !active || !dirty) return
      dirty = false
      render()
    })
  }

  function cancel() {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
  }

  return {
    request,
    setActive(value: boolean) {
      if (disposed) return
      active = value
      if (!active) cancel()
      else if (dirty) request()
    },
    dispose() {
      if (disposed) return
      disposed = true
      cancel()
    },
  }
}

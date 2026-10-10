const controllers = new WeakMap<ParentNode, () => void>()

export function initAmbientOrbits(scope: ParentNode = document): () => void {
  const existing = controllers.get(scope)
  if (existing) return existing

  const orbits = [...scope.querySelectorAll<HTMLElement>('[data-ambient-orbit]')]
  const visible = new Set<Element>()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let observer: IntersectionObserver | undefined
  let suspended = false
  let disposed = false

  function sync() {
    if (disposed) return
    for (const orbit of orbits) {
      orbit.dataset.ambientActive = String(
        visible.has(orbit) && !document.hidden && !reduced.matches && !suspended,
      )
    }
  }

  function observe() {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver((entries) => {
      if (disposed || suspended) return
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      }
      sync()
    })
    for (const orbit of orbits) observer.observe(orbit)
  }

  function pageHide(event: PageTransitionEvent) {
    if (!event.persisted) {
      dispose()
      return
    }
    suspended = true
    observer?.disconnect()
    visible.clear()
    sync()
  }

  function pageShow(event: PageTransitionEvent) {
    if (!suspended || !event.persisted || disposed) return
    suspended = false
    observe()
  }

  function dispose() {
    if (disposed) return
    disposed = true
    observer?.disconnect()
    document.removeEventListener('visibilitychange', sync)
    reduced.removeEventListener('change', sync)
    window.removeEventListener('pagehide', pageHide)
    window.removeEventListener('pageshow', pageShow)
    for (const orbit of orbits) delete orbit.dataset.ambientActive
    controllers.delete(scope)
  }

  controllers.set(scope, dispose)
  document.addEventListener('visibilitychange', sync)
  reduced.addEventListener('change', sync)
  window.addEventListener('pagehide', pageHide)
  window.addEventListener('pageshow', pageShow)
  sync()
  observe()
  return dispose
}

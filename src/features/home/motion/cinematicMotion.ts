import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { clampProgress } from './cinematicState'

type SceneController = ReturnType<typeof import('./cinematicScene').createCinematicScene>

const journeys = new WeakMap<HTMLElement, () => void>()

export function initCinematicJourney(root: HTMLElement): () => void {
  const existing = journeys.get(root)
  if (existing) return existing
  gsap.registerPlugin(ScrollTrigger)
  let media: ReturnType<typeof gsap.matchMedia> | undefined
  let disposed = false
  let suspended = false

  function start() {
    media = gsap.matchMedia()
    media.add(
      {
        desktop: '(min-width: 640px)',
        mobile: '(max-width: 639px)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        if (context.conditions?.reduced) return
        const desktop = Boolean(context.conditions?.desktop)
        const host = root.querySelector<HTMLElement>('[data-scene-host]')
        const sheets = [...root.querySelectorAll<HTMLElement>('[data-story-sheet]')]
        const indicator = root.querySelector<HTMLElement>('[data-story-progress]')
        const originalIndicatorTransform = indicator?.style.transform
        const state = { progress: 0 }
        let scene: SceneController | undefined
        let alive = true
        let loading = false
        let failed = false
        let near = false
        let visible = false
        let nearObserver: IntersectionObserver | undefined
        let visibilityObserver: IntersectionObserver | undefined
        let themeObserver: MutationObserver | undefined
        let loadFrame: number | undefined

        function syncTheme() {
          scene?.setTheme(document.documentElement.dataset.theme === 'dark')
        }

        function syncActive() {
          scene?.setActive(visible && !document.hidden)
        }

        async function loadScene() {
          if (!alive || !host || !near || loading || failed || scene || document.hidden) return
          loading = true
          host.dataset.sceneStatus = 'loading'
          try {
            const { createCinematicScene } = await import('./cinematicScene')
            if (!alive) return
            scene = createCinematicScene(
              host,
              () => {
                if (!alive) return
                root.dataset.sceneReady = 'true'
                host.dataset.sceneStatus = 'ready'
              },
              () => {
                delete root.dataset.sceneReady
                host.dataset.sceneStatus = 'fallback'
                scene = undefined
                failed = true
              },
            )
            scene.setProgress(state.progress)
            syncTheme()
            syncActive()
          } catch {
            failed = true
            if (alive) host.dataset.sceneStatus = 'fallback'
          } finally {
            loading = false
          }
        }

        function scheduleScene() {
          if (
            !alive ||
            !near ||
            loading ||
            failed ||
            scene ||
            document.hidden ||
            loadFrame !== undefined
          )
            return
          loadFrame = requestAnimationFrame(() => {
            loadFrame = undefined
            void loadScene()
          })
        }

        function update() {
          const progress = clampProgress(state.progress)
          root.style.setProperty('--story-progress', String(progress))
          root.dataset.storyChapter = String(Math.min(2, Math.floor(progress * 3)) + 1)
          if (indicator) indicator.style.transform = `scaleY(${progress})`
          scene?.setProgress(progress)
        }

        const timeline = gsap.timeline({
          onUpdate: update,
          scrollTrigger: {
            trigger: root,
            start: desktop ? 'top top+=100' : 'top 75%',
            end: desktop ? 'bottom bottom' : 'bottom 25%',
            scrub: 0.85,
            invalidateOnRefresh: true,
          },
        })
        timeline.to(state, { progress: 1, duration: 1, ease: 'none' }, 0)
        if (sheets.length) {
          timeline.fromTo(
            sheets,
            {
              x: (index) => (desktop ? [-20, 22, -8] : [-7, 2, -4])[index % 3],
              y: (index) => (desktop ? [-110, -18, 100] : [-75, 0, 80])[index % 3],
              rotation: (index) => (desktop ? [-12, 8, -4] : [-9, 6, -3])[index % 3],
            },
            {
              x: 0,
              y: (index) => (index - (sheets.length - 1) / 2) * (desktop ? 135 : 100),
              rotation: 0,
              opacity: 1,
              duration: 0.38,
              ease: 'power2.inOut',
            },
            0,
          )
        }
        const reader = root.querySelector<HTMLElement>('[data-story-reader]')
        const editor = root.querySelector<HTMLElement>('[data-story-editor]')
        if (desktop && reader && editor) {
          // Leave readable pauses between crossfades, including the final draft.
          timeline.to(sheets, { opacity: 0.12, duration: 0.26, ease: 'power2.inOut' }, 0.3)
          timeline.fromTo(
            reader,
            { opacity: 0, y: 28, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: 'power2.inOut' },
            0.3,
          )
          timeline.to(reader, { opacity: 0, y: -18, duration: 0.24, ease: 'power2.inOut' }, 0.68)
          timeline.fromTo(
            editor,
            { opacity: 0, y: 36, rotation: 1.5 },
            { opacity: 1, y: 0, rotation: 0, duration: 0.24, ease: 'power2.inOut' },
            0.68,
          )
        }
        root.dataset.motionReady = 'true'
        update()

        function visibilityChanged() {
          syncActive()
          if (document.hidden && loadFrame !== undefined) {
            cancelAnimationFrame(loadFrame)
            loadFrame = undefined
          }
          if (!document.hidden) scheduleScene()
        }

        if (
          desktop &&
          host &&
          typeof IntersectionObserver !== 'undefined' &&
          typeof ResizeObserver !== 'undefined'
        ) {
          nearObserver = new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return
              near = true
              nearObserver?.disconnect()
              scheduleScene()
            },
            { rootMargin: '-1px 0px' },
          )
          nearObserver.observe(root)
          visibilityObserver = new IntersectionObserver((entries) => {
            visible = entries.some((entry) => entry.isIntersecting)
            syncActive()
          })
          visibilityObserver.observe(host)
          themeObserver = new MutationObserver(syncTheme)
          themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
          })
          document.addEventListener('visibilitychange', visibilityChanged)
        }

        timeline.scrollTrigger?.refresh()

        return () => {
          alive = false
          if (loadFrame !== undefined) cancelAnimationFrame(loadFrame)
          nearObserver?.disconnect()
          visibilityObserver?.disconnect()
          themeObserver?.disconnect()
          document.removeEventListener('visibilitychange', visibilityChanged)
          scene?.dispose()
          delete root.dataset.motionReady
          delete root.dataset.sceneReady
          delete root.dataset.storyChapter
          root.style.removeProperty('--story-progress')
          if (indicator) indicator.style.transform = originalIndicatorTransform ?? ''
          if (host) host.dataset.sceneStatus = 'idle'
        }
      },
      root,
    )
  }

  function pageHide(event: PageTransitionEvent) {
    if (!event.persisted) {
      dispose()
      return
    }
    suspended = true
    media?.revert()
    media = undefined
  }

  function pageShow(event: PageTransitionEvent) {
    if (!disposed && suspended && event.persisted) {
      suspended = false
      start()
    }
  }

  function dispose() {
    if (disposed) return
    disposed = true
    media?.revert()
    window.removeEventListener('pagehide', pageHide)
    window.removeEventListener('pageshow', pageShow)
    journeys.delete(root)
  }

  journeys.set(root, dispose)
  window.addEventListener('pagehide', pageHide)
  window.addEventListener('pageshow', pageShow)
  start()
  return dispose
}

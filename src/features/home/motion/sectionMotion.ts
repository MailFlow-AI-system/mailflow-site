import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const controllers = new WeakMap<HTMLElement, () => void>()

export function initSectionMotion(root: HTMLElement): () => void {
  const existing = controllers.get(root)
  if (existing) return existing

  gsap.registerPlugin(ScrollTrigger)
  let media: ReturnType<typeof gsap.matchMedia> | undefined
  let disposed = false
  let suspended = false

  function start() {
    media = gsap.matchMedia()
    media.add(
      { all: 'all', reduced: '(prefers-reduced-motion: reduce)' },
      (context) => {
        const kind = root.dataset.sectionMotion
        const heading = root.querySelector<HTMLElement>(
          kind === 'preview' ? '[data-preview-heading]' : '[data-onboarding-heading]',
        )
        const frame = root.querySelector<HTMLElement>('[data-preview-frame]')
        const steps = [...root.querySelectorAll<HTMLElement>('[data-onboarding-step]')]
        const progress = root.querySelector<HTMLElement>('[data-step-progress]')
        let settle: (() => void) | undefined

        function clearState() {
          if (settle) {
            root.removeEventListener('focusin', settle)
            root.removeEventListener('pointerdown', settle)
            frame?.removeEventListener('pointerenter', settle)
            frame?.removeEventListener('pointerdown', settle)
          }
          delete root.dataset.motionReady
          delete root.dataset.motionState
          delete root.dataset.motionProgress
        }

        root.dataset.motionReady = 'true'
        if (context.conditions?.reduced) {
          root.dataset.motionState = 'reduced'
          return clearState
        }

        if (kind === 'preview' && heading && frame) {
          let settled =
            root.dataset.previewSettled === 'true' || root.contains(document.activeElement)

          function setFinalState() {
            gsap.set(heading, { y: 0 })
            gsap.set(frame, { rotationX: 0, scale: 1, y: 0 })
          }

          if (settled) {
            root.dataset.previewSettled = 'true'
            root.dataset.motionState = 'settled'
            setFinalState()
            return clearState
          }

          root.dataset.motionState = 'active'
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: frame,
              start: 'top 92%',
              end: 'top 58%',
              scrub: 0.45,
              invalidateOnRefresh: true,
              onUpdate: (trigger) => {
                root.dataset.motionProgress = String(Math.round(trigger.progress * 100))
              },
            },
          })
          timeline.fromTo(heading, { y: 26 }, { y: 0, duration: 1, ease: 'none' }, 0)
          timeline.fromTo(
            frame,
            {
              transformPerspective: 1100,
              transformOrigin: '50% 0%',
              y: 36,
              rotationX: 2.5,
              scale: 0.985,
            },
            { y: 0, rotationX: 0, scale: 1, duration: 1, ease: 'none' },
            0,
          )

          function settlePreview() {
            if (settled) return
            settled = true
            root.dataset.previewSettled = 'true'
            root.dataset.motionState = 'settled'
            timeline.progress(1).pause()
            timeline.scrollTrigger?.kill(false, true)
            root.dataset.motionProgress = '100'
          }

          settle = settlePreview
          root.addEventListener('focusin', settlePreview)
          frame.addEventListener('pointerenter', settlePreview)
          frame.addEventListener('pointerdown', settlePreview, { passive: true })
          timeline.scrollTrigger?.refresh()
          return () => {
            clearState()
            if (!settled) delete root.dataset.previewSettled
          }
        }

        if (kind === 'onboarding' && heading && steps.length === 3 && progress) {
          root.dataset.motionState = 'active'
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: 'top 82%',
              end: 'bottom 38%',
              scrub: 0.45,
              invalidateOnRefresh: true,
              onUpdate: (trigger) => {
                root.dataset.motionProgress = String(Math.round(trigger.progress * 100))
              },
            },
          })
          timeline.fromTo(heading, { y: 18 }, { y: 0, duration: 0.25, ease: 'none' }, 0)
          timeline.fromTo(
            steps,
            { y: 28 },
            { y: 0, duration: 0.6, stagger: 0.16, ease: 'none' },
            0.12,
          )
          timeline.fromTo(
            progress,
            { '--step-progress': 0 },
            { '--step-progress': 1, duration: 1, ease: 'none' },
            0,
          )

          let settled = false
          function settleOnboarding() {
            if (settled) return
            settled = true
            root.dataset.motionState = 'settled'
            timeline.progress(1).pause()
            timeline.scrollTrigger?.kill(false, true)
            root.dataset.motionProgress = '100'
          }

          settle = settleOnboarding
          root.addEventListener('focusin', settleOnboarding)
          root.addEventListener('pointerdown', settleOnboarding, { passive: true })
          timeline.scrollTrigger?.refresh()
          return clearState
        }

        root.dataset.motionState = 'static'
        return clearState
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
    controllers.delete(root)
  }

  controllers.set(root, dispose)
  window.addEventListener('pagehide', pageHide)
  window.addEventListener('pageshow', pageShow)
  start()
  return dispose
}

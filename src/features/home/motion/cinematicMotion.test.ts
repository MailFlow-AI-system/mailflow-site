import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest'

import { initCinematicJourney } from './cinematicMotion'

const mocks = vi.hoisted(() => ({
  desktop: true,
  reduced: false,
  cleanups: [] as Array<() => void>,
  ready: undefined as (() => void) | undefined,
  unavailable: undefined as (() => void) | undefined,
  createScene: vi.fn(),
  setProgress: vi.fn(),
  setActive: vi.fn(),
  setTheme: vi.fn(),
  disposeScene: vi.fn(),
  timeline: vi.fn(),
  revert: vi.fn(),
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    matchMedia: () => ({
      add: (_queries: unknown, callback: (context: unknown) => (() => void) | undefined) => {
        const cleanup = callback({
          conditions: { desktop: mocks.desktop, mobile: !mocks.desktop, reduced: mocks.reduced },
        })
        if (cleanup) mocks.cleanups.push(cleanup)
      },
      revert: () => {
        mocks.revert()
        for (const cleanup of mocks.cleanups.splice(0)) cleanup()
      },
    }),
    timeline: mocks.timeline,
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))
vi.mock('./cinematicScene', () => ({ createCinematicScene: mocks.createScene }))

describe('cinematic journey progressive enhancement', () => {
  let root: HTMLElement
  let cleanup: (() => void) | undefined
  let observers: Array<{
    callback: IntersectionObserverCallback
    disconnect: ReturnType<typeof vi.fn>
    options?: IntersectionObserverInit
  }>
  let loadFrames: Map<number, FrameRequestCallback>

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.desktop = true
    mocks.reduced = false
    mocks.cleanups = []
    observers = []
    loadFrames = new Map()
    let nextFrame = 0
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        loadFrames.set(++nextFrame, callback)
        return nextFrame
      }),
    )
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => loadFrames.delete(id)),
    )
    mocks.timeline.mockImplementation(() => {
      const timeline = {
        to: vi.fn().mockReturnThis(),
        fromTo: vi.fn().mockReturnThis(),
        scrollTrigger: { refresh: vi.fn() },
      }
      return timeline
    })
    mocks.createScene.mockImplementation((_host, ready, unavailable) => {
      mocks.ready = ready
      mocks.unavailable = unavailable
      return {
        setProgress: mocks.setProgress,
        setActive: mocks.setActive,
        setTheme: mocks.setTheme,
        dispose: mocks.disposeScene,
      }
    })
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnect = vi.fn()
        observe = vi.fn()
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          observers.push({ callback, disconnect: this.disconnect, options })
        }
      },
    )
    vi.stubGlobal('ResizeObserver', class {})
    root = document.createElement('section')
    root.innerHTML =
      '<div data-scene-host><svg data-scene-fallback></svg></div><div data-story-sheet></div><p data-story-chapter>Always readable</p>'
    document.body.append(root)
  })

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
    root.remove()
    delete document.documentElement.dataset.theme
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function intersect(index: number, isIntersecting: boolean) {
    observers[index].callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
  }

  function flushLoadFrames() {
    const frames = [...loadFrames.values()]
    loadFrames.clear()
    for (const frame of frames) frame(0)
  }

  async function finishLoad() {
    flushLoadFrames()
    await vi.dynamicImportSettled()
  }

  it('catches up to scroll gently without snapping between chapters', () => {
    cleanup = initCinematicJourney(root)
    const { scrollTrigger } = mocks.timeline.mock.calls[0][0]
    expect(typeof scrollTrigger.scrub).toBe('number')
    expect(scrollTrigger.scrub).toBeGreaterThanOrEqual(0.7)
    expect(scrollTrigger.scrub).toBeLessThanOrEqual(1)
    expect(scrollTrigger.snap).toBeUndefined()
  })

  it('crossfades gradually, holds each panel for reading, and reverses with scroll', async () => {
    root.insertAdjacentHTML(
      'beforeend',
      '<div data-story-reader></div><div data-story-editor></div><span data-story-progress></span>',
    )
    const { gsap } = await vi.importActual<typeof import('gsap')>('gsap')
    mocks.timeline.mockImplementation((options: Parameters<typeof gsap.timeline>[0]) => {
      const timelineOptions = { ...options, paused: true }
      delete timelineOptions.scrollTrigger
      const timeline = gsap.timeline(timelineOptions)
      mocks.cleanups.push(() => timeline.kill())
      return timeline
    })
    cleanup = initCinematicJourney(root)
    const timeline: ReturnType<typeof gsap.timeline> = mocks.timeline.mock.results[0].value
    const reader = root.querySelector<HTMLElement>('[data-story-reader]')
    const editor = root.querySelector<HTMLElement>('[data-story-editor]')
    assert(reader && editor)
    const opacity = (element: HTMLElement) => Number(element.style.opacity)

    expect(timeline.totalDuration()).toBe(1)
    timeline.progress(0.3)
    expect(opacity(reader)).toBe(0)
    timeline.progress(0.43)
    expect(opacity(reader)).toBeCloseTo(0.5, 2)
    for (const progress of [0.56, 0.6, 0.68]) {
      timeline.progress(progress)
      expect(opacity(reader)).toBe(1)
      expect(opacity(editor)).toBe(0)
      expect(Number(root.style.getPropertyValue('--story-progress'))).toBeCloseTo(progress)
    }
    timeline.progress(0.8)
    expect(opacity(reader)).toBeCloseTo(0.5, 2)
    expect(opacity(editor)).toBeCloseTo(0.5, 2)
    for (const progress of [0.92, 0.99, 1]) {
      timeline.progress(progress)
      expect(opacity(reader)).toBe(0)
      expect(opacity(editor)).toBe(1)
    }
    timeline.progress(0.6)
    expect(opacity(reader)).toBe(1)
    expect(opacity(editor)).toBe(0)
    expect(root.dataset.storyChapter).toBe('2')
    timeline.progress(0)
    expect(opacity(reader)).toBe(0)
    expect(opacity(editor)).toBe(0)
    expect(root.style.getPropertyValue('--story-progress')).toBe('0')
  })

  it('loads the scene only near the viewport and swaps the fallback after its first frame', async () => {
    cleanup = initCinematicJourney(root)
    expect(mocks.createScene).not.toHaveBeenCalled()
    expect(root.dataset.sceneReady).toBeUndefined()
    expect(observers[0].options?.rootMargin).toBe('-1px 0px')
    intersect(0, false)
    await finishLoad()
    expect(mocks.createScene).not.toHaveBeenCalled()
    intersect(0, true)
    intersect(1, true)
    expect(mocks.createScene).not.toHaveBeenCalled()
    await finishLoad()
    expect(mocks.createScene).toHaveBeenCalledOnce()
    expect(mocks.setActive).toHaveBeenLastCalledWith(true)
    expect(root.dataset.sceneReady).toBeUndefined()
    mocks.ready?.()
    expect(root.dataset.sceneReady).toBe('true')
    mocks.unavailable?.()
    expect(root.dataset.sceneReady).toBeUndefined()
    expect(root.querySelector('p')?.style.opacity).toBe('')
  })

  it('keeps mobile and reduced motion on the DOM/SVG fallback', async () => {
    mocks.desktop = false
    cleanup = initCinematicJourney(root)
    expect(observers).toHaveLength(0)
    cleanup()
    mocks.reduced = true
    cleanup = initCinematicJourney(root)
    await finishLoad()
    expect(mocks.createScene).not.toHaveBeenCalled()
    expect(root.dataset.motionReady).toBeUndefined()
    expect(mocks.timeline).toHaveBeenCalledOnce()
  })

  it('pauses outside the viewport and while the document is hidden', async () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    cleanup = initCinematicJourney(root)
    intersect(0, true)
    intersect(1, true)
    await finishLoad()
    intersect(1, false)
    expect(mocks.setActive).toHaveBeenLastCalledWith(false)
    intersect(1, true)
    hidden.mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(mocks.setActive).toHaveBeenLastCalledWith(false)
    hidden.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(mocks.setActive).toHaveBeenLastCalledWith(true)
  })

  it('cancels a queued load frame after cleanup', async () => {
    cleanup = initCinematicJourney(root)
    intersect(0, true)
    cleanup()
    await finishLoad()
    expect(mocks.createScene).not.toHaveBeenCalled()
    expect(root.dataset.motionReady).toBeUndefined()
  })

  it('does not finish a pending scene import after cleanup', async () => {
    cleanup = initCinematicJourney(root)
    intersect(0, true)
    flushLoadFrames()
    cleanup()
    await vi.dynamicImportSettled()
    expect(mocks.createScene).not.toHaveBeenCalled()
  })

  it('defers imports in a hidden tab and loads when the tab returns', async () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    cleanup = initCinematicJourney(root)
    intersect(0, true)
    await finishLoad()
    expect(mocks.createScene).not.toHaveBeenCalled()
    hidden.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    await finishLoad()
    expect(mocks.createScene).toHaveBeenCalledOnce()
  })

  it('preserves the SVG after a WebGL initialization failure without retrying each scroll', async () => {
    mocks.createScene.mockImplementationOnce(() => {
      throw new Error('WebGL unavailable')
    })
    cleanup = initCinematicJourney(root)
    intersect(0, true)
    await finishLoad()
    document.dispatchEvent(new Event('visibilitychange'))
    await finishLoad()
    expect(mocks.createScene).toHaveBeenCalledOnce()
    expect(root.dataset.sceneReady).toBeUndefined()
    expect(root.querySelector('[data-scene-fallback]')).not.toBeNull()
    expect(root.querySelector<HTMLElement>('[data-scene-host]')?.dataset.sceneStatus).toBe(
      'fallback',
    )
  })

  it('updates the decorative scene when the selected theme changes', async () => {
    document.documentElement.dataset.theme = 'light'
    cleanup = initCinematicJourney(root)
    intersect(0, true)
    await finishLoad()
    expect(mocks.setTheme).toHaveBeenLastCalledWith(false)
    document.documentElement.dataset.theme = 'dark'
    await Promise.resolve()
    expect(mocks.setTheme).toHaveBeenLastCalledWith(true)
  })

  it('suspends for bfcache, restores once, and remains idempotent', async () => {
    cleanup = initCinematicJourney(root)
    expect(initCinematicJourney(root)).toBe(cleanup)
    intersect(0, true)
    await finishLoad()
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
    expect(mocks.disposeScene).toHaveBeenCalledOnce()
    expect(root.dataset.motionReady).toBeUndefined()
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    expect(mocks.timeline).toHaveBeenCalledTimes(2)
    cleanup()
    cleanup()
    expect(mocks.revert).toHaveBeenCalledTimes(2)
  })
})

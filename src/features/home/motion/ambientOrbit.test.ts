import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initAmbientOrbits } from './ambientOrbit'

describe('ambient orbit lifecycle', () => {
  let root: HTMLDivElement
  let orbits: HTMLElement[]
  let cleanup: (() => void) | undefined
  let reduced: MediaQueryList
  let changeMotion: EventListener
  let observers: Array<{
    callback: IntersectionObserverCallback
    observe: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }>

  beforeEach(() => {
    root = document.createElement('div')
    root.innerHTML = '<div data-ambient-orbit></div><div data-ambient-orbit></div>'
    document.body.append(root)
    orbits = [...root.querySelectorAll<HTMLElement>('[data-ambient-orbit]')]
    observers = []
    reduced = {
      matches: false,
      addEventListener: vi.fn((_event: string, callback: EventListener) => {
        changeMotion = callback
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => reduced),
    )
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn()
        disconnect = vi.fn()
        constructor(callback: IntersectionObserverCallback) {
          observers.push({ callback, observe: this.observe, disconnect: this.disconnect })
        }
      },
    )
  })

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
    root.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function intersect(index: number, visible: boolean, observerIndex = 0) {
    const target = orbits[index]
    if (!target) throw new Error('Missing orbit fixture')
    const bounds = target.getBoundingClientRect()
    observers[observerIndex].callback(
      [
        {
          target,
          isIntersecting: visible,
          boundingClientRect: bounds,
          intersectionRect: bounds,
          intersectionRatio: visible ? 1 : 0,
          rootBounds: null,
          time: 0,
        },
      ],
      {} as IntersectionObserver,
    )
  }

  function pageTransition(type: string, persisted: boolean) {
    const event = new Event(type)
    Object.defineProperty(event, 'persisted', { value: persisted })
    window.dispatchEvent(event)
  }

  it('starts each background only when its own section is visible', () => {
    cleanup = initAmbientOrbits(root)
    expect(observers[0].observe).toHaveBeenCalledTimes(2)
    expect(orbits.map((orbit) => orbit.dataset.ambientActive)).toEqual(['false', 'false'])
    intersect(0, true)
    expect(orbits.map((orbit) => orbit.dataset.ambientActive)).toEqual(['true', 'false'])
    intersect(0, false)
    intersect(1, true)
    expect(orbits.map((orbit) => orbit.dataset.ambientActive)).toEqual(['false', 'true'])
  })

  it('pauses a hidden document and resumes only the visible background', () => {
    const hidden = vi.spyOn(document, 'hidden', 'get')
    cleanup = initAmbientOrbits(root)
    intersect(0, true)
    hidden.mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(orbits[0].dataset.ambientActive).toBe('false')
    hidden.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(orbits.map((orbit) => orbit.dataset.ambientActive)).toEqual(['true', 'false'])
  })

  it('keeps a static composition for reduced motion and follows preference changes', () => {
    Object.defineProperty(reduced, 'matches', { value: true, configurable: true })
    cleanup = initAmbientOrbits(root)
    intersect(0, true)
    expect(orbits[0].dataset.ambientActive).toBe('false')
    Object.defineProperty(reduced, 'matches', { value: false })
    changeMotion(new Event('change'))
    expect(orbits[0].dataset.ambientActive).toBe('true')
  })

  it('disconnects on bfcache suspension and observes again after restoration', () => {
    cleanup = initAmbientOrbits(root)
    intersect(0, true)
    pageTransition('pagehide', true)
    expect(observers[0].disconnect).toHaveBeenCalledOnce()
    expect(orbits[0].dataset.ambientActive).toBe('false')
    intersect(0, true)
    expect(orbits[0].dataset.ambientActive).toBe('false')
    pageTransition('pageshow', true)
    expect(observers).toHaveLength(2)
    expect(observers[1].observe).toHaveBeenCalledTimes(2)
    intersect(0, true, 1)
    expect(orbits[0].dataset.ambientActive).toBe('true')
  })

  it('deduplicates initialization and removes listeners on permanent navigation', () => {
    cleanup = initAmbientOrbits(root)
    expect(initAmbientOrbits(root)).toBe(cleanup)
    expect(observers).toHaveLength(1)
    intersect(0, true)
    pageTransition('pagehide', false)
    expect(observers[0].disconnect).toHaveBeenCalledOnce()
    expect(reduced.removeEventListener).toHaveBeenCalledWith('change', changeMotion)
    expect(orbits[0].dataset.ambientActive).toBeUndefined()
    intersect(0, true)
    pageTransition('pageshow', true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(orbits[0].dataset.ambientActive).toBeUndefined()
    expect(observers).toHaveLength(1)
    cleanup = initAmbientOrbits(root)
    expect(observers).toHaveLength(2)
  })

  it('leaves the static background intact when intersection observation is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    cleanup = initAmbientOrbits(root)
    expect(orbits.map((orbit) => orbit.dataset.ambientActive)).toEqual(['false', 'false'])
  })
})

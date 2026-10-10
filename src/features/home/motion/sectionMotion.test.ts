import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initSectionMotion } from './sectionMotion'

const mocks = vi.hoisted(() => ({
  reduced: false,
  cleanups: [] as Array<() => void>,
  timelines: [] as Array<{
    fromTo: ReturnType<typeof vi.fn>
    to: ReturnType<typeof vi.fn>
    progress: ReturnType<typeof vi.fn>
    pause: ReturnType<typeof vi.fn>
    scrollTrigger: { kill: ReturnType<typeof vi.fn>; refresh: ReturnType<typeof vi.fn> }
  }>,
  configs: [] as Array<Record<string, unknown>>,
  set: vi.fn(),
  revert: vi.fn(),
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    set: mocks.set,
    matchMedia: () => ({
      add: (_queries: unknown, callback: (context: unknown) => (() => void) | undefined) => {
        const cleanup = callback({ conditions: { all: true, reduced: mocks.reduced } })
        if (cleanup) mocks.cleanups.push(cleanup)
      },
      revert: () => {
        mocks.revert()
        for (const cleanup of mocks.cleanups.splice(0)) cleanup()
      },
    }),
    timeline: (config: Record<string, unknown>) => {
      const state = { progress: 0 }
      const timeline = {
        fromTo: vi.fn().mockReturnThis(),
        to: vi.fn().mockReturnThis(),
        progress: vi.fn((value?: number) => {
          if (value !== undefined) state.progress = value
          return value === undefined ? state.progress : timeline
        }),
        pause: vi.fn().mockReturnThis(),
        scrollTrigger: { kill: vi.fn(), refresh: vi.fn() },
      }
      mocks.configs.push(config)
      mocks.timelines.push(timeline)
      return timeline
    },
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))

describe('home section motion', () => {
  let root: HTMLElement
  let cleanup: (() => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.reduced = false
    mocks.cleanups = []
    mocks.timelines = []
    mocks.configs = []
    root = document.createElement('section')
    root.dataset.sectionMotion = 'preview'
    root.innerHTML =
      '<div data-preview-heading>Visible heading</div><div data-preview-frame><input aria-label="Search sample messages"></div>'
    document.body.append(root)
  })

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
    root.remove()
    vi.restoreAllMocks()
  })

  it('adds a restrained scroll-linked rise and perspective arrival to the preview', () => {
    cleanup = initSectionMotion(root)

    expect(root.dataset.motionReady).toBe('true')
    expect(root.dataset.motionState).toBe('active')
    expect(root.querySelector('[data-preview-heading]')?.textContent).toBe('Visible heading')
    expect(mocks.configs[0]?.scrollTrigger).toMatchObject({
      trigger: root.querySelector('[data-preview-frame]'),
      scrub: expect.anything(),
    })
    expect(mocks.timelines[0]?.fromTo).toHaveBeenCalledWith(
      root.querySelector('[data-preview-heading]'),
      expect.objectContaining({ y: expect.any(Number) }),
      expect.objectContaining({ y: 0 }),
      0,
    )
    expect(mocks.timelines[0]?.fromTo).toHaveBeenCalledWith(
      root.querySelector('[data-preview-frame]'),
      expect.objectContaining({ rotationX: expect.any(Number) }),
      expect.objectContaining({ rotationX: 0, scale: 1 }),
      0,
    )
  })

  it('settles the preview on focus or pointer interaction', () => {
    cleanup = initSectionMotion(root)
    const timeline = mocks.timelines[0]

    root.querySelector('input')?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

    expect(root.dataset.previewSettled).toBe('true')
    expect(root.dataset.motionState).toBe('settled')
    expect(timeline?.progress).toHaveBeenCalledWith(1)
    expect(timeline?.pause).toHaveBeenCalledOnce()
    expect(timeline?.scrollTrigger.kill).toHaveBeenCalledWith(false, true)

    expect(timeline?.scrollTrigger.kill).toHaveBeenCalledOnce()
  })

  it('settles before a pointer can press an interactive preview control', () => {
    cleanup = initSectionMotion(root)
    const frame = root.querySelector('[data-preview-frame]')
    const timeline = mocks.timelines[0]

    frame?.dispatchEvent(new PointerEvent('pointerenter'))

    expect(root.dataset.previewSettled).toBe('true')
    expect(timeline?.progress).toHaveBeenCalledWith(1)
    expect(timeline?.scrollTrigger.kill).toHaveBeenCalledWith(false, true)
  })

  it('starts settled when a control received focus before the lazy engine loaded', () => {
    root.dataset.previewSettled = 'true'

    cleanup = initSectionMotion(root)

    expect(mocks.timelines).toHaveLength(0)
    expect(mocks.set).toHaveBeenCalledWith(root.querySelector('[data-preview-heading]'), { y: 0 })
    expect(mocks.set).toHaveBeenCalledWith(root.querySelector('[data-preview-frame]'), {
      rotationX: 0,
      scale: 1,
      y: 0,
    })
    expect(root.dataset.motionState).toBe('settled')
  })

  it('stagger-reveals onboarding steps and advances the decorative progress rail', () => {
    root.dataset.sectionMotion = 'onboarding'
    root.innerHTML =
      '<h2 data-onboarding-heading>Three small steps</h2><div data-onboarding-steps><span data-step-progress></span><article data-onboarding-step="1"></article><article data-onboarding-step="2"></article><article data-onboarding-step="3"></article></div>'

    cleanup = initSectionMotion(root)

    const steps = [...root.querySelectorAll('[data-onboarding-step]')]
    expect(mocks.timelines[0]?.fromTo).toHaveBeenNthCalledWith(
      2,
      steps,
      { y: 28 },
      expect.objectContaining({ y: 0, stagger: expect.any(Number) }),
      0.12,
    )
    expect(mocks.timelines[0]?.fromTo).toHaveBeenNthCalledWith(
      3,
      root.querySelector('[data-step-progress]'),
      { '--step-progress': 0 },
      { '--step-progress': 1, duration: 1, ease: 'none' },
      0,
    )
  })

  it('keeps reduced-motion users on the static state', () => {
    mocks.reduced = true

    cleanup = initSectionMotion(root)

    expect(mocks.timelines).toHaveLength(0)
    expect(root.dataset.motionReady).toBe('true')
    expect(root.dataset.motionState).toBe('reduced')
  })

  it('reverts while entering the back-forward cache and initializes once on restore', () => {
    cleanup = initSectionMotion(root)
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))

    expect(root.dataset.motionReady).toBeUndefined()
    expect(mocks.revert).toHaveBeenCalledOnce()

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))

    expect(mocks.timelines).toHaveLength(2)
    expect(root.dataset.motionReady).toBe('true')
    cleanup?.()
    expect(mocks.revert).toHaveBeenCalledTimes(2)
  })
})

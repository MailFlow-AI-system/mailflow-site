import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clampProgress, createFrameScheduler, getSceneSize } from './cinematicState'

describe('cinematic frame scheduling', () => {
  let frames: Map<number, FrameRequestCallback>
  let nextFrame: number

  beforeEach(() => {
    frames = new Map()
    nextFrame = 0
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.set(++nextFrame, callback)
        return nextFrame
      }),
    )
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => frames.delete(id)),
    )
  })

  afterEach(() => vi.unstubAllGlobals())

  function flush() {
    const pending = [...frames.values()]
    frames.clear()
    for (const callback of pending) callback(0)
  }

  it('coalesces invalidations and stops after a stable frame', () => {
    const render = vi.fn()
    const scheduler = createFrameScheduler(render)
    scheduler.setActive(true)
    scheduler.request()
    scheduler.request()
    scheduler.request()

    expect(frames.size).toBe(1)
    flush()
    expect(render).toHaveBeenCalledOnce()
    expect(frames.size).toBe(0)
  })

  it('pauses pending work and renders the latest state once on resume', () => {
    const render = vi.fn()
    const scheduler = createFrameScheduler(render)
    scheduler.setActive(true)
    scheduler.request()
    scheduler.setActive(false)
    scheduler.request()
    flush()

    expect(render).not.toHaveBeenCalled()
    scheduler.setActive(true)
    flush()
    expect(render).toHaveBeenCalledOnce()
  })

  it('disposes idempotently and ignores an already dispatched callback', () => {
    const render = vi.fn()
    const scheduler = createFrameScheduler(render)
    scheduler.setActive(true)
    scheduler.request()
    const dispatched = [...frames.values()][0]
    scheduler.dispose()
    scheduler.dispose()
    dispatched(0)
    scheduler.setActive(true)
    scheduler.request()

    expect(render).not.toHaveBeenCalled()
    expect(frames.size).toBe(0)
  })
})

describe('cinematic progress and scene sizing', () => {
  it('clamps reverse-scroll boundaries and rejects non-finite progress', () => {
    expect([-1, 0, 0.5, 1, 2, Number.NaN, Infinity].map(clampProgress)).toEqual([
      0, 0, 0.5, 1, 1, 0, 0,
    ])
  })

  it('caps pixel ratio and the drawing buffer at two million pixels', () => {
    expect(getSceneSize(600, 800, 3)).toEqual({ width: 600, height: 800, pixelRatio: 1.5 })
    const large = getSceneSize(3840, 2160, 2)
    expect(large).not.toBeNull()
    if (!large) throw new Error('Expected valid scene dimensions')
    expect(large.width * large.height * large.pixelRatio ** 2).toBeLessThanOrEqual(2_000_001)
  })

  it('defers zero-sized hosts and keeps CSS dimensions independent of resolution', () => {
    expect(getSceneSize(0, 800, 1)).toBeNull()
    expect(getSceneSize(800, 0, 1)).toBeNull()
    expect(getSceneSize(800.8, 600.4, 1)).toEqual({ width: 800, height: 600, pixelRatio: 1 })
  })
})

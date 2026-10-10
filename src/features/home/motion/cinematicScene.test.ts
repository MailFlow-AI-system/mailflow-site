import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCinematicScene } from './cinematicScene'

const renderer = vi.hoisted(() => ({
  render: vi.fn(),
  setSize: vi.fn(),
  setPixelRatio: vi.fn(),
  dispose: vi.fn(),
  forceContextLoss: vi.fn(),
}))

vi.mock('three', async (importOriginal) => {
  const original = await importOriginal<typeof import('three')>()
  return {
    ...original,
    WebGLRenderer: class {
      domElement = document.createElement('canvas')
      info = { render: { calls: 29, triangles: 2300 } }
      render = renderer.render
      setSize = renderer.setSize
      setPixelRatio = renderer.setPixelRatio
      dispose = renderer.dispose
      forceContextLoss = renderer.forceContextLoss
      setClearColor = vi.fn()
    },
  }
})

describe('cinematic scene lifecycle', () => {
  let host: HTMLElement
  let resize: ResizeObserverCallback
  let disconnect: ReturnType<typeof vi.fn>
  let frames: Map<number, FrameRequestCallback>

  beforeEach(() => {
    vi.clearAllMocks()
    frames = new Map()
    let nextFrame = 0
    disconnect = vi.fn()
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
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback
        }
        observe = vi.fn()
        disconnect = disconnect
      },
    )
    host = document.createElement('div')
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({ width: 720, height: 720 } as DOMRect)
  })

  afterEach(() => vi.unstubAllGlobals())

  function flush() {
    const pending = [...frames.values()]
    frames.clear()
    for (const callback of pending) callback(0)
  }

  it('renders only invalidated visible frames and never resizes with progress', () => {
    const ready = vi.fn()
    const scene = createCinematicScene(host, ready, vi.fn())
    scene.setActive(true)
    flush()
    expect(ready).toHaveBeenCalledOnce()
    expect(renderer.render).toHaveBeenCalledOnce()
    expect(renderer.setSize).toHaveBeenCalledOnce()
    scene.setProgress(0.2)
    scene.setProgress(0.7)
    flush()
    expect(renderer.render).toHaveBeenCalledTimes(2)
    expect(renderer.setSize).toHaveBeenCalledOnce()
    scene.setProgress(0.7)
    flush()
    expect(renderer.render).toHaveBeenCalledTimes(2)
    expect(host.dataset.sceneFrames).toBe('2')
    scene.dispose()
  })

  it('resizes from stable host dimensions and ignores duplicate observer entries', () => {
    const scene = createCinematicScene(host, vi.fn(), vi.fn())
    const entry = { contentRect: { width: 600, height: 500 } } as ResizeObserverEntry
    resize([entry], {} as ResizeObserver)
    resize([entry], {} as ResizeObserver)
    expect(renderer.setSize).toHaveBeenCalledTimes(2)
    expect(renderer.setSize).toHaveBeenLastCalledWith(600, 500, false)
    expect(host.dataset.sceneResizes).toBe('2')
    scene.dispose()
  })

  it('restores the fallback and releases the renderer on context loss', () => {
    const unavailable = vi.fn()
    const scene = createCinematicScene(host, vi.fn(), unavailable)
    const canvas = host.querySelector('canvas')
    scene.setActive(true)
    canvas?.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    scene.dispose()
    flush()
    expect(unavailable).toHaveBeenCalledOnce()
    expect(renderer.dispose).toHaveBeenCalledOnce()
    expect(renderer.render).not.toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(host.querySelector('canvas')).toBeNull()
  })

  it('redraws for theme changes without resizing or starting an ambient loop', () => {
    const scene = createCinematicScene(host, vi.fn(), vi.fn())
    scene.setTheme(true)
    scene.setActive(true)
    flush()
    const renderedScene = renderer.render.mock.calls[0][0]
    const ink = renderedScene.children[0].children[2].material
    expect(ink.color.getHex()).toBe(0xe2d9ff)
    scene.setTheme(false)
    flush()
    expect(ink.color.getHex()).toBe(0x6945bc)
    expect(renderer.render).toHaveBeenCalledTimes(2)
    expect(renderer.setSize).toHaveBeenCalledOnce()
    expect(frames.size).toBe(0)
    scene.dispose()
  })

  it('falls back after a renderer error and cancels subsequent frames', () => {
    renderer.render.mockImplementationOnce(() => {
      throw new Error('GPU unavailable')
    })
    const unavailable = vi.fn()
    const scene = createCinematicScene(host, vi.fn(), unavailable)
    scene.setActive(true)
    flush()
    scene.setProgress(0.5)
    flush()
    expect(unavailable).toHaveBeenCalledOnce()
    expect(renderer.render).toHaveBeenCalledOnce()
    expect(renderer.dispose).toHaveBeenCalledOnce()
    expect(host.querySelector('canvas')).toBeNull()
  })
})

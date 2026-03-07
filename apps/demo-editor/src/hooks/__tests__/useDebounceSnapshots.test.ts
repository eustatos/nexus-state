import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounceSnapshots } from '../useDebounceSnapshots'
import * as helpers from '@/store/helpers'

// Mock store helpers
vi.mock('@/store/helpers', () => ({
  captureSnapshot: vi.fn(),
}))

// Mock Nexus State hooks
vi.mock('@nexus-state/react', () => ({
  useSetAtom: () => vi.fn(),
}))

describe('useDebounceSnapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not capture when disabled', () => {
    const { result } = renderHook(() =>
      useDebounceSnapshots({ enabled: false, delay: 100 })
    )

    act(() => {
      result.current.captureSnapshot('text-edit', 'test content')
    })

    expect(helpers.captureSnapshot).not.toHaveBeenCalled()
  })

  it('should provide captureSnapshot function', () => {
    const { result } = renderHook(() =>
      useDebounceSnapshots({ enabled: true, delay: 100 })
    )

    expect(result.current.captureSnapshot).toBeDefined()
    expect(typeof result.current.captureSnapshot).toBe('function')
  })

  it('should provide forceCapture function', () => {
    const { result } = renderHook(() =>
      useDebounceSnapshots({ enabled: true, delay: 100 })
    )

    expect(result.current.forceCapture).toBeDefined()
    expect(typeof result.current.forceCapture).toBe('function')
  })

  it('should provide cancelPending function', () => {
    const { result } = renderHook(() =>
      useDebounceSnapshots({ enabled: true, delay: 100 })
    )

    expect(result.current.cancelPending).toBeDefined()
    expect(typeof result.current.cancelPending).toBe('function')
  })

  it('should use default delay of 1000ms', () => {
    const { result } = renderHook(() => useDebounceSnapshots())

    expect(result.current.captureSnapshot).toBeDefined()
  })

  it('should use default maxWait of 5000ms', () => {
    const { result } = renderHook(() => useDebounceSnapshots())

    expect(result.current.forceCapture).toBeDefined()
  })

  describe('debounce behavior', () => {
    it('should call captureSnapshot after debounce delay', () => {
      const mockSnapshot = {
        id: 'test-1',
        state: {},
        metadata: { timestamp: Date.now(), action: 'text-edit', atomCount: 1 } as const,
      }
      vi.mocked(helpers.captureSnapshot).mockReturnValue(mockSnapshot)

      const { result } = renderHook(() =>
        useDebounceSnapshots({ delay: 100, maxWait: 500 })
      )

      // Call captureSnapshot
      act(() => {
        result.current.captureSnapshot('text-edit', 'test content')
      })

      // Should not call captureSnapshot immediately
      expect(helpers.captureSnapshot).not.toHaveBeenCalled()

      // Fast-forward time past debounce delay
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should call captureSnapshot after delay
      expect(helpers.captureSnapshot).toHaveBeenCalledWith('text-edit')
    })

    it('should not call captureSnapshot before debounce delay', () => {
      const mockSnapshot = {
        id: 'test-1',
        state: {},
        metadata: { timestamp: Date.now(), action: 'text-edit', atomCount: 1 } as const,
      }
      vi.mocked(helpers.captureSnapshot).mockReturnValue(mockSnapshot)

      const { result } = renderHook(() =>
        useDebounceSnapshots({ delay: 100 })
      )

      // Call captureSnapshot
      act(() => {
        result.current.captureSnapshot('text-edit', 'test content')
      })

      // Advance time to just before debounce delay
      act(() => {
        vi.advanceTimersByTime(99)
      })

      // Should not call captureSnapshot yet
      expect(helpers.captureSnapshot).not.toHaveBeenCalled()
    })

    it('should debounce multiple rapid calls into single capture', () => {
      const mockSnapshot = {
        id: 'test-1',
        state: {},
        metadata: { timestamp: Date.now(), action: 'text-edit', atomCount: 1 } as const,
      }
      vi.mocked(helpers.captureSnapshot).mockReturnValue(mockSnapshot)

      const { result } = renderHook(() =>
        useDebounceSnapshots({ delay: 100 })
      )

      // Call captureSnapshot multiple times rapidly
      act(() => {
        result.current.captureSnapshot('text-edit', 'content 1')
        result.current.captureSnapshot('text-edit', 'content 2')
        result.current.captureSnapshot('text-edit', 'content 3')
      })

      // Fast-forward time past debounce delay
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should call captureSnapshot only once
      expect(helpers.captureSnapshot).toHaveBeenCalledTimes(1)
    })

    it('should respect maxWait option for long-running input', () => {
      const mockSnapshot = {
        id: 'test-1',
        state: {},
        metadata: { timestamp: Date.now(), action: 'text-edit', atomCount: 1 } as const,
      }
      vi.mocked(helpers.captureSnapshot).mockReturnValue(mockSnapshot)

      const { result } = renderHook(() =>
        useDebounceSnapshots({ delay: 100, maxWait: 200 })
      )

      // Call captureSnapshot multiple times, exceeding maxWait
      act(() => {
        result.current.captureSnapshot('text-edit', 'content 1')
        vi.advanceTimersByTime(150)
        result.current.captureSnapshot('text-edit', 'content 2')
        vi.advanceTimersByTime(150)
        result.current.captureSnapshot('text-edit', 'content 3')
      })

      // Should have called at least once due to maxWait being exceeded
      expect(helpers.captureSnapshot).toHaveBeenCalled()
    })

    it('should cancel pending capture when disabled mid-operation', () => {
      const mockSnapshot = {
        id: 'test-1',
        state: {},
        metadata: { timestamp: Date.now(), action: 'text-edit', atomCount: 1 } as const,
      }
      vi.mocked(helpers.captureSnapshot).mockReturnValue(mockSnapshot)

      const { result, rerender } = renderHook(
        ({ enabled }) => useDebounceSnapshots({ enabled, delay: 100 }),
        { initialProps: { enabled: true } }
      )

      // Call captureSnapshot
      act(() => {
        result.current.captureSnapshot('text-edit', 'test content')
      })

      // Disable the hook
      rerender({ enabled: false })

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should not call captureSnapshot
      expect(helpers.captureSnapshot).not.toHaveBeenCalled()
    })
  })

  describe('forceCapture', () => {
    it('should call captureSnapshot immediately without debounce', () => {
      const mockSnapshot = {
        id: 'test-1',
        state: {},
        metadata: { timestamp: Date.now(), action: 'manual-save', atomCount: 1 } as const,
      }
      vi.mocked(helpers.captureSnapshot).mockReturnValue(mockSnapshot)

      const { result } = renderHook(() =>
        useDebounceSnapshots({ enabled: true, delay: 100 })
      )

      act(() => {
        result.current.forceCapture('manual-save', 'test content')
      })

      expect(helpers.captureSnapshot).toHaveBeenCalledWith('manual-save')
      expect(helpers.captureSnapshot).toHaveBeenCalledTimes(1)
    })

    it('should not call captureSnapshot when disabled', () => {
      const { result } = renderHook(() =>
        useDebounceSnapshots({ enabled: false })
      )

      act(() => {
        result.current.forceCapture('manual-save', 'test content')
      })

      expect(helpers.captureSnapshot).not.toHaveBeenCalled()
    })
  })

  describe('cancelPending', () => {
    it('should cancel pending capture', () => {
      const mockSnapshot = {
        id: 'test-1',
        state: {},
        metadata: { timestamp: Date.now(), action: 'text-edit', atomCount: 1 } as const,
      }
      vi.mocked(helpers.captureSnapshot).mockReturnValue(mockSnapshot)

      const { result } = renderHook(() =>
        useDebounceSnapshots({ delay: 100 })
      )

      // Call captureSnapshot
      act(() => {
        result.current.captureSnapshot('text-edit', 'test content')
      })

      // Cancel pending
      act(() => {
        result.current.cancelPending()
      })

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should not call captureSnapshot
      expect(helpers.captureSnapshot).not.toHaveBeenCalled()
    })

    it('should not throw when called multiple times', () => {
      const { result } = renderHook(() =>
        useDebounceSnapshots({ delay: 100 })
      )

      expect(() => {
        act(() => {
          result.current.cancelPending()
          result.current.cancelPending()
          result.current.cancelPending()
        })
      }).not.toThrow()
    })
  })

  describe('resetPreviousContent', () => {
    it('should reset previous content reference', () => {
      const { result } = renderHook(() =>
        useDebounceSnapshots({ enabled: true, delay: 100 })
      )

      act(() => {
        result.current.resetPreviousContent('initial content')
      })

      // Should not throw
      expect(() => {
        result.current.resetPreviousContent('new content')
      }).not.toThrow()
    })
  })
})

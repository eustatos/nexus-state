/**
 * Tests for useStressTest hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStressTest } from '@/hooks/useStressTest'
import { editorStore } from '@/store/store'
import { editorTimeTravel } from '@/store/timeTravel'
import { contentAtom } from '@/store/atoms/editor'

describe('useStressTest', () => {
  beforeEach(() => {
    // Clear history and reset content before each test
    editorTimeTravel.clearHistory()
    act(() => {
      editorStore.set(contentAtom, '')
    })
  })

  afterEach(() => {
    // Stop any running tests
    const { result } = renderHook(() => useStressTest())
    act(() => {
      result.current.stopAll()
    })
  })

  describe('initialization', () => {
    it('should initialize with default stats', () => {
      const { result } = renderHook(() => useStressTest())

      expect(result.current.stats.turboTypeActive).toBe(false)
      expect(result.current.stats.snapshotStormActive).toBe(false)
      expect(result.current.stats.turboTypeCharsTyped).toBe(0)
      expect(result.current.stats.snapshotsCreated).toBe(0)
      expect(result.current.stats.totalOperations).toBe(0)
      expect(result.current.stats.errorsCount).toBe(0)
    })

    it('should initialize with custom config', () => {
      const customConfig = {
        turboTypeSpeed: 100,
        snapshotStormCount: 50,
        snapshotStormInterval: 20
      }

      const { result } = renderHook(() => useStressTest(customConfig))

      expect(result.current).toBeDefined()
    })
  })

  describe('Turbo Type mode', () => {
    it('should start turbo type mode', async () => {
      const { result } = renderHook(() => useStressTest({
        turboTypeSpeed: 100,
        autoStopAfterSeconds: 0.5 // Stop after 500ms for test
      }))

      expect(result.current.stats.turboTypeActive).toBe(false)

      await act(async () => {
        result.current.startTurboType()
      })

      expect(result.current.stats.turboTypeActive).toBe(true)
      expect(result.current.isRunning).toBe(true)
    })

    it('should stop turbo type mode', async () => {
      const { result } = renderHook(() => useStressTest())

      await act(async () => {
        result.current.startTurboType()
      })

      expect(result.current.stats.turboTypeActive).toBe(true)

      await act(async () => {
        result.current.stopTurboType()
      })

      expect(result.current.stats.turboTypeActive).toBe(false)
    })

    it('should toggle turbo type mode', async () => {
      const { result } = renderHook(() => useStressTest())

      // Start
      await act(async () => {
        result.current.toggleTurboType()
      })
      expect(result.current.stats.turboTypeActive).toBe(true)

      // Stop
      await act(async () => {
        result.current.toggleTurboType()
      })
      expect(result.current.stats.turboTypeActive).toBe(false)
    })

    it('should type characters', async () => {
      const { result } = renderHook(() => useStressTest({
        turboTypeSpeed: 100,
        autoStopAfterSeconds: 0.3
      }))

      await act(async () => {
        result.current.startTurboType()
      })

      // Wait for some typing
      await waitFor(() => {
        expect(result.current.stats.turboTypeCharsTyped).toBeGreaterThan(0)
      }, { timeout: 500 })

      await act(async () => {
        result.current.stopTurboType()
      })

      // Verify content was added
      const content = editorStore.get(contentAtom)
      expect(content.length).toBeGreaterThan(0)
    })

    it('should create snapshots during turbo type', async () => {
      const initialHistoryLength = editorTimeTravel.getHistory().length

      const { result } = renderHook(() => useStressTest({
        turboTypeSpeed: 200,
        autoStopAfterSeconds: 0.5
      }))

      await act(async () => {
        result.current.startTurboType()
      })

      // Wait for typing and snapshot creation
      await waitFor(() => {
        expect(editorTimeTravel.getHistory().length).toBeGreaterThan(initialHistoryLength)
      }, { timeout: 1000 })

      await act(async () => {
        result.current.stopTurboType()
      })
    })
  })

  describe('Snapshot Storm mode', () => {
    it('should start snapshot storm mode', async () => {
      const { result } = renderHook(() => useStressTest({
        snapshotStormCount: 5,
        snapshotStormInterval: 10
      }))

      expect(result.current.stats.snapshotStormActive).toBe(false)

      await act(async () => {
        result.current.startSnapshotStorm()
      })

      expect(result.current.stats.snapshotStormActive).toBe(true)
      expect(result.current.isRunning).toBe(true)
    })

    it('should stop snapshot storm mode', async () => {
      const { result } = renderHook(() => useStressTest({
        snapshotStormCount: 10,
        snapshotStormInterval: 10
      }))

      await act(async () => {
        result.current.startSnapshotStorm()
      })

      expect(result.current.stats.snapshotStormActive).toBe(true)

      await act(async () => {
        result.current.stopSnapshotStorm()
      })

      expect(result.current.stats.snapshotStormActive).toBe(false)
    })

    it('should toggle snapshot storm mode', async () => {
      const { result } = renderHook(() => useStressTest({
        snapshotStormCount: 10,
        snapshotStormInterval: 10
      }))

      // Start
      await act(async () => {
        result.current.toggleSnapshotStorm()
      })
      expect(result.current.stats.snapshotStormActive).toBe(true)

      // Stop
      await act(async () => {
        result.current.toggleSnapshotStorm()
      })
      expect(result.current.stats.snapshotStormActive).toBe(false)
    })

    it('should create multiple snapshots', async () => {
      const initialHistoryLength = editorTimeTravel.getHistory().length
      const snapshotCount = 5

      const { result } = renderHook(() => useStressTest({
        snapshotStormCount: snapshotCount,
        snapshotStormInterval: 10
      }))

      await act(async () => {
        result.current.startSnapshotStorm()
      })

      // Wait for storm to complete
      await waitFor(() => {
        expect(result.current.stats.snapshotsCreated).toBe(snapshotCount)
      }, { timeout: 2000 })

      // Verify snapshots were created
      const finalHistoryLength = editorTimeTravel.getHistory().length
      expect(finalHistoryLength).toBeGreaterThanOrEqual(initialHistoryLength + snapshotCount)
    })

    it('should track snapshot creation time', async () => {
      const { result } = renderHook(() => useStressTest({
        snapshotStormCount: 3,
        snapshotStormInterval: 10
      }))

      await act(async () => {
        result.current.startSnapshotStorm()
      })

      // Wait for storm to complete
      await waitFor(() => {
        expect(result.current.stats.snapshotsCreated).toBeGreaterThan(0)
      }, { timeout: 1000 })

      // Verify timing stats
      expect(result.current.stats.avgSnapshotTime).toBeGreaterThanOrEqual(0)
      expect(result.current.stats.maxSnapshotTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('stopAll', () => {
    it('should stop all running tests', async () => {
      const { result } = renderHook(() => useStressTest({
        turboTypeSpeed: 100,
        snapshotStormCount: 100,
        snapshotStormInterval: 10
      }))

      // Start turbo type
      await act(async () => {
        result.current.startTurboType()
      })

      expect(result.current.stats.turboTypeActive).toBe(true)

      // Stop all
      await act(async () => {
        result.current.stopAll()
      })

      expect(result.current.stats.turboTypeActive).toBe(false)
      expect(result.current.stats.snapshotStormActive).toBe(false)
      expect(result.current.isRunning).toBe(false)
    })
  })

  describe('resetStats', () => {
    it('should reset all statistics', async () => {
      const { result } = renderHook(() => useStressTest({
        turboTypeSpeed: 100,
        autoStopAfterSeconds: 0.3
      }))

      // Run turbo type
      await act(async () => {
        result.current.startTurboType()
      })

      await waitFor(() => {
        expect(result.current.stats.turboTypeCharsTyped).toBeGreaterThan(0)
      }, { timeout: 500 })

      await act(async () => {
        result.current.stopTurboType()
      })

      const statsBeforeReset = { ...result.current.stats }
      expect(statsBeforeReset.totalOperations).toBeGreaterThan(0)

      // Reset stats
      await act(async () => {
        result.current.resetStats()
      })

      const statsAfterReset = result.current.stats
      expect(statsAfterReset.turboTypeCharsTyped).toBe(0)
      expect(statsAfterReset.totalOperations).toBe(0)
      expect(statsAfterReset.turboTypeActive).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should track errors', async () => {
      const { result } = renderHook(() => useStressTest())

      // Initial errors should be 0
      expect(result.current.stats.errorsCount).toBe(0)
    })
  })

  describe('concurrent modes', () => {
    it('should prevent running both modes simultaneously', async () => {
      const { result } = renderHook(() => useStressTest({
        turboTypeSpeed: 100,
        snapshotStormCount: 100,
        snapshotStormInterval: 10
      }))

      // Start turbo type
      await act(async () => {
        result.current.startTurboType()
      })

      expect(result.current.stats.turboTypeActive).toBe(true)

      // Try to start snapshot storm (should be disabled)
      await act(async () => {
        result.current.startSnapshotStorm()
      })

      // Snapshot storm should not start while turbo type is running
      expect(result.current.stats.snapshotStormActive).toBe(false)

      await act(async () => {
        result.current.stopAll()
      })
    })
  })
})

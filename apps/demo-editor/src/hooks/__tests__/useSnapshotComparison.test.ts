/**
 * Tests for hookа useSnapshotComparison
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnapshotComparison } from '../useSnapshotComparison'
import { editorTimeTravel } from '@/store/timeTravel'

// Mocks for editorTimeTravel
vi.mock('@/store/timeTravel', () => ({
  editorTimeTravel: {
    compareSnapshots: vi.fn(),
    getHistory: vi.fn(() => [])
  }
}))

describe('useSnapshotComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return начальное состояние', () => {
    const { result } = renderHook(() => useSnapshotComparison())

    expect(result.current.baseline).toBeNull()
    expect(result.current.comparison).toBeNull()
    expect(result.current.mode).toBe('inline')
    expect(result.current.result).toBeNull()
    expect(result.current.isComparing).toBe(false)
  })

  it('should позволять выбрать базовый snapshot', () => {
    const mockSnapshot = {
      id: 'snapshot-1',
      state: {},
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    const { result } = renderHook(() => useSnapshotComparison())

    act(() => {
      result.current.selectBaseline(mockSnapshot)
    })

    expect(result.current.baseline).toEqual(mockSnapshot)
    expect(result.current.comparison).toBeNull()
  })

  it('should позволять выбрать snapshot for comparison', () => {
    const mockSnapshot = {
      id: 'snapshot-2',
      state: {},
      metadata: {
        timestamp: Date.now(),
        action: 'paste',
        atomCount: 2
      }
    }

    const { result } = renderHook(() => useSnapshotComparison())

    act(() => {
      result.current.selectComparison(mockSnapshot)
    })

    expect(result.current.comparison).toEqual(mockSnapshot)
    expect(result.current.baseline).toBeNull()
  })

  it('should выполнять автоматическое comparison при выборе обоих снимков', async () => {
    const mockSnapshot1 = {
      id: 'snapshot-1',
      state: { content: { value: 'Hello', type: 'writable' } },
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    const mockSnapshot2 = {
      id: 'snapshot-2',
      state: { content: { value: 'Hello World', type: 'writable' } },
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    const mockComparisonResult = {
      id: 'cmp-123',
      timestamp: Date.now(),
      summary: {
        totalAtoms: 1,
        changedAtoms: 1,
        addedAtoms: 0,
        removedAtoms: 0,
        unchangedAtoms: 0,
        hasChanges: true,
        changePercentage: 100
      },
      atoms: [],
      statistics: {
        duration: 10,
        memoryUsed: 100,
        depth: 1,
        totalComparisons: 1,
        cacheHits: 0,
        cacheMisses: 1
      },
      metadata: {
        snapshotA: { id: 'snapshot-1', timestamp: Date.now() },
        snapshotB: { id: 'snapshot-2', timestamp: Date.now() },
        timeDifference: 0
      }
    }

    vi.mocked(editorTimeTravel.compareSnapshots).mockReturnValue(mockComparisonResult)

    const { result } = renderHook(() => useSnapshotComparison({ autoCompare: true }))

    act(() => {
      result.current.selectBaseline(mockSnapshot1)
      result.current.selectComparison(mockSnapshot2)
    })

    // Ждем выполнения асинхронного comparison
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(editorTimeTravel.compareSnapshots).toHaveBeenCalledWith(
      mockSnapshot1,
      mockSnapshot2,
      expect.objectContaining({
        deepCompare: true,
        compareMetadata: false,
        cacheResults: true
      })
    )
  })

  it('should позволять изменить mode display', () => {
    const { result } = renderHook(() => useSnapshotComparison())

    act(() => {
      result.current.setMode('split')
    })

    expect(result.current.mode).toBe('split')

    act(() => {
      result.current.setMode('unified')
    })

    expect(result.current.mode).toBe('unified')
  })

  it('should сбрасывать выбор при вызове reset', () => {
    const mockSnapshot1 = {
      id: 'snapshot-1',
      state: {},
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    const mockSnapshot2 = {
      id: 'snapshot-2',
      state: {},
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    const { result } = renderHook(() => useSnapshotComparison())

    act(() => {
      result.current.selectBaseline(mockSnapshot1)
      result.current.selectComparison(mockSnapshot2)
    })

    expect(result.current.baseline).toEqual(mockSnapshot1)
    expect(result.current.comparison).toEqual(mockSnapshot2)

    act(() => {
      result.current.reset()
    })

    expect(result.current.baseline).toBeNull()
    expect(result.current.comparison).toBeNull()
    expect(result.current.result).toBeNull()
  })

  it('should return isComparing=true когда оба снимка выбраны', () => {
    const mockSnapshot1 = {
      id: 'snapshot-1',
      state: {},
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    const mockSnapshot2 = {
      id: 'snapshot-2',
      state: {},
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    const { result } = renderHook(() => useSnapshotComparison())

    expect(result.current.isComparing).toBe(false)

    act(() => {
      result.current.selectBaseline(mockSnapshot1)
      result.current.selectComparison(mockSnapshot2)
    })

    expect(result.current.isComparing).toBe(true)
  })

  it('should отключать autoCompare при установке autoCompare: false', () => {
    const mockSnapshot1 = {
      id: 'snapshot-1',
      state: {},
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    const mockSnapshot2 = {
      id: 'snapshot-2',
      state: {},
      metadata: {
        timestamp: Date.now(),
        action: 'text-edit',
        atomCount: 1
      }
    }

    // Сбрасываем счетчик вызовов после начального рендера
    vi.mocked(editorTimeTravel.compareSnapshots).mockClear()

    const { result } = renderHook(() => useSnapshotComparison({ autoCompare: false }))

    act(() => {
      result.current.selectBaseline(mockSnapshot1)
      result.current.selectComparison(mockSnapshot2)
    })

    // compareSnapshots не should вызываться автоматически
    expect(editorTimeTravel.compareSnapshots).not.toHaveBeenCalled()
  })
})

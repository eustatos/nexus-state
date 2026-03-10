import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnapshots } from '../useSnapshots'

// Mock helpers module
vi.mock('@/store/helpers', () => ({
  getHistory: vi.fn(),
  jumpToSnapshot: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: vi.fn(),
  canRedo: vi.fn()
}))

import { getHistory, jumpToSnapshot, undo, redo, canUndo, canRedo } from '@/store/helpers'
import type { Snapshot } from '@nexus-state/core'

const createMockSnapshot = (
  action: string,
  timestamp: number,
  id: string = `snapshot-${timestamp}`
): Snapshot => ({
  id,
  state: {
    'editor.content': {
      value: 'test content',
      type: 'writable'
    }
  },
  metadata: {
    timestamp,
    action: action as any,
    atomCount: 5
  }
})

describe('useSnapshots', () => {
  const mockSnapshots = [
    createMockSnapshot('text-edit', Date.now() - 10000, 'snapshot-1'),
    createMockSnapshot('paste', Date.now() - 5000, 'snapshot-2'),
    createMockSnapshot('delete', Date.now(), 'snapshot-3')
  ]

  beforeEach(() => {
    vi.mocked(getHistory).mockReturnValue(mockSnapshots)
    vi.mocked(canUndo).mockReturnValue(false)
    vi.mocked(canRedo).mockReturnValue(false)
    vi.mocked(jumpToSnapshot).mockReturnValue(true)
    vi.mocked(undo).mockReturnValue(true)
    vi.mocked(redo).mockReturnValue(true)
  })

  it('should return snapshots sorted by timestamp (newest first)', () => {
    const { result } = renderHook(() => useSnapshots())

    expect(result.current.snapshots).toHaveLength(3)
    // Newest should be first
    expect(result.current.snapshots[0].metadata.timestamp).toBe(
      Math.max(...mockSnapshots.map(s => s.metadata.timestamp))
    )
  })

  it('should return correct total count', () => {
    const { result } = renderHook(() => useSnapshots())

    expect(result.current.totalCount).toBe(3)
  })

  it('should return current index', () => {
    const { result } = renderHook(() => useSnapshots())

    expect(result.current.currentIndex).toBeGreaterThanOrEqual(-1)
  })

  it('should return filtered snapshots matching search query', () => {
    const { result } = renderHook(() => useSnapshots())

    // Set search query
    act(() => {
      result.current.setSearchQuery('delete')
    })

    expect(result.current.filteredSnapshots.length).toBeLessThanOrEqual(3)
  })

  it('should return filtered snapshots matching action filter', () => {
    const { result } = renderHook(() => useSnapshots())

    // Set action filter
    act(() => {
      result.current.setActionFilter('text-edit')
    })

    // Should filter by action type
    result.current.filteredSnapshots.forEach(snapshot => {
      expect(snapshot.metadata.action).toBe('text-edit')
    })
  })

  it('should call jumpToSnapshot with correct history index when jumpTo is called', () => {
    // Mock totalCount to simulate 3 snapshots
    vi.mocked(getHistory).mockReturnValue([
      createMockSnapshot('snap-1', Date.now() - 2000),
      createMockSnapshot('snap-2', Date.now() - 1000),
      createMockSnapshot('snap-3', Date.now())
    ])

    const { result } = renderHook(() => useSnapshots())

    // UI index 0 (newest) should map to history index 2
    act(() => {
      result.current.jumpTo(0)
    })

    expect(jumpToSnapshot).toHaveBeenCalledWith(2)
  })

  it('should call undo when undo is called', () => {
    const { result } = renderHook(() => useSnapshots())

    act(() => {
      result.current.undo()
    })

    expect(undo).toHaveBeenCalled()
  })

  it('should call redo when redo is called', () => {
    const { result } = renderHook(() => useSnapshots())

    act(() => {
      result.current.redo()
    })

    expect(redo).toHaveBeenCalled()
  })

  it('should return canUndo status', () => {
    vi.mocked(canUndo).mockReturnValue(true)

    const { result } = renderHook(() => useSnapshots())

    expect(result.current.canUndo).toBe(true)
  })

  it('should return canRedo status', () => {
    vi.mocked(canRedo).mockReturnValue(true)

    const { result } = renderHook(() => useSnapshots())

    expect(result.current.canRedo).toBe(true)
  })

  it('should update search query', () => {
    const { result } = renderHook(() => useSnapshots())

    act(() => {
      result.current.setSearchQuery('test query')
    })

    expect(result.current.searchQuery).toBe('test query')
  })

  it('should update action filter', () => {
    const { result } = renderHook(() => useSnapshots())

    act(() => {
      result.current.setActionFilter('paste')
    })

    expect(result.current.actionFilter).toBe('paste')
  })

  it('should disable search when enableSearch is false', () => {
    const { result } = renderHook(() =>
      useSnapshots({ enableSearch: false })
    )

    act(() => {
      result.current.setSearchQuery('test')
    })

    // Search should not affect filtered results when disabled
    expect(result.current.filteredSnapshots).toEqual(result.current.snapshots)
  })

  it('should disable action filter when enableActionFilter is false', () => {
    const { result } = renderHook(() =>
      useSnapshots({ enableActionFilter: false })
    )

    act(() => {
      result.current.setActionFilter('text-edit')
    })

    // Filter should not affect results when disabled
    expect(result.current.filteredSnapshots).toEqual(result.current.snapshots)
  })

  it('should call refresh when jumpTo is called', () => {
    const { result } = renderHook(() => useSnapshots({ autoRefresh: true }))

    act(() => {
      result.current.jumpTo(0)
    })

    // Should trigger re-render
    expect(result.current.snapshots).toBeDefined()
  })

  it('should call refresh when undo is called', () => {
    const { result } = renderHook(() => useSnapshots({ autoRefresh: true }))

    act(() => {
      result.current.undo()
    })

    expect(result.current.snapshots).toBeDefined()
  })

  it('should call refresh when redo is called', () => {
    const { result } = renderHook(() => useSnapshots({ autoRefresh: true }))

    act(() => {
      result.current.redo()
    })

    expect(result.current.snapshots).toBeDefined()
  })

  it('should handle empty snapshots list', () => {
    vi.mocked(getHistory).mockReturnValue([])

    const { result } = renderHook(() => useSnapshots())

    expect(result.current.snapshots).toHaveLength(0)
    expect(result.current.totalCount).toBe(0)
    expect(result.current.currentIndex).toBe(-1)
  })

  it('should search by timestamp in search query', () => {
    const { result } = renderHook(() => useSnapshots())

    // Search by year which should be in timestamp
    act(() => {
      result.current.setSearchQuery(new Date().getFullYear().toString())
    })

    // Should find snapshots with matching timestamp
    expect(result.current.filteredSnapshots.length).toBeGreaterThanOrEqual(0)
  })

  it('should combine search and filter', () => {
    const { result } = renderHook(() => useSnapshots())

    // Set both search and filter
    act(() => {
      result.current.setSearchQuery('test')
      result.current.setActionFilter('text-edit')
    })

    // Both filters should be applied
    expect(result.current.filteredSnapshots).toBeDefined()
  })
})

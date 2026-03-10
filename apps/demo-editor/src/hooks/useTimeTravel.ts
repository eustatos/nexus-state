import { useCallback, useEffect, useState, useMemo } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'

/**
 * Return type for useTimeTravel hook
 */
export interface UseTimeTravelReturn {
  currentPosition: number
  snapshotsCount: number
  canUndo: boolean
  canRedo: boolean
  jumpTo: (index: number) => boolean
  undo: () => boolean
  redo: () => boolean
  jumpToFirst: () => boolean
  jumpToLast: () => boolean
  jumpToPrev: () => boolean
  jumpToNext: () => boolean
  getHistory: () => ReturnType<typeof editorTimeTravel.getHistory>
}

/**
 * Time-travel navigation hook
 *
 * Provides methods for navigating through snapshot history
 * and synchronizes state with UI components.
 */
export function useTimeTravel(): UseTimeTravelReturn {
  // State for forcing re-render on changes
  const [version, setVersion] = useState(0)

  // Get snapshot history - always current version
  const history = useMemo(() => {
    const h = editorTimeTravel.getHistory()
    // Force re-computation when version changes
    void version // eslint-disable-line @typescript-eslint/no-unused-vars
    return h
  }, [version])

  const snapshotsCount = history.length

  // Get current position from time-travel
  const canUndo = editorTimeTravel.canUndo()
  const canRedo = editorTimeTravel.canRedo()
  const stats = editorTimeTravel.getHistoryStats()

  // Use currentIndex from stats if available, otherwise calculate
  const currentPosition = useMemo(() => {
    // stats.currentIndex may be available in some implementations
    if (stats && 'currentIndex' in stats && typeof stats.currentIndex === 'number') {
      return stats.currentIndex
    }

    // Fallback: calculate based on canUndo/canRedo
    if (snapshotsCount === 0) return 0
    if (!canUndo) return 0
    if (!canRedo) return snapshotsCount - 1
    // We're somewhere in the middle - assume we're on the last one
    return snapshotsCount - 1
  }, [snapshotsCount, canUndo, canRedo, stats])

  /**
   * Jump to specific snapshot by index
   */
  const jumpTo = useCallback((index: number) => {
    console.log('[useTimeTravel.jumpTo] called with index:', index)
    const success = editorTimeTravel.jumpTo(index)
    console.log('[useTimeTravel.jumpTo] result:', success)
    // Force update state after jumpTo
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Jump to previous snapshot (undo)
   */
  const undo = useCallback(() => {
    const success = editorTimeTravel.undo()
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Jump to next snapshot (redo)
   */
  const redo = useCallback(() => {
    const success = editorTimeTravel.redo()
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Jump to first snapshot
   */
  const jumpToFirst = useCallback(() => {
    return jumpTo(0)
  }, [jumpTo])

  /**
   * Jump to last snapshot
   */
  const jumpToLast = useCallback(() => {
    return jumpTo(snapshotsCount - 1)
  }, [jumpTo, snapshotsCount])

  /**
   * Jump to previous snapshot
   */
  const jumpToPrev = useCallback(() => {
    const newIndex = Math.max(0, currentPosition - 1)
    return jumpTo(newIndex)
  }, [currentPosition, jumpTo])

  /**
   * Jump to next snapshot
   */
  const jumpToNext = useCallback(() => {
    const newIndex = Math.min(snapshotsCount - 1, currentPosition + 1)
    return jumpTo(newIndex)
  }, [currentPosition, snapshotsCount, jumpTo])

  // Subscribe to time-travel changes for auto-refresh
  useEffect(() => {
    // Subscribe to navigation events (undo/redo/jump)
    const unsubscribeUndo = editorTimeTravel.subscribe('undo', () => {
      setVersion(v => v + 1)
    })

    const unsubscribeRedo = editorTimeTravel.subscribe('redo', () => {
      setVersion(v => v + 1)
    })

    const unsubscribeJump = editorTimeTravel.subscribe('jump', () => {
      setVersion(v => v + 1)
    })

    // Subscribe to new snapshot creation
    const unsubscribeSnapshots = editorTimeTravel.subscribeToSnapshots(() => {
      setVersion(v => v + 1)
    })

    return () => {
      unsubscribeUndo?.()
      unsubscribeRedo?.()
      unsubscribeJump?.()
      unsubscribeSnapshots?.()
    }
  }, [])

  return {
    currentPosition,
    snapshotsCount,
    canUndo,
    canRedo,
    jumpTo,
    undo,
    redo,
    jumpToFirst,
    jumpToLast,
    jumpToPrev,
    jumpToNext,
    getHistory: useCallback(() => history, [history])
  }
}

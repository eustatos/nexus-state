import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Snapshot } from '@nexus-state/core'
import { getHistory, jumpToSnapshot, undo, redo, canUndo, canRedo } from '@/store/helpers'
import { editorTimeTravel } from '@/store/timeTravel'

export interface UseSnapshotsReturn {
  /** All snapshots sorted by time (newest first) */
  snapshots: Snapshot[]
  /** Current snapshot index in history */
  currentIndex: number
  /** Total number of snapshots */
  totalCount: number
  /** Jump to snapshot by index */
  jumpTo: (index: number) => boolean
  /** Undo last change */
  undo: () => boolean
  /** Redo undone change */
  redo: () => boolean
  /** Can undo */
  canUndo: boolean
  /** Can redo */
  canRedo: boolean
  /** Search query */
  searchQuery: string
  /** Set search query */
  setSearchQuery: (query: string) => void
  /** Filter by action type */
  actionFilter: string
  /** Set action filter */
  setActionFilter: (action: string) => void
  /** Filtered snapshots */
  filteredSnapshots: Snapshot[]
  /** Update snapshot list (force re-fetch) */
  refresh: () => void
}

export interface UseSnapshotsOptions {
  /** Enable search */
  enableSearch?: boolean
  /** Enable action filter */
  enableActionFilter?: boolean
  /** Auto-refresh on changes */
  autoRefresh?: boolean
}

/**
 * Hook for working with time-travel snapshot list
 *
 * @param options - Hook options
 * @returns Object with snapshot data and management methods
 */
export function useSnapshots(
  options: UseSnapshotsOptions = {}
): UseSnapshotsReturn {
  const {
    enableSearch = true,
    enableActionFilter = true,
    autoRefresh = true
  } = options

  // State for forcing list update
  const [version, forceUpdate] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  // Get snapshots from history
  const getSnapshots = useCallback((): Snapshot[] => {
    return getHistory()
  }, [])

  // Find current snapshot index in history (before sorting)
  // Returns -1 if not on the newest snapshot (has redo)
  // Returns snapshots.length - 1 if on the newest snapshot
  const getCurrentIndex = useCallback((): number => {
    const snapshots = getSnapshots()
    if (snapshots.length === 0) return -1

    // If canRedo = false, we're on the last snapshot (newest)
    // If canRedo = true, we've scrolled back
    if (!canRedo()) {
      return snapshots.length - 1 // On the last snapshot (newest)
    }

    // We've scrolled back - return -1 to not highlight any snapshot as "Current"
    return -1
  }, [getSnapshots, canRedo])

  // Update snapshot list
  const refresh = useCallback(() => {
    if (autoRefresh) {
      forceUpdate(n => n + 1)
    }
  }, [autoRefresh])

  // All snapshots sorted by time (newest first)
  const snapshots = useMemo(() => {
    const allSnapshots = getSnapshots()
    // Sort by timestamp (newest first)
    return [...allSnapshots].sort(
      (a, b) => b.metadata.timestamp - a.metadata.timestamp
    )
  }, [getSnapshots, version])

  const currentIndex = getCurrentIndex()
  const totalCount = snapshots.length

  // Filter snapshots
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter(snapshot => {
      // Search by action and timestamp
      if (enableSearch && searchQuery) {
        const query = searchQuery.toLowerCase()
        const action = snapshot.metadata.action?.toLowerCase() || ''
        const timestamp = new Date(snapshot.metadata.timestamp).toLocaleString()

        if (!action.includes(query) && !timestamp.includes(query)) {
          return false
        }
      }

      // Filter by action type
      if (enableActionFilter && actionFilter) {
        if (snapshot.metadata.action !== actionFilter) {
          return false
        }
      }

      return true
    })
  }, [snapshots, enableSearch, searchQuery, enableActionFilter, actionFilter])

  // Jump to snapshot by index
  const jumpTo = useCallback((uiIndex: number): boolean => {
    // uiIndex is index in UI (sorted list, 0 = newest)
    // historyIndex is index in history (0 = oldest)
    // Conversion: historyIndex = totalCount - 1 - uiIndex
    const historyIndex = totalCount - 1 - uiIndex
    const result = jumpToSnapshot(historyIndex)
    refresh()
    return result
  }, [refresh, totalCount])

  // Undo
  const handleUndo = useCallback((): boolean => {
    const result = undo()
    refresh()
    return result
  }, [refresh])

  // Redo
  const handleRedo = useCallback((): boolean => {
    const result = redo()
    refresh()
    return result
  }, [refresh])

  // Subscribe to time-travel events for auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    // Subscribe to snapshot creation events
    const unsubscribeSnapshots = editorTimeTravel.subscribeToSnapshots(() => {
      refresh()
    })

    // Subscribe to navigation events (undo/redo/jump)
    const unsubscribeUndo = editorTimeTravel.subscribe('undo', () => {
      refresh()
    })

    const unsubscribeRedo = editorTimeTravel.subscribe('redo', () => {
      refresh()
    })

    const unsubscribeJump = editorTimeTravel.subscribe('jump', () => {
      refresh()
    })

    return () => {
      unsubscribeSnapshots()
      unsubscribeUndo()
      unsubscribeRedo()
      unsubscribeJump()
    }
  }, [autoRefresh, refresh])

  return {
    snapshots,
    currentIndex,
    totalCount,
    jumpTo,
    undo: handleUndo,
    redo: handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    searchQuery,
    setSearchQuery,
    actionFilter,
    setActionFilter,
    filteredSnapshots,
    refresh
  }
}

import { useState, useCallback, useMemo } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'
import type { Snapshot } from '@nexus-state/core'
import type { SnapshotComparison, ComparisonOptions } from '@nexus-state/core/time-travel/comparison'

export type DiffMode = 'inline' | 'split' | 'unified'

export interface UseSnapshotComparisonReturn {
  /** Baseline snapshot for comparison */
  baseline: Snapshot | null
  /** Comparison snapshot */
  comparison: Snapshot | null
  /** Diff display mode */
  mode: DiffMode
  /** Comparison result */
  result: SnapshotComparison | null
  /** Set display mode */
  setMode: (mode: DiffMode) => void
  /** Select baseline snapshot */
  selectBaseline: (snapshot: Snapshot) => void
  /** Select comparison snapshot */
  selectComparison: (snapshot: Snapshot) => void
  /** Reset snapshot selection */
  reset: () => void
  /** Is comparison active */
  isComparing: boolean
  /** Perform comparison */
  compare: () => SnapshotComparison | null
}

export interface UseSnapshotComparisonOptions {
  /** Comparison options */
  comparisonOptions?: Partial<ComparisonOptions>
  /** Auto-compare when both snapshots are selected */
  autoCompare?: boolean
}

/**
 * Hook for managing snapshot comparison
 *
 * @param options - Hook options
 * @returns Object with comparison data and control methods
 */
export function useSnapshotComparison(
  options: UseSnapshotComparisonOptions = {}
): UseSnapshotComparisonReturn {
  const {
    comparisonOptions = {},
    autoCompare = true
  } = options

  const [baseline, setBaseline] = useState<Snapshot | null>(null)
  const [comparison, setComparison] = useState<Snapshot | null>(null)
  const [mode, setMode] = useState<DiffMode>('inline')
  const [cachedResult, setCachedResult] = useState<SnapshotComparison | null>(null)

  /**
   * Perform comparison of two snapshots
   */
  const compare = useCallback((): SnapshotComparison | null => {
    if (!baseline || !comparison) {
      return null
    }

    try {
      const result = editorTimeTravel.compareSnapshots(
        baseline,
        comparison,
        {
          deepCompare: true,
          compareMetadata: false,
          cacheResults: true,
          ...comparisonOptions
        }
      )

      setCachedResult(result)
      return result
    } catch (error) {
      console.error('[useSnapshotComparison] Error comparing snapshots:', error)
      return null
    }
  }, [baseline, comparison, comparisonOptions])

  /**
   * Select baseline snapshot
   */
  const selectBaseline = useCallback((snapshot: Snapshot) => {
    setBaseline(snapshot)
    setCachedResult(null)

    if (comparison && autoCompare) {
      // Auto-compare if both snapshots are selected
      setTimeout(() => compare(), 0)
    }
  }, [comparison, autoCompare, compare])

  /**
   * Select comparison snapshot
   */
  const selectComparison = useCallback((snapshot: Snapshot) => {
    setComparison(snapshot)
    setCachedResult(null)

    if (baseline && autoCompare) {
      // Auto-compare if both snapshots are selected
      setTimeout(() => compare(), 0)
    }
  }, [baseline, autoCompare, compare])

  /**
   * Reset snapshot selection
   */
  const reset = useCallback(() => {
    setBaseline(null)
    setComparison(null)
    setCachedResult(null)
  }, [])

  /**
   * Check if comparison is active
   */
  const isComparing = useMemo(() => {
    return baseline !== null && comparison !== null
  }, [baseline, comparison])

  /**
   * Comparison result - computed automatically
   */
  const result = useMemo(() => {
    if (cachedResult) {
      return cachedResult
    }

    if (baseline && comparison) {
      return compare()
    }

    return null
  }, [cachedResult, baseline, comparison, compare])

  return {
    baseline,
    comparison,
    mode,
    setMode,
    selectBaseline,
    selectComparison,
    reset,
    isComparing,
    compare,
    result
  }
}

import { useState, useCallback, useMemo } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'
import type { Snapshot } from '@nexus-state/core'
import type { SnapshotComparison, ComparisonOptions } from '@nexus-state/core'

export type DiffMode = 'inline' | 'split' | 'unified'

export interface UseSnapshotComparisonReturn {
  /** Базовый снимок для сравнения */
  baseline: Snapshot | null
  /** Снимок для сравнения с базовым */
  comparison: Snapshot | null
  /** Режим отображения diff */
  mode: DiffMode
  /** Результат сравнения */
  result: SnapshotComparison | null
  /** Установить режим отображения */
  setMode: (mode: DiffMode) => void
  /** Выбрать базовый снимок */
  selectBaseline: (snapshot: Snapshot) => void
  /** Выбрать снимок для сравнения */
  selectComparison: (snapshot: Snapshot) => void
  /** Сбросить выбор снимков */
  reset: () => void
  /** Активно ли сравнение */
  isComparing: boolean
  /** Выполнить сравнение */
  compare: () => SnapshotComparison | null
}

export interface UseSnapshotComparisonOptions {
  /** Опции сравнения */
  comparisonOptions?: Partial<ComparisonOptions>
  /** Автоматическое сравнение при выборе обоих снимков */
  autoCompare?: boolean
}

/**
 * Хук для управления сравнением снимков
 *
 * @param options - Опции хука
 * @returns Объект с данными и методами управления сравнением
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
   * Выполнить сравнение двух снимков
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
   * Выбрать базовый снимок
   */
  const selectBaseline = useCallback((snapshot: Snapshot) => {
    setBaseline(snapshot)
    setCachedResult(null)

    if (comparison && autoCompare) {
      // Автоматическое сравнение если оба снимка выбраны
      setTimeout(() => compare(), 0)
    }
  }, [comparison, autoCompare, compare])

  /**
   * Выбрать снимок для сравнения
   */
  const selectComparison = useCallback((snapshot: Snapshot) => {
    setComparison(snapshot)
    setCachedResult(null)

    if (baseline && autoCompare) {
      // Автоматическое сравнение если оба снимка выбраны
      setTimeout(() => compare(), 0)
    }
  }, [baseline, autoCompare, compare])

  /**
   * Сбросить выбор снимков
   */
  const reset = useCallback(() => {
    setBaseline(null)
    setComparison(null)
    setCachedResult(null)
  }, [])

  /**
   * Результат сравнения - вычисляется автоматически
   */
  const result = useMemo(() => {
    if (cachedResult) {
      return cachedResult
    }

    if (baseline && comparison && autoCompare) {
      return compare()
    }

    return null
  }, [cachedResult, baseline, comparison, autoCompare, compare])

  /**
   * Проверка, активно ли сравнение
   */
  const isComparing = baseline !== null && comparison !== null

  return {
    baseline,
    comparison,
    mode,
    result,
    setMode,
    selectBaseline,
    selectComparison,
    reset,
    isComparing,
    compare
  }
}

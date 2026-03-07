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
 * Хук для управления time-travel навигацией
 * 
 * Предоставляет методы для навигации по истории снимков
 * и синхронизирует состояние с UI компонентами.
 */
export function useTimeTravel(): UseTimeTravelReturn {
  // Состояние для принудительного ре-рендера при изменениях
  const [version, setVersion] = useState(0)

  // Получаем историю снимков - всегда актуальная версия
  const history = useMemo(() => {
    const h = editorTimeTravel.getHistory()
    // Force re-computation when version changes
    void version // eslint-disable-line @typescript-eslint/no-unused-vars
    return h
  }, [version])

  const snapshotsCount = history.length

  // Получаем текущую позицию из time-travel
  const canUndo = editorTimeTravel.canUndo()
  const canRedo = editorTimeTravel.canRedo()

  // Вычисляем текущую позицию на основе canUndo/canRedo
  // canUndo = true означает, что есть прошлые состояния (past.length > 0)
  // canRedo = true означает, что есть будущие состояния (future.length > 0)
  const currentPosition = useMemo(() => {
    if (snapshotsCount === 0) return 0
    // past.length = количество состояний до текущего
    // Если canUndo = false, значит past.length = 0, мы на первом (index 0)
    // Если canRedo = false, значит future.length = 0, мы на последнем
    if (!canUndo) return 0
    if (!canRedo) return snapshotsCount - 1
    // Мы где-то посередине - позиция = past.length
    // Но у нас нет доступа к past.length напрямую, используем эвристику
    return snapshotsCount - 1
  }, [snapshotsCount, canUndo, canRedo])

  /**
   * Переход к конкретному снимку по индексу
   */
  const jumpTo = useCallback((index: number) => {
    console.log('[useTimeTravel.jumpTo] called with index:', index)
    const success = editorTimeTravel.jumpTo(index)
    console.log('[useTimeTravel.jumpTo] result:', success)
    // После jumpTo принудительно обновляем состояние
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Переход к предыдущему снимку (undo)
   */
  const undo = useCallback(() => {
    const success = editorTimeTravel.undo()
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Переход к следующему снимку (redo)
   */
  const redo = useCallback(() => {
    const success = editorTimeTravel.redo()
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Переход к первому снимку
   */
  const jumpToFirst = useCallback(() => {
    return jumpTo(0)
  }, [jumpTo])

  /**
   * Переход к последнему снимку
   */
  const jumpToLast = useCallback(() => {
    return jumpTo(snapshotsCount - 1)
  }, [jumpTo, snapshotsCount])

  /**
   * Переход к предыдущему снимку
   */
  const jumpToPrev = useCallback(() => {
    const newIndex = Math.max(0, currentPosition - 1)
    return jumpTo(newIndex)
  }, [currentPosition, jumpTo])

  /**
   * Переход к следующему снимку
   */
  const jumpToNext = useCallback(() => {
    const newIndex = Math.min(snapshotsCount - 1, currentPosition + 1)
    return jumpTo(newIndex)
  }, [currentPosition, snapshotsCount, jumpTo])

  // Подписка на изменения в time-travel для авто-обновления
  useEffect(() => {
    // Подписка на события навигации (undo/redo/jumpTo)
    const unsubscribeNav = editorTimeTravel.subscribe('undo', () => {
      setVersion(v => v + 1)
    })

    // Подписка на создание новых снапшотов
    const unsubscribeSnapshots = editorTimeTravel.subscribeToSnapshots(() => {
      setVersion(v => v + 1)
    })

    return () => {
      unsubscribeNav?.()
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

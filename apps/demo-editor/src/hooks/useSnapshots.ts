import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Snapshot } from '@nexus-state/core'
import { getHistory, jumpToSnapshot, undo, redo, canUndo, canRedo } from '@/store/helpers'
import { editorTimeTravel } from '@/store/timeTravel'

export interface UseSnapshotsReturn {
  /** Все снимки, отсортированные по времени (новые сверху) */
  snapshots: Snapshot[]
  /** Индекс текущего снимка в истории */
  currentIndex: number
  /** Общее количество снимков */
  totalCount: number
  /** Перейти к снимку по индексу */
  jumpTo: (index: number) => boolean
  /** Отменить последнее изменение */
  undo: () => boolean
  /** Повторить отмененное изменение */
  redo: () => boolean
  /** Можно ли отменить */
  canUndo: boolean
  /** Можно ли повторить */
  canRedo: boolean
  /** Поисковый запрос */
  searchQuery: string
  /** Установить поисковый запрос */
  setSearchQuery: (query: string) => void
  /** Фильтр по типу действия */
  actionFilter: string
  /** Установить фильтр по действию */
  setActionFilter: (action: string) => void
  /** Отфильтрованные снимки */
  filteredSnapshots: Snapshot[]
  /** Обновить список снимков (force re-fetch) */
  refresh: () => void
}

export interface UseSnapshotsOptions {
  /** Включить поиск */
  enableSearch?: boolean
  /** Включить фильтр по действиям */
  enableActionFilter?: boolean
  /** Автоматическое обновление при изменениях */
  autoRefresh?: boolean
}

/**
 * Хук для работы со списком снимков time-travel
 *
 * @param options - Опции хука
 * @returns Объект с данными и методами управления снимками
 */
export function useSnapshots(
  options: UseSnapshotsOptions = {}
): UseSnapshotsReturn {
  const {
    enableSearch = true,
    enableActionFilter = true,
    autoRefresh = true
  } = options

  // Состояние для принудительного обновления списка
  const [version, forceUpdate] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  // Получаем снимки из истории
  const getSnapshots = useCallback((): Snapshot[] => {
    return getHistory()
  }, [])

  // Находим индекс текущего снимка в истории (до сортировки)
  // Возвращаем -1 если мы не на самом новом снимке (есть redo)
  // Возвращаем snapshots.length - 1 если мы на самом новом снимке
  const getCurrentIndex = useCallback((): number => {
    const snapshots = getSnapshots()
    if (snapshots.length === 0) return -1

    // Если canRedo = false, значит мы на последнем снимке (самом новом)
    // Если canRedo = true, значит мы откатились назад
    if (!canRedo()) {
      return snapshots.length - 1 // На последнем снимке (новый)
    }

    // Мы откатились назад - возвращаем -1 чтобы не подсвечивать ни один снимок как "Current"
    return -1
  }, [getSnapshots, canRedo])

  // Обновляем список снимков
  const refresh = useCallback(() => {
    if (autoRefresh) {
      forceUpdate(n => n + 1)
    }
  }, [autoRefresh])

  // Все снимки, отсортированные по времени (новые сверху)
  const snapshots = useMemo(() => {
    const allSnapshots = getSnapshots()
    // Сортируем по timestamp (новые сверху)
    return [...allSnapshots].sort(
      (a, b) => b.metadata.timestamp - a.metadata.timestamp
    )
  }, [getSnapshots, version])

  const currentIndex = getCurrentIndex()
  const totalCount = snapshots.length

  // Фильтрация снимков
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter(snapshot => {
      // Поиск по действию и timestamp
      if (enableSearch && searchQuery) {
        const query = searchQuery.toLowerCase()
        const action = snapshot.metadata.action?.toLowerCase() || ''
        const timestamp = new Date(snapshot.metadata.timestamp).toLocaleString()

        if (!action.includes(query) && !timestamp.includes(query)) {
          return false
        }
      }

      // Фильтр по типу действия
      if (enableActionFilter && actionFilter) {
        if (snapshot.metadata.action !== actionFilter) {
          return false
        }
      }

      return true
    })
  }, [snapshots, enableSearch, searchQuery, enableActionFilter, actionFilter])

  // Перейти к снимку по индексу
  const jumpTo = useCallback((uiIndex: number): boolean => {
    // uiIndex - это индекс в UI (отсортированном списке, 0 = самый новый)
    // historyIndex - это индекс в истории (0 = самый старый)
    // Преобразование: historyIndex = totalCount - 1 - uiIndex
    const historyIndex = totalCount - 1 - uiIndex
    console.log('[useSnapshots.jumpTo] UI index:', uiIndex, '-> history index:', historyIndex, 'totalCount:', totalCount)
    const result = jumpToSnapshot(historyIndex)
    console.log('[useSnapshots.jumpTo] result:', result)
    refresh()
    return result
  }, [refresh, totalCount])

  // Отмена
  const handleUndo = useCallback((): boolean => {
    const result = undo()
    refresh()
    return result
  }, [refresh])

  // Повтор
  const handleRedo = useCallback((): boolean => {
    const result = redo()
    refresh()
    return result
  }, [refresh])

  // Подписка на события time-travel для автообновления
  useEffect(() => {
    if (!autoRefresh) return

    // Подписка на события создания снимков
    const unsubscribeSnapshots = editorTimeTravel.subscribeToSnapshots(() => {
      refresh()
    })

    // Подписка на события навигации (undo/redo/jumpTo)
    const unsubscribeNav = editorTimeTravel.subscribe('undo', () => {
      refresh()
    })

    return () => {
      unsubscribeSnapshots()
      unsubscribeNav()
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

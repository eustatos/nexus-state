import { useRef, useCallback, useEffect } from 'react'
import { debounce } from '@/utils/debounce'
import { captureSnapshot } from '@/store/helpers'
import { useSetAtom } from '@nexus-state/react'
import { isSavingAtom } from '@/store/atoms/editor'
import { editorStore } from '@/store/store'

export interface UseDebounceSnapshotsOptions {
  delay?: number
  maxWait?: number
  enabled?: boolean
}

/**
 * Хук для debounce создания снимков time-travel
 * 
 * @param options - Опции debounce
 * @returns Объект с функциями управления снимками
 */
export function useDebounceSnapshots(
  options: UseDebounceSnapshotsOptions = {}
) {
  const {
    delay = 1000,
    maxWait = 5000,
    enabled = true
  } = options

  const captureRef = useRef<ReturnType<typeof debounce> | null>(null)
  const previousContentRef = useRef<string>('')
  const setIsSaving = useSetAtom(isSavingAtom, editorStore)

  // Создаем debounced функцию захвата
  useEffect(() => {
    if (!enabled) {
      captureRef.current?.cancel()
      captureRef.current = null
      return
    }

    captureRef.current = debounce(
      (action: string) => {
        const snapshot = captureSnapshot(action)
        if (snapshot) {
          console.log('[DebounceSnapshot] Captured:', {
            action,
            id: snapshot.id,
            timestamp: snapshot.metadata.timestamp
          })
          // Сбрасываем флаг сохранения после создания снимка
          setIsSaving(false)
        }
      },
      delay,
      { maxWait, leading: false, trailing: true }
    )

    return () => {
      captureRef.current?.cancel()
      captureRef.current = null
    }
  }, [delay, maxWait, enabled, setIsSaving])

  /**
   * Вычисление delta между старым и новым контентом
   */
  const calculateDelta = useCallback((oldText: string, newText: string) => {
    const added = newText.length - oldText.length
    const removed = oldText.length - newText.length

    let type: 'insert' | 'delete' | 'replace' | 'empty' = 'replace'
    if (added > 0 && removed === 0) {
      type = 'insert'
    } else if (removed > 0 && added === 0) {
      type = 'delete'
    } else if (added === 0 && removed === 0) {
      type = 'empty'
    }

    return {
      added: Math.max(0, added),
      removed: Math.max(0, removed),
      netChange: added,
      type
    }
  }, [])

  /**
   * Создание снимка с debounce
   * 
   * @param action - Тип действия
   * @param newContent - Новый контент
   */
  const captureSnapshotDebounced = useCallback((
    action: string = 'text-edit',
    newContent: string
  ) => {
    if (!enabled || !captureRef.current) {
      return
    }

    previousContentRef.current = newContent
    captureRef.current(action)
  }, [enabled])

  /**
   * Принудительный захват (игнорирует debounce)
   * 
   * @param action - Тип действия
   * @param newContent - Новый контент
   */
  const forceCapture = useCallback((
    action: string = 'manual-save',
    newContent: string
  ) => {
    if (!enabled) return

    const delta = calculateDelta(previousContentRef.current, newContent)
    previousContentRef.current = newContent

    const snapshot = captureSnapshot(action)

    if (snapshot) {
      console.log('[ForceCapture] Captured:', {
        action,
        id: snapshot.id,
        delta
      })
    }
  }, [enabled, calculateDelta])

  /**
   * Отмена отложенного захвата
   */
  const cancelPending = useCallback(() => {
    captureRef.current?.cancel()
  }, [])

  /**
   * Сброс предыдущего контента
   */
  const resetPreviousContent = useCallback((content: string) => {
    previousContentRef.current = content
  }, [])

  return {
    captureSnapshot: captureSnapshotDebounced,
    forceCapture,
    cancelPending,
    resetPreviousContent
  }
}

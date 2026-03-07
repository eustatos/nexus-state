import { editorTimeTravel } from './timeTravel'
import type { Snapshot } from '@nexus-state/core'

/**
 * Метаданные для снимка time-travel
 */
export interface SnapshotMetadata {
  /** Тип действия */
  action?: 'text-edit' | 'paste' | 'delete' | 'bulk-edit' | 'manual-save' | 'initial'
  /** Delta изменений */
  delta?: {
    added: number
    removed: number
    type: 'insert' | 'delete' | 'replace' | 'empty'
    netChange?: number
  }
  /** Триггер создания снимка */
  trigger?: 'debounce' | 'maxWait' | 'manual'
  /** Дополнительная информация */
  [key: string]: any
}

/**
 * Расширенный снимок с дополнительными метаданными
 */
export interface ExtendedSnapshot extends Snapshot {
  metadata: SnapshotMetadata & {
    timestamp: number
    action?: string
    atomCount: number
  }
}

/**
 * Результат проверки delta для подтверждения
 */
export interface DeltaThresholdCheck {
  /** Требуется ли подтверждение */
  requiresConfirmation: boolean
  /** Общее количество изменений */
  totalChanges: number
  /** Добавлено символов */
  added: number
  /** Удалено символов */
  removed: number
  /** Тип изменений */
  changeType: 'minor' | 'moderate' | 'significant' | 'major'
}

/**
 * Пороговые значения для подтверждения больших изменений
 */
export const DELTA_THRESHOLDS = {
  /** Minor: менее 50 изменений - без подтверждения */
  minor: 50,
  /** Moderate: 50-200 изменений - визуальная индикация */
  moderate: 200,
  /** Significant: 200-500 изменений - рекомендуется подтверждение */
  significant: 500,
  /** Major: более 500 изменений - требуется подтверждение */
  major: Infinity
} as const

/**
 * Создать снимок состояния
 *
 * @param action - Название действия для истории
 * @returns Созданный снимок или undefined если не удалось
 */
export function captureSnapshot(
  action: string = 'text-edit'
): ExtendedSnapshot | undefined {
  return editorTimeTravel.capture(action) as ExtendedSnapshot | undefined
}

/**
 * Проверить delta снимка на пороговые значения
 *
 * @param snapshot - Снимок для проверки
 * @returns Результат проверки порога
 */
export function checkDeltaThreshold(
  snapshot: ExtendedSnapshot
): DeltaThresholdCheck {
  const delta = snapshot.metadata.delta

  if (!delta) {
    return {
      requiresConfirmation: false,
      totalChanges: 0,
      added: 0,
      removed: 0,
      changeType: 'minor'
    }
  }

  const added = delta.added || 0
  const removed = delta.removed || 0
  const totalChanges = added + removed

  let changeType: DeltaThresholdCheck['changeType'] = 'minor'
  let requiresConfirmation = false

  if (totalChanges > DELTA_THRESHOLDS.significant) {
    changeType = 'major'
    requiresConfirmation = true
  } else if (totalChanges > DELTA_THRESHOLDS.minor) {
    changeType = totalChanges > DELTA_THRESHOLDS.moderate ? 'significant' : 'moderate'
  }

  return {
    requiresConfirmation,
    totalChanges,
    added,
    removed,
    changeType
  }
}

/**
 * Перейти к снимку по индексу
 *
 * @param index - Индекс снимка в истории (0-based)
 * @param options - Опции перехода
 * @param options.skipConfirmation - Пропустить подтверждение для больших delta
 * @returns true если переход успешен
 */
export function jumpToSnapshot(
  index: number,
  options: { skipConfirmation?: boolean } = {}
): boolean {
  const history = getHistory()

  if (index < 0 || index >= history.length) {
    console.warn(`[jumpToSnapshot] Invalid index: ${index}, history length: ${history.length}`)
    return false
  }

  const snapshot = history[index] as ExtendedSnapshot

  // Проверяем delta для больших изменений
  if (!options.skipConfirmation) {
    const deltaCheck = checkDeltaThreshold(snapshot)

    if (deltaCheck.requiresConfirmation) {
      const message = `Переход к этому снимку изменит ${deltaCheck.totalChanges} символов` +
        ` (+${deltaCheck.added}/-${deltaCheck.removed}). Продолжить?`

      if (!window.confirm(message)) {
        return false
      }
    }
  }

  return editorTimeTravel.jumpTo(index)
}

/**
 * Отменить последнее изменение
 * 
 * @returns true если отмена успешна
 */
export function undo(): boolean {
  return editorTimeTravel.undo()
}

/**
 * Повторить отмененное изменение
 * 
 * @returns true если повтор успешен
 */
export function redo(): boolean {
  return editorTimeTravel.redo()
}

/**
 * Проверить возможность отмены
 * 
 * @returns true если есть куда отменять
 */
export function canUndo(): boolean {
  return editorTimeTravel.canUndo()
}

/**
 * Проверить возможность повтора
 * 
 * @returns true если есть куда повторять
 */
export function canRedo(): boolean {
  return editorTimeTravel.canRedo()
}

/**
 * Получить историю снимков
 * 
 * @returns Массив всех снимков
 */
export function getHistory(): Snapshot[] {
  return editorTimeTravel.getHistory()
}

/**
 * Очистить историю снимков
 */
export function clearHistory(): void {
  editorTimeTravel.clearHistory()
}

/**
 * Get current snapshot (without adding to history)
 *
 * @returns Current snapshot or null
 */
export function getCurrentSnapshot(): Snapshot | null {
  return editorTimeTravel.getCurrentSnapshot() || null
}

/**
 * Получить статистику истории
 * 
 * @returns Статистика истории снимков
 */
export function getHistoryStats() {
  return editorTimeTravel.getHistoryStats()
}

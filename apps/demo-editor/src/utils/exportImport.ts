/**
 * Утилиты для экспорта и импорта состояния редактора
 */

import { editorTimeTravel } from '@/store/timeTravel'
import type { Snapshot } from '@nexus-state/core'
import type { ExportedState } from './exportFormatters'
import { formatAsHTML, formatAsMarkdown, formatAsPlainText } from './exportFormatters'

export type ExportFormat = 'json' | 'html' | 'markdown' | 'plaintext'
export type ExportRange = 'all' | 'selected' | 'current'

export interface ExportOptions {
  /** Формат экспорта */
  format: ExportFormat
  /** Диапазон экспорта */
  range: ExportRange
  /** ID выбранных снимков (для range='selected') */
  selectedIds?: string[]
  /** Включить содержимое снимков */
  includeContent: boolean
  /** Включить метаданные */
  includeMetadata: boolean
  /** Сжать данные */
  compress: boolean
}

export interface ImportOptions {
  /** Стратегия импорта */
  strategy: 'replace' | 'append'
  /** Импортируемые данные */
  data: ExportedState
}

export interface ImportResult {
  /** Успешность импорта */
  success: boolean
  /** Количество импортированных снимков */
  importedCount: number
  /** Ошибка (если есть) */
  error?: string
}

/**
 * Экспортировать состояние редактора
 *
 * @param options - Опции экспорта
 * @returns Экспортированные данные
 */
export function exportState(options: ExportOptions): ExportedState {
  const history = editorTimeTravel.getHistory()
  const currentSnapshot = editorTimeTravel.getCurrentSnapshot()

  // Фильтрация снимков по диапазону
  let snapshotsToExport: Snapshot[] = history

  if (options.range === 'selected' && options.selectedIds) {
    snapshotsToExport = history.filter(s =>
      options.selectedIds!.includes(s.id)
    )
  } else if (options.range === 'current') {
    snapshotsToExport = currentSnapshot ? [currentSnapshot] : []
  }

  // Формирование экспортированных данных
  const exported: ExportedState = {
    version: '1.0',
    exportedAt: Date.now(),
    snapshots: snapshotsToExport.map(snapshot => ({
      id: snapshot.id,
      timestamp: snapshot.metadata.timestamp,
      action: snapshot.metadata.action || 'unknown',
      state: options.includeContent ? snapshot.state : {},
      metadata: options.includeMetadata ? snapshot.metadata : {}
    })),
    currentState: currentSnapshot?.state || {},
    metadata: {
      totalSnapshots: snapshotsToExport.length
    }
  }

  return exported
}

/**
 * Экспортировать состояние как Blob для скачивания
 *
 * @param options - Опции экспорта
 * @returns Blob с экспортированными данными
 */
export function exportAsBlob(options: ExportOptions): Blob {
  const exported = exportState(options)
  let content: string
  let mimeType: string

  switch (options.format) {
    case 'html':
      content = formatAsHTML(exported)
      mimeType = 'text/html'
      break
    case 'markdown':
      content = formatAsMarkdown(exported)
      mimeType = 'text/markdown'
      break
    case 'plaintext':
      content = formatAsPlainText(exported)
      mimeType = 'text/plain'
      break
    case 'json':
    default:
      content = JSON.stringify(exported, null, 2)
      mimeType = 'application/json'
  }

  return new Blob([content], { type: mimeType })
}

/**
 * Скачать экспортированные данные в файл
 *
 * @param blob - Blob с данными
 * @param filename - Имя файла
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Скопировать экспортированные данные в буфер обмена
 *
 * @param blob - Blob с данными
 * @returns true если успешно
 */
export async function copyToClipboard(blob: Blob): Promise<boolean> {
  try {
    const text = await blob.text()
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('[copyToClipboard] Failed to copy:', error)
    return false
  }
}

/**
 * Сгенерировать имя файла для экспорта
 *
 * @param format - Формат экспорта
 * @returns Имя файла
 */
export function generateFilename(format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const extension = format === 'markdown' ? 'md' : format === 'plaintext' ? 'txt' : format
  return `nexus-state-export-${timestamp}.${extension}`
}

/**
 * Импортировать состояние в редактор
 *
 * @param options - Опции импорта
 * @returns Результат импорта
 */
export function importState(options: ImportOptions): ImportResult {
  try {
    const { strategy, data } = options

    // Валидация данных
    if (!data || !Array.isArray(data.snapshots)) {
      return {
        success: false,
        importedCount: 0,
        error: 'Invalid data format: missing snapshots array'
      }
    }

    // Очистка истории при стратегии replace
    if (strategy === 'replace') {
      editorTimeTravel.clearHistory()
    }

    // Импорт снимков
    let importedCount = 0

    for (const snapshotData of data.snapshots) {
      try {
        // Восстанавливаем снимок через internal API
        // Для этого используем importState из time-travel
        if (snapshotData.state) {
          editorTimeTravel.importState(snapshotData.state)
          importedCount++
        }
      } catch (error) {
        console.error('[importState] Failed to import snapshot:', snapshotData.id, error)
      }
    }

    // Восстановление текущего состояния
    if (data.currentState) {
      try {
        editorTimeTravel.importState(data.currentState)
      } catch (error) {
        console.error('[importState] Failed to restore current state:', error)
      }
    }

    return {
      success: true,
      importedCount
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      importedCount: 0,
      error: errorMessage
    }
  }
}

/**
 * Прочитать файл как JSON
 *
 * @param file - Файл для чтения
 * @returns Promise с распарсенными данными
 */
export function readFileAsJson<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const result = JSON.parse(event.target?.result as string)
        resolve(result as T)
      } catch (error) {
        reject(new Error('Invalid JSON format'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Валидировать экспортированные данные
 *
 * @param data - Данные для валидации
 * @returns true если данные валидны
 */
export function validateExportedState(data: any): data is ExportedState {
  if (!data || typeof data !== 'object') {
    return false
  }

  if (!data.version || typeof data.version !== 'string') {
    return false
  }

  if (!Array.isArray(data.snapshots)) {
    return false
  }

  // Валидация каждого снимка
  for (const snapshot of data.snapshots) {
    if (!snapshot.id || typeof snapshot.id !== 'string') {
      return false
    }

    if (!snapshot.timestamp || typeof snapshot.timestamp !== 'number') {
      return false
    }

    if (!snapshot.state || typeof snapshot.state !== 'object') {
      return false
    }
  }

  if (!data.currentState || typeof data.currentState !== 'object') {
    return false
  }

  return true
}

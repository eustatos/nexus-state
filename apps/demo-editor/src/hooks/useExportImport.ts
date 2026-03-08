import { useCallback, useState } from 'react'
import {
  exportState,
  exportAsBlob,
  downloadFile,
  copyToClipboard,
  importState,
  readFileAsJson,
  validateExportedState,
  generateFilename
} from '@/utils/exportImport'
import type { ExportOptions, ImportOptions, ImportResult, ExportFormat, ExportRange } from '@/utils/exportImport'
import type { ExportedState } from '@/utils/exportFormatters'

export interface UseExportImportReturn {
  /** Экспортировать состояние */
  exportState: (options: ExportOptions) => ExportedState
  /** Экспортировать как Blob */
  exportAsBlob: (options: ExportOptions) => Blob
  /** Скачать файл */
  downloadFile: (options: ExportOptions, filename?: string) => void
  /** Копировать в буфер */
  copyToClipboard: (options: ExportOptions) => Promise<boolean>
  /** Импортировать состояние */
  importState: (options: ImportOptions) => ImportResult
  /** Обработать загрузку файла */
  handleFileUpload: (file: File) => Promise<ExportedState>
  /** Валидировать данные */
  validateData: (data: any) => data is ExportedState
  /** Сгенерировать имя файла */
  generateFilename: (format: ExportFormat) => string
  /** Статус импорта */
  importStatus: ImportStatus | null
  /** Статус экспорта */
  exportStatus: ExportStatus | null
  /** Сбросить статусы */
  resetStatus: () => void
}

export interface ImportStatus {
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
  result?: ImportResult
}

export interface ExportStatus {
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
}

export interface UseExportImportOptions {
  /** Опции экспорта по умолчанию */
  defaultOptions?: Partial<ExportOptions>
  /** Автоматически скачивать после экспорта */
  autoDownload?: boolean
  /** Автоматически показывать уведомления */
  showNotifications?: boolean
}

/**
 * Хук для управления экспортом и импортом состояния
 *
 * @param options - Опции хука
 * @returns Объект с методами экспорта/импорта
 */
export function useExportImport(
  options: UseExportImportOptions = {}
): UseExportImportReturn {
  const {
    defaultOptions = {
      format: 'json',
      range: 'all',
      includeContent: true,
      includeMetadata: true,
      compress: false
    },
    autoDownload = true,
    showNotifications = true
  } = options

  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null)

  /**
   * Экспортировать состояние
   */
  const handleExportState = useCallback((overrideOptions: Partial<ExportOptions> = {}): ExportedState => {
    const mergedOptions: ExportOptions = {
      ...defaultOptions,
      ...overrideOptions
    } as ExportOptions

    setExportStatus({ status: 'processing' })

    try {
      const result = exportState(mergedOptions)
      setExportStatus({ status: 'success', message: 'Export successful' })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      setExportStatus({ status: 'error', message })
      throw error
    }
  }, [defaultOptions])

  /**
   * Экспортировать как Blob
   */
  const handleExportAsBlob = useCallback((overrideOptions: Partial<ExportOptions> = {}): Blob => {
    const mergedOptions: ExportOptions = {
      ...defaultOptions,
      ...overrideOptions
    } as ExportOptions

    return exportAsBlob(mergedOptions)
  }, [defaultOptions])

  /**
   * Скачать файл
   */
  const handleDownloadFile = useCallback((
    overrideOptions: Partial<ExportOptions> = {},
    filename?: string
  ): void => {
    const mergedOptions: ExportOptions = {
      ...defaultOptions,
      ...overrideOptions
    } as ExportOptions

    setExportStatus({ status: 'processing' })

    try {
      const blob = exportAsBlob(mergedOptions)
      const finalFilename = filename || generateFilename(mergedOptions.format)
      downloadFile(blob, finalFilename)
      setExportStatus({ status: 'success', message: 'File downloaded' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      setExportStatus({ status: 'error', message })
      throw error
    }
  }, [defaultOptions])

  /**
   * Копировать в буфер обмена
   */
  const handleCopyToClipboard = useCallback(async (
    overrideOptions: Partial<ExportOptions> = {}
  ): Promise<boolean> => {
    const mergedOptions: ExportOptions = {
      ...defaultOptions,
      ...overrideOptions
    } as ExportOptions

    setExportStatus({ status: 'processing' })

    try {
      const blob = exportAsBlob(mergedOptions)
      const success = await copyToClipboard(blob)

      if (success) {
        setExportStatus({ status: 'success', message: 'Copied to clipboard' })
      } else {
        setExportStatus({ status: 'error', message: 'Failed to copy' })
      }

      return success
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Copy failed'
      setExportStatus({ status: 'error', message })
      return false
    }
  }, [defaultOptions])

  /**
   * Импортировать состояние
   */
  const handleImportState = useCallback((
    overrideOptions: Partial<ImportOptions>
  ): ImportResult => {
    setImportStatus({ status: 'processing' })

    try {
      const result = importState(overrideOptions as ImportOptions)

      if (result.success) {
        setImportStatus({
          status: 'success',
          message: `Imported ${result.importedCount} snapshots`,
          result
        })
      } else {
        setImportStatus({
          status: 'error',
          message: result.error || 'Import failed',
          result
        })
      }

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed'
      setImportStatus({ status: 'error', message, result: { success: false, importedCount: 0, error: message } })
      return { success: false, importedCount: 0, error: message }
    }
  }, [])

  /**
   * Обработать загрузку файла
   */
  const handleFileUpload = useCallback(async (file: File): Promise<ExportedState> => {
    setImportStatus({ status: 'processing' })

    try {
      const data = await readFileAsJson<ExportedState>(file)

      if (!validateExportedState(data)) {
        throw new Error('Invalid data format')
      }

      setImportStatus({ status: 'pending', message: 'File loaded, ready to import' })
      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read file'
      setImportStatus({ status: 'error', message })
      throw error
    }
  }, [])

  /**
   * Валидировать данные
   */
  const validateData = useCallback((data: any): data is ExportedState => {
    return validateExportedState(data)
  }, [])

  /**
   * Сбросить статусы
   */
  const resetStatus = useCallback(() => {
    setImportStatus(null)
    setExportStatus(null)
  }, [])

  return {
    exportState: handleExportState,
    exportAsBlob: handleExportAsBlob,
    downloadFile: handleDownloadFile,
    copyToClipboard: handleCopyToClipboard,
    importState: handleImportState,
    handleFileUpload,
    validateData,
    generateFilename,
    importStatus,
    exportStatus,
    resetStatus
  }
}

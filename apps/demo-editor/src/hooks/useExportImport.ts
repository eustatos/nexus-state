import { useCallback, useState } from 'react'
import {
  exportState,
  exportAsBlob,
  downloadFile,
  copyToClipboard,
  importState,
  readFileAsJSON,
  validateExportedData,
  generateFilename
} from '@/utils/exportImport'
import type { ExportOptions, ImportOptions, ImportResult, ExportFormat, ExportRange } from '@/utils/exportImport'
import type { ExportedState } from '@/utils/exportFormatters'

export interface UseExportImportReturn {
  /** Export state */
  exportState: (options: ExportOptions) => ExportedState
  /** Export as Blob */
  exportAsBlob: (options: ExportOptions) => Blob
  /** Download file */
  downloadFile: (options: ExportOptions, filename?: string) => void
  /** Copy to clipboard */
  copyToClipboard: (options: ExportOptions) => Promise<boolean>
  /** Import state */
  importState: (options: ImportOptions) => ImportResult
  /** Handle file upload */
  handleFileUpload: (file: File) => Promise<ExportedState>
  /** Validate data */
  validateData: (data: any) => data is ExportedState
  /** Generate filename */
  generateFilename: (format: ExportFormat) => string
  /** Import status */
  importStatus: ImportStatus | null
  /** Export status */
  exportStatus: ExportStatus | null
  /** Reset statuses */
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
  /** Default export options */
  defaultOptions?: Partial<ExportOptions>
  /** Automatically download after export */
  autoDownload?: boolean
  /** Automatically show notifications */
  showNotifications?: boolean
}

/**
 * Hook for managing state export and import
 *
 * @param options - Hook options
 * @returns Object with export/import methods
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
   * Export состояние
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
   * Export как Blob
   */
  const handleExportAsBlob = useCallback((overrideOptions: Partial<ExportOptions> = {}): Blob => {
    const mergedOptions: ExportOptions = {
      ...defaultOptions,
      ...overrideOptions
    } as ExportOptions

    return exportAsBlob(mergedOptions)
  }, [defaultOptions])

  /**
   * Download file
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
   * Копировать в clipboard обмена
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
   * Import состояние
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
   * Обработать загрузку fileа
   */
  const handleFileUpload = useCallback(async (file: File): Promise<ExportedState> => {
    setImportStatus({ status: 'processing' })

    try {
      const data = await readFileAsJSON<ExportedState>(file)

      if (!validateExportedData(data)) {
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
    return validateExportedData(data)
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

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react'
import { useExportImport } from '@/hooks/useExportImport'
import type { ExportedState } from '@/utils/exportFormatters'
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react'
import './ImportModal.css'

export interface ImportModalProps {
  /** Обработчик закрытия */
  onClose: () => void
  /** Обработчик успешного импорта */
  onImportSuccess?: (result: { importedCount: number }) => void
  /** Заголовок модалки */
  title?: string
}

export type ImportStrategy = 'replace' | 'append'

/**
 * Модальное окно импорта состояния
 */
export function ImportModal({ onClose, onImportSuccess, title = 'Import State' }: ImportModalProps) {
  const {
    handleFileUpload,
    importState,
    validateData,
    importStatus,
    resetStatus
  } = useExportImport()

  const [dragOver, setDragOver] = useState(false)
  const [importedData, setImportedData] = useState<ExportedState | null>(null)
  const [strategy, setStrategy] = useState<ImportStrategy>('replace')
  const [isImporting, setIsImporting] = useState(false)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /**
   * Обработка drag over
   */
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  /**
   * Обработка drag leave
   */
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  /**
   * Обработка drop
   */
  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length === 0) return

    const file = files[0]
    if (!file.name.endsWith('.json')) {
      setPasteError('Please upload a JSON file')
      return
    }

    try {
      const data = await handleFileUpload(file)
      setImportedData(data)
      setPasteError(null)
    } catch (error) {
      setPasteError(error instanceof Error ? error.message : 'Failed to read file')
    }
  }, [handleFileUpload])

  /**
   * Обработка выбора файла через input
   */
  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    try {
      const data = await handleFileUpload(file)
      setImportedData(data)
      setPasteError(null)
    } catch (error) {
      setPasteError(error instanceof Error ? error.message : 'Failed to read file')
    }

    // Сбрасываем value чтобы можно было выбрать тот же файл снова
    e.target.value = ''
  }, [handleFileUpload])

  /**
   * Обработка вставки JSON
   */
  const handlePaste = useCallback(async () => {
    if (!textareaRef.current) return

    const text = textareaRef.current.value.trim()
    if (!text) {
      setPasteError('Please paste JSON content')
      return
    }

    try {
      const data = JSON.parse(text)
      if (!validateData(data)) {
        throw new Error('Invalid data format')
      }
      setImportedData(data)
      setPasteError(null)
    } catch (error) {
      setPasteError(error instanceof Error ? error.message : 'Invalid JSON')
    }
  }, [validateData])

  /**
   * Обработка импорта
   */
  const handleImport = useCallback(async () => {
    if (!importedData) return

    setIsImporting(true)

    try {
      const result = importState({
        strategy,
        data: importedData
      })

      if (result.success) {
        onImportSuccess?.({ importedCount: result.importedCount })
        handleClose()
      }
    } finally {
      setIsImporting(false)
    }
  }, [importedData, strategy, importState, onImportSuccess])

  /**
   * Обработка закрытия
   */
  const handleClose = useCallback(() => {
    resetStatus()
    setImportedData(null)
    setPasteError(null)
    onClose()
  }, [resetStatus, onClose])

  /**
   * Клик по зоне drag & drop
   */
  const handleDropZoneClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="import-modal-overlay" data-testid="import-modal-overlay">
      <div className="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
        {/* Header */}
        <div className="import-modal__header">
          <h2 id="import-modal-title" className="import-modal__title">{title}</h2>
          <button
            className="import-modal__close"
            onClick={handleClose}
            disabled={isImporting}
            type="button"
            data-testid="import-modal-close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="import-modal__content">
          {/* Drag & Drop Zone */}
          {!importedData && (
            <div
              className={`import-modal__drop-zone ${dragOver ? 'import-modal__drop-zone--over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleDropZoneClick}
              data-testid="import-drop-zone"
              role="button"
              tabIndex={0}
              aria-label="Drag and drop file here or click to browse"
            >
              <Upload size={48} className="import-modal__drop-zone-icon" />
              <p className="import-modal__drop-zone-text">
                Drag & drop JSON file here
              </p>
              <p className="import-modal__drop-zone-hint">
                or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="import-modal__file-input"
                data-testid="import-file-input"
                aria-label="Upload JSON file"
              />
            </div>
          )}

          {/* Paste JSON */}
          {!importedData && (
            <>
              <div className="import-modal__divider">
                <span>OR</span>
              </div>

              <div className="import-modal__section">
                <label className="import-modal__label">Paste JSON content:</label>
                <textarea
                  ref={textareaRef}
                  className="import-modal__textarea"
                  placeholder='{"snapshots":[...], "currentState":{...}}'
                  rows={6}
                  data-testid="import-textarea"
                  aria-label="Paste JSON content"
                />
                {pasteError && (
                  <div className="import-modal__error" data-testid="import-paste-error">
                    <AlertCircle size={16} />
                    <span>{pasteError}</span>
                  </div>
                )}
                <button
                  className="import-modal__button import-modal__button--secondary"
                  onClick={handlePaste}
                  disabled={isImporting}
                  type="button"
                  data-testid="import-paste-button"
                >
                  <FileJson size={16} />
                  Parse JSON
                </button>
              </div>
            </>
          )}

          {/* Preview */}
          {importedData && (
            <div className="import-modal__preview" data-testid="import-preview">
              <div className="import-modal__preview-header">
                <h3 className="import-modal__preview-title">
                  <CheckCircle size={20} className="import-modal__preview-icon" />
                  File loaded successfully
                </h3>
              </div>

              <div className="import-modal__preview-stats">
                <div className="import-modal__stat">
                  <span className="import-modal__stat-value">{importedData.snapshots.length}</span>
                  <span className="import-modal__stat-label">snapshots</span>
                </div>
                <div className="import-modal__stat">
                  <span className="import-modal__stat-value">
                    {new Date(importedData.exportedAt).toLocaleDateString()}
                  </span>
                  <span className="import-modal__stat-label">export date</span>
                </div>
                {importedData.metadata?.totalSnapshots && (
                  <div className="import-modal__stat">
                    <span className="import-modal__stat-value">{importedData.metadata.totalSnapshots}</span>
                    <span className="import-modal__stat-label">total in export</span>
                  </div>
                )}
              </div>

              {/* Strategy selection */}
              <div className="import-modal__section">
                <label className="import-modal__label">Import Strategy:</label>
                <div className="import-modal__strategy-options" data-testid="import-strategy-options">
                  <label className="import-modal__strategy-option">
                    <input
                      type="radio"
                      name="strategy"
                      value="replace"
                      checked={strategy === 'replace'}
                      onChange={(e) => setStrategy(e.target.value as ImportStrategy)}
                      disabled={isImporting}
                      data-testid="strategy-replace"
                    />
                    <div className="import-modal__strategy-info">
                      <span className="import-modal__strategy-name">Replace</span>
                      <span className="import-modal__strategy-description">
                        Clear current history and import new data
                      </span>
                    </div>
                  </label>

                  <label className="import-modal__strategy-option">
                    <input
                      type="radio"
                      name="strategy"
                      value="append"
                      checked={strategy === 'append'}
                      onChange={(e) => setStrategy(e.target.value as ImportStrategy)}
                      disabled={isImporting}
                      data-testid="strategy-append"
                    />
                    <div className="import-modal__strategy-info">
                      <span className="import-modal__strategy-name">Append</span>
                      <span className="import-modal__strategy-description">
                        Add imported data to existing history
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Status messages */}
              {importStatus && (
                <div
                  className={`import-modal__status import-modal__status--${importStatus.status}`}
                  data-testid="import-status"
                >
                  {importStatus.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {importedData && (
          <div className="import-modal__footer">
            <button
              className="import-modal__button import-modal__button--ghost"
              onClick={() => setImportedData(null)}
              disabled={isImporting}
              type="button"
              data-testid="import-back-button"
            >
              Back
            </button>

            <button
              className="import-modal__button import-modal__button--primary"
              onClick={handleImport}
              disabled={isImporting || importStatus?.status === 'processing'}
              type="button"
              data-testid="import-confirm-button"
            >
              <Upload size={16} />
              {isImporting ? 'Importing...' : 'Import'}
            </button>

            <button
              className="import-modal__button import-modal__button--ghost"
              onClick={handleClose}
              disabled={isImporting}
              type="button"
              data-testid="import-cancel-button"
            >
              Cancel
            </button>
          </div>
        )}

        {!importedData && (
          <div className="import-modal__footer">
            <button
              className="import-modal__button import-modal__button--ghost"
              onClick={handleClose}
              disabled={isImporting}
              type="button"
              data-testid="import-cancel-button"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

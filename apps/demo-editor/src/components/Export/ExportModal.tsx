import { useState, useCallback } from 'react'
import { useExportImport } from '@/hooks/useExportImport'
import type { ExportFormat, ExportRange } from '@/utils/exportImport'
import { X, Download, Copy, FileJson, FileCode, FileText } from 'lucide-react'
import './ExportModal.css'

export interface ExportModalProps {
  /** Обработчик закрытия */
  onClose: () => void
  /** Заголовок модалки */
  title?: string
}

/**
 * Модальное окно экспорта состояния
 */
export function ExportModal({ onClose, title = 'Export State' }: ExportModalProps) {
  const {
    downloadFile,
    copyToClipboard,
    exportStatus,
    resetStatus
  } = useExportImport()

  const [format, setFormat] = useState<ExportFormat>('json')
  const [range, setRange] = useState<ExportRange>('all')
  const [includeContent, setIncludeContent] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async (action: 'download' | 'copy') => {
    setIsExporting(true)

    try {
      if (action === 'download') {
        downloadFile({
          format,
          range,
          includeContent,
          includeMetadata
        })
      } else {
        await copyToClipboard({
          format,
          range,
          includeContent,
          includeMetadata
        })
      }
    } finally {
      setIsExporting(false)
    }
  }, [format, range, includeContent, includeMetadata, downloadFile, copyToClipboard])

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  return (
    <div className="export-modal-overlay" data-testid="export-modal-overlay">
      <div className="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
        {/* Header */}
        <div className="export-modal__header">
          <h2 id="export-modal-title" className="export-modal__title">{title}</h2>
          <button
            className="export-modal__close"
            onClick={handleClose}
            disabled={isExporting}
            type="button"
            data-testid="export-modal-close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="export-modal__content">
          {/* Format selection */}
          <div className="export-modal__section">
            <label className="export-modal__label">Format:</label>
            <div className="export-modal__format-options" data-testid="export-format-options">
              <label className="export-modal__format-option">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  disabled={isExporting}
                  data-testid="format-json"
                />
                <FileJson size={16} />
                <span>JSON</span>
              </label>

              <label className="export-modal__format-option">
                <input
                  type="radio"
                  name="format"
                  value="html"
                  checked={format === 'html'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  disabled={isExporting}
                  data-testid="format-html"
                />
                <FileCode size={16} />
                <span>HTML</span>
              </label>

              <label className="export-modal__format-option">
                <input
                  type="radio"
                  name="format"
                  value="markdown"
                  checked={format === 'markdown'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  disabled={isExporting}
                  data-testid="format-markdown"
                />
                <FileText size={16} />
                <span>Markdown</span>
              </label>

              <label className="export-modal__format-option">
                <input
                  type="radio"
                  name="format"
                  value="plaintext"
                  checked={format === 'plaintext'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  disabled={isExporting}
                  data-testid="format-plaintext"
                />
                <FileText size={16} />
                <span>Plain Text</span>
              </label>
            </div>
          </div>

          {/* Range selection */}
          <div className="export-modal__section">
            <label className="export-modal__label">Range:</label>
            <select
              className="export-modal__select"
              value={range}
              onChange={(e) => setRange(e.target.value as ExportRange)}
              disabled={isExporting}
              data-testid="export-range-select"
            >
              <option value="all">All snapshots</option>
              <option value="selected">Selected snapshots</option>
              <option value="current">Current state only</option>
            </select>
          </div>

          {/* Options */}
          <div className="export-modal__section">
            <label className="export-modal__checkbox">
              <input
                type="checkbox"
                checked={includeContent}
                onChange={(e) => setIncludeContent(e.target.checked)}
                disabled={isExporting}
                data-testid="export-include-content"
              />
              <span>Include snapshot content</span>
            </label>

            <label className="export-modal__checkbox">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                disabled={isExporting}
                data-testid="export-include-metadata"
              />
              <span>Include metadata</span>
            </label>
          </div>

          {/* Status messages */}
          {exportStatus && (
            <div
              className={`export-modal__status export-modal__status--${exportStatus.status}`}
              data-testid="export-status"
            >
              {exportStatus.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="export-modal__footer">
          <button
            className="export-modal__button export-modal__button--secondary"
            onClick={() => handleExport('copy')}
            disabled={isExporting || exportStatus?.status === 'processing'}
            type="button"
            data-testid="export-copy-button"
          >
            <Copy size={16} />
            Copy to Clipboard
          </button>

          <button
            className="export-modal__button export-modal__button--primary"
            onClick={() => handleExport('download')}
            disabled={isExporting || exportStatus?.status === 'processing'}
            type="button"
            data-testid="export-download-button"
          >
            <Download size={16} />
            Download File
          </button>

          <button
            className="export-modal__button export-modal__button--ghost"
            onClick={handleClose}
            disabled={isExporting}
            type="button"
            data-testid="export-cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

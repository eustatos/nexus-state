/**
 * Тесты для ExportModal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportModal } from '../ExportModal'
import { useExportImport } from '@/hooks/useExportImport'

// Моки для хука
vi.mock('@/hooks/useExportImport', () => ({
  useExportImport: vi.fn()
}))

describe('ExportModal', () => {
  const mockUseExportImport = vi.mocked(useExportImport)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    onClose: vi.fn()
  }

  it('должен рендерить модальное окно', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={defaultProps.onClose} />)

    expect(screen.getByTestId('export-modal-overlay')).toBeInTheDocument()
    expect(screen.getByText('Export State')).toBeInTheDocument()
  })

  it('должен закрываться при клике на кнопку закрытия', () => {
    const onClose = vi.fn()

    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={onClose} />)

    fireEvent.click(screen.getByTestId('export-modal-close'))

    expect(onClose).toHaveBeenCalled()
  })

  it('должен позволять выбрать формат экспорта', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={defaultProps.onClose} />)

    // Проверяем, что все опции формата присутствуют
    expect(screen.getByTestId('format-json')).toBeInTheDocument()
    expect(screen.getByTestId('format-html')).toBeInTheDocument()
    expect(screen.getByTestId('format-markdown')).toBeInTheDocument()
    expect(screen.getByTestId('format-plaintext')).toBeInTheDocument()

    // Переключаем на HTML
    fireEvent.click(screen.getByTestId('format-html'))
    expect(screen.getByTestId('format-html')).toBeChecked()
  })

  it('должен позволять выбрать диапазон экспорта', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={defaultProps.onClose} />)

    const rangeSelect = screen.getByTestId('export-range-select')
    expect(rangeSelect).toHaveValue('all')

    fireEvent.change(rangeSelect, { target: { value: 'current' } })
    expect(rangeSelect).toHaveValue('current')
  })

  it('должен позволять включить/выключить опции', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={defaultProps.onClose} />)

    const contentCheckbox = screen.getByTestId('export-include-content')
    const metadataCheckbox = screen.getByTestId('export-include-metadata')

    expect(contentCheckbox).toBeChecked()
    expect(metadataCheckbox).toBeChecked()

    fireEvent.click(contentCheckbox)
    expect(contentCheckbox).not.toBeChecked()

    fireEvent.click(metadataCheckbox)
    expect(metadataCheckbox).not.toBeChecked()
  })

  it('должен вызывать downloadFile при клике на Download', async () => {
    const downloadFile = vi.fn()

    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile,
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={defaultProps.onClose} />)

    fireEvent.click(screen.getByTestId('export-download-button'))

    await waitFor(() => {
      expect(downloadFile).toHaveBeenCalled()
    })
  })

  it('должен вызывать copyToClipboard при клике на Copy', async () => {
    const copyToClipboard = vi.fn().mockResolvedValue(true)

    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard,
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={defaultProps.onClose} />)

    fireEvent.click(screen.getByTestId('export-copy-button'))

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalled()
    })
  })

  it('должен показывать статус экспорта', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: { status: 'success', message: 'Export successful' },
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={defaultProps.onClose} />)

    expect(screen.getByTestId('export-status')).toBeInTheDocument()
    expect(screen.getByText('Export successful')).toBeInTheDocument()
  })

  it('должен отключать кнопки во время экспорта', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: { status: 'processing' },
      resetStatus: vi.fn()
    })

    render(<ExportModal onClose={defaultProps.onClose} />)

    expect(screen.getByTestId('export-download-button')).toBeDisabled()
    expect(screen.getByTestId('export-copy-button')).toBeDisabled()
  })
})

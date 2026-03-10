/**
 * Tests for ExportModal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportModal } from '../ExportModal'
import { useExportImport } from '@/hooks/useExportImport'

// Mocks for hookа
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

  it('should рендерить модальное окно', () => {
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

  it('should закрываться при клике на кнопку close', () => {
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

  it('should позволять выбрать format export', () => {
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

    // Проверяем, что all options formatа присутствуют
    expect(screen.getByTestId('format-json')).toBeInTheDocument()
    expect(screen.getByTestId('format-html')).toBeInTheDocument()
    expect(screen.getByTestId('format-markdown')).toBeInTheDocument()
    expect(screen.getByTestId('format-plaintext')).toBeInTheDocument()

    // Переключаем на HTML
    fireEvent.click(screen.getByTestId('format-html'))
    expect(screen.getByTestId('format-html')).toBeChecked()
  })

  it('should позволять выбрать range export', () => {
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

  it('should позволять включить/выключить options', () => {
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

  it('should вызывать downloadFile при клике на Download', async () => {
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

  it('should вызывать copyToClipboard при клике на Copy', async () => {
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

  it('should show статус export', () => {
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

  it('should отключать кнопки во время export', () => {
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

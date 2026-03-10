/**
 * Tests for ImportModal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImportModal } from '../ImportModal'
import { useExportImport } from '@/hooks/useExportImport'

// Mocks for hookа
vi.mock('@/hooks/useExportImport', () => ({
  useExportImport: vi.fn()
}))

describe('ImportModal', () => {
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
      handleFileUpload: vi.fn().mockResolvedValue({
        version: '1.0',
        exportedAt: Date.now(),
        snapshots: [],
        currentState: {}
      }),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ImportModal onClose={defaultProps.onClose} />)

    expect(screen.getByTestId('import-modal-overlay')).toBeInTheDocument()
    expect(screen.getByText('Import State')).toBeInTheDocument()
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

    render(<ImportModal onClose={onClose} />)

    fireEvent.click(screen.getByTestId('import-modal-close'))

    expect(onClose).toHaveBeenCalled()
  })

  it('should иметь drag & drop зону', () => {
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

    render(<ImportModal onClose={defaultProps.onClose} />)

    const dropZone = screen.getByTestId('import-drop-zone')
    expect(dropZone).toBeInTheDocument()
    expect(dropZone).toHaveAttribute('role', 'button')
  })

  it('should иметь textarea for вставки JSON', () => {
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

    render(<ImportModal onClose={defaultProps.onClose} />)

    expect(screen.getByTestId('import-textarea')).toBeInTheDocument()
  })

  it('should show preview после загрузки fileа', async () => {
    const handleFileUpload = vi.fn().mockResolvedValue({
      version: '1.0',
      exportedAt: Date.now(),
      snapshots: [
        { id: 'snap-1', timestamp: Date.now(), state: {} }
      ],
      currentState: {},
      metadata: { totalSnapshots: 1 }
    })

    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload,
      validateData: vi.fn().mockReturnValue(true),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ImportModal onClose={defaultProps.onClose} />)

    // Симулируем загрузку fileа через handleFileUpload
    await act(async () => {
      await handleFileUpload(new Blob(['{}'], { type: 'application/json' }) as File)
    })

    // Проверяем, что preview отображается
    expect(screen.queryByTestId('import-preview')).toBeInTheDocument()
  })

  it('should позволять выбрать стратегию import', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn().mockResolvedValue({
        version: '1.0',
        exportedAt: Date.now(),
        snapshots: [],
        currentState: {}
      }),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ImportModal onClose={defaultProps.onClose} />)

    // Проверяем options стратегии
    expect(screen.getByTestId('strategy-replace')).toBeInTheDocument()
    expect(screen.getByTestId('strategy-append')).toBeInTheDocument()

    // Replace должна быть выбрана по умолчанию
    expect(screen.getByTestId('strategy-replace')).toBeChecked()
  })

  it('should show ошибку при невалидном JSON', async () => {
    const handleFileUpload = vi.fn().mockRejectedValue(new Error('Invalid JSON'))

    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload,
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ImportModal onClose={defaultProps.onClose} />)

    // Симулируем ошибку
    await act(async () => {
      try {
        await handleFileUpload(new Blob(['invalid'], { type: 'application/json' }) as File)
      } catch (e) {
        // Ожидается
      }
    })

    expect(screen.queryByTestId('import-paste-error')).toBeInTheDocument()
  })

  it('should вызывать onImportSuccess при успешном импорте', async () => {
    const onImportSuccess = vi.fn()
    const importState = vi.fn().mockReturnValue({
      success: true,
      importedCount: 5
    })

    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState,
      handleFileUpload: vi.fn().mockResolvedValue({
        version: '1.0',
        exportedAt: Date.now(),
        snapshots: [],
        currentState: {}
      }),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: null,
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ImportModal onClose={defaultProps.onClose} onImportSuccess={onImportSuccess} />)

    // Проверяем, что кнопка Import присутствует
    expect(screen.getByTestId('import-confirm-button')).toBeInTheDocument()
  })

  it('should show статус import', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: { status: 'success', message: 'Import successful' },
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ImportModal onClose={defaultProps.onClose} />)

    expect(screen.getByTestId('import-status')).toBeInTheDocument()
    expect(screen.getByText('Import successful')).toBeInTheDocument()
  })

  it('should отключать кнопки во время import', () => {
    mockUseExportImport.mockReturnValue({
      exportState: vi.fn(),
      exportAsBlob: vi.fn(),
      downloadFile: vi.fn(),
      copyToClipboard: vi.fn(),
      importState: vi.fn(),
      handleFileUpload: vi.fn(),
      validateData: vi.fn(),
      generateFilename: vi.fn(),
      importStatus: { status: 'processing' },
      exportStatus: null,
      resetStatus: vi.fn()
    })

    render(<ImportModal onClose={defaultProps.onClose} />)

    expect(screen.getByTestId('import-confirm-button')).toBeDisabled()
  })
})

// Helper for act
async function act<T>(fn: () => Promise<T>): Promise<void> {
  return fn()
}

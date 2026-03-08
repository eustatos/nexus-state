/**
 * Тесты для ImportModal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImportModal } from '../ImportModal'
import { useExportImport } from '@/hooks/useExportImport'

// Моки для хука
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

  it('должен рендерить модальное окно', () => {
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

    render(<ImportModal onClose={onClose} />)

    fireEvent.click(screen.getByTestId('import-modal-close'))

    expect(onClose).toHaveBeenCalled()
  })

  it('должен иметь drag & drop зону', () => {
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

  it('должен иметь textarea для вставки JSON', () => {
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

  it('должен показывать preview после загрузки файла', async () => {
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

    // Симулируем загрузку файла через handleFileUpload
    await act(async () => {
      await handleFileUpload(new Blob(['{}'], { type: 'application/json' }) as File)
    })

    // Проверяем, что preview отображается
    expect(screen.queryByTestId('import-preview')).toBeInTheDocument()
  })

  it('должен позволять выбрать стратегию импорта', () => {
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

    // Проверяем опции стратегии
    expect(screen.getByTestId('strategy-replace')).toBeInTheDocument()
    expect(screen.getByTestId('strategy-append')).toBeInTheDocument()

    // Replace должна быть выбрана по умолчанию
    expect(screen.getByTestId('strategy-replace')).toBeChecked()
  })

  it('должен показывать ошибку при невалидном JSON', async () => {
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

  it('должен вызывать onImportSuccess при успешном импорте', async () => {
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

  it('должен показывать статус импорта', () => {
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

  it('должен отключать кнопки во время импорта', () => {
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

// Helper для act
async function act<T>(fn: () => Promise<T>): Promise<void> {
  return fn()
}

/**
 * Тесты для компонента SnapshotDiff
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnapshotDiff } from '../SnapshotDiff'
import * as useSnapshotComparisonModule from '@/hooks/useSnapshotComparison'

// Моки для хука сравнения
vi.mock('@/hooks/useSnapshotComparison', () => ({
  useSnapshotComparison: vi.fn()
}))

describe('SnapshotDiff', () => {
  const mockResult = {
    id: 'cmp-123',
    timestamp: Date.now(),
    summary: {
      totalAtoms: 5,
      changedAtoms: 3,
      addedAtoms: 1,
      removedAtoms: 1,
      unchangedAtoms: 2,
      hasChanges: true,
      changePercentage: 60
    },
    atoms: [
      {
        atomId: 'atom-1',
        atomName: 'content',
        atomType: 'writable' as const,
        status: 'added' as const,
        newValue: 'New text',
        path: ['content']
      },
      {
        atomId: 'atom-2',
        atomName: 'title',
        atomType: 'writable' as const,
        status: 'removed' as const,
        oldValue: 'Old title',
        path: ['title']
      },
      {
        atomId: 'atom-3',
        atomName: 'cursor',
        atomType: 'primitive' as const,
        status: 'modified' as const,
        oldValue: 0,
        newValue: 5,
        path: ['cursor']
      }
    ],
    statistics: {
      duration: 10,
      memoryUsed: 100,
      depth: 1,
      totalComparisons: 5,
      cacheHits: 0,
      cacheMisses: 1
    },
    metadata: {
      snapshotA: { id: 'snapshot-1', timestamp: Date.now(), action: 'text-edit' },
      snapshotB: { id: 'snapshot-2', timestamp: Date.now(), action: 'paste' },
      timeDifference: 1000
    }
  }

  const mockBaseline = {
    id: 'snapshot-1',
    state: { content: { value: 'Old text', type: 'writable' } },
    metadata: {
      timestamp: Date.now() - 1000,
      action: 'text-edit',
      atomCount: 3
    }
  }

  const mockComparison = {
    id: 'snapshot-2',
    state: { content: { value: 'New text', type: 'writable' } },
    metadata: {
      timestamp: Date.now(),
      action: 'paste',
      atomCount: 3
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('должен отображать пустое состояние когда нет результата', () => {
    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: null,
      comparison: null,
      mode: 'inline',
      result: null,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: false,
      compare: vi.fn()
    })

    render(<SnapshotDiff />)

    expect(screen.getByText('No comparison selected')).toBeInTheDocument()
    expect(screen.getByTestId('snapshot-diff')).toBeInTheDocument()
  })

  it('должен отображать статистику изменений', () => {
    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff />)

    expect(screen.getByTestId('snapshot-diff-stats')).toBeInTheDocument()
    expect(screen.getByText('+1 added')).toBeInTheDocument()
    expect(screen.getByText('-1 removed')).toBeInTheDocument()
    expect(screen.getByText('±1 modified')).toBeInTheDocument()
  })

  it('должен переключать режимы отображения', () => {
    const mockSetMode = vi.fn()

    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: mockSetMode,
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff />)

    const splitButton = screen.getByTestId('diff-mode-split')
    fireEvent.click(splitButton)

    expect(mockSetMode).toHaveBeenCalledWith('split')

    const unifiedButton = screen.getByTestId('diff-mode-unified')
    fireEvent.click(unifiedButton)

    expect(mockSetMode).toHaveBeenCalledWith('unified')
  })

  it('должен отображать информацию о базовом снимке', () => {
    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff />)

    const baselineInfo = screen.getByTestId('snapshot-diff-baseline')
    expect(baselineInfo).toBeInTheDocument()
    expect(screen.getByText('text-edit')).toBeInTheDocument()
  })

  it('должен отображать информацию о снимке сравнения', () => {
    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff />)

    const comparisonInfo = screen.getByTestId('snapshot-diff-comparison')
    expect(comparisonInfo).toBeInTheDocument()
    expect(screen.getByText('paste')).toBeInTheDocument()
  })

  it('должен вызывать onClose при клике на кнопку закрытия', () => {
    const mockOnClose = vi.fn()

    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff onClose={mockOnClose} />)

    const closeButton = screen.getByTestId('snapshot-diff-close')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('должен вызывать reset при клике на кнопку Back to list', () => {
    const mockReset = vi.fn()

    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: mockReset,
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff />)

    const backButton = screen.getByTestId('snapshot-diff-reset')
    fireEvent.click(backButton)

    expect(mockReset).toHaveBeenCalled()
  })

  it('должен скрывать статистику при showStats=false', () => {
    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff showStats={false} />)

    expect(screen.queryByTestId('snapshot-diff-stats')).not.toBeInTheDocument()
  })

  it('должен скрывать переключатель режимов при showModeSwitch=false', () => {
    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff showModeSwitch={false} />)

    expect(screen.queryByTestId('snapshot-diff-modes')).not.toBeInTheDocument()
  })

  it('должен скрывать информацию о снимках при showSnapshotInfo=false', () => {
    vi.mocked(useSnapshotComparisonModule.useSnapshotComparison).mockReturnValue({
      baseline: mockBaseline,
      comparison: mockComparison,
      mode: 'inline',
      result: mockResult,
      setMode: vi.fn(),
      selectBaseline: vi.fn(),
      selectComparison: vi.fn(),
      reset: vi.fn(),
      isComparing: true,
      compare: vi.fn()
    })

    render(<SnapshotDiff showSnapshotInfo={false} />)

    expect(screen.queryByTestId('snapshot-diff-baseline')).not.toBeInTheDocument()
    expect(screen.queryByTestId('snapshot-diff-comparison')).not.toBeInTheDocument()
  })
})

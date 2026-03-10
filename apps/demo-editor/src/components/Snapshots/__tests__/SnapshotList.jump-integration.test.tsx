/**
 * Интеграционные testы for SnapshotList с функционалом jump to snapshot
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnapshotList } from '../SnapshotList'
import * as useSnapshotsModule from '@/hooks/useSnapshots'
import type { Snapshot } from '@nexus-state/core'
import type { SnapshotMetadata } from '@/store/helpers'

// Моковые данные снимков
const createMockSnapshots = (count: number): Snapshot[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `snapshot-${i}`,
    state: {},
    metadata: {
      timestamp: Date.now() - i * 1000,
      action: 'text-edit',
      atomCount: i + 1,
      delta: {
        added: (i + 1) * 10,
        removed: i * 5,
        type: 'insert' as const
      }
    }
  } as Snapshot & { metadata: SnapshotMetadata & { timestamp: number; atomCount: number } }))
}

describe('SnapshotList - Jump to Snapshot Integration', () => {
  const mockUseSnapshots = vi.spyOn(useSnapshotsModule, 'useSnapshots')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should вызывать jumpTo при клике на snapshot', () => {
    const mockSnapshots = createMockSnapshots(3)
    const mockJumpTo = vi.fn()

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 3,
      currentIndex: 2, // Последний snapshot - current
      jumpTo: mockJumpTo,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    // Кликаем на первый snapshot (самый новый, индекс 0 в UI)
    const firstItem = screen.getByTestId('snapshot-item-0')
    fireEvent.click(firstItem)

    expect(mockJumpTo).toHaveBeenCalledWith(0)
  })

  it('should подсвечивать current snapshot', () => {
    const mockSnapshots = createMockSnapshots(3)

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 3,
      currentIndex: 2, // Последний snapshot - current
      jumpTo: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    // Последний snapshot should быть подсвечен как current
    // currentIndex = 2, что соответствует UI индексу 0 (totalCount - 1 - currentIndex)
    const currentBadge = screen.getByTestId('snapshot-current-badge')
    expect(currentBadge).toBeInTheDocument()
  })

  it('should отображать count снимков', () => {
    const mockSnapshots = createMockSnapshots(5)

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 5,
      currentIndex: 4,
      jumpTo: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    const countElement = screen.getByTestId('snapshot-count')
    expect(countElement).toHaveTextContent('5 snapshots')
  })

  it('should вызывать undo при клике на кнопку undo', () => {
    const mockSnapshots = createMockSnapshots(3)
    const mockUndo = vi.fn()

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 3,
      currentIndex: 2,
      jumpTo: vi.fn(),
      undo: mockUndo,
      redo: vi.fn(),
      canUndo: true,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    const undoButton = screen.getByTestId('snapshot-undo-button')
    fireEvent.click(undoButton)

    expect(mockUndo).toHaveBeenCalled()
  })

  it('should вызывать redo при клике на кнопку redo', () => {
    const mockSnapshots = createMockSnapshots(3)
    const mockRedo = vi.fn()

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 3,
      currentIndex: 0,
      jumpTo: vi.fn(),
      undo: vi.fn(),
      redo: mockRedo,
      canUndo: true,
      canRedo: true,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    const redoButton = screen.getByTestId('snapshot-redo-button')
    fireEvent.click(redoButton)

    expect(mockRedo).toHaveBeenCalled()
  })

  it('should отключать кнопку undo когда canUndo=false', () => {
    const mockSnapshots = createMockSnapshots(1)

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 1,
      currentIndex: 0,
      jumpTo: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    const undoButton = screen.getByTestId('snapshot-undo-button')
    expect(undoButton).toBeDisabled()
  })

  it('should отображать empty state когда нет снимков', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: [],
      filteredSnapshots: [],
      totalCount: 0,
      currentIndex: -1,
      jumpTo: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    const emptyState = screen.getByTestId('snapshot-empty-state')
    expect(emptyState).toBeInTheDocument()
    expect(screen.getByText('No snapshots yet')).toBeInTheDocument()
  })

  it('should вызывать onSnapshotSelect при клике на snapshot', () => {
    const mockSnapshots = createMockSnapshots(3)
    const mockJumpTo = vi.fn()
    const mockOnSnapshotSelect = vi.fn()

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 3,
      currentIndex: 2,
      jumpTo: mockJumpTo,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList onSnapshotSelect={mockOnSnapshotSelect} />)

    const firstItem = screen.getByTestId('snapshot-item-0')
    fireEvent.click(firstItem)

    expect(mockJumpTo).toHaveBeenCalledWith(0)
    expect(mockOnSnapshotSelect).toHaveBeenCalledWith(0)
  })

  it('should filter snapshots по action', () => {
    const mockSnapshots = createMockSnapshots(5)
    mockSnapshots[0].metadata.action = 'paste'
    mockSnapshots[1].metadata.action = 'delete'

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots.filter(s => s.metadata.action === 'paste'),
      totalCount: 5,
      currentIndex: 2,
      jumpTo: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: 'paste',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    // Проверяем, что фильтр установлен
    const filterSelect = screen.getByTestId('snapshot-filter-select')
    expect(filterSelect).toHaveValue('paste')
  })

  it('should искать snapshots по search query', () => {
    const mockSnapshots = createMockSnapshots(5)

    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: [],
      totalCount: 5,
      currentIndex: 2,
      jumpTo: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: false,
      searchQuery: 'nonexistent',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    const searchInput = screen.getByTestId('snapshot-search-input')
    expect(searchInput).toHaveValue('nonexistent')

    // Should отображаться empty state с другим сообщением
    const emptyState = screen.getByTestId('snapshot-empty-state')
    expect(emptyState).toBeInTheDocument()
  })
})

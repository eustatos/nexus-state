import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnapshotList } from '../SnapshotList'

// Mock useSnapshots hook
vi.mock('@/hooks/useSnapshots', () => ({
  useSnapshots: vi.fn()
}))

import { useSnapshots } from '@/hooks/useSnapshots'
import type { Snapshot } from '@nexus-state/core'

const createMockSnapshot = (
  action: string,
  timestamp: number,
  snapshotId: string
): Snapshot => ({
  id: snapshotId,
  state: {
    'editor.content': {
      value: 'test content',
      type: 'writable'
    }
  },
  metadata: {
    timestamp,
    action: action as any,
    atomCount: 5
  }
})

describe('SnapshotList', () => {
  const mockSnapshots = [
    createMockSnapshot('text-edit', Date.now(), 'snapshot-1'),
    createMockSnapshot('paste', Date.now() - 10000, 'snapshot-2'),
    createMockSnapshot('delete', Date.now() - 20000, 'snapshot-3')
  ]

  const mockUseSnapshotsReturn = {
    snapshots: mockSnapshots,
    filteredSnapshots: mockSnapshots,
    totalCount: 3,
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
  }

  beforeEach(() => {
    vi.mocked(useSnapshots).mockReturnValue(mockUseSnapshotsReturn)
  })

  it('should render snapshot list with count', () => {
    render(<SnapshotList />)

    expect(screen.getByTestId('snapshot-list')).toBeInTheDocument()
    expect(screen.getByTestId('snapshot-count')).toHaveTextContent('3 snapshots')
  })

  it('should render undo/redo buttons when showUndoRedo is true', () => {
    render(<SnapshotList showUndoRedo={true} />)

    expect(screen.getByTestId('snapshot-undo-button')).toBeInTheDocument()
    expect(screen.getByTestId('snapshot-redo-button')).toBeInTheDocument()
  })

  it('should not render undo/redo buttons when showUndoRedo is false', () => {
    render(<SnapshotList showUndoRedo={false} />)

    expect(screen.queryByTestId('snapshot-undo-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('snapshot-redo-button')).not.toBeInTheDocument()
  })

  it('should render search input when showSearch is true', () => {
    render(<SnapshotList showSearch={true} />)

    expect(screen.getByTestId('snapshot-search-input')).toBeInTheDocument()
  })

  it('should not render search input when showSearch is false', () => {
    render(<SnapshotList showSearch={false} />)

    expect(screen.queryByTestId('snapshot-search-input')).not.toBeInTheDocument()
  })

  it('should render filter select when showFilter is true', () => {
    render(<SnapshotList showFilter={true} />)

    expect(screen.getByTestId('snapshot-filter-select')).toBeInTheDocument()
  })

  it('should not render filter select when showFilter is false', () => {
    render(<SnapshotList showFilter={false} />)

    expect(screen.queryByTestId('snapshot-filter-select')).not.toBeInTheDocument()
  })

  it('should call jumpTo when snapshot item is clicked', () => {
    const jumpToMock = vi.fn()
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      jumpTo: jumpToMock
    })

    render(<SnapshotList />)

    // Click on first snapshot item
    const firstSnapshot = screen.getByTestId('snapshot-item-0')
    fireEvent.click(firstSnapshot)

    expect(jumpToMock).toHaveBeenCalledWith(0)
  })

  it('should call undo when undo button is clicked', () => {
    const undoMock = vi.fn()
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      undo: undoMock,
      canUndo: true
    })

    render(<SnapshotList />)

    fireEvent.click(screen.getByTestId('snapshot-undo-button'))
    expect(undoMock).toHaveBeenCalled()
  })

  it('should call redo when redo button is clicked', () => {
    const redoMock = vi.fn()
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      redo: redoMock,
      canRedo: true
    })

    render(<SnapshotList />)

    fireEvent.click(screen.getByTestId('snapshot-redo-button'))
    expect(redoMock).toHaveBeenCalled()
  })

  it('should disable undo button when canUndo is false', () => {
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      canUndo: false
    })

    render(<SnapshotList />)

    expect(screen.getByTestId('snapshot-undo-button')).toBeDisabled()
  })

  it('should disable redo button when canRedo is false', () => {
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      canRedo: false
    })

    render(<SnapshotList />)

    expect(screen.getByTestId('snapshot-redo-button')).toBeDisabled()
  })

  it('should update search query when typing in search input', () => {
    const setSearchQueryMock = vi.fn()
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      setSearchQuery: setSearchQueryMock
    })

    render(<SnapshotList />)

    const searchInput = screen.getByTestId('snapshot-search-input')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(setSearchQueryMock).toHaveBeenCalledWith('test')
  })

  it('should update action filter when selecting filter option', () => {
    const setActionFilterMock = vi.fn()
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      setActionFilter: setActionFilterMock
    })

    render(<SnapshotList />)

    const filterSelect = screen.getByTestId('snapshot-filter-select')
    fireEvent.change(filterSelect, { target: { value: 'text-edit' } })

    expect(setActionFilterMock).toHaveBeenCalledWith('text-edit')
  })

  it('should show empty state when no snapshots', () => {
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      filteredSnapshots: [],
      totalCount: 0
    })

    render(<SnapshotList />)

    expect(screen.getByTestId('snapshot-empty-state')).toBeInTheDocument()
    expect(screen.getByText('No snapshots yet')).toBeInTheDocument()
  })

  it('should show filtered empty state when snapshots exist but none match filters', () => {
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      filteredSnapshots: [],
      totalCount: 5
    })

    render(<SnapshotList />)

    expect(screen.getByTestId('snapshot-empty-state')).toBeInTheDocument()
    expect(screen.getByText('No snapshots match your filters')).toBeInTheDocument()
  })

  it('should call onSnapshotSelect when snapshot is clicked', () => {
    const handleSelect = vi.fn()
    const jumpToMock = vi.fn()
    vi.mocked(useSnapshots).mockReturnValue({
      ...mockUseSnapshotsReturn,
      jumpTo: jumpToMock
    })

    render(<SnapshotList onSnapshotSelect={handleSelect} />)

    fireEvent.click(screen.getByTestId('snapshot-item-0'))
    expect(handleSelect).toHaveBeenCalledWith(0)
  })

  it('should render snapshot items container', () => {
    render(<SnapshotList />)

    expect(screen.getByTestId('snapshot-items-container')).toBeInTheDocument()
  })

  it('should apply maxHeight style when provided', () => {
    render(<SnapshotList maxHeight="500px" />)

    const itemsContainer = screen.getByTestId('snapshot-items-container')
    expect(itemsContainer).toHaveStyle('max-height: 500px')
  })

  it('should have proper accessibility attributes', () => {
    render(<SnapshotList />)

    const itemsContainer = screen.getByTestId('snapshot-items-container')
    expect(itemsContainer).toHaveAttribute('role', 'list')
    expect(itemsContainer).toHaveAttribute('aria-label', 'Snapshot history')
  })

  it('should have search input with proper aria-label', () => {
    render(<SnapshotList />)

    const searchInput = screen.getByTestId('snapshot-search-input')
    expect(searchInput).toHaveAttribute('aria-label', 'Search snapshots')
  })

  it('should have filter select with proper aria-label', () => {
    render(<SnapshotList />)

    const filterSelect = screen.getByTestId('snapshot-filter-select')
    expect(filterSelect).toHaveAttribute('aria-label', 'Filter by action type')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SnapshotList } from '../SnapshotList'
import { useSnapshots } from '@/hooks/useSnapshots'
import type { Snapshot } from '@nexus-state/core'

vi.mock('@/hooks/useSnapshots', () => ({
  useSnapshots: vi.fn()
}))

const createMockSnapshot = (
  action: string,
  timestamp: number,
  snapshotId: string
): Snapshot => ({
  id: snapshotId,
  state: {
    'editor.content': { value: `content-${snapshotId}`, type: 'writable' }
  },
  metadata: { timestamp, action: action as any, atomCount: 5 }
})

describe('SnapshotList - Navigation Tests', () => {
  const mockSnapshots = [
    createMockSnapshot('manual-save', Date.now(), 'snap-5'),
    createMockSnapshot('delete', Date.now() - 10000, 'snap-4'),
    createMockSnapshot('paste', Date.now() - 20000, 'snap-3'),
    createMockSnapshot('text-edit', Date.now() - 30000, 'snap-2'),
    createMockSnapshot('text-edit', Date.now() - 40000, 'snap-1')
  ]

  let mockJumpTo: ReturnType<typeof vi.fn>
  let mockUndo: ReturnType<typeof vi.fn>
  let mockRedo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockJumpTo = vi.fn()
    mockUndo = vi.fn()
    mockRedo = vi.fn()

    vi.mocked(useSnapshots).mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 5,
      currentIndex: 4,
      jumpTo: mockJumpTo,
      undo: mockUndo,
      redo: mockRedo,
      canUndo: true,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })
  })

  it('should call jumpTo when clicking on snapshot item', async () => {
    render(<SnapshotList />)

    const item = screen.getByTestId('snapshot-item-0')
    fireEvent.click(item)

    await waitFor(() => {
      expect(mockJumpTo).toHaveBeenCalled()
    })
  })

  it('should call jumpTo for multiple snapshot clicks', async () => {
    render(<SnapshotList />)

    fireEvent.click(screen.getByTestId('snapshot-item-0'))
    fireEvent.click(screen.getByTestId('snapshot-item-2'))
    fireEvent.click(screen.getByTestId('snapshot-item-4'))

    await waitFor(() => {
      expect(mockJumpTo).toHaveBeenCalledTimes(3)
    })
  })

  it('should call undo when clicking undo button', () => {
    render(<SnapshotList showUndoRedo={true} />)

    const undoButton = screen.getByTestId('snapshot-undo-button')
    fireEvent.click(undoButton)

    expect(mockUndo).toHaveBeenCalled()
  })

  it('should call redo when clicking redo button', () => {
    vi.mocked(useSnapshots).mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 5,
      currentIndex: 2,
      jumpTo: mockJumpTo,
      undo: mockUndo,
      redo: mockRedo,
      canUndo: true,
      canRedo: true,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList showUndoRedo={true} />)

    const redoButton = screen.getByTestId('snapshot-redo-button')
    fireEvent.click(redoButton)

    expect(mockRedo).toHaveBeenCalled()
  })

  it('should disable undo button when canUndo is false', () => {
    vi.mocked(useSnapshots).mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 5,
      currentIndex: 4,
      jumpTo: mockJumpTo,
      undo: mockUndo,
      redo: mockRedo,
      canUndo: false,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList showUndoRedo={true} />)

    const undoButton = screen.getByTestId('snapshot-undo-button')
    expect(undoButton).toBeDisabled()
  })

  it('should disable redo button when canRedo is false', () => {
    render(<SnapshotList showUndoRedo={true} />)

    const redoButton = screen.getByTestId('snapshot-redo-button')
    expect(redoButton).toBeDisabled()
  })

  it('should highlight current snapshot', () => {
    render(<SnapshotList />)

    // currentIndex: 4 means the 5th snapshot in history (oldest)
    // In UI, snapshots are displayed in reverse order (newest first)
    // So the current snapshot should be at uiIndex 0 (the first in the list)
    const currentItem = screen.getByTestId('snapshot-item-0')
    expect(currentItem).toHaveAttribute('data-is-current', 'true')
  })

  it('should show current badge only once', () => {
    render(<SnapshotList />)

    const currentBadges = screen.getAllByTestId('snapshot-current-badge')
    expect(currentBadges).toHaveLength(1)
  })

  it('should show correct snapshot count', () => {
    render(<SnapshotList />)

    const count = screen.getByTestId('snapshot-count')
    expect(count).toHaveTextContent('5 snapshots')
  })

  it('should handle undo-redo sequence', () => {
    vi.mocked(useSnapshots).mockReturnValue({
      snapshots: mockSnapshots,
      filteredSnapshots: mockSnapshots,
      totalCount: 5,
      currentIndex: 2,
      jumpTo: mockJumpTo,
      undo: mockUndo,
      redo: mockRedo,
      canUndo: true,
      canRedo: true,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList showUndoRedo={true} />)

    fireEvent.click(screen.getByTestId('snapshot-undo-button'))
    fireEvent.click(screen.getByTestId('snapshot-redo-button'))

    expect(mockUndo).toHaveBeenCalledTimes(1)
    expect(mockRedo).toHaveBeenCalledTimes(1)
  })

  it('should show empty state when no snapshots', () => {
    vi.mocked(useSnapshots).mockReturnValue({
      snapshots: [],
      filteredSnapshots: [],
      totalCount: 0,
      currentIndex: -1,
      jumpTo: mockJumpTo,
      undo: mockUndo,
      redo: mockRedo,
      canUndo: false,
      canRedo: false,
      searchQuery: '',
      setSearchQuery: vi.fn(),
      actionFilter: '',
      setActionFilter: vi.fn(),
      refresh: vi.fn()
    })

    render(<SnapshotList />)

    expect(screen.getByText('No snapshots yet')).toBeInTheDocument()
  })
})

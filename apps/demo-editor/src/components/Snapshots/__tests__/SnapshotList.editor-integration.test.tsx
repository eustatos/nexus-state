import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SnapshotList } from '../SnapshotList'
import { useSnapshots } from '@/hooks/useSnapshots'
import type { Snapshot } from '@nexus-state/core'

vi.mock('@/hooks/useSnapshots', () => ({
  useSnapshots: vi.fn()
}))

const createMockSnapshot = (
  content: string,
  timestamp: number,
  snapshotId: string
): Snapshot => ({
  id: snapshotId,
  state: {
    'editor.content': {
      value: content,
      type: 'primitive',
      name: 'editor.content',
      atomId: 'Symbol(editor.content)'
    }
  },
  metadata: {
    timestamp,
    action: 'text-edit',
    atomCount: 1
  }
})

describe('SnapshotList - Editor Content Integration', () => {
  const mockSnapshots = [
    createMockSnapshot('Final text', Date.now(), 'snap-5'),
    createMockSnapshot('After third edit', Date.now() - 10000, 'snap-4'),
    createMockSnapshot('After second edit', Date.now() - 20000, 'snap-3'),
    createMockSnapshot('After first edit', Date.now() - 30000, 'snap-2'),
    createMockSnapshot('Initial text', Date.now() - 40000, 'snap-1')
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

  describe('Snapshot Selection - Editor Content Changes', () => {
    it('should trigger jumpTo when clicking on snapshot', async () => {
      render(<SnapshotList />)

      // Click on first snapshot (newest in UI)
      const item0 = screen.getByTestId('snapshot-item-0')
      fireEvent.click(item0)

      await waitFor(() => {
        expect(mockJumpTo).toHaveBeenCalled()
      })
    })

    it('should call jumpTo for snapshot clicks', async () => {
      render(<SnapshotList />)

      // Click each snapshot
      fireEvent.click(screen.getByTestId('snapshot-item-0'))
      fireEvent.click(screen.getByTestId('snapshot-item-2'))
      fireEvent.click(screen.getByTestId('snapshot-item-4'))

      await waitFor(() => {
        expect(mockJumpTo).toHaveBeenCalledTimes(3)
      })
    })

    it('should handle multiple rapid snapshot selections', async () => {
      render(<SnapshotList />)

      // Rapid clicks simulating user browsing through history
      fireEvent.click(screen.getByTestId('snapshot-item-0'))
      fireEvent.click(screen.getByTestId('snapshot-item-2'))
      fireEvent.click(screen.getByTestId('snapshot-item-4'))

      await waitFor(() => {
        expect(mockJumpTo).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Undo/Redo - Editor Content Changes', () => {
    it('should call undo to revert to previous content', () => {
      render(<SnapshotList showUndoRedo={true} />)

      const undoButton = screen.getByTestId('snapshot-undo-button')
      fireEvent.click(undoButton)

      expect(mockUndo).toHaveBeenCalled()
    })

    it('should call redo to restore reverted content', () => {
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

      // Undo
      fireEvent.click(screen.getByTestId('snapshot-undo-button'))
      expect(mockUndo).toHaveBeenCalledTimes(1)

      // Redo
      fireEvent.click(screen.getByTestId('snapshot-redo-button'))
      expect(mockRedo).toHaveBeenCalledTimes(1)
    })

    it('should disable undo when at oldest snapshot', () => {
      vi.mocked(useSnapshots).mockReturnValue({
        snapshots: mockSnapshots,
        filteredSnapshots: mockSnapshots,
        totalCount: 5,
        currentIndex: 0,
        jumpTo: mockJumpTo,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: false,
        canRedo: true,
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

    it('should disable redo when at newest snapshot', () => {
      render(<SnapshotList showUndoRedo={true} />)

      const redoButton = screen.getByTestId('snapshot-redo-button')
      expect(redoButton).toBeDisabled()
    })
  })

  describe('Current Snapshot Indicator', () => {
    it('should highlight the current snapshot in the list', () => {
      // currentIndex: 4 means we're at the last snapshot in history
      // In UI (sorted newest first), this is item-4
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

      render(<SnapshotList />)

      // currentIndex: 4 means the 5th snapshot in history (oldest)
      // In UI, snapshots are displayed in reverse order (newest first)
      // So the current snapshot should be at uiIndex 0 (the first in the list)
      const currentItem = screen.getByTestId('snapshot-item-0')
      expect(currentItem).toHaveAttribute('data-is-current', 'true')
    })

    it('should update current indicator after navigation', () => {
      const { rerender } = render(<SnapshotList />)

      // Simulate navigation to middle snapshot
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

      rerender(<SnapshotList />)

      const currentItem = screen.getByTestId('snapshot-item-2')
      expect(currentItem).toHaveAttribute('data-is-current', 'true')
    })

    it('should show only one current snapshot badge', () => {
      render(<SnapshotList />)

      const currentBadges = screen.getAllByTestId('snapshot-current-badge')
      expect(currentBadges).toHaveLength(1)
    })
  })

  describe('Navigation Patterns', () => {
    it('should handle linear navigation', async () => {
      render(<SnapshotList />)

      // Navigate through snapshots
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId(`snapshot-item-${i}`))
      }

      await waitFor(() => {
        expect(mockJumpTo).toHaveBeenCalledTimes(5)
      })
    })

    it('should handle random access navigation', async () => {
      render(<SnapshotList />)

      // Random navigation pattern
      fireEvent.click(screen.getByTestId('snapshot-item-4'))
      fireEvent.click(screen.getByTestId('snapshot-item-0'))
      fireEvent.click(screen.getByTestId('snapshot-item-2'))

      await waitFor(() => {
        expect(mockJumpTo).toHaveBeenCalledTimes(3)
      })
    })

    it('should handle undo-redo-undo sequence', () => {
      vi.mocked(useSnapshots).mockReturnValue({
        snapshots: mockSnapshots,
        filteredSnapshots: mockSnapshots,
        totalCount: 5,
        currentIndex: 3,
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

      // Undo
      fireEvent.click(screen.getByTestId('snapshot-undo-button'))
      expect(mockUndo).toHaveBeenCalledTimes(1)

      // Redo
      fireEvent.click(screen.getByTestId('snapshot-redo-button'))
      expect(mockRedo).toHaveBeenCalledTimes(1)

      // Undo again
      fireEvent.click(screen.getByTestId('snapshot-undo-button'))
      expect(mockUndo).toHaveBeenCalledTimes(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single snapshot', () => {
      vi.mocked(useSnapshots).mockReturnValue({
        snapshots: [mockSnapshots[0]],
        filteredSnapshots: [mockSnapshots[0]],
        totalCount: 1,
        currentIndex: 0,
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

      const item = screen.getByTestId('snapshot-item-0')
      fireEvent.click(item)

      expect(mockJumpTo).toHaveBeenCalledWith(0)
    })

    it('should handle empty snapshot list', () => {
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
      expect(mockJumpTo).not.toHaveBeenCalled()
    })
  })

  describe('Snapshot Information Display', () => {
    it('should show correct snapshot count', () => {
      render(<SnapshotList />)

      const count = screen.getByTestId('snapshot-count')
      expect(count).toHaveTextContent('5 snapshots')
    })

    it('should show snapshot action type', () => {
      render(<SnapshotList />)

      const action = screen.getByTestId('snapshot-action-0')
      expect(action).toHaveTextContent('Edit')
    })

    it('should show snapshot delta information', () => {
      // Add delta info to snapshots
      const snapshotsWithDelta = mockSnapshots.map((snap, i) => ({
        ...snap,
        metadata: {
          ...snap.metadata,
          delta: { added: i * 10, removed: 0, type: 'insert' as const }
        }
      }))

      vi.mocked(useSnapshots).mockReturnValue({
        snapshots: snapshotsWithDelta,
        filteredSnapshots: snapshotsWithDelta,
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

      render(<SnapshotList />)

      const delta = screen.getByTestId('snapshot-delta-0')
      expect(delta).toBeInTheDocument()
    })
  })
})

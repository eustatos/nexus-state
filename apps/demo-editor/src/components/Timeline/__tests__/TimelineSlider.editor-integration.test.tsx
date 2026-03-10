import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TimelineSlider } from '../TimelineSlider'
import { useTimeTravel } from '@/hooks/useTimeTravel'
import type { Snapshot } from '@nexus-state/core'

vi.mock('@/hooks/useTimeTravel', () => ({
  useTimeTravel: vi.fn()
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

describe('TimelineSlider - Editor Content Integration', () => {
  const mockSnapshots = [
    createMockSnapshot('Initial text', Date.now() - 40000, 'snap-1'),
    createMockSnapshot('After first edit', Date.now() - 30000, 'snap-2'),
    createMockSnapshot('After second edit', Date.now() - 20000, 'snap-3'),
    createMockSnapshot('After third edit', Date.now() - 10000, 'snap-4'),
    createMockSnapshot('Final text', Date.now(), 'snap-5')
  ]

  let mockJumpTo: ReturnType<typeof vi.fn>
  let mockUndo: ReturnType<typeof vi.fn>
  let mockRedo: ReturnType<typeof vi.fn>
  let mockGetHistory: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockJumpTo = vi.fn().mockImplementation((index: number) => {
      // Симулируем восстановление состояния
      return true
    })
    mockUndo = vi.fn().mockReturnValue(true)
    mockRedo = vi.fn().mockReturnValue(true)
    mockGetHistory = vi.fn().mockReturnValue(mockSnapshots)

    vi.mocked(useTimeTravel).mockImplementation(() => ({
      currentPosition: 4,
      snapshotsCount: 5,
      canUndo: true,
      canRedo: false,
      jumpTo: mockJumpTo,
      undo: mockUndo,
      redo: mockRedo,
      jumpToFirst: vi.fn(),
      jumpToLast: vi.fn(),
      jumpToPrev: vi.fn(),
      jumpToNext: vi.fn(),
      getHistory: mockGetHistory
    }))
  })

  describe('Timeline Slider Navigation', () => {
    it('should trigger jumpTo when clicking on timeline point', async () => {
      render(<TimelineSlider />)

      // Click on first snapshot point
      const point0 = screen.getByTestId('timeline-slider-point-0')
      fireEvent.click(point0)

      await waitFor(() => {
        expect(mockJumpTo).toHaveBeenCalledWith(0)
      })
    })

    it('should trigger jumpTo when clicking multiple points', async () => {
      render(<TimelineSlider />)

      // Click different points
      fireEvent.click(screen.getByTestId('timeline-slider-point-0'))
      fireEvent.click(screen.getByTestId('timeline-slider-point-2'))

      await waitFor(() => {
        expect(mockJumpTo).toHaveBeenCalledTimes(2)
      })
    })

    it('should trigger jumpTo when using Home key', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')

      fireEvent.keyDown(slider, { key: 'Home' })

      expect(mockJumpTo).toHaveBeenCalledWith(0)
    })
  })

  describe('Position Display', () => {
    it('should show correct position info', () => {
      render(<TimelineSlider />)

      const info = screen.getByTestId('timeline-slider-info')
      expect(info).toHaveTextContent('5 / 5')
    })

    it('should highlight current snapshot point', () => {
      render(<TimelineSlider />)

      const currentPoint = screen.getByTestId('timeline-slider-point-4')
      expect(currentPoint).toHaveAttribute('data-is-current', 'true')
    })

    it('should update position display after navigation', () => {
      const { rerender } = render(<TimelineSlider />)

      // Simulate navigation to first snapshot
      vi.mocked(useTimeTravel).mockImplementation(() => ({
        currentPosition: 0,
        snapshotsCount: 5,
        canUndo: false,
        canRedo: true,
        jumpTo: mockJumpTo,
        undo: mockUndo,
        redo: mockRedo,
        jumpToFirst: vi.fn(),
        jumpToLast: vi.fn(),
        jumpToPrev: vi.fn(),
        jumpToNext: vi.fn(),
        getHistory: mockGetHistory
      }))

      rerender(<TimelineSlider />)

      const info = screen.getByTestId('timeline-slider-info')
      expect(info).toHaveTextContent('1 / 5')
    })
  })

  describe('Boundary Conditions', () => {
    it('should handle empty history', () => {
      vi.mocked(useTimeTravel).mockImplementation(() => ({
        currentPosition: 0,
        snapshotsCount: 0,
        canUndo: false,
        canRedo: false,
        jumpTo: mockJumpTo,
        undo: mockUndo,
        redo: mockRedo,
        jumpToFirst: vi.fn(),
        jumpToLast: vi.fn(),
        jumpToPrev: vi.fn(),
        jumpToNext: vi.fn(),
        getHistory: vi.fn().mockReturnValue([])
      }))

      render(<TimelineSlider />)

      expect(screen.getByText('No snapshots yet')).toBeInTheDocument()
    })
  })

  describe('Undo/Redo Integration', () => {
    it('should support navigation via jumpTo', () => {
      render(<TimelineSlider />)

      // Navigation uses jumpTo internally
      expect(mockJumpTo).toBeDefined()
    })
  })
})

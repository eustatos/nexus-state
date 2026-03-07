import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TimelineSlider } from '../TimelineSlider'
import { useTimeTravel } from '@/hooks/useTimeTravel'
import type { Snapshot } from '@nexus-state/core'

// Mock time-travel hook
vi.mock('@/hooks/useTimeTravel', () => ({
  useTimeTravel: vi.fn()
}))

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

describe('TimelineSlider', () => {
  const mockSnapshots = [
    createMockSnapshot('text-edit', Date.now(), 'snapshot-1'),
    createMockSnapshot('paste', Date.now() - 10000, 'snapshot-2'),
    createMockSnapshot('delete', Date.now() - 20000, 'snapshot-3'),
    createMockSnapshot('text-edit', Date.now() - 30000, 'snapshot-4'),
    createMockSnapshot('manual-save', Date.now() - 40000, 'snapshot-5')
  ]

  const mockUseTimeTravel = {
    currentPosition: 2,
    snapshotsCount: 5,
    canUndo: true,
    canRedo: true,
    jumpTo: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    jumpToFirst: vi.fn(),
    jumpToLast: vi.fn(),
    jumpToPrev: vi.fn(),
    jumpToNext: vi.fn(),
    getHistory: vi.fn().mockReturnValue(mockSnapshots)
  }

  beforeEach(() => {
    vi.mocked(useTimeTravel).mockReturnValue(mockUseTimeTravel)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render timeline slider', () => {
      render(<TimelineSlider />)
      expect(screen.getByTestId('timeline-slider')).toBeInTheDocument()
    })

    it('should render track element', () => {
      render(<TimelineSlider />)
      expect(screen.getByTestId('timeline-slider-track')).toBeInTheDocument()
    })

    it('should render progress bar', () => {
      render(<TimelineSlider />)
      expect(screen.getByTestId('timeline-slider-progress')).toBeInTheDocument()
    })

    it('should render all snapshot points', () => {
      render(<TimelineSlider />)
      for (let i = 0; i < mockSnapshots.length; i++) {
        expect(screen.getByTestId(`timeline-slider-point-${i}`)).toBeInTheDocument()
      }
    })

    it('should render position indicator', () => {
      render(<TimelineSlider />)
      expect(screen.getByTestId('timeline-slider-indicator')).toBeInTheDocument()
    })

    it('should render position info', () => {
      render(<TimelineSlider />)
      const info = screen.getByTestId('timeline-slider-info')
      expect(info).toHaveTextContent('3 / 5')
    })

    it('should show empty state when no snapshots', () => {
      vi.mocked(useTimeTravel).mockReturnValue({
        ...mockUseTimeTravel,
        snapshotsCount: 0,
        currentPosition: 0,
        getHistory: vi.fn().mockReturnValue([])
      })

      render(<TimelineSlider />)
      expect(screen.getByTestId('timeline-slider')).toHaveClass('timeline-slider--empty')
      expect(screen.getByText('No snapshots yet')).toBeInTheDocument()
    })
  })

  describe('Current Position Display', () => {
    it('should show current snapshot position', () => {
      vi.mocked(useTimeTravel).mockReturnValue({
        ...mockUseTimeTravel,
        currentPosition: 0
      })

      render(<TimelineSlider />)
      expect(screen.getByTestId('timeline-slider-info')).toHaveTextContent('1 / 5')
    })

    it('should mark current point correctly', () => {
      render(<TimelineSlider />)
      const currentPoint = screen.getByTestId('timeline-slider-point-2')
      expect(currentPoint).toHaveAttribute('data-is-current', 'true')
    })
  })

  describe('Drag Interaction', () => {
    it('should handle drag start', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.mouseDown(slider, { clientX: 100 })
      expect(slider).toHaveClass('timeline-slider--dragging')
    })

    it('should handle drag move', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.mouseDown(slider, { clientX: 100 })
      fireEvent.mouseMove(slider, { clientX: 200 })
      expect(slider).toBeInTheDocument()
    })

    it('should handle drag end and jump to position', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.mouseDown(slider, { clientX: 100 })
      fireEvent.mouseMove(slider, { clientX: 200 })
      fireEvent.mouseUp(slider)
      expect(mockUseTimeTravel.jumpTo).toHaveBeenCalled()
    })

    it('should call onPositionChange when position changes', () => {
      const handlePositionChange = vi.fn()
      render(<TimelineSlider onPositionChange={handlePositionChange} />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.mouseDown(slider, { clientX: 100 })
      fireEvent.mouseUp(slider)
      expect(handlePositionChange).toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle keyboard navigation - ArrowLeft', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.keyDown(slider, { key: 'ArrowLeft' })
      expect(mockUseTimeTravel.jumpTo).toHaveBeenCalled()
    })

    it('should handle keyboard navigation - ArrowRight', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.keyDown(slider, { key: 'ArrowRight' })
      expect(mockUseTimeTravel.jumpTo).toHaveBeenCalled()
    })

    it('should handle keyboard navigation - Home', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.keyDown(slider, { key: 'Home' })
      expect(mockUseTimeTravel.jumpTo).toHaveBeenCalledWith(0)
    })

    it('should handle keyboard navigation - End', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.keyDown(slider, { key: 'End' })
      expect(mockUseTimeTravel.jumpTo).toHaveBeenCalledWith(4)
    })
  })

  describe('Point Click', () => {
    it('should handle click on snapshot point', async () => {
      render(<TimelineSlider />)
      const point = screen.getByTestId('timeline-slider-point-0')
      fireEvent.click(point)
      await waitFor(() => {
        expect(mockUseTimeTravel.jumpTo).toHaveBeenCalledWith(0)
      })
    })
  })

  describe('Visual Features', () => {
    it('should apply custom height', () => {
      render(<TimelineSlider height={100} />)
      const slider = screen.getByTestId('timeline-slider')
      expect(slider).toHaveStyle('height: 100px')
    })

    it('should show labels when showLabels is true', () => {
      render(<TimelineSlider showLabels={true} />)
      const point = screen.getByTestId('timeline-slider-point-0')
      const label = point.querySelector('.timeline-slider__point-label')
      expect(label).toBeInTheDocument()
    })

    it('should hide current indicator when showCurrentIndicator is false', () => {
      render(<TimelineSlider showCurrentIndicator={false} />)
      expect(screen.queryByTestId('timeline-slider-indicator')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      expect(slider).toHaveAttribute('role', 'slider')
      expect(slider).toHaveAttribute('tabIndex', '0')
      expect(slider).toHaveAttribute('aria-label', 'Timeline slider')
      expect(slider).toHaveAttribute('aria-valuenow', '2')
      expect(slider).toHaveAttribute('aria-valuemin', '0')
      expect(slider).toHaveAttribute('aria-valuemax', '4')
    })
  })

  describe('Mouse Events', () => {
    it('should handle mouse leave during drag', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.mouseDown(slider, { clientX: 100 })
      fireEvent.mouseLeave(slider)
      expect(slider).not.toHaveClass('timeline-slider--dragging')
    })

    it('should prevent text selection during drag', () => {
      render(<TimelineSlider />)
      const slider = screen.getByTestId('timeline-slider')
      fireEvent.mouseDown(slider, { clientX: 100 })
      expect(slider.classList.contains('timeline-slider--dragging')).toBe(true)
    })
  })

  describe('Single Snapshot', () => {
    it('should handle single snapshot', () => {
      vi.mocked(useTimeTravel).mockReturnValue({
        ...mockUseTimeTravel,
        snapshotsCount: 1,
        currentPosition: 0,
        getHistory: vi.fn().mockReturnValue([mockSnapshots[0]])
      })

      render(<TimelineSlider />)
      expect(screen.getByTestId('timeline-slider-point-0')).toBeInTheDocument()
      expect(screen.getByTestId('timeline-slider-info')).toHaveTextContent('1 / 1')
    })
  })
})

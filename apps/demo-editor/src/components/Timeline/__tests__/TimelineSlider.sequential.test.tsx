import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TimelineSlider } from '../TimelineSlider'
import { useTimeTravel } from '@/hooks/useTimeTravel'
import type { Snapshot } from '@nexus-state/core'

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
    'editor.content': { value: `content-${snapshotId}`, type: 'writable' }
  },
  metadata: { timestamp, action: action as any, atomCount: 5 }
})

describe('TimelineSlider - Navigation Tests', () => {
  const mockSnapshots = [
    createMockSnapshot('text-edit', Date.now() - 40000, 'snap-1'),
    createMockSnapshot('text-edit', Date.now() - 30000, 'snap-2'),
    createMockSnapshot('paste', Date.now() - 20000, 'snap-3'),
    createMockSnapshot('delete', Date.now() - 10000, 'snap-4'),
    createMockSnapshot('manual-save', Date.now(), 'snap-5')
  ]

  let mockJumpTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockJumpTo = vi.fn().mockReturnValue(true)

    vi.mocked(useTimeTravel).mockImplementation(() => ({
      currentPosition: 4,
      snapshotsCount: 5,
      canUndo: true,
      canRedo: false,
      jumpTo: mockJumpTo,
      undo: vi.fn(),
      redo: vi.fn(),
      jumpToFirst: vi.fn(),
      jumpToLast: vi.fn(),
      jumpToPrev: vi.fn(),
      jumpToNext: vi.fn(),
      getHistory: vi.fn().mockReturnValue(mockSnapshots)
    }))
  })

  it('should call jumpTo when clicking on timeline point', async () => {
    render(<TimelineSlider />)

    fireEvent.click(screen.getByTestId('timeline-slider-point-0'))
    fireEvent.click(screen.getByTestId('timeline-slider-point-2'))

    await waitFor(() => {
      expect(mockJumpTo).toHaveBeenCalledTimes(2)
    })
  })

  it('should call jumpTo(0) when pressing Home', () => {
    render(<TimelineSlider />)
    const slider = screen.getByTestId('timeline-slider')

    fireEvent.keyDown(slider, { key: 'Home' })

    expect(mockJumpTo).toHaveBeenCalledWith(0)
  })

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
})

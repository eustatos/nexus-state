import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnapshotItem } from '../SnapshotItem'
import type { Snapshot } from '@nexus-state/core'
import type { SnapshotMetadata } from '@/store/helpers'

const createMockSnapshot = (
  action: string,
  timestamp: number,
  added: number = 0,
  removed: number = 0
): Snapshot & { metadata: SnapshotMetadata & { timestamp: number; atomCount: number } } => ({
  id: `snapshot-${action}-${timestamp}`,
  state: {
    'editor.content': {
      value: 'test content',
      type: 'writable'
    }
  },
  metadata: {
    timestamp,
    action: action as any,
    atomCount: 5,
    delta: {
      added,
      removed,
      type: added > 0 ? 'insert' : removed > 0 ? 'delete' : 'empty',
      netChange: added - removed
    }
  }
})

describe('SnapshotItem', () => {
  const mockSnapshot = createMockSnapshot('text-edit', Date.now(), 10, 5)

  it('should render snapshot item with action and time', () => {
    render(<SnapshotItem snapshot={mockSnapshot} index={0} />)

    expect(screen.getByTestId('snapshot-action-0')).toHaveTextContent('Edit')
    expect(screen.getByTestId('snapshot-time-0')).toBeInTheDocument()
  })

  it('should render current badge when isCurrent is true', () => {
    render(<SnapshotItem snapshot={mockSnapshot} index={0} isCurrent />)

    expect(screen.getByTestId('snapshot-current-badge')).toHaveTextContent('Current')
  })

  it('should not render current badge when isCurrent is false', () => {
    render(<SnapshotItem snapshot={mockSnapshot} index={0} isCurrent={false} />)

    expect(screen.queryByTestId('snapshot-current-badge')).not.toBeInTheDocument()
  })

  it('should render delta information', () => {
    render(<SnapshotItem snapshot={mockSnapshot} index={0} />)

    expect(screen.getByTestId('snapshot-delta-0')).toBeInTheDocument()
    expect(screen.getByTestId('snapshot-delta-added-0')).toHaveTextContent('+10')
    expect(screen.getByTestId('snapshot-delta-removed-0')).toHaveTextContent('-5')
  })

  it('should render atom count', () => {
    render(<SnapshotItem snapshot={mockSnapshot} index={0} />)

    expect(screen.getByTestId('snapshot-atoms-0')).toHaveTextContent('5 atom(s)')
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<SnapshotItem snapshot={mockSnapshot} index={0} onClick={handleClick} />)

    fireEvent.click(screen.getByTestId('snapshot-item-0'))
    expect(handleClick).toHaveBeenCalledWith(0)
  })

  it('should call onClick when Enter key is pressed', () => {
    const handleClick = vi.fn()
    render(<SnapshotItem snapshot={mockSnapshot} index={0} onClick={handleClick} />)

    fireEvent.keyDown(screen.getByTestId('snapshot-item-0'), { key: 'Enter' })
    expect(handleClick).toHaveBeenCalledWith(0)
  })

  it('should call onClick when Space key is pressed', () => {
    const handleClick = vi.fn()
    render(<SnapshotItem snapshot={mockSnapshot} index={0} onClick={handleClick} />)

    fireEvent.keyDown(screen.getByTestId('snapshot-item-0'), { key: ' ' })
    expect(handleClick).toHaveBeenCalledWith(0)
  })

  it('should call onMouseEnter when mouse enters', () => {
    const handleMouseEnter = vi.fn()
    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        onMouseEnter={handleMouseEnter}
      />
    )

    fireEvent.mouseEnter(screen.getByTestId('snapshot-item-0'))
    expect(handleMouseEnter).toHaveBeenCalledWith(0)
  })

  it('should call onMouseLeave when mouse leaves', () => {
    const handleMouseLeave = vi.fn()
    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        onMouseLeave={handleMouseLeave}
      />
    )

    fireEvent.mouseLeave(screen.getByTestId('snapshot-item-0'))
    expect(handleMouseLeave).toHaveBeenCalledWith(0)
  })

  it('should render different icons for different action types', () => {
    const actions = ['text-edit', 'paste', 'delete', 'manual-save', 'initial']

    actions.forEach(action => {
      const snapshot = createMockSnapshot(action, Date.now())
      const { unmount } = render(<SnapshotItem snapshot={snapshot} index={0} />)

      expect(screen.getByTestId(`snapshot-action-0`)).toBeInTheDocument()
      unmount()
    })
  })

  it('should show "No changes" when delta is zero', () => {
    const snapshot = createMockSnapshot('text-edit', Date.now(), 0, 0)
    render(<SnapshotItem snapshot={snapshot} index={0} />)

    expect(screen.getByTestId('snapshot-delta-0')).toContainElement(
      screen.getByText('No changes')
    )
  })

  it('should have proper data attributes for testing', () => {
    render(<SnapshotItem snapshot={mockSnapshot} index={5} isCurrent />)

    const item = screen.getByTestId('snapshot-item-5')
    expect(item).toHaveAttribute('data-snapshot-index', '5')
    expect(item).toHaveAttribute('data-is-current', 'true')
  })

  it('should format time correctly for recent snapshots', () => {
    const recentSnapshot = createMockSnapshot('text-edit', Date.now() - 5000, 1, 0)
    render(<SnapshotItem snapshot={recentSnapshot} index={0} />)

    const timeElement = screen.getByTestId('snapshot-time-0')
    expect(timeElement).toHaveTextContent('5s ago')
  })

  it('should be focusable for accessibility', () => {
    render(<SnapshotItem snapshot={mockSnapshot} index={0} />)

    const item = screen.getByTestId('snapshot-item-0')
    expect(item).toHaveAttribute('tabIndex', '0')
    expect(item).toHaveAttribute('role', 'button')
  })
})

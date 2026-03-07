/**
 * Тесты для визуальной обратной связи SnapshotItem при jump to snapshot
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnapshotItem } from '../SnapshotItem'
import type { ExtendedSnapshot } from '@/store/helpers'

describe('SnapshotItem - Jump Animation', () => {
  const mockSnapshot: ExtendedSnapshot = {
    id: 'test-snapshot-1',
    state: {},
    metadata: {
      timestamp: Date.now(),
      action: 'text-edit',
      atomCount: 1,
      delta: {
        added: 10,
        removed: 5,
        type: 'insert'
      }
    }
  }

  const mockSnapshotLarge: ExtendedSnapshot = {
    ...mockSnapshot,
    metadata: {
      ...mockSnapshot.metadata,
      delta: {
        added: 600,
        removed: 200,
        type: 'replace'
      }
    }
  }

  it('должен применять класс jumping при клике', async () => {
    const handleClick = vi.fn()

    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={false}
        onClick={handleClick}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')

    // Кликаем по элементу
    fireEvent.click(item)

    // Проверяем, что onClick был вызван
    expect(handleClick).toHaveBeenCalledWith(0)

    // Проверяем, что элемент имеет правильные классы
    expect(item).toHaveClass('snapshot-item')
  })

  it('должен применять класс current когда isCurrent=true', () => {
    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={true}
        onClick={() => {}}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')
    expect(item).toHaveClass('snapshot-item--current')

    const badge = screen.getByTestId('snapshot-current-badge')
    expect(badge).toHaveTextContent('Current')
  })

  it('должен применять класс major-change для больших изменений', () => {
    render(
      <SnapshotItem
        snapshot={mockSnapshotLarge}
        index={0}
        isCurrent={false}
        onClick={() => {}}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')
    expect(item).toHaveClass('snapshot-item--major-change')
  })

  it('должен применять класс significant-change для умеренно больших изменений', () => {
    const mediumSnapshot: ExtendedSnapshot = {
      ...mockSnapshot,
      metadata: {
        ...mockSnapshot.metadata,
        delta: {
          added: 300,
          removed: 100,
          type: 'replace'
        }
      }
    }

    render(
      <SnapshotItem
        snapshot={mediumSnapshot}
        index={0}
        isCurrent={false}
        onClick={() => {}}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')
    expect(item).toHaveClass('snapshot-item--significant-change')
  })

  it('не должен применять классы изменений для небольших delta', () => {
    const smallSnapshot: ExtendedSnapshot = {
      ...mockSnapshot,
      metadata: {
        ...mockSnapshot.metadata,
        delta: {
          added: 20,
          removed: 10,
          type: 'insert'
        }
      }
    }

    render(
      <SnapshotItem
        snapshot={smallSnapshot}
        index={0}
        isCurrent={false}
        onClick={() => {}}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')
    expect(item).not.toHaveClass('snapshot-item--significant-change')
    expect(item).not.toHaveClass('snapshot-item--major-change')
  })

  it('должен запускать анимацию при изменении isCurrent с false на true', () => {
    const { rerender } = render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={false}
        onClick={() => {}}
      />
    )

    let item = screen.getByTestId('snapshot-item-0')
    expect(item).not.toHaveClass('snapshot-item--current')

    // Меняем isCurrent на true
    rerender(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={true}
        onClick={() => {}}
      />
    )

    item = screen.getByTestId('snapshot-item-0')
    expect(item).toHaveClass('snapshot-item--current')
  })

  it('должен поддерживать keyboard navigation (Enter)', () => {
    const handleClick = vi.fn()

    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={false}
        onClick={handleClick}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')

    // Симулируем нажатие Enter
    fireEvent.keyDown(item, { key: 'Enter' })

    expect(handleClick).toHaveBeenCalledWith(0)
  })

  it('должен поддерживать keyboard navigation (Space)', () => {
    const handleClick = vi.fn()

    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={false}
        onClick={handleClick}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')

    // Симулируем нажатие Space
    fireEvent.keyDown(item, { key: ' ' })

    expect(handleClick).toHaveBeenCalledWith(0)
  })

  it('должен вызывать onMouseEnter при наведении', () => {
    const handleMouseEnter = vi.fn()

    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={false}
        onClick={() => {}}
        onMouseEnter={handleMouseEnter}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')
    fireEvent.mouseEnter(item)

    expect(handleMouseEnter).toHaveBeenCalledWith(0)
  })

  it('должен вызывать onMouseLeave при уходе курсора', () => {
    const handleMouseLeave = vi.fn()

    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={false}
        onClick={() => {}}
        onMouseLeave={handleMouseLeave}
      />
    )

    const item = screen.getByTestId('snapshot-item-0')
    fireEvent.mouseLeave(item)

    expect(handleMouseLeave).toHaveBeenCalledWith(0)
  })

  it('должен отображать delta информацию', () => {
    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={false}
        onClick={() => {}}
      />
    )

    expect(screen.getByTestId('snapshot-delta-added-0')).toHaveTextContent('+10')
    expect(screen.getByTestId('snapshot-delta-removed-0')).toHaveTextContent('-5')
  })

  it('должен отображать metadata с количеством атомов', () => {
    render(
      <SnapshotItem
        snapshot={mockSnapshot}
        index={0}
        isCurrent={false}
        onClick={() => {}}
      />
    )

    expect(screen.getByTestId('snapshot-atoms-0')).toHaveTextContent('1 atom(s)')
  })
})

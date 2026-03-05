import { describe, it, expect } from 'vitest'
import { HistoryManager } from '../HistoryManager'
import type { Snapshot } from '../../types'

describe('HistoryManager - jumpTo and redo', () => {
  const createMockSnapshot = (id: string, timestamp: number): Snapshot => ({
    id,
    state: {
      'test.atom': {
        value: { count: timestamp },
        type: 'writable'
      }
    },
    metadata: {
      timestamp,
      action: 'test',
      atomCount: 1
    }
  })

  it('should allow redo after jumpTo to earlier snapshot', () => {
    const manager = new HistoryManager(50)

    // Add 3 snapshots
    const snap1 = createMockSnapshot('snap-1', Date.now())
    const snap2 = createMockSnapshot('snap-2', Date.now() + 1000)
    const snap3 = createMockSnapshot('snap-3', Date.now() + 2000)

    manager.add(snap1)
    manager.add(snap2)
    manager.add(snap3)

    // Initial state: current = snap3, past = [snap1, snap2], future = []
    expect(manager.canUndo()).toBe(true)
    expect(manager.canRedo()).toBe(false)
    expect(manager.getCurrent()?.id).toBe('snap-3')

    // Jump to first snapshot (index 0)
    const jumpedTo = manager.jumpTo(0)
    expect(jumpedTo?.id).toBe('snap-1')

    // After jumpTo(0): current = snap1, past = [], future = [snap2, snap3]
    expect(manager.canUndo()).toBe(false)
    expect(manager.canRedo()).toBe(true)
    expect(manager.getCurrent()?.id).toBe('snap-1')

    // Redo should work
    const redone = manager.redo()
    expect(redone?.id).toBe('snap-2')
    expect(manager.getCurrent()?.id).toBe('snap-2')

    // Another redo should work
    const redoneAgain = manager.redo()
    expect(redoneAgain?.id).toBe('snap-3')
    expect(manager.getCurrent()?.id).toBe('snap-3')

    // No more redo
    expect(manager.canRedo()).toBe(false)
  })

  it('should maintain correct history after jumpTo and redo', () => {
    const manager = new HistoryManager(50)

    // Add snapshots
    const snap1 = createMockSnapshot('snap-1', Date.now())
    const snap2 = createMockSnapshot('snap-2', Date.now() + 1000)
    const snap3 = createMockSnapshot('snap-3', Date.now() + 2000)
    const snap4 = createMockSnapshot('snap-4', Date.now() + 3000)

    manager.add(snap1)
    manager.add(snap2)
    manager.add(snap3)
    manager.add(snap4)

    // Jump to second snapshot (index 1)
    manager.jumpTo(1)
    expect(manager.getCurrent()?.id).toBe('snap-2')

    // Redo should go to snap-3
    const redone = manager.redo()
    expect(redone?.id).toBe('snap-3')
    expect(manager.getCurrent()?.id).toBe('snap-3')

    // All snapshots should still be available
    const all = manager.getAll()
    expect(all.length).toBe(4)
    expect(all[0].id).toBe('snap-1')
    expect(all[1].id).toBe('snap-2')
    expect(all[2].id).toBe('snap-3')
    expect(all[3].id).toBe('snap-4')
  })

  it('should handle jumpTo middle of history', () => {
    const manager = new HistoryManager(50)

    const snap1 = createMockSnapshot('snap-1', Date.now())
    const snap2 = createMockSnapshot('snap-2', Date.now() + 1000)
    const snap3 = createMockSnapshot('snap-3', Date.now() + 2000)

    manager.add(snap1)
    manager.add(snap2)
    manager.add(snap3)

    // Jump to middle (index 1)
    const jumpedTo = manager.jumpTo(1)
    expect(jumpedTo?.id).toBe('snap-2')

    // Should be able to undo to snap-1
    expect(manager.canUndo()).toBe(true)
    const undone = manager.undo()
    expect(undone?.id).toBe('snap-1')

    // Should be able to redo twice
    expect(manager.canRedo()).toBe(true)
    manager.redo() // back to snap-2
    expect(manager.canRedo()).toBe(true)
    manager.redo() // to snap-3
    expect(manager.getCurrent()?.id).toBe('snap-3')
  })

  it('should return null for invalid jumpTo index', () => {
    const manager = new HistoryManager(50)

    const snap1 = createMockSnapshot('snap-1', Date.now())
    manager.add(snap1)

    // Invalid indices
    expect(manager.jumpTo(-1)).toBe(null)
    expect(manager.jumpTo(100)).toBe(null)
  })

  it('should handle jumpTo when already at target', () => {
    const manager = new HistoryManager(50)

    const snap1 = createMockSnapshot('snap-1', Date.now())
    const snap2 = createMockSnapshot('snap-2', Date.now() + 1000)

    manager.add(snap1)
    manager.add(snap2)

    // Already at index 1 (current)
    const result = manager.jumpTo(1)
    expect(result?.id).toBe('snap-2')
    expect(manager.getCurrent()?.id).toBe('snap-2')
  })
})

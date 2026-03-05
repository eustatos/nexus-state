import { describe, it, expect } from 'vitest'
import { DeltaAwareHistoryManager } from '../delta-history-manager'
import type { Snapshot } from '../../types'

describe('DeltaAwareHistoryManager - jumpTo and redo', () => {
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

  it('should allow redo after jumpTo with delta snapshots disabled', () => {
    const manager = new DeltaAwareHistoryManager({
      maxHistory: 50,
      deltaSnapshots: {
        enabled: false // Disable deltas for this test
      }
    })

    // Add 3 snapshots
    const snap1 = createMockSnapshot('snap-1', Date.now())
    const snap2 = createMockSnapshot('snap-2', Date.now() + 1000)
    const snap3 = createMockSnapshot('snap-3', Date.now() + 2000)

    manager.add(snap1)
    manager.add(snap2)
    manager.add(snap3)

    // Check we have 3 snapshots
    const all = manager.getAll()
    expect(all.length).toBe(3)

    // Jump to first snapshot (index 0)
    const jumpedTo = manager.jumpTo(0)
    expect(jumpedTo).toBeTruthy()

    // After jumpTo(0): should be able to redo
    expect(manager.canRedo()).toBe(true)

    // Redo should work
    const redone = manager.redo()
    expect(redone).toBeTruthy()

    // Another redo should work
    const redoneAgain = manager.redo()
    expect(redoneAgain).toBeTruthy()

    // No more redo after reaching end
    expect(manager.canRedo()).toBe(false)
  })

  it('should maintain all snapshots after jumpTo and redo', () => {
    const manager = new DeltaAwareHistoryManager({
      maxHistory: 50,
      deltaSnapshots: {
        enabled: false
      }
    })

    const snap1 = createMockSnapshot('snap-1', Date.now())
    const snap2 = createMockSnapshot('snap-2', Date.now() + 1000)
    const snap3 = createMockSnapshot('snap-3', Date.now() + 2000)

    manager.add(snap1)
    manager.add(snap2)
    manager.add(snap3)

    // Jump to first
    manager.jumpTo(0)

    // Redo twice
    manager.redo()
    manager.redo()

    // All snapshots should still be available
    const all = manager.getAll()
    expect(all.length).toBe(3)
  })

  it('should handle jumpTo with delta snapshots enabled', () => {
    const manager = new DeltaAwareHistoryManager({
      maxHistory: 50,
      deltaSnapshots: {
        enabled: true,
        fullSnapshotInterval: 10,
        maxDeltaChainLength: 20,
        changeDetection: 'deep'
      }
    })

    // Add snapshots
    const snap1 = createMockSnapshot('snap-1', Date.now())
    const snap2 = createMockSnapshot('snap-2', Date.now() + 1000)
    const snap3 = createMockSnapshot('snap-3', Date.now() + 2000)

    manager.add(snap1)
    manager.add(snap2)
    manager.add(snap3)

    // Should have snapshots
    const all = manager.getAll()
    expect(all.length).toBeGreaterThan(0)

    // Jump to middle (if we have at least 2 snapshots)
    if (all.length >= 2) {
      const jumpedTo = manager.jumpTo(1)
      expect(jumpedTo).toBeTruthy()

      // Redo should be available if we're not at the end
      if (all.length > 2) {
        expect(manager.canRedo()).toBe(true)
        const redone = manager.redo()
        expect(redone).toBeTruthy()
      }
    }
  })
})

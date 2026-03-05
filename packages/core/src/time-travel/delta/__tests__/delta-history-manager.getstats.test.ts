import { describe, it, expect } from 'vitest'
import { DeltaAwareHistoryManager } from '../delta-history-manager'
import type { Snapshot } from '../../types'

describe('DeltaAwareHistoryManager', () => {
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

  describe('getStats', () => {
    it('should not cause stack overflow when calling getStats', () => {
      const manager = new DeltaAwareHistoryManager({
        maxHistory: 50,
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
          maxDeltaChainLength: 20,
          changeDetection: 'deep'
        }
      })

      // Add some snapshots
      const snapshot1 = createMockSnapshot('snap-1', Date.now())
      const snapshot2 = createMockSnapshot('snap-2', Date.now() + 1000)

      manager.add(snapshot1)
      manager.add(snapshot2)

      // This should not cause stack overflow
      expect(() => {
        const stats = manager.getStats()
        expect(stats).toBeDefined()
        expect(stats.standard).toBeDefined()
        expect(stats.delta).toBeDefined()
      }).not.toThrow()
    })

    it('should return valid stats structure', () => {
      const manager = new DeltaAwareHistoryManager({
        maxHistory: 50,
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
          maxDeltaChainLength: 20,
          changeDetection: 'deep'
        }
      })

      const snapshot = createMockSnapshot('snap-1', Date.now())
      manager.add(snapshot)

      const stats = manager.getStats()

      expect(stats).toHaveProperty('standard')
      expect(stats).toHaveProperty('delta')
      expect(stats).toHaveProperty('memoryEfficiency')
      expect(typeof stats.memoryEfficiency).toBe('number')
    })

    it('should calculate memory efficiency without recursion', () => {
      const manager = new DeltaAwareHistoryManager({
        maxHistory: 50,
        deltaSnapshots: {
          enabled: true,
          fullSnapshotInterval: 10,
          maxDeltaChainLength: 20,
          changeDetection: 'deep'
        }
      })

      // Add multiple snapshots to create deltas
      for (let i = 0; i < 5; i++) {
        const snapshot = createMockSnapshot(`snap-${i}`, Date.now() + i * 1000)
        manager.add(snapshot)
      }

      // Should not throw
      expect(() => {
        const stats = manager.getStats()
        expect(stats.memoryEfficiency).toBeGreaterThanOrEqual(0)
        expect(stats.memoryEfficiency).toBeLessThanOrEqual(1)
      }).not.toThrow()
    })
  })
})

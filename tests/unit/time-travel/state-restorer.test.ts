// tests/unit/time-travel/state-restorer.test.ts
/** 
 * Unit tests for state restorer functionality
 * Implements requirements from TASK-004-IMPLEMENT-TIME-TRAVEL
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateRestorer } from '../../../packages/core/time-travel/state-restorer';
import { StateSnapshot } from '../../../packages/core/time-travel/state-snapshot';
import { createMockStore } from '../../fixtures/mock-devtools';

describe('StateRestorer', () => {
  let restorer: StateRestorer;
  let mockStore: any;

  beforeEach(() => {
    mockStore = createMockStore();
    restorer = new StateRestorer(mockStore);
  });

  describe('Snapshot Management', () => {
    it('should add snapshots to history', () => {
      const snapshot = new StateSnapshot(mockStore);
      restorer.addSnapshot(snapshot);
      
      expect(restorer.getSnapshotCount()).toBe(1);
      expect(restorer.getSnapshotAt(0)).toBe(snapshot);
    });

    it('should maintain snapshot order', () => {
      const snapshot1 = new StateSnapshot(mockStore);
      const snapshot2 = new StateSnapshot(mockStore);
      
      // Ensure different timestamps
      snapshot2.timestamp = snapshot1.timestamp + 1;
      
      restorer.addSnapshot(snapshot2);
      restorer.addSnapshot(snapshot1);
      
      // Should be ordered by timestamp
      expect(restorer.getSnapshotAt(0)).toBe(snapshot1);
      expect(restorer.getSnapshotAt(1)).toBe(snapshot2);
    });

    it('should limit snapshot history', () => {
      // Add more snapshots than limit
      for (let i = 0; i < 15; i++) {
        const snapshot = new StateSnapshot(mockStore);
        snapshot.timestamp = Date.now() + i;
        restorer.addSnapshot(snapshot);
      }
      
      // Should be limited to 10 snapshots
      expect(restorer.getSnapshotCount()).toBe(10);
    });

    it('should clear all snapshots', () => {
      for (let i = 0; i < 5; i++) {
        const snapshot = new StateSnapshot(mockStore);
        restorer.addSnapshot(snapshot);
      }
      
      expect(restorer.getSnapshotCount()).toBe(5);
      restorer.clear();
      expect(restorer.getSnapshotCount()).toBe(0);
    });
  });

  describe('State Restoration', () => {
    it('should restore to specific snapshot', () => {
      const testState = { counter: 42 };
      const snapshot = new StateSnapshot(mockStore);
      snapshot.capturedState = testState;
      
      restorer.addSnapshot(snapshot);
      const success = restorer.restoreToSnapshot(snapshot);
      
      expect(success).toBe(true);
      expect(mockStore.setState).toHaveBeenCalledWith(testState);
    });

    it('should restore to specific index', () => {
      const snapshots = [];
      for (let i = 0; i < 3; i++) {
        const snapshot = new StateSnapshot(mockStore);
        snapshot.capturedState = { counter: i };
        snapshots.push(snapshot);
        restorer.addSnapshot(snapshot);
      }
      
      const success = restorer.restoreToIndex(1);
      expect(success).toBe(true);
      expect(mockStore.setState).toHaveBeenCalledWith({ counter: 1 });
    });

    it('should handle restoration to invalid index', () => {
      const success = restorer.restoreToIndex(5);
      expect(success).toBe(false);
      expect(mockStore.setState).not.toHaveBeenCalled();
    });

    it('should restore to previous state', () => {
      const snapshot1 = new StateSnapshot(mockStore);
      const snapshot2 = new StateSnapshot(mockStore);
      
      snapshot1.capturedState = { counter: 1 };
      snapshot2.capturedState = { counter: 2 };
      
      restorer.addSnapshot(snapshot1);
      restorer.addSnapshot(snapshot2);
      
      const success = restorer.restorePrevious();
      expect(success).toBe(true);
      expect(mockStore.setState).toHaveBeenCalledWith({ counter: 1 });
    });

    it('should handle restore previous when at beginning', () => {
      const snapshot = new StateSnapshot(mockStore);
      snapshot.capturedState = { counter: 1 };
      restorer.addSnapshot(snapshot);
      
      const success = restorer.restorePrevious();
      expect(success).toBe(false);
      expect(mockStore.setState).not.toHaveBeenCalled();
    });

    it('should restore to next state', () => {
      const snapshot1 = new StateSnapshot(mockStore);
      const snapshot2 = new StateSnapshot(mockStore);
      
      snapshot1.capturedState = { counter: 1 };
      snapshot2.capturedState = { counter: 2 };
      
      restorer.addSnapshot(snapshot1);
      restorer.addSnapshot(snapshot2);
      
      // Move to first snapshot
      restorer.currentIndex = 0;
      
      const success = restorer.restoreNext();
      expect(success).toBe(true);
      expect(mockStore.setState).toHaveBeenCalledWith({ counter: 2 });
    });

    it('should handle restore next when at end', () => {
      const snapshot = new StateSnapshot(mockStore);
      snapshot.capturedState = { counter: 1 };
      restorer.addSnapshot(snapshot);
      
      // Move to last snapshot
      restorer.currentIndex = 0;
      
      const success = restorer.restoreNext();
      expect(success).toBe(false);
      expect(mockStore.setState).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should check if can navigate backward', () => {
      expect(restorer.canGoBack()).toBe(false);
      
      const snapshot = new StateSnapshot(mockStore);
      restorer.addSnapshot(snapshot);
      
      expect(restorer.canGoBack()).toBe(false);
      
      // Add another snapshot and move forward
      const snapshot2 = new StateSnapshot(mockStore);
      restorer.addSnapshot(snapshot2);
      restorer.currentIndex = 1;
      
      expect(restorer.canGoBack()).toBe(true);
    });

    it('should check if can navigate forward', () => {
      expect(restorer.canGoForward()).toBe(false);
      
      const snapshot = new StateSnapshot(mockStore);
      restorer.addSnapshot(snapshot);
      
      expect(restorer.canGoForward()).toBe(false);
      
      // Add another snapshot
      const snapshot2 = new StateSnapshot(mockStore);
      restorer.addSnapshot(snapshot2);
      
      // Move to first snapshot
      restorer.currentIndex = 0;
      
      expect(restorer.canGoForward()).toBe(true);
    });

    it('should get current snapshot', () => {
      const snapshot = new StateSnapshot(mockStore);
      restorer.addSnapshot(snapshot);
      
      expect(restorer.getCurrentSnapshot()).toBe(snapshot);
    });

    it('should handle get current snapshot when empty', () => {
      expect(restorer.getCurrentSnapshot()).toBeNull();
    });

    it('should get snapshot history', () => {
      const snapshots = [];
      for (let i = 0; i < 3; i++) {
        const snapshot = new StateSnapshot(mockStore);
        snapshots.push(snapshot);
        restorer.addSnapshot(snapshot);
      }
      
      const history = restorer.getHistory();
      expect(history).toHaveLength(3);
      expect(history).toEqual(snapshots);
    });
  });

  describe('Integration', () => {
    it('should handle complex restoration scenarios', () => {
      // Create a sequence of states
      const states = [
        { counter: 0, step: 'initial' },
        { counter: 1, step: 'increment' },
        { counter: 2, step: 'increment' },
        { counter: 1, step: 'decrement' },
        { counter: 0, step: 'reset' }
      ];
      
      // Add snapshots for each state
      states.forEach((state, index) => {
        const snapshot = new StateSnapshot(mockStore);
        snapshot.capturedState = state;
        snapshot.timestamp = Date.now() + index;
        restorer.addSnapshot(snapshot);
      });
      
      // Test navigation through history
      expect(restorer.canGoBack()).toBe(false);
      expect(restorer.canGoForward()).toBe(true);
      
      // Navigate to end
      for (let i = 0; i < 4; i++) {
        restorer.restoreNext();
      }
      
      expect(restorer.canGoForward()).toBe(false);
      expect(restorer.canGoBack()).toBe(true);
      
      // Navigate back to beginning
      for (let i = 0; i < 4; i++) {
        restorer.restorePrevious();
      }
      
      expect(restorer.canGoBack()).toBe(false);
      expect(restorer.canGoForward()).toBe(true);
    });
  });
});
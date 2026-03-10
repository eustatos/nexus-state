/**
 * Tests for ChangeNotifier
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChangeNotifier } from '../ChangeNotifier';
import type { TrackedAtom } from '../types';

/**
 * Create a mock tracked atom
 */
function createMockAtom(id: symbol, name: string): TrackedAtom {
  return {
    id,
    name,
    atom: {} as any,
    type: 'primitive',
    status: 'active',
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    lastChanged: Date.now(),
    accessCount: 0,
    idleTime: 0,
    ttl: 60000,
    gcEligible: false,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    changeCount: 0,
    metadata: {
      createdAt: Date.now(),
      type: 'primitive',
    },
    subscribers: new Set(),
  };
}

describe('ChangeNotifier', () => {
  let notifier: ChangeNotifier;

  beforeEach(() => {
    notifier = new ChangeNotifier();
  });

  describe('subscribe', () => {
    it('should subscribe to specific atom changes', () => {
      const atomId = Symbol('atom1');
      const listener = vi.fn();

      const unsubscribe = notifier.subscribe(atomId, listener);

      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to global changes', () => {
      const listener = vi.fn();

      const unsubscribe = notifier.subscribe(listener);

      expect(unsubscribe).toBeDefined();
    });

    it('should call listener when atom changes', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      notifier.subscribe(atom.id, listener);
      notifier.notify(atom);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]?.[0].atom).toBe(atom);
    });

    it('should call global listener for any change', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');
      const globalListener = vi.fn();

      notifier.subscribe(globalListener);

      notifier.notify(atom1);
      notifier.notify(atom2);

      expect(globalListener).toHaveBeenCalledTimes(2);
    });

    it('should call both specific and global listeners', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const specificListener = vi.fn();
      const globalListener = vi.fn();

      notifier.subscribe(atom.id, specificListener);
      notifier.subscribe(globalListener);

      notifier.notify(atom);

      expect(specificListener).toHaveBeenCalledTimes(1);
      expect(globalListener).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe specific listener', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      const unsubscribe = notifier.subscribe(atom.id, listener);
      unsubscribe();

      notifier.notify(atom);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should unsubscribe global listener', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      const unsubscribe = notifier.subscribe(listener);
      unsubscribe();

      notifier.notify(atom);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners for same atom', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      notifier.subscribe(atom.id, listener1);
      notifier.subscribe(atom.id, listener2);

      notifier.notify(atom);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should clean up empty listener sets', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      const unsubscribe = notifier.subscribe(atom.id, listener);
      unsubscribe();

      const stats = notifier.getStats();
      expect(stats.atomCount).toBe(0);
    });
  });

  describe('notify', () => {
    it('should notify with value change type by default', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      notifier.subscribe(atom.id, listener);
      notifier.notify(atom);

      expect(listener.mock.calls[0]?.[0].type).toBe('value');
    });

    it('should notify with custom change type', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      notifier.subscribe(atom.id, listener);
      notifier.notify(atom, 'metadata');

      expect(listener.mock.calls[0]?.[0].type).toBe('metadata');
    });

    it('should include timestamp in event', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      notifier.subscribe(atom.id, listener);
      notifier.notify(atom);

      const timestamp = listener.mock.calls[0]?.[0].timestamp;
      expect(timestamp).toBeDefined();
      expect(Date.now() - timestamp).toBeLessThan(100);
    });

    it('should handle listener errors gracefully', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const errorListener = vi.fn(() => {
        throw new Error('Test error');
      });
      const goodListener = vi.fn();

      notifier.subscribe(atom.id, errorListener);
      notifier.subscribe(atom.id, goodListener);

      // Should not throw
      expect(() => notifier.notify(atom)).not.toThrow();

      // Good listener should still be called
      expect(goodListener).toHaveBeenCalledTimes(1);
    });

    it('should handle global listener errors gracefully', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const errorListener = vi.fn(() => {
        throw new Error('Test error');
      });
      const goodListener = vi.fn();

      notifier.subscribe(errorListener);
      notifier.subscribe(goodListener);

      expect(() => notifier.notify(atom)).not.toThrow();
      expect(goodListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('batching', () => {
    it('should queue changes during batch', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');
      const listener = vi.fn();

      notifier.subscribe(atom1.id, listener);
      notifier.startBatch();

      notifier.notify(atom1);
      notifier.notify(atom2);

      expect(listener).not.toHaveBeenCalled();
      expect(notifier.getPendingCount()).toBe(2);
    });

    it('should send queued changes on endBatch', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');
      const listener = vi.fn();

      notifier.subscribe(atom1.id, listener);
      notifier.subscribe(atom2.id, listener);

      notifier.startBatch();
      notifier.notify(atom1);
      notifier.notify(atom2);
      notifier.endBatch();

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should clear pending changes after endBatch', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');

      notifier.startBatch();
      notifier.notify(atom);
      notifier.endBatch();

      expect(notifier.getPendingCount()).toBe(0);
    });

    it('should return isBatching status', () => {
      expect(notifier.getIsBatching()).toBe(false);

      notifier.startBatch();
      expect(notifier.getIsBatching()).toBe(true);

      notifier.endBatch();
      expect(notifier.getIsBatching()).toBe(false);
    });

    it('should clear pending changes without sending', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      notifier.subscribe(atom.id, listener);

      notifier.startBatch();
      notifier.notify(atom);
      notifier.clearPending();
      notifier.endBatch();

      expect(listener).not.toHaveBeenCalled();
      expect(notifier.getPendingCount()).toBe(0);
    });

    it('should handle nested notifications during endBatch', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');
      const listener = vi.fn();

      notifier.subscribe(atom1.id, () => {
        // This listener notifies another atom during endBatch
        notifier.notify(atom2);
      });
      notifier.subscribe(atom2.id, listener);

      notifier.startBatch();
      notifier.notify(atom1);
      notifier.endBatch();

      // atom1 notification triggers atom2 notification
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStats', () => {
    it('should return statistics for empty notifier', () => {
      const stats = notifier.getStats();

      expect(stats.totalListeners).toBe(0);
      expect(stats.atomCount).toBe(0);
      expect(stats.globalListeners).toBe(0);
      expect(stats.pendingChanges).toBe(0);
    });

    it('should return statistics with listeners', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');

      notifier.subscribe(atom1.id, vi.fn());
      notifier.subscribe(atom1.id, vi.fn());
      notifier.subscribe(atom2.id, vi.fn());
      notifier.subscribe(vi.fn()); // global

      const stats = notifier.getStats();

      expect(stats.totalListeners).toBe(3); // 2 for atom1 + 1 for atom2, global not counted in totalListeners
      expect(stats.atomCount).toBe(2);
      expect(stats.globalListeners).toBe(1);
    });

    it('should track pending changes', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');

      notifier.startBatch();
      notifier.notify(atom);
      notifier.notify(atom);

      const stats = notifier.getStats();
      expect(stats.pendingChanges).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all listeners', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      notifier.subscribe(atom.id, listener);
      notifier.subscribe(vi.fn());

      notifier.clear();

      const stats = notifier.getStats();
      expect(stats.totalListeners).toBe(0);
      expect(stats.atomCount).toBe(0);
      expect(stats.globalListeners).toBe(0);
    });

    it('should clear pending changes', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');

      notifier.startBatch();
      notifier.notify(atom);

      notifier.clear();

      expect(notifier.getPendingCount()).toBe(0);
      expect(notifier.getIsBatching()).toBe(false);
    });
  });

  describe('clearAtomListeners', () => {
    it('should clear listeners for specific atom', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');

      notifier.subscribe(atom1.id, vi.fn());
      notifier.subscribe(atom2.id, vi.fn());

      notifier.clearAtomListeners(atom1.id);

      const stats = notifier.getStats();
      expect(stats.atomCount).toBe(1);
      expect(stats.totalListeners).toBe(1);
    });

    it('should not affect other atoms', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');
      const listener2 = vi.fn();

      notifier.subscribe(atom1.id, vi.fn());
      notifier.subscribe(atom2.id, listener2);

      notifier.clearAtomListeners(atom1.id);

      notifier.notify(atom2);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle notify without listeners', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');

      // Should not throw
      expect(() => notifier.notify(atom)).not.toThrow();
    });

    it('should handle unsubscribe multiple times', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listener = vi.fn();

      const unsubscribe = notifier.subscribe(atom.id, listener);
      unsubscribe();
      unsubscribe(); // Should not throw

      expect(() => unsubscribe()).not.toThrow();
    });

    it('should handle many listeners', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const listeners: ReturnType<typeof vi.fn>[] = [];

      for (let i = 0; i < 100; i++) {
        const listener = vi.fn();
        listeners.push(listener);
        notifier.subscribe(atom.id, listener);
      }

      notifier.notify(atom);

      listeners.forEach((l) => {
        expect(l).toHaveBeenCalledTimes(1);
      });
    });
  });
});

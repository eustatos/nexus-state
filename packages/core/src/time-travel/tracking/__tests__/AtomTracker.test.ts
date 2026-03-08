/**
 * Tests for AtomTracker
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AtomTracker } from '../AtomTracker';
import type { Store, Atom } from '../../types';

/**
 * Create mock store
 */
function createMockStore(): Store {
  const atoms = new Map<symbol, unknown>();
  
  return {
    get: vi.fn((atom: Atom<unknown>) => atoms.get(atom.id)),
    set: vi.fn((atom: Atom<unknown>, value: unknown) => {
      atoms.set(atom.id, value);
    }),
    subscribe: vi.fn(),
  } as any;
}

/**
 * Create mock atom
 */
function createMockAtom(id?: symbol, name?: string): Atom<unknown> {
  const atomId = id || Symbol('test');
  return {
    id: atomId,
    name: name || 'test',
    type: 'primitive' as const,
    read: () => undefined,
  };
}

describe('AtomTracker', () => {
  let tracker: AtomTracker;
  let store: Store;

  beforeEach(() => {
    store = createMockStore();
    tracker = new AtomTracker(store, {
      enableCleanup: false, // Disable cleanup for tests
      autoTrack: true,
    });
  });

  afterEach(async () => {
    await tracker.dispose();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(tracker).toBeDefined();
      expect(tracker.getCount()).toBe(0);
    });

    it('should create with custom config', () => {
      const customTracker = new AtomTracker(store, {
        maxAtoms: 500,
        enableCleanup: false,
        defaultTTL: 60000,
      });

      expect(customTracker.getConfig().maxAtoms).toBe(500);
      expect(customTracker.getTTLConfig().defaultTTL).toBe(60000);
    });
  });

  describe('track', () => {
    it('should track primitive atom', () => {
      const atom = createMockAtom();
      const result = tracker.track(atom);

      expect(result).toBe(true);
      expect(tracker.getCount()).toBe(1);
      expect(tracker.isTracked(atom.id)).toBe(true);
    });

    it('should track multiple atoms', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');

      tracker.track(atom1);
      tracker.track(atom2);

      expect(tracker.getCount()).toBe(2);
    });

    it('should store atom metadata', () => {
      const atom = createMockAtom(Symbol('test'), 'testName');
      tracker.track(atom);

      const tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked).toBeDefined();
      expect(tracked?.name).toBe('testName');
      expect(tracked?.type).toBe('primitive');
    });
  });

  describe('untrack', () => {
    it('should untrack atom', () => {
      const atom = createMockAtom();
      tracker.track(atom);

      expect(tracker.isTracked(atom.id)).toBe(true);

      const result = tracker.untrack(atom.id);
      expect(result).toBe(true);
      expect(tracker.isTracked(atom.id)).toBe(false);
    });

    it('should return false for unknown atom', () => {
      const result = tracker.untrack(Symbol('unknown'));
      expect(result).toBe(false);
    });
  });

  describe('getTrackedAtom', () => {
    it('should return tracked atom', () => {
      const atom = createMockAtom(Symbol('test'), 'test');
      tracker.track(atom);

      const tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked).toBeDefined();
      expect(tracked?.id).toBe(atom.id);
    });

    it('should return null for unknown atom', () => {
      const tracked = tracker.getTrackedAtom(Symbol('unknown'));
      expect(tracked).toBeNull();
    });
  });

  describe('getTrackedAtoms', () => {
    it('should return all tracked atoms', () => {
      const atom1 = createMockAtom(Symbol('atom1'), 'atom1');
      const atom2 = createMockAtom(Symbol('atom2'), 'atom2');

      tracker.track(atom1);
      tracker.track(atom2);

      const atoms = tracker.getTrackedAtoms();
      expect(atoms.length).toBe(2);
    });

    it('should return empty array when no atoms', () => {
      const atoms = tracker.getTrackedAtoms();
      expect(atoms).toEqual([]);
    });
  });

  describe('getAtomByName', () => {
    it('should return atom by name', () => {
      const atom = createMockAtom(Symbol('test'), 'uniqueName');
      tracker.track(atom);

      const found = tracker.getAtomByName('uniqueName');
      expect(found).toBeDefined();
      expect(found?.name).toBe('uniqueName');
    });

    it('should return undefined for unknown name', () => {
      const found = tracker.getAtomByName('unknown');
      expect(found).toBeUndefined();
    });
  });

  describe('isTracked', () => {
    it('should return true for tracked atom', () => {
      const atom = createMockAtom();
      tracker.track(atom);

      expect(tracker.isTracked(atom.id)).toBe(true);
    });

    it('should return false for untracked atom', () => {
      expect(tracker.isTracked(Symbol('unknown'))).toBe(false);
    });
  });

  describe('getCount', () => {
    it('should return count of tracked atoms', () => {
      expect(tracker.getCount()).toBe(0);

      tracker.track(createMockAtom(Symbol('atom1')));
      expect(tracker.getCount()).toBe(1);

      tracker.track(createMockAtom(Symbol('atom2')));
      expect(tracker.getCount()).toBe(2);
    });
  });

  describe('size', () => {
    it('should return count (alias for getCount)', () => {
      tracker.track(createMockAtom());
      expect(tracker.size()).toBe(1);
    });
  });

  describe('recordAccess', () => {
    it('should record atom access', () => {
      const atom = createMockAtom();
      tracker.track(atom);

      expect(() => {
        tracker.recordAccess(atom);
      }).not.toThrow();
    });

    it('should handle untracked atom gracefully', () => {
      const atom = createMockAtom();
      expect(() => {
        tracker.recordAccess(atom);
      }).not.toThrow();
    });
  });

  describe('recordChange', () => {
    it('should record atom change', () => {
      const atom = createMockAtom();
      tracker.track(atom);

      expect(() => {
        tracker.recordChange(atom, 1, 2);
      }).not.toThrow();
    });

    it('should handle untracked atom gracefully', () => {
      const atom = createMockAtom();
      expect(() => {
        tracker.recordChange(atom, 1, 2);
      }).not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return tracking statistics', () => {
      const stats = tracker.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalAtoms).toBe(0);
    });

    it('should return stats with tracked atoms', () => {
      tracker.track(createMockAtom());
      tracker.track(createMockAtom());

      const stats = tracker.getStats();
      expect(stats.totalAtoms).toBe(2);
    });
  });

  describe('getCleanupStats', () => {
    it('should return cleanup statistics', () => {
      const stats = tracker.getCleanupStats();

      expect(stats).toBeDefined();
    });
  });

  describe('getStaleAtoms', () => {
    it('should return stale atoms', () => {
      const stale = tracker.getStaleAtoms();
      expect(stale).toEqual([]);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      tracker.configure({
        maxAtoms: 500,
        defaultTTL: 60000,
      });

      expect(tracker.getConfig().maxAtoms).toBe(500);
      expect(tracker.getTTLConfig().defaultTTL).toBe(60000);
    });

    it('should merge partial configuration', () => {
      tracker.configure({ maxAtoms: 500 });
      tracker.configure({ enableCleanup: false });

      expect(tracker.getConfig().maxAtoms).toBe(500);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = tracker.getConfig();

      expect(config).toBeDefined();
      expect(config.autoTrack).toBe(true);
    });
  });

  describe('getTTLConfig', () => {
    it('should return TTL configuration', () => {
      const config = tracker.getTTLConfig();

      expect(config).toBeDefined();
      expect(config.defaultTTL).toBeDefined();
    });
  });

  describe('subscribe', () => {
    it('should subscribe to tracking events', () => {
      const listener = vi.fn();
      const unsubscribe = tracker.subscribe('atom-tracked', listener);

      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('service accessors', () => {
    it('should return tracking service', () => {
      const service = tracker.getTrackingService();
      expect(service).toBeDefined();
    });

    it('should return access service', () => {
      const service = tracker.getAccessService();
      expect(service).toBeDefined();
    });

    it('should return cleanup service', () => {
      const service = tracker.getCleanupService();
      expect(service).toBeDefined();
    });

    it('should return stats service', () => {
      const service = tracker.getStatsService();
      expect(service).toBeDefined();
    });

    it('should return event service', () => {
      const service = tracker.getEventService();
      expect(service).toBeDefined();
    });

    it('should return repository', () => {
      const repo = tracker.getRepository();
      expect(repo).toBeDefined();
    });

    it('should return TTL manager', () => {
      const ttl = tracker.getTTLManager();
      expect(ttl).toBeDefined();
    });

    it('should return cleanup engine', () => {
      const engine = tracker.getCleanupEngine();
      expect(engine).toBeDefined();
    });

    it('should return scheduler', () => {
      const scheduler = tracker.getScheduler();
      expect(scheduler).toBeDefined();
    });

    it('should return event manager', () => {
      const eventManager = tracker.getEventManager();
      expect(eventManager).toBeDefined();
    });

    it('should return reference counter', () => {
      const refCounter = tracker.getReferenceCounter();
      expect(refCounter).toBeDefined();
    });

    it('should return archive manager', () => {
      const archive = tracker.getArchiveManager();
      expect(archive).toBeDefined();
    });
  });

  describe('dispose', () => {
    it('should dispose tracker', async () => {
      tracker.track(createMockAtom());
      
      await tracker.dispose();

      expect(tracker.getCount()).toBe(0);
    });

    it('should stop scheduler on dispose', async () => {
      const scheduler = tracker.getScheduler();
      const statsBefore = scheduler.getStats();
      
      await tracker.dispose();
      
      const statsAfter = scheduler.getStats();
      expect(statsAfter.isRunning).toBe(false);
    });

    it('should handle multiple dispose calls', async () => {
      await tracker.dispose();
      await tracker.dispose(); // Should not throw
    });
  });

  describe('edge cases', () => {
    it('should handle atom with no name', () => {
      const atom = createMockAtom(Symbol('test'));
      atom.name = undefined as any;
      
      tracker.track(atom);
      
      const tracked = tracker.getTrackedAtom(atom.id);
      expect(tracked).toBeDefined();
    });

    it('should handle many atoms', () => {
      for (let i = 0; i < 100; i++) {
        tracker.track(createMockAtom(Symbol(`atom${i}`), `atom${i}`));
      }

      expect(tracker.getCount()).toBe(100);
    });
  });
});

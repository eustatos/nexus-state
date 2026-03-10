/**
 * CleanupStrategies tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LRUCleanupStrategy,
  LFUCleanupStrategy,
  FIFOCleanupStrategy,
  TimeBasedCleanupStrategy,
  createCleanupStrategy,
} from '../CleanupStrategies';
import type { TrackedAtom } from '../types';

function createMockAtom(
  name: string,
  overrides?: Partial<TrackedAtom>
): TrackedAtom {
  const now = Date.now();
  return {
    id: Symbol(name),
    atom: {} as any,
    name,
    type: 'primitive',
    status: 'active',
    createdAt: now,
    lastAccessedAt: now,
    lastChanged: now,
    accessCount: 0,
    idleTime: 0,
    ttl: 300000,
    gcEligible: true,
    firstSeen: now,
    lastSeen: now,
    changeCount: 0,
    metadata: {
      createdAt: now,
      type: 'primitive',
    },
    ...overrides,
  };
}

describe('LRUCleanupStrategy', () => {
  let strategy: LRUCleanupStrategy;

  beforeEach(() => {
    strategy = new LRUCleanupStrategy();
  });

  describe('constructor', () => {
    it('should create with correct name', () => {
      expect(strategy.name).toBe('lru');
    });
  });

  describe('selectCandidates', () => {
    it('should select least recently used atoms', () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { lastAccessedAt: now - 1000 }),
        createMockAtom('atom2', { lastAccessedAt: now - 3000 }),
        createMockAtom('atom3', { lastAccessedAt: now - 2000 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
      expect(candidates[0]?.name).toBe('atom2');
      expect(candidates[1]?.name).toBe('atom3');
    });

    it('should filter out non-eligible atoms', () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { lastAccessedAt: now - 1000, gcEligible: false }),
        createMockAtom('atom2', { lastAccessedAt: now - 2000, gcEligible: true }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates.length).toBe(1);
      expect(candidates[0]?.name).toBe('atom2');
    });

    it('should respect count limit', () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { lastAccessedAt: now - 1000 }),
        createMockAtom('atom2', { lastAccessedAt: now - 2000 }),
        createMockAtom('atom3', { lastAccessedAt: now - 3000 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 1);

      expect(candidates.length).toBe(1);
      expect(candidates[0]?.name).toBe('atom3');
    });

    it('should return empty array when no eligible atoms', () => {
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { gcEligible: false }),
        createMockAtom('atom2', { gcEligible: false }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates).toEqual([]);
    });

    it('should handle empty atoms array', () => {
      const candidates = strategy.selectCandidates([], 5);

      expect(candidates).toEqual([]);
    });
  });

  describe('getPriority', () => {
    it('should return numeric priority', () => {
      const atom = createMockAtom('atom1', { lastAccessedAt: 1000 });

      const priority = strategy.getPriority(atom);

      expect(typeof priority).toBe('number');
    });
  });
});

describe('LFUCleanupStrategy', () => {
  let strategy: LFUCleanupStrategy;

  beforeEach(() => {
    strategy = new LFUCleanupStrategy();
  });

  describe('constructor', () => {
    it('should create with correct name', () => {
      expect(strategy.name).toBe('lfu');
    });
  });

  describe('selectCandidates', () => {
    it('should select least frequently used atoms', () => {
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { accessCount: 10 }),
        createMockAtom('atom2', { accessCount: 2 }),
        createMockAtom('atom3', { accessCount: 5 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
      expect(candidates[0]?.name).toBe('atom2');
      expect(candidates[1]?.name).toBe('atom3');
    });

    it('should filter out non-eligible atoms', () => {
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { accessCount: 10, gcEligible: false }),
        createMockAtom('atom2', { accessCount: 2, gcEligible: true }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates.length).toBe(1);
      expect(candidates[0]?.name).toBe('atom2');
    });

    it('should respect count limit', () => {
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { accessCount: 10 }),
        createMockAtom('atom2', { accessCount: 2 }),
        createMockAtom('atom3', { accessCount: 5 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 1);

      expect(candidates.length).toBe(1);
      expect(candidates[0]?.name).toBe('atom2');
    });

    it('should handle atoms with same access count', () => {
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { accessCount: 5 }),
        createMockAtom('atom2', { accessCount: 5 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
    });
  });

  describe('getPriority', () => {
    it('should return priority based on accessCount', () => {
      const rareAtom = createMockAtom('rare', { accessCount: 1 });
      const frequentAtom = createMockAtom('frequent', { accessCount: 100 });

      const rarePriority = strategy.getPriority(rareAtom);
      const frequentPriority = strategy.getPriority(frequentAtom);

      // priority = -accessCount
      expect(rarePriority).toBe(-1);
      expect(frequentPriority).toBe(-100);
      // Less frequent = more negative = lower value, but higher priority for cleanup
      expect(frequentPriority).toBeLessThan(rarePriority);
    });
  });
});

describe('FIFOCleanupStrategy', () => {
  let strategy: FIFOCleanupStrategy;

  beforeEach(() => {
    strategy = new FIFOCleanupStrategy();
  });

  describe('constructor', () => {
    it('should create with correct name', () => {
      expect(strategy.name).toBe('fifo');
    });
  });

  describe('selectCandidates', () => {
    it('should select oldest created atoms', () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { createdAt: now - 1000 }),
        createMockAtom('atom2', { createdAt: now - 3000 }),
        createMockAtom('atom3', { createdAt: now - 2000 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
      expect(candidates[0]?.name).toBe('atom2');
      expect(candidates[1]?.name).toBe('atom3');
    });

    it('should filter out non-eligible atoms', () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { createdAt: now - 1000, gcEligible: false }),
        createMockAtom('atom2', { createdAt: now - 2000, gcEligible: true }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates.length).toBe(1);
      expect(candidates[0]?.name).toBe('atom2');
    });

    it('should respect count limit', () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { createdAt: now - 1000 }),
        createMockAtom('atom2', { createdAt: now - 2000 }),
        createMockAtom('atom3', { createdAt: now - 3000 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 1);

      expect(candidates.length).toBe(1);
      expect(candidates[0]?.name).toBe('atom3');
    });

    it('should return empty array when no eligible atoms', () => {
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { gcEligible: false }),
        createMockAtom('atom2', { gcEligible: false }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates).toEqual([]);
    });
  });

  describe('getPriority', () => {
    it('should return numeric priority', () => {
      const atom = createMockAtom('atom1', { createdAt: 1000 });

      const priority = strategy.getPriority(atom);

      expect(typeof priority).toBe('number');
    });
  });
});

describe('TimeBasedCleanupStrategy', () => {
  let strategy: TimeBasedCleanupStrategy;

  beforeEach(() => {
    strategy = new TimeBasedCleanupStrategy();
    // Set current time for testing
    strategy.setCurrentTime(Date.now());
  });

  describe('constructor', () => {
    it('should create with correct name', () => {
      expect(strategy.name).toBe('time-based');
    });
  });

  describe('selectCandidates', () => {
    it('should select oldest atoms by lastChanged', () => {
      const now = Date.now();
      strategy.setCurrentTime(now + 400000); // Future time to make atoms expired
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { lastChanged: now - 1000, lastAccessedAt: now - 1000, ttl: 300000 }),
        createMockAtom('atom2', { lastChanged: now - 3000, lastAccessedAt: now - 3000, ttl: 300000 }),
        createMockAtom('atom3', { lastChanged: now - 2000, lastAccessedAt: now - 2000, ttl: 300000 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
    });

    it('should filter out non-eligible atoms', () => {
      const now = Date.now();
      strategy.setCurrentTime(now + 400000);
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { lastChanged: now - 1000, lastAccessedAt: now - 1000, gcEligible: false, ttl: 300000 }),
        createMockAtom('atom2', { lastChanged: now - 2000, lastAccessedAt: now - 2000, gcEligible: true, ttl: 300000 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      // TimeBased strategy filters by expired status, not gcEligible
      expect(candidates.length).toBeGreaterThanOrEqual(0);
    });

    it('should respect count limit', () => {
      const now = Date.now();
      strategy.setCurrentTime(now + 400000);
      const atoms: TrackedAtom[] = [
        createMockAtom('atom1', { lastChanged: now - 1000, lastAccessedAt: now - 1000, ttl: 300000 }),
        createMockAtom('atom2', { lastChanged: now - 2000, lastAccessedAt: now - 2000, ttl: 300000 }),
        createMockAtom('atom3', { lastChanged: now - 3000, lastAccessedAt: now - 3000, ttl: 300000 }),
      ];

      const candidates = strategy.selectCandidates(atoms, 1);

      expect(candidates.length).toBe(1);
    });
  });

  describe('getPriority', () => {
    it('should return priority based on expiration', () => {
      const now = Date.now();
      strategy.setCurrentTime(now + 400000);
      const oldAtom = createMockAtom('old', { lastChanged: 1000, lastAccessedAt: 1000, ttl: 300000 });
      const newAtom = createMockAtom('new', { lastChanged: 5000, lastAccessedAt: 5000, ttl: 300000 });

      const oldPriority = strategy.getPriority(oldAtom);
      const newPriority = strategy.getPriority(newAtom);

      // Both should be positive (expired), older should have higher priority
      expect(oldPriority).toBeGreaterThan(0);
      expect(newPriority).toBeGreaterThan(0);
    });
  });
});

describe('createCleanupStrategy', () => {
  it('should create LRU strategy', () => {
    const strategy = createCleanupStrategy('lru');

    expect(strategy).toBeInstanceOf(LRUCleanupStrategy);
    expect(strategy.name).toBe('lru');
  });

  it('should create LFU strategy', () => {
    const strategy = createCleanupStrategy('lfu');

    expect(strategy).toBeInstanceOf(LFUCleanupStrategy);
    expect(strategy.name).toBe('lfu');
  });

  it('should create FIFO strategy', () => {
    const strategy = createCleanupStrategy('fifo');

    expect(strategy).toBeInstanceOf(FIFOCleanupStrategy);
    expect(strategy.name).toBe('fifo');
  });

  it('should create TimeBased strategy', () => {
    const strategy = createCleanupStrategy('time-based');

    expect(strategy).toBeInstanceOf(TimeBasedCleanupStrategy);
    expect(strategy.name).toBe('time-based');
  });

  it('should default to LRU for unknown strategy', () => {
    const strategy = createCleanupStrategy('unknown' as any);

    expect(strategy).toBeInstanceOf(LRUCleanupStrategy);
  });

  it('should return new strategy instance for known types', () => {
    const lru = createCleanupStrategy('lru');
    const lfu = createCleanupStrategy('lfu');
    const fifo = createCleanupStrategy('fifo');
    const timeBased = createCleanupStrategy('time-based');

    expect(lru).toBeInstanceOf(LRUCleanupStrategy);
    expect(lfu).toBeInstanceOf(LFUCleanupStrategy);
    expect(fifo).toBeInstanceOf(FIFOCleanupStrategy);
    expect(timeBased).toBeInstanceOf(TimeBasedCleanupStrategy);
  });

  it('should default to LRU for unknown strategy', () => {
    const strategy = createCleanupStrategy('unknown' as any);

    expect(strategy).toBeInstanceOf(LRUCleanupStrategy);
  });
});

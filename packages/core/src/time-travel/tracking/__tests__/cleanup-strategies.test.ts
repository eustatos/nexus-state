/**
 * Tests for cleanup strategies
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  LRUCleanupStrategy,
  LFUCleanupStrategy,
  FIFOCleanupStrategy,
  TimeBasedCleanupStrategy,
} from "../CleanupStrategies";
import type { TrackedAtom } from "./types";

/**
 * Helper to create a mock TrackedAtom
 */
function createMockAtom(overrides: Partial<TrackedAtom> = {}): TrackedAtom {
  const now = Date.now();
  return {
    id: Symbol("test-atom"),
    atom: { id: Symbol("test"), name: "test", type: "primitive" },
    name: "test-atom",
    type: "primitive",
    status: "active",
    createdAt: now,
    lastAccessed: now,
    lastChanged: now,
    firstSeen: now,
    lastSeen: now,
    accessCount: 0,
    changeCount: 0,
    idleTime: 0,
    ttl: 5 * 60 * 1000, // 5 minutes
    gcEligible: false,
    metadata: {
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      changeCount: 0,
    },
    subscribers: new Set(),
    refCount: 0,
    ...overrides,
  };
}

describe("CleanupStrategies", () => {
  describe("LRUCleanupStrategy", () => {
    let strategy: LRUCleanupStrategy;

    beforeEach(() => {
      strategy = new LRUCleanupStrategy();
    });

    it("should have correct name", () => {
      expect(strategy.name).toBe("lru");
    });

    it("should select least recently used atoms first", () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom({
          id: Symbol("atom1"),
          name: "atom1",
          lastAccessed: now - 1000, // Oldest
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom2"),
          name: "atom2",
          lastAccessed: now - 500, // Middle
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom3"),
          name: "atom3",
          lastAccessed: now, // Newest
          gcEligible: true,
        }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
      expect(candidates[0].name).toBe("atom1"); // Oldest first
      expect(candidates[1].name).toBe("atom2");
    });

    it("should only select gcEligible atoms", () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom({
          id: Symbol("atom1"),
          name: "atom1",
          lastAccessed: now - 1000,
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom2"),
          name: "atom2",
          lastAccessed: now - 500,
          gcEligible: false, // Not eligible
        }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates.length).toBe(1);
      expect(candidates[0].name).toBe("atom1");
    });

    it("should return higher priority for older atoms", () => {
      const now = Date.now();
      const oldAtom = createMockAtom({ lastAccessed: now - 10000 });
      const newAtom = createMockAtom({ lastAccessed: now });

      const oldPriority = strategy.getPriority(oldAtom);
      const newPriority = strategy.getPriority(newAtom);

      // Lower lastAccessed = higher priority (more negative value means LOWER priority number)
      // Since priority = -lastAccessed, older atom (smaller lastAccessed) has MORE negative priority
      expect(oldPriority).toBeGreaterThan(newPriority); // -old > -new when old < new
    });
  });

  describe("LFUCleanupStrategy", () => {
    let strategy: LFUCleanupStrategy;

    beforeEach(() => {
      strategy = new LFUCleanupStrategy();
    });

    it("should have correct name", () => {
      expect(strategy.name).toBe("lfu");
    });

    it("should select least frequently used atoms first", () => {
      const atoms: TrackedAtom[] = [
        createMockAtom({
          id: Symbol("atom1"),
          name: "atom1",
          accessCount: 1, // Least frequent
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom2"),
          name: "atom2",
          accessCount: 5, // Middle
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom3"),
          name: "atom3",
          accessCount: 10, // Most frequent
          gcEligible: true,
        }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
      expect(candidates[0].name).toBe("atom1"); // Least frequent first
      expect(candidates[1].name).toBe("atom2");
    });

    it("should only select gcEligible atoms", () => {
      const atoms: TrackedAtom[] = [
        createMockAtom({
          id: Symbol("atom1"),
          name: "atom1",
          accessCount: 1,
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom2"),
          name: "atom2",
          accessCount: 5,
          gcEligible: false,
        }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates.length).toBe(1);
      expect(candidates[0].name).toBe("atom1");
    });

    it("should return higher priority for less accessed atoms", () => {
      const lowAccessAtom = createMockAtom({ accessCount: 1 });
      const highAccessAtom = createMockAtom({ accessCount: 100 });

      const lowPriority = strategy.getPriority(lowAccessAtom);
      const highPriority = strategy.getPriority(highAccessAtom);

      // Lower accessCount = higher priority
      expect(lowPriority).toBeGreaterThan(highPriority);
    });
  });

  describe("FIFOCleanupStrategy", () => {
    let strategy: FIFOCleanupStrategy;

    beforeEach(() => {
      strategy = new FIFOCleanupStrategy();
    });

    it("should have correct name", () => {
      expect(strategy.name).toBe("fifo");
    });

    it("should select oldest created atoms first", () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom({
          id: Symbol("atom1"),
          name: "atom1",
          createdAt: now - 3000, // Oldest
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom2"),
          name: "atom2",
          createdAt: now - 2000, // Middle
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom3"),
          name: "atom3",
          createdAt: now - 1000, // Newest
          gcEligible: true,
        }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
      expect(candidates[0].name).toBe("atom1"); // Oldest first
      expect(candidates[1].name).toBe("atom2");
    });

    it("should only select gcEligible atoms", () => {
      const now = Date.now();
      const atoms: TrackedAtom[] = [
        createMockAtom({
          id: Symbol("atom1"),
          name: "atom1",
          createdAt: now - 3000,
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom2"),
          name: "atom2",
          createdAt: now - 2000,
          gcEligible: false,
        }),
      ];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates.length).toBe(1);
      expect(candidates[0].name).toBe("atom1");
    });
  });

  describe("TimeBasedCleanupStrategy", () => {
    let strategy: TimeBasedCleanupStrategy;
    const baseTime = 1000000; // Fixed time for testing

    beforeEach(() => {
      strategy = new TimeBasedCleanupStrategy(baseTime);
    });

    it("should have correct name", () => {
      expect(strategy.name).toBe("time-based");
    });

    it("should select expired atoms first", () => {
      // Atom with TTL 1000ms, last accessed 2000ms ago - expired
      const expiredAtom = createMockAtom({
        id: Symbol("expired"),
        name: "expired-atom",
        lastAccessed: baseTime - 2000,
        ttl: 1000,
        gcEligible: true,
      });

      // Atom with TTL 1000ms, last accessed 500ms ago - not expired
      const activeAtom = createMockAtom({
        id: Symbol("active"),
        name: "active-atom",
        lastAccessed: baseTime - 500,
        ttl: 1000,
        gcEligible: false,
      });

      const atoms: TrackedAtom[] = [expiredAtom, activeAtom];

      const candidates = strategy.selectCandidates(atoms, 5);

      expect(candidates.length).toBe(1);
      expect(candidates[0].name).toBe("expired-atom");
    });

    it("should sort by most expired first", () => {
      const atoms: TrackedAtom[] = [
        createMockAtom({
          id: Symbol("atom1"),
          name: "slightly-expired",
          lastAccessed: baseTime - 1500,
          ttl: 1000,
          gcEligible: true,
        }),
        createMockAtom({
          id: Symbol("atom2"),
          name: "very-expired",
          lastAccessed: baseTime - 3000,
          ttl: 1000,
          gcEligible: true,
        }),
      ];

      const candidates = strategy.selectCandidates(atoms, 2);

      expect(candidates.length).toBe(2);
      expect(candidates[0].name).toBe("very-expired"); // Most expired first
    });

    it("should calculate priority based on expiration", () => {
      const expiredAtom = createMockAtom({
        lastAccessed: baseTime - 2000,
        ttl: 1000,
      });
      const activeAtom = createMockAtom({
        lastAccessed: baseTime - 500,
        ttl: 1000,
      });

      const expiredPriority = strategy.getPriority(expiredAtom);
      const activePriority = strategy.getPriority(activeAtom);

      // Expired atom should have positive priority (age - ttl > 0)
      expect(expiredPriority).toBeGreaterThan(0);
      // Active atom should have negative priority (age - ttl < 0)
      expect(activePriority).toBeLessThan(0);
    });

    it("should allow updating current time", () => {
      const newTime = baseTime + 10000;
      strategy.setCurrentTime(newTime);

      const atom = createMockAtom({
        lastAccessed: baseTime,
        ttl: 5000,
      });

      // At newTime, atom is 10000ms old with 5000ms TTL - expired
      const candidates = strategy.selectCandidates([atom], 5);
      expect(candidates.length).toBe(1);
    });
  });
});

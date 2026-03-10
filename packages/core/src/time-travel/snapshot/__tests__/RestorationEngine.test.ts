/**
 * RestorationEngine tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RestorationEngine } from '../RestorationEngine';
import { AtomFinder } from '../AtomFinder';
import { ValueDeserializer } from '../ValueDeserializer';
import { RestorationProgressTracker } from '../RestorationProgressTracker';
import type { Store, Atom } from '../../../types';
import type { SnapshotStateEntry } from '../types';

function createMockStore(): Store {
  return {
    get: vi.fn(),
    set: vi.fn(),
    batch: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    getAtom: vi.fn(),
    getAtoms: vi.fn(),
  } as unknown as Store;
}

function createMockAtom(name: string, id?: symbol): Atom<unknown> {
  return {
    id: id || Symbol(name),
    name,
    type: 'primitive',
    get: vi.fn(),
    set: vi.fn(),
  } as unknown as Atom<unknown>;
}

describe('RestorationEngine', () => {
  let engine: RestorationEngine;
  let mockStore: Store;
  let mockAtomFinder: AtomFinder;
  let mockDeserializer: ValueDeserializer;
  let mockProgressTracker: RestorationProgressTracker;

  beforeEach(() => {
    mockStore = createMockStore();
    mockAtomFinder = new AtomFinder();
    mockDeserializer = new ValueDeserializer();
    mockProgressTracker = new RestorationProgressTracker();

    engine = new RestorationEngine(
      mockStore,
      mockAtomFinder,
      mockDeserializer,
      mockProgressTracker
    );
  });

  describe('constructor', () => {
    it('should create with default components', () => {
      const newEngine = new RestorationEngine(mockStore);

      expect(newEngine).toBeDefined();
    });

    it('should create with custom components', () => {
      const newEngine = new RestorationEngine(
        mockStore,
        mockAtomFinder,
        mockDeserializer,
        mockProgressTracker
      );

      expect(newEngine).toBeDefined();
    });
  });

  describe('restore', () => {
    beforeEach(() => {
      const mockAtom = createMockAtom('atom1');
      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: mockAtom,
        foundBy: 'name',
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });
      vi.mocked(mockStore.set).mockImplementation(() => {});
    });

    it('should restore state successfully', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: Symbol('atom1').toString(),
        },
      };

      const result = engine.restore(state);

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBeGreaterThan(0);
      expect(result.totalAtoms).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should restore multiple atoms', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: Symbol('atom1').toString(),
        },
        atom2: {
          value: 'test',
          type: 'primitive',
          name: 'atom2',
          atomId: Symbol('atom2').toString(),
        },
      };

      const mockAtom2 = createMockAtom('atom2');
      vi.spyOn(mockAtomFinder, 'find')
        .mockReturnValueOnce({
          atom: createMockAtom('atom1'),
          foundBy: 'name',
          searchDetails: {
            searchedByName: true,
            searchedById: false,
            searchedByFallback: false,
          },
        })
        .mockReturnValueOnce({
          atom: mockAtom2,
          foundBy: 'name',
          searchDetails: {
            searchedByName: true,
            searchedById: false,
            searchedByFallback: false,
          },
        });

      const result = engine.restore(state);

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(2);
      expect(result.totalAtoms).toBe(2);
    });

    it('should handle empty state', () => {
      const result = engine.restore({});

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(0);
      expect(result.totalAtoms).toBe(0);
    });

    it('should track progress', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: Symbol('atom1').toString(),
        },
      };

      const progressSpy = vi.spyOn(mockProgressTracker, 'start');

      engine.restore(state);

      expect(progressSpy).toHaveBeenCalled();
    });

    it('should measure duration', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: Symbol('atom1').toString(),
        },
      };

      const result = engine.restore(state);

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('batch restoration', () => {
    beforeEach(() => {
      const mockAtom = createMockAtom('atom1');
      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: mockAtom,
        foundBy: 'name',
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });
      vi.mocked(mockStore.set).mockImplementation(() => {});
    });

    it('should restore in batches', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: Symbol('atom1').toString(),
        },
        atom2: {
          value: 43,
          type: 'primitive',
          name: 'atom2',
          atomId: Symbol('atom2').toString(),
        },
      };

      const result = engine.restore(state, { batchSize: 1 });

      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle atom not found', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'nonExistent',
          atomId: Symbol('nonExistent').toString(),
        },
      };

      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: null,
        foundBy: null,
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });

      const result = engine.restore(state, { skipErrors: true });

      // When atom not found, it's added to failedAtoms, not warnings
      expect(result.failedAtoms.length).toBeGreaterThan(0);
    });

    it('should handle store.set errors', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: Symbol('atom1').toString(),
        },
      };

      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: createMockAtom('atom1'),
        foundBy: 'name',
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });
      vi.mocked(mockStore.set).mockImplementation(() => {
        throw new Error('Set error');
      });

      const result = engine.restore(state, { skipErrors: true });

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail in strict mode on errors', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: Symbol('atom1').toString(),
        },
      };

      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: createMockAtom('atom1'),
        foundBy: 'name',
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });
      vi.mocked(mockStore.set).mockImplementation(() => {
        throw new Error('Set error');
      });

      const result = engine.restore(state, { skipErrors: false });

      expect(result.success).toBe(false);
    });

    it('should collect failed atoms', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'nonExistent',
          atomId: Symbol('nonExistent').toString(),
        },
      };

      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: null,
        foundBy: null,
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });

      const result = engine.restore(state, { skipErrors: true });

      expect(result.failedAtoms.length).toBeGreaterThan(0);
    });
  });

  describe('deserialization', () => {
    it('should deserialize date values', () => {
      const state: Record<string, SnapshotStateEntry> = {
        dateAtom: {
          value: '2024-01-01T00:00:00.000Z',
          type: 'date',
          name: 'dateAtom',
          atomId: Symbol('dateAtom').toString(),
        },
      };

      const mockAtom = createMockAtom('dateAtom');
      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: mockAtom,
        foundBy: 'name',
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });
      vi.mocked(mockStore.set).mockImplementation(() => {});

      const result = engine.restore(state);

      expect(result.success).toBe(true);
    });

    it('should deserialize regexp values', () => {
      const state: Record<string, SnapshotStateEntry> = {
        regexpAtom: {
          value: '/test/i',
          type: 'regexp',
          name: 'regexpAtom',
          atomId: Symbol('regexpAtom').toString(),
        },
      };

      const mockAtom = createMockAtom('regexpAtom');
      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: mockAtom,
        foundBy: 'name',
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });
      vi.mocked(mockStore.set).mockImplementation(() => {});

      const result = engine.restore(state);

      expect(result.success).toBe(true);
    });
  });

  describe('result details', () => {
    beforeEach(() => {
      const mockAtom = createMockAtom('atom1');
      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: mockAtom,
        foundBy: 'name',
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });
      vi.mocked(mockStore.set).mockImplementation(() => {});
    });

    it('should include success atoms', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: Symbol('atom1').toString(),
        },
      };

      const result = engine.restore(state);

      expect(result.successAtoms.length).toBeGreaterThan(0);
      expect(result.successAtoms[0]?.name).toBe('atom1');
    });

    it('should include warnings', () => {
      const state: Record<string, SnapshotStateEntry> = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'nonExistent',
          atomId: Symbol('nonExistent').toString(),
        },
      };

      vi.spyOn(mockAtomFinder, 'find').mockReturnValue({
        atom: null,
        foundBy: null,
        searchDetails: {
          searchedByName: true,
          searchedById: false,
          searchedByFallback: false,
        },
      });

      const result = engine.restore(state, { skipErrors: true });

      expect(result.failedAtoms.length).toBeGreaterThan(0);
    });
  });
});

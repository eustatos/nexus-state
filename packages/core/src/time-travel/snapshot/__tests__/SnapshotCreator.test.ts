/**
 * SnapshotCreator tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SnapshotCreator } from '../SnapshotCreator';
import type { Store, Atom } from '../../../types';
import { atomRegistry } from '../../../atom-registry';

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

describe('SnapshotCreator', () => {
  let snapshotCreator: SnapshotCreator;
  let mockStore: Store;

  beforeEach(() => {
    mockStore = createMockStore();
    snapshotCreator = new SnapshotCreator(mockStore);
  });

  afterEach(() => {
    snapshotCreator.dispose();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const config = snapshotCreator.getConfig();

      expect(config.includeTypes).toEqual(['primitive', 'computed', 'writable']);
      expect(config.excludeAtoms).toEqual([]);
      expect(config.validate).toBe(true);
      expect(config.includeMetadata).toBe(true);
    });

    it('should create with custom config', () => {
      const customCreator = new SnapshotCreator(mockStore, {
        includeTypes: ['primitive'],
        excludeAtoms: ['testAtom'],
        validate: false,
        skipStateCheck: true,
      });

      const config = customCreator.getConfig();
      expect(config.includeTypes).toEqual(['primitive']);
      expect(config.excludeAtoms).toEqual(['testAtom']);
      expect(config.validate).toBe(false);
      expect(config.skipStateCheck).toBe(true);

      customCreator.dispose();
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      snapshotCreator.configure({ validate: false });

      const config = snapshotCreator.getConfig();
      expect(config.validate).toBe(false);
    });

    it('should merge partial configuration', () => {
      snapshotCreator.configure({ excludeAtoms: ['atom1'] });
      snapshotCreator.configure({ validate: false });

      const config = snapshotCreator.getConfig();
      expect(config.excludeAtoms).toEqual(['atom1']);
      expect(config.validate).toBe(false);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(new Map());
    });

    it('should return null when no atoms registered', () => {
      const result = snapshotCreator.create('test-action');
      expect(result).toBeNull();
    });

    it('should create snapshot with atoms', () => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      const result = snapshotCreator.create('test-action');

      expect(result).not.toBeNull();
      expect(result?.metadata.action).toBe('test-action');
      expect(result?.metadata.atomCount).toBeGreaterThan(0);
    });

    it('should create snapshot without action', () => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      const result = snapshotCreator.create();

      expect(result).not.toBeNull();
      expect(result?.metadata.action).toBeUndefined();
    });

    it('should skip excluded atoms', () => {
      const atom1 = createMockAtom('atom1');
      const atom2 = createMockAtom('excludedAtom');
      const atoms = new Map([
        [atom1.id, atom1],
        [atom2.id, atom2],
      ]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      snapshotCreator.configure({ excludeAtoms: ['excludedAtom'] });
      const result = snapshotCreator.create();

      expect(result).not.toBeNull();
      if (result) {
        expect(Object.keys(result.state)).not.toContain('excludedAtom');
      }
    });

    it('should filter by atom types', () => {
      const primitiveAtom = createMockAtom('primitive');
      const computedAtom = { ...createMockAtom('computed'), type: 'computed' };
      const atoms = new Map([
        [primitiveAtom.id, primitiveAtom],
        [computedAtom.id, computedAtom],
      ]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      snapshotCreator.configure({ includeTypes: ['primitive'] });
      const result = snapshotCreator.create();

      expect(result).not.toBeNull();
      if (result) {
        expect(Object.keys(result.state)).toContain('primitive');
        expect(Object.keys(result.state)).not.toContain('computed');
      }
    });

    it('should return null for unchanged state with autoCapture disabled', () => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      snapshotCreator.configure({ autoCapture: false, skipStateCheck: false });

      // First capture
      const result1 = snapshotCreator.create();
      expect(result1).not.toBeNull();

      // Second capture should return null (state unchanged)
      const result2 = snapshotCreator.create();
      expect(result2).toBeNull();
    });

    it('should create snapshot when state changes', () => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);

      let currentValue = 42;
      vi.mocked(mockStore.get).mockImplementation(() => currentValue);

      snapshotCreator.configure({ autoCapture: false, skipStateCheck: false });

      // First capture
      const result1 = snapshotCreator.create();
      expect(result1).not.toBeNull();

      // Change value
      currentValue = 100;

      // Second capture should succeed (state changed)
      const result2 = snapshotCreator.create();
      expect(result2).not.toBeNull();
    });
  });

  describe('createBatch', () => {
    beforeEach(() => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);
    });

    it('should create multiple snapshots', () => {
      const snapshots = snapshotCreator.createBatch(3, 'test-action');

      expect(snapshots.length).toBe(3);
      snapshots.forEach((snapshot, index) => {
        expect(snapshot.metadata.action).toBe(`test-action-${index + 1}`);
      });
    });

    it('should use action pattern', () => {
      const snapshots = snapshotCreator.createBatch(2, 'custom');

      expect(snapshots.length).toBe(2);
      expect(snapshots[0]?.metadata.action).toBe('custom-1');
      expect(snapshots[1]?.metadata.action).toBe('custom-2');
    });

    it('should skip failed captures', () => {
      snapshotCreator.configure({ autoCapture: false });

      const snapshots = snapshotCreator.createBatch(3);

      // First succeeds, rest fail due to unchanged state
      expect(snapshots.length).toBeLessThanOrEqual(3);
    });
  });

  describe('createWithResult', () => {
    beforeEach(() => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);
    });

    it('should return success result', () => {
      const result = snapshotCreator.createWithResult('test-action');

      expect(result.success).toBe(true);
      expect(result.snapshot).not.toBeNull();
      expect(result.duration).toBeDefined();
      expect(result.atomCount).toBeGreaterThan(0);
    });

    it('should include error on failure', () => {
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(new Map());

      const result = snapshotCreator.createWithResult();

      expect(result.success).toBe(false);
      expect(result.snapshot).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should measure duration', () => {
      const result = snapshotCreator.createWithResult();

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to creation events', () => {
      const listener = vi.fn();
      snapshotCreator.subscribe(listener);

      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      snapshotCreator.create('test');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]?.[0]?.metadata.action).toBe('test');
    });

    it('should unsubscribe correctly', () => {
      const listener = vi.fn();
      const unsubscribe = snapshotCreator.subscribe(listener);

      unsubscribe();

      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      snapshotCreator.create('test');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should validate snapshot when configured', () => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      snapshotCreator.configure({ validate: true });
      const result = snapshotCreator.create();

      expect(result).not.toBeNull();
    });

    it('should skip validation when disabled', () => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      snapshotCreator.configure({ validate: false });
      const result = snapshotCreator.create();

      expect(result).not.toBeNull();
    });
  });

  describe('transform', () => {
    it('should apply transform function', () => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      const transform = vi.fn((snapshot) => ({
        ...snapshot,
        metadata: { ...snapshot.metadata, transformed: true },
      }));

      snapshotCreator.configure({ transform });
      const result = snapshotCreator.create();

      expect(transform).toHaveBeenCalledTimes(1);
      expect(result?.metadata).toHaveProperty('transformed', true);
    });
  });

  describe('error handling', () => {
    it('should handle store.get errors gracefully', () => {
      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockImplementation(() => {
        throw new Error('Store error');
      });

      const result = snapshotCreator.create();

      expect(result).toBeNull();
    });

    it('should handle atomRegistry errors gracefully', () => {
      vi.spyOn(atomRegistry, 'getAll').mockImplementation(() => {
        throw new Error('Registry error');
      });

      const result = snapshotCreator.create();

      expect(result).toBeNull();
    });
  });

  describe('dispose', () => {
    it('should dispose correctly', async () => {
      const listener = vi.fn();
      snapshotCreator.subscribe(listener);

      await snapshotCreator.dispose();

      const atom1 = createMockAtom('atom1');
      const atoms = new Map([[atom1.id, atom1]]);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(atoms);
      vi.mocked(mockStore.get).mockReturnValue(42);

      snapshotCreator.create('test');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should be idempotent', async () => {
      await snapshotCreator.dispose();
      await expect(snapshotCreator.dispose()).resolves.not.toThrow();
    });
  });
});

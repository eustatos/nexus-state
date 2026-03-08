/**
 * StateCaptureService tests
 */

import { describe, it, expect, vi } from 'vitest';
import { StateCaptureService } from '../StateCaptureService';
import type { IAtomRegistryAdapter, ISnapshotSerializer } from '../types.interfaces';
import type { SnapshotCreatorConfig } from '../../types';
import type { Store, Atom } from '../../../../types';

function createMockStore(): Store {
  return {
    get: vi.fn(),
    set: vi.fn(),
    subscribe: vi.fn(),
    batch: vi.fn(),
  } as unknown as Store;
}

function createMockRegistry(): IAtomRegistryAdapter {
  return {
    getAll: vi.fn().mockReturnValue(new Map()),
    get: vi.fn(),
  } as unknown as IAtomRegistryAdapter;
}

function createMockSerializer(): ISnapshotSerializer {
  return {
    serialize: vi.fn((v) => v),
    deserialize: vi.fn((v) => v),
  } as unknown as ISnapshotSerializer;
}

function createMockAtom(id: symbol, name: string, type: string = 'primitive'): Atom<any> {
  return {
    id,
    name,
    type: type as any,
    read: vi.fn(),
    write: vi.fn(),
  } as unknown as Atom<any>;
}

describe('StateCaptureService', () => {
  describe('constructor', () => {
    it('should create with dependencies', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = { includeTypes: ['primitive'] };

      const service = new StateCaptureService(store, registry, serializer, config);

      expect(service).toBeDefined();
    });
  });

  describe('captureState', () => {
    it('should capture all atoms when no atomIds provided', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = { includeTypes: ['primitive'] };

      const atom = createMockAtom(Symbol('test'), 'testAtom');
      const atoms = new Map([[atom.id, atom]]);
      registry.getAll = vi.fn().mockReturnValue(atoms);
      store.get = vi.fn().mockReturnValue(42);

      const service = new StateCaptureService(store, registry, serializer, config);
      const state = service.captureState();

      expect(Object.keys(state)).toHaveLength(1);
    });

    it('should capture specific atoms when atomIds provided', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = { includeTypes: ['primitive'] };

      const atomId = Symbol('test');
      const atom = createMockAtom(atomId, 'testAtom');
      registry.get = vi.fn().mockReturnValue(atom);
      store.get = vi.fn().mockReturnValue(42);

      const service = new StateCaptureService(store, registry, serializer, config);
      const state = service.captureState(new Set([atomId]));

      expect(Object.keys(state)).toHaveLength(1);
    });

    it('should handle inaccessible atoms gracefully', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = { includeTypes: ['primitive'] };

      const atomId = Symbol('test');
      registry.get = vi.fn().mockImplementation(() => {
        throw new Error('Cannot access');
      });

      const service = new StateCaptureService(store, registry, serializer, config);
      const state = service.captureState(new Set([atomId]));

      expect(Object.keys(state)).toHaveLength(0);
    });
  });

  describe('addAtomToState', () => {
    it('should add atom to state', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = { includeTypes: ['primitive'] };

      const atom = createMockAtom(Symbol('test'), 'testAtom');
      store.get = vi.fn().mockReturnValue(42);

      const service = new StateCaptureService(store, registry, serializer, config);
      const state: Record<string, any> = {};

      service.addAtomToState(atom, state);

      expect(state.testAtom).toBeDefined();
      expect(state.testAtom.value).toBe(42);
    });

    it('should filter by atom type', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = { includeTypes: ['computed'] };

      const atom = createMockAtom(Symbol('test'), 'testAtom', 'primitive');
      store.get = vi.fn().mockReturnValue(42);

      const service = new StateCaptureService(store, registry, serializer, config);
      const state: Record<string, any> = {};

      service.addAtomToState(atom, state);

      expect(state.testAtom).toBeUndefined();
    });

    it('should filter by exclude list', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = {
        includeTypes: ['primitive'],
        excludeAtoms: ['excludedAtom'],
      };

      const atom = createMockAtom(Symbol('test'), 'excludedAtom');
      store.get = vi.fn().mockReturnValue(42);

      const service = new StateCaptureService(store, registry, serializer, config);
      const state: Record<string, any> = {};

      service.addAtomToState(atom, state);

      expect(state.excludedAtom).toBeUndefined();
    });

    it('should serialize value', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = { includeTypes: ['primitive'] };

      const atom = createMockAtom(Symbol('test'), 'testAtom');
      store.get = vi.fn().mockReturnValue({ complex: 'value' });
      serializer.serialize = vi.fn().mockReturnValue('serialized');

      const service = new StateCaptureService(store, registry, serializer, config);
      const state: Record<string, any> = {};

      service.addAtomToState(atom, state);

      expect(serializer.serialize).toHaveBeenCalledWith({ complex: 'value' });
      expect(state.testAtom.value).toBe('serialized');
    });

    it('should handle atoms without names', () => {
      const store = createMockStore();
      const registry = createMockRegistry();
      const serializer = createMockSerializer();
      const config: SnapshotCreatorConfig = { includeTypes: ['primitive'] };

      const atom = createMockAtom(Symbol('test'), '', 'primitive');
      store.get = vi.fn().mockReturnValue(42);

      const service = new StateCaptureService(store, registry, serializer, config);
      const state: Record<string, any> = {};

      service.addAtomToState(atom, state);

      const keys = Object.keys(state);
      expect(keys.length).toBe(1);
    });
  });
});

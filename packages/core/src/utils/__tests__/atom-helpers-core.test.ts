import { describe, it, expect, vi } from 'vitest';
import {
  getOrCreateAtomState,
  getAtomInitialValue,
  registerAtomWithStore,
} from '../atom-helpers';
import { createMockAtom } from '../../test-utils/index';

describe('getAtomInitialValue', () => {
  it('should get value from primitive atom', () => {
    const atom = createMockAtom('primitive', 42);
    const get = vi.fn();
    const setCurrentAtom = vi.fn();

    const value = getAtomInitialValue(atom, get, null, setCurrentAtom);

    expect(value).toBe(42);
    expect(get).not.toHaveBeenCalled();
  });

  it('should get value from computed atom', () => {
    const depAtom = createMockAtom('dep', 10);
    const computedAtom: any = {
      id: Symbol('computed'),
      name: 'computed',
      type: 'computed',
      read: vi.fn((get) => get(depAtom) * 2),
    };
    const get = vi.fn((a) => (a.id === depAtom.id ? 10 : 0));
    const setCurrentAtom = vi.fn();

    const value = getAtomInitialValue(
      computedAtom,
      get,
      null,
      setCurrentAtom
    );

    expect(value).toBe(20);
    expect(get).toHaveBeenCalledWith(depAtom);
  });

  it('should get value from writable atom', () => {
    const depAtom = createMockAtom('dep', 5);
    const writableAtom: any = {
      id: Symbol('writable'),
      name: 'writable',
      type: 'writable',
      read: vi.fn((get) => get(depAtom) + 5),
      write: vi.fn(),
    };
    const get = vi.fn((a) => (a.id === depAtom.id ? 5 : 0));
    const setCurrentAtom = vi.fn();

    const value = getAtomInitialValue(
      writableAtom,
      get,
      null,
      setCurrentAtom
    );

    expect(value).toBe(10);
  });

  it('should restore previous atom after error', () => {
    const atom: any = {
      id: Symbol('error'),
      name: 'error',
      type: 'computed',
      read: vi.fn(() => {
        throw new Error('Test error');
      }),
    };
    const get = vi.fn();
    const setCurrentAtom = vi.fn();
    const previousAtom = createMockAtom('previous');

    expect(() =>
      getAtomInitialValue(atom, get, previousAtom, setCurrentAtom)
    ).toThrow('Test error');

    expect(setCurrentAtom).toHaveBeenCalledWith(previousAtom);
  });

  it('should throw for unknown atom type', () => {
    const atom: any = {
      id: Symbol('unknown'),
      name: 'unknown',
      type: 'unknown',
    };
    const get = vi.fn();
    const setCurrentAtom = vi.fn();

    expect(() =>
      getAtomInitialValue(atom, get, null, setCurrentAtom)
    ).toThrow('Unknown atom type');
  });
});

describe('getOrCreateAtomState', () => {
  it('should create new state for unknown atom', () => {
    const atom = createMockAtom('test', 42);
    const atomStates = new Map();
    const get = vi.fn();
    const setCurrentAtom = vi.fn();

    const { state, created } = getOrCreateAtomState(
      atom,
      atomStates,
      get,
      null,
      setCurrentAtom
    );

    expect(created).toBe(true);
    expect(state.value).toBe(42);
    expect(state.subscribers).toBeInstanceOf(Set);
    expect(state.dependents).toBeInstanceOf(Set);
  });

  it('should return existing state', () => {
    const atom = createMockAtom('test', 42);
    const existingState = {
      value: 100,
      subscribers: new Set(),
      dependents: new Set(),
    };
    const atomStates = new Map([[atom, existingState]]);
    const get = vi.fn();
    const setCurrentAtom = vi.fn();

    const { state, created } = getOrCreateAtomState(
      atom,
      atomStates,
      get,
      null,
      setCurrentAtom
    );

    expect(created).toBe(false);
    expect(state).toBe(existingState);
    expect(get).not.toHaveBeenCalled();
  });

  it('should use get function for computed atoms', () => {
    const depAtom = createMockAtom('dep', 10);
    const computedAtom: any = {
      id: Symbol('computed'),
      name: 'computed',
      type: 'computed',
      read: vi.fn((get) => get(depAtom) * 3),
    };
    const atomStates = new Map();
    const get = vi.fn((a) => (a.id === depAtom.id ? 10 : 0));
    const setCurrentAtom = vi.fn();

    const { state } = getOrCreateAtomState(
      computedAtom,
      atomStates,
      get,
      null,
      setCurrentAtom
    );

    expect(state.value).toBe(30);
  });
});

describe('registerAtomWithStore', () => {
  it('should register atom with store', () => {
    const atom = createMockAtom('test');
    const store = {};
    const atomsSet = new Set<symbol>();
    const storesMap = new Map([[store, { atoms: atomsSet }]]);
    const atomRegistry = {
      getStoresMap: vi.fn(() => storesMap),
    };

    registerAtomWithStore(atom, store, atomRegistry);

    expect(atomsSet.has(atom.id)).toBe(true);
  });

  it('should not register duplicate atom', () => {
    const atom = createMockAtom('test');
    const atomsSet = new Set<symbol>([atom.id]);
    const storesMap = new Map([[{}, { atoms: atomsSet }]]);
    const atomRegistry = {
      getStoresMap: vi.fn(() => storesMap),
    };

    const store = storesMap.keys().next().value;
    registerAtomWithStore(atom, store, atomRegistry);

    expect(atomsSet.size).toBe(1);
  });

  it('should handle missing store registry', () => {
    const atom = createMockAtom('test');
    const storesMap = new Map();
    const atomRegistry = {
      getStoresMap: vi.fn(() => storesMap),
    };

    expect(() =>
      registerAtomWithStore(atom, {}, atomRegistry)
    ).not.toThrow();
  });
});

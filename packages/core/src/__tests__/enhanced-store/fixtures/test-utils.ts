/**
 * Fixtures for EnhancedStore tests
 */

import type { Plugin, Store } from '../../../types';

/**
 * Creates a mock store for tests
 */
export function createMockStore(): Store & Record<string, any> {
  const atoms = new Map();

  return {
    get: vi.fn((atom) => {
      return atoms.get(atom.id);
    }),
    set: vi.fn((atom, update) => {
      const value = typeof update === 'function' ? update(atoms.get(atom.id)) : update;
      atoms.set(atom.id, value);
    }),
    subscribe: vi.fn(() => () => {}),
    getState: vi.fn(() => {
      const state: Record<string, any> = {};
      atoms.forEach((value, key) => {
        state[key.toString()] = value;
      });
      return state;
    }),
    applyPlugin: vi.fn(),
    getPlugins: vi.fn(() => []),
    _atoms: atoms, // For internal access in tests
  };
}

/**
 * Creates a test plugin with hooks
 */
export function createPluginWithHooks(hooks: Record<string, any> = {}): Plugin {
  return () => ({
    onSet: hooks.onSet,
    afterSet: hooks.afterSet,
    onGet: hooks.onGet,
  });
}

/**
 * Creates a simple function plugin
 */
export function createSimplePlugin(fn: (store: Store) => void = () => {}): Plugin {
  return fn;
}

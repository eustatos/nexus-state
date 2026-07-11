/**
 * @nexus-state/core — Minimal Core
 *
 * Tree-shakeable exports: only `atom()` and `createStore()` are included here.
 * Optional capabilities are available via subpath exports:
 *
 * - `@nexus-state/core/batching` — batch(), Batcher
 * - `@nexus-state/core/debug` — DebugLogger, loggers
 * - `@nexus-state/core/devtools` — devtools plugin
 * - `@nexus-state/core/reactive` — BaseReactive, createReactiveValue
 * - `@nexus-state/core/utils` — serialization, ActionTracker
 */

// ─── Core API (always included) ──────────────────────────────────────────────

/**
 * Creates an atom with an initial value or a computed atom based on other atoms.
 * Atoms are lazily registered in each store's ScopedRegistry on first access (get/set/subscribe).
 * You can provide an optional name for better debugging experience.
 * @param initialValue - The initial value or a function to compute the value
 * @param name - Optional name for the atom for DevTools display
 * @returns The created atom
 * @example
 * ```typescript
 * const countAtom = atom(0);
 * const doubleCountAtom = atom((get) => get(countAtom) * 2);
 * ```
 */
export { atom } from './atom';

/**
 * Creates a store to hold atoms.
 * Accepts either a plugins array (legacy API) or a StoreOptions object (new API).
 * Optional subsystems (plugins, devtools, batching) are only created when needed.
 * @param pluginsOrOptions - Array of plugins (legacy) OR StoreOptions (new)
 * @returns A new store instance
 * @example
 * ```typescript
 * const store = createStore();
 * const store = createStore({ plugins: [plugin1], devtools: true });
 * ```
 */
export { createStore, createEnhancedStore } from './store';
export type { StoreEnhancementOptions, StoreOptions, DevToolsConfig } from './store';

// ─── Types (always included, zero runtime cost) ──────────────────────────────

export type {
  Atom,
  BaseAtom,
  PrimitiveAtom,
  ComputedAtom,
  WritableAtom,
  Store,
  Plugin,
  PluginHooks,
  ActionMetadata,
  AtomValue,
  AnyAtom,
  Getter,
  Setter,
  Subscriber,
  AtomMetadata,
  EnhancedStore,
} from './types';

export { isPrimitiveAtom, isComputedAtom, isWritableAtom } from './types';

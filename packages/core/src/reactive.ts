/**
 * Reactive abstractions — optional, tree-shakeable
 *
 * Import from '@nexus-state/core/reactive' to include reactive values in your bundle.
 * Not included in the minimal core import.
 *
 * @example
 * ```typescript
 * import { createStore } from '@nexus-state/core';
 * import { createReactiveValue, BaseReactive } from '@nexus-state/core/reactive';
 *
 * const store = createStore();
 * const myAtom = atom(0, 'count');
 * const reactive = createReactiveValue(store, myAtom);
 * ```
 *
 * @packageDocumentation
 */

export type {
  IReactiveValue,
  AtomContext,
  Unsubscribe,
} from './reactive/types';
export { BaseReactive } from './reactive/BaseReactive';
export { StoreBasedReactive } from './reactive/StoreBasedReactive';
export { createReactiveValue } from './reactive/factory';

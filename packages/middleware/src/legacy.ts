/**
 * @file Legacy middleware implementation
 * @deprecated Use createMiddlewarePlugin from '../index' instead
 * 
 * This file contains the old implementation that wraps store.set method.
 * It is kept for backward compatibility but will be removed in the next major version.
 */

import { Atom, Store } from '@nexus-state/core';

/**
 * @deprecated Use MiddlewareConfig from '../index' instead
 */
export type LegacyMiddlewareConfig<T> = {
  beforeSet?: (atom: Atom<T>, newValue: T) => T | void;
  afterSet?: (atom: Atom<T>, newValue: T) => void;
};

/**
 * @deprecated Use createMiddlewarePlugin from '../index' instead
 * 
 * Legacy middleware function that wraps store.set method.
 * This approach has been replaced by the plugin hooks API.
 */
export function legacyMiddleware<T>(
  atom: Atom<T>,
  config: LegacyMiddlewareConfig<T>
): (store: Store) => void {
  return (store: Store) => {
    const { beforeSet, afterSet } = config;
    const originalSet = store.set.bind(store);

    store.set = <Value>(a: Atom<Value>, update: Value | ((prev: Value) => Value)) => {
      if (a.id === (atom as unknown as Atom<Value>).id) {
        let processedValue: Value;

        if (typeof update === 'function') {
          const currentValue = store.get(a);
          processedValue = (update as (prev: Value) => Value)(currentValue);
        } else {
          processedValue = update;
        }

        if (beforeSet) {
          const result = beforeSet(atom, processedValue as unknown as T);
          if (result !== undefined) {
            processedValue = result as unknown as Value;
          }
        }

        originalSet(a, processedValue);

        if (afterSet) {
          afterSet(atom, processedValue as unknown as T);
        }
      } else {
        originalSet(a, update);
      }
    };
  };
}

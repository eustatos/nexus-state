/**
 * Reactive abstractions for Nexus State
 *
 * This module provides the core interfaces and base classes for reactive
 * state management backed by Nexus Store.
 *
 * @packageDocumentation
 */

export type { IReactiveValue, AtomContext, Unsubscribe } from './types';
export { BaseReactive } from './BaseReactive';
export { StoreBasedReactive } from './StoreBasedReactive';
export { createReactiveValue } from './factory';

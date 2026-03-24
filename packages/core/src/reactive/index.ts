/**
 * Reactive abstractions for Nexus State
 *
 * This module provides the core interfaces and base classes for reactive
 * state management. It enables switching between different backends
 * (Store-based, Signal-based) without breaking changes.
 *
 * @packageDocumentation
 */

export type { IReactiveValue, AtomContext, Unsubscribe } from './types';
export { BaseReactive } from './BaseReactive';
export { StoreBasedReactive } from './StoreBasedReactive';
export { SignalBasedReactive, NotImplementedError } from './SignalBasedReactive';
export { createReactiveValue } from './factory';
export {
  REACTIVE_CONFIG,
  updateReactiveConfig,
  resetReactiveConfig,
  getReactiveConfig,
  loadConfigFromEnv,
  type ReactiveConfig,
} from './config';

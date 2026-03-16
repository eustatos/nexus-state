/**
 * Shared utilities for Nexus State core
 */

export {
  getOrCreateAtomState,
  getAtomInitialValue,
  registerAtomWithStore,
  isFunction,
  isObject,
  createId,
  safeGet,
  type AtomState,
} from './atom-helpers';

export {
  serializeState,
  SerializationUtils,
  type SerializationOptions,
} from './serialization';

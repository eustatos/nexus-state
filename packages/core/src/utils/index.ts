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

export {
  snapshotSerialization,
  serializeSnapshot,
  deserializeSnapshot,
  isSerializable,
  createSnapshotSerializer,
  createSnapshotDeserializer,
  roundTripSnapshot,
  snapshotsEqual,
  type SerializableInput,
  type SerializedValue,
  type DeserializationOptions,
} from './snapshot-serialization';

export {
  AdvancedSerializer,
  type SerializationStrategy,
  type SerializationContext,
  type DeserializationContext,
} from './snapshot-serialization/advanced';

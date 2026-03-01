// packages/core/utils/snapshot-serialization/index.ts
export { snapshotSerialization, serializeSnapshot } from "./serialize";
export { deserializeSnapshot } from "./deserialize";
export {
  isSerializable,
  createSnapshotSerializer,
  createSnapshotDeserializer,
  roundTripSnapshot,
  snapshotsEqual,
} from "./utils";

export type {
  SerializableInput,
  SerializedValue,
  SerializationOptions,
  DeserializationOptions,
  Constructor,
} from "./types";

// Export advanced serialization system
export { AdvancedSerializer } from "./advanced";
export type {
  SerializationStrategy,
  SerializationContext,
  DeserializationContext,
  SerializationOptions as AdvancedSerializationOptions,
  SerializedValue as AdvancedSerializedValue,
} from "./advanced";

// packages/core/utils/snapshot-serialization/constants.ts
import { SerializationOptions, DeserializationOptions } from "./types";

export const DEFAULT_SERIALIZE_OPTIONS: Required<SerializationOptions> = {
  maxDepth: 50,
  skipKeys: [],
  customTransformers: new Map(),
  preserveType: true,
  escapePrefix: "__esc_",
};

export const DEFAULT_DESERIALIZE_OPTIONS: Required<DeserializationOptions> = {
  allowedConstructors: ["Object", "Array"],
  restoreSpecialTypes: true,
  customRevivers: new Map(),
};

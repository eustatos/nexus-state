// packages/core/utils/snapshot-serialization/utils.ts
import {
  SerializableInput,
  SerializedValue,
  SerializationOptions,
  DeserializationOptions,
} from "./types";
import { snapshotSerialization } from "./serialize";
import { deserializeSnapshot } from "./deserialize";
import { DEFAULT_SERIALIZE_OPTIONS } from "./constants";

/**
 * Deep equality check for serialized values
 * Handles special types like Date, RegExp, Map, Set, BigInt, etc.
 */
function deepEqualSerialized(a: unknown, b: unknown): boolean {
  // Strict equality for primitives and same references
  if (a === b) return true;
  
  // Handle NaN separately (NaN !== NaN)
  if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
    return true;
  }

  // Handle Infinity
  if (typeof a === 'number' && typeof b === 'number') {
    if (a === Infinity && b === Infinity) return true;
    if (a === -Infinity && b === -Infinity) return true;
    if (a === Infinity && b === -Infinity) return false;
    if (a === -Infinity && b === Infinity) return false;
  }

  // Handle null/undefined explicitly
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a instanceof Date || b instanceof Date) {
    return false;
  }

  // RegExp comparison
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }
  if (a instanceof RegExp || b instanceof RegExp) {
    return false;
  }

  // Map comparison
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
      if (!b.has(k)) return false;
      if (!deepEqualSerialized(v, b.get(k))) return false;
    }
    return true;
  }
  if (a instanceof Map || b instanceof Map) {
    return false;
  }

  // Set comparison
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    const bValues = [...b];
    for (const v of a) {
      if (!bValues.some((bv) => deepEqualSerialized(v, bv))) return false;
    }
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    return false;
  }

  // BigInt comparison
  if (typeof a === "bigint" && typeof b === "bigint") {
    return a === b;
  }
  if (typeof a === "bigint" || typeof b === "bigint") {
    return false;
  }

  // Error comparison
  if (a instanceof Error && b instanceof Error) {
    return a.name === b.name && a.message === b.message;
  }
  if (a instanceof Error || b instanceof Error) {
    return false;
  }

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqualSerialized(val, b[i]));
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // Object comparison
  if (typeof a === "object" && typeof b === "object" && a && b) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqualSerialized((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  // Fallback to strict equality
  return a === b;
}

export function isSerializable(
  value: SerializableInput,
  options: SerializationOptions = {},
  depth: number = 0,
  seen = new WeakSet<object>(),
): boolean {
  const opts = { ...DEFAULT_SERIALIZE_OPTIONS, ...options };
  
  // Primitives are always serializable regardless of depth
  if (value === null || value === undefined) return true;
  if (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  )
    return true;
  if (typeof value === "bigint") return true;
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Error
  )
    return true;
  
  // Check depth for containers that have children
  if (depth > opts.maxDepth) return false;
  
  if (value instanceof Map || value instanceof Set) {
    const items =
      value instanceof Map ? [...value.entries()].flat() : [...value.values()];
    return items.every((item) =>
      isSerializable(item as SerializableInput, opts, depth + 1, seen),
    );
  }
  if (typeof value === "function") return true;

  if (typeof value === "object") {
    if (seen.has(value)) return true;
    seen.add(value);
    try {
      if (Array.isArray(value)) {
        const result = value.every((item) =>
          isSerializable(item as SerializableInput, opts, depth + 1, seen),
        );
        seen.delete(value);
        return result;
      }
      const keys = Object.keys(value);
      for (const key of keys) {
        if (opts.skipKeys?.includes(key)) continue;
        const val = (value as Record<string, SerializableInput>)[key];
        if (!isSerializable(val, opts, depth + 1, seen)) {
          seen.delete(value);
          return false;
        }
      }
      seen.delete(value);
      return true;
    } catch {
      seen.delete(value);
      return false;
    }
  }
  return false;
}

export function createSnapshotSerializer(options: SerializationOptions = {}) {
  return (obj: SerializableInput) => snapshotSerialization(obj, options);
}

export function createSnapshotDeserializer(
  options: DeserializationOptions = {},
) {
  return (data: SerializedValue) => deserializeSnapshot(data, options);
}

export function roundTripSnapshot<T = unknown>(
  obj: SerializableInput,
  serializeOptions: SerializationOptions = {},
  deserializeOptions: DeserializationOptions = {},
): T {
  const serialized = snapshotSerialization(obj, serializeOptions);
  return deserializeSnapshot(serialized, deserializeOptions) as T;
}

export function snapshotsEqual(
  a: any,
  b: any,
  options: SerializationOptions = {},
): boolean {
  const serializedA = snapshotSerialization(a, options);
  const serializedB = snapshotSerialization(b, options);
  return deepEqualSerialized(serializedA, serializedB);
}

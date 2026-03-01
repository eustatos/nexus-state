// packages/core/utils/snapshot-serialization/serialize.ts
import {
  SerializableInput,
  SerializedValue,
  SerializationContext,
  SerializationOptions,
  Constructor,
} from "./types";
import { DEFAULT_SERIALIZE_OPTIONS } from "./constants";

export function snapshotSerialization(
  obj: SerializableInput,
  options: SerializationOptions = {},
  context?: SerializationContext,
  depth: number = 0,
  path: string = "root",
): SerializedValue {
  const opts = { ...DEFAULT_SERIALIZE_OPTIONS, ...options };

  const ctx = context || {
    references: new Map(),
    serialized: new Map(),
    circularRefs: new Set(),
    nextId: 0,
    options: opts,
  };

  // Check depth for non-primitive types
  // Special case: maxDepth of 0 means allow root + direct children
  if (opts.maxDepth > 0 && depth > opts.maxDepth) {
    return {
      __type: "MaxDepthExceeded",
      __message: `Max depth ${opts.maxDepth} reached at path: ${path}`,
    };
  }

  // Primitives are always returned directly, regardless of depth
  if (obj === null || obj === undefined) return obj;
  if (
    typeof obj === "boolean" ||
    typeof obj === "number" ||
    typeof obj === "string"
  )
    return obj;
  if (typeof obj === "bigint")
    return { __type: "BigInt", value: obj.toString() };

  // Custom transformers
  if (obj.constructor) {
    const constructor = obj.constructor as Constructor;
    if (opts.customTransformers.has(constructor)) {
      const transformer = opts.customTransformers.get(constructor);
      if (transformer) return transformer(obj, ctx);
    }
  }

  // Special Types (Date, RegExp, etc.)
  if (obj instanceof Date) {
    try {
      const isoString = obj.toISOString();
      return { __type: "Date", value: isoString };
    } catch {
      // Invalid Date - return a marker with the string representation
      return {
        __type: "Date",
        value: obj.toString(),
      };
    }
  }
  if (obj instanceof RegExp)
    return { __type: "RegExp", source: obj.source, flags: obj.flags };
  if (obj instanceof Map) {
    const entries: [SerializedValue, SerializedValue][] = [];
    for (const [k, v] of obj.entries()) {
      entries.push([
        snapshotSerialization(k, opts, ctx, depth + 1, `${path}.map_key`),
        snapshotSerialization(v, opts, ctx, depth + 1, `${path}.map_value`),
      ]);
    }
    return { __type: "Map", entries };
  }
  if (obj instanceof Set) {
    const values: SerializedValue[] = [];
    for (const v of obj.values()) {
      values.push(
        snapshotSerialization(v, opts, ctx, depth + 1, `${path}.set_value`),
      );
    }
    return { __type: "Set", values };
  }
  if (obj instanceof Error) {
    return {
      __type: "Error",
      name: obj.name,
      message: obj.message,
      stack: opts.maxDepth > 0 ? obj.stack : undefined,
    };
  }
  if (typeof obj === "function") {
    return {
      __type: "Function",
      name: obj.name || "anonymous",
      source: obj.toString(),
    };
  }

  // Arrays (check for circular references first)
  if (Array.isArray(obj)) {
    // Check for circular references (self-reference)
    if (ctx.references.has(obj)) {
      const ref = ctx.references.get(obj)!;
      ctx.circularRefs.add(ref.id);
      return { __ref: ref.id };
    }

    // Register the array for circular reference tracking
    const refId = `arr_${ctx.nextId++}`;
    const typeName = "Array";

    ctx.references.set(obj, {
      id: refId,
      type: typeName,
      path,
      createdAt: Date.now(),
    });

    // Serialize array elements
    const result: SerializedValue[] = [];
    for (let index = 0; index < obj.length; index++) {
      const element = snapshotSerialization(
        obj[index],
        opts,
        ctx,
        depth + 1,
        `${path}[${index}]`,
      );
      result[index] = element;
    }
    
    return result;
  }

  // Objects
  if (typeof obj === "object" && obj !== null) {
    if (ctx.references.has(obj)) {
      const ref = ctx.references.get(obj)!;
      ctx.circularRefs.add(ref.id);
      return { __ref: ref.id };
    }

    const refId = `obj_${ctx.nextId++}`;
    const constructor = obj.constructor as Constructor | undefined;
    const typeName = opts.preserveType
      ? (constructor?.name || "Object") as string
      : "Object";

    ctx.references.set(obj, {
      id: refId,
      type: typeName,
      path,
      createdAt: Date.now(),
    });

    const result: Record<string, SerializedValue> = {
      __id: refId,
      __type: typeName,
    };

    for (const key of Object.keys(obj)) {
      if (opts.skipKeys.includes(key)) continue;
      const safeKey = key.startsWith("__") ? `${opts.escapePrefix}${key}` : key;
      
      try {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        // Check if this is an accessor (getter/setter)
        if (descriptor && (descriptor.get || descriptor.set)) {
          // Accessor property - might throw
          try {
            const value = (obj as Record<string, unknown>)[key];
            result[safeKey] = snapshotSerialization(
              value as SerializableInput,
              opts,
              ctx,
              depth + 1,
              `${path}.${key}`,
            );
          } catch (err) {
            // Store error info without re-accessing the getter
            result[safeKey] = {
              __error: "Serialization failed - getter threw error",
              __originalType: "unknown",
              __value: "Error: getter threw error",
            };
          }
        } else {
          // Regular data property
          const value = (obj as Record<string, unknown>)[key];
          result[safeKey] = snapshotSerialization(
            value as SerializableInput,
            opts,
            ctx,
            depth + 1,
            `${path}.${key}`,
          );
        }
      } catch (err) {
        result[safeKey] = {
          __error: "Serialization failed",
          __originalType: typeof (obj as Record<string, unknown>)[key],
          __value: String((obj as Record<string, unknown>)[key]),
        };
      }
    }
    return result;
  }

  return {
    __error: "Unknown type",
    __originalType: typeof obj,
    __value: String(obj),
  };
}

export { snapshotSerialization as serializeSnapshot };

// packages/core/utils/snapshot-serialization/deserialize.ts
import {
  SerializedValue,
  DeserializationContext,
  DeserializationOptions,
} from "./types";
import {
  DEFAULT_DESERIALIZE_OPTIONS,
  DEFAULT_SERIALIZE_OPTIONS,
} from "./constants";

export function deserializeSnapshot(
  data: SerializedValue,
  options: DeserializationOptions = {},
  context?: DeserializationContext,
): unknown {
  const opts = { ...DEFAULT_DESERIALIZE_OPTIONS, ...options };
  const ctx = context || { registry: new Map(), options: opts };

  if (data === null || data === undefined) return data;
  if (
    typeof data === "boolean" ||
    typeof data === "number" ||
    typeof data === "string"
  )
    return data;

  if (typeof data === "object") {
    const obj = data as Record<string, SerializedValue>;

    // Handle plain arrays first (before other object types)
    // This handles plain arrays passed directly to deserializeSnapshot
    if (Array.isArray(obj) && !obj.__id && !obj.__type) {
      const result: unknown[] = [];
      for (const key of Object.keys(obj)) {
        const index = parseInt(key, 10);
        if (!isNaN(index)) {
          result[index] = deserializeSnapshot(obj[key], opts, ctx);
        }
      }
      return result;
    }

    // Check for circular reference marker first (before special types)
    if ("__ref" in obj && typeof obj.__ref === "string") {
      const refId = obj.__ref;
      if (ctx.registry.has(refId)) return ctx.registry.get(refId);
      const placeholder: Record<string, unknown> = {};
      ctx.registry.set(refId, placeholder);
      return placeholder;
    }

    // Special Types
    if (opts.restoreSpecialTypes && "__type" in obj) {
      // Check custom revivers first
      if (opts.customRevivers.has(String(obj.__type))) {
        return opts.customRevivers.get(String(obj.__type))!(obj, ctx);
      }
      
      switch (obj.__type) {
        case "Date": {
          if (!("value" in obj) || typeof obj.value !== "string") {
            return undefined;
          }
          return new Date(obj.value);
        }
        case "RegExp": {
          if (!("source" in obj) || typeof obj.source !== "string") {
            return undefined;
          }
          const source = obj.source;
          const flags = "flags" in obj ? String(obj.flags) : "";
          return new RegExp(source, flags);
        }
        case "Map": {
          if ("entries" in obj && Array.isArray(obj.entries)) {
            const map = new Map<unknown, unknown>();
            for (const entry of obj.entries as [SerializedValue, SerializedValue][]) {
              const k = deserializeSnapshot(entry[0], opts, ctx);
              const v = deserializeSnapshot(entry[1], opts, ctx);
              map.set(k, v);
            }
            return map;
          }
          return undefined;
        }
        case "Set": {
          if ("values" in obj && Array.isArray(obj.values)) {
            const set = new Set<unknown>();
            for (const v of obj.values as SerializedValue[])
              set.add(deserializeSnapshot(v, opts, ctx));
            return set;
          }
          return undefined;
        }
        case "BigInt": {
          if (!("value" in obj) || typeof obj.value !== "string") {
            return undefined;
          }
          return BigInt(obj.value);
        }
        case "Error": {
          if ("message" in obj && "name" in obj) {
            const name = obj.name as string;
            const message = obj.message as string | undefined;
            const Ctor = ((globalThis as Record<string, unknown>)[name] || Error) as new (message?: string) => Error;
            const err = new Ctor(message);
            if ("stack" in obj) err.stack = obj.stack as string | undefined;
            return err;
          }
          return undefined;
        }
        case "Function":
          return null;
        case "MaxDepthExceeded":
          return { __maxDepthExceeded: obj.__message };
        case "Array": {
          // Check if this is a circular reference marker
          if (ctx.registry.has(obj.__id)) {
            return ctx.registry.get(obj.__id);
          }
          
          const objId = obj.__id;
          let result: unknown[];
          
          if (objId) {
            // Array with __id (for circular references)
            result = [];
            ctx.registry.set(objId, result);
            
            if ("elements" in obj && Array.isArray(obj.elements)) {
              // New format with 'elements' property
              for (let i = 0; i < obj.elements.length; i++) {
                result[i] = deserializeSnapshot(obj.elements[i], opts, ctx);
              }
            } else {
              // Fallback: populate from numeric keys
              for (const key of Object.keys(obj)) {
                const index = parseInt(key, 10);
                if (!isNaN(index) && key !== "__id" && key !== "__type") {
                  result[index] = deserializeSnapshot(obj[key], opts, ctx);
                }
              }
            }
          } else {
            // Plain array without __id (backward compatible)
            result = [];
            for (const key of Object.keys(obj)) {
              const index = parseInt(key, 10);
              if (!isNaN(index)) {
                result[index] = deserializeSnapshot(obj[key], opts, ctx);
              }
            }
          }
          
          return result;
        }
      }
    } else if (opts.customRevivers.has(String(obj.__type))) {
      // Even if restoreSpecialTypes is false, apply custom revivers
      return opts.customRevivers.get(String(obj.__type))!(obj, ctx);
    }

    // Regular Objects with ID
    if ("__id" in obj && typeof obj.__id === "string") {
      const objId = obj.__id;
      if (ctx.registry.has(objId)) {
        const existing = ctx.registry.get(objId);
        if (existing && typeof existing === "object" && !Array.isArray(existing)) {
          // Update existing placeholder with properties
          const result = existing as Record<string, unknown>;
          const escapePrefix = DEFAULT_SERIALIZE_OPTIONS.escapePrefix;
          for (const [key, value] of Object.entries(obj)) {
            if (key === "__id" || key === "__type") continue;
            const originalKey = key.startsWith(escapePrefix)
              ? key.slice(escapePrefix.length)
              : key;
            result[originalKey] = deserializeSnapshot(value, opts, ctx);
          }
          return result;
        }
        return existing;
      }

      let result: Record<string, unknown> = {};
      const typeName = obj.__type as string;
      if (
        opts.allowedConstructors.includes(typeName) &&
        typeName !== "Object"
      ) {
        const Ctor = (globalThis as Record<string, unknown>)[typeName];
        if (typeof Ctor === "function" && Ctor.prototype) {
          result = Object.create(Ctor.prototype);
        }
      }

      ctx.registry.set(objId, result);
      const escapePrefix = DEFAULT_SERIALIZE_OPTIONS.escapePrefix;

      for (const [key, value] of Object.entries(obj)) {
        if (key === "__id" || key === "__type") continue;
        const originalKey = key.startsWith(escapePrefix)
          ? key.slice(escapePrefix.length)
          : key;
        result[originalKey] = deserializeSnapshot(value, opts, ctx);
      }
      return result;
    }

    // Plain Objects
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializeSnapshot(value, opts, ctx);
    }
    return result;
  }

  return data;
}

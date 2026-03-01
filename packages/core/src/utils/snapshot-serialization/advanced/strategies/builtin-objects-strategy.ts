// Built-in Objects Serialization Strategy
import {
  SerializationStrategy,
  SerializationContext,
  SerializedValue,
} from "../types";

/**
 * Strategy for handling built-in object types
 */
export class BuiltInObjectsStrategy implements SerializationStrategy {
  canHandle(value: unknown): boolean {
    return (
      value instanceof Date ||
      value instanceof RegExp ||
      value instanceof Error ||
      value instanceof Map ||
      value instanceof Set ||
      value instanceof WeakMap ||
      value instanceof WeakSet ||
      (value instanceof Promise && typeof value === "object")
    );
  }

  serialize(value: unknown, context: SerializationContext): SerializedValue {
    const refId = context.seen.get(value as object);

    if (value instanceof Date) {
      try {
        return {
          __serializedType: "date",
          __refId: refId,
          value: value.toISOString(),
        };
      } catch {
        return {
          __serializedType: "date",
          __refId: refId,
          value: value.toString(),
        };
      }
    }

    if (value instanceof RegExp) {
      return {
        __serializedType: "regexp",
        __refId: refId,
        source: value.source,
        flags: value.flags,
      };
    }

    if (value instanceof Error) {
      return {
        __serializedType: "error",
        __refId: refId,
        name: value.name,
        message: value.message,
        stack: context.options.maxDepth > 0 ? value.stack : undefined,
      };
    }

    if (value instanceof Map) {
      const entries: [SerializedValue, SerializedValue][] = [];
      for (const [k, v] of value.entries()) {
        entries.push([
          this.serializeWithContext(k, context),
          this.serializeWithContext(v, context),
        ]);
      }
      return {
        __serializedType: "map",
        __refId: refId,
        entries,
        size: value.size,
      };
    }

    if (value instanceof Set) {
      const values: SerializedValue[] = [];
      for (const v of value.values()) {
        values.push(this.serializeWithContext(v, context));
      }
      return {
        __serializedType: "set",
        __refId: refId,
        values,
        size: value.size,
      };
    }

    if (value instanceof WeakMap) {
      return {
        __serializedType: "weakmap",
        __refId: refId,
        entries: [],
      };
    }

    if (value instanceof WeakSet) {
      return {
        __serializedType: "weakset",
        __refId: refId,
        values: [],
      };
    }

    if (value instanceof Promise) {
      return {
        __serializedType: "promise",
        __refId: refId,
        status: "pending" as const,
      };
    }

    return {
      __serializedType: "object",
      __refId: refId,
      __className: (value as object).constructor?.name || "Object",
    };
  }

  private serializeWithContext(
    value: unknown,
    _context: SerializationContext,
  ): SerializedValue {
    // Find appropriate strategy
    if (value === null || value === undefined) {
      return value as any;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value as any;
    }
    if (typeof value === "bigint") {
      return {
        __serializedType: "bigint",
        value: value.toString(),
      };
    }
    if (typeof value === "symbol") {
      return {
        __serializedType: "symbol",
        description: value.description as string | undefined,
      };
    }
    return JSON.parse(JSON.stringify(value));
  }

  deserialize?(serialized: SerializedValue, context?: { refs?: Map<string, unknown> }): unknown {
    if (serialized.__serializedType === "date") {
      return new Date(serialized.value as string);
    }
    if (serialized.__serializedType === "regexp") {
      return new RegExp(serialized.source as string, serialized.flags as string);
    }
    if (serialized.__serializedType === "map") {
      const map = new Map();
      if (context?.refs && serialized.__refId) {
        context.refs.set(serialized.__refId, map);
      }
      (serialized.entries as [SerializedValue, SerializedValue][]).forEach(
        ([key, value]) => {
          map.set(key, value);
        },
      );
      return map;
    }
    if (serialized.__serializedType === "set") {
      const set = new Set();
      if (context?.refs && serialized.__refId) {
        context.refs.set(serialized.__refId, set);
      }
      (serialized.values as SerializedValue[]).forEach((value) => {
        set.add(value);
      });
      return set;
    }
    return serialized;
  }
}

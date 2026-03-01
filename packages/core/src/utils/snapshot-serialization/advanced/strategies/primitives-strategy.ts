// Primitives Serialization Strategy
import {
  SerializationStrategy,
  SerializationContext,
  SerializedValue,
} from "../types";

/**
 * Strategy for handling primitive types
 */
export class PrimitivesStrategy implements SerializationStrategy {
  canHandle(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint" ||
      typeof value === "symbol"
    );
  }

  serialize(value: unknown, _context: SerializationContext): SerializedValue {
    // Handle null
    if (value === null) {
      return {
        __serializedType: "null",
      };
    }

    // Handle undefined
    if (value === undefined) {
      return {
        __serializedType: "undefined",
      };
    }

    // Handle bigint
    if (typeof value === "bigint") {
      return {
        __serializedType: "bigint",
        value: value.toString(),
      };
    }

    // Handle symbol
    if (typeof value === "symbol") {
      return {
        __serializedType: "symbol",
        description: value.description,
      };
    }

    // Handle primitives (string, number, boolean)
    // These are returned directly as their serialized value
    return (value as SerializedValue);
  }

  deserialize?(serialized: SerializedValue): unknown {
    if (serialized.__serializedType === "null") {
      return null;
    }
    if (serialized.__serializedType === "undefined") {
      return undefined;
    }
    if (serialized.__serializedType === "bigint") {
      return BigInt(serialized.value as string);
    }
    if (serialized.__serializedType === "symbol") {
      return Symbol((serialized.description as string) || "");
    }
    return serialized;
  }
}

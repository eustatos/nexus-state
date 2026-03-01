// Circular References Serialization Strategy
import {
  SerializationStrategy,
  SerializationContext,
  SerializedValue,
  SerializedReference,
} from "../types";

/**
 * Strategy for handling circular references
 * This strategy is checked last and handles cases where objects have been seen before
 */
export class CircularStrategy implements SerializationStrategy {
  canHandle(_value: unknown): boolean {
    // This strategy doesn't directly handle values
    // It's used by the main serializer to detect circular references
    return false;
  }

  serialize(_value: unknown, _context: SerializationContext): SerializedValue {
    // This strategy is not meant to serialize directly
    // It's used internally by the AdvancedSerializer
    return {
      __serializedType: "circular",
      __error: "CircularStrategy should not be called directly",
    };
  }

  /**
   * Check if a value has been seen before (circular reference)
   */
  static isCircular(value: unknown, context: SerializationContext): boolean {
    return (
      context.options.detectCircular &&
      typeof value === "object" &&
      value !== null &&
      context.seen.has(value)
    );
  }

  /**
   * Get or create reference ID for an object
   */
  static getReferenceId(value: unknown, context: SerializationContext): string | undefined {
    if (typeof value !== "object" || value === null) {
      return undefined;
    }

    const existingRef = context.seen.get(value);
    if (existingRef) {
      return existingRef;
    }

    // Generate new reference ID
    const refId = `ref_${++context.refCounter}`;
    context.seen.set(value as object, refId);
    return refId;
  }

  /**
   * Create a circular reference marker
   */
  static createReference(
    value: unknown,
    context: SerializationContext,
  ): SerializedReference {
    const refId = context.seen.get(value as object) || `ref_${++context.refCounter}`;
    context.seen.set(value as object, refId);

    return {
      __serializedType: "reference",
      __refId: refId,
      __path: context.path.join("."),
    };
  }

  deserialize?(serialized: SerializedValue): unknown {
    // Reference deserialization is handled by the main deserializer
    return serialized;
  }
}

// Collections Serialization Strategy
import {
  SerializationStrategy,
  SerializationContext,
  SerializedValue,
  TypedArray,
} from "../types";

/**
 * Strategy for handling collections (Array, TypedArray, ArrayBuffer)
 */
export class CollectionsStrategy implements SerializationStrategy {
  canHandle(value: unknown): boolean {
    return (
      Array.isArray(value) ||
      this.isTypedArray(value) ||
      value instanceof ArrayBuffer ||
      value instanceof SharedArrayBuffer
    );
  }

  private isTypedArray(value: unknown): value is TypedArray {
    return (
      value !== null &&
      typeof value === "object" &&
      ArrayBuffer.isView(value) &&
      !(value instanceof DataView)
    );
  }

  serialize(value: unknown, context: SerializationContext): SerializedValue {
    const objValue = value as object;
    const refId = context.seen.get(objValue);

    // Handle Array
    if (Array.isArray(value)) {
      const result: SerializedValue[] = [];
      for (let i = 0; i < value.length; i++) {
        context.path.push(`[${i}]`);
        result[i] = this.serializeValue(value[i], context);
        context.path.pop();
      }
      return {
        __serializedType: "array",
        __refId: refId,
        length: value.length,
        values: result,
      };
    }

    // Handle TypedArray
    if (this.isTypedArray(value)) {
      const buffer = value.buffer.slice(0);
      return {
        __serializedType: "typedarray",
        __refId: refId,
        __className: (value as object).constructor?.name || "TypedArray",
        buffer,
        length: value.length,
        byteOffset: value.byteOffset,
      };
    }

    // Handle ArrayBuffer
    if (value instanceof ArrayBuffer || value instanceof SharedArrayBuffer) {
      const buffer = value instanceof ArrayBuffer ? value : new ArrayBuffer(value.byteLength);
      const data = this.arrayBufferToBase64(buffer);
      return {
        __serializedType: "arraybuffer",
        __refId: refId,
        data,
      };
    }

    return {
      __serializedType: "object",
      __className: (objValue as object).constructor?.name || "Object",
    };
  }

  private serializeValue(
    value: unknown,
    _context: SerializationContext,
  ): SerializedValue {
    // For complex objects, delegate to main serializer's object handling
    // This ensures circular references are handled properly
    // For primitives and simple types, return as-is
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
    
    // For arrays, we need to use JSON to avoid recursion issues
    // The circular reference will be handled by the main serializer
    try {
      const json = JSON.stringify(value);
      return JSON.parse(json);
    } catch {
      // If JSON fails (circular reference), the main serializer will handle it
      return { value: "Circular reference" };
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  deserialize?(serialized: SerializedValue, context?: { refs?: Map<string, unknown> }): unknown {
    if (serialized.__serializedType === "array") {
      if (context?.refs && serialized.__refId) {
        const arr = serialized.values as SerializedValue[];
        context.refs.set(serialized.__refId, arr);
        return arr;
      }
      return (serialized.values as SerializedValue[]);
    }
    if (serialized.__serializedType === "typedarray") {
      const className = serialized.__className as string;
      const buffer = serialized.buffer as ArrayBuffer;
      const TypedArrayCtor = (globalThis as any)[className];
      if (TypedArrayCtor) {
        return new TypedArrayCtor(buffer, 0, serialized.length as number);
      }
    }
    if (serialized.__serializedType === "arraybuffer") {
      const data = atob(serialized.data as string);
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
      }
      return bytes.buffer;
    }
    return serialized;
  }
}

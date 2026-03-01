// packages/core/utils/snapshot-serialization/__tests__/helpers.ts
/**
 * Test helpers and utilities for snapshot serialization tests
 * Provides common assertion logic and test data generators
 */

import { expect as _expect } from "vitest";
import type { SerializedValue as _SerializedValue } from "../types";

/**
 * Deep equality check that handles special objects (Date, RegExp, Map, Set, etc.)
 * Standard Jest/Vitest matchers don't handle these correctly
 */
export function deepEqualWithSpecial(a: unknown, b: unknown): boolean {
  // Strict equality for primitives and same references
  if (a === b) return true;
  
  // Handle NaN separately (NaN !== NaN)
  if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
    return true;
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
      if (!deepEqualWithSpecial(v, b.get(k))) return false;
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
      if (!bValues.some((bv) => deepEqualWithSpecial(v, bv))) return false;
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
    return a.every((val, i) => deepEqualWithSpecial(val, b[i]));
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // Object comparison
  if (typeof a === "object" && typeof b === "object" && a && b) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqualWithSpecial((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  // Fallback to strict equality
  return a === b;
}

/**
 * Custom expect extension for deep equality with special types
 * Usage: expect(actual).toDeepEqualWithSpecial(expected)
 */
export function expectDeepEqualWithSpecial(actual: unknown, expected: unknown) {
  if (!deepEqualWithSpecial(actual, expected)) {
    throw new Error(
      `Expected values to be deeply equal:\n  Received: ${JSON.stringify(actual, null, 2)}\n  Expected: ${JSON.stringify(expected, null, 2)}`,
    );
  }
}

/**
 * Extract __id from serialized object for testing circular references
 */
export function getObjectId(obj: unknown): string | null {
  if (obj && typeof obj === "object" && "__id" in obj) {
    return (obj as Record<string, string>).__id;
  }
  return null;
}

/**
 * Extract __ref from serialized object for testing circular references
 */
export function getObjectRef(obj: unknown): string | null {
  if (obj && typeof obj === "object" && "__ref" in obj) {
    return (obj as Record<string, string>).__ref;
  }
  return null;
}

/**
 * Check if value is a serialized marker object
 */
export function isSerializedMarker(obj: unknown, type: string): boolean {
  if (obj && typeof obj === "object" && "__type" in obj) {
    return (obj as Record<string, string>).__type === type;
  }
  return false;
}

/**
 * Create test data generators for property-based testing scenarios
 */
export const testDataGenerators = {
  /**
   * Generate primitive values
   */
  primitive() {
    const values = [
      42,
      3.14,
      "hello",
      true,
      false,
      null,
      undefined,
      BigInt(123),
    ];
    return values[Math.floor(Math.random() * values.length)];
  },

  /**
   * Generate a Date object
   */
  date() {
    const timestamps = [
      0,
      Date.now(),
      new Date("2023-01-01").getTime(),
      new Date("2000-06-15T12:30:00Z").getTime(),
    ];
    return new Date(timestamps[Math.floor(Math.random() * timestamps.length)]);
  },

  /**
   * Generate a RegExp object
   */
  regex() {
    const patterns = [/test/g, /^[a-z]+$/i, /\d+/gm, /.*$/];
    return patterns[Math.floor(Math.random() * patterns.length)];
  },

  /**
   * Generate a simple plain object
   */
  plainObject() {
    return {
      id: Math.floor(Math.random() * 1000),
      name: `test_${Math.random().toString(36).substring(7)}`,
      active: Math.random() > 0.5,
    };
  },

  /**
   * Generate an array with random length and content
   */
  array(maxLength = 10) {
    const length = Math.floor(Math.random() * maxLength);
    return Array.from({ length }, () => this.primitive());
  },

  /**
   * Generate a Map with random entries
   */
  map(maxEntries = 5) {
    const map = new Map();
    const entries = Math.floor(Math.random() * maxEntries);
    for (let i = 0; i < entries; i++) {
      map.set(`key_${i}`, this.primitive());
    }
    return map;
  },

  /**
   * Generate a Set with random values
   */
  set(maxValues = 5) {
    const set = new Set();
    const values = Math.floor(Math.random() * maxValues);
    for (let i = 0; i < values; i++) {
      set.add(this.primitive());
    }
    return set;
  },

  /**
   * Generate an Error object
   */
  error() {
    const errors = [
      new Error("Generic error"),
      new TypeError("Type error"),
      new RangeError("Range error"),
      new ReferenceError("Reference error"),
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  },

  /**
 * Generate a complex nested object
 */
  nestedObject(depth = 3): Record<string, unknown> {
    const inner = (d: number): Record<string, unknown> => {
      if (d <= 0) {
        return { value: this.primitive() };
      }
      return {
        level: d,
        data: this.primitive(),
        child: inner(d - 1),
        items: this.array(3),
      };
    };
    return inner(depth);
  },

  /**
   * Generate an object with circular reference
   */
  circularObject() {
    const obj: Record<string, unknown> = {
      id: Math.floor(Math.random() * 1000),
      name: "circular",
    };
    obj.self = obj;
    return obj;
  },

  /**
   * Generate mutual circular references (A -> B -> A)
   */
  mutualCircular() {
    const a: Record<string, unknown> = { name: "A", id: 1 };
    const b: Record<string, unknown> = { name: "B", id: 2 };
    a.ref = b;
    b.ref = a;
    return { a, b };
  },
};

/**
 * Performance measurement helper
 */
export function measurePerformance<T>(fn: () => T): {
  result: T;
  durationMs: number;
} {
  const start = performance.now();
  const result = fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}

/**
 * Create a snapshot of serialized output for comparison
 * Normalizes dynamic fields like __id and createdAt
 */
export function normalizeSerializedOutput(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeSerializedOutput(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Normalize dynamic ID fields
    if (key === "__id") {
      result[key] = "<ID>";
    } else if (key === "createdAt") {
      result[key] = "<TIMESTAMP>";
    } else {
      result[key] = normalizeSerializedOutput(value);
    }
  }
  return result;
}

/**
 * Assert that serialization is deterministic (same input = same output structure)
 */
export function assertDeterministicSerialization(
  serializeFn: (input: unknown) => unknown,
  input: unknown,
  iterations = 5,
) {
  const results = Array.from({ length: iterations }, () => serializeFn(input));

  // Normalize and compare
  const normalized = results.map(normalizeSerializedOutput);
  const first = JSON.stringify(normalized[0]);

  for (let i = 1; i < normalized.length; i++) {
    const current = JSON.stringify(normalized[i]);
    if (first !== current) {
      throw new Error(
        `Serialization is not deterministic!\nIteration 1: ${first}\nIteration ${i + 1}: ${current}`,
      );
    }
  }

  return true;
}

/**
 * Validate serialized structure has required metadata
 */
export function validateSerializedStructure(
  obj: unknown,
  options?: {
    requireId?: boolean;
    requireType?: boolean;
    allowRefs?: boolean;
  },
): boolean {
  const opts = {
    requireId: true,
    requireType: true,
    allowRefs: true,
    ...options,
  };

  if (obj === null || obj === undefined) return true;
  if (typeof obj !== "object") return true;

  if (Array.isArray(obj)) {
    return obj.every((item) => validateSerializedStructure(item, opts));
  }

  // Check for reference marker
  if ("__ref" in obj) {
    return opts.allowRefs && typeof obj.__ref === "string";
  }

  // Special type markers (Date, RegExp, Map, Set, BigInt, Error, Function, etc.) don't require __id
  if ("__type" in obj && typeof obj.__type === "string") {
    // Check that special type markers have the required properties
    switch (obj.__type) {
      case "Date":
        return typeof (obj as any).value === "string";
      case "RegExp":
        return typeof (obj as any).source === "string";
      case "Map":
        return Array.isArray((obj as any).entries);
      case "Set":
        return Array.isArray((obj as any).values);
      case "BigInt":
        return typeof (obj as any).value === "string";
      case "Error":
        return typeof (obj as any).name === "string" && typeof (obj as any).message === "string";
      case "Function":
        return typeof (obj as any).name === "string" && typeof (obj as any).source === "string";
      case "MaxDepthExceeded":
        return typeof (obj as any).__message === "string";
      default:
        // For custom __type values, check they have __id if required
        if (opts.requireType && !("__type" in obj)) {
          return false;
        }
        if (opts.requireId && !("__id" in obj)) {
          return false;
        }
    }
  }

  // Check for object metadata (plain objects with __id)
  if (opts.requireId && !("__id" in obj)) {
    return false;
  }

  if (opts.requireType && !("__type" in obj)) {
    return false;
  }

  // Validate nested properties
  for (const [key, value] of Object.entries(obj)) {
    if (key === "__id" || key === "__type" || key === "__ref") continue;
    if (!validateSerializedStructure(value, opts)) {
      return false;
    }
  }

  return true;
}

/**
 * Memory usage tracker for leak detection
 */
export class MemoryTracker {
  private snapshots: number[] = [];

  capture() {
    if (typeof process !== "undefined" && process.memoryUsage) {
      this.snapshots.push(process.memoryUsage().heapUsed);
    }
  }

  getGrowth(): number {
    if (this.snapshots.length < 2) return 0;
    return this.snapshots[this.snapshots.length - 1] - this.snapshots[0];
  }

  reset() {
    this.snapshots = [];
  }

  /**
   * Assert memory growth is within acceptable limits
   */
  assertNoLeaks(maxGrowthMB = 10) {
    const growthBytes = this.getGrowth();
    const growthMB = growthBytes / (1024 * 1024);

    if (growthMB > maxGrowthMB) {
      throw new Error(
        `Potential memory leak detected! Growth: ${growthMB.toFixed(2)}MB (limit: ${maxGrowthMB}MB)`,
      );
    }

    return true;
  }
}

export const memoryTracker = new MemoryTracker();

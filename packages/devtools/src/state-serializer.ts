/**
 * StateSerializer - State serialization, deserialization, and checksum verification
 *
 * This module provides utilities for serializing and deserializing state
 * for DevTools compatibility, including checksum verification for data integrity.
 *
 * @example
 * ```typescript
 * // Serialize state with checksum
 * const state = { counter: 5, user: { name: 'John' } };
 * const serialized = StateSerializer.serialize(state);
 * // { state: {...}, checksum: 'abc123', timestamp: 1234567890 }
 *
 * // Deserialize and verify
 * const result = StateSerializer.deserialize(serialized);
 * if (result.valid) {
 *   console.log(result.state); // { counter: 5, user: { name: 'John' } }
 * }
 * ```
 */

/**
 * Serialized state format for DevTools compatibility
 */
export interface SerializedState {
  /** The serialized state object */
  state: Record<string, unknown>;
  /** Timestamp when state was serialized */
  timestamp: number;
  /** Checksum for data integrity verification */
  checksum: string;
  /** Optional metadata about the state */
  metadata?: Record<string, unknown>;
}

/**
 * Result of state deserialization
 */
export interface DeserializeResult {
  /** Whether deserialization was successful */
  success: boolean;
  /** The deserialized state if successful */
  state?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
  /** Checksum verification result */
  checksumValid?: boolean;
}

/**
 * State import format (from DevTools)
 */
export interface ImportStateFormat {
  /** The state object */
  state: Record<string, unknown>;
  /** Timestamp of import */
  timestamp: number;
  /** Checksum for verification */
  checksum: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * State export format (for sharing)
 */
export interface ExportStateFormat {
  /** The state object */
  state: Record<string, unknown>;
  /** Timestamp of export */
  timestamp: number;
  /** Checksum for verification */
  checksum: string;
  /** Version of serialization format */
  version: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Checksum verification result
 */
export interface ChecksumResult {
  /** Whether checksum is valid */
  valid: boolean;
  /** Expected checksum */
  expected: string;
  /** Computed checksum */
  computed: string;
}

/**
 * Options for lazy serialization (reduces overhead for large state trees).
 * Compatible with SerializationConfig from types.
 */
export interface LazySerializationOptions {
  /** Maximum depth to serialize; deeper values become placeholders (default: 10) */
  maxDepth?: number;
  /** Approximate max serialized size in bytes; overflow replaced with placeholder (default: 512_000) */
  maxSerializedSize?: number;
  /** How to handle circular references: "placeholder" | "omit" | "throw" (default: "placeholder") */
  circularRefHandling?: "placeholder" | "omit" | "throw";
  /** Placeholder string for truncated or circular values (default: "[...]") */
  placeholder?: string;
}

const DEFAULT_LAZY_OPTIONS: Required<LazySerializationOptions> = {
  maxDepth: 10,
  maxSerializedSize: 512_000,
  circularRefHandling: "placeholder",
  placeholder: "[...]",
};

/** Result of lazy serialization with optional incremental merge info */
export interface LazySerializeResult {
  /** Lazy-serialized state (safe for JSON, no circular refs, depth/size limited) */
  state: Record<string, unknown>;
  /** Whether size limit was hit (some values replaced with placeholder) */
  sizeLimitHit: boolean;
  /** Whether circular reference(s) were replaced */
  hadCircularRefs: boolean;
}

/**
 * StateSerializer class for serialization and deserialization
 *
 * This class provides utilities for serializing and deserializing state
 * with checksum verification for data integrity.
 *
 * @class StateSerializer
 */
/** Context for lazy serialization (mutable during walk) */
interface LazySerializeContext {
  opts: Required<LazySerializationOptions>;
  seen: WeakSet<object>;
  currentSize: number;
  sizeLimitHit: boolean;
  hadCircularRefs: boolean;
}

export class StateSerializer {
  private readonly version = "1.0.0";

  /**
   * Serialize state lazily with depth limit, size limit, and circular reference handling.
   * Use this for large state trees to reduce DevTools overhead.
   * @param state The state to serialize
   * @param options Lazy serialization options
   * @param previousLazyState Optional previous result for incremental update (only re-serialize changed keys)
   * @param changedKeys Optional set of top-level keys that changed; when provided with previousLazyState, only those keys are re-serialized
   * @returns Lazy-serialized state and metadata
   */
  serializeLazy(
    state: Record<string, unknown>,
    options: LazySerializationOptions = {},
    previousLazyState?: Record<string, unknown>,
    changedKeys?: Set<string>,
  ): LazySerializeResult {
    const opts = { ...DEFAULT_LAZY_OPTIONS, ...options };
    const ctx: LazySerializeContext = {
      opts,
      seen: new WeakSet(),
      currentSize: 0,
      sizeLimitHit: false,
      hadCircularRefs: false,
    };

    let result: Record<string, unknown>;

    if (previousLazyState && changedKeys && changedKeys.size > 0) {
      result = { ...previousLazyState };
      for (const key of changedKeys) {
        if (key in state) {
          result[key] = this.lazySerializeValue(state[key], 0, ctx);
        } else {
          delete result[key];
        }
      }
    } else {
      result = {};
      for (const [key, value] of Object.entries(state)) {
        if (ctx.currentSize >= opts.maxSerializedSize) {
          result[key] = opts.placeholder;
          ctx.sizeLimitHit = true;
          continue;
        }
        result[key] = this.lazySerializeValue(value, 0, ctx);
      }
    }

    return {
      state: result,
      sizeLimitHit: ctx.sizeLimitHit,
      hadCircularRefs: ctx.hadCircularRefs,
    };
  }

  /**
   * Serialize a single value with depth/size/circular limits.
   */
  private lazySerializeValue(
    value: unknown,
    depth: number,
    ctx: LazySerializeContext,
  ): unknown {
    const { opts } = ctx;
    const placeholder = opts.placeholder;

    if (depth >= opts.maxDepth) {
      return placeholder;
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      ctx.currentSize += value.length + 2;
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      ctx.currentSize += 8;
      return value;
    }

    if (typeof value === "object" && value !== null) {
      if (ctx.seen.has(value as object)) {
        ctx.hadCircularRefs = true;
        switch (opts.circularRefHandling) {
          case "throw":
            throw new Error("Circular reference detected during serialization");
          case "omit":
            return undefined;
          default:
            return placeholder;
        }
      }
      ctx.seen.add(value as object);
    }

    if (typeof value === "function" || typeof value === "symbol") {
      return placeholder;
    }

    if (Array.isArray(value)) {
      ctx.currentSize += 2;
      const arr: unknown[] = [];
      for (let i = 0; i < value.length; i++) {
        if (ctx.currentSize >= opts.maxSerializedSize) {
          arr.push(placeholder);
          ctx.sizeLimitHit = true;
          break;
        }
        arr.push(this.lazySerializeValue(value[i], depth + 1, ctx));
      }
      return arr;
    }

    if (typeof value === "object" && value !== null) {
      ctx.currentSize += 2;
      const obj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (ctx.currentSize >= opts.maxSerializedSize) {
          obj[k] = placeholder;
          ctx.sizeLimitHit = true;
          break;
        }
        ctx.currentSize += k.length + 1;
        const out = this.lazySerializeValue(v, depth + 1, ctx);
        if (out !== undefined || opts.circularRefHandling !== "omit") {
          obj[k] = out;
        }
      }
      return obj;
    }

    return placeholder;
  }

  /**
   * Compute which top-level keys differ between two state objects (shallow comparison of keys).
   * Use with serializeLazy(..., previousLazyState, changedKeys) for incremental updates.
   */
  getChangedKeys(
    prev: Record<string, unknown> | null,
    next: Record<string, unknown>,
  ): Set<string> {
    const changed = new Set<string>();
    const prevKeys = prev ? new Set(Object.keys(prev)) : new Set<string>();
    const nextKeys = new Set(Object.keys(next));

    for (const key of nextKeys) {
      if (!prev || !(key in prev) || prev[key] !== next[key]) {
        changed.add(key);
      }
    }
    for (const key of prevKeys) {
      if (!nextKeys.has(key)) {
        changed.add(key);
      }
    }
    return changed;
  }

  /**
   * Serialize state with checksum
   * @param state The state to serialize
   * @param metadata Optional metadata to include
   * @returns Serialized state with checksum
   */
  serialize(
    state: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): SerializedState {
    const timestamp = Date.now();
    const stateString = JSON.stringify(state);
    const checksum = this.computeChecksum(stateString);

    return {
      state,
      timestamp,
      checksum,
      metadata: metadata ?? {},
    };
  }

  /**
   * Deserialize state with checksum verification
   * @param serialized The serialized state to deserialize
   * @returns Deserialization result with state or error
   */
  deserialize(serialized: unknown): DeserializeResult {
    try {
      // Validate input type
      if (
        !serialized ||
        typeof serialized !== "object" ||
        Array.isArray(serialized)
      ) {
        return {
          success: false,
          error: "Invalid serialized state: must be an object",
        };
      }

      const data = serialized as SerializedState;

      // Validate required fields
      if (!data.state || typeof data.state !== "object") {
        return {
          success: false,
          error: "Invalid serialized state: missing or invalid state field",
        };
      }

      if (typeof data.timestamp !== "number") {
        return {
          success: false,
          error: "Invalid serialized state: missing or invalid timestamp",
        };
      }

      if (typeof data.checksum !== "string") {
        return {
          success: false,
          error: "Invalid serialized state: missing or invalid checksum",
        };
      }

      // Verify checksum
      const stateString = JSON.stringify(data.state);
      const computedChecksum = this.computeChecksum(stateString);
      const checksumValid = computedChecksum === data.checksum;

      if (!checksumValid) {
        return {
          success: false,
          error: "Checksum verification failed: state may be corrupted",
          checksumValid: false,
        };
      }

      return {
        success: true,
        state: data.state,
        checksumValid: true,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || "Unknown deserialization error",
      };
    }
  }

  /**
   * Import state from DevTools format
   * @param importData The import state data
   * @returns Deserialization result
   */
  importState(importData: unknown): DeserializeResult {
    return this.deserialize(importData);
  }

  /**
   * Export state in shareable format
   * @param state The state to export
   * @param metadata Optional metadata
   * @returns Export state format
   */
  exportState(
    state: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): ExportStateFormat {
    const serialized = this.serialize(state, metadata);

    return {
      state: serialized.state,
      timestamp: serialized.timestamp,
      checksum: serialized.checksum,
      version: this.version,
      metadata: serialized.metadata,
    };
  }

  /**
   * Export state using lazy serialization (depth/size limits, circular ref handling).
   * Use for large state trees to reduce DevTools overhead.
   * @param state The state to export
   * @param options Lazy serialization options
   * @param metadata Optional metadata
   * @returns Export state format with lazy-serialized state and checksum
   */
  exportStateLazy(
    state: Record<string, unknown>,
    options: LazySerializationOptions = {},
    metadata?: Record<string, unknown>,
  ): ExportStateFormat {
    const { state: lazyState } = this.serializeLazy(state, options);
    const timestamp = Date.now();
    const stateString = JSON.stringify(lazyState);
    const checksum = this.computeChecksum(stateString);

    return {
      state: lazyState,
      timestamp,
      checksum,
      version: this.version,
      metadata: metadata ?? {},
    };
  }

  /**
   * Verify checksum of serialized state
   * @param serialized The serialized state to verify
   * @returns Checksum verification result
   */
  verifyChecksum(serialized: SerializedState): ChecksumResult {
    const stateString = JSON.stringify(serialized.state);
    const computedChecksum = this.computeChecksum(stateString);

    return {
      valid: computedChecksum === serialized.checksum,
      expected: serialized.checksum,
      computed: computedChecksum,
    };
  }

  /**
   * Compute checksum for state string
   * @param stateString The state string to checksum
   * @returns Base64-encoded checksum
   */
  private computeChecksum(stateString: string): string {
    // Simple hash function for checksum (not cryptographically secure)
    // Using a simple polynomial rolling hash
    let hash = 5381;
    for (let i = 0; i < stateString.length; i++) {
      hash = (hash * 33) ^ stateString.charCodeAt(i);
    }
    // Convert to unsigned 32-bit integer and then to base64
    const unsignedHash = hash >>> 0;
    return Buffer.from(unsignedHash.toString(16).padStart(8, "0"), "hex")
      .toString("base64")
      .substring(0, 8);
  }

  /**
   * Get the serialization version
   * @returns Version string
   */
  getVersion(): string {
    return this.version;
  }
}

/**
 * Create a new StateSerializer instance
 * @returns New StateSerializer instance
 */
export function createStateSerializer(): StateSerializer {
  return new StateSerializer();
}

/**
 * Default serializer instance for convenience
 */
export const defaultSerializer = createStateSerializer();


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
 * StateSerializer class for serialization and deserialization
 *
 * This class provides utilities for serializing and deserializing state
 * with checksum verification for data integrity.
 *
 * @class StateSerializer
 */
export class StateSerializer {
  private readonly version = "1.0.0";

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


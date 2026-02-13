/**
 * Unit tests for StateSerializer
 *
 * This file contains comprehensive tests for the StateSerializer class,
 * covering serialization, deserialization, checksum verification, and edge cases.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  StateSerializer,
  createStateSerializer,
  defaultSerializer,
  SerializedState,
  ImportStateFormat,
} from "../state-serializer";
import {
  sampleStates,
  invalidStates,
  validSerializedStates,
  invalidSerializedStates,
  importStateFormats,
  exportStateFormats,
  checksumResults,
  largeState,
  errorMessages,
} from "../__fixtures__/state-serializer-fixtures";

describe("StateSerializer", () => {
  describe("Serialization", () => {
    let serializer: StateSerializer;

    beforeEach(() => {
      serializer = new StateSerializer();
    });

    it("should serialize simple state", () => {
      const state = { counter: 5 };
      const result = serializer.serialize(state);

      expect(result).toBeDefined();
      expect(result.state).toEqual(state);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.checksum).toBeDefined();
      expect(typeof result.checksum).toBe("string");
    });

    it("should serialize state with metadata", () => {
      const state = { counter: 5 };
      const metadata = { source: "test", version: "1.0" };
      const result = serializer.serialize(state, metadata);

      expect(result.metadata).toEqual(metadata);
    });

    it("should serialize empty state", () => {
      const state = {};
      const result = serializer.serialize(state);

      expect(result.state).toEqual({});
      expect(result.checksum).toBeDefined();
    });

    it("should serialize nested state", () => {
      const state = {
        user: {
          profile: { name: "John", age: 30 },
        },
      };
      const result = serializer.serialize(state);

      expect(result.state).toEqual(state);
    });

    it("should serialize state with arrays", () => {
      const state = {
        items: [{ id: 1 }, { id: 2 }],
      };
      const result = serializer.serialize(state);

      expect(result.state).toEqual(state);
    });

    it("should serialize state with null/undefined values", () => {
      const state = {
        value1: null,
        value2: undefined,
        value3: 0,
        value4: false,
      };
      const result = serializer.serialize(state);

      expect(result.state).toEqual(state);
    });

    it("should generate unique checksums for different states", () => {
      const state1 = { counter: 5 };
      const state2 = { counter: 6 };

      const result1 = serializer.serialize(state1);
      const result2 = serializer.serialize(state2);

      expect(result1.checksum).not.toBe(result2.checksum);
    });

    it("should generate same checksum for same state", () => {
      const state = { counter: 5 };

      const result1 = serializer.serialize(state);
      const result2 = serializer.serialize(state);

      expect(result1.checksum).toBe(result2.checksum);
    });
  });

  describe("Deserialization", () => {
    let serializer: StateSerializer;

    beforeEach(() => {
      serializer = new StateSerializer();
    });

    it("should deserialize valid serialized state", () => {
      const state = { counter: 5 };
      const serialized = serializer.serialize(state);

      const result = serializer.deserialize(serialized);

      expect(result.success).toBe(true);
      expect(result.state).toEqual(state);
      expect(result.checksumValid).toBe(true);
    });

    it("should return error for invalid serialized state", () => {
      const result = serializer.deserialize(null as unknown as SerializedState);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error for missing state field", () => {
      const serialized = {
        timestamp: 1705372800000,
        checksum: "dGhpcyBpcyBhIHRlc3Q=",
      };

      const result = serializer.deserialize(serialized);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessages.invalidStateField);
    });

    it("should return error for missing timestamp field", () => {
      const serialized = {
        state: { counter: 5 },
        checksum: "dGhpcyBpcyBhIHRlc3Q=",
      };

      const result = serializer.deserialize(serialized);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessages.invalidTimestamp);
    });

    it("should return error for missing checksum field", () => {
      const serialized = {
        state: { counter: 5 },
        timestamp: 1705372800000,
      };

      const result = serializer.deserialize(serialized);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessages.invalidChecksum);
    });

    it("should return error for invalid checksum", () => {
      const state = { counter: 5 };
      const serialized = serializer.serialize(state);
      serialized.checksum = "invalid-checksum";

      const result = serializer.deserialize(serialized);

      expect(result.success).toBe(false);
      expect(result.checksumValid).toBe(false);
      expect(result.error).toBe(errorMessages.checksumVerificationFailed);
    });

    it("should return error for non-object state", () => {
      const serialized = {
        state: "invalid",
        timestamp: 1705372800000,
        checksum: "dGhpcyBpcyBhIHRlc3Q=",
      };

      const result = serializer.deserialize(serialized);

      expect(result.success).toBe(false);
    });

    it("should return error for array state", () => {
      const serialized = {
        state: [1, 2, 3],
        timestamp: 1705372800000,
        checksum: "dGhpcyBpcyBhIHRlc3Q=",
      };

      const result = serializer.deserialize(serialized);

      expect(result.success).toBe(false);
    });

    it("should handle large state efficiently", () => {
      const state = largeState;
      const serialized = serializer.serialize(state);

      const result = serializer.deserialize(serialized);

      expect(result.success).toBe(true);
      expect(result.state).toEqual(state);
    });
  });

  describe("Import State", () => {
    let serializer: StateSerializer;

    beforeEach(() => {
      serializer = new StateSerializer();
    });

    it("should import valid state", () => {
      const format = importStateFormats[0].format;

      const result = serializer.importState(format);

      expect(result.success).toBe(true);
      expect(result.state).toEqual(format.state);
    });

    it("should import state without metadata", () => {
      const format = {
        state: { counter: 10 },
        timestamp: 1705372800000,
        checksum: "evDCrA==",
      };

      const result = serializer.importState(format);

      expect(result.success).toBe(true);
    });

    it("should return error for invalid import state", () => {
      const result = serializer.importState(null as unknown as ImportStateFormat);

      expect(result.success).toBe(false);
    });
  });

  describe("Export State", () => {
    let serializer: StateSerializer;

    beforeEach(() => {
      serializer = new StateSerializer();
    });

    it("should export state in correct format", () => {
      const state = { counter: 10 };
      const result = serializer.exportState(state);

      expect(result.state).toEqual(state);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.checksum).toBeDefined();
      expect(result.version).toBe("1.0.0");
    });

    it("should export state with metadata", () => {
      const state = { counter: 10 };
      const metadata = { source: "devtools" };
      const result = serializer.exportState(state, metadata);

      expect(result.metadata).toEqual(metadata);
    });

    it("should include version in export", () => {
      const state = { counter: 10 };
      const result = serializer.exportState(state);

      expect(result.version).toBe("1.0.0");
    });
  });

  describe("Checksum Verification", () => {
    let serializer: StateSerializer;

    beforeEach(() => {
      serializer = new StateSerializer();
    });

    it("should verify valid checksum", () => {
      const state = { counter: 5 };
      const serialized = serializer.serialize(state);

      const result = serializer.verifyChecksum(serialized);

      expect(result.valid).toBe(true);
      expect(result.expected).toBe(serialized.checksum);
      expect(result.computed).toBe(serialized.checksum);
    });

    it("should detect invalid checksum", () => {
      const state = { counter: 5 };
      const serialized = serializer.serialize(state);
      serialized.checksum = "invalid-checksum";

      const result = serializer.verifyChecksum(serialized);

      expect(result.valid).toBe(false);
    });

    it("should compute correct checksum", () => {
      const state = { counter: 5 };
      const serialized = serializer.serialize(state);

      const result = serializer.verifyChecksum(serialized);

      expect(result.computed).toBe(serialized.checksum);
    });
  });

  describe("Static Factory Function", () => {
    it("should create StateSerializer via factory", () => {
      const serializer = createStateSerializer();

      expect(serializer).toBeInstanceOf(StateSerializer);
    });

    it("should use default serializer", () => {
      const state = { counter: 5 };
      const result = defaultSerializer.serialize(state);

      expect(result.state).toEqual(state);
      expect(result.checksum).toBeDefined();
    });
  });

  describe("Version", () => {
    let serializer: StateSerializer;

    beforeEach(() => {
      serializer = new StateSerializer();
    });

    it("should return version string", () => {
      expect(serializer.getVersion()).toBe("1.0.0");
    });
  });

  describe("Integration with DevTools Commands", () => {
    let serializer: StateSerializer;

    beforeEach(() => {
      serializer = new StateSerializer();
    });

    it("should support DevTools import state flow", () => {
      // Simulate DevTools import state flow
      const state = { counter: 10 };
      const exported = serializer.exportState(state, { source: "devtools" });

      // Import the state
      const result = serializer.importState(exported);

      expect(result.success).toBe(true);
      expect(result.state).toEqual(state);
    });

    it("should support state sharing via export", () => {
      const state = { counter: 10 };
      const exported = serializer.exportState(state, { source: "devtools" });

      // Verify checksum
      const checksumResult = serializer.verifyChecksum({
        state: exported.state,
        timestamp: exported.timestamp,
        checksum: exported.checksum,
      });

      expect(checksumResult.valid).toBe(true);
    });
  });
});


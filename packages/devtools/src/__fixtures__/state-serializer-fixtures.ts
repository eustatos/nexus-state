/**
 * Test fixtures for StateSerializer
 *
 * This file provides test data and mock objects for StateSerializer tests,
 * including valid states, invalid states, and edge case scenarios.
 */

/**
 * Sample state objects for serialization tests
 */
export const sampleStates = [
  {
    name: "simple state",
    state: { counter: 5, user: { name: "John", age: 30 } },
  },
  {
    name: "empty state",
    state: {},
  },
  {
    name: "nested state",
    state: {
      user: {
        profile: {
          name: "John",
          email: "john@example.com",
          settings: {
            theme: "dark",
            notifications: true,
          },
        },
      },
      app: {
        version: "1.0.0",
        features: ["auth", "dashboard", "settings"],
      },
    },
  },
  {
    name: "array state",
    state: {
      items: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ],
    },
  },
  {
    name: "null values",
    state: {
      value1: null,
      value2: undefined,
      value3: 0,
      value4: false,
    },
  },
];

/**
 * Invalid states for validation tests
 */
export const invalidStates = [
  {
    name: "undefined state",
    state: undefined,
  },
  {
    name: "null state",
    state: null,
  },
  {
    name: "string state",
    state: "invalid",
  },
  {
    name: "number state",
    state: 123,
  },
  {
    name: "array state (not object)",
    state: [1, 2, 3],
  },
];

/**
 * Valid serialized states for deserialization tests
 */
export const validSerializedStates = [
  {
    name: "simple serialized state",
    serialized: {
      state: { counter: 5 },
      timestamp: 1705372800000,
      checksum: "dGhpcyBpcyBhIHRlc3Q=",
      metadata: { source: "test" },
    },
  },
  {
    name: "empty serialized state",
    serialized: {
      state: {},
      timestamp: 1705372800000,
      checksum: "dGhpcyBpcyBhIHRlc3Q=",
    },
  },
];

/**
 * Invalid serialized states for deserialization tests
 */
export const invalidSerializedStates = [
  {
    name: "missing state field",
    serialized: {
      timestamp: 1705372800000,
      checksum: "dGhpcyBpcyBhIHRlc3Q=",
    },
  },
  {
    name: "missing timestamp field",
    serialized: {
      state: { counter: 5 },
      checksum: "dGhpcyBpcyBhIHRlc3Q=",
    },
  },
  {
    name: "missing checksum field",
    serialized: {
      state: { counter: 5 },
      timestamp: 1705372800000,
    },
  },
  {
    name: "invalid checksum",
    serialized: {
      state: { counter: 5 },
      timestamp: 1705372800000,
      checksum: "invalid-checksum",
    },
  },
];

/**
 * Import state format fixtures
 */
export const importStateFormats = [
  {
    name: "valid import state",
    format: {
      state: { counter: 10 },
      timestamp: 1705372800000,
      checksum: "evDCrA==",
      metadata: { source: "devtools" },
    },
  },
  {
    name: "import state without metadata",
    format: {
      state: { counter: 10 },
      timestamp: 1705372800000,
      checksum: "evDCrA==",
    },
  },
];

/**
 * Export state format fixtures
 */
export const exportStateFormats = [
  {
    name: "valid export state",
    format: {
      state: { counter: 10 },
      timestamp: 1705372800000,
      checksum: "dGhpcyBpcyBhIHRlc3Q=",
      version: "1.0.0",
      metadata: { source: "devtools" },
    },
  },
];

/**
 * Checksum result fixtures
 */
export const checksumResults = [
  {
    name: "valid checksum",
    result: {
      valid: true,
      expected: "dGhpcyBpcyBhIHRlc3Q=",
      computed: "dGhpcyBpcyBhIHRlc3Q=",
    },
  },
  {
    name: "invalid checksum",
    result: {
      valid: false,
      expected: "dGhpcyBpcyBhIHRlc3Q=",
      computed: "b3RoZXIgY2hlY2tzdW0=",
    },
  },
];

/**
 * Large state for performance testing
 */
export const largeState: Record<string, unknown> = Object.fromEntries(
  Array.from({ length: 100 }, (_, i) => [
    `atom-${i}`,
    { value: i * 10, type: "primitive" as const },
  ]),
);

/**
 * Expected error messages for validation failures
 */
export const errorMessages = {
  invalidSerializedState: "Invalid serialized state: must be an object",
  invalidStateField: "Invalid serialized state: missing or invalid state field",
  invalidTimestamp: "Invalid serialized state: missing or invalid timestamp",
  invalidChecksum: "Invalid serialized state: missing or invalid checksum",
  checksumVerificationFailed: "Checksum verification failed: state may be corrupted",
  unknownError: "Unknown deserialization error",
};


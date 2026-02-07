/**
 * Test fixtures for CommandHandler
 *
 * This file provides test data for CommandHandler unit tests,
 * including valid commands, invalid commands, and edge cases.
 */

import { Snapshot, SnapshotStateEntry } from "@nexus-state/core";

/**
 * Valid JUMP_TO_STATE commands
 */
export const validJumpToStateCommands = [
  {
    type: "JUMP_TO_STATE" as const,
    payload: { index: 0 },
  },
  {
    type: "JUMP_TO_STATE" as const,
    payload: { index: 1 },
  },
  {
    type: "JUMP_TO_STATE" as const,
    payload: { index: 5 },
  },
];

/**
 * Invalid JUMP_TO_STATE commands (out of bounds, invalid data)
 */
export const invalidJumpToStateCommands = [
  {
    type: "JUMP_TO_STATE" as const,
    payload: { index: -1 },
  },
  {
    type: "JUMP_TO_STATE" as const,
    payload: { index: 1000 },
  },
  {
    type: "JUMP_TO_STATE" as const,
    payload: { index: NaN },
  },
  {
    type: "JUMP_TO_STATE" as const,
    payload: { index: 1.5 },
  },
  {
    type: "JUMP_TO_STATE" as const,
    payload: { index: "invalid" },
  },
];

/**
 * Valid JUMP_TO_ACTION commands
 */
export const validJumpToActionCommands = [
  {
    type: "JUMP_TO_ACTION" as const,
    payload: { actionName: "INCREMENT" },
  },
  {
    type: "JUMP_TO_ACTION" as const,
    payload: { actionName: "SET" },
  },
  {
    type: "JUMP_TO_ACTION" as const,
    payload: { actionName: "user/login" },
  },
];

/**
 * Invalid JUMP_TO_ACTION commands (empty, null, invalid)
 */
export const invalidJumpToActionCommands = [
  {
    type: "JUMP_TO_ACTION" as const,
    payload: { actionName: "" },
  },
  {
    type: "JUMP_TO_ACTION" as const,
    payload: { actionName: null },
  },
  {
    type: "JUMP_TO_ACTION" as const,
    payload: { actionName: 123 },
  },
  {
    type: "JUMP_TO_ACTION" as const,
    payload: { actionName: undefined },
  },
];

/**
 * Unknown command type for error handling tests
 */
export const unknownCommand = {
  type: "UNKNOWN_COMMAND" as const,
  payload: { foo: "bar" },
};

/**
 * Missing payload command for validation tests
 */
export const missingPayloadCommand = {
  type: "JUMP_TO_STATE" as const,
  payload: undefined,
};

/**
 * Missing type command for validation tests
 */
export const missingTypeCommand = {
  type: undefined,
  payload: { index: 0 },
};

/**
 * Mock SimpleTimeTravel instance for testing
 * This simulates the behavior of SimpleTimeTravel
 */
export const mockTimeTravel = {
  history: [
    {
      id: "snap-1",
      state: { "atom-counter": { value: 0, type: "primitive" } },
      metadata: { timestamp: Date.now(), action: "INIT", atomCount: 1 },
    },
    {
      id: "snap-2",
      state: { "atom-counter": { value: 1, type: "primitive" } },
      metadata: { timestamp: Date.now(), action: "INCREMENT", atomCount: 1 },
    },
    {
      id: "snap-3",
      state: { "atom-counter": { value: 2, type: "primitive" } },
      metadata: { timestamp: Date.now(), action: "INCREMENT", atomCount: 1 },
    },
    {
      id: "snap-4",
      state: { "atom-counter": { value: 3, type: "primitive" } },
      metadata: { timestamp: Date.now(), action: "INCREMENT", atomCount: 1 },
    },
    {
      id: "snap-5",
      state: { "atom-counter": { value: 2, type: "primitive" } },
      metadata: { timestamp: Date.now(), action: "DECREMENT", atomCount: 1 },
    },
  ],
  pointer: 4,

  jumpTo(index: number): boolean {
    if (index < 0 || index >= this.history.length) {
      return false;
    }
    this.pointer = index;
    return true;
  },

  getHistory() {
    return [...this.history];
  },

  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }
    this.pointer--;
    return true;
  },

  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }
    this.pointer++;
    return true;
  },

  canUndo(): boolean {
    return this.pointer > 0;
  },

  canRedo(): boolean {
    return this.pointer < this.history.length - 1;
  },

  clearHistory(): void {
    this.history = [];
    this.pointer = -1;
  },

  capture(action?: string): Snapshot | null {
    const snapshot = {
      id: `snap-${this.history.length + 1}`,
      state: {} as Record<string, SnapshotStateEntry>,
      metadata: { timestamp: Date.now(), action, atomCount: 0 },
    };

    this.pointer++;
    if (this.pointer < this.history.length) {
      this.history = this.history.slice(0, this.pointer);
    }
    this.history.push(snapshot);
    return snapshot;
  },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Empty SimpleTimeTravel instance for edge case testing
 */
export const emptyTimeTravel = {
  history: [] as Snapshot[],
  pointer: -1 as number,

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  jumpTo(_index: number): boolean {
    return false;
  },

  getHistory() {
    return [];
  },

  undo(): boolean {
    return false;
  },

  redo(): boolean {
    return false;
  },

  canUndo(): boolean {
    return false;
  },

  canRedo(): boolean {
    return false;
  },

  clearHistory(): void {},
  capture(): Snapshot | null {
    const snapshot = {
      id: `snap-${this.history.length + 1}`,
      state: {} as Record<string, SnapshotStateEntry>,
      metadata: {
        timestamp: Date.now(),
        action: "" as string | undefined,
        atomCount: 0,
      },
    };

    this.pointer++;
    if (this.pointer < this.history.length) {
      this.history = this.history.slice(0, this.pointer);
    }
    this.history.push(snapshot);
    return snapshot;
  },
};

/**
 * Non-existent action names for JUMP_TO_ACTION error testing
 */
export const nonExistentActions = [
  "NONEXISTENT_ACTION",
  "UNKNOWN",
  "RANDOM",
  "ACTION_DOES_NOT_EXIST",
];

/**
 * Expected error messages for validation failures
 */
export const errorMessages = {
  invalidIndex: (index: number) => `Invalid index: ${index}`,
  outOfBounds: (index: number, length: number) =>
    `Index ${index} out of bounds. History length: ${length}`,
  notInitialized:
    "SimpleTimeTravel not initialized. Call setTimeTravel() first.",
  unknownCommand: (type: string) => `Unknown command type: ${type}`,
  invalidActionName: "Invalid action name: must be non-empty string",
  actionNotFound: (name: string) => `Action "${name}" not found in history`,
};

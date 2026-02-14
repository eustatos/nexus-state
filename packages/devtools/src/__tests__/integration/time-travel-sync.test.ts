/**
 * Integration tests for time travel synchronization (DEV-005-B).
 * Tests time travel functionality with mock DevTools extension.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DevToolsPlugin } from "../../devtools-plugin";
import {
  setupMockDevToolsExtension,
  teardownMockDevToolsExtension,
  MockDevToolsConnection,
  createMockStore,
} from "../mocks/devtools-extension-mock";
import { createMessageCollector, waitFor } from "./test-utils";

describe("Time Travel Synchronization Integration Tests", () => {
  let mockExtension: ReturnType<typeof setupMockDevToolsExtension>;
  let mockConnection: MockDevToolsConnection | null = null;
  let plugin: DevToolsPlugin;
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    // Setup mock DevTools extension
    mockExtension = setupMockDevToolsExtension({
      autoConnect: false,
    });

    // Mock environment
    vi.stubEnv("NODE_ENV", "development");

    // Create plugin and store
    plugin = new DevToolsPlugin();
    store = createMockStore();

    plugin.apply(store as any);
    mockExtension.simulateExtensionLoad();
  });

  afterEach(() => {
    teardownMockDevToolsExtension();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("Basic Time Travel", () => {
    it("should respond to JUMP_TO_STATE command", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const messageCollector = createMessageCollector();
      mockConnection?.subscribe(messageCollector.listener);

      // Send some state updates
      const atom1 = { id: { toString: () => "atom1" } };
      const atom2 = { id: { toString: () => "atom2" } };

      store.set(atom1, 100);
      store.set(atom2, 200);
      store.set(atom1, 300);

      await waitFor(() => messageCollector.getMessages().length === 3);

      // Simulate time travel to state 1 (index 1)
      const timeTravelState = { atom1: 100, atom2: 200 };
      mockConnection?.simulateTimeTravel(timeTravelState, 1);

      // Wait for state to be updated
      await waitFor(() => store.getState().atom1 === 100);

      const finalState = store.getState();
      expect(finalState.atom1).toBe(100);
      expect(finalState.atom2).toBe(200);
    });

    it("should handle JUMP_TO_STATE with complex state", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const messageCollector = createMessageCollector();
      mockConnection?.subscribe(messageCollector.listener);

      // Create complex state
      const complexAtom = { id: { toString: () => "complex" } };
      const complexValue = {
        nested: {
          deep: [1, 2, 3],
          flag: true,
        },
        timestamp: Date.now(),
      };

      store.set(complexAtom, complexValue);

      await waitFor(() => messageCollector.getMessages().length === 1);

      // Simulate time travel with complex state
      const timeTravelState = {
        complex: {
          nested: {
            deep: [1, 2, 3, 4], // Modified state
            flag: false,
          },
          timestamp: Date.now() + 1000,
        },
      };

      mockConnection?.simulateTimeTravel(timeTravelState, 0);

      // Wait for state to be updated
      await waitFor(() => {
        const state = store.getState();
        return (
          state.complex?.nested?.deep?.length === 4 &&
          state.complex?.nested?.flag === false
        );
      });

      const finalState = store.getState();
      expect(finalState.complex.nested.deep).toEqual([1, 2, 3, 4]);
      expect(finalState.complex.nested.flag).toBe(false);
    });

    it("should preserve atom references during time travel", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Create atoms with object references
      const refAtom = { id: { toString: () => "refAtom" } };
      const sharedObject = { id: "shared", value: 42 };

      store.set(refAtom, sharedObject);

      // Simulate time travel with same reference
      const timeTravelState = { refAtom: sharedObject };
      mockConnection?.simulateTimeTravel(timeTravelState, 0);

      await waitFor(() => store.getState().refAtom === sharedObject);

      // The reference should be preserved
      expect(store.getState().refAtom).toBe(sharedObject);
      expect(store.getState().refAtom.id).toBe("shared");
      expect(store.getState().refAtom.value).toBe(42);
    });
  });

  describe("Time Travel Edge Cases", () => {
    it("should handle JUMP_TO_STATE with non-existent index", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const consoleMock = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Try to jump to non-existent state (index 999)
      mockConnection?.simulateTimeTravel({}, 999);

      // Should not crash, might log warning
      expect(() => {
        // Try to update atom after invalid time travel
        const atom = { id: { toString: () => "atom" } };
        store.set(atom, 999);
      }).not.toThrow();

      consoleMock.mockRestore();
    });

    it("should continue normal operation after time travel", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const messageCollector = createMessageCollector();
      mockConnection?.subscribe(messageCollector.listener);

      // Initial state
      const atom = { id: { toString: () => "test" } };
      store.set(atom, 1);

      await waitFor(() => messageCollector.getMessages().length === 1);
      messageCollector.clear();

      // Time travel to different state
      mockConnection?.simulateTimeTravel({ test: 100 }, 0);

      await waitFor(() => store.getState().test === 100);

      // Continue normal operations
      store.set(atom, 2);

      await waitFor(() => messageCollector.getMessages().length === 1);

      // Should send new action after time travel
      const messages = messageCollector.getMessages();
      expect(messages).toHaveLength(1);
      expect((messages[0].payload as any)?.state?.test).toBe(2);
    });

    it("should handle time travel during batch operations", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const messageCollector = createMessageCollector();
      mockConnection?.subscribe(messageCollector.listener);

      // Start batch
      plugin.startBatch("time-travel-batch");

      const atom1 = { id: { toString: () => "atom1" } };
      const atom2 = { id: { toString: () => "atom2" } };

      store.set(atom1, 10);

      // Time travel during batch
      mockConnection?.simulateTimeTravel({ atom1: 999, atom2: 999 }, 0);

      await waitFor(() => store.getState().atom1 === 999);

      // Continue batch
      store.set(atom2, 20);

      // End batch
      plugin.endBatch("time-travel-batch");

      // Should still send batched action
      await waitFor(() => messageCollector.getMessages().length > 0);

      const messages = messageCollector.getMessages();
      expect(
        ((messages[0].payload as any)?.action?.metadata as any)?.batchCount,
      ).toBe(2);
    });
  });

  describe("State Import/Export", () => {
    it("should respond to IMPORT command", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Initial state
      const atom = { id: { toString: () => "importAtom" } };
      store.set(atom, 1);

      // Simulate state import
      const importedState = {
        importAtom: 999,
        newAtom: "imported",
      };

      mockConnection?.simulateImportState(importedState);

      // Wait for state to be updated
      await waitFor(() => {
        const state = store.getState();
        return state.importAtom === 999 && state.newAtom === "imported";
      });

      const finalState = store.getState();
      expect(finalState.importAtom).toBe(999);
      expect(finalState.newAtom).toBe("imported");
    });

    it("should handle partial state import", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Set up multiple atoms
      const atom1 = { id: { toString: () => "atom1" } };
      const atom2 = { id: { toString: () => "atom2" } };
      const atom3 = { id: { toString: () => "atom3" } };

      store.set(atom1, 1);
      store.set(atom2, 2);
      store.set(atom3, 3);

      // Import partial state (only atom2)
      mockConnection?.simulateImportState({ atom2: 999 });

      await waitFor(() => store.getState().atom2 === 999);

      const finalState = store.getState();
      expect(finalState.atom1).toBe(1); // Should remain unchanged
      expect(finalState.atom2).toBe(999); // Should be updated
      expect(finalState.atom3).toBe(3); // Should remain unchanged
    });

    it("should handle import with nested state", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Import complex nested state
      const importedState = {
        user: {
          profile: {
            name: "Test User",
            email: "test@example.com",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
          tokens: ["token1", "token2", "token3"],
        },
        settings: {
          version: "1.0.0",
          features: {
            advanced: true,
            experimental: false,
          },
        },
      };

      mockConnection?.simulateImportState(importedState);

      // Wait for state to be imported
      await waitFor(() => {
        const state = store.getState();
        return (
          state.user?.profile?.name === "Test User" &&
          state.settings?.version === "1.0.0"
        );
      });

      const finalState = store.getState();
      expect(finalState.user.profile.name).toBe("Test User");
      expect(finalState.user.profile.preferences.theme).toBe("dark");
      expect(finalState.user.tokens).toEqual(["token1", "token2", "token3"]);
      expect(finalState.settings.features.advanced).toBe(true);
      expect(finalState.settings.features.experimental).toBe(false);
    });
  });

  describe("Time Travel with Serialization", () => {
    it("should handle time travel with serialized state", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Mock serializeState to return custom format
      const serializedState = {
        serialized: true,
        version: "1.0",
        data: {
          atom1: {
            value: 100,
            metadata: { timestamp: Date.now() },
          },
          atom2: {
            value: { nested: "object" },
            metadata: { timestamp: Date.now() },
          },
        },
      };

      store.serializeState = vi.fn().mockReturnValue(serializedState);

      // Time travel with serialized state format
      const timeTravelState = {
        atom1: 200,
        atom2: { nested: "updated" },
      };

      mockConnection?.simulateTimeTravel(timeTravelState, 0);

      await waitFor(() => store.getState().atom1 === 200);

      const finalState = store.getState();
      expect(finalState.atom1).toBe(200);
      expect(finalState.atom2).toEqual({ nested: "updated" });
    });

    it("should preserve serialization during time travel", async () => {
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Track serializeState calls
      const serializeSpy = vi.spyOn(store, "serializeState");

      // Do some updates
      const atom = { id: { toString: () => "serializeAtom" } };
      store.set(atom, 1);

      // Time travel
      mockConnection?.simulateTimeTravel({ serializeAtom: 2 }, 0);

      await waitFor(() => store.getState().serializeAtom === 2);

      // serializeState should still work after time travel
      const serialized = store.serializeState();
      expect(serialized).toBeDefined();
      expect(serializeSpy).toHaveBeenCalled();
    });
  });
});

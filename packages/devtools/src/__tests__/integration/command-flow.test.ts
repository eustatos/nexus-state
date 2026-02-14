import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DevToolsPlugin } from "../../devtools-plugin";
import {
  setupMockDevToolsExtension,
  teardownMockDevToolsExtension,
  MockDevToolsConnection,
  createMockStore,
} from "../mocks/devtools-extension-mock";
import { createMessageCollector, waitFor } from "./test-utils";

describe("DevTools Command Flow Integration Tests", () => {
  let mockExtension: ReturnType<typeof setupMockDevToolsExtension>;
  let mockConnection: MockDevToolsConnection | null = null;

  beforeEach(() => {
    // Setup mock DevTools extension
    mockExtension = setupMockDevToolsExtension({
      autoConnect: false,
    });

    // Mock environment
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    teardownMockDevToolsExtension();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("Basic Command Flow", () => {
    it("should establish connection with DevTools extension", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      plugin.apply(store as any);

      // Connection should be established
      expect(mockExtension.getConnection()).toBeNull(); // Not yet connected

      // Simulate extension loading
      mockExtension.simulateExtensionLoad();

      // Plugin should now connect
      await waitFor(() => mockExtension.getConnection() !== null);

      mockConnection = mockExtension.getConnection();
      expect(mockConnection).toBeDefined();
      expect(mockConnection?.isConnected()).toBe(true);
    });

    it("should send INIT message when connection is established", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore({ atom1: 42 });

      plugin.apply(store as any);
      mockExtension.simulateExtensionLoad();

      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // INIT should be called with initial state
      await waitFor(() => mockConnection?.wasInitCalled() === true);

      expect(mockConnection?.wasInitCalled()).toBe(true);
    });

    it("should send ACTION messages when atoms are updated", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      plugin.apply(store as any);
      mockExtension.simulateExtensionLoad();

      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const messageCollector = createMessageCollector();
      mockConnection?.subscribe(messageCollector.listener);

      // Update an atom
      const mockAtom = { id: { toString: () => "testAtom" } };
      store.set(mockAtom, 100);

      // Wait for message
      await messageCollector.waitForMessage("ACTION");

      const messages = messageCollector.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe("ACTION");
      expect((messages[0].payload as any)?.action?.type).toBe("testAtom/SET");
      expect((messages[0].payload as any)?.state?.testAtom).toBe(100);
    });
  });

  describe("Command Error Handling", () => {
    it("should handle DevTools extension disconnect gracefully", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      plugin.apply(store as any);
      mockExtension.simulateExtensionLoad();

      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Simulate extension disconnect
      mockConnection?.disconnect();

      // Should not throw when sending after disconnect
      const mockAtom = { id: { toString: () => "testAtom" } };
      expect(() => store.set(mockAtom, 200)).not.toThrow();

      // Reconnect should work
      mockExtension.simulateExtensionLoad();
      await waitFor(
        () => mockExtension.getConnection()?.isConnected() === true,
      );

      // Should be able to send again
      expect(() => store.set(mockAtom, 300)).not.toThrow();
    });

    it("should handle send failures gracefully", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      plugin.apply(store as any);

      // Create connection that will fail sends
      const failingConnection = mockExtension.connect({
        shouldFailSend: true,
      });

      const mockAtom = { id: { toString: () => "testAtom" } };

      // Should not throw even though send fails
      expect(() => store.set(mockAtom, 400)).not.toThrow();

      // Should have attempted to send
      expect(failingConnection.getSentMessages()).toHaveLength(1);
    });

    it("should handle missing DevTools extension", () => {
      // Remove extension
      teardownMockDevToolsExtension();

      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      // Should not throw when applying plugin without extension
      expect(() => plugin.apply(store as any)).not.toThrow();

      // Should not throw when updating atoms
      const mockAtom = { id: { toString: () => "testAtom" } };
      expect(() => store.set(mockAtom, 500)).not.toThrow();
    });
  });

  describe("Batch Command Flow", () => {
    it("should batch multiple atom updates into single action", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      plugin.apply(store as any);
      mockExtension.simulateExtensionLoad();

      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const messageCollector = createMessageCollector();
      mockConnection?.subscribe(messageCollector.listener);

      // Start a batch
      plugin.startBatch("batch-1");

      // Update multiple atoms
      const atom1 = { id: { toString: () => "atom1" } };
      const atom2 = { id: { toString: () => "atom2" } };
      const atom3 = { id: { toString: () => "atom3" } };

      store.set(atom1, 10);
      store.set(atom2, 20);
      store.set(atom3, 30);

      // End batch
      plugin.endBatch("batch-1");

      // Wait for batched message
      await waitFor(() => messageCollector.getMessages().length > 0);

      const messages = messageCollector.getMessages();
      expect(messages).toHaveLength(1); // Should be single batched action

      const action = (messages[0].payload as any)?.action;
      expect(action.type).toContain("Batch");
      expect(action.metadata.batchCount).toBe(3);
      expect(action.metadata.atomNames).toEqual(["atom1", "atom2", "atom3"]);
    });

    it("should handle nested batches correctly", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      plugin.apply(store as any);
      mockExtension.simulateExtensionLoad();

      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const messageCollector = createMessageCollector();
      mockConnection?.subscribe(messageCollector.listener);

      // Start outer batch
      plugin.startBatch("outer");

      const atom1 = { id: { toString: () => "atom1" } };
      store.set(atom1, 1);

      // Start inner batch
      plugin.startBatch("inner");

      const atom2 = { id: { toString: () => "atom2" } };
      store.set(atom2, 2);

      // End inner batch
      plugin.endBatch("inner");

      const atom3 = { id: { toString: () => "atom3" } };
      store.set(atom3, 3);

      // End outer batch
      plugin.endBatch("outer");

      await waitFor(() => messageCollector.getMessages().length >= 2);

      const messages = messageCollector.getMessages();
      expect(messages).toHaveLength(2); // Inner batch and outer batch

      // Check inner batch
      const innerAction = (messages[0].payload as any)?.action;
      expect(innerAction.metadata.batchGroupId).toBe("inner");
      expect(innerAction.metadata.batchCount).toBe(1);

      // Check outer batch
      const outerAction = (messages[1].payload as any)?.action;
      expect(outerAction.metadata.batchGroupId).toBe("outer");
      expect(outerAction.metadata.batchCount).toBe(2); // atom1 and atom3
    });
  });

  describe("Performance and Timing", () => {
    it("should handle rapid successive updates", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      plugin.apply(store as any);
      mockExtension.simulateExtensionLoad();

      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      const messageCollector = createMessageCollector();
      mockConnection?.subscribe(messageCollector.listener);

      // Send 50 rapid updates
      const updates = 50;
      const mockAtom = { id: { toString: () => "rapidAtom" } };

      for (let i = 0; i < updates; i++) {
        store.set(mockAtom, i);
      }

      // Wait for all messages
      await waitFor(
        () => messageCollector.getMessages().length >= updates,
        2000,
      );

      const messages = messageCollector.getMessages();
      expect(messages).toHaveLength(updates);

      // Verify all messages are in order
      messages.forEach((msg, index) => {
        expect((msg.payload as any)?.state?.rapidAtom).toBe(index);
      });
    });

    it("should not block store operations when DevTools is slow", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      plugin.apply(store as any);

      // Create connection with artificial delay
      const slowConnection = mockExtension.connect({
        delayMs: 100, // 100ms delay per message
      });

      const messageCollector = createMessageCollector();
      slowConnection.subscribe(messageCollector.listener);

      // Send multiple updates - store operations should not wait for DevTools
      const startTime = Date.now();
      const mockAtom = { id: { toString: () => "slowAtom" } };

      for (let i = 0; i < 5; i++) {
        store.set(mockAtom, i);
      }

      const storeTime = Date.now() - startTime;

      // Store operations should complete quickly (not waiting for 100ms delays)
      expect(storeTime).toBeLessThan(50);

      // Messages should still arrive eventually
      await waitFor(() => messageCollector.getMessages().length === 5, 600);
    });
  });
});

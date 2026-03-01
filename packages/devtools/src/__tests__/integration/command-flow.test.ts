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
    mockExtension = setupMockDevToolsExtension({ autoConnect: false });
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
      
      // Apply plugin first (will create connection if extension exists)
      plugin.apply(store as any);
      // Then simulate extension load (creates new connection)
      mockExtension.simulateExtensionLoad();
      
      await waitFor(() => mockExtension.getConnection() !== null);

      mockConnection = mockExtension.getConnection();
      expect(mockConnection).toBeDefined();
      expect(mockConnection?.isConnected()).toBe(true);
    });

    it("should send INIT message when connection is established", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore({ atom1: 42 });

      // Apply plugin first, then simulate extension load
      plugin.apply(store as any);
      
      // Check how many connections before simulateExtensionLoad
      const connectionsBefore = mockExtension.getAllConnections().length;
      
      mockExtension.simulateExtensionLoad();
      
      // Check how many connections after simulateExtensionLoad
      const connectionsAfter = mockExtension.getAllConnections().length;
      
      // Wait for connection to be established
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Wait for INIT message to be sent (increase timeout to 500ms)
      await waitFor(() => mockConnection?.wasInitCalled() === true, 500);
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

      const mockAtom = { id: { toString: () => "testAtom" } };
      store.set(mockAtom, 100);

      await messageCollector.waitForMessage("ACTION");

      const messages = messageCollector.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe("ACTION");
      expect((messages[0].payload as any)?.action?.type).toBe("testAtom SET");
      const payloadState = (messages[0].payload as any)?.state;
      expect(payloadState?.state?.testAtom).toBe(100);
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

      plugin.startBatch("batch-1");

      const atom1 = { id: { toString: () => "atom1" } };
      const atom2 = { id: { toString: () => "atom2" } };
      const atom3 = { id: { toString: () => "atom3" } };

      store.set(atom1, 10);
      store.set(atom2, 20);
      store.set(atom3, 30);

      plugin.endBatch("batch-1");
      plugin.flushBatch();

      await waitFor(() => messageCollector.getMessages().length > 0, 50);

      const action = (messageCollector.getMessages()[0].payload as any)?.action;
      expect(action.type).toContain("Batch");
    });
  });

  describe("Error Handling", () => {
    it("should handle send failures gracefully", async () => {
      const plugin = new DevToolsPlugin();
      const store = createMockStore();

      mockExtension.simulateExtensionLoad();
      plugin.apply(store as any);
      await waitFor(() => mockExtension.getConnection() !== null);
      mockConnection = mockExtension.getConnection();

      // Disconnect and verify no error on subsequent updates
      mockConnection?.disconnect();
      const mockAtom = { id: { toString: () => "testAtom" } };
      expect(() => store.set(mockAtom, 400)).not.toThrow();
    });
  });
});

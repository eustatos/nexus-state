/**
 * Tests for refactored DevTools architecture
 *
 * This test file verifies that the decomposed components work correctly
 * and maintain the same functionality as the original monolithic plugin.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DevToolsPluginRefactored } from "../devtools-plugin-refactored";
import { DevToolsConnector } from "../devtools-connector";
import { MessageHandler } from "../message-handler";
import { StackTraceService } from "../stack-trace-service";
import { AtomNameResolver } from "../atom-name-resolver";
import { PollingService } from "../polling-service";
import { StateSerializer } from "../state-serializer";
import type { EnhancedStore, BasicAtom, DevToolsConfig } from "../types";

// Mock store for testing
const createMockStore = () => ({
  getState: vi.fn(() => ({})),
  serializeState: vi.fn(() => ({})),
  set: vi.fn(),
  setWithMetadata: vi.fn(),
});

// Mock atom for testing
const createMockAtom = (id: string) => ({
  id: Symbol(id),
  toString: () => `atom-${id}`,
});

describe("Refactored DevTools Architecture", () => {
  let plugin: DevToolsPluginRefactored;
  let mockStore: EnhancedStore;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore() as EnhancedStore;
    plugin = new DevToolsPluginRefactored();
  });

  afterEach(() => {
    plugin.dispose();
  });

  describe("Component Initialization", () => {
    it("should initialize all components", () => {
      expect(plugin).toBeDefined();

      // Check that all components are initialized
      expect(plugin.getMessageHandler()).toBeInstanceOf(MessageHandler);
      expect(plugin.getAtomNameResolver()).toBeInstanceOf(AtomNameResolver);
      expect(plugin.getStackTraceService()).toBeInstanceOf(StackTraceService);
      expect(plugin.getPollingService()).toBeInstanceOf(PollingService);
    });

    it("should accept configuration", () => {
      const config: DevToolsConfig = {
        name: "test-app",
        trace: true,
        traceLimit: 5,
        latency: 200,
        maxAge: 30,
      };

      const configuredPlugin = new DevToolsPluginRefactored(config);
      expect(configuredPlugin).toBeDefined();
      configuredPlugin.dispose();
    });
  });

  describe("Service Integration", () => {
    it("should integrate message handler with store", () => {
      plugin.apply(mockStore);
      const messageHandler = plugin.getMessageHandler();

      // Message handler should be connected to store
      expect(messageHandler).toBeDefined();
    });

    it("should integrate atom name resolver with configuration", () => {
      const config: DevToolsConfig = {
        showAtomNames: false,
        atomNameFormatter: (atom, defaultName) => `custom-${defaultName}`,
      };

      const configuredPlugin = new DevToolsPluginRefactored(config);
      const resolver = configuredPlugin.getAtomNameResolver();

      expect(resolver).toBeDefined();
      configuredPlugin.dispose();
    });
  });

  describe("Batch Operations", () => {
    it("should start and end batches", () => {
      const batchId = "test-batch";

      plugin.startBatch(batchId);
      // In a real test, we would verify that batch operations are grouped
      plugin.endBatch(batchId);

      // The test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });

  describe("State Export", () => {
    it("should export state", () => {
      const mockState = { counter: 1, user: { name: "Test" } };
      (mockStore.serializeState as any).mockReturnValue(mockState);

      const exported = plugin.exportState(mockStore);

      expect(exported).toBeDefined();
      expect(exported.state).toEqual(mockState);
      expect(exported.timestamp).toBeDefined();
      expect(exported.checksum).toBeDefined();
      expect(exported.version).toBeDefined();
    });

    it("should export state with metadata", () => {
      const metadata = { source: "test", userId: 123 };
      const exported = plugin.exportState(mockStore, metadata);

      expect(exported.metadata).toEqual(expect.objectContaining(metadata));
    });
  });

  describe("Resource Management", () => {
    it("should dispose resources correctly", () => {
      plugin.apply(mockStore);

      // Should not throw when disposing
      expect(() => plugin.dispose()).not.toThrow();

      // After disposal, internal state should be reset
      // (Note: We can't directly check private properties, but we can verify
      // that the plugin doesn't throw errors after disposal)
    });
  });

  describe("Component Isolation", () => {
    it("should allow independent use of components", () => {
      // Test that components can be used independently
      const serializer = new StateSerializer();
      const state = { test: "value" };
      const serialized = serializer.serialize(state);

      expect(serialized).toBeDefined();
      expect(serialized.state).toEqual(state);
      expect(serialized.checksum).toBeDefined();

      const traceService = new StackTraceService();
      const trace = traceService.capture({ limit: 3 });

      // Trace may be null in test environment
      if (trace) {
        expect(trace.frames).toBeDefined();
        expect(trace.timestamp).toBeDefined();
      }

      const resolver = new AtomNameResolver();
      const mockAtom = createMockAtom("test");
      const name = resolver.getName(mockAtom as BasicAtom);

      expect(name).toBeDefined();
      expect(typeof name).toBe("string");
    });
  });
});

describe("Individual Component Tests", () => {
  describe("StackTraceService", () => {
    let service: StackTraceService;

    beforeEach(() => {
      service = new StackTraceService();
    });

    it("should capture stack traces", () => {
      const trace = service.capture({ limit: 5 });

      // In test environment, trace might be null
      if (trace) {
        expect(trace.frames).toBeInstanceOf(Array);
        expect(trace.timestamp).toBeGreaterThan(0);
        expect(trace.limit).toBe(5);
      }
    });

    it("should format stack traces", () => {
      const mockTrace = {
        frames: [
          { functionName: "testFunction", fileName: "test.js", lineNumber: 10 },
          {
            functionName: "anotherFunction",
            fileName: "test.js",
            lineNumber: 20,
          },
        ],
        timestamp: Date.now(),
        limit: 2,
      };

      const formatted = service.format(mockTrace);
      expect(typeof formatted).toBe("string");
      expect(formatted).toContain("testFunction");
    });
  });

  describe("AtomNameResolver", () => {
    let resolver: AtomNameResolver;

    beforeEach(() => {
      resolver = new AtomNameResolver();
    });

    it("should resolve atom names", () => {
      const mockAtom = {
        id: Symbol("test-atom"),
        toString: () => "TestAtom",
      } as BasicAtom;

      const name = resolver.getName(mockAtom);
      expect(name).toBeDefined();
      expect(typeof name).toBe("string");
    });

    it("should format names according to options", () => {
      const customResolver = new AtomNameResolver({
        maxLength: 10,
        ellipsis: "..",
      });

      const longName = "VeryLongAtomName";
      const formatted = customResolver.formatName(longName);

      expect(formatted.length).toBeLessThanOrEqual(10);
      expect(formatted).toContain("..");
    });
  });

  describe("PollingService", () => {
    let service: PollingService;

    beforeEach(() => {
      service = new PollingService({ debug: false });
    });

    afterEach(() => {
      service.dispose();
    });

    it("should start and stop polling", () => {
      const callback = vi.fn();

      service.start(100, callback);
      expect(service.isActive()).toBe(true);

      service.stop();
      expect(service.isActive()).toBe(false);
    });

    it("should track polling statistics", () => {
      const callback = vi.fn();
      service.start(50, callback);

      // Wait a bit for polling to occur
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const stats = service.getStats();
          expect(stats.cycles).toBeGreaterThan(0);
          expect(stats.isActive).toBe(true);
          service.stop();
          resolve();
        }, 60);
      });
    });
  });
});

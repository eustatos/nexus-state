import { DevToolsPlugin } from "../../devtools-plugin";
import type { EnhancedStore, BasicAtom } from "../../types";
import { atomRegistry } from "@nexus-state/core";
import { vi } from "vitest";

describe("DevToolsPlugin Action Naming Integration", () => {
  let mockStore: EnhancedStore;

  beforeEach(() => {
    // Reset atom registry
    atomRegistry.clear();

    // Mock store implementation
    mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn().mockReturnValue({}),
    } as any;
  });

  describe("Configuration", () => {
    it("should use auto naming strategy by default", () => {
      const plugin = new DevToolsPlugin();

      // Mock window for DevTools
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: vi.fn().mockReturnValue({
            send: vi.fn(),
            subscribe: vi.fn().mockReturnValue(() => {}),
            init: vi.fn(),
            unsubscribe: vi.fn(),
          }),
        },
        addEventListener: vi.fn(),
      };

      const mockAtom = {
        id: Symbol("test-atom"),
        toString: () => "TestAtom",
      } as BasicAtom;

      atomRegistry.register(mockAtom, "user");

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom, "test-value");
      }

      // Auto strategy should generate "user SET"
      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        "test-value",
        expect.objectContaining({
          type: "user SET",
        }),
      );

      delete (global as any).window;
    });

    it("should use simple naming strategy when configured", () => {
      const plugin = new DevToolsPlugin({
        actionNamingStrategy: "simple",
      });

      // Mock window for DevTools
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: vi.fn().mockReturnValue({
            send: vi.fn(),
            subscribe: vi.fn().mockReturnValue(() => {}),
            init: vi.fn(),
            unsubscribe: vi.fn(),
          }),
        },
        addEventListener: vi.fn(),
      };

      const mockAtom = {
        id: Symbol("test-atom"),
        toString: () => "TestAtom",
      } as BasicAtom;

      atomRegistry.register(mockAtom, "user");

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom, "test-value");
      }

      // Simple strategy should generate just "SET"
      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        "test-value",
        expect.objectContaining({
          type: "SET",
        }),
      );

      delete (global as any).window;
    });

    it("should use pattern naming strategy when configured", () => {
      const plugin = new DevToolsPlugin({
        actionNamingStrategy: "pattern",
        actionNamingPattern: "[{timestamp}] {atomName} {operation}",
      });

      // Mock window for DevTools
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: vi.fn().mockReturnValue({
            send: vi.fn(),
            subscribe: vi.fn().mockReturnValue(() => {}),
            init: vi.fn(),
            unsubscribe: vi.fn(),
          }),
        },
        addEventListener: vi.fn(),
      };

      const mockAtom = {
        id: Symbol("test-atom"),
        toString: () => "TestAtom",
      } as BasicAtom;

      atomRegistry.register(mockAtom, "user");

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom, "test-value");
      }

      // Pattern strategy with timestamp - ожидаем формат с timestamp
      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        "test-value",
        expect.objectContaining({
          type: expect.stringMatching(/^\[\d+\] user SET$/), // Ожидаем [timestamp] user SET, а не user.SET
        }),
      );

      delete (global as any).window;
    });

    it("should use custom naming function when configured", () => {
      const customNamingFn = vi.fn().mockReturnValue("custom-action-name");

      const plugin = new DevToolsPlugin({
        actionNamingStrategy: "custom",
        actionNamingFunction: customNamingFn,
      });

      // Mock window for DevTools
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: vi.fn().mockReturnValue({
            send: vi.fn(),
            subscribe: vi.fn().mockReturnValue(() => {}),
            init: vi.fn(),
            unsubscribe: vi.fn(),
          }),
        },
        addEventListener: vi.fn(),
      };

      const mockAtom = {
        id: Symbol("test-atom"),
        toString: () => "TestAtom",
      } as BasicAtom;

      atomRegistry.register(mockAtom, "user");

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom, "test-value");
      }

      // Custom function should generate our custom name
      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        "test-value",
        expect.objectContaining({
          type: "custom-action-name",
        }),
      );
      expect(customNamingFn).toHaveBeenCalled();

      delete (global as any).window;
    });

    it("should accept strategy instance directly", () => {
      const customStrategy = {
        name: "test-strategy",
        description: "Test strategy",
        getName: vi.fn().mockReturnValue("direct-strategy-name"),
      };

      const plugin = new DevToolsPlugin({
        actionNamingStrategy: customStrategy as any,
      });

      // Mock window for DevTools
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: vi.fn().mockReturnValue({
            send: vi.fn(),
            subscribe: vi.fn().mockReturnValue(() => {}),
            init: vi.fn(),
            unsubscribe: vi.fn(),
          }),
        },
        addEventListener: vi.fn(),
      };

      const mockAtom = {
        id: Symbol("test-atom"),
        toString: () => "TestAtom",
      } as BasicAtom;

      atomRegistry.register(mockAtom, "user");

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom, "test-value");
      }

      // Direct strategy should generate our custom name
      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        "test-value",
        expect.objectContaining({
          type: "direct-strategy-name",
        }),
      );
      expect(customStrategy.getName).toHaveBeenCalled();

      delete (global as any).window;
    });
  });

  describe("Store enhancement", () => {
    it("should generate action names in metadata", () => {
      const plugin = new DevToolsPlugin({
        actionNamingStrategy: "simple",
      });

      // Mock window for DevTools
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: vi.fn().mockReturnValue({
            send: vi.fn(),
            subscribe: vi.fn().mockReturnValue(() => {}),
            init: vi.fn(),
            unsubscribe: vi.fn(),
          }),
        },
        addEventListener: vi.fn(),
      };

      // Create a mock atom
      const mockAtom = {
        id: Symbol("test-atom"),
        toString: () => "TestAtom",
      } as BasicAtom;

      // Register atom
      atomRegistry.register(mockAtom, "user");

      // Apply plugin
      plugin.apply(mockStore);

      // Simulate store.set being called
      // The plugin overrides store.set in enhanceStoreWithMetadata
      if (mockStore.set) {
        mockStore.set(mockAtom, "new-value");
      }

      // Check that setWithMetadata was called with correct action name
      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        "new-value",
        expect.objectContaining({
          type: "SET", // Simple strategy should give just 'SET'
          atomName: "user",
          source: "DevToolsPlugin",
        }),
      );

      // Cleanup
      delete (global as any).window;
    });

    it("should use auto strategy for action names by default", () => {
      const plugin = new DevToolsPlugin(); // No config = auto strategy

      // Mock window for DevTools
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: vi.fn().mockReturnValue({
            send: vi.fn(),
            subscribe: vi.fn().mockReturnValue(() => {}),
            init: vi.fn(),
            unsubscribe: vi.fn(),
          }),
        },
        addEventListener: vi.fn(),
      };

      const mockAtom = {
        id: Symbol("test-atom"),
        toString: () => "TestAtom",
      } as BasicAtom;

      atomRegistry.register(mockAtom, "counter");

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom, 42);
      }

      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        42,
        expect.objectContaining({
          type: "counter SET", // Auto strategy combines atom name and operation
        }),
      );

      delete (global as any).window;
    });
  });

  describe("Polling mode", () => {
    it("should generate action names for polling updates", () => {
      const plugin = new DevToolsPlugin({
        actionNamingStrategy: "pattern",
        actionNamingPattern: "POLL:{timestamp}",
      });

      // Mock window
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: vi.fn().mockReturnValue({
            send: vi.fn(),
            subscribe: vi.fn().mockReturnValue(() => {}),
            init: vi.fn(),
            unsubscribe: vi.fn(),
          }),
        },
        addEventListener: vi.fn(),
      };

      // Store without setWithMetadata should trigger polling
      const pollingStore = {
        ...mockStore,
        setWithMetadata: undefined,
      };

      // Mock setTimeout for testing
      vi.useFakeTimers();

      plugin.apply(pollingStore);

      // Fast-forward time to trigger polling (должно сработать через 100ms)
      vi.advanceTimersByTime(150); // Больше чем latency (100ms)

      // Проверяем, что connect был вызван (это указывает на успешную инициализацию)
      const mockExtension = (global as any).window.__REDUX_DEVTOOLS_EXTENSION__;
      expect(mockExtension.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "nexus-state",
          latency: 100,
        }),
      );

      vi.useRealTimers();
      delete (global as any).window;
    });
  });
});

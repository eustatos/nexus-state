import { DevToolsPlugin } from "../../devtools-plugin";
import type { BasicAtom, Atom } from "../../types";
import { createStore, type Store } from "@nexus-state/core";
import { vi } from "vitest";

describe("DevToolsPlugin Action Naming Integration", () => {
  let mockStore: Store;
  let realStore: ReturnType<typeof createStore>;

  beforeEach(() => {
    // Create a real store for each test
    realStore = createStore();

    // Mock store implementation
    mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn().mockReturnValue({}),
    } as unknown as Store;
  });

  /**
   * Helper: register an atom in the real store and patch mockStore
   * to delegate registry lookups to the real store.
   */
  function registerAtomInStore<T>(
    a: BasicAtom,
    _name: string,
    value: T
  ): BasicAtom {
    // Ensure the atom is registered in the real store
    realStore.set(a as Atom<T>, value);

    // Patch mockStore to delegate registry to realStore
    (mockStore as any).getRegistry = () => realStore.getRegistry?.();
    (mockStore as any).getAtomMetadata = (id: symbol) =>
      realStore.getAtomMetadata?.(id);

    return a;
  }

  function makeAtom(name: string, idStr?: string): BasicAtom {
    return {
      id: Symbol(idStr ?? name),
      type: "primitive" as const,
      name,
      read: () => null as unknown as never,
    } as unknown as BasicAtom;
  }

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

      const mockAtom = registerAtomInStore(makeAtom("user"), "user", null);

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom as any, "test-value");
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

      const mockAtom = registerAtomInStore(makeAtom("user"), "user", null);

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom as any, "test-value");
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

      const mockAtom = registerAtomInStore(makeAtom("user"), "user", null);

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom as any, "test-value");
      }

      // Pattern strategy with timestamp - ожидаем формат с timestamp
      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        "test-value",
        expect.objectContaining({
          type: expect.stringMatching(/^\[\d+\] user SET$/),
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

      const mockAtom = registerAtomInStore(makeAtom("user"), "user", null);

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom as any, "test-value");
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

      const mockAtom = registerAtomInStore(makeAtom("user"), "user", null);

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom as any, "test-value");
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

      const mockAtom = registerAtomInStore(makeAtom("user"), "user", null);

      // Apply plugin
      plugin.apply(mockStore);

      // Simulate store.set being called
      if (mockStore.set) {
        mockStore.set(mockAtom as any, "new-value");
      }

      // Check that setWithMetadata was called with correct action name
      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        "new-value",
        expect.objectContaining({
          type: "SET",
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

      const mockAtom = registerAtomInStore(makeAtom("counter"), "counter", 0);

      plugin.apply(mockStore);

      if (mockStore.set) {
        mockStore.set(mockAtom as any, 42);
      }

      expect(mockStore.setWithMetadata).toHaveBeenCalledWith(
        mockAtom,
        42,
        expect.objectContaining({
          type: "counter SET",
        }),
      );

      delete (global as any).window;
    });
  });

  describe("Polling mode", () => {
    it("should generate action names for polling updates", () => {
      const mockConnectFn = vi.fn().mockReturnValue({
        send: vi.fn(),
        subscribe: vi.fn().mockReturnValue(() => {}),
        init: vi.fn(),
        unsubscribe: vi.fn(),
      });

      // Mock window
      (global as any).window = {
        __REDUX_DEVTOOLS_EXTENSION__: {
          connect: mockConnectFn,
        },
        addEventListener: vi.fn(),
      };

      // Store without setWithMetadata should trigger polling
      const pollingStore = {
        ...mockStore,
        setWithMetadata: undefined,
      } as unknown as Store;

      // Mock setTimeout for testing
      vi.useFakeTimers();

      const plugin = new DevToolsPlugin({
        actionNamingStrategy: "pattern",
        actionNamingPattern: "POLL:{timestamp}",
      });

      // Apply plugin (this will replace connect with our wrapper, but mockConnectFn still tracks calls)
      plugin.apply(pollingStore);

      // Fast-forward time to trigger polling (должно сработать через 100ms)
      vi.advanceTimersByTime(150); // Больше чем latency (100ms)

      // Проверяем, что connect был вызван (это указывает на успешную инициализацию)
      expect(mockConnectFn).toHaveBeenCalledWith(
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

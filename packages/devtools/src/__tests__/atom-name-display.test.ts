import { DevToolsPlugin } from "../devtools-plugin";
import type { BasicAtom } from "../types";
import { createStore, atom, Atom, type Store } from "@nexus-state/core";
import { vi } from "vitest";

describe("DevToolsPlugin Atom Name Display", () => {
  let realStore: ReturnType<typeof createStore>;
  let mockStore: Store;

  beforeEach(() => {
    realStore = createStore();
    mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn().mockReturnValue({}),
    } as unknown as Store;
  });

  function registerAtomInStore<T>(
    a: BasicAtom,
    _name: string,
    value: T
  ): BasicAtom {
    realStore.set(a as Atom<T>, value);
    (mockStore as any).getRegistry = () => realStore.getRegistry?.();
    (mockStore as any).getAtomMetadata = (id: symbol) =>
      realStore.getAtomMetadata?.(id);
    return a;
  }

  function makeAtom(name: string): BasicAtom {
    return {
      id: Symbol(name),
      type: "primitive" as const,
      name,
      read: () => null as unknown as never,
    } as unknown as BasicAtom;
  }

  it("should display atom names when showAtomNames is enabled", () => {
    const atomObj = registerAtomInStore(makeAtom("TestAtom"), "TestAtom", null);
    const plugin = new DevToolsPlugin({ showAtomNames: true });

    const getAtomName = (
      plugin as unknown as { getAtomName: (a: BasicAtom) => string }
    ).getAtomName.bind(plugin);

    // Need to apply plugin so currentStore is set for registry lookups
    plugin.apply(mockStore);
    const name = getAtomName(atomObj);

    expect(name).toBe("TestAtom");
  });

  it("should use atom toString method when showAtomNames is disabled", () => {
    const atomObj: BasicAtom = {
      id: Symbol("test-atom"),
      type: "primitive" as const,
      name: undefined,
      read: () => null as unknown as never,
      toString: () => "Atom(test-atom)",
    } as unknown as BasicAtom;
    const plugin = new DevToolsPlugin({ showAtomNames: false });

    const getAtomName = (
      plugin as unknown as { getAtomName: (a: BasicAtom) => string }
    ).getAtomName.bind(plugin);
    const name = getAtomName(atomObj);

    expect(name).toBe("Atom(test-atom)");
  });

  it("should use custom atom name formatter when provided", () => {
    const atomObj = registerAtomInStore(makeAtom("TestAtom"), "TestAtom", null);
    const formatter = vi.fn().mockReturnValue("CustomName");
    const plugin = new DevToolsPlugin({
      showAtomNames: true,
      atomNameFormatter: formatter,
    });

    plugin.apply(mockStore);
    const getAtomName = (
      plugin as unknown as { getAtomName: (a: BasicAtom) => string }
    ).getAtomName.bind(plugin);
    const name = getAtomName(atomObj);

    expect(name).toBe("CustomName");
    expect(formatter).toHaveBeenCalledWith(atomObj, "TestAtom");
  });

  it("should provide fallback name for unregistered atoms", () => {
    const atomObj: BasicAtom = {
      id: Symbol("test-atom"),
      type: "primitive" as const,
      name: undefined,
      read: () => null as unknown as never,
    } as unknown as BasicAtom;
    const plugin = new DevToolsPlugin({ showAtomNames: true });

    plugin.apply(mockStore);
    const getAtomName = (
      plugin as unknown as { getAtomName: (a: BasicAtom) => string }
    ).getAtomName.bind(plugin);
    const name = getAtomName(atomObj);

    // Fallback: uses atom.id.toString() → "test-atom" (stripped from Symbol)
    expect(name).toBe("test-atom");
  });

  it("should handle error in atom name resolution", () => {
    const atomObj: BasicAtom = {
      id: Symbol("test"),
      type: "primitive" as const,
      name: undefined,
      read: () => null as unknown as never,
      toString: () => "Atom(test)",
    } as unknown as BasicAtom;

    const plugin = new DevToolsPlugin({ showAtomNames: true });
    plugin.apply(mockStore);

    const getAtomName = (
      plugin as unknown as { getAtomName: (a: BasicAtom) => string }
    ).getAtomName.bind(plugin);
    const name = getAtomName(atomObj);

    // Fallback: uses atom.name (undefined) → atom.id.toString() → "test"
    expect(name).toBe("test");
  });

  it("should include atom name in metadata when setWithMetadata is used", () => {
    const atomObj = registerAtomInStore(makeAtom("TestAtom"), "TestAtom", null);
    const plugin = new DevToolsPlugin({ showAtomNames: true });

    // Mock DevTools connection
    const mockConnection = {
      send: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
      init: vi.fn(),
      unsubscribe: vi.fn(),
    };

    const originalWindow = global.window;
    global.window = {
      ...global.window,
      addEventListener: vi.fn(),
      __REDUX_DEVTOOLS_EXTENSION__: {
        connect: vi.fn().mockReturnValue(mockConnection),
      },
    } as Window & {
      __REDUX_DEVTOOLS_EXTENSION__?: {
        connect: (options: {
          name?: string;
          trace?: boolean;
          latency?: number;
          maxAge?: number;
        }) => unknown;
      };
    };

    const store = {
      get: vi.fn(),
      set: null,
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn(),
    };

    plugin.apply(store as unknown as Store);

    store.set(atomObj, "test-value");

    expect(store.setWithMetadata).toHaveBeenCalledWith(
      atomObj,
      "test-value",
      expect.objectContaining({
        type: "TestAtom SET",
        atomName: "TestAtom",
      }),
    );

    global.window = originalWindow;
  });
});

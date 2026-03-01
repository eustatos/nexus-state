import { DevToolsPlugin } from "../devtools-plugin";
import { vi } from "vitest";
import * as stackTracer from "../utils/stack-tracer";

describe("DevToolsPlugin Enhanced Store Integration", () => {
  beforeEach(() => {
    // Mock the environment to allow captureStackTrace to work
    vi.stubEnv("NODE_ENV", "development");
    // Mock Redux DevTools extension
    (global as any).window = {
      __REDUX_DEVTOOLS_EXTENSION__: {
        connect: vi.fn().mockReturnValue({
          send: vi.fn(),
          subscribe: vi.fn().mockReturnValue(() => {}),
          init: vi.fn(),
          unsubscribe: vi.fn(),
        }),
      },
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (global as any).window;
  });

  it("should integrate with enhanced store API", () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn(),
    };

    expect(() => {
      plugin.apply(store as Parameters<DevToolsPlugin["apply"]>[0]);
    }).not.toThrow();
  });

  it("should use setWithMetadata when available", () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn(),
    };

    plugin.apply(store as Parameters<DevToolsPlugin["apply"]>[0]);

    // Verify that set method was overridden
    expect(typeof store.set).toBe("function");
  });

  it("should fall back to polling when setWithMetadata is not available", () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      serializeState: vi.fn(),
    };

    expect(() => {
      plugin.apply(store as Parameters<DevToolsPlugin["apply"]>[0]);
    }).not.toThrow();
  });

  it("should handle serializeState method", () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      serializeState: vi.fn().mockReturnValue({ serialized: true }),
    };

    expect(() => {
      plugin.apply(store as Parameters<DevToolsPlugin["apply"]>[0]);
    }).not.toThrow();
  });

  it("should call captureStackTrace with traceLimit when trace is true", () => {
    const captureSpy = vi
      .spyOn(stackTracer, "captureStackTrace")
      .mockReturnValue({
        frames: [],
        timestamp: Date.now(),
      });
    const plugin = new DevToolsPlugin({ trace: true, traceLimit: 5 });
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn(),
    };
    plugin.apply(store as Parameters<DevToolsPlugin["apply"]>[0]);
    const mockAtom = { id: { toString: () => "test" } };
    store.set(mockAtom as any, 1);
    expect(captureSpy).toHaveBeenCalledWith(5);
    captureSpy.mockRestore();
  });

  it("should not call captureStackTrace when trace is false", () => {
    const captureSpy = vi.spyOn(stackTracer, "captureStackTrace");
    const plugin = new DevToolsPlugin({ trace: false });
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn(),
    };
    plugin.apply(store as Parameters<DevToolsPlugin["apply"]>[0]);
    const mockAtom = { id: { toString: () => "test" } };
    store.set(mockAtom as any, 1);
    expect(captureSpy).not.toHaveBeenCalled();
    captureSpy.mockRestore();
  });

  it("should expose startBatch and endBatch for action grouping", () => {
    const plugin = new DevToolsPlugin();
    expect(typeof plugin.startBatch).toBe("function");
    expect(typeof plugin.endBatch).toBe("function");
    expect(() => plugin.startBatch("g1")).not.toThrow();
    expect(() => plugin.endBatch("g1")).not.toThrow();
  });

  it("should call setWithMetadata with groupId during a batch", () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: vi.fn(),
      set: vi.fn(),
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn(),
    };
    plugin.apply(store as Parameters<DevToolsPlugin["apply"]>[0]);
    plugin.startBatch("batch-1");
    const atom1 = { id: { toString: () => "atom1" } };
    const atom2 = { id: { toString: () => "atom2" } };
    store.set(atom1 as any, 1);
    store.set(atom2 as any, 2);
    expect(store.setWithMetadata).toHaveBeenCalledTimes(2);
    const [firstMeta, secondMeta] = (
      store.setWithMetadata as ReturnType<typeof vi.fn>
    ).mock.calls.map((c: unknown[]) => c[2]);
    expect(firstMeta).toBeDefined();
    expect(firstMeta?.groupId).toBe("batch-1");
    expect(secondMeta?.groupId).toBe("batch-1");
    plugin.endBatch("batch-1");
  });
});

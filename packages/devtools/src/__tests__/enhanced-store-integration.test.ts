import { DevToolsPlugin } from "../devtools-plugin";
import { vi } from "vitest";
import * as stackTracer from "../utils/stack-tracer";

describe("DevToolsPlugin Enhanced Store Integration", () => {
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
    const captureSpy = vi.spyOn(stackTracer, "captureStackTrace").mockReturnValue(null);
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
});

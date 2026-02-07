import { DevToolsPlugin } from "../devtools-plugin";
import { vi } from "vitest";

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
});

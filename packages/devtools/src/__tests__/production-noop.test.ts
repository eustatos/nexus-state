/**
 * Production no-op entry: zero overhead and correct API surface.
 * Ensures devtools-noop.ts is used when package is resolved with "production" condition.
 */

import {
  devTools,
  DevToolsPlugin,
  createSnapshotMapper,
  SnapshotMapper,
  detectDevToolsFeatures,
  isSSREnvironment,
  isDevToolsAvailable,
  getDevToolsMode,
  createActionMetadata,
  createMinimalActionMetadata,
  createActionGrouper,
  createBatchUpdater,
} from "../devtools-noop";

describe("Production no-op entry (devtools-noop)", () => {
  const mockStore = {
    get: () => ({}),
    set: () => {},
    getState: () => ({}),
    serializeState: () => ({}),
  };

  describe("devTools() and DevToolsPlugin", () => {
    it("devTools() returns a plugin instance", () => {
      const plugin = devTools();
      expect(plugin).toBeInstanceOf(DevToolsPlugin);
    });

    it("plugin.apply() is a no-op and does not throw", () => {
      const plugin = devTools();
      expect(() =>
        plugin.apply(mockStore as Parameters<DevToolsPlugin["apply"]>[0]),
      ).not.toThrow();
    });

    it("plugin.startBatch() and endBatch() are no-ops", () => {
      const plugin = devTools();
      expect(() => {
        plugin.startBatch("g1");
        plugin.endBatch("g1");
      }).not.toThrow();
    });

    it("plugin.exportState() returns minimal shape without serialization overhead", () => {
      const plugin = devTools();
      const result = plugin.exportState(
        mockStore as Parameters<DevToolsPlugin["exportState"]>[0],
      );
      expect(result).toMatchObject({
        state: expect.any(Object),
        timestamp: expect.any(Number),
        checksum: "",
        version: "1.0.0",
        metadata: expect.any(Object),
      });
    });

    it("plugin.getSnapshotMapper() returns a SnapshotMapper instance", () => {
      const plugin = devTools();
      const mapper = plugin.getSnapshotMapper();
      expect(mapper).toBeInstanceOf(SnapshotMapper);
      expect(mapper.mapSnapshotToAction("s1", "a1")).toEqual({ success: true });
      expect(mapper.getActionIdBySnapshotId("s1")).toBeUndefined();
      expect(mapper.cleanup()).toBe(0);
    });
  });

  describe("Feature detection (always disabled in production)", () => {
    it("detectDevToolsFeatures() returns mode disabled", () => {
      const result = detectDevToolsFeatures();
      expect(result.mode).toBe("disabled");
      expect(result.isAvailable).toBe(false);
    });

    it("getDevToolsMode() returns disabled", () => {
      expect(getDevToolsMode()).toBe("disabled");
      expect(getDevToolsMode(true)).toBe("disabled");
    });

    it("isDevToolsAvailable() returns false", () => {
      expect(isDevToolsAvailable()).toBe(false);
    });

    it("isSSREnvironment() reflects typeof window", () => {
      expect(typeof isSSREnvironment()).toBe("boolean");
    });
  });

  describe("createSnapshotMapper", () => {
    it("returns SnapshotMapper with no-op methods", () => {
      const mapper = createSnapshotMapper();
      expect(mapper).toBeInstanceOf(SnapshotMapper);
      expect(mapper.mapSnapshotToAction("a", "b")).toEqual({ success: true });
      expect(mapper.cleanup()).toBe(0);
    });
  });

  describe("Action metadata / grouper / batch stubs", () => {
    it("createActionMetadata() returns builder that builds minimal metadata", () => {
      const builder = createActionMetadata();
      const meta = builder.type("test").atomName("a").build();
      expect(meta).toMatchObject({ type: "test", atomName: "a", source: "production" });
    });

    it("createMinimalActionMetadata() returns minimal object", () => {
      const meta = createMinimalActionMetadata("t", "an");
      expect(meta).toMatchObject({ type: "t", atomName: "an" });
    });

    it("createActionGrouper() returns no-op grouper", () => {
      const grouper = createActionGrouper();
      grouper.startGroup("g1");
      grouper.add(createMinimalActionMetadata("a", "b"));
      expect(grouper.endGroup("g1")).toBeNull();
    });

    it("createBatchUpdater() returns no-op updater", () => {
      const updater = createBatchUpdater({
        onFlush: () => {},
      });
      expect(() => updater.schedule(mockStore, "action")).not.toThrow();
    });
  });
});

/**
 * Unit tests for SnapshotMapper
 *
 * This file contains comprehensive tests for the SnapshotMapper class,
 * covering bidirectional mapping, cleanup functionality, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnapshotMapper, createSnapshotMapper } from "../snapshot-mapper";
import {
  sampleMappings,
  invalidSnapshotIds,
  invalidActionIds,
  actionIdsToKeep,
  largeDataset,
  createCallbackTracker,
} from "../__fixtures__/snapshot-mapper-fixtures";

// Mock console.warn in tests
vi.mock("console", () => ({
  warn: vi.fn(),
}));

describe("SnapshotMapper", () => {
  describe("Basic Mapping Operations", () => {
    let mapper: SnapshotMapper;

    beforeEach(() => {
      mapper = new SnapshotMapper();
    });

    it("should map snapshot to action", () => {
      const result = mapper.mapSnapshotToAction("snap-123", "user/login");

      expect(result.success).toBe(true);
      expect(result.mapping).toBeDefined();
      expect(result.mapping?.snapshotId).toBe("snap-123");
      expect(result.mapping?.actionId).toBe("user/login");
    });

    it("should map multiple snapshot-action pairs", () => {
      sampleMappings.forEach((mapping) => {
        const result = mapper.mapSnapshotToAction(
          mapping.snapshotId,
          mapping.actionId,
          mapping.metadata,
        );
        expect(result.success).toBe(true);
      });

      expect(mapper.getMappingCount()).toBe(sampleMappings.length);
    });

    it("should get snapshot ID by action ID", () => {
      mapper.mapSnapshotToAction("snap-456", "user/login");

      const snapshotId = mapper.getSnapshotIdByActionId("user/login");

      expect(snapshotId).toBe("snap-456");
    });

    it("should return undefined when action ID not found", () => {
      const snapshotId = mapper.getSnapshotIdByActionId("nonexistent");

      expect(snapshotId).toBeUndefined();
    });

    it("should get action ID by snapshot ID", () => {
      mapper.mapSnapshotToAction("snap-789", "user/logout");

      const actionId = mapper.getActionIdBySnapshotId("snap-789");

      expect(actionId).toBe("user/logout");
    });

    it("should return undefined when snapshot ID not found", () => {
      const actionId = mapper.getActionIdBySnapshotId("nonexistent");

      expect(actionId).toBeUndefined();
    });

    it("should have correct mapping count", () => {
      expect(mapper.getMappingCount()).toBe(0);

      mapper.mapSnapshotToAction("snap-1", "action-1");
      mapper.mapSnapshotToAction("snap-2", "action-2");

      expect(mapper.getMappingCount()).toBe(2);
    });
  });

  describe("Validation and Error Handling", () => {
    let mapper: SnapshotMapper;

    beforeEach(() => {
      mapper = new SnapshotMapper();
    });

    it("should reject empty snapshot ID", () => {
      const result = mapper.mapSnapshotToAction("", "action-1");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject empty action ID", () => {
      const result = mapper.mapSnapshotToAction("snap-1", "");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject invalid snapshot ID types", () => {
      invalidSnapshotIds.forEach((invalidId) => {
        const result = mapper.mapSnapshotToAction(invalidId, "action-1") as {
          success: boolean;
          error?: string;
        };
        expect(result.success).toBe(false);
      });
    });

    it("should reject invalid action ID types", () => {
      invalidActionIds.forEach((invalidId) => {
        const result = mapper.mapSnapshotToAction("snap-1", invalidId) as {
          success: boolean;
          error?: string;
        };
        expect(result.success).toBe(false);
      });
    });

    it("should handle null/undefined gracefully", () => {
      const result1 = mapper.mapSnapshotToAction(
        null as unknown as string,
        "action-1",
      );
      const result2 = mapper.mapSnapshotToAction(
        "snap-1",
        null as unknown as string,
      );

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  describe("Mapping Overwrites", () => {
    let mapper: SnapshotMapper;

    beforeEach(() => {
      mapper = new SnapshotMapper();
    });

    it("should allow overwriting existing snapshot mapping", () => {
      mapper.mapSnapshotToAction("snap-1", "action-1");
      mapper.mapSnapshotToAction("snap-1", "action-2");

      const actionId = mapper.getActionIdBySnapshotId("snap-1");
      expect(actionId).toBe("action-2");
    });

    it("should update action-to-snapshot map on overwrite", () => {
      mapper.mapSnapshotToAction("snap-1", "action-1");
      mapper.mapSnapshotToAction("snap-2", "action-1");

      const snapshotId1 = mapper.getSnapshotIdByActionId("action-1");
      const snapshotId2 = mapper.getSnapshotIdByActionId("action-2");

      expect(snapshotId1).toBe("snap-2");
      expect(snapshotId2).toBeUndefined();
    });
  });

  describe("Cleanup Functionality", () => {
    let mapper: SnapshotMapper;

    beforeEach(() => {
      mapper = new SnapshotMapper({ maxMappings: 5, autoCleanup: false });

      // Add more than maxMappings
      sampleMappings.forEach((mapping) => {
        mapper.mapSnapshotToAction(mapping.snapshotId, mapping.actionId);
      });
    });

    it("should cleanup old mappings when max exceeded", () => {
      mapper.cleanup();

      expect(mapper.getMappingCount()).toBeLessThanOrEqual(5);
    });

    it("should keep specified action IDs during cleanup", () => {
      mapper.cleanup(actionIdsToKeep);

      actionIdsToKeep.forEach((actionId) => {
        expect(mapper.hasActionMapping(actionId)).toBe(true);
      });

      // Verify others were removed
      expect(mapper.hasActionMapping("ui/click")).toBe(false);
      expect(mapper.hasActionMapping("api/request")).toBe(false);
    });

    it("should return count of cleaned mappings", () => {
      const cleanedCount = mapper.cleanup();

      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Clear Functionality", () => {
    let mapper: SnapshotMapper;

    beforeEach(() => {
      mapper = new SnapshotMapper();
      sampleMappings.forEach((mapping) => {
        mapper.mapSnapshotToAction(mapping.snapshotId, mapping.actionId);
      });
    });

    it("should clear all mappings", () => {
      expect(mapper.getMappingCount()).toBeGreaterThan(0);

      mapper.clear();

      expect(mapper.getMappingCount()).toBe(0);
    });

    it("should clear both mapping directions", () => {
      mapper.clear();

      sampleMappings.forEach((mapping) => {
        expect(mapper.hasSnapshotMapping(mapping.snapshotId)).toBe(false);
        expect(mapper.hasActionMapping(mapping.actionId)).toBe(false);
      });
    });

    it("should reset all internal maps", () => {
      mapper.clear();

      expect(mapper.getAllActionIds()).toHaveLength(0);
      expect(mapper.getAllSnapshotIds()).toHaveLength(0);
    });
  });

  describe("Helper Methods", () => {
    let mapper: SnapshotMapper;

    beforeEach(() => {
      mapper = new SnapshotMapper();

      sampleMappings.forEach((mapping) => {
        mapper.mapSnapshotToAction(mapping.snapshotId, mapping.actionId);
      });
    });

    it("should check if snapshot mapping exists", () => {
      expect(mapper.hasSnapshotMapping("snap-001")).toBe(true);
      expect(mapper.hasSnapshotMapping("nonexistent")).toBe(false);
    });

    it("should check if action mapping exists", () => {
      expect(mapper.hasActionMapping("user/login")).toBe(true);
      expect(mapper.hasActionMapping("nonexistent")).toBe(false);
    });

    it("should get all action IDs", () => {
      const actionIds = mapper.getAllActionIds();

      expect(actionIds).toContain("user/login");
      expect(actionIds).toContain("user/logout");
      expect(actionIds).toContain("data/fetch");
    });

    it("should get all snapshot IDs", () => {
      const snapshotIds = mapper.getAllSnapshotIds();

      expect(snapshotIds).toContain("snap-001");
      expect(snapshotIds).toContain("snap-002");
      expect(snapshotIds).toContain("snap-003");
    });
  });

  describe("Integration with DevTools Commands", () => {
    let mapper: SnapshotMapper;

    beforeEach(() => {
      mapper = new SnapshotMapper();
    });

    it("should support time travel command mapping", () => {
      // Simulate DevTools time travel command flow
      const snapshotId = "snap-time-travel";
      const actionId = "user/login";

      mapper.mapSnapshotToAction(snapshotId, actionId);

      // Simulate JUMP_TO_ACTION command
      const foundSnapshotId = mapper.getSnapshotIdByActionId(actionId);
      expect(foundSnapshotId).toBe(snapshotId);
    });
  });

  describe("Performance and Memory", () => {
    it("should handle large dataset efficiently", () => {
      const mapper = new SnapshotMapper({
        maxMappings: 2000,
        autoCleanup: false,
      });

      // Add large dataset
      largeDataset.forEach((item) => {
        const result = mapper.mapSnapshotToAction(
          item.snapshotId,
          item.actionId,
          item.metadata,
        );
        expect(result.success).toBe(true);
      });

      expect(mapper.getMappingCount()).toBe(largeDataset.length);
    });

    it("should auto-cleanup when max exceeded", () => {
      const mapper = new SnapshotMapper({
        maxMappings: 100,
        autoCleanup: true,
      });

      // Add 200 mappings
      for (let i = 0; i < 200; i++) {
        mapper.mapSnapshotToAction(`snap-${i}`, `action-${i}`);
      }

      expect(mapper.getMappingCount()).toBe(100); // Should be limited
    });
  });

  describe("Callback Functions", () => {
    it("should call onMappingAdded callback", () => {
      const { onMappingAdded, addedMappings } = createCallbackTracker();
      const mapper = new SnapshotMapper({ onMappingAdded });

      mapper.mapSnapshotToAction("snap-1", "action-1");

      expect(addedMappings.length).toBe(1);
      expect(addedMappings[0].mapping).toBeDefined();
    });

    it("should call onCleanup callback", () => {
      const { onCleanup, cleanupCounts } = createCallbackTracker();
      const mapper = new SnapshotMapper({
        maxMappings: 3,
        autoCleanup: false,
        onCleanup,
      });

      // Add 5 mappings
      for (let i = 0; i < 5; i++) {
        mapper.mapSnapshotToAction(`snap-${i}`, `action-${i}`);
      }

      // Cleanup
      mapper.cleanup();

      expect(cleanupCounts.length).toBe(1);
      expect(cleanupCounts[0]).toBeGreaterThan(0);
    });
  });

  describe("Static Factory Function", () => {
    it("should create SnapshotMapper via factory", () => {
      const mapper = createSnapshotMapper({
        maxMappings: 100,
        autoCleanup: true,
      });

      expect(mapper).toBeInstanceOf(SnapshotMapper);
      expect(mapper.getMappingCount()).toBe(0);
    });

    it("should use default config when no config provided", () => {
      const mapper = createSnapshotMapper();

      expect(mapper).toBeInstanceOf(SnapshotMapper);
      expect(mapper.getMappingCount()).toBe(0);
    });
  });
});

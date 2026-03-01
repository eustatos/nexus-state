/**
 * Performance benchmarks for ActionGrouper
 */

import { describe, bench, beforeEach } from "vitest";
import { createActionGrouper } from "../../action-grouper";
import { createActionMetadata } from "../../action-metadata";
import type { ActionMetadata } from "../../types";

function createTestMetadata(
  type: string,
  atomName: string,
  groupId: string,
): ActionMetadata {
  return createActionMetadata()
    .type(type)
    .atomName(atomName)
    .timestamp(Date.now())
    .source("test")
    .groupId(groupId)
    .build();
}

describe("ActionGrouper Performance", () => {
  describe("Group Creation and Management", () => {
    bench("create ActionGrouper instance", () => {
      createActionGrouper({ flushAfterMs: 100, maxGroupSize: 10 });
    });

    bench("start and end empty group", () => {
      const grouper = createActionGrouper({
        flushAfterMs: 100,
        maxGroupSize: 10,
      });
      grouper.startGroup("test-group");
      grouper.endGroup("test-group");
    });

    bench("add 100 actions to a single group", () => {
      const grouper = createActionGrouper({
        flushAfterMs: 100,
        maxGroupSize: 1000,
      });
      grouper.startGroup("large-group");

      for (let i = 0; i < 100; i++) {
        grouper.add(
          createTestMetadata(`atom${i}/SET`, `atom${i}`, "large-group"),
        );
      }

      grouper.endGroup("large-group");
    });
  });

  describe("Memory Usage", () => {
    bench(
      "memory usage with 1000 actions across 10 groups",
      { iterations: 10 },
      () => {
        const grouper = createActionGrouper({
          flushAfterMs: 1000,
          maxGroupSize: 1000,
        });

        // Create 10 groups with 100 actions each
        for (let groupIdx = 0; groupIdx < 10; groupIdx++) {
          const groupId = `group-${groupIdx}`;
          grouper.startGroup(groupId);

          for (let actionIdx = 0; actionIdx < 100; actionIdx++) {
            grouper.add(
              createTestMetadata(
                `atom${groupIdx}-${actionIdx}/SET`,
                `atom${groupIdx}-${actionIdx}`,
                groupId,
              ),
            );
          }

          grouper.endGroup(groupId);
        }
      },
    );
  });

  describe("Concurrent Operations", () => {
    bench("concurrent group operations", () => {
      const grouper = createActionGrouper({
        flushAfterMs: 100,
        maxGroupSize: 50,
      });

      // Simulate concurrent operations
      const groups = ["g1", "g2", "g3", "g4", "g5"];

      groups.forEach((groupId) => {
        grouper.startGroup(groupId);
        for (let i = 0; i < 10; i++) {
          grouper.add(
            createTestMetadata(`${groupId}/SET-${i}`, groupId, groupId),
          );
        }
      });

      groups.forEach((groupId) => {
        grouper.endGroup(groupId);
      });
    });
  });

  describe("Auto-flush Performance", () => {
    bench("auto-flush with timeout", () => {
      const grouper = createActionGrouper({
        flushAfterMs: 10,
        maxGroupSize: 1000,
      });
      const onFlush = () => {};
      const grouperWithCallback = createActionGrouper({
        flushAfterMs: 10,
        maxGroupSize: 1000,
        onFlush,
      });

      grouperWithCallback.startGroup("auto-flush-test");
      for (let i = 0; i < 50; i++) {
        grouperWithCallback.add(
          createTestMetadata(`auto/SET-${i}`, "auto", "auto-flush-test"),
        );
      }
      // Let it auto-flush (simulated by immediate end)
      grouperWithCallback.endGroup("auto-flush-test");
    });
  });
});

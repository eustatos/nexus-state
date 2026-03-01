/**
 * Unit tests for ActionGrouper (batched updates)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createActionGrouper,
  type ActionGrouper,
  type GroupLabelFormatter,
} from "../action-grouper";
import type { ActionMetadata } from "../types";
import { createActionMetadata } from "../action-metadata";

function metaWithGroup(
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

describe("ActionGrouper", () => {
  let grouper: ActionGrouper;

  beforeEach(() => {
    grouper = createActionGrouper({ flushAfterMs: 100, maxGroupSize: 10 });
  });

  it("should start a group and add actions", () => {
    grouper.startGroup("g1");
    grouper.add(
      metaWithGroup("a/SET", "a", "g1"),
    );
    grouper.add(
      metaWithGroup("b/SET", "b", "g1"),
    );
    expect(grouper.hasGroup("g1")).toBe(true);
    const result = grouper.endGroup("g1");
    expect(result).not.toBeNull();
    expect(result!.count).toBe(2);
    expect(result!.type).toContain("Batch");
    expect(result!.metadata.atomNames).toEqual(["a", "b"]);
  });

  it("should return null when ending empty group", () => {
    grouper.startGroup("empty");
    const result = grouper.endGroup("empty");
    expect(result).toBeNull();
  });

  it("should flush all pending groups", () => {
    grouper.startGroup("g1");
    grouper.add(metaWithGroup("a/SET", "a", "g1"));
    grouper.startGroup("g2");
    grouper.add(metaWithGroup("b/SET", "b", "g2"));
    const results = grouper.flushAll();
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.count)).toEqual([1, 1]);
    expect(grouper.getPendingGroupIds()).toHaveLength(0);
  });

  it("should call onFlush when group is auto-flushed by timeout", () => {
    vi.useFakeTimers();
    const onFlush = vi.fn();
    const fast = createActionGrouper({ flushAfterMs: 20, onFlush });
    fast.startGroup("t1");
    fast.add(metaWithGroup("a/SET", "a", "t1"));
    vi.advanceTimersByTime(50);
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0][0].count).toBe(1);
    vi.useRealTimers();
  });

  it("should call onFlush when maxGroupSize is reached", () => {
    const onFlush = vi.fn();
    const small = createActionGrouper({ maxGroupSize: 2, onFlush });
    small.startGroup("m1");
    small.add(metaWithGroup("a/SET", "a", "m1"));
    small.add(metaWithGroup("b/SET", "b", "m1"));
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0][0].count).toBe(2);
  });

  it("should use custom group label formatter", () => {
    const formatter: GroupLabelFormatter = (count, atomNames) =>
      `Custom: ${count} (${atomNames.join("-")})`;
    const custom = createActionGrouper({}, formatter);
    custom.startGroup("c1");
    custom.add(metaWithGroup("x/SET", "x", "c1"));
    custom.add(metaWithGroup("y/SET", "y", "c1"));
    const result = custom.endGroup("c1");
    expect(result!.type).toBe("Custom: 2 (x-y)");
  });

  it("getPendingGroupIds should return active group ids", () => {
    expect(grouper.getPendingGroupIds()).toEqual([]);
    grouper.startGroup("p1");
    grouper.add(metaWithGroup("a/SET", "a", "p1"));
    expect(grouper.getPendingGroupIds()).toContain("p1");
    grouper.endGroup("p1");
    expect(grouper.getPendingGroupIds()).not.toContain("p1");
  });
});

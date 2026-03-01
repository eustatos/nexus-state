/**
 * Unit tests for BatchUpdater (batch update system with throttling)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createBatchUpdater, type BatchUpdater } from "../batch-updater";

describe("BatchUpdater", () => {
  const mockStore = { getState: () => ({}) };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should flush after batchLatencyMs when throttleByFrame is false", () => {
    const onFlush = vi.fn();
    const updater = createBatchUpdater({
      batchLatencyMs: 50,
      throttleByFrame: false,
      onFlush,
    });
    updater.schedule(mockStore, "SET counter");
    expect(onFlush).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0]).toEqual([mockStore, "SET counter", 1]);
  });

  it("should batch multiple schedules into one flush", () => {
    const onFlush = vi.fn();
    const updater = createBatchUpdater({
      batchLatencyMs: 100,
      throttleByFrame: false,
      onFlush,
    });
    updater.schedule(mockStore, "SET a");
    updater.schedule(mockStore, "SET b");
    updater.schedule(mockStore, "SET c");
    vi.advanceTimersByTime(100);
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0][1]).toBe("Batch (3 updates)");
    expect(onFlush.mock.calls[0][2]).toBe(3);
  });

  it("should cap queue at maxQueueSize (drop oldest)", () => {
    const onFlush = vi.fn();
    const updater = createBatchUpdater({
      batchLatencyMs: 200,
      maxQueueSize: 3,
      throttleByFrame: false,
      onFlush,
    });
    updater.schedule(mockStore, "1");
    updater.schedule(mockStore, "2");
    updater.schedule(mockStore, "3");
    updater.schedule(mockStore, "4");
    updater.schedule(mockStore, "5");
    expect(updater.pendingCount).toBe(3);
    vi.advanceTimersByTime(200);
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush.mock.calls[0][2]).toBe(3);
  });

  it("should report pendingCount correctly", () => {
    const updater = createBatchUpdater({
      batchLatencyMs: 100,
      throttleByFrame: false,
      onFlush: () => {},
    });
    expect(updater.pendingCount).toBe(0);
    updater.schedule(mockStore, "a");
    updater.schedule(mockStore, "b");
    expect(updater.pendingCount).toBe(2);
    vi.advanceTimersByTime(100);
    expect(updater.pendingCount).toBe(0);
  });

  it("should flush immediately when flush() is called", () => {
    const onFlush = vi.fn();
    const updater = createBatchUpdater({
      batchLatencyMs: 1000,
      throttleByFrame: false,
      onFlush,
    });
    updater.schedule(mockStore, "SET x");
    updater.flush();
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(updater.pendingCount).toBe(0);
    vi.advanceTimersByTime(2000);
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it("should clear pending updates without sending", () => {
    const onFlush = vi.fn();
    const updater = createBatchUpdater({
      batchLatencyMs: 100,
      throttleByFrame: false,
      onFlush,
    });
    updater.schedule(mockStore, "a");
    updater.clear();
    expect(updater.pendingCount).toBe(0);
    vi.advanceTimersByTime(200);
    expect(onFlush).not.toHaveBeenCalled();
  });

  it("should respect maxUpdatesPerSecond when set", () => {
    const onFlush = vi.fn();
    const updater = createBatchUpdater({
      batchLatencyMs: 0,
      throttleByFrame: false,
      maxUpdatesPerSecond: 10,
      onFlush,
    });
    updater.schedule(mockStore, "a");
    updater.flush();
    expect(onFlush).toHaveBeenCalledTimes(1);
    updater.schedule(mockStore, "b");
    updater.flush();
    expect(onFlush).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(110);
    expect(onFlush).toHaveBeenCalledTimes(2);
  });

  it("should use last store reference when flushing", () => {
    const onFlush = vi.fn();
    const updater = createBatchUpdater({
      batchLatencyMs: 50,
      throttleByFrame: false,
      onFlush,
    });
    const store1 = { getState: () => ({ v: 1 }) };
    const store2 = { getState: () => ({ v: 2 }) };
    updater.schedule(store1, "a");
    updater.schedule(store2, "b");
    vi.advanceTimersByTime(50);
    expect(onFlush).toHaveBeenCalledWith(store2, "Batch (2 updates)", 2);
  });
});

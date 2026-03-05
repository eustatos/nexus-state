/**
 * Tests for reproducing notification synchronization issues
 * 
 * Specific problems:
 * 1. useSyncExternalStore requires synchronous notifications
 * 2. Store uses batcher.schedule() which may delay notifications
 * 3. During restore from time-travel, React components don't receive notifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "../store";
import { atom } from "../atom";
import { batcher } from "../batching";
import { SimpleTimeTravel } from "../time-travel";

/**
 * Problem 1: useSyncExternalStore requires synchronous notifications
 * 
 * useSyncExternalStore expects that subscription will call onStoreChange
 * synchronously when state changes. However, batcher.schedule() may
 * defer callback execution, leading to desynchronization.
 */
describe("Problem 1: useSyncExternalStore - synchronous notifications", () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom<number>>;

  beforeEach(() => {
    // Ensure clean batch state
    if (batcher.getIsBatching()) {
      batcher.endBatch();
    }
    store = createStore();
    testAtom = atom(0, "test.sync.atom");
    store.get(testAtom);
  });

  afterEach(() => {
    // Clean up batcher after each test
    if (batcher.getIsBatching()) {
      batcher.endBatch();
    }
  });

  it("PROBLEM DEMO: notification not synchronous during batch", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(testAtom, listener);

    // Start batch
    batcher.startBatch();

    // Set value
    store.set(testAtom, 1);

    // EXPECTATION: listener should be called synchronously
    // REALITY: listener is NOT called during batch
    expect(listener).not.toHaveBeenCalled();

    // End batch
    batcher.endBatch();

    // Only now listener is called
    expect(listener).toHaveBeenCalledWith(1);

    unsubscribe();
  });

  it("PROBLEM DEMO: useSyncExternalStore may get stale value", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(testAtom, listener);

    let capturedValue: number | undefined;

    // Emulating useSyncExternalStore behavior
    const subscribe = (onStoreChange: () => void) => {
      return store.subscribe(testAtom, () => {
        onStoreChange();
      });
    };

    const getSnapshot = () => {
      capturedValue = store.get(testAtom);
      return capturedValue;
    };

    const unsubscribeStore = subscribe(() => {
      // React will call getSnapshot after notification
      getSnapshot();
    });

    // Set value
    store.set(testAtom, 42);

    // Wait for batch to complete (if batching occurred)
    // In real React this may lead to race condition

    // capturedValue may be stale if getSnapshot was called
    // before batched callback execution
    expect(capturedValue).toBe(42);

    unsubscribe();
    unsubscribeStore();
  });

  it("PROBLEM DEMO: multiple sets in batch", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(testAtom, listener);

    batcher.startBatch();
    store.set(testAtom, 1);
    store.set(testAtom, 2);
    store.set(testAtom, 3);
    batcher.endBatch();

    // listener called 3 times (one for each set)
    // but all calls happened after batcher.endBatch()
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenNthCalledWith(1, 1);
    expect(listener).toHaveBeenNthCalledWith(2, 2);
    expect(listener).toHaveBeenNthCalledWith(3, 3);

    unsubscribe();
  });

  it("CONTRAST: without batching notification is synchronous", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(testAtom, listener);

    // Ensure batching is not active
    expect(batcher.getIsBatching()).toBe(false);

    let valueBeforeCallback = -1;
    let valueAfterCallback = -1;

    // Modify listener to capture value immediately after call
    const syncListener = vi.fn(() => {
      valueAfterCallback = store.get(testAtom);
    });

    const unsub2 = store.subscribe(testAtom, syncListener);

    // Set value
    store.set(testAtom, 100);

    // Without batching, callback should execute synchronously
    // inside store.set()
    expect(syncListener).toHaveBeenCalled();
    expect(valueAfterCallback).toBe(100);

    unsubscribe();
    unsub2();
  });
});

/**
 * Problem 2: Store uses batcher.schedule() which may delay notifications
 * 
 * In store.ts, after updating value, subscriber notifications are scheduled
 * via batcher.schedule(). This means if batching is active,
 * notifications will be deferred until end of batch.
 */
describe("Problem 2: batcher.schedule() delays notifications", () => {
  let store: ReturnType<typeof createStore>;
  let testAtom: ReturnType<typeof atom<number>>;

  beforeEach(() => {
    // Ensure clean batch state
    if (batcher.getIsBatching()) {
      batcher.endBatch();
    }
    store = createStore();
    testAtom = atom(0, "test.batcher.delay");
    store.get(testAtom);
  });

  afterEach(() => {
    // Clean up batcher
    if (batcher.getIsBatching()) {
      batcher.endBatch();
    }
  });

  it("PROBLEM DEMO: notification deferred until end of batch", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(testAtom, listener);

    batcher.startBatch();

    const setCallTime = Date.now();
    let notificationTime = 0;

    const timestampListener = vi.fn(() => {
      notificationTime = Date.now();
    });

    const unsub2 = store.subscribe(testAtom, timestampListener);

    store.set(testAtom, 1);

    // Notification not yet occurred
    expect(timestampListener).not.toHaveBeenCalled();

    // Check that there's a delay between set and notification
    batcher.endBatch();

    expect(timestampListener).toHaveBeenCalled();
    // notificationTime >= setCallTime (obviously)
    // but importantly, notification happened AFTER set, not during

    unsubscribe();
    unsub2();
  });

  it("PROBLEM DEMO: nested batches", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(testAtom, listener);

    batcher.startBatch();
    store.set(testAtom, 1);
    expect(listener).not.toHaveBeenCalled();

    // Nested batch
    batcher.startBatch();
    store.set(testAtom, 2);
    expect(listener).not.toHaveBeenCalled();

    // End nested batch - still no notification
    batcher.endBatch();
    expect(listener).not.toHaveBeenCalled();

    // End outer batch - now notifications occur
    batcher.endBatch();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("PROBLEM DEMO: flush during flush", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(testAtom, listener);

    let callCountDuringFirstFlush = 0;

    // Listener that triggers new set
    const recursiveListener = vi.fn((value: number) => {
      callCountDuringFirstFlush++;
      if (value === 1) {
        // This triggers new batcher.schedule() during flush
        store.set(testAtom, 2);
      }
    });

    const unsub2 = store.subscribe(testAtom, recursiveListener);

    batcher.startBatch();
    store.set(testAtom, 1);
    batcher.endBatch();

    // Both notifications should occur
    expect(recursiveListener).toHaveBeenCalledTimes(2);
    expect(recursiveListener).toHaveBeenNthCalledWith(1, 1);
    expect(recursiveListener).toHaveBeenNthCalledWith(2, 2);

    unsubscribe();
    unsub2();
  });

  it("CONTRAST: direct callback call without batching", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(testAtom, listener);

    // Ensure batching is not active
    expect(batcher.getDepth()).toBe(0);

    let valueAtNotification = -1;

    const syncListener = vi.fn((value: number) => {
      valueAtNotification = value;
    });

    const unsub2 = store.subscribe(testAtom, syncListener);

    store.set(testAtom, 42);

    // Without batching, notification occurs immediately
    expect(syncListener).toHaveBeenCalled();
    expect(valueAtNotification).toBe(42);

    unsubscribe();
    unsub2();
  });
});

/**
 * Problem 3: During restore from time-travel, React components don't receive notifications
 * 
 * SnapshotRestorer calls store.set() to restore atom values.
 * However, if store.set() is wrapped in SimpleTimeTravel.wrappedSet(),
 * and isTimeTraveling = true, there may be issues with notifications.
 */
describe("Problem 3: restore from time-travel doesn't notify React components", () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let contentAtom: ReturnType<typeof atom<string>>;
  let testId: string;

  beforeEach(() => {
    // Ensure clean batch state
    if (batcher.getIsBatching()) {
      batcher.endBatch();
    }
    testId = Math.random().toString(36).substring(2, 9);
    store = createStore();
    contentAtom = atom("", `test.content.restore.${testId}`);
    store.get(contentAtom);

    timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: false,
    });
  });

  afterEach(() => {
    // Clean up timeTravel
    timeTravel.dispose();
    // Clean up batcher
    if (batcher.getIsBatching()) {
      batcher.endBatch();
    }
  });

  it("PROBLEM DEMO: subscriber doesn't receive notification on jumpTo", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(contentAtom, listener);

    // Create snapshots
    store.set(contentAtom, "Original");
    timeTravel.capture("snap1");

    store.set(contentAtom, "Modified");
    timeTravel.capture("snap2");

    // Clear call history
    listener.mockClear();

    // Restore
    const jumpResult = timeTravel.jumpTo(0);

    expect(jumpResult).toBe(true);
    expect(store.get(contentAtom)).toBe("Original");

    // PROBLEM: listener MAY NOT be called because
    // SnapshotRestorer.restore() calls store.set() directly,
    // but wrappedSet may not trigger notifications correctly
    // during time travel
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });

  it("PROBLEM DEMO: multiple subscribers on restore", () => {
    // Create snapshots first
    store.set(contentAtom, "A");
    timeTravel.capture("snap1");

    store.set(contentAtom, "B");
    timeTravel.capture("snap2");

    // NOW subscribe (simulating React component mounting after state changes)
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const unsub1 = store.subscribe(contentAtom, listener1);
    const unsub2 = store.subscribe(contentAtom, listener2);

    // Clear initial subscription calls (subscribe calls listener immediately with current value)
    listener1.mockClear();
    listener2.mockClear();

    // Restore
    const undoResult = timeTravel.undo();

    // BOTH subscribers should receive notification
    expect(undoResult).toBe(true);
    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
    expect(store.get(contentAtom)).toBe("A");

    unsub1();
    unsub2();
  });

  it("PROBLEM DEMO: undo/redo and notifications", () => {
    // Create history first
    for (let i = 1; i <= 3; i++) {
      store.set(contentAtom, `State ${i}`);
      timeTravel.capture(`snap${i}`);
    }

    // NOW subscribe (simulating React component mounting)
    const listener = vi.fn();
    const unsubscribe = store.subscribe(contentAtom, listener);

    // Clear initial subscription call
    listener.mockClear();

    // Undo
    timeTravel.undo();
    expect(listener).toHaveBeenCalled();
    expect(store.get(contentAtom)).toBe("State 2");

    listener.mockClear();

    // Redo
    timeTravel.redo();
    expect(listener).toHaveBeenCalled();
    expect(store.get(contentAtom)).toBe("State 3");

    listener.mockClear();

    // Jump to middle
    timeTravel.jumpTo(1);
    expect(listener).toHaveBeenCalled();
    expect(store.get(contentAtom)).toBe("State 2");

    unsubscribe();
  });

  it("PROBLEM DEMO: isTimeTraveling flag and notifications", () => {
    // Check if isTimeTraveling affects notifications
    const listener = vi.fn();
    const unsubscribe = store.subscribe(contentAtom, listener);

    store.set(contentAtom, "Initial");
    timeTravel.capture("snap1");

    // Check isTraveling flag during restore
    let wasTravelingDuringRestore = false;

    const checkTravelingListener = vi.fn(() => {
      // Note: isTraveling may be true during notification because
      // SimpleTimeTravel.isTimeTraveling is set to true during restore
      wasTravelingDuringRestore = timeTravel.isTraveling();
    });

    const unsub2 = store.subscribe(contentAtom, checkTravelingListener);

    store.set(contentAtom, "Modified");
    timeTravel.capture("snap2");

    checkTravelingListener.mockClear();

    timeTravel.undo();

    // Note: isTraveling may be true OR false depending on when the listener is called
    // The important thing is that the listener IS called
    expect(checkTravelingListener).toHaveBeenCalled();

    unsubscribe();
    unsub2();
  });

  it("INTEGRATION: React component with useSyncExternalStore", () => {
    // Emulating React component behavior with useSyncExternalStore
    let componentValue: string | undefined;
    let renderCount = 0;

    // Initialization
    store.set(contentAtom, "Initial");
    timeTravel.capture("snap1");

    // Change
    store.set(contentAtom, "Modified");
    timeTravel.capture("snap2");

    const subscribe = (onStoreChange: () => void) => {
      return store.subscribe(contentAtom, () => {
        // React will call getSnapshot asynchronously after notification
        Promise.resolve().then(() => {
          componentValue = store.get(contentAtom);
          renderCount++;
        });
      });
    };

    const getSnapshot = () => {
      return store.get(contentAtom);
    };

    const unsubscribe = subscribe(() => {
      getSnapshot();
    });

    // Restore
    timeTravel.undo();

    // Wait for Promise to resolve (emulating React scheduler)
    return Promise.resolve().then(() => {
      expect(componentValue).toBe("Initial");
      expect(renderCount).toBeGreaterThan(0);
      unsubscribe();
    });
  });

  it("PROBLEM DEMO: batch during restore", () => {
    // Create snapshots first
    store.set(contentAtom, "A");
    timeTravel.capture("snap1");

    store.set(contentAtom, "B");
    timeTravel.capture("snap2");

    // NOW subscribe
    const listener = vi.fn();
    const unsubscribe = store.subscribe(contentAtom, listener);

    // Clear initial call
    listener.mockClear();

    // Check if there's batching during restore
    let batchDepthDuringRestore = -1;

    const batchCheckListener = vi.fn(() => {
      batchDepthDuringRestore = batcher.getDepth();
    });

    const unsub2 = store.subscribe(contentAtom, batchCheckListener);

    timeTravel.undo();

    // If restore happens inside batch, this could be a problem
    // for useSyncExternalStore
    expect(batchCheckListener).toHaveBeenCalled();

    unsubscribe();
    unsub2();
  });
});

/**
 * Additional tests for comprehensive problem verification
 */
describe("Complex synchronization problems", () => {
  let store: ReturnType<typeof createStore>;
  let atom1: ReturnType<typeof atom<number>>;
  let atom2: ReturnType<typeof atom<number>>;

  beforeEach(() => {
    // Ensure clean batch state
    if (batcher.getIsBatching()) {
      batcher.endBatch();
    }
    store = createStore();
    atom1 = atom(0, "test.atom1");
    atom2 = atom(0, "test.atom2");
    store.get(atom1);
    store.get(atom2);
  });

  afterEach(() => {
    // Clean up batcher
    if (batcher.getIsBatching()) {
      batcher.endBatch();
    }
  });

  it("PROBLEM DEMO: race condition on fast set", async () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const unsub1 = store.subscribe(atom1, listener1);
    const unsub2 = store.subscribe(atom2, listener2);

    // Fast sequential sets
    store.set(atom1, 1);
    store.set(atom2, 2);
    store.set(atom1, 3);
    store.set(atom2, 4);

    // Wait for all batched callbacks
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check notification order
    expect(listener1).toHaveBeenCalledTimes(2);
    expect(listener2).toHaveBeenCalledTimes(2);

    unsub1();
    unsub2();
  });

  it("PROBLEM DEMO: computed atoms and batching", () => {
    const computedAtom = atom((get) => get(atom1) + get(atom2), "test.computed");
    store.get(computedAtom);

    const listener = vi.fn();
    const unsubscribe = store.subscribe(computedAtom, listener);

    batcher.startBatch();
    store.set(atom1, 1);
    store.set(atom2, 2);
    batcher.endBatch();

    // computed atom should update after batch
    expect(listener).toHaveBeenCalled();
    expect(store.get(computedAtom)).toBe(3);

    unsubscribe();
  });

  it("PROBLEM DEMO: dependent atoms", () => {
    const dependentAtom = atom((get) => get(atom1) * 2, "test.dependent");
    store.get(dependentAtom);

    const listener = vi.fn();
    const unsubscribe = store.subscribe(dependentAtom, listener);

    batcher.startBatch();
    store.set(atom1, 5);
    batcher.endBatch();

    expect(listener).toHaveBeenCalled();
    expect(store.get(dependentAtom)).toBe(10);

    unsubscribe();
  });
});

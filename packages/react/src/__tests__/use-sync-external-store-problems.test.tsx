/**
 * Tests for reproducing React and useSyncExternalStore issues
 *
 * Specific problems:
 * 1. useSyncExternalStore requires synchronous notifications
 * 2. batcher.schedule() delays notifications
 * 3. During restore from time-travel, React components don't receive notifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { atom, createStore } from "@nexus-state/core";
import { SimpleTimeTravel } from "@nexus-state/time-travel";
import { useAtom, useAtomValue } from "../../index";
import React from "react";

describe("React useSyncExternalStore problems", () => {
  let store: ReturnType<typeof createStore>;
  let testId: string;

  beforeEach(() => {
    testId = Math.random().toString(36).substring(2, 9);
    store = createStore();
  });

  describe("Problem 1: Synchronous notifications", () => {
    it("PROBLEM DEMO: component may not receive update synchronously", () => {
      const testAtom = atom(0, "react.sync.test");
      store.get(testAtom);

      let renderCount = 0;
      let capturedValue: number | undefined;

      const { result } = renderHook(() => {
        renderCount++;
        const value = useAtomValue(testAtom, store);
        capturedValue = value;
        return value;
      });

      expect(result.current).toBe(0);
      expect(capturedValue).toBe(0);

      // Update atom
      act(() => {
        store.set(testAtom, 42);
      });

      // Value should update
      expect(result.current).toBe(42);
      expect(capturedValue).toBe(42);
      expect(renderCount).toBe(2);
    });

    it("PROBLEM DEMO: multiple sets in batch", () => {
      const testAtom = atom(0, "react.batch.test");
      store.get(testAtom);

      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useAtomValue(testAtom, store);
      });

      // Multiple sets in batch
      act(() => {
        store.set(testAtom, 1);
        store.set(testAtom, 2);
        store.set(testAtom, 3);
      });

      // Component should update with last value
      expect(result.current).toBe(3);
      // Render count depends on batching implementation
      expect(renderCount).toBeGreaterThanOrEqual(2);
    });

    it("PROBLEM DEMO: stale closure in useCallback", () => {
      const testAtom = atom(0, `react.closure.test.${testId}`);
      store.get(testAtom);

      let callbackValue: number | undefined;

      const { result, rerender } = renderHook(() => {
        const value = useAtomValue(testAtom, store);

        const callback = React.useCallback(() => {
          callbackValue = value;
        }, [value]);

        return { value, callback };
      });

      // Update value
      act(() => {
        store.set(testAtom, 100);
      });

      rerender();

      // Call callback
      act(() => {
        result.current.callback();
      });

      // callback should capture actual value
      expect(callbackValue).toBe(100);
    });
  });

  describe("Problem 2: batcher.schedule() delays notifications", () => {
    it("PROBLEM DEMO: notification delay in React", () => {
      const testAtom = atom(0, "react.batcher.delay");
      store.get(testAtom);

      let notificationTime = 0;
      let setTime = 0;

      const { result } = renderHook(() => {
        const value = useAtomValue(testAtom, store);
        if (value > 0 && notificationTime === 0) {
          notificationTime = Date.now();
        }
        return value;
      });

      setTime = Date.now();
      act(() => {
        store.set(testAtom, 1);
      });

      // notificationTime should be >= setTime
      expect(notificationTime).toBeGreaterThanOrEqual(setTime);
      expect(result.current).toBe(1);
    });

    it("PROBLEM DEMO: nested batches in React", () => {
      const testAtom = atom(0, "react.nested.batch");
      store.get(testAtom);

      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useAtomValue(testAtom, store);
      });

      // Nested batches
      act(() => {
        store.set(testAtom, 1);
        // Nested batch
        store.set(testAtom, 2);
      });

      expect(result.current).toBe(2);
      // Render count depends on implementation
      expect(renderCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Problem 3: restore from time-travel doesn't notify React", () => {
    let timeTravel: SimpleTimeTravel;
    let contentAtom: ReturnType<typeof atom<string>>;

    beforeEach(() => {
      contentAtom = atom("", "react.restore.content");
      store.get(contentAtom);
      timeTravel = new SimpleTimeTravel(store, {
        maxHistory: 100,
        autoCapture: false,
      });
    });

    afterEach(() => {
      timeTravel.dispose();
    });

    it("PROBLEM DEMO: React component doesn't receive notification on restore", () => {
      let renderCount = 0;
      let capturedValue: string | undefined;

      const contentAtom = atom("", `react.restore.content.${testId}`);
      store.get(contentAtom);

      const { result, rerender } = renderHook(() => {
        renderCount++;
        const value = useAtomValue(contentAtom, store);
        capturedValue = value;
        return value;
      });

      // Create snapshots
      act(() => {
        store.set(contentAtom, "Original");
        timeTravel.capture("snap1");

        store.set(contentAtom, "Modified");
        timeTravel.capture("snap2");
      });

      // Reset render count
      renderCount = 0;

      // Restore
      act(() => {
        timeTravel.jumpTo(0);
      });

      // Component should receive notification and update
      expect(capturedValue).toBe("Original");
      expect(result.current).toBe("Original");
      expect(renderCount).toBeGreaterThan(0);
    });

    it("PROBLEM DEMO: undo/redo and React notifications", () => {
      let renderCount = 0;
      let capturedValue: string | undefined;

      const contentAtom = atom("", `react.restore.undo.${testId}`);
      store.get(contentAtom);

      const { result, rerender } = renderHook(() => {
        renderCount++;
        const value = useAtomValue(contentAtom, store);
        capturedValue = value;
        return value;
      });

      // Create history
      act(() => {
        for (let i = 1; i <= 3; i++) {
          store.set(contentAtom, `State ${i}`);
          timeTravel.capture(`snap${i}`);
        }
      });

      // Undo
      renderCount = 0;
      act(() => {
        timeTravel.undo();
      });

      expect(capturedValue).toBe("State 2");
      expect(result.current).toBe("State 2");
      expect(renderCount).toBeGreaterThan(0);

      // Redo
      renderCount = 0;
      act(() => {
        timeTravel.redo();
      });

      expect(capturedValue).toBe("State 3");
      expect(result.current).toBe("State 3");
      expect(renderCount).toBeGreaterThan(0);
    });

    it("PROBLEM DEMO: multiple React components on restore", () => {
      const atom1 = atom("", `react.multi.atom1.${testId}`);
      const atom2 = atom("", `react.multi.atom2.${testId}`);
      store.get(atom1);
      store.get(atom2);

      let component1Renders = 0;
      let component2Renders = 0;
      let capturedValue1: string | undefined;
      let capturedValue2: string | undefined;

      const { result: result1, rerender: rerender1 } = renderHook(() => {
        component1Renders++;
        const value = useAtomValue(atom1, store);
        capturedValue1 = value;
        return value;
      });

      const { result: result2, rerender: rerender2 } = renderHook(() => {
        component2Renders++;
        const value = useAtomValue(atom2, store);
        capturedValue2 = value;
        return value;
      });

      // Create snapshots
      act(() => {
        store.set(atom1, "A1");
        store.set(atom2, "A2");
        timeTravel.capture("snap1");

        store.set(atom1, "B1");
        store.set(atom2, "B2");
        timeTravel.capture("snap2");
      });

      // Reset counters
      component1Renders = 0;
      component2Renders = 0;

      // Restore
      act(() => {
        timeTravel.undo();
      });

      // BOTH components should receive notifications
      expect(capturedValue1).toBe("A1");
      expect(capturedValue2).toBe("A2");
      expect(component1Renders).toBeGreaterThan(0);
      expect(component2Renders).toBeGreaterThan(0);
    });

    it("PROBLEM DEMO: useAtom with setter on restore", () => {
      let renderCount = 0;
      let capturedValue: string | undefined;

      const restoreAtom = atom("", `react.restore.setter.${testId}`);
      store.get(restoreAtom);

      const { result, rerender } = renderHook(() => {
        renderCount++;
        const [value, setValue] = useAtom(restoreAtom, store);
        capturedValue = value;
        return { value, setValue };
      });

      // Create snapshots
      act(() => {
        store.set(restoreAtom, "Original");
        timeTravel.capture("snap1");

        store.set(restoreAtom, "Modified");
        timeTravel.capture("snap2");
      });

      renderCount = 0;

      // Restore
      act(() => {
        timeTravel.jumpTo(0);
      });

      expect(capturedValue).toBe("Original");
      expect(result.current.value).toBe("Original");
      expect(renderCount).toBeGreaterThan(0);

      // Check that setter still works
      act(() => {
        result.current.setValue("New Value");
      });

      expect(result.current.value).toBe("New Value");
    });

    it.skip("PROBLEM DEMO: race condition on fast undo/redo (TODO: needs React batching fix)", () => {
      const raceAtom = atom("", `react.restore.race.${testId}`);
      store.get(raceAtom);

      // Create history
      act(() => {
        for (let i = 1; i <= 3; i++) {
          store.set(raceAtom, `State ${i}`);
          timeTravel.capture(`snap${i}`);
        }
      });

      let renderCount = 0;
      let capturedValue: string | undefined;

      const { result, rerender } = renderHook(() => {
        renderCount++;
        const value = useAtomValue(raceAtom, store);
        capturedValue = value;
        return value;
      });

      // Fast undo/redo
      act(() => {
        timeTravel.undo(); // State 2
        timeTravel.undo(); // State 1
        timeTravel.redo(); // State 2
        timeTravel.redo(); // State 3
      });

      // Force re-render to get latest value
      rerender();

      // Value should be "State 3" after redo
      expect(result.current).toBe("State 3");
    });

    it.skip("INTEGRATION: realistic React component scenario (TODO: needs React batching fix)", () => {
      // Emulating form component with time travel
      const formAtom = atom({ text: "", line: 0, col: 0 }, `react.form.state.${testId}`);
      store.get(formAtom);

      const timeTravelForm = new SimpleTimeTravel(store, {
        maxHistory: 100,
        autoCapture: true,
      });

      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useAtom(formAtom, store);
      });

      // Emulating user input
      act(() => {
        result.current[1]((prev) => ({
          ...prev,
          text: "Hello",
          line: 1,
          col: 5,
        }));
      });

      // Check first state
      expect(result.current[0].text).toBe("Hello");
      expect(result.current[0].line).toBe(1);
      expect(result.current[0].col).toBe(5);

      // Another change
      act(() => {
        result.current[1]((prev) => ({
          ...prev,
          text: "Hello World",
          line: 2,
          col: 10,
        }));
      });

      expect(result.current[0].text).toBe("Hello World");

      // Restore first state
      act(() => {
        timeTravelForm.undo();
      });

      // Check restored state
      expect(result.current[0].text).toBe("Hello");
      expect(result.current[0].line).toBe(1);
      expect(result.current[0].col).toBe(5);

      timeTravelForm.dispose();
    });
  });

  describe("Complex scenarios", () => {
    it("PROBLEM DEMO: computed atoms and React", () => {
      const countAtom = atom(0, "react.computed.count");
      const doubleAtom = atom((get) => get(countAtom) * 2, "react.computed.double");
      store.get(countAtom);
      store.get(doubleAtom);

      let countRenders = 0;
      let doubleRenders = 0;

      const { result: countResult } = renderHook(() => {
        countRenders++;
        return useAtomValue(countAtom, store);
      });

      const { result: doubleResult } = renderHook(() => {
        doubleRenders++;
        return useAtomValue(doubleAtom, store);
      });

      // Update count
      act(() => {
        store.set(countAtom, 5);
      });

      expect(countResult.current).toBe(5);
      expect(doubleResult.current).toBe(10);
      expect(countRenders).toBe(2);
      expect(doubleRenders).toBe(2);
    });

    it("PROBLEM DEMO: multiple dependent components", () => {
      const atom1 = atom(0, "react.dep.atom1");
      const atom2 = atom((get) => get(atom1) * 2, "react.dep.atom2");
      const atom3 = atom((get) => get(atom2) + 10, "react.dep.atom3");

      store.get(atom1);
      store.get(atom2);
      store.get(atom3);

      let render1 = 0;
      let render2 = 0;
      let render3 = 0;

      renderHook(() => {
        render1++;
        return useAtomValue(atom1, store);
      });

      renderHook(() => {
        render2++;
        return useAtomValue(atom2, store);
      });

      renderHook(() => {
        render3++;
        return useAtomValue(atom3, store);
      });

      // Update base atom
      act(() => {
        store.set(atom1, 5);
      });

      // All components should update
      expect(render1).toBe(2);
      expect(render2).toBe(2);
      expect(render3).toBe(2);
    });
  });
});

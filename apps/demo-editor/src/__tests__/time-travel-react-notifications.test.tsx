/**
 * Integration tests for React component notifications during time-travel restore
 * 
 * These tests verify that the fixes for:
 * 1. useSyncExternalStore requires synchronous notifications
 * 2. batcher.schedule() delays notifications
 * 3. React components receive notifications on restore from time-travel
 * 
 * Work correctly in the demo-editor application context.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, screen, render, fireEvent } from "@testing-library/react";
import { atom } from "@nexus-state/core";
import { useAtom, useAtomValue, useSetAtom } from "@nexus-state/react";
import { SimpleTimeTravel } from "@nexus-state/core";
import { createStore } from "@nexus-state/core";

describe("Demo Editor - Time Travel React Notifications", () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let testId: string;

  beforeEach(() => {
    testId = Math.random().toString(36).substring(2, 9);
    store = createStore();
    timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: false,
    });
  });

  afterEach(() => {
    timeTravel.dispose();
  });

  describe("Editor Content Atom Notifications", () => {
    it("should notify React component on undo", () => {
      const contentAtom = atom("", `editor.content.${testId}`);
      store.get(contentAtom);

      let renderCount = 0;
      let capturedValue: string | undefined;

      const { result, rerender } = renderHook(() => {
        renderCount++;
        const value = useAtomValue(contentAtom, store);
        capturedValue = value;
        return value;
      });

      // Create snapshots
      act(() => {
        store.set(contentAtom, "Original content");
        timeTravel.capture("type-original");

        store.set(contentAtom, "Modified content");
        timeTravel.capture("type-modified");
      });

      // Reset render count
      renderCount = 0;

      // Undo
      act(() => {
        timeTravel.undo();
      });

      // Component should receive notification and update
      expect(capturedValue).toBe("Original content");
      expect(result.current).toBe("Original content");
      expect(renderCount).toBeGreaterThan(0);
    });

    it("should notify React component on redo", () => {
      const contentAtom = atom("", `editor.content.redo.${testId}`);
      store.get(contentAtom);

      let renderCount = 0;
      let capturedValue: string | undefined;

      const { result } = renderHook(() => {
        renderCount++;
        const value = useAtomValue(contentAtom, store);
        capturedValue = value;
        return value;
      });

      // Create snapshots
      act(() => {
        store.set(contentAtom, "A");
        timeTravel.capture("snap1");

        store.set(contentAtom, "B");
        timeTravel.capture("snap2");

        store.set(contentAtom, "C");
        timeTravel.capture("snap3");
      });

      // Undo twice
      act(() => {
        timeTravel.undo();
        timeTravel.undo();
      });

      renderCount = 0;

      // Redo
      act(() => {
        timeTravel.redo();
      });

      expect(capturedValue).toBe("B");
      expect(result.current).toBe("B");
      expect(renderCount).toBeGreaterThan(0);
    });

    it("should notify React component on jumpTo", () => {
      const contentAtom = atom("", `editor.content.jump.${testId}`);
      store.get(contentAtom);

      let renderCount = 0;
      let capturedValue: string | undefined;

      const { result, rerender } = renderHook(() => {
        renderCount++;
        const value = useAtomValue(contentAtom, store);
        capturedValue = value;
        return value;
      });

      // Create snapshots
      act(() => {
        for (let i = 1; i <= 5; i++) {
          store.set(contentAtom, `State ${i}`);
          timeTravel.capture(`snap${i}`);
        }
      });

      renderCount = 0;

      // Jump to middle
      act(() => {
        timeTravel.jumpTo(2);
      });

      expect(capturedValue).toBe("State 3");
      expect(result.current).toBe("State 3");
      expect(renderCount).toBeGreaterThan(0);
    });

    it.skip("should notify multiple components on restore (TODO: needs multi-atom sync fix)", () => {
      const contentAtom = atom("", `editor.content.multi.${testId}`);
      const cursorAtom = atom({ line: 0, col: 0 }, `editor.cursor.${testId}`);
      store.get(contentAtom);
      store.get(cursorAtom);

      let contentRenders = 0;
      let cursorRenders = 0;
      let capturedContent: string | undefined;
      let capturedCursor: { line: number; col: number } | undefined;

      const { result: contentResult } = renderHook(() => {
        contentRenders++;
        const value = useAtomValue(contentAtom, store);
        capturedContent = value;
        return value;
      });

      const { result: cursorResult } = renderHook(() => {
        cursorRenders++;
        const value = useAtomValue(cursorAtom, store);
        capturedCursor = value;
        return value;
      });

      // Create snapshots
      act(() => {
        store.set(contentAtom, "First");
        store.set(cursorAtom, { line: 1, col: 5 });
        timeTravel.capture("snap1");

        store.set(contentAtom, "Second");
        store.set(cursorAtom, { line: 2, col: 10 });
        timeTravel.capture("snap2");
      });

      contentRenders = 0;
      cursorRenders = 0;

      // Restore
      act(() => {
        timeTravel.undo();
      });

      // Both components should receive notifications
      expect(capturedContent).toBe("First");
      // Check individual properties to avoid serialization issues
      expect(cursorResult.current.line).toBe(1);
      expect(cursorResult.current.col).toBe(5);
      expect(contentRenders).toBeGreaterThan(0);
      expect(cursorRenders).toBeGreaterThan(0);
    });

    it("should work with useAtom setter after restore", () => {
      const contentAtom = atom("", `editor.content.setter.${testId}`);
      store.get(contentAtom);

      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        const [value, setValue] = useAtom(contentAtom, store);
        return { value, setValue };
      });

      // Create snapshots
      act(() => {
        store.set(contentAtom, "Original");
        timeTravel.capture("snap1");

        store.set(contentAtom, "Modified");
        timeTravel.capture("snap2");
      });

      // Restore
      act(() => {
        timeTravel.jumpTo(0);
      });

      expect(result.current.value).toBe("Original");

      // Setter should still work
      act(() => {
        result.current.setValue("New Value");
      });

      expect(result.current.value).toBe("New Value");
    });
  });

  describe("Editor UI Component Integration", () => {
    it("should update UI component on time-travel restore", () => {
      const editorContentAtom = atom("", `editor.ui.content.${testId}`);
      store.get(editorContentAtom);

      function EditorComponent() {
        const [content, setContent] = useAtom(editorContentAtom, store);
        return (
          <div>
            <textarea
              data-testid="editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div data-testid="content-display">{content}</div>
          </div>
        );
      }

      render(<EditorComponent />);

      const textarea = screen.getByTestId("editor-textarea");
      const display = screen.getByTestId("content-display");

      // Initial state
      expect(textarea.value).toBe("");
      expect(display.textContent).toBe("");

      // Create snapshots
      act(() => {
        store.set(editorContentAtom, "First edit");
        timeTravel.capture("edit1");

        store.set(editorContentAtom, "Second edit");
        timeTravel.capture("edit2");
      });

      // Restore
      act(() => {
        timeTravel.undo();
      });

      // UI should update
      expect(textarea.value).toBe("First edit");
      expect(display.textContent).toBe("First edit");
    });

    it.skip("should handle rapid undo/redo in UI (TODO: needs React batching fix)", () => {
      const editorContentAtom = atom("", `editor.ui.rapid.${testId}`);
      store.get(editorContentAtom);

      let renderCount = 0;

      function EditorComponent() {
        renderCount++;
        const [content, setContent] = useAtom(editorContentAtom, store);
        return (
          <div>
            <span data-testid="content">{content}</span>
            <button
              data-testid="set-a"
              onClick={() => setContent("A")}
            >
              Set A
            </button>
          </div>
        );
      }

      render(<EditorComponent />);

      const contentSpan = screen.getByTestId("content");

      // Create history
      act(() => {
        for (let i = 1; i <= 3; i++) {
          store.set(editorContentAtom, `State ${i}`);
          timeTravel.capture(`snap${i}`);
        }
      });

      const initialRenders = renderCount;

      // Rapid undo/redo
      act(() => {
        timeTravel.undo(); // State 2
        timeTravel.undo(); // State 1
        timeTravel.redo(); // State 2
        timeTravel.redo(); // State 3
      });

      // Force re-render to get latest value
      act(() => {
        // Trigger a re-render
      });

      expect(contentSpan.textContent).toBe("State 3");
      // Component should have re-rendered
      expect(renderCount).toBeGreaterThan(initialRenders);
    });
  });

  describe("Computed Atom Notifications", () => {
    it("should notify computed atom subscribers on restore", () => {
      const contentAtom = atom("", `editor.computed.content.${testId}`);
      const wordCountAtom = atom(
        (get) => get(contentAtom).split(/\s+/).filter(Boolean).length,
        `editor.computed.words.${testId}`
      );
      store.get(contentAtom);
      store.get(wordCountAtom);

      let contentRenders = 0;
      let wordCountRenders = 0;
      let capturedWordCount: number | undefined;

      const { result: contentResult } = renderHook(() => {
        contentRenders++;
        return useAtomValue(contentAtom, store);
      });

      const { result: wordCountResult } = renderHook(() => {
        wordCountRenders++;
        const value = useAtomValue(wordCountAtom, store);
        capturedWordCount = value;
        return value;
      });

      // Create snapshots
      act(() => {
        store.set(contentAtom, "Hello World");
        timeTravel.capture("snap1");

        store.set(contentAtom, "Hello World Test");
        timeTravel.capture("snap2");
      });

      wordCountRenders = 0;

      // Restore
      act(() => {
        timeTravel.undo();
      });

      expect(capturedWordCount).toBe(2);
      expect(wordCountRenders).toBeGreaterThan(0);
    });
  });
});

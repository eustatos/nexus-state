/**
 * Tests for README examples
 *
 * Purpose:
 * - Verify all code examples in README work correctly
 * - Detect broken API usage before publication
 */

import { describe, it, expect, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { createUndoRedo, withUndoRedo } from '../index';

describe('README: createUndoRedo', () => {
  it('should create undo/redo manager with options', () => {
    const undoRedo = createUndoRedo<string>({
      maxLength: 50,
      debounce: 0, // No debounce for tests
      ignoreFields: [],
    });

    expect(undoRedo.getCurrentState()).toBeUndefined();
    expect(undoRedo.getHistoryLength()).toBe(0);
    expect(undoRedo.canUndo()).toBe(false);
    expect(undoRedo.canRedo()).toBe(false);
  });

  it('push/undo/redo should work', () => {
    const undoRedo = createUndoRedo<number>({ debounce: 0 });

    undoRedo.push(1);
    undoRedo.push(2);
    undoRedo.push(3);

    expect(undoRedo.getCurrentState()).toBe(3);

    undoRedo.undo();
    expect(undoRedo.getCurrentState()).toBe(2);

    undoRedo.redo();
    expect(undoRedo.getCurrentState()).toBe(3);
  });

  it('clear should reset history', () => {
    const undoRedo = createUndoRedo<string>({ debounce: 0 });

    undoRedo.push('a');
    undoRedo.push('b');
    undoRedo.clear();

    expect(undoRedo.getHistoryLength()).toBe(0);
    expect(undoRedo.canUndo()).toBe(false);
  });
});

describe('README: Events', () => {
  it('should emit events', () => {
    const undoRedo = createUndoRedo<string>({ debounce: 0 });

    const changeListener = vi.fn();
    const undoListener = vi.fn();
    const redoListener = vi.fn();
    const clearListener = vi.fn();

    undoRedo.on('change', changeListener);
    undoRedo.on('undo', undoListener);
    undoRedo.on('redo', redoListener);
    undoRedo.on('clear', clearListener);

    undoRedo.push('a');
    undoRedo.push('b');

    expect(changeListener).toHaveBeenCalledTimes(2);

    undoRedo.undo();
    expect(undoListener).toHaveBeenCalled();

    undoRedo.redo();
    expect(redoListener).toHaveBeenCalled();

    undoRedo.clear();
    expect(clearListener).toHaveBeenCalled();
  });
});

describe('README: Keyboard Shortcuts', () => {
  it('enableKeyboardShortcuts should not throw', () => {
    const undoRedo = createUndoRedo<string>({ debounce: 0 });

    expect(() => {
      undoRedo.enableKeyboardShortcuts({
        undo: ['ctrl+z', 'meta+z'],
        redo: ['ctrl+y', 'meta+shift+z', 'ctrl+shift+z'],
      });
    }).not.toThrow();

    undoRedo.disableKeyboardShortcuts();
  });
});

describe('README: State Properties', () => {
  it('should track historyLength and position', () => {
    const undoRedo = createUndoRedo<number>({ debounce: 0 });

    expect(undoRedo.getHistoryLength()).toBe(0);
    expect(undoRedo.getPosition()).toBe(-1);

    undoRedo.push(1);
    expect(undoRedo.getHistoryLength()).toBe(1);

    undoRedo.push(2);
    undoRedo.push(3);
    expect(undoRedo.getHistoryLength()).toBe(3);

    undoRedo.undo();
    expect(undoRedo.getPosition()).toBe(1);

    undoRedo.undo();
    expect(undoRedo.getPosition()).toBe(0);
  });
});

describe('README: Batch Operations', () => {
  it('batch should treat multiple pushes as one', () => {
    const undoRedo = createUndoRedo<string>({ debounce: 0 });

    undoRedo.batch(() => {
      undoRedo.push('a');
      undoRedo.push('b');
      undoRedo.push('c');
    });

    // All three pushes happened, but we can undo once to get before the batch
    undoRedo.undo();
    expect(undoRedo.getCurrentState()).toBeUndefined();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { UndoRedoStack } from '../UndoRedoStack';

describe('UndoRedoStack', () => {
  let stack: UndoRedoStack<string>;

  beforeEach(() => {
    stack = new UndoRedoStack<string>(5);
  });

  describe('push', () => {
    it('should push a state onto the stack', () => {
      stack.push('state1');
      expect(stack.getCurrent()).toBe('state1');
      expect(stack.length).toBe(1);
    });

    it('should push multiple states', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');

      expect(stack.getCurrent()).toBe('state3');
      expect(stack.length).toBe(3);
    });

    it('should respect maxLength', () => {
      const shortStack = new UndoRedoStack<string>(3);
      shortStack.push('state1');
      shortStack.push('state2');
      shortStack.push('state3');
      shortStack.push('state4');

      expect(shortStack.length).toBe(3);
      expect(shortStack.getCurrent()).toBe('state4');
    });

    it('should remove redo states when pushing new state', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');
      stack.undo(); // Now at state2
      stack.undo(); // Now at state1
      stack.push('state4'); // Should remove state3

      expect(stack.length).toBe(2);
      expect(stack.getCurrent()).toBe('state4');
      expect(stack.canRedo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('should undo to the previous state', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');

      const result = stack.undo();
      expect(result).toBe('state3');
      expect(stack.getCurrent()).toBe('state2');
    });

    it('should return undefined when no undo available', () => {
      const result = stack.undo();
      expect(result).toBeUndefined();
      expect(stack.canUndo()).toBe(false);
    });

    it('should allow multiple undos', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');

      stack.undo(); // state2
      stack.undo(); // state1

      expect(stack.getCurrent()).toBe('state1');
      expect(stack.canUndo()).toBe(true);
      expect(stack.canRedo()).toBe(true);
    });
  });

  describe('redo', () => {
    it('should redo to the next state', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');

      stack.undo(); // state2
      stack.undo(); // state1

      const result = stack.redo();
      expect(result).toBe('state2');
      expect(stack.getCurrent()).toBe('state2');
    });

    it('should return undefined when no redo available', () => {
      stack.push('state1');
      const result = stack.redo();
      expect(result).toBeUndefined();
      expect(stack.canRedo()).toBe(false);
    });

    it('should allow multiple redos', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');

      stack.undo(); // state2
      stack.undo(); // state1

      stack.redo(); // state2
      stack.redo(); // state3

      expect(stack.getCurrent()).toBe('state3');
      expect(stack.canRedo()).toBe(false);
    });
  });

  describe('jumpTo', () => {
    it('should jump to a specific position', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');
      stack.push('state4');

      const result = stack.jumpTo(1);
      expect(result).toBe('state2');
      expect(stack.getCurrent()).toBe('state2');
    });

    it('should return undefined for invalid index', () => {
      stack.push('state1');
      const result = stack.jumpTo(10);
      expect(result).toBeUndefined();
    });

    it('should update position correctly', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');

      stack.jumpTo(1);
      expect(stack.position).toBe(1);

      stack.jumpTo(0);
      expect(stack.position).toBe(0);
    });
  });

  describe('canUndo/canRedo', () => {
    it('should correctly report undo availability', () => {
      expect(stack.canUndo()).toBe(false);

      stack.push('state1');
      expect(stack.canUndo()).toBe(true);

      stack.undo();
      expect(stack.canUndo()).toBe(false);
    });

    it('should correctly report redo availability', () => {
      stack.push('state1');
      stack.push('state2');

      stack.undo();
      expect(stack.canRedo()).toBe(true);

      stack.redo();
      expect(stack.canRedo()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');

      stack.clear();

      expect(stack.length).toBe(0);
      expect(stack.getCurrent()).toBeUndefined();
      expect(stack.canUndo()).toBe(false);
      expect(stack.canRedo()).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('should return all history entries', () => {
      stack.push('state1');
      stack.push('state2');
      stack.push('state3');

      const history = stack.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].state).toBe('state1');
      expect(history[1].state).toBe('state2');
      expect(history[2].state).toBe('state3');
    });

    it('should return entries with metadata', () => {
      stack.push('state1', { action: 'test-action' });

      const history = stack.getHistory();
      expect(history[0].metadata.action).toBe('test-action');
      expect(history[0].metadata.timestamp).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      stack.push('state1');
      stack.push('state2');

      const stats = stack.getStats();

      expect(stats.length).toBe(2);
      expect(stats.position).toBe(1);
      expect(stats.maxLength).toBe(5);
      expect(stats.canUndo).toBe(true);
      expect(stats.canRedo).toBe(false);
    });
  });
});

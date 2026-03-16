import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUndoRedo, UndoRedoManager } from '../index';

describe('UndoRedoManager', () => {
  let manager: UndoRedoManager<string>;

  beforeEach(() => {
    manager = createUndoRedo<string>({ maxLength: 10, debounce: 0 });
  });

  describe('push', () => {
    it('should push state and emit push event', () => {
      const pushListener = vi.fn();
      manager.on('push', pushListener);

      manager.push('state1', { action: 'test' });

      expect(pushListener).toHaveBeenCalledWith('state1', expect.objectContaining({ action: 'test' }));
      expect(manager.getCurrentState()).toBe('state1');
    });

    it('should emit change event on push', () => {
      const changeListener = vi.fn();
      manager.on('change', changeListener);

      manager.push('state1', { action: 'test' });

      expect(changeListener).toHaveBeenCalledWith('state1', expect.objectContaining({ action: 'test' }));
    });
  });

  describe('undo', () => {
    it('should undo and emit undo event', () => {
      const undoListener = vi.fn();
      manager.on('undo', undoListener);

      manager.push('state1');
      manager.push('state2');
      const result = manager.undo();

      expect(result).toBe('state2');
      expect(undoListener).toHaveBeenCalledWith('state2', undefined);
      expect(manager.getCurrentState()).toBe('state1');
    });

    it('should emit change event on undo', () => {
      const changeListener = vi.fn();
      manager.on('change', changeListener);

      manager.push('state1');
      manager.push('state2');
      manager.undo();

      expect(changeListener).toHaveBeenCalledWith('state2', undefined);
    });

    it('should return undefined when no undo available', () => {
      const result = manager.undo();
      expect(result).toBeUndefined();
    });
  });

  describe('redo', () => {
    it('should redo and emit redo event', () => {
      const redoListener = vi.fn();
      manager.on('redo', redoListener);

      manager.push('state1');
      manager.push('state2');
      manager.undo();
      const result = manager.redo();

      expect(result).toBe('state2');
      expect(redoListener).toHaveBeenCalledWith('state2', undefined);
      expect(manager.getCurrentState()).toBe('state2');
    });

    it('should return undefined when no redo available', () => {
      manager.push('state1');
      const result = manager.redo();
      expect(result).toBeUndefined();
    });
  });

  describe('batch operations', () => {
    it('should group operations into single undo step', () => {
      manager.push('initial');

      manager.batch(() => {
        manager.push('state1');
        manager.push('state2');
        manager.push('state3');
      });

      // After batch, should be at state3
      expect(manager.getCurrentState()).toBe('state3');

      // Single undo should go back to initial
      manager.undo();
      expect(manager.getCurrentState()).toBe('initial');
    });

    it('should track batch metadata', () => {
      manager.batch(() => {
        manager.push('state1');
        manager.push('state2');
      }, { action: 'batch-action' });

      const history = manager.getHistory();
      expect(history[history.length - 1].metadata.batch).toBe(true);
      expect(history[history.length - 1].metadata.operationCount).toBe(2);
    });
  });

  describe('events', () => {
    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.on('change', listener1);
      manager.on('change', listener2);

      manager.push('state1');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should support unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = manager.on('change', listener);

      manager.push('state1');
      expect(listener).toHaveBeenCalled();

      unsubscribe();
      listener.mockClear();

      manager.push('state2');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit clear event', () => {
      const clearListener = vi.fn();
      manager.on('clear', clearListener);

      manager.push('state1');
      manager.clear();

      expect(clearListener).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      manager.push('state1');
      manager.push('state2');
      manager.undo();

      const stats = manager.getStats();

      expect(stats.historyLength).toBe(2);
      expect(stats.position).toBe(0);
      expect(stats.canUndo).toBe(true);
      expect(stats.canRedo).toBe(true);
    });
  });

  describe('updateOptions', () => {
    it('should update options', () => {
      manager.updateOptions({ maxLength: 100 });

      const options = manager.getOptions();
      expect(options.maxLength).toBe(100);
    });
  });
});

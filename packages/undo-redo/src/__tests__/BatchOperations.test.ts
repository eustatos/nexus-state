import { describe, it, expect, beforeEach } from 'vitest';
import { createUndoRedo } from '../index';

describe('BatchOperations', () => {
  let undoRedo: ReturnType<typeof createUndoRedo<string>>;

  beforeEach(() => {
    undoRedo = createUndoRedo<string>({ maxLength: 10 });
  });

  it('should group multiple pushes into single undo step', () => {
    undoRedo.push('initial');

    undoRedo.batch(() => {
      undoRedo.push('state1');
      undoRedo.push('state2');
      undoRedo.push('state3');
    });

    // Should be at state3 after batch
    expect(undoRedo.getCurrentState()).toBe('state3');

    // Single undo should go back to initial (skipping all batched states)
    undoRedo.undo();
    expect(undoRedo.getCurrentState()).toBe('initial');
  });

  it('should track batch metadata', () => {
    undoRedo.batch(() => {
      undoRedo.push('state1');
      undoRedo.push('state2');
    }, { action: 'batch-action' });

    const history = undoRedo.getHistory();
    const lastEntry = history[history.length - 1];

    expect(lastEntry.metadata.batch).toBe(true);
    expect(lastEntry.metadata.operationCount).toBe(2);
    expect(lastEntry.metadata.action).toBe('batch-action');
  });

  it('should support manual batch start/end', () => {
    undoRedo.batchStart();
    undoRedo.push('state1');
    undoRedo.push('state2');
    undoRedo.push('state3');
    undoRedo.batchEnd({ action: 'manual-batch' });

    expect(undoRedo.getCurrentState()).toBe('state3');

    undoRedo.undo();
    expect(undoRedo.getCurrentState()).toBeUndefined(); // No initial state pushed
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { createUndoRedo } from '../index';

describe('Debounce', () => {
  it('should not debounce when debounce is 0', () => {
    const undoRedo = createUndoRedo<string>({ debounce: 0 });
    const pushListener = vi.fn();
    undoRedo.on('push', pushListener);

    undoRedo.push('state1');
    undoRedo.push('state2');

    // Should emit immediately
    expect(pushListener).toHaveBeenCalledTimes(2);
  });
});

/**
 * AtomChangeDetector basic tests
 */

import { describe, it, expect, vi } from 'vitest';
import { AtomChangeDetector } from '../AtomChangeDetector';
import type { AtomTracker } from '../AtomTracker';

function createMockTracker(): jest.Mocked<AtomTracker> {
  return {
    subscribe: vi.fn(),
  } as unknown as jest.Mocked<AtomTracker>;
}

describe('AtomChangeDetector', () => {
  it('should create with tracker', () => {
    const mockTracker = createMockTracker();
    const detector = new AtomChangeDetector(mockTracker);

    expect(detector).toBeDefined();
    expect(mockTracker.subscribe).toHaveBeenCalled();
  });
});

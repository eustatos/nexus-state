/**
 * Test utilities for cleaning up global state between tests
 */

import { batcher } from './batching';

/**
 * Clean up all global state between tests
 * This ensures test isolation by clearing:
 * - Batcher queues and state
 *
 * Note: Atom registry is now per-store (ScopedRegistry),
 * so no global cleanup needed for atoms.
 */
export function cleanupGlobalState(): void {
  // Reset batcher (clears queues and resets depth)
  batcher.reset();
}

/**
 * Create a test isolation helper
 * Returns functions to setup and cleanup test environment
 */
export function createTestIsolation() {
  return {
    setup: () => {
      cleanupGlobalState();
    },
    teardown: () => {
      cleanupGlobalState();
    }
  };
}

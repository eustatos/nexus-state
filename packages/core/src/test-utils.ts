/**
 * Test utilities for cleaning up global state between tests
 */

import { atomRegistry } from './atom-registry';
import { batcher } from './batching';

/**
 * Clean up all global state between tests
 * This ensures test isolation by clearing:
 * - Atom registry
 * - Batcher queues and state
 */
export function cleanupGlobalState(): void {
  // Clear atom registry
  atomRegistry.clear();
  
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

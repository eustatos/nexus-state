/**
 * Test utilities for cleaning up global state between tests
 */

/**
 * Clean up all global state between tests
 * This ensures test isolation.
 *
 * Note: Batcher is now per-instance (no global singleton),
 * and atom registry is per-store (ScopedRegistry),
 * so no global cleanup is needed.
 */
export function cleanupGlobalState(): void {
  // No-op: no more global singletons to clean up
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
    },
  };
}

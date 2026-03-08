/**
 * SnapshotIdGenerator - Generates unique snapshot IDs
 */

import type { ISnapshotIdGenerator } from './types.interfaces';

/**
 * Default implementation of snapshot ID generator
 */
export class SnapshotIdGenerator implements ISnapshotIdGenerator {
  /**
   * Generate unique ID
   */
  generate(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  /**
   * Generate prefixed ID
   */
  generateWithPrefix(prefix: string): string {
    return `${prefix}-${this.generate()}`;
  }

  /**
   * Generate timestamp-based ID
   */
  generateWithTimestamp(): string {
    return `snap-${Date.now()}-${this.generate()}`;
  }
}

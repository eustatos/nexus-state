/**
 * SnapshotValidator - Validates snapshots
 */

import type { ISnapshotValidator } from './types.interfaces';
import type { Snapshot, SnapshotStateEntry } from '../types';

/**
 * Default implementation of snapshot validator
 */
export class SnapshotValidator implements ISnapshotValidator {
  /**
   * Validate snapshot
   */
  validate(snapshot: Snapshot): boolean {
    if (!snapshot.id) return false;
    if (!snapshot.metadata || !snapshot.metadata.timestamp) return false;
    if (typeof snapshot.state !== 'object') return false;

    return this.validateState(snapshot.state);
  }

  /**
   * Validate snapshot state
   */
  validateState(state: Record<string, SnapshotStateEntry>): boolean {
    if (typeof state !== 'object' || state === null) return false;

    for (const [key, entry] of Object.entries(state)) {
      if (!this.validateEntry(key, entry)) return false;
    }

    return true;
  }

  /**
   * Validate single state entry
   */
  private validateEntry(key: string, entry: SnapshotStateEntry): boolean {
    if (!key || typeof key !== 'string') return false;
    if (!entry || typeof entry !== 'object') return false;
    if (!('value' in entry)) return false;
    if (!('type' in entry)) return false;
    if (!('name' in entry)) return false;
    if (!('atomId' in entry)) return false;

    return true;
  }
}

/**
 * ChangeDetector - Detects and creates change events
 */

import type { ChangeEvent } from '../types';
import type { IChangeDetector } from './types.interfaces';
import type { Atom } from '../../../types';

/**
 * Default implementation of change detector
 */
export class ChangeDetector implements IChangeDetector {
  /**
   * Detect change type
   */
  detectChangeType(
    oldValue: unknown,
    newValue: unknown,
  ): 'created' | 'deleted' | 'value' | 'type' | 'unknown' {
    if (oldValue === undefined) return 'created';
    if (newValue === undefined) return 'deleted';
    if (typeof oldValue !== typeof newValue) return 'type';
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) return 'value';
    return 'unknown';
  }

  /**
   * Create change event
   */
  createEvent(
    atomId: symbol,
    atomName: string,
    atom: Atom<unknown>,
    oldValue: unknown,
    newValue: unknown,
  ): ChangeEvent {
    const type = this.detectChangeType(oldValue, newValue);
    return {
      atom,
      atomId,
      atomName,
      oldValue,
      newValue,
      timestamp: Date.now(),
      type,
    };
  }

  /**
   * Check for changes
   */
  hasChanged(_atomId: symbol, oldValue: unknown, newValue: unknown): boolean {
    if (oldValue === undefined && newValue === undefined) return false;
    if (oldValue === undefined || newValue === undefined) return true;
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }
}

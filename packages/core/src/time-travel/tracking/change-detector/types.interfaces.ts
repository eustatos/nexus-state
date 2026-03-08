/**
 * ChangeDetector module interfaces
 * Enables dependency injection and testability
 */

import type { ChangeEvent, ChangeFilter, ChangeBatch } from '../types';
import type { Atom } from '../../../types';

/**
 * Registry for change listeners
 */
export interface IChangeListenerRegistry {
  /**
   * Add listener for specific atom
   */
  addListener(atomId: symbol, listener: (event: ChangeEvent) => void): () => void;

  /**
   * Remove listener for atom
   */
  removeListener(atomId: symbol, listener: (event: ChangeEvent) => void): void;

  /**
   * Add global listener
   */
  addGlobalListener(listener: (event: ChangeEvent) => void): () => void;

  /**
   * Remove global listener
   */
  removeGlobalListener(listener: (event: ChangeEvent) => void): void;

  /**
   * Notify listeners of change
   */
  notify(event: ChangeEvent): void;

  /**
   * Get listener count
   */
  getListenerCount(): number;

  /**
   * Check if atom has listeners
   */
  hasListeners(atomId: symbol): boolean;

  /**
   * Clear all listeners
   */
  clear(): void;
}

/**
 * Filter manager for change events
 */
export interface IChangeFilterManager {
  /**
   * Add filter
   */
  addFilter(filter: ChangeFilter): () => void;

  /**
   * Remove filter
   */
  removeFilter(filter: ChangeFilter): void;

  /**
   * Check if event passes all filters
   */
  passesFilters(event: ChangeEvent): boolean;

  /**
   * Clear all filters
   */
  clear(): void;

  /**
   * Get filter count
   */
  getFilterCount(): number;
}

/**
 * Batcher for change events
 */
export interface IChangeBatcher {
  /**
   * Start batching mode
   */
  startBatch(): void;

  /**
   * End batching mode
   */
  endBatch(): ChangeBatch;

  /**
   * Check if in batch mode
   */
  isBatching(): boolean;

  /**
   * Add change to batch
   */
  addChange(event: ChangeEvent): void;

  /**
   * Execute function in batch mode
   */
  batch<T>(fn: () => T): ChangeBatch;

  /**
   * Get pending changes
   */
  getPendingChanges(): ChangeEvent[];

  /**
   * Clear pending changes
   */
  clearPending(): void;
}

/**
 * Change detection and event creation
 */
export interface IChangeDetector {
  /**
   * Detect change type
   */
  detectChangeType(oldValue: unknown, newValue: unknown): string;

  /**
   * Create change event
   */
  createEvent(
    atomId: symbol,
    atomName: string,
    atom: Atom<unknown>,
    oldValue: unknown,
    newValue: unknown,
  ): ChangeEvent;

  /**
   * Check for changes
   */
  hasChanged(atomId: symbol, oldValue: unknown, newValue: unknown): boolean;
}

/**
 * Value tracking for change detection
 */
export interface IValueTracker {
  /**
   * Store value for atom
   */
  storeValue(atomId: symbol, value: unknown): void;

  /**
   * Get stored value
   */
  getValue(atomId: symbol): unknown;

  /**
   * Check if atom has stored value
   */
  hasValue(atomId: symbol): boolean;

  /**
   * Delete stored value
   */
  deleteValue(atomId: symbol): void;

  /**
   * Clear all values
   */
  clear(): void;
}

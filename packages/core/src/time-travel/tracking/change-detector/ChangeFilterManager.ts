/**
 * ChangeFilterManager - Manages change filters
 */

import type { ChangeEvent, ChangeFilter } from '../types';
import type { IChangeFilterManager } from './types.interfaces';

/**
 * Default implementation of change filter manager
 */
export class ChangeFilterManager implements IChangeFilterManager {
  private filters: ChangeFilter[] = [];

  /**
   * Add filter
   */
  addFilter(filter: ChangeFilter): () => void {
    this.filters.push(filter);
    return () => this.removeFilter(filter);
  }

  /**
   * Remove filter
   */
  removeFilter(filter: ChangeFilter): void {
    const index = this.filters.indexOf(filter);
    if (index >= 0) {
      this.filters.splice(index, 1);
    }
  }

  /**
   * Check if event passes all filters
   */
  passesFilters(event: ChangeEvent): boolean {
    return this.filters.every((filter) => {
      try {
        return filter(event);
      } catch (error) {
        console.error('Filter error:', error);
        return true; // Pass on error
      }
    });
  }

  /**
   * Clear all filters
   */
  clear(): void {
    this.filters = [];
  }

  /**
   * Get filter count
   */
  getFilterCount(): number {
    return this.filters.length;
  }
}

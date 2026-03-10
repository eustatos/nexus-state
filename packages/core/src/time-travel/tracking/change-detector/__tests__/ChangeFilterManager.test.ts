/**
 * ChangeFilterManager tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ChangeFilterManager } from '../ChangeFilterManager';
import type { ChangeEvent } from '../../types';

function createMockEvent(): ChangeEvent {
  return {
    atom: {} as any,
    atomId: Symbol('test'),
    atomName: 'test',
    oldValue: 1,
    newValue: 2,
    timestamp: Date.now(),
    type: 'value',
  };
}

describe('ChangeFilterManager', () => {
  describe('addFilter', () => {
    it('should add filter', () => {
      const manager = new ChangeFilterManager();
      const filter = vi.fn().mockReturnValue(true);

      const unsubscribe = manager.addFilter(filter);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const manager = new ChangeFilterManager();
      const filter = vi.fn().mockReturnValue(true);

      const unsubscribe = manager.addFilter(filter);
      unsubscribe();

      expect(manager.getFilterCount()).toBe(0);
    });
  });

  describe('passesFilters', () => {
    it('should return true when no filters', () => {
      const manager = new ChangeFilterManager();
      const event = createMockEvent();

      expect(manager.passesFilters(event)).toBe(true);
    });

    it('should return true when all filters pass', () => {
      const manager = new ChangeFilterManager();
      const filter1 = vi.fn().mockReturnValue(true);
      const filter2 = vi.fn().mockReturnValue(true);

      manager.addFilter(filter1);
      manager.addFilter(filter2);

      expect(manager.passesFilters(createMockEvent())).toBe(true);
    });

    it('should return false when any filter fails', () => {
      const manager = new ChangeFilterManager();
      const filter1 = vi.fn().mockReturnValue(true);
      const filter2 = vi.fn().mockReturnValue(false);

      manager.addFilter(filter1);
      manager.addFilter(filter2);

      expect(manager.passesFilters(createMockEvent())).toBe(false);
    });

    it('should handle filter errors gracefully', () => {
      const manager = new ChangeFilterManager();
      const errorFilter = vi.fn(() => {
        throw new Error('Filter error');
      });

      manager.addFilter(errorFilter);

      expect(() => manager.passesFilters(createMockEvent())).not.toThrow();
    });
  });

  describe('removeFilter', () => {
    it('should remove filter', () => {
      const manager = new ChangeFilterManager();
      const filter = vi.fn().mockReturnValue(true);

      manager.addFilter(filter);
      manager.removeFilter(filter);

      expect(manager.getFilterCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all filters', () => {
      const manager = new ChangeFilterManager();

      manager.addFilter(vi.fn());
      manager.addFilter(vi.fn());
      manager.clear();

      expect(manager.getFilterCount()).toBe(0);
    });
  });

  describe('getFilterCount', () => {
    it('should return 0 initially', () => {
      const manager = new ChangeFilterManager();
      expect(manager.getFilterCount()).toBe(0);
    });

    it('should return filter count', () => {
      const manager = new ChangeFilterManager();

      manager.addFilter(vi.fn());
      manager.addFilter(vi.fn());

      expect(manager.getFilterCount()).toBe(2);
    });
  });
});

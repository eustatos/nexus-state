import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyTracker } from './DependencyTracker';
import { createMockAtom } from '../test-utils/index';
import type { AtomState } from './AtomStateManager';

describe('DependencyTracker', () => {
  let tracker: DependencyTracker;

  beforeEach(() => {
    tracker = new DependencyTracker();
  });

  describe('addDependency', () => {
    it('should add dependent relationship', () => {
      const atomState = { dependents: new Set(), dependencies: new Set() } as AtomState<any>;
      const dependent = createMockAtom('dependent');

      const result = tracker.addDependency(atomState, dependent);

      expect(result).toBe(true);
      expect(atomState.dependents.has(dependent)).toBe(true);
    });

    it('should return false if dependency already exists', () => {
      const atomState = { dependents: new Set(), dependencies: new Set() } as AtomState<any>;
      const dependent = createMockAtom('dependent');

      tracker.addDependency(atomState, dependent);
      const result = tracker.addDependency(atomState, dependent);

      expect(result).toBe(false);
    });

    it('should track multiple dependents', () => {
      const atomState = { dependents: new Set(), dependencies: new Set() } as AtomState<any>;

      tracker.addDependency(atomState, createMockAtom('dep1'));
      tracker.addDependency(atomState, createMockAtom('dep2'));
      tracker.addDependency(atomState, createMockAtom('dep3'));

      expect(atomState.dependents.size).toBe(3);
    });
  });

  describe('removeDependency', () => {
    it('should remove dependent from atom', () => {
      const atomState = { dependents: new Set(), dependencies: new Set() } as AtomState<any>;
      const dependent = createMockAtom('dependent');

      tracker.addDependency(atomState, dependent);
      const result = tracker.removeDependency(atomState, dependent);

      expect(result).toBe(true);
      expect(atomState.dependents.has(dependent)).toBe(false);
    });

    it('should return false if dependency does not exist', () => {
      const atomState = { dependents: new Set(), dependencies: new Set() } as AtomState<any>;
      const dependent = createMockAtom('dependent');

      const result = tracker.removeDependency(atomState, dependent);
      expect(result).toBe(false);
    });
  });

  describe('getDependents', () => {
    it('should return empty array if atom state not found', () => {
      const atom = createMockAtom('test');
      const getState = vi.fn(() => undefined);

      const result = tracker.getDependents(atom, getState);
      expect(result).toEqual([]);
    });

    it('should return array of dependent atoms', () => {
      const atom = createMockAtom('source');
      const dep1 = createMockAtom('dep1');
      const dep2 = createMockAtom('dep2');

      const atomState: AtomState<any> = {
        dependents: new Set([dep1, dep2]),
        subscribers: new Set(),
        value: 0,
        dependencies: new Set(),
      };

      const getState = vi.fn((a: any) => a.id === atom.id ? atomState : undefined);
      const result = tracker.getDependents(atom, getState);

      expect(result).toHaveLength(2);
    });
  });

  describe('clearAllDependencies', () => {
    it('should be callable without errors', () => {
      expect(() => tracker.clearAllDependencies(vi.fn())).not.toThrow();
    });
  });
});

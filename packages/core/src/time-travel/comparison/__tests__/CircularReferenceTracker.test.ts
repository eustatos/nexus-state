/**
 * Tests for CircularReferenceTracker
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CircularReferenceTracker } from '../CircularReferenceTracker';

describe('CircularReferenceTracker', () => {
  let tracker: CircularReferenceTracker;

  beforeEach(() => {
    tracker = new CircularReferenceTracker();
  });

  describe('constructor', () => {
    it('should create with default strategy', () => {
      expect(tracker).toBeDefined();
      expect(tracker.getStrategy()).toBe('path');
    });

    it('should create with custom strategy', () => {
      const trackerIgnore = new CircularReferenceTracker('ignore');
      expect(trackerIgnore.getStrategy()).toBe('ignore');

      const trackerThrow = new CircularReferenceTracker('throw');
      expect(trackerThrow.getStrategy()).toBe('throw');
    });
  });

  describe('checkCircular', () => {
    it('should return not circular for first encounter', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      const result = tracker.checkCircular(obj1, obj2);

      expect(result.isCircular).toBe(false);
      expect(result.strategy).toBe('path');
    });

    it('should detect circular reference on second encounter', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      // First encounter
      tracker.checkCircular(obj1, obj2);

      // Second encounter - circular
      const result = tracker.checkCircular(obj1, obj2);

      expect(result.isCircular).toBe(true);
      expect(result.path).toBeDefined();
    });

    it('should handle ignore strategy', () => {
      const ignoreTracker = new CircularReferenceTracker('ignore');
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      // First encounter
      ignoreTracker.checkCircular(obj1, obj2);

      // Second encounter - should still return not circular
      const result = ignoreTracker.checkCircular(obj1, obj2);

      expect(result.isCircular).toBe(false);
      expect(result.strategy).toBe('ignore');
    });

    it('should throw with throw strategy', () => {
      const throwTracker = new CircularReferenceTracker('throw');
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      // First encounter
      throwTracker.checkCircular(obj1, obj2);

      // Second encounter - should throw
      expect(() => throwTracker.checkCircular(obj1, obj2)).toThrow(
        'Circular reference detected'
      );
    });
  });

  describe('markAsSeen', () => {
    it('should mark objects as seen', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      tracker.markAsSeen(obj1, obj2);

      expect(tracker.hasSeen(obj1)).toBe(true);
    });

    it('should detect marked objects as circular', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      tracker.markAsSeen(obj1, obj2);

      const result = tracker.checkCircular(obj1, obj2);

      expect(result.isCircular).toBe(true);
    });
  });

  describe('hasSeen', () => {
    it('should return false for unseen object', () => {
      const obj = { a: 1 };
      expect(tracker.hasSeen(obj)).toBe(false);
    });

    it('should return true for seen object', () => {
      const obj = { a: 1 };
      tracker.markAsSeen(obj, { a: 1 });
      expect(tracker.hasSeen(obj)).toBe(true);
    });
  });

  describe('path management', () => {
    it('should push and pop path segments', () => {
      tracker.pushPath('a');
      tracker.pushPath('b');
      tracker.pushPath('c');

      expect(tracker.getPath()).toEqual(['a', 'b', 'c']);

      tracker.popPath();
      expect(tracker.getPath()).toEqual(['a', 'b']);

      tracker.popPath();
      expect(tracker.getPath()).toEqual(['a']);

      tracker.popPath();
      expect(tracker.getPath()).toEqual([]);
    });

    it('should return popped segment', () => {
      tracker.pushPath('test');
      const popped = tracker.popPath();

      expect(popped).toBe('test');
      expect(tracker.getPath()).toEqual([]);
    });

    it('should return undefined when popping empty path', () => {
      const popped = tracker.popPath();
      expect(popped).toBeUndefined();
    });

    it('should track path in circular result', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      tracker.pushPath('root');
      tracker.pushPath('child');

      tracker.checkCircular(obj1, obj2);
      const result = tracker.checkCircular(obj1, obj2);

      expect(result.path).toEqual(['root', 'child']);
    });
  });

  describe('reset', () => {
    it('should reset seen objects', () => {
      const obj = { a: 1 };
      tracker.markAsSeen(obj, { a: 1 });

      tracker.reset();

      expect(tracker.hasSeen(obj)).toBe(false);
    });

    it('should reset path', () => {
      tracker.pushPath('a');
      tracker.pushPath('b');

      tracker.reset();

      expect(tracker.getPath()).toEqual([]);
    });

    it('should allow reuse after reset', () => {
      const obj = { a: 1 };
      tracker.markAsSeen(obj, { a: 1 });

      tracker.reset();

      // Should not be circular after reset
      const result = tracker.checkCircular(obj, { a: 1 });
      expect(result.isCircular).toBe(false);
    });
  });

  describe('getStrategy', () => {
    it('should return current strategy', () => {
      expect(tracker.getStrategy()).toBe('path');

      tracker.setStrategy('ignore');
      expect(tracker.getStrategy()).toBe('ignore');

      tracker.setStrategy('throw');
      expect(tracker.getStrategy()).toBe('throw');
    });
  });

  describe('setStrategy', () => {
    it('should change strategy behavior', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };

      // First encounter with path strategy
      tracker.checkCircular(obj1, obj2);

      // Change to ignore strategy
      tracker.setStrategy('ignore');

      // Second encounter should not be circular
      const result = tracker.checkCircular(obj1, obj2);
      expect(result.isCircular).toBe(false);
    });
  });

  describe('getSeenCount', () => {
    it('should return seen count object', () => {
      const count = tracker.getSeenCount();

      expect(count).toHaveProperty('seenA');
      expect(count).toHaveProperty('seenB');
      expect(typeof count.seenA).toBe('number');
      expect(typeof count.seenB).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should handle circular reference in same object', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      tracker.checkCircular(obj, obj);
      const result = tracker.checkCircular(obj, obj);

      expect(result.isCircular).toBe(true);
    });

    it('should handle nested circular references', () => {
      const obj1: any = { a: 1 };
      const obj2: any = { b: 2 };
      obj1.ref = obj2;
      obj2.ref = obj1;

      tracker.checkCircular(obj1, obj2);
      tracker.checkCircular(obj1.ref, obj2.ref);
      const result = tracker.checkCircular(obj2.ref, obj1.ref);

      expect(result.isCircular).toBe(true);
    });

    it('should handle multiple independent circular references', () => {
      const obj1: any = { a: 1 };
      const obj2: any = { b: 2 };
      obj1.self = obj1;
      obj2.self = obj2;

      tracker.checkCircular(obj1, obj1);
      tracker.reset();
      tracker.checkCircular(obj2, obj2);

      const result = tracker.checkCircular(obj2, obj2);
      expect(result.isCircular).toBe(true);
    });

    it('should handle deep nesting', () => {
      let obj1: any = { value: 0 };
      let obj2: any = { value: 0 };

      for (let i = 1; i <= 10; i++) {
        const new1: any = { value: i, child: obj1 };
        const new2: any = { value: i, child: obj2 };
        obj1 = new1;
        obj2 = new2;

        tracker.pushPath(`level${i}`);
        tracker.checkCircular(obj1, obj2);
      }

      expect(tracker.getPath().length).toBe(10);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle DOM-like circular structures', () => {
      const parent: any = { type: 'parent', children: [] };
      const child: any = { type: 'child', parent };
      parent.children.push(child);

      tracker.checkCircular(parent, parent);
      tracker.checkCircular(child, child);
      tracker.checkCircular(parent, parent);

      const result = tracker.checkCircular(parent, parent);
      expect(result.isCircular).toBe(true);
    });

    it('should handle graph-like structures', () => {
      const node1: any = { id: 1, neighbors: [] };
      const node2: any = { id: 2, neighbors: [] };
      const node3: any = { id: 3, neighbors: [] };

      node1.neighbors.push(node2, node3);
      node2.neighbors.push(node1, node3);
      node3.neighbors.push(node1, node2);

      tracker.checkCircular(node1, node1);
      tracker.checkCircular(node2, node2);
      tracker.checkCircular(node3, node3);

      const result = tracker.checkCircular(node1, node1);
      expect(result.isCircular).toBe(true);
    });
  });
});

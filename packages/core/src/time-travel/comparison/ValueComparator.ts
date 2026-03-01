/**
 * ValueComparator - Deep value comparison with diff support
 */

import type { ValueDiff, ComparisonOptions } from "./types";

/**
 * ValueComparator - Compares values with deep equality and generates diffs
 */
export class ValueComparator {
  private depth: number = 0;
  private maxDepthReached: number = 0;
  private seenA: WeakMap<object, boolean> = new WeakMap();
  private seenB: WeakMap<object, boolean> = new WeakMap();
  private options: ComparisonOptions;

  constructor(options: ComparisonOptions) {
    this.options = options;
  }

  /**
   * Check if two values are equal
   * @param a - First value
   * @param b - Second value
   * @param _currentDepth - Current recursion depth
   * @returns True if values are equal
   */
  areEqual(a: any, b: any, _currentDepth: number = 0): boolean {
    // Reset seen maps and depth for top-level calls
    if (_currentDepth === 0) {
      this.seenA = new WeakMap();
      this.seenB = new WeakMap();
      this.depth = 0;
      this.maxDepthReached = 0;
    }

    if (_currentDepth > this.options.maxDepth) {
      return true; // Assume equal beyond max depth
    }

    this.depth = _currentDepth;
    this.maxDepthReached = Math.max(this.maxDepthReached, _currentDepth);

    // Handle primitives with Object.is for NaN handling
    if (Object.is(a, b)) return true;

    // Handle null/undefined
    if (a == null || b == null) return a === b;

    // Handle types
    if (typeof a !== typeof b) return false;

    // Handle circular references for objects
    if (typeof a === "object" && typeof b === "object") {
      // Check if we've seen these exact objects before in this comparison
      if (this.seenA.has(a) && this.seenB.has(b)) {
        // Both seen - assume they're part of same circular structure
        return true;
      }
      // Mark as seen
      this.seenA.set(a, true);
      this.seenB.set(b, true);
    }

    // Handle functions before constructor check (functions are objects but have special handling)
    if (typeof a === "function") {
      return this.options.ignoreFunctions ? true : a.toString() === b.toString();
    }

    // Handle primitives (numbers, strings, booleans, symbols, bigints)
    if (typeof a !== "object") {
      return a === b;
    }

    // Handle different constructors
    if (a.constructor !== b.constructor) return false;

    // Handle specific types
    if (a instanceof Date) return this.areDatesEqual(a, b);
    if (a instanceof RegExp) return this.areRegExpsEqual(a, b);
    if (a instanceof Map) return this.areMapsEqual(a, b, this.depth + 1);
    if (a instanceof Set) return this.areSetsEqual(a, b, this.depth + 1);
    if (Array.isArray(a)) return this.areArraysEqual(a, b, this.depth + 1);

    // Handle objects
    return this.areObjectsEqual(a, b, this.depth + 1);
  }

  /**
   * Generate a detailed diff between two values
   * @param a - First value
   * @param b - Second value
   * @param path - Current path in object tree
   * @returns Value diff result
   */
  diff(a: any, b: any, path: string[] = []): ValueDiff {
    // Reset seen maps for new diff
    this.seenA = new WeakMap();
    this.seenB = new WeakMap();

    return this.computeDiff(a, b, path, 0);
  }

  /**
   * Internal diff computation
   */
  private computeDiff(a: any, b: any, path: string[], _depth: number): ValueDiff {
    if (_depth > this.options.maxDepth) {
      return {
        type: "object",
        equal: true,
        objectChanges: {},
      };
    }

    this.depth = _depth;
    this.maxDepthReached = Math.max(this.maxDepthReached, _depth);

    // Handle primitives
    if (Object.is(a, b)) {
      return {
        type: "primitive",
        equal: true,
        oldPrimitive: a,
        newPrimitive: b,
      };
    }

    // Handle null/undefined
    if (a == null || b == null) {
      return {
        type: "primitive",
        equal: a === b,
        oldPrimitive: a,
        newPrimitive: b,
      };
    }

    // Handle different types
    if (typeof a !== typeof b) {
      return {
        type: "primitive",
        equal: false,
        oldPrimitive: a,
        newPrimitive: b,
      };
    }

    // Handle circular references
    if (typeof a === "object" && typeof b === "object") {
      if (this.options.circularHandling === "path") {
        const aSeen = this.seenA.has(a);
        const bSeen = this.seenB.has(b);

        if (aSeen && bSeen) {
          // Both seen - circular reference detected
          return {
            type: "circular",
            equal: true,
            circularPath: path,
          };
        }

        // Mark as seen
        this.seenA.set(a, true);
        this.seenB.set(b, true);
      } else if (this.options.circularHandling === "ignore") {
        return {
          type: "object",
          equal: true,
          objectChanges: {},
        };
      }
    }

    // Handle functions before primitives check
    if (typeof a === "function") {
      const equal = this.options.ignoreFunctions || a.toString() === b.toString();
      return {
        type: "function",
        equal,
        oldPrimitive: a.toString(),
        newPrimitive: b.toString(),
      };
    }

    // Handle primitives (numbers, strings, booleans, symbols, bigints)
    if (typeof a !== "object") {
      return {
        type: "primitive",
        equal: a === b,
        oldPrimitive: a,
        newPrimitive: b,
      };
    }

    // Handle specific types
    if (a instanceof Date) {
      const equal = this.areDatesEqual(a, b);
      return {
        type: "primitive",
        equal,
        oldPrimitive: a.getTime(),
        newPrimitive: b.getTime(),
      };
    }

    if (a instanceof RegExp) {
      const equal = this.areRegExpsEqual(a, b);
      return {
        type: "primitive",
        equal,
        oldPrimitive: a.toString(),
        newPrimitive: b.toString(),
      };
    }

    if (a instanceof Map) {
      return this.diffMaps(a, b, path, this.depth);
    }

    if (a instanceof Set) {
      return this.diffSets(a, b, path, this.depth);
    }

    if (Array.isArray(a)) {
      return this.diffArrays(a, b, path, this.depth);
    }

    if (typeof a === "function") {
      const equal = this.options.ignoreFunctions || a.toString() === b.toString();
      return {
        type: "function",
        equal,
        oldPrimitive: a.toString(),
        newPrimitive: b.toString(),
      };
    }

    // Handle objects
    return this.diffObjects(a, b, path, this.depth);
  }

  /**
   * Compare two dates
   */
  private areDatesEqual(a: Date, b: Date): boolean {
    return a.getTime() === b.getTime();
  }

  /**
   * Compare two regular expressions
   */
  private areRegExpsEqual(a: RegExp, b: RegExp): boolean {
    return a.toString() === b.toString();
  }

  /**
   * Compare two maps
   */
  private areMapsEqual(a: Map<any, any>, b: Map<any, any>, depth: number): boolean {
    if (a.size !== b.size) return false;

    for (const [key, value] of a.entries()) {
      if (!b.has(key)) return false;
      if (!this.areEqual(value, b.get(key), depth + 1)) return false;
    }

    return true;
  }

  /**
   * Compare two sets
   */
  private areSetsEqual(a: Set<any>, b: Set<any>, _depth: number): boolean {
    if (a.size !== b.size) return false;

    for (const value of a.values()) {
      if (!b.has(value)) return false;
    }

    return true;
  }

  /**
   * Compare two arrays
   */
  private areArraysEqual(a: any[], b: any[], depth: number): boolean {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!this.areEqual(a[i], b[i], depth + 1)) return false;
    }

    return true;
  }

  /**
   * Compare two objects
   */
  private areObjectsEqual(a: object, b: object, depth: number): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;

      const valueA = (a as any)[key];
      const valueB = (b as any)[key];

      if (!this.areEqual(valueA, valueB, depth + 1)) return false;
    }

    return true;
  }

  /**
   * Generate diff for maps
   */
  private diffMaps(a: Map<any, any>, b: Map<any, any>, path: string[], _depth: number): ValueDiff {
    const changes: Record<string, ValueDiff> = {};
    let equal = true;

    // Check for removed and modified entries
    for (const [key, value] of a.entries()) {
      const keyStr = String(key);
      if (!b.has(key)) {
        changes[keyStr] = {
          type: "primitive",
          equal: false,
          oldPrimitive: value,
          newPrimitive: undefined,
        };
        equal = false;
      } else {
        const bValue = b.get(key);
        if (!this.areEqual(value, bValue, this.depth + 1)) {
          changes[keyStr] = this.computeDiff(value, bValue, [...path, keyStr], this.depth + 1);
          if (!changes[keyStr].equal) equal = false;
        }
      }
    }

    // Check for added entries
    for (const [key, value] of b.entries()) {
      const keyStr = String(key);
      if (!a.has(key)) {
        changes[keyStr] = {
          type: "primitive",
          equal: false,
          oldPrimitive: undefined,
          newPrimitive: value,
        };
        equal = false;
      }
    }

    return {
      type: "object",
      equal,
      objectChanges: equal ? undefined : changes,
    };
  }

  /**
   * Generate diff for sets
   */
  private diffSets(a: Set<any>, b: Set<any>, _path: string[], _depth: number): ValueDiff {
    const added: number[] = [];
    const removed: number[] = [];
    let equal = true;

    // Find removed items
    let index = 0;
    for (const value of a.values()) {
      if (!b.has(value)) {
        removed.push(index);
        equal = false;
      }
      index++;
    }

    // Find added items
    index = 0;
    for (const value of b.values()) {
      if (!a.has(value)) {
        added.push(index);
        equal = false;
      }
      index++;
    }

    return {
      type: "array",
      equal,
      arrayChanges: equal
        ? undefined
        : {
            added,
            removed,
            moved: [],
            modified: [],
          },
    };
  }

  /**
   * Generate diff for arrays
   */
  private diffArrays(a: any[], b: any[], path: string[], _depth: number): ValueDiff {
    const added: number[] = [];
    const removed: number[] = [];
    const moved: number[] = [];
    const modified: Array<{ index: number; diff: ValueDiff }> = [];
    let equal = true;

    const maxLength = Math.max(a.length, b.length);

    for (let i = 0; i < maxLength; i++) {
      if (i >= a.length) {
        // Added in b
        added.push(i);
        equal = false;
      } else if (i >= b.length) {
        // Removed from a
        removed.push(i);
        equal = false;
      } else {
        // Both exist - check if moved or modified
        const aValue = a[i];
        const bValue = b[i];

        // Check if value moved
        const movedIndex = b.findIndex((v, idx) => idx !== i && this.areEqual(v, aValue, this.depth + 1));
        if (movedIndex !== -1 && !a.includes(bValue)) {
          moved.push(i);
          equal = false;
        } else if (!this.areEqual(aValue, bValue, this.depth + 1)) {
          // Modified
          const diff = this.computeDiff(aValue, bValue, [...path, String(i)], this.depth + 1);
          if (!diff.equal) {
            modified.push({ index: i, diff });
            equal = false;
          }
        }
      }
    }

    return {
      type: "array",
      equal,
      arrayChanges: equal
        ? undefined
        : {
            added,
            removed,
            moved,
            modified,
          },
    };
  }

  /**
   * Generate diff for objects
   */
  private diffObjects(a: object, b: object, path: string[], _depth: number): ValueDiff {
    const changes: Record<string, ValueDiff> = {};
    let equal = true;

    const keysA = new Set(Object.keys(a));
    const keysB = new Set(Object.keys(b));

    // Handle symbols if not ignored
    if (!this.options.ignoreSymbols) {
      const symbolsA = Object.getOwnPropertySymbols(a);
      const symbolsB = Object.getOwnPropertySymbols(b);
      symbolsA.forEach((s) => keysA.add(s.toString()));
      symbolsB.forEach((s) => keysB.add(s.toString()));
    }

    // Check for removed and modified properties
    for (const key of keysA) {
      if (!keysB.has(key)) {
        // Removed
        changes[key] = {
          type: "primitive",
          equal: false,
          oldPrimitive: (a as any)[key],
          newPrimitive: undefined,
        };
        equal = false;
      } else {
        // May be modified
        const valueA = (a as any)[key];
        const valueB = (b as any)[key];

        if (!this.areEqual(valueA, valueB, this.depth + 1)) {
          changes[key] = this.computeDiff(valueA, valueB, [...path, key], this.depth + 1);
          if (!changes[key].equal) equal = false;
        }
      }
    }

    // Check for added properties
    for (const key of keysB) {
      if (!keysA.has(key)) {
        changes[key] = {
          type: "primitive",
          equal: false,
          oldPrimitive: undefined,
          newPrimitive: (b as any)[key],
        };
        equal = false;
      }
    }

    return {
      type: "object",
      equal,
      objectChanges: equal ? undefined : changes,
    };
  }

  /**
   * Get maximum depth reached during comparison
   */
  getMaxDepth(): number {
    return this.maxDepthReached;
  }

  /**
   * Reset internal state
   */
  reset(): void {
    this.depth = 0;
    this.maxDepthReached = 0;
    this.seenA = new WeakMap();
    this.seenB = new WeakMap();
  }
}

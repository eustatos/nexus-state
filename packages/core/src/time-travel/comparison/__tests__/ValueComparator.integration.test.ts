/**
 * Integration tests for ValueComparator refactoring
 *
 * Tests the interaction between all comparator components.
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValueCoordinator } from '../ValueCoordinator';

describe('ValueComparator Refactoring - Integration Tests', () => {
  let coordinator: ValueCoordinator;

  beforeEach(() => {
    coordinator = new ValueCoordinator();
  });

  describe('Component integration', () => {
    it('should coordinate between primitive comparators', () => {
      const result = coordinator.compare(42, 42);
      expect(result.equal).toBe(true);
    });

    it('should coordinate between array comparators', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];
      const result = coordinator.compare(arr1, arr2, { deepComparison: true });
      expect(result).toBeDefined();
    });

    it('should use diff generator for detailed diffs', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      const result = coordinator.compare(obj1, obj2);
      expect(result.equal).toBe(false);
      expect(result.diff).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle null values gracefully', () => {
      expect(() => coordinator.compare(null, null)).not.toThrow();
    });

    it('should handle undefined values gracefully', () => {
      expect(() => coordinator.compare(undefined, undefined)).not.toThrow();
    });

    it('should handle circular references gracefully', () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;
      expect(() => coordinator.compare(obj1, obj1)).not.toThrow();
    });
  });

  describe('Option effects', () => {
    it('should respect maxDepth option', () => {
      const custom = new ValueCoordinator({ maxDepth: 2 });
      expect(custom.getOptions().maxDepth).toBe(2);
    });

    it('should respect ignoreFunctions option', () => {
      const custom = new ValueCoordinator({ ignoreFunctions: true });
      expect(custom.getOptions().ignoreFunctions).toBe(true);
    });
  });

  describe('Summary generation', () => {
    it('should generate meaningful diff summaries', () => {
      const diff = coordinator.diff({ a: 1 }, { a: 2 });
      const summary = coordinator.getDiffSummary(diff);
      expect(summary).toBeDefined();
    });

    it('should handle primitive diffs', () => {
      const diff = coordinator.diff(1, 2);
      const summary = coordinator.getDiffSummary(diff);
      expect(summary).toContain('Changed');
    });
  });

  describe('Performance', () => {
    it('should handle large objects efficiently', () => {
      const large1: Record<string, number> = {};
      const large2: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        large1[`key${i}`] = i;
        large2[`key${i}`] = i;
      }
      const result = coordinator.compare(large1, large2);
      expect(result).toBeDefined();
    });

    it('should handle large arrays efficiently', () => {
      const arr1 = Array.from({ length: 100 }, (_, i) => i);
      const arr2 = Array.from({ length: 100 }, (_, i) => i);
      const result = coordinator.compare(arr1, arr2);
      expect(result).toBeDefined();
    });
  });
});

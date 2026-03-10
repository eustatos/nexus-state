/**
 * ComparisonService tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonService } from '../ComparisonService';
import type { Snapshot } from '../../types';

describe('ComparisonService', () => {
  let comparisonService: ComparisonService;

  const createSnapshot = (state: Record<string, { value: unknown }>): Snapshot => ({
    id: 'test-id',
    state,
    metadata: {
      timestamp: Date.now(),
      action: 'test-action',
    },
  });

  beforeEach(() => {
    comparisonService = new ComparisonService();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const service = new ComparisonService();
      const config = service.getConfig();

      expect(config.defaultVisualizationFormat).toBe('tree');
      expect(config.defaultComparisonFormat).toBe('summary');
    });

    it('should create with custom config', () => {
      const service = new ComparisonService({
        defaultVisualizationFormat: 'table',
        defaultComparisonFormat: 'detailed',
      });

      const config = service.getConfig();
      expect(config.defaultVisualizationFormat).toBe('table');
      expect(config.defaultComparisonFormat).toBe('detailed');
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      comparisonService.configure({
        defaultVisualizationFormat: 'table',
      });

      const config = comparisonService.getConfig();
      expect(config.defaultVisualizationFormat).toBe('table');
    });
  });

  describe('getComparator', () => {
    it('should return comparator', () => {
      const comparator = comparisonService.getComparator();
      expect(comparator).toBeDefined();
    });
  });

  describe('getFormatter', () => {
    it('should return formatter', () => {
      const formatter = comparisonService.getFormatter();
      expect(formatter).toBeDefined();
    });
  });

  describe('compare', () => {
    it('should detect changes between snapshots', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const result = comparisonService.compare(snapshot1, snapshot2);

      expect(result.different).toBe(true);
      expect(result.comparison.summary.hasChanges).toBe(true);
    });

    it('should detect no changes for identical snapshots', () => {
      const snapshot = createSnapshot({ foo: { value: 'bar' } });

      const result = comparisonService.compare(snapshot, snapshot);

      expect(result.different).toBe(false);
      expect(result.comparison.summary.hasChanges).toBe(false);
    });

    it('should detect added atoms', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({
        foo: { value: 'bar' },
        baz: { value: 'qux' },
      });

      const result = comparisonService.compare(snapshot1, snapshot2);

      expect(result.different).toBe(true);
    });

    it('should detect removed atoms', () => {
      const snapshot1 = createSnapshot({
        foo: { value: 'bar' },
        baz: { value: 'qux' },
      });
      const snapshot2 = createSnapshot({ foo: { value: 'bar' } });

      const result = comparisonService.compare(snapshot1, snapshot2);

      expect(result.different).toBe(true);
    });

    it('should use default options if not provided', () => {
      const service = new ComparisonService({
        defaultOptions: { deepComparison: false },
      });

      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const result = service.compare(snapshot1, snapshot2);

      expect(result.different).toBe(true);
    });
  });

  describe('compareAndFormat', () => {
    it('should compare and format diff', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const result = comparisonService.compareAndFormat(
        snapshot1,
        snapshot2,
        'summary'
      );

      expect(result.different).toBe(true);
      expect(result.formattedDiff).toBeDefined();
      expect(typeof result.formattedDiff).toBe('string');
    });

    it('should use default format if not provided', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const result = comparisonService.compareAndFormat(snapshot1, snapshot2);

      expect(result.formattedDiff).toBeDefined();
    });
  });

  describe('visualize', () => {
    it('should visualize comparison result', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const comparison = comparisonService.compare(snapshot1, snapshot2).comparison;
      const visualization = comparisonService.visualize(comparison);

      expect(visualization).toBeDefined();
      expect(typeof visualization).toBe('string');
    });

    it('should use specified format', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const comparison = comparisonService.compare(snapshot1, snapshot2).comparison;
      const visualization = comparisonService.visualize(comparison, 'detailed');

      expect(visualization).toBeDefined();
    });
  });

  describe('export', () => {
    it('should export comparison as JSON', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const comparison = comparisonService.compare(snapshot1, snapshot2).comparison;
      const exported = comparisonService.export(comparison, 'json');

      expect(exported).toBeDefined();
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should export comparison as CSV', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const comparison = comparisonService.compare(snapshot1, snapshot2).comparison;
      const exported = comparisonService.export(comparison, 'csv');

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
    });

    it('should export comparison as markdown', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      const comparison = comparisonService.compare(snapshot1, snapshot2).comparison;
      const exported = comparisonService.export(comparison, 'markdown');

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
    });
  });

  describe('getChangedAtoms', () => {
    it('should return changed atoms', () => {
      const snapshot1 = createSnapshot({
        foo: { value: 'bar' },
        baz: { value: 'qux' },
      });
      const snapshot2 = createSnapshot({
        foo: { value: 'changed' },
        baz: { value: 'qux' },
      });

      const changed = comparisonService.getChangedAtoms(snapshot1, snapshot2);

      expect(changed).toHaveLength(1);
      expect(changed[0].name).toBe('foo');
      expect(changed[0].oldValue).toBe('bar');
      expect(changed[0].newValue).toBe('changed');
    });

    it('should return empty array if no changes', () => {
      const snapshot = createSnapshot({ foo: { value: 'bar' } });

      const changed = comparisonService.getChangedAtoms(snapshot, snapshot);

      expect(changed).toHaveLength(0);
    });
  });

  describe('getAddedAtoms', () => {
    it('should return added atoms', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({
        foo: { value: 'bar' },
        baz: { value: 'qux' },
      });

      const added = comparisonService.getAddedAtoms(snapshot1, snapshot2);

      expect(added).toContain('baz');
    });

    it('should return empty array if no atoms added', () => {
      const snapshot = createSnapshot({ foo: { value: 'bar' } });

      const added = comparisonService.getAddedAtoms(snapshot, snapshot);

      expect(added).toHaveLength(0);
    });
  });

  describe('getRemovedAtoms', () => {
    it('should return removed atoms', () => {
      const snapshot1 = createSnapshot({
        foo: { value: 'bar' },
        baz: { value: 'qux' },
      });
      const snapshot2 = createSnapshot({ foo: { value: 'bar' } });

      const removed = comparisonService.getRemovedAtoms(snapshot1, snapshot2);

      expect(removed).toContain('baz');
    });

    it('should return empty array if no atoms removed', () => {
      const snapshot = createSnapshot({ foo: { value: 'bar' } });

      const removed = comparisonService.getRemovedAtoms(snapshot, snapshot);

      expect(removed).toHaveLength(0);
    });
  });

  describe('areEqual', () => {
    it('should return true for equal snapshots', () => {
      const snapshot = createSnapshot({ foo: { value: 'bar' } });

      expect(comparisonService.areEqual(snapshot, snapshot)).toBe(true);
    });

    it('should return false for different snapshots', () => {
      const snapshot1 = createSnapshot({ foo: { value: 'bar' } });
      const snapshot2 = createSnapshot({ foo: { value: 'baz' } });

      expect(comparisonService.areEqual(snapshot1, snapshot2)).toBe(false);
    });
  });
});

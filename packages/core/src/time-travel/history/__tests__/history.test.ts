/**
 * History module tests
 */

import { describe, it, expect } from 'vitest';
import { isValidHistoryPosition } from '../index';
import {
  DEFAULT_MAX_SIZE,
  DEFAULT_VALIDATION_LEVEL,
  VALIDATION_RULES,
  COMPACTION_STRATEGIES,
  SORT_ORDERS,
  HISTORY_EVENTS,
  VALIDATION_LEVELS,
  ERROR_CODES,
  COMPACTION_INTERVALS,
  DEFAULT_VALIDATION_MESSAGES,
} from '../types';

describe('history module', () => {
  describe('isValidHistoryPosition', () => {
    it('should return true for valid position', () => {
      expect(isValidHistoryPosition(0, 5)).toBe(true);
      expect(isValidHistoryPosition(2, 5)).toBe(true);
      expect(isValidHistoryPosition(4, 5)).toBe(true);
    });

    it('should return false for negative index', () => {
      expect(isValidHistoryPosition(-1, 5)).toBe(false);
      expect(isValidHistoryPosition(-10, 5)).toBe(false);
    });

    it('should return false for index >= length', () => {
      expect(isValidHistoryPosition(5, 5)).toBe(false);
      expect(isValidHistoryPosition(10, 5)).toBe(false);
    });

    it('should return false for empty history', () => {
      expect(isValidHistoryPosition(0, 0)).toBe(false);
    });
  });

  describe('constants', () => {
    it('should export DEFAULT_MAX_SIZE', () => {
      expect(DEFAULT_MAX_SIZE).toBe(50);
    });

    it('should export DEFAULT_VALIDATION_LEVEL', () => {
      expect(DEFAULT_VALIDATION_LEVEL).toBe('warning');
    });
  });

  describe('VALIDATION_RULES', () => {
    it('should contain all rules', () => {
      expect(VALIDATION_RULES.HAS_ID).toBe('has_id');
      expect(VALIDATION_RULES.HAS_TIMESTAMP).toBe('has_timestamp');
      expect(VALIDATION_RULES.HAS_ATOMS).toBe('has_atoms');
      expect(VALIDATION_RULES.CHRONOLOGICAL).toBe('chronological');
      expect(VALIDATION_RULES.UNIQUE_IDS).toBe('unique_ids');
      expect(VALIDATION_RULES.VALID_VALUES).toBe('valid_values');
    });
  });

  describe('COMPACTION_STRATEGIES', () => {
    it('should contain all strategies', () => {
      expect(COMPACTION_STRATEGIES.OLDEST).toBe('oldest');
      expect(COMPACTION_STRATEGIES.NEWEST).toBe('newest');
      expect(COMPACTION_STRATEGIES.SPARSE).toBe('sparse');
      expect(COMPACTION_STRATEGIES.TIME_INTERVAL).toBe('time_interval');
      expect(COMPACTION_STRATEGIES.CUSTOM).toBe('custom');
    });
  });

  describe('SORT_ORDERS', () => {
    it('should contain all sort orders', () => {
      expect(SORT_ORDERS.CHRONOLOGICAL).toBe('chronological');
      expect(SORT_ORDERS.REVERSE_CHRONOLOGICAL).toBe('reverse_chronological');
      expect(SORT_ORDERS.BY_ACTION).toBe('by_action');
      expect(SORT_ORDERS.BY_ATOM_COUNT).toBe('by_atom_count');
    });
  });

  describe('HISTORY_EVENTS', () => {
    it('should contain all events', () => {
      expect(HISTORY_EVENTS.PUSH).toBe('push');
      expect(HISTORY_EVENTS.POP).toBe('pop');
      expect(HISTORY_EVENTS.CLEAR).toBe('clear');
      expect(HISTORY_EVENTS.EVICT).toBe('evict');
      expect(HISTORY_EVENTS.RESIZE).toBe('resize');
      expect(HISTORY_EVENTS.RESTORE).toBe('restore');
      expect(HISTORY_EVENTS.VALIDATE).toBe('validate');
      expect(HISTORY_EVENTS.COMPACT).toBe('compact');
    });
  });

  describe('VALIDATION_LEVELS', () => {
    it('should contain all levels', () => {
      expect(VALIDATION_LEVELS.ERROR).toBe('error');
      expect(VALIDATION_LEVELS.WARNING).toBe('warning');
      expect(VALIDATION_LEVELS.INFO).toBe('info');
      expect(VALIDATION_LEVELS.DEBUG).toBe('debug');
    });
  });

  describe('ERROR_CODES', () => {
    it('should contain all error codes', () => {
      expect(ERROR_CODES.INVALID_INDEX).toBe('INVALID_INDEX');
      expect(ERROR_CODES.STACK_OVERFLOW).toBe('STACK_OVERFLOW');
      expect(ERROR_CODES.STACK_UNDERFLOW).toBe('STACK_UNDERFLOW');
      expect(ERROR_CODES.INVALID_SNAPSHOT).toBe('INVALID_SNAPSHOT');
      expect(ERROR_CODES.DUPLICATE_ID).toBe('DUPLICATE_ID');
      expect(ERROR_CODES.OUT_OF_BOUNDS).toBe('OUT_OF_BOUNDS');
      expect(ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
    });
  });

  describe('COMPACTION_INTERVALS', () => {
    it('should contain all intervals', () => {
      expect(COMPACTION_INTERVALS.SECOND).toBe(1000);
      expect(COMPACTION_INTERVALS.MINUTE).toBe(60 * 1000);
      expect(COMPACTION_INTERVALS.HOUR).toBe(60 * 60 * 1000);
      expect(COMPACTION_INTERVALS.DAY).toBe(24 * 60 * 60 * 1000);
      expect(COMPACTION_INTERVALS.WEEK).toBe(7 * 24 * 60 * 60 * 1000);
      expect(COMPACTION_INTERVALS.MONTH).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('DEFAULT_VALIDATION_MESSAGES', () => {
    it('should contain messages for all rules', () => {
      expect(
        DEFAULT_VALIDATION_MESSAGES[VALIDATION_RULES.HAS_ID]
      ).toBeDefined();
      expect(
        DEFAULT_VALIDATION_MESSAGES[VALIDATION_RULES.HAS_TIMESTAMP]
      ).toBeDefined();
      expect(
        DEFAULT_VALIDATION_MESSAGES[VALIDATION_RULES.HAS_ATOMS]
      ).toBeDefined();
      expect(
        DEFAULT_VALIDATION_MESSAGES[VALIDATION_RULES.CHRONOLOGICAL]
      ).toBeDefined();
      expect(
        DEFAULT_VALIDATION_MESSAGES[VALIDATION_RULES.UNIQUE_IDS]
      ).toBeDefined();
    });

    it('should have meaningful messages', () => {
      expect(
        DEFAULT_VALIDATION_MESSAGES[VALIDATION_RULES.HAS_ID]
      ).toContain('ID');
      expect(
        DEFAULT_VALIDATION_MESSAGES[VALIDATION_RULES.HAS_TIMESTAMP]
      ).toContain('timestamp');
    });
  });
});

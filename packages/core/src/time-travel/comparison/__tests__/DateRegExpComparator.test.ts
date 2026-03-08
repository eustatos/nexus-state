/**
 * Tests for DateRegExpComparator
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DateRegExpComparator } from '../DateRegExpComparator';

describe('DateRegExpComparator', () => {
  let comparator: DateRegExpComparator;

  beforeEach(() => {
    comparator = new DateRegExpComparator();
  });

  describe('isDate', () => {
    it('should return true for Date objects', () => {
      expect(comparator.isDate(new Date())).toBe(true);
    });

    it('should return false for non-Date objects', () => {
      expect(comparator.isDate({})).toBe(false);
      expect(comparator.isDate([])).toBe(false);
      expect(comparator.isDate('2024-01-01')).toBe(false);
      expect(comparator.isDate(1234567890)).toBe(false);
    });
  });

  describe('isRegExp', () => {
    it('should return true for RegExp objects', () => {
      expect(comparator.isRegExp(/abc/)).toBe(true);
      expect(comparator.isRegExp(new RegExp('abc'))).toBe(true);
    });

    it('should return false for non-RegExp objects', () => {
      expect(comparator.isRegExp({})).toBe(false);
      expect(comparator.isRegExp([])).toBe(false);
      expect(comparator.isRegExp('/abc/')).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return comparison result for equal Dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-01T00:00:00Z');

      const result = comparator.compare(date1, date2);

      expect(result.isEqual).toBe(true);
      expect(result.typeA).toBe('date');
      expect(result.typeB).toBe('date');
      expect(result.sameType).toBe(true);
    });

    it('should return comparison result for different Dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-02T00:00:00Z');

      const result = comparator.compare(date1, date2);

      expect(result.isEqual).toBe(false);
      expect(result.sameType).toBe(true);
    });

    it('should return comparison result for equal RegExps', () => {
      const regexp1 = /abc/gi;
      const regexp2 = /abc/gi;

      const result = comparator.compare(regexp1, regexp2);

      expect(result.isEqual).toBe(true);
      expect(result.typeA).toBe('regexp');
      expect(result.typeB).toBe('regexp');
      expect(result.sameType).toBe(true);
    });

    it('should return comparison result for different RegExps', () => {
      const regexp1 = /abc/g;
      const regexp2 = /abc/i;

      const result = comparator.compare(regexp1, regexp2);

      expect(result.isEqual).toBe(false);
      expect(result.sameType).toBe(true);
    });

    it('should return comparison result for different types', () => {
      const date = new Date();
      const regexp = /abc/;

      const result = comparator.compare(date, regexp);

      expect(result.isEqual).toBe(false);
      expect(result.typeA).toBe('date');
      expect(result.typeB).toBe('regexp');
      expect(result.sameType).toBe(false);
    });
  });

  describe('areEqual', () => {
    it('should return true for equal Dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-01T00:00:00Z');

      expect(comparator.areEqual(date1, date2)).toBe(true);
    });

    it('should return false for different Dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-02T00:00:00Z');

      expect(comparator.areEqual(date1, date2)).toBe(false);
    });

    it('should return true for equal RegExps', () => {
      const regexp1 = /abc/gi;
      const regexp2 = /abc/gi;

      expect(comparator.areEqual(regexp1, regexp2)).toBe(true);
    });

    it('should return false for different RegExps', () => {
      const regexp1 = /abc/g;
      const regexp2 = /abc/i;

      expect(comparator.areEqual(regexp1, regexp2)).toBe(false);
    });

    it('should return false for Date and RegExp', () => {
      const date = new Date();
      const regexp = /abc/;

      expect(comparator.areEqual(date, regexp)).toBe(false);
    });

    it('should return false for non-Date/RegExp', () => {
      expect(comparator.areEqual(42, 42)).toBe(false);
      expect(comparator.areEqual('hello', 'hello')).toBe(false);
    });
  });

  describe('getType', () => {
    it('should return "date" for Date objects', () => {
      expect(comparator.getType(new Date())).toBe('date');
    });

    it('should return "regexp" for RegExp objects', () => {
      expect(comparator.getType(/abc/)).toBe('regexp');
    });

    it('should return "other" for non-Date/RegExp', () => {
      expect(comparator.getType(42)).toBe('other');
      expect(comparator.getType('hello')).toBe('other');
      expect(comparator.getType({})).toBe('other');
    });
  });

  describe('compareDates', () => {
    it('should compare equal dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-01T00:00:00Z');

      expect(comparator.compareDates(date1, date2)).toBe(true);
    });

    it('should compare different dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-02T00:00:00Z');

      expect(comparator.compareDates(date1, date2)).toBe(false);
    });

    it('should handle invalid dates', () => {
      const invalid1 = new Date('invalid');
      const invalid2 = new Date('invalid');

      expect(comparator.compareDates(invalid1, invalid2)).toBe(true);
    });

    it('should handle one invalid date', () => {
      const valid = new Date('2024-01-01T00:00:00Z');
      const invalid = new Date('invalid');

      expect(comparator.compareDates(valid, invalid)).toBe(false);
    });

    it('should handle same timestamp different representation', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date(1704067200000);

      expect(comparator.compareDates(date1, date2)).toBe(true);
    });
  });

  describe('compareRegExps', () => {
    it('should compare equal regexps', () => {
      const regexp1 = /abc/gi;
      const regexp2 = /abc/gi;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(true);
    });

    it('should compare regexps with different patterns', () => {
      const regexp1 = /abc/g;
      const regexp2 = /def/g;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(false);
    });

    it('should compare regexps with different flags', () => {
      const regexp1 = /abc/g;
      const regexp2 = /abc/i;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(false);
    });

    it('should compare regexps with different lastIndex', () => {
      const regexp1 = /abc/g;
      const regexp2 = /abc/g;
      regexp1.lastIndex = 3;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(false);
    });

    it('should handle complex patterns', () => {
      const regexp1 = /^[a-z]+\d*$/gi;
      const regexp2 = /^[a-z]+\d*$/gi;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(true);
    });
  });

  describe('isInvalidDate', () => {
    it('should return true for invalid date', () => {
      const invalid = new Date('invalid');
      expect(comparator.isInvalidDate(invalid)).toBe(true);
    });

    it('should return false for valid date', () => {
      const valid = new Date('2024-01-01T00:00:00Z');
      expect(comparator.isInvalidDate(valid)).toBe(false);
    });
  });

  describe('getTimestamp', () => {
    it('should return timestamp from Date', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      expect(comparator.getTimestamp(date)).toBe(1704067200000);
    });

    it('should return NaN for invalid date', () => {
      const invalid = new Date('invalid');
      expect(Number.isNaN(comparator.getTimestamp(invalid))).toBe(true);
    });
  });

  describe('getISOString', () => {
    it('should return ISO string from Date', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      expect(comparator.getISOString(date)).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should throw for invalid date', () => {
      const invalid = new Date('invalid');
      expect(() => comparator.getISOString(invalid)).toThrow();
    });
  });

  describe('getRegExpSource', () => {
    it('should return source pattern', () => {
      const regexp = /abc/gi;
      expect(comparator.getRegExpSource(regexp)).toBe('abc');
    });

    it('should handle complex patterns', () => {
      const regexp = /^[a-z]+\d*$/gi;
      expect(comparator.getRegExpSource(regexp)).toBe('^[a-z]+\\d*$');
    });
  });

  describe('getRegExpFlags', () => {
    it('should return flags string', () => {
      const regexp = /abc/gi;
      expect(comparator.getRegExpFlags(regexp)).toBe('gi');
    });

    it('should return empty string for no flags', () => {
      const regexp = /abc/;
      expect(comparator.getRegExpFlags(regexp)).toBe('');
    });
  });

  describe('getRegExpString', () => {
    it('should return string representation', () => {
      const regexp = /abc/gi;
      expect(comparator.getRegExpString(regexp)).toBe('/abc/gi');
    });
  });

  describe('getDateDisplayValue', () => {
    it('should return ISO string for valid date', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      expect(comparator.getDateDisplayValue(date)).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should return "Invalid Date" for invalid date', () => {
      const invalid = new Date('invalid');
      expect(comparator.getDateDisplayValue(invalid)).toBe('Invalid Date');
    });
  });

  describe('getRegExpDisplayValue', () => {
    it('should return string representation', () => {
      const regexp = /abc/gi;
      expect(comparator.getRegExpDisplayValue(regexp)).toBe('/abc/gi');
    });
  });

  describe('createDateFromTimestamp', () => {
    it('should create Date from timestamp', () => {
      const date = comparator.createDateFromTimestamp(1704067200000);
      expect(date.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('createRegExp', () => {
    it('should create RegExp from source and flags', () => {
      const regexp = comparator.createRegExp('abc', 'gi');
      expect(regexp.source).toBe('abc');
      expect(regexp.flags).toBe('gi');
    });

    it('should create RegExp without flags', () => {
      const regexp = comparator.createRegExp('abc');
      expect(regexp.source).toBe('abc');
      expect(regexp.flags).toBe('');
    });
  });

  describe('hasRegExpFlag', () => {
    it('should return true for existing flag', () => {
      const regexp = /abc/gi;
      expect(comparator.hasRegExpFlag(regexp, 'g')).toBe(true);
      expect(comparator.hasRegExpFlag(regexp, 'i')).toBe(true);
    });

    it('should return false for non-existing flag', () => {
      const regexp = /abc/g;
      expect(comparator.hasRegExpFlag(regexp, 'i')).toBe(false);
      expect(comparator.hasRegExpFlag(regexp, 'm')).toBe(false);
    });
  });

  describe('getRegExpFlagStates', () => {
    it('should return flag states', () => {
      const regexp = /abc/gim;
      const states = comparator.getRegExpFlagStates(regexp);

      expect(states.global).toBe(true);
      expect(states.ignoreCase).toBe(true);
      expect(states.multiline).toBe(true);
      expect(states.dotAll).toBe(false);
      expect(states.sticky).toBe(false);
      expect(states.unicode).toBe(false);
    });

    it('should return all false for no flags', () => {
      const regexp = /abc/;
      const states = comparator.getRegExpFlagStates(regexp);

      expect(states.global).toBe(false);
      expect(states.ignoreCase).toBe(false);
      expect(states.multiline).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle dates with different timezones', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-01T05:00:00+05:00');

      expect(comparator.compareDates(date1, date2)).toBe(true);
    });

    it('should handle regexps with special characters', () => {
      const regexp1 = /\n\r\t/g;
      const regexp2 = /\n\r\t/g;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(true);
    });

    it('should handle unicode regexps', () => {
      const regexp1 = /\p{L}+/u;
      const regexp2 = /\p{L}+/u;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(true);
    });

    it('should handle sticky regexps', () => {
      const regexp1 = /abc/y;
      const regexp2 = /abc/y;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(true);
    });

    it('should handle dotAll flag', () => {
      const regexp1 = /./s;
      const regexp2 = /./s;

      expect(comparator.compareRegExps(regexp1, regexp2)).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should compare timestamps from API responses', () => {
      const apiDate1 = new Date('2024-01-01T12:00:00.000Z');
      const apiDate2 = new Date('2024-01-01T12:00:00.000Z');

      expect(comparator.compareDates(apiDate1, apiDate2)).toBe(true);
    });

    it('should compare validation regexps', () => {
      const emailRegex1 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailRegex2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(comparator.compareRegExps(emailRegex1, emailRegex2)).toBe(true);
    });

    it('should compare date objects from JSON', () => {
      const json1 = JSON.parse('{"date":"2024-01-01T00:00:00.000Z"}');
      const json2 = JSON.parse('{"date":"2024-01-01T00:00:00.000Z"}');

      const date1 = new Date(json1.date);
      const date2 = new Date(json2.date);

      expect(comparator.compareDates(date1, date2)).toBe(true);
    });
  });
});

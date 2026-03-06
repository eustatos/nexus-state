/**
 * ValueDeserializer tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValueDeserializer } from '../ValueDeserializer';

describe('ValueDeserializer', () => {
  let deserializer: ValueDeserializer;

  beforeEach(() => {
    deserializer = new ValueDeserializer();
  });

  describe('constructor', () => {
    it('should create with default deserializers', () => {
      const types = deserializer.getRegisteredTypes();

      expect(types).toEqual(['date', 'regexp', 'map', 'set']);
    });
  });

  describe('deserialize', () => {
    describe('date deserialization', () => {
      it('should deserialize date from string', () => {
        const result = deserializer.deserialize('2024-01-01T00:00:00.000Z', 'date');

        expect(result).toBeInstanceOf(Date);
        expect((result as Date).toISOString()).toBe('2024-01-01T00:00:00.000Z');
      });

      it('should deserialize date from timestamp', () => {
        const timestamp = Date.now();
        const result = deserializer.deserialize(timestamp, 'date');

        expect(result).toBeInstanceOf(Date);
        expect((result as Date).getTime()).toBe(timestamp);
      });

      it('should return value as-is for invalid date input', () => {
        const result = deserializer.deserialize({ invalid: 'date' }, 'date');

        expect(result).toEqual({ invalid: 'date' });
      });
    });

    describe('regexp deserialization', () => {
      it('should deserialize regexp from string', () => {
        const result = deserializer.deserialize('test', 'regexp');

        expect(result).toBeInstanceOf(RegExp);
        expect((result as RegExp).source).toBe('test');
      });

      it('should return value as-is for invalid regexp input', () => {
        const result = deserializer.deserialize(123, 'regexp');

        expect(result).toBe(123);
      });
    });

    describe('map deserialization', () => {
      it('should deserialize map from array', () => {
        const result = deserializer.deserialize(
          [['key1', 'value1'], ['key2', 'value2']],
          'map'
        );

        expect(result).toBeInstanceOf(Map);
        expect((result as Map<string, string>).get('key1')).toBe('value1');
        expect((result as Map<string, string>).get('key2')).toBe('value2');
      });

      it('should return value as-is for non-array input', () => {
        const result = deserializer.deserialize('not-an-array', 'map');

        expect(result).toBe('not-an-array');
      });
    });

    describe('set deserialization', () => {
      it('should deserialize set from array', () => {
        const result = deserializer.deserialize([1, 2, 3], 'set');

        expect(result).toBeInstanceOf(Set);
        expect((result as Set<number>).has(1)).toBe(true);
        expect((result as Set<number>).has(2)).toBe(true);
        expect((result as Set<number>).has(3)).toBe(true);
      });

      it('should return value as-is for non-array input', () => {
        const result = deserializer.deserialize('not-an-array', 'set');

        expect(result).toBe('not-an-array');
      });
    });

    describe('primitive deserialization', () => {
      it('should return number as-is', () => {
        expect(deserializer.deserialize(42, 'primitive')).toBe(42);
      });

      it('should return string as-is', () => {
        expect(deserializer.deserialize('test', 'primitive')).toBe('test');
      });

      it('should return boolean as-is', () => {
        expect(deserializer.deserialize(true, 'primitive')).toBe(true);
      });

      it('should return null as-is', () => {
        expect(deserializer.deserialize(null, 'primitive')).toBeNull();
      });

      it('should return undefined as-is', () => {
        expect(deserializer.deserialize(undefined, 'primitive')).toBeUndefined();
      });

      it('should return object as-is', () => {
        const obj = { key: 'value' };
        expect(deserializer.deserialize(obj, 'primitive')).toBe(obj);
      });

      it('should return array as-is', () => {
        const arr = [1, 2, 3];
        expect(deserializer.deserialize(arr, 'primitive')).toBe(arr);
      });
    });

    describe('unknown type deserialization', () => {
      it('should return value as-is for unknown type', () => {
        const result = deserializer.deserialize('test', 'unknown-type');

        expect(result).toBe('test');
      });
    });
  });

  describe('deserializeWithResult', () => {
    it('should return success result for valid deserialization', () => {
      const result = deserializer.deserializeWithResult(
        '2024-01-01T00:00:00.000Z',
        'date'
      );

      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(Date);
      expect(result.type).toBe('date');
      expect(result.error).toBeUndefined();
    });

    it('should include type in result', () => {
      const result = deserializer.deserializeWithResult(42, 'primitive');

      expect(result.type).toBe('primitive');
    });
  });

  describe('registerDeserializer', () => {
    it('should register custom deserializer', () => {
      deserializer.registerDeserializer('custom', (value) => `custom:${value}`);

      expect(deserializer.hasDeserializer('custom')).toBe(true);
    });

    it('should use custom deserializer', () => {
      deserializer.registerDeserializer('custom', (value) => `custom:${value}`);

      const result = deserializer.deserialize('test', 'custom');

      expect(result).toBe('custom:test');
    });

    it('should override existing deserializer', () => {
      deserializer.registerDeserializer('date', () => 'overridden');

      const result = deserializer.deserialize('2024-01-01', 'date');

      expect(result).toBe('overridden');
    });

    it('should handle custom deserializer errors gracefully', () => {
      deserializer.registerDeserializer('error-prone', () => {
        throw new Error('Deserialization error');
      });

      const result = deserializer.deserialize('test', 'error-prone');

      expect(result).toBe('test');
    });
  });

  describe('unregisterDeserializer', () => {
    it('should unregister custom deserializer', () => {
      deserializer.registerDeserializer('custom', (value) => value);
      deserializer.unregisterDeserializer('custom');

      expect(deserializer.hasDeserializer('custom')).toBe(false);
    });

    it('should not throw for non-existent deserializer', () => {
      expect(() => deserializer.unregisterDeserializer('non-existent')).not.toThrow();
    });

    it('should fall back to default behavior after unregister', () => {
      deserializer.registerDeserializer('date', () => 'custom-date');
      deserializer.unregisterDeserializer('date');

      const result = deserializer.deserialize('2024-01-01', 'date');

      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('hasDeserializer', () => {
    it('should return true for registered deserializer', () => {
      deserializer.registerDeserializer('test', (value) => value);

      expect(deserializer.hasDeserializer('test')).toBe(true);
    });

    it('should return false for unregistered deserializer', () => {
      expect(deserializer.hasDeserializer('non-existent')).toBe(false);
    });

    it('should return true for default deserializers', () => {
      expect(deserializer.hasDeserializer('date')).toBe(true);
      expect(deserializer.hasDeserializer('regexp')).toBe(true);
      expect(deserializer.hasDeserializer('map')).toBe(true);
      expect(deserializer.hasDeserializer('set')).toBe(true);
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return all registered types', () => {
      const types = deserializer.getRegisteredTypes();

      expect(types).toEqual(['date', 'regexp', 'map', 'set']);
    });

    it('should include custom types', () => {
      deserializer.registerDeserializer('custom1', (value) => value);
      deserializer.registerDeserializer('custom2', (value) => value);

      const types = deserializer.getRegisteredTypes();

      expect(types).toEqual(['date', 'regexp', 'map', 'set', 'custom1', 'custom2']);
    });
  });

  describe('resetToDefaults', () => {
    it('should remove all custom deserializers', () => {
      deserializer.registerDeserializer('custom1', (value) => value);
      deserializer.registerDeserializer('custom2', (value) => value);

      deserializer.resetToDefaults();

      expect(deserializer.getRegisteredTypes()).toEqual(['date', 'regexp', 'map', 'set']);
    });

    it('should restore default deserializers', () => {
      deserializer.registerDeserializer('date', () => 'custom');

      deserializer.resetToDefaults();

      const result = deserializer.deserialize('2024-01-01', 'date');

      expect(result).toBeInstanceOf(Date);
    });
  });
});

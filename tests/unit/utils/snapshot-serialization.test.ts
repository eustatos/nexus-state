// tests/unit/utils/snapshot-serialization.test.ts
/** 
 * Unit tests for snapshot serialization functionality
 * Implements requirements from TASK-004-IMPLEMENT-TIME-TRAVEL
 */

import { describe, it, expect } from 'vitest';
import { 
  serializeSnapshot, 
  deserializeSnapshot,
  createSnapshotSerializer
} from '../../../packages/core/utils/snapshot-serialization';

describe('Snapshot Serialization', () => {
  describe('Basic Serialization', () => {
    it('should serialize primitive values', () => {
      const data = {
        number: 42,
        string: 'hello',
        boolean: true,
        null: null,
        undefined: undefined
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.number).toBe(42);
      expect(serialized.string).toBe('hello');
      expect(serialized.boolean).toBe(true);
      expect(serialized.null).toBe(null);
      expect(serialized.undefined).toBe(undefined);
    });

    it('should serialize arrays', () => {
      const data = {
        array: [1, 2, 3, 'test', true]
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.array).toEqual([1, 2, 3, 'test', true]);
    });

    it('should serialize nested objects', () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
              notifications: true
            }
          }
        }
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.user.profile.name).toBe('John');
      expect(serialized.user.profile.settings.theme).toBe('dark');
      expect(serialized.user.profile.settings.notifications).toBe(true);
    });

    it('should handle empty objects and arrays', () => {
      const data = {
        emptyObject: {},
        emptyArray: []
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.emptyObject).toEqual({});
      expect(serialized.emptyArray).toEqual([]);
    });
  });

  describe('Special Cases', () => {
    it('should handle circular references', () => {
      const data: any = {
        name: 'circular'
      };
      data.self = data; // Circular reference

      const serialized = serializeSnapshot(data);
      expect(serialized.name).toBe('circular');
      expect(serialized.self).toContain('[Circular Reference:');
    });

    it('should handle mutual circular references', () => {
      const a: any = { name: 'A' };
      const b: any = { name: 'B' };
      a.ref = b;
      b.ref = a;

      const data = { a, b };
      const serialized = serializeSnapshot(data);

      expect(serialized.a.name).toBe('A');
      expect(serialized.b.name).toBe('B');
      expect(serialized.a.ref.name).toBe('B');
      expect(serialized.b.ref.name).toBe('A');
    });

    it('should handle dates', () => {
      const data = {
        date: new Date('2023-01-01T00:00:00Z')
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.date).toContain('[Date:');
    });

    it('should handle functions', () => {
      const data = {
        method: () => 'result',
        arrow: () => ({ arrow: true })
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.method).toContain('[Function:');
      expect(serialized.arrow).toContain('[Function:');
    });

    it('should handle regex patterns', () => {
      const data = {
        simple: /test/g,
        complex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.simple).toContain('[RegExp:');
      expect(serialized.complex).toContain('[RegExp:');
    });

    it('should handle errors', () => {
      const data = {
        error: new Error('Test error'),
        typeError: new TypeError('Type error')
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.error).toContain('[Error:');
      expect(serialized.typeError).toContain('[Error:');
    });
  });

  describe('Complex Structures', () => {
    it('should handle deeply nested structures', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.level1.level2.level3.level4.value).toBe('deep');
    });

    it('should handle large arrays', () => {
      const data = {
        largeArray: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `Item ${i}`
        }))
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.largeArray).toHaveLength(1000);
      expect(serialized.largeArray[0].id).toBe(0);
      expect(serialized.largeArray[999].id).toBe(999);
    });

    it('should handle mixed data types', () => {
      const data = {
        primitives: {
          number: 42,
          string: 'hello',
          boolean: true
        },
        collections: {
          array: [1, 2, 3],
          object: { key: 'value' }
        },
        special: {
          date: new Date(),
          regex: /test/,
          func: () => {}
        }
      };

      const serialized = serializeSnapshot(data);
      expect(serialized.primitives.number).toBe(42);
      expect(serialized.primitives.string).toBe('hello');
      expect(serialized.primitives.boolean).toBe(true);
      expect(serialized.collections.array).toEqual([1, 2, 3]);
      expect(serialized.collections.object).toEqual({ key: 'value' });
    });
  });

  describe('Deserialization', () => {
    it('should deserialize basic structures', () => {
      const original = {
        number: 42,
        string: 'hello',
        boolean: true,
        array: [1, 2, 3]
      };

      const serialized = serializeSnapshot(original);
      const deserialized = deserializeSnapshot(serialized);

      expect(deserialized.number).toBe(42);
      expect(deserialized.string).toBe('hello');
      expect(deserialized.boolean).toBe(true);
      expect(deserialized.array).toEqual([1, 2, 3]);
    });

    it('should handle deserialization of special types', () => {
      const original = {
        date: new Date('2023-01-01'),
        regex: /test/g
      };

      const serialized = serializeSnapshot(original);
      const deserialized = deserializeSnapshot(serialized);

      // Special types are converted to string representations
      expect(typeof deserialized.date).toBe('string');
      expect(typeof deserialized.regex).toBe('string');
    });

    it('should handle empty deserialization', () => {
      const deserialized = deserializeSnapshot({});
      expect(deserialized).toEqual({});
    });

    it('should handle null deserialization', () => {
      const deserialized = deserializeSnapshot(null);
      expect(deserialized).toBeNull();
    });
  });

  describe('Serializer Factory', () => {
    it('should create custom serializer with options', () => {
      const serializer = createSnapshotSerializer({
        maxDepth: 5,
        circularRefPlaceholder: '[CIRCULAR]'
      });

      expect(typeof serializer).toBe('function');
    });

    it('should use custom serializer options', () => {
      const serializer = createSnapshotSerializer({
        maxDepth: 2
      });

      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: 'too deep'
            }
          }
        }
      };

      const serialized = serializer(deepData);
      // Should be truncated at level 2
      expect(serialized.level1.level2).toEqual({});
    });

    it('should handle custom circular reference placeholder', () => {
      const serializer = createSnapshotSerializer({
        circularRefPlaceholder: '[CYCLIC]'
      });

      const data: any = { name: 'test' };
      data.self = data;

      const serialized = serializer(data);
      expect(serialized.self).toContain('[CYCLIC]');
    });
  });

  describe('Performance', () => {
    it('should handle large state trees efficiently', () => {
      const largeData = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          profile: {
            avatar: `avatar${i}.jpg`,
            bio: `Bio for user ${i}`,
            preferences: {
              theme: i % 2 === 0 ? 'light' : 'dark',
              notifications: i % 3 === 0
            }
          }
        }))
      };

      const startTime = Date.now();
      const serialized = serializeSnapshot(largeData);
      const duration = Date.now() - startTime;

      expect(serialized.users).toHaveLength(1000);
      expect(serialized.users[0].name).toBe('User 0');
      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });

    it('should maintain performance with complex circular structures', () => {
      // Create complex circular structure
      const data: any = {
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          connections: [] as any[]
        }))
      };

      // Create connections between nodes
      data.nodes.forEach((node: any, i: number) => {
        const connections = [];
        for (let j = 0; j < 5; j++) {
          const targetIndex = (i + j + 1) % data.nodes.length;
          connections.push(data.nodes[targetIndex]);
        }
        node.connections = connections;
      });

      const startTime = Date.now();
      const serialized = serializeSnapshot(data);
      const duration = Date.now() - startTime;

      expect(serialized.nodes).toHaveLength(100);
      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined input', () => {
      const serialized = serializeSnapshot(undefined);
      expect(serialized).toBeUndefined();
    });

    it('should handle null input', () => {
      const serialized = serializeSnapshot(null);
      expect(serialized).toBeNull();
    });

    it('should handle non-object input', () => {
      expect(serializeSnapshot(42)).toBe(42);
      expect(serializeSnapshot('hello')).toBe('hello');
      expect(serializeSnapshot(true)).toBe(true);
    });

    it('should handle objects with special property names', () => {
      const data = {
        '': 'empty string key',
        'key with spaces': 'value',
        '123': 'numeric key',
        'key.with.dots': 'value'
      };

      const serialized = serializeSnapshot(data);
      expect(serialized['']).toBe('empty string key');
      expect(serialized['key with spaces']).toBe('value');
      expect(serialized['123']).toBe('numeric key');
      expect(serialized['key.with.dots']).toBe('value');
    });
  });
});
/**
 * SnapshotValidator tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SnapshotValidator } from '../SnapshotValidator';
import type { Snapshot } from '../types';

function createValidSnapshot(): Snapshot {
  return {
    id: 'test-id',
    state: {
      atom1: {
        value: 42,
        type: 'primitive',
        name: 'atom1',
        atomId: Symbol('atom1').toString(),
      },
    },
    metadata: {
      timestamp: Date.now(),
      action: 'test-action',
      atomCount: 1,
    },
  };
}

describe('SnapshotValidator', () => {
  let validator: SnapshotValidator;

  beforeEach(() => {
    validator = new SnapshotValidator();
  });

  describe('constructor', () => {
    it('should create with default rules', () => {
      const rules = validator.getRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.map((r) => r.name)).toEqual([
        'has_id',
        'has_timestamp',
        'has_state',
        'has_atoms',
        'valid_atom_entries',
        'valid_atom_types',
        'timestamp_reasonable',
        'atom_count_matches',
      ]);
    });
  });

  describe('validate', () => {
    it('should validate correct snapshot', () => {
      const snapshot = createValidSnapshot();
      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing ID', () => {
      const snapshot: Snapshot = {
        id: '',
        state: {
          atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
        },
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 1 },
      };

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Snapshot must have an ID');
    });

    it('should detect missing timestamp', () => {
      const snapshot: Snapshot = {
        id: 'test-id',
        state: {
          atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
        },
        metadata: { timestamp: 0, action: 'test', atomCount: 1 },
      };

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Snapshot must have a valid timestamp');
    });

    it('should detect missing state', () => {
      const snapshot = {
        id: 'test-id',
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 0 },
      } as unknown as Snapshot;

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Snapshot must have a state object');
    });

    it('should warn about empty atoms', () => {
      const snapshot: Snapshot = {
        id: 'test-id',
        state: {},
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 0 },
      };

      const result = validator.validate(snapshot);

      expect(result.warnings).toContain(
        'Snapshot should contain at least one atom'
      );
    });

    it('should detect invalid atom entries', () => {
      const snapshot: Snapshot = {
        id: 'test-id',
        state: {
          atom1: { value: 42 } as any,
        },
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 1 },
      };

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'All atom entries must have value, type, and name'
      );
    });

    it('should detect invalid atom types', () => {
      const snapshot: Snapshot = {
        id: 'test-id',
        state: {
          atom1: {
            value: 42,
            type: 'invalid-type',
            name: 'atom1',
            atomId: '1',
          },
        },
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 1 },
      };

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Atom types must be valid');
    });

    it('should detect timestamp in future', () => {
      const futureTimestamp = Date.now() + 366 * 24 * 60 * 60 * 1000; // More than 1 year in future
      const snapshot: Snapshot = {
        id: 'test-id',
        state: {
          atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
        },
        metadata: {
          timestamp: futureTimestamp,
          action: 'test',
          atomCount: 1,
        },
      };

      const result = validator.validate(snapshot);

      // This is a warning-level rule, so isValid is still true
      expect(result.warnings).toContain(
        'Snapshot timestamp is unreasonable'
      );
    });

    it('should detect atom count mismatch', () => {
      const snapshot: Snapshot = {
        id: 'test-id',
        state: {
          atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
          atom2: { value: 43, type: 'primitive', name: 'atom2', atomId: '2' },
        },
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 1 },
      };

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Actual atom count does not match metadata'
      );
    });

    it('should accept valid atom types', () => {
      const snapshot: Snapshot = {
        id: 'test-id',
        state: {
          dateAtom: {
            value: '2024-01-01T00:00:00.000Z',
            type: 'date',
            name: 'dateAtom',
            atomId: '1',
          },
          regexpAtom: {
            value: '/test/',
            type: 'regexp',
            name: 'regexpAtom',
            atomId: '2',
          },
          mapAtom: {
            value: [['key', 'value']],
            type: 'map',
            name: 'mapAtom',
            atomId: '3',
          },
          setAtom: {
            value: [1, 2, 3],
            type: 'set',
            name: 'setAtom',
            atomId: '4',
          },
        },
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 4 },
      };

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMany', () => {
    it('should validate multiple snapshots', () => {
      const snapshots = [createValidSnapshot(), createValidSnapshot()];

      const results = validator.validateMany(snapshots);

      expect(results.length).toBe(2);
      results.forEach((result) => {
        expect(result.isValid).toBe(true);
      });
    });

    it('should return mixed results', () => {
      const validSnapshot = createValidSnapshot();
      const invalidSnapshot: Snapshot = {
        id: '',
        state: {},
        metadata: { timestamp: 0, action: 'test', atomCount: 0 },
      };

      const results = validator.validateMany([
        validSnapshot,
        invalidSnapshot,
      ]);

      expect(results[0]?.isValid).toBe(true);
      expect(results[1]?.isValid).toBe(false);
    });
  });

  describe('validateSequence', () => {
    it('should validate sequence of snapshots', () => {
      const snapshot1 = createValidSnapshot();
      const snapshot2 = createValidSnapshot();
      // Ensure unique IDs and chronological order
      snapshot2.id = 'test-snapshot-2';
      if (snapshot2.metadata) {
        snapshot2.metadata.timestamp = (snapshot1.metadata?.timestamp || 0) + 1000;
      }

      const result = validator.validateSequence([snapshot1, snapshot2]);

      // Check that validation completed without errors about sequence
      expect(result.errors).toEqual([]);
    });

    it('should detect non-chronological order', () => {
      const snapshot1 = createValidSnapshot();
      const snapshot2 = createValidSnapshot();
      if (snapshot2.metadata) {
        snapshot2.metadata.timestamp = (snapshot1.metadata?.timestamp || 0) - 1000;
      }

      const result = validator.validateSequence([snapshot1, snapshot2]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('chronological'))).toBe(true);
    });

    it('should detect duplicate IDs', () => {
      const snapshot1 = createValidSnapshot();
      const snapshot2 = createValidSnapshot();
      snapshot2.id = snapshot1.id;

      const result = validator.validateSequence([snapshot1, snapshot2]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
    });
  });

  describe('addRule', () => {
    it('should add custom validation rule', () => {
      validator.addRule(
        'custom_rule',
        (snapshot) => snapshot.metadata?.action !== 'forbidden',
        'Action is forbidden',
        'error'
      );

      const snapshot = createValidSnapshot();
      if (snapshot.metadata) {
        snapshot.metadata.action = 'forbidden';
      }

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action is forbidden');
    });

    it('should add warning-level rule', () => {
      validator.addRule(
        'warning_rule',
        () => false,
        'Warning message',
        'warning'
      );

      const result = validator.validate(createValidSnapshot());

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Warning message');
    });
  });

  describe('addCustomValidator', () => {
    it('should add custom validator', () => {
      validator.addCustomValidator(
        'custom_validator',
        (snapshot) => snapshot.metadata?.action !== 'invalid'
      );

      const snapshot = createValidSnapshot();
      if (snapshot.metadata) {
        snapshot.metadata.action = 'invalid';
      }

      const result = validator.validate(snapshot);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes('custom_validator'))).toBe(true);
    });
  });

  describe('removeRule', () => {
    it('should remove validation rule', () => {
      validator.removeRule('has_atoms');

      const snapshot: Snapshot = {
        id: 'test-id',
        state: {},
        metadata: { timestamp: Date.now(), action: 'test', atomCount: 0 },
      };

      const result = validator.validate(snapshot);

      expect(result.warnings).not.toContain(
        'Snapshot should contain at least one atom'
      );
    });
  });

  describe('removeCustomValidator', () => {
    it('should remove custom validator', () => {
      validator.addCustomValidator('test_validator', () => false);
      validator.removeCustomValidator('test_validator');

      const result = validator.validate(createValidSnapshot());

      expect(result.warnings.every((w) => !w.includes('test_validator'))).toBe(true);
    });
  });

  describe('resetToDefault', () => {
    it('should reset to default rules', () => {
      validator.addRule('custom', () => true, 'Custom');
      validator.addCustomValidator('custom_validator', () => true);

      validator.resetToDefault();

      const rules = validator.getRules();
      expect(rules.length).toBe(8);
      expect(rules.some((r) => r.name === 'custom')).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should return true for valid snapshot', () => {
      expect(validator.isValid(createValidSnapshot())).toBe(true);
    });

    it('should return false for invalid snapshot', () => {
      const snapshot: Snapshot = {
        id: '',
        state: {},
        metadata: { timestamp: 0, action: 'test', atomCount: 0 },
      };

      expect(validator.isValid(snapshot)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return validation statistics', () => {
      const snapshots = [
        createValidSnapshot(),
        createValidSnapshot(),
        {
          id: '',
          state: {},
          metadata: { timestamp: 0, action: 'test', atomCount: 0 },
        } as Snapshot,
      ];

      const stats = validator.getStats(snapshots);

      expect(stats.total).toBe(3);
      expect(stats.valid).toBe(2);
      expect(stats.invalid).toBe(1);
    });

    it('should calculate average errors', () => {
      const snapshots = [
        createValidSnapshot(),
        {
          id: '',
          state: {},
          metadata: { timestamp: 0, action: 'test', atomCount: 0 },
        } as Snapshot,
      ];

      const stats = validator.getStats(snapshots);

      expect(stats.averageErrorsPerSnapshot).toBeGreaterThan(0);
    });
  });

  describe('getCustomValidators', () => {
    it('should return copy of custom validators', () => {
      validator.addCustomValidator('test', () => true);

      const validators = validator.getCustomValidators();

      expect(validators.has('test')).toBe(true);

      // Should be a copy
      validators.clear();
      expect(validator.getCustomValidators().has('test')).toBe(true);
    });
  });

  describe('clearCustomValidators', () => {
    it('should clear all custom validators', () => {
      validator.addCustomValidator('test1', () => true);
      validator.addCustomValidator('test2', () => true);

      validator.clearCustomValidators();

      expect(validator.getCustomValidators().size).toBe(0);
    });
  });
});

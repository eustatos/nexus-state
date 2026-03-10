/**
 * ChangeDetector tests
 */

import { describe, it, expect } from 'vitest';
import { ChangeDetector } from '../ChangeDetector';

describe('ChangeDetector', () => {
  describe('detectChangeType', () => {
    it('should return created for undefined oldValue', () => {
      const detector = new ChangeDetector();
      expect(detector.detectChangeType(undefined, 1)).toBe('created');
    });

    it('should return deleted for undefined newValue', () => {
      const detector = new ChangeDetector();
      expect(detector.detectChangeType(1, undefined)).toBe('deleted');
    });

    it('should return type for different types', () => {
      const detector = new ChangeDetector();
      expect(detector.detectChangeType(1, '1')).toBe('type');
    });

    it('should return value for different values', () => {
      const detector = new ChangeDetector();
      expect(detector.detectChangeType(1, 2)).toBe('value');
    });

    it('should return unknown for same values', () => {
      const detector = new ChangeDetector();
      expect(detector.detectChangeType(1, 1)).toBe('unknown');
    });
  });

  describe('createEvent', () => {
    it('should create change event', () => {
      const detector = new ChangeDetector();
      const atom = { id: Symbol('test'), name: 'test' } as any;

      const event = detector.createEvent(
        atom.id,
        atom.name,
        atom,
        1,
        2
      );

      expect(event.atomId).toBe(atom.id);
      expect(event.atomName).toBe('test');
      expect(event.oldValue).toBe(1);
      expect(event.newValue).toBe(2);
      expect(event.type).toBe('value');
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('hasChanged', () => {
    it('should return false for same values', () => {
      const detector = new ChangeDetector();
      expect(detector.hasChanged(Symbol('test'), 1, 1)).toBe(false);
    });

    it('should return true for different values', () => {
      const detector = new ChangeDetector();
      expect(detector.hasChanged(Symbol('test'), 1, 2)).toBe(true);
    });

    it('should return false for both undefined', () => {
      const detector = new ChangeDetector();
      expect(detector.hasChanged(Symbol('test'), undefined, undefined)).toBe(false);
    });

    it('should return true for one undefined', () => {
      const detector = new ChangeDetector();
      expect(detector.hasChanged(Symbol('test'), undefined, 1)).toBe(true);
      expect(detector.hasChanged(Symbol('test'), 1, undefined)).toBe(true);
    });
  });
});

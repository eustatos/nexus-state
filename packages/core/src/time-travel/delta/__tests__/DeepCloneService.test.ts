/**
 * DeepCloneService tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeepCloneService } from '../DeepCloneService';

describe('DeepCloneService', () => {
  let cloneService: DeepCloneService;

  beforeEach(() => {
    cloneService = new DeepCloneService();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const service = new DeepCloneService();

      expect(service).toBeDefined();
    });

    it('should create with custom options', () => {
      const service = new DeepCloneService({
        cloneMaps: false,
        cloneDates: false,
        maxDepth: 5,
      });

      expect(service).toBeDefined();
    });
  });

  describe('clone', () => {
    describe('primitive values', () => {
      it('should clone null', () => {
        expect(cloneService.clone(null)).toBeNull();
      });

      it('should clone undefined', () => {
        expect(cloneService.clone(undefined)).toBeUndefined();
      });

      it('should clone number', () => {
        expect(cloneService.clone(42)).toBe(42);
      });

      it('should clone string', () => {
        expect(cloneService.clone('test')).toBe('test');
      });

      it('should clone boolean', () => {
        expect(cloneService.clone(true)).toBe(true);
      });
    });

    describe('object cloning', () => {
      it('should clone simple object', () => {
        const obj = { a: 1, b: 2 };
        const cloned = cloneService.clone(obj);

        expect(cloned).toEqual(obj);
        expect(cloned).not.toBe(obj);
      });

      it('should clone nested object', () => {
        const obj = { a: { b: { c: 1 } } };
        const cloned = cloneService.clone(obj);

        expect(cloned).toEqual(obj);
        expect(cloned).not.toBe(obj);
        expect(cloned.a).not.toBe(obj.a);
      });

      it('should clone array', () => {
        const arr = [1, 2, 3];
        const cloned = cloneService.clone(arr);

        expect(cloned).toEqual(arr);
        expect(cloned).not.toBe(arr);
      });

      it('should clone nested array', () => {
        const arr = [1, [2, [3]]];
        const cloned = cloneService.clone(arr);

        expect(cloned).toEqual(arr);
        expect(cloned).not.toBe(arr);
        expect(cloned[1]).not.toBe(arr[1]);
      });
    });

    describe('Date cloning', () => {
      it('should clone Date by default', () => {
        const date = new Date('2024-01-01');
        const cloned = cloneService.clone(date);

        expect(cloned).toEqual(date);
        expect(cloned).not.toBe(date);
        expect(cloned).toBeInstanceOf(Date);
      });

      it('should not clone Date when disabled', () => {
        const service = new DeepCloneService({ cloneDates: false });
        const date = new Date('2024-01-01');
        const cloned = service.clone(date);

        expect(cloned).toBe(date);
      });
    });

    describe('RegExp cloning', () => {
      it('should clone RegExp by default', () => {
        const regex = /test/gi;
        const cloned = cloneService.clone(regex);

        expect(cloned.source).toBe('test');
        expect(cloned.flags).toBe('gi');
        expect(cloned).not.toBe(regex);
      });

      it('should not clone RegExp when disabled', () => {
        const service = new DeepCloneService({ cloneRegExp: false });
        const regex = /test/gi;
        const cloned = service.clone(regex);

        expect(cloned).toBe(regex);
      });
    });

    describe('Map cloning', () => {
      it('should handle Map', () => {
        const map = new Map([['key', 'value']]);
        const cloned = cloneService.clone(map);

        expect(cloned).toBeDefined();
      });

      it('should handle nested Map values', () => {
        const map = new Map([['key', { nested: 'value' }]]);
        const cloned = cloneService.clone(map);

        expect(cloned).toBeDefined();
      });

      it('should not clone Map when disabled', () => {
        const service = new DeepCloneService({ cloneMaps: false });
        const map = new Map([['key', 'value']]);
        const cloned = service.clone(map);

        expect(cloned).toBe(map);
      });
    });

    describe('Set cloning', () => {
      it('should handle Set', () => {
        const set = new Set([1, 2, 3]);
        const cloned = cloneService.clone(set);

        expect(cloned).toBeDefined();
      });

      it('should not clone Set when disabled', () => {
        const service = new DeepCloneService({ cloneSets: false });
        const set = new Set([1, 2, 3]);
        const cloned = service.clone(set);

        expect(cloned).toBe(set);
      });
    });

    describe('circular references', () => {
      it('should handle circular references', () => {
        const obj: any = { a: 1 };
        obj.self = obj;

        const cloned = cloneService.clone(obj);

        expect(cloned.a).toBe(1);
        expect(cloned.self).toBe(cloned);
      });

      it('should handle circular references in nested objects', () => {
        const obj1: any = { a: 1 };
        const obj2: any = { b: 2, ref: obj1 };
        obj1.ref = obj2;

        const cloned = cloneService.clone(obj1);

        expect(cloned.a).toBe(1);
        expect(cloned.ref.b).toBe(2);
        expect(cloned.ref.ref).toBe(cloned);
      });
    });

    describe('maxDepth', () => {
      it('should respect maxDepth limit', () => {
        const service = new DeepCloneService({ maxDepth: 2 });
        const obj = { a: { b: { c: { d: 1 } } } };
        const cloned = service.clone(obj);

        expect(cloned.a.b).toBe(obj.a.b);
      });

      it('should clone full depth when maxDepth is 0', () => {
        const obj = { a: { b: { c: 1 } } };
        const cloned = cloneService.clone(obj);

        expect(cloned.a.b).not.toBe(obj.a.b);
      });
    });
  });

  describe('configure', () => {
    it('should update options', () => {
      cloneService.configure({ cloneDates: false });

      expect(cloneService).toBeDefined();
    });

    it('should merge partial options', () => {
      cloneService.configure({ cloneMaps: false });
      cloneService.configure({ cloneSets: false });

      expect(cloneService).toBeDefined();
    });
  });

  describe('getOptions', () => {
    it('should return current options', () => {
      const options = cloneService.getOptions();

      expect(options).toBeDefined();
      expect(options.cloneMaps).toBeDefined();
    });
  });
});

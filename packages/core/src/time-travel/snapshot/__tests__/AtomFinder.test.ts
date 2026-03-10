/**
 * AtomFinder tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AtomFinder } from '../AtomFinder';
import type { Atom } from '../../../types';
import { atomRegistry } from '../../../atom-registry';

function createMockAtom(name: string, id?: symbol): Atom<unknown> {
  return {
    id: id || Symbol(name),
    name,
    type: 'primitive',
    get: vi.fn(),
    set: vi.fn(),
  } as unknown as Atom<unknown>;
}

describe('AtomFinder', () => {
  let atomFinder: AtomFinder;
  let mockAtom: Atom<unknown>;

  beforeEach(() => {
    atomFinder = new AtomFinder();
    mockAtom = createMockAtom('testAtom');
    vi.spyOn(atomRegistry, 'getAll').mockReturnValue(new Map([[mockAtom.id, mockAtom]]));
    vi.spyOn(atomRegistry, 'getByName').mockReturnValue(mockAtom);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('find', () => {
    it('should find atom by name', () => {
      // When atomId is not provided, should find by name
      const result = atomFinder.find('testAtom', {
        name: 'testAtom',
      });

      expect(result.atom).toBe(mockAtom);
      expect(result.foundBy).toBe('name');
      expect(result.searchDetails.searchedByName).toBe(true);
    });

    it('should find atom by ID', () => {
      vi.mocked(atomRegistry.getByName).mockReturnValue(null);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(
        new Map([[mockAtom.id, mockAtom]])
      );

      const result = atomFinder.find('testAtom', {
        name: 'testAtom',
        atomId: mockAtom.id.toString(),
      });

      expect(result.atom).toBe(mockAtom);
      expect(result.foundBy).toBe('id');
      expect(result.searchDetails.searchedById).toBe(true);
    });

    it('should find atom by fallback name', () => {
      vi.mocked(atomRegistry.getByName).mockReturnValue(null);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(
        new Map([[mockAtom.id, mockAtom]])
      );

      const result = atomFinder.find('testAtom', {
        name: 'testAtom',
      });

      expect(result.atom).toBe(mockAtom);
      expect(result.foundBy).toBe('fallback-name');
      expect(result.searchDetails.searchedByFallback).toBe(true);
    });

    it('should return null when atom not found', () => {
      vi.mocked(atomRegistry.getByName).mockReturnValue(null);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(new Map());

      const result = atomFinder.find('nonExistent', {
        name: 'nonExistent',
        atomId: 'non-existent-id',
      });

      expect(result.atom).toBeNull();
      expect(result.foundBy).toBeNull();
    });

    it('should try name first before ID', () => {
      const anotherAtom = createMockAtom('anotherAtom');
      vi.mocked(atomRegistry.getByName)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(anotherAtom);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(
        new Map([
          [mockAtom.id, mockAtom],
          [anotherAtom.id, anotherAtom],
        ])
      );

      const result = atomFinder.find('testAtom', {
        name: 'testAtom',
        atomId: anotherAtom.id.toString(),
      });

      expect(result.foundBy).toBe('id');
    });

    it('should handle missing entry.name', () => {
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(
        new Map([[mockAtom.id, mockAtom]])
      );

      const result = atomFinder.find('testAtom', {
        atomId: mockAtom.id.toString(),
      });

      expect(result.atom).toBe(mockAtom);
      expect(result.foundBy).toBe('id');
    });

    it('should handle missing entry.atomId', () => {
      const result = atomFinder.find('testAtom', {
        name: 'testAtom',
      });

      expect(result.atom).toBe(mockAtom);
      expect(result.foundBy).toBe('name');
    });
  });

  describe('findByName', () => {
    it('should find atom by name', () => {
      const result = atomFinder.findByName('testAtom');

      expect(result).toBe(mockAtom);
    });

    it('should return null for non-existent name', () => {
      vi.mocked(atomRegistry.getByName).mockReturnValue(null);

      const result = atomFinder.findByName('nonExistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find atom by symbol ID', () => {
      const result = atomFinder.findById(mockAtom.id);

      expect(result).toBe(mockAtom);
    });

    it('should find atom by string ID', () => {
      const result = atomFinder.findById(mockAtom.id.toString());

      expect(result).toBe(mockAtom);
    });

    it('should parse Symbol string representation', () => {
      const symbolId = Symbol('testSymbol');
      const symbolAtom = createMockAtom('symbolAtom', symbolId);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(
        new Map([[symbolId, symbolAtom]])
      );

      const result = atomFinder.findById(symbolId.toString());

      expect(result).toBe(symbolAtom);
    });

    it('should handle Symbol without description', () => {
      const noDescSymbol = Symbol();
      const noDescAtom = createMockAtom('noDescAtom', noDescSymbol);
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(
        new Map([[noDescSymbol, noDescAtom]])
      );

      const result = atomFinder.findById(noDescSymbol.toString());

      expect(result).toBe(noDescAtom);
    });

    it('should return null for non-existent ID', () => {
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(new Map());

      const result = atomFinder.findById(Symbol('nonExistent'));

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(atomRegistry, 'getAll').mockImplementation(() => {
        throw new Error('Registry error');
      });

      const result = atomFinder.findById(Symbol('test'));

      expect(result).toBeNull();
    });
  });

  describe('findByFallbackName', () => {
    it('should find atom by fallback name', () => {
      const result = atomFinder.findByFallbackName('testAtom');

      expect(result).toBe(mockAtom);
    });

    it('should match atom.id.description when name is missing', () => {
      const noNameAtom = createMockAtom('fallbackMatch');
      noNameAtom.name = undefined;
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(
        new Map([[noNameAtom.id, noNameAtom]])
      );

      const result = atomFinder.findByFallbackName('fallbackMatch');

      expect(result).toBe(noNameAtom);
    });

    it('should return null for non-existent name', () => {
      vi.spyOn(atomRegistry, 'getAll').mockReturnValue(new Map());

      const result = atomFinder.findByFallbackName('nonExistent');

      expect(result).toBeNull();
    });
  });

  describe('findByIdString', () => {
    it('should find atom by ID string', () => {
      const result = atomFinder.findByIdString(mockAtom.id.toString());

      expect(result).toBe(mockAtom);
    });

    it('should delegate to findById', () => {
      const findByIdSpy = vi.spyOn(atomFinder, 'findById');

      atomFinder.findByIdString(mockAtom.id.toString());

      expect(findByIdSpy).toHaveBeenCalledWith(mockAtom.id.toString());
    });
  });
});

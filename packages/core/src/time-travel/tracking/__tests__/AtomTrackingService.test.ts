/**
 * AtomTrackingService tests
 */

import { describe, it, expect, vi } from 'vitest';
import { AtomTrackingService } from '../AtomTrackingService';
import type { TrackedAtom } from '../types';
import type { TrackedAtomsRepository } from '../TrackedAtomsRepository';
import type { TrackingEventManager } from '../TrackingEventManager';

function createMockRepository(): jest.Mocked<TrackedAtomsRepository> {
  return {
    track: vi.fn(),
    untrack: vi.fn(),
    isTracked: vi.fn(),
    get: vi.fn(),
    getByName: vi.fn(),
    getAll: vi.fn(),
    getCount: vi.fn(),
  } as unknown as jest.Mocked<TrackedAtomsRepository>;
}

function createMockEventManager(): jest.Mocked<TrackingEventManager> {
  return {
    emitAtomTracked: vi.fn(),
    emitAtomUntracked: vi.fn(),
    emitAtomChanged: vi.fn(),
    subscribe: vi.fn(),
  } as unknown as jest.Mocked<TrackingEventManager>;
}

function createMockTrackedAtom(id: symbol, name: string): TrackedAtom {
  return {
    id,
    name,
    atom: {} as any,
    type: 'primitive',
    status: 'active',
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    lastChanged: Date.now(),
    accessCount: 0,
    idleTime: 0,
    ttl: 60000,
    gcEligible: false,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    changeCount: 0,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accessCount: 0,
      changeCount: 0,
      tags: [],
      custom: {},
    },
    subscribers: new Set(),
  };
}

describe('AtomTrackingService', () => {
  describe('constructor', () => {
    it('should create with dependencies', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();

      const service = new AtomTrackingService(repository, eventManager);

      expect(service).toBeDefined();
    });
  });

  describe('track', () => {
    it('should track atom successfully', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      repository.track.mockReturnValue(true);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.track({} as any, trackedAtom);

      expect(result.success).toBe(true);
      expect(repository.track).toHaveBeenCalledWith(trackedAtom);
      expect(eventManager.emitAtomTracked).toHaveBeenCalledWith(trackedAtom);
    });

    it('should return error when atom already tracked', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      repository.track.mockReturnValue(false);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.track({} as any, trackedAtom);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Atom already tracked');
    });

    it('should handle tracking errors', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      repository.track.mockImplementation(() => {
        throw new Error('Track error');
      });

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.track({} as any, trackedAtom);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Track error');
    });
  });

  describe('untrack', () => {
    it('should untrack atom successfully', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atomId = Symbol('test');

      repository.untrack.mockReturnValue(true);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.untrack(atomId);

      expect(result.success).toBe(true);
      expect(repository.untrack).toHaveBeenCalledWith(atomId);
    });

    it('should return error when atom not found', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atomId = Symbol('test');

      repository.untrack.mockReturnValue(false);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.untrack(atomId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Atom not found');
    });

    it('should handle untrack errors', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atomId = Symbol('test');

      repository.untrack.mockImplementation(() => {
        throw new Error('Untrack error');
      });

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.untrack(atomId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Untrack error');
    });
  });

  describe('isTracked', () => {
    it('should return true for tracked atom', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atomId = Symbol('test');

      repository.isTracked.mockReturnValue(true);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.isTracked(atomId);

      expect(result).toBe(true);
      expect(repository.isTracked).toHaveBeenCalledWith(atomId);
    });

    it('should return false for untracked atom', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atomId = Symbol('test');

      repository.isTracked.mockReturnValue(false);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.isTracked(atomId);

      expect(result).toBe(false);
    });
  });

  describe('getTrackedAtom', () => {
    it('should return tracked atom', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atomId = Symbol('test');
      const trackedAtom = createMockTrackedAtom(atomId, 'test');

      repository.get.mockReturnValue(trackedAtom);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getTrackedAtom(atomId);

      expect(result).toBe(trackedAtom);
      expect(repository.get).toHaveBeenCalledWith(atomId);
    });

    it('should return undefined for unknown atom', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atomId = Symbol('test');

      repository.get.mockReturnValue(null);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getTrackedAtom(atomId);

      expect(result).toBeNull();
    });
  });

  describe('getAtomByName', () => {
    it('should return first matching atom', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atom1 = createMockTrackedAtom(Symbol('1'), 'test');
      const atom2 = createMockTrackedAtom(Symbol('2'), 'test');

      repository.getByName.mockReturnValue([atom1, atom2]);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getAtomByName('test');

      expect(result).toBe(atom1);
      expect(repository.getByName).toHaveBeenCalledWith('test');
    });

    it('should return undefined when no match', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();

      repository.getByName.mockReturnValue([]);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getAtomByName('unknown');

      expect(result).toBeUndefined();
    });
  });

  describe('getTrackedAtoms', () => {
    it('should return all tracked atoms', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();
      const atoms = [
        createMockTrackedAtom(Symbol('1'), 'test1'),
        createMockTrackedAtom(Symbol('2'), 'test2'),
      ];

      repository.getAll.mockReturnValue(atoms);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getTrackedAtoms();

      expect(result).toBe(atoms);
      expect(repository.getAll).toHaveBeenCalled();
    });

    it('should return empty array when no atoms', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();

      repository.getAll.mockReturnValue([]);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getTrackedAtoms();

      expect(result).toEqual([]);
    });
  });

  describe('getCount', () => {
    it('should return count of tracked atoms', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();

      repository.getCount.mockReturnValue(5);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getCount();

      expect(result).toBe(5);
      expect(repository.getCount).toHaveBeenCalled();
    });

    it('should return 0 when no atoms', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();

      repository.getCount.mockReturnValue(0);

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getCount();

      expect(result).toBe(0);
    });
  });

  describe('getRepository', () => {
    it('should return repository instance', () => {
      const repository = createMockRepository();
      const eventManager = createMockEventManager();

      const service = new AtomTrackingService(repository, eventManager);
      const result = service.getRepository();

      expect(result).toBe(repository);
    });
  });
});

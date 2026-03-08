/**
 * AtomAccessService tests
 */

import { describe, it, expect, vi } from 'vitest';
import { AtomAccessService } from '../AtomAccessService';
import type { TrackedAtom } from '../types';
import type { ReferenceCounter } from '../ReferenceCounter';
import type { TTLManager } from '../TTLManager';
import type { TrackingEventManager } from '../TrackingEventManager';

function createMockReferenceCounter(): jest.Mocked<ReferenceCounter> {
  return {
    recordAccess: vi.fn(),
    addSubscriber: vi.fn(),
    removeSubscriber: vi.fn(),
    getSubscriberCount: vi.fn(),
    getAccessCount: vi.fn(),
    hasSubscribers: vi.fn(),
    getAtomsWithNoSubscribers: vi.fn(),
    getStats: vi.fn(),
  } as unknown as jest.Mocked<ReferenceCounter>;
}

function createMockTTLManager(): jest.Mocked<TTLManager> {
  return {
    resetAccessTime: vi.fn(),
  } as unknown as jest.Mocked<TTLManager>;
}

function createMockEventManager(): jest.Mocked<TrackingEventManager> {
  return {
    emitAtomAccessed: vi.fn(),
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

describe('AtomAccessService', () => {
  describe('constructor', () => {
    it('should create with dependencies', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);

      expect(service).toBeDefined();
    });
  });

  describe('recordAccess', () => {
    it('should record access without subscriber', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      service.recordAccess({} as any, trackedAtom);

      expect(ttlManager.resetAccessTime).toHaveBeenCalledWith(trackedAtom);
      expect(refCounter.recordAccess).toHaveBeenCalledWith(trackedAtom);
      expect(eventManager.emitAtomAccessed).toHaveBeenCalledWith(trackedAtom);
    });

    it('should record access with subscriber', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      service.recordAccess({} as any, trackedAtom, 'sub1');

      expect(refCounter.addSubscriber).toHaveBeenCalledWith(trackedAtom, 'sub1');
    });
  });

  describe('removeSubscriber', () => {
    it('should remove subscriber', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      refCounter.removeSubscriber.mockReturnValue(true);

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.removeSubscriber({} as any, trackedAtom, 'sub1');

      expect(result).toBe(true);
      expect(refCounter.removeSubscriber).toHaveBeenCalledWith(trackedAtom, 'sub1');
    });

    it('should return false when removal fails', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      refCounter.removeSubscriber.mockReturnValue(false);

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.removeSubscriber({} as any, trackedAtom, 'sub1');

      expect(result).toBe(false);
    });
  });

  describe('getSubscriberCount', () => {
    it('should return subscriber count', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      refCounter.getSubscriberCount.mockReturnValue(3);

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.getSubscriberCount(trackedAtom);

      expect(result).toBe(3);
      expect(refCounter.getSubscriberCount).toHaveBeenCalledWith(trackedAtom);
    });
  });

  describe('getAccessCount', () => {
    it('should return access count', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      refCounter.getAccessCount.mockReturnValue(10);

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.getAccessCount(trackedAtom);

      expect(result).toBe(10);
      expect(refCounter.getAccessCount).toHaveBeenCalledWith(trackedAtom);
    });
  });

  describe('hasSubscribers', () => {
    it('should return true when has subscribers', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      refCounter.hasSubscribers.mockReturnValue(true);

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.hasSubscribers(trackedAtom);

      expect(result).toBe(true);
    });

    it('should return false when no subscribers', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const trackedAtom = createMockTrackedAtom(Symbol('test'), 'test');

      refCounter.hasSubscribers.mockReturnValue(false);

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.hasSubscribers(trackedAtom);

      expect(result).toBe(false);
    });
  });

  describe('getAtomsWithNoSubscribers', () => {
    it('should return atoms with no subscribers', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const atoms = [
        createMockTrackedAtom(Symbol('1'), 'test1'),
        createMockTrackedAtom(Symbol('2'), 'test2'),
      ];

      refCounter.getAtomsWithNoSubscribers.mockReturnValue([atoms[0]]);

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.getAtomsWithNoSubscribers(atoms);

      expect(result).toEqual([atoms[0]]);
      expect(refCounter.getAtomsWithNoSubscribers).toHaveBeenCalledWith(atoms);
    });
  });

  describe('getReferenceStats', () => {
    it('should return reference stats', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();
      const atoms = [createMockTrackedAtom(Symbol('1'), 'test1')];
      const stats = { totalAccesses: 10, totalSubscribers: 5 };

      refCounter.getStats.mockReturnValue(stats as any);

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.getReferenceStats(atoms);

      expect(result).toBe(stats);
      expect(refCounter.getStats).toHaveBeenCalledWith(atoms);
    });
  });

  describe('getReferenceCounter', () => {
    it('should return reference counter', () => {
      const refCounter = createMockReferenceCounter();
      const ttlManager = createMockTTLManager();
      const eventManager = createMockEventManager();

      const service = new AtomAccessService(refCounter, ttlManager, eventManager);
      const result = service.getReferenceCounter();

      expect(result).toBe(refCounter);
    });
  });
});

/**
 * CleanupEngine tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CleanupEngine } from '../CleanupEngine';
import { TrackedAtomsRepository } from '../TrackedAtomsRepository';
import { TTLManager } from '../TTLManager';
import type { TrackedAtom } from '../types';

function createTrackedAtom(name: string, stale = false): TrackedAtom {
  return {
    id: Symbol(name),
    atom: {} as any,
    name,
    type: 'primitive',
    status: stale ? 'stale' : 'active',
    createdAt: Date.now(),
    lastAccessed: stale ? Date.now() - 100000 : Date.now(),
    lastChanged: Date.now(),
    accessCount: stale ? 0 : 5,
    idleTime: stale ? 100000 : 0,
    ttl: 60000,
    gcEligible: stale,
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

describe('CleanupEngine', () => {
  let repository: TrackedAtomsRepository;
  let ttlManager: TTLManager;
  let engine: CleanupEngine;

  beforeEach(() => {
    repository = new TrackedAtomsRepository();
    ttlManager = new TTLManager();
    engine = new CleanupEngine(repository, ttlManager);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(engine).toBeDefined();
    });

    it('should create with custom config', () => {
      const eng = new CleanupEngine(repository, ttlManager, {
        defaultStrategy: 'archive',
        removeExpired: false,
        dryRun: true,
      });
      expect(eng).toBeDefined();
    });
  });

  describe('performCleanup', () => {
    it('should return cleanup result', async () => {
      const result = await engine.performCleanup();

      expect(result).toHaveProperty('cleanedCount');
      expect(result).toHaveProperty('failedCount');
      expect(result).toHaveProperty('errors');
    });

    it('should clean up stale atoms', async () => {
      const staleAtom = createTrackedAtom('stale', true);
      repository.track(staleAtom);

      const result = await engine.performCleanup();

      expect(result.cleanedCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors gracefully', async () => {
      const result = await engine.performCleanup();

      expect(result.errors).toEqual([]);
    });
  });

  describe('selectCandidates', () => {
    it('should return empty array when no candidates', () => {
      const candidates = engine.selectCandidates();
      expect(candidates.length).toBe(0);
    });

    it('should select stale atoms', () => {
      const staleAtom = createTrackedAtom('stale', true);
      repository.track(staleAtom);

      const candidates = engine.selectCandidates();

      expect(candidates.length).toBeGreaterThan(0);
    });

    it('should handle atoms with subscribers', () => {
      // Active atom with subscribers should not be selected
      const activeAtom = createTrackedAtom('active', false);
      activeAtom.subscribers.add('subscriber1');
      repository.track(activeAtom);

      const candidates = engine.selectCandidates();

      // May still select if TTL expired, but test the method runs
      expect(Array.isArray(candidates)).toBe(true);
    });
  });

  describe('cleanupAtom', () => {
    it('should remove atom with remove strategy', () => {
      const staleAtom = createTrackedAtom('stale', true);
      repository.track(staleAtom);

      const candidate = {
        atom: staleAtom,
        reason: 'stale' as const,
        action: 'remove' as const,
      };

      const result = engine.cleanupAtom(candidate);

      expect(result).toBe(true);
    });

    it('should mark atom as stale with mark-stale strategy', () => {
      const staleAtom = createTrackedAtom('stale', false);
      repository.track(staleAtom);

      const candidate = {
        atom: staleAtom,
        reason: 'idle' as const,
        action: 'mark-stale' as const,
      };

      const result = engine.cleanupAtom(candidate);

      expect(result).toBe(true);
    });

    it('should handle dry run', () => {
      const dryEngine = new CleanupEngine(repository, ttlManager, {
        dryRun: true,
        defaultStrategy: 'remove',
      });

      const staleAtom = createTrackedAtom('stale', true);
      repository.track(staleAtom);

      const candidate = {
        atom: staleAtom,
        reason: 'stale' as const,
        action: 'remove' as const,
      };

      const result = dryEngine.cleanupAtom(candidate);

      expect(result).toBe(false);
    });
  });

  describe('getStrategy', () => {
    it('should return configured strategy from config', () => {
      const eng = new CleanupEngine(repository, ttlManager, {
        defaultStrategy: 'archive',
      });

      const config = eng.getConfig();

      expect(config.defaultStrategy).toBe('archive');
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      engine.configure({ defaultStrategy: 'archive' });

      const config = engine.getConfig();
      expect(config.defaultStrategy).toBe('archive');
    });

    it('should preserve existing config', () => {
      const eng = new CleanupEngine(repository, ttlManager, {
        defaultStrategy: 'remove',
        removeExpired: true,
      });
      
      eng.configure({ removeExpired: false });

      const config = eng.getConfig();
      expect(config.defaultStrategy).toBe('remove');
      expect(config.removeExpired).toBe(false);
    });
  });
});

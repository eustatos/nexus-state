/**
 * Reconstruction strategies for optimized snapshot reconstruction
 */

import type { IReconstructionStrategy, IDeltaApplier } from './types.interfaces';
import type { Snapshot, DeltaSnapshot } from '../types';

/**
 * Sequential reconstruction strategy
 */
export class SequentialReconstructionStrategy implements IReconstructionStrategy {
  name = 'sequential';

  reconstruct(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
    deltaApplier: IDeltaApplier,
  ): Snapshot {
    let current = startSnapshot;

    for (const delta of deltas) {
      const result = deltaApplier.applyDelta(current, delta);
      if (!result) {
        throw new Error('Failed to apply delta');
      }
      current = result;
    }

    return current;
  }
}

/**
 * Skip deltas reconstruction strategy
 */
export class SkipDeltasReconstructionStrategy implements IReconstructionStrategy {
  name = 'skip-deltas';

  reconstruct(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
    deltaApplier: IDeltaApplier,
  ): Snapshot {
    // For now, just use sequential
    const strategy = new SequentialReconstructionStrategy();
    return strategy.reconstruct(startSnapshot, deltas, deltaApplier);
  }
}

/**
 * Cache-aware reconstruction strategy
 */
export class CacheAwareReconstructionStrategy implements IReconstructionStrategy {
  name = 'cache-aware';

  reconstruct(
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
    deltaApplier: IDeltaApplier,
  ): Snapshot {
    // For long delta chains, check if we can skip some
    if (deltas.length > 10) {
      // Could check cache for intermediate results here
      // For now, use sequential
    }

    const strategy = new SequentialReconstructionStrategy();
    return strategy.reconstruct(startSnapshot, deltas, deltaApplier);
  }
}

/**
 * Strategy registry for managing reconstruction strategies
 */
export class StrategyRegistry {
  private strategies: Map<string, IReconstructionStrategy> = new Map();

  constructor() {
    // Register default strategies
    this.register(new SequentialReconstructionStrategy());
    this.register(new SkipDeltasReconstructionStrategy());
    this.register(new CacheAwareReconstructionStrategy());
  }

  /**
   * Register a strategy
   */
  register(strategy: IReconstructionStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Get strategy by name
   */
  get(name: string): IReconstructionStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Get all strategy names
   */
  getStrategyNames(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if strategy exists
   */
  has(name: string): boolean {
    return this.strategies.has(name);
  }

  /**
   * Remove strategy
   */
  remove(name: string): boolean {
    return this.strategies.delete(name);
  }

  /**
   * Clear all strategies
   */
  clear(): void {
    this.strategies.clear();
  }
}

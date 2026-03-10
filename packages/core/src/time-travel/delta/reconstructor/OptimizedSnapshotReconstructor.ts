/**
 * OptimizedSnapshotReconstructor - Reconstructor with strategy selection
 */

import type {
  Snapshot,
  DeltaSnapshot,
  ReconstructionOptions,
  DeltaReconstructionResult,
} from '../types';
import type {
  IOptimizedSnapshotReconstructor,
  IReconstructionStrategy,
} from './types.interfaces';
import { SnapshotReconstructor, SnapshotReconstructorDeps } from './SnapshotReconstructor.di';
import { StrategyRegistry } from './ReconstructionStrategies';

/**
 * Optimized reconstructor with strategy selection
 */
export class OptimizedSnapshotReconstructor
  extends SnapshotReconstructor
  implements IOptimizedSnapshotReconstructor
{
  private strategyRegistry: StrategyRegistry;

  constructor(deps?: SnapshotReconstructorDeps) {
    super(deps);
    this.strategyRegistry = new StrategyRegistry();
  }

  /**
   * Reconstruct with strategy selection
   */
  reconstructWithStrategy(
    strategy: string,
    startSnapshot: Snapshot,
    deltas: DeltaSnapshot[],
  ): DeltaReconstructionResult {
    const reconstructStrategy = this.strategyRegistry.get(strategy);

    if (!reconstructStrategy) {
      return {
        success: false,
        error: `Unknown strategy: ${strategy}`,
        metadata: {
          reconstructionTime: 0,
          deltasApplied: 0,
        },
      };
    }

    const startTime = Date.now();

    try {
      const result = reconstructStrategy.reconstruct(
        startSnapshot,
        deltas,
        this.getDeltaApplier(),
      );

      // Cache result
      if (deltas.length > 0) {
        this.setInCache(deltas[deltas.length - 1].id, result);
      }

      return {
        success: true,
        snapshot: result,
        metadata: {
          reconstructionTime: Date.now() - startTime,
          deltasApplied: deltas.length,
          cacheHit: false,
          strategy: strategy,
        } as any,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          reconstructionTime: Date.now() - startTime,
          deltasApplied: 0,
          strategy: strategy,
        } as any,
      };
    }
  }

  /**
   * Register a reconstruction strategy
   */
  registerStrategy(_name: string, strategy: IReconstructionStrategy): void {
    this.strategyRegistry.register(strategy);
  }

  /**
   * Get available strategy names
   */
  getAvailableStrategies(): string[] {
    return this.strategyRegistry.getStrategyNames();
  }

  /**
   * Check if strategy is available
   */
  hasStrategy(name: string): boolean {
    return this.strategyRegistry.has(name);
  }
}

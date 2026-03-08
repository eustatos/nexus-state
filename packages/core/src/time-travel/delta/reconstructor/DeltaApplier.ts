/**
 * DeltaApplier - Applies deltas to snapshots
 */

import type { IDeltaApplier } from './types.interfaces';
import type { Snapshot, DeltaSnapshot } from '../types';
import { DeltaCalculatorImpl } from '../calculator';

/**
 * Default implementation of delta applier
 */
export class DeltaApplier implements IDeltaApplier {
  private calculator: DeltaCalculatorImpl;

  constructor(calculator?: DeltaCalculatorImpl) {
    this.calculator =
      calculator ??
      new DeltaCalculatorImpl({
        deepEqual: true,
        skipEmpty: true,
      });
  }

  /**
   * Apply delta to snapshot
   */
  applyDelta(snapshot: Snapshot, delta: DeltaSnapshot): Snapshot | null {
    return this.calculator.applyDelta(snapshot, delta);
  }

  /**
   * Get the underlying calculator
   */
  getCalculator(): DeltaCalculatorImpl {
    return this.calculator;
  }
}

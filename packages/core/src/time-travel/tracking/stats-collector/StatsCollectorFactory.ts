/**
 * StatsCollectorFactory - Creates StatisticsCollector with dependencies
 */

import { StatisticsCollector } from './StatisticsCollector.di';
import type { StatsCollectorDeps } from './StatisticsCollector.di';

/**
 * Create StatisticsCollector with default dependencies
 */
export function createStatsCollector(
  deps?: StatsCollectorDeps
): StatisticsCollector {
  return new StatisticsCollector(deps);
}

/**
 * Create StatisticsCollector for testing with mock dependencies
 */
export function createTestStatsCollector(
  mockDeps: Partial<StatsCollectorDeps>
): StatisticsCollector {
  return new StatisticsCollector(mockDeps);
}

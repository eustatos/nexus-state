/**
 * Test Fixtures
 * Pre-built fixtures for common test scenarios
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { primitiveAtoms, computedAtoms } from './fixtures';
 *
 * const numAtom = primitiveAtoms.number();
 * const doubleAtom = computedAtoms.double(numAtom);
 * ```
 *
 * @example
 * ```typescript
 * import { dependencyGraphs } from './fixtures';
 *
 * const { store, a, b, c, d } = dependencyGraphs.diamond();
 * expect(store.get(d)).toBe(50);
 * ```
 */

export {
  primitiveAtoms,
  computedAtoms,
  writableAtoms,
  edgeCaseAtoms,
} from './atoms';

export type {
  PrimitiveAtoms,
  ComputedAtoms,
  WritableAtoms,
  EdgeCaseAtoms,
} from './atoms';

export {
  dependencyGraphs,
  edgeCases,
  errorScenarios,
  performanceScenarios,
} from './scenarios';

export type {
  DependencyGraphs,
  EdgeCases,
  ErrorScenarios,
  PerformanceScenarios,
} from './scenarios';

export {
  testStores,
  StoreBuilder,
  createTestStore,
  createSnapshot,
} from './store';

export type {
  TestStores,
  StoreBuilderResult,
} from './store';

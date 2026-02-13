/**
 * Test fixtures for SnapshotMapper
 *
 * This file provides test data and mock objects for SnapshotMapper tests,
 * including snapshot-action pairs and edge case scenarios.
 */

/**
 * Sample snapshot-action mapping pairs
 */
export const sampleMappings = [
  {
    snapshotId: 'snap-001',
    actionId: 'user/login',
    timestamp: 1705372800000,
    metadata: { source: 'auth', type: 'action' },
  },
  {
    snapshotId: 'snap-002',
    actionId: 'data/fetch',
    timestamp: 1705372860000,
    metadata: { source: 'api', type: 'async' },
  },
  {
    snapshotId: 'snap-003',
    actionId: 'user/login',
    timestamp: 1705372920000,
    metadata: { source: 'auth', type: 'action' },
  },
  {
    snapshotId: 'snap-004',
    actionId: 'user/logout',
    timestamp: 1705372980000,
    metadata: { source: 'auth', type: 'action' },
  },
  {
    snapshotId: 'snap-005',
    actionId: 'data/fetch',
    timestamp: 1705373040000,
    metadata: { source: 'api', type: 'async' },
  },
];

/**
 * Empty snapshot-action mapping (edge case)
 */
export const emptyMapping = {
  snapshotId: '',
  actionId: '',
  timestamp: 0,
  metadata: {},
};

/**
 * Invalid snapshot IDs for validation tests
 */
export const invalidSnapshotIds = [
  '',
  null as unknown as string,
  undefined as unknown as string,
  123 as unknown as string,
  {} as unknown as string,
];

/**
 * Invalid action IDs for validation tests
 */
export const invalidActionIds = [
  '',
  null as unknown as string,
  undefined as unknown as string,
  123 as unknown as string,
  {} as unknown as string,
];

/**
 * Action IDs for cleanup testing
 */
export const actionIdsForCleanup = [
  'user/login',
  'user/logout',
  'data/fetch',
  'ui/click',
  'api/request',
];

/**
 * Action IDs to keep during cleanup
 */
export const actionIdsToKeep = [
  'user/login',
  'user/logout',
];

/**
 * Mock SimpleTimeTravel snapshots for integration testing
 */
export const mockSnapshots = [
  {
    id: 'snap-100',
    state: { 'atom-counter': { value: 0, type: 'primitive' } },
    metadata: { timestamp: 1705372800000, action: 'INIT', atomCount: 1 },
  },
  {
    id: 'snap-101',
    state: { 'atom-counter': { value: 1, type: 'primitive' } },
    metadata: { timestamp: 1705372860000, action: 'INCREMENT', atomCount: 1 },
  },
  {
    id: 'snap-102',
    state: { 'atom-counter': { value: 2, type: 'primitive' } },
    metadata: { timestamp: 1705372920000, action: 'INCREMENT', atomCount: 1 },
  },
  {
    id: 'snap-103',
    state: { 'atom-counter': { value: 3, type: 'primitive' } },
    metadata: { timestamp: 1705372980000, action: 'INCREMENT', atomCount: 1 },
  },
];

/**
 * Large dataset for performance testing
 */
export const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
  snapshotId: `snap-${i.toString().padStart(4, '0')}`,
  actionId: `action-${i % 10}`,
  timestamp: 1705372800000 + i * 1000,
  metadata: { index: i },
}));

/**
 * Callback tracking for integration tests
 */
export const createCallbackTracker = () => {
  const addedMappings: Array<{ mapping: object }> = [];
  const cleanupCounts: number[] = [];

  const onMappingAdded = (mapping: object) => {
    addedMappings.push({ mapping });
  };

  const onCleanup = (count: number) => {
    cleanupCounts.push(count);
  };

  return {
    addedMappings,
    cleanupCounts,
    onMappingAdded,
    onCleanup,
  };
};

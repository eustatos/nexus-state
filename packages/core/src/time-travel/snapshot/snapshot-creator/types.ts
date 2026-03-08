/**
 * SnapshotCreator types
 */

import type { Snapshot } from '../types';

/**
 * Configuration for SnapshotCreator
 */
export interface SnapshotCreatorConfig {
  /** Types of atoms to include (primitive, computed, writable) */
  includeTypes: Array<'primitive' | 'computed' | 'writable' | string>;

  /** Atoms to exclude by name */
  excludeAtoms: string[];

  /** Transform function for snapshots before storing */
  transform: ((snapshot: Snapshot) => Snapshot) | null;

  /** Whether to validate after creation */
  validate: boolean;

  /** ID generator function */
  generateId: () => string;

  /** Whether to include metadata in snapshot */
  includeMetadata: boolean;

  /** Custom serializer for values */
  valueSerializer?: (value: unknown) => unknown;

  /** Maximum number of atoms per snapshot */
  maxAtomsPerSnapshot?: number;
  /** Whether auto-capture is enabled (for state change detection) */
  autoCapture?: boolean;
  /** Whether to skip state change check (useful for initial captures) */
  skipStateCheck?: boolean;
}

/**
 * Creation result
 */
export interface CreationResult {
  /** Whether creation was successful */
  success: boolean;

  /** Created snapshot (if successful) */
  snapshot: Snapshot | null;

  /** Duration in milliseconds */
  duration: number;

  /** Creation timestamp */
  timestamp: number;

  /** Error message (if failed) */
  error?: string;

  /** Number of atoms captured */
  atomCount: number;

  /** Size estimate in bytes */
  sizeEstimate?: number;
}

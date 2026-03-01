/**
 * SnapshotMapper - Bidirectional mapping between DevTools actions and time travel snapshots
 *
 * This class provides efficient bidirectional mapping between DevTools action IDs
 * (action names/types) and SimpleTimeTravel snapshot IDs, with automatic cleanup
 * for memory management.
 *
 * @example
 * ```typescript
 * const mapper = new SnapshotMapper({
 *   maxMappings: 1000,
 *   autoCleanup: true,
 *   onMappingAdded: (mapping) => console.log('Added mapping:', mapping),
 * });
 *
 * // Map a snapshot to an action
 * const result = mapper.mapSnapshotToAction('snap-123', 'user/login');
 *
 * // Look up by snapshot ID
 * const actionId = mapper.getActionIdBySnapshotId('snap-123');
 *
 * // Look up by action ID
 * const snapshotId = mapper.getSnapshotIdByActionId('user/login');
 *
 * // Clean up old mappings
 * mapper.cleanup(['user/login']);
 * ```
 */

import type {
  SnapshotMapping,
  SnapshotMapperConfig,
  SnapshotMapperResult,
  ActionToSnapshotMap,
  SnapshotToActionMap,
} from './types';

/**
 * SnapshotMapper class for bidirectional mapping between actions and snapshots
 *
 * This class provides efficient bidirectional mapping between DevTools action IDs
 * (action names/types) and SimpleTimeTravel snapshot IDs, with automatic cleanup
 * for memory management.
 *
 * @class SnapshotMapper
 */
export class SnapshotMapper {
  private actionToSnapshot: ActionToSnapshotMap = new Map();
  private snapshotToAction: SnapshotToActionMap = new Map();
  private mappings: Map<string, SnapshotMapping> = new Map();
  private config: Required<SnapshotMapperConfig>;

  /**
   * Creates a new SnapshotMapper instance
   * @param config Configuration options for the mapper
   */
  constructor(config: SnapshotMapperConfig = {}) {
    this.config = {
      maxMappings: config.maxMappings ?? 1000,
      autoCleanup: config.autoCleanup ?? true,
      onMappingAdded: config.onMappingAdded ?? (() => {}),
      onCleanup: config.onCleanup ?? (() => {}),
    };
  }

  /**
   * Map a snapshot ID to an action ID
   * @param snapshotId The snapshot ID from SimpleTimeTravel
   * @param actionId The action ID (typically action name or type)
   * @param metadata Optional action metadata
   * @returns Mapping result with success status
   */
  mapSnapshotToAction(
    snapshotId: string,
    actionId: string,
    metadata?: Record<string, unknown>,
  ): SnapshotMapperResult {
    try {
      // Validate inputs
      if (!snapshotId || typeof snapshotId !== 'string') {
        return {
          success: false,
          error: 'Invalid snapshot ID: must be non-empty string',
        };
      }

      if (!actionId || typeof actionId !== 'string') {
        return {
          success: false,
          error: 'Invalid action ID: must be non-empty string',
        };
      }

      // Create mapping entry
      const mapping: SnapshotMapping = {
        snapshotId,
        actionId,
        timestamp: Date.now(),
        metadata: metadata ?? {},
      };

      // Check for existing mapping (overwrite allowed for same snapshot)
      const existingSnapshotMapping = this.snapshotToAction.get(snapshotId);
      if (existingSnapshotMapping && existingSnapshotMapping !== actionId) {
        // Clean up old action mapping
        this.actionToSnapshot.delete(existingSnapshotMapping);
      }

      // Update both maps
      this.actionToSnapshot.set(actionId, snapshotId);
      this.snapshotToAction.set(snapshotId, actionId);
      this.mappings.set(snapshotId, mapping);

      // Auto cleanup if needed
      if (this.config.autoCleanup && this.mappings.size > this.config.maxMappings) {
        this.cleanup();
      }

      // Call callback
      this.config.onMappingAdded(mapping);

      return { success: true, mapping };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || 'Unknown error creating mapping',
      };
    }
  }

  /**
   * Get snapshot ID by action ID
   * @param actionId The action ID to look up
   * @returns The snapshot ID or undefined if not found
   */
  getSnapshotIdByActionId(actionId: string): string | undefined {
    return this.actionToSnapshot.get(actionId);
  }

  /**
   * Get action ID by snapshot ID
   * @param snapshotId The snapshot ID to look up
   * @returns The action ID or undefined if not found
   */
  getActionIdBySnapshotId(snapshotId: string): string | undefined {
    return this.snapshotToAction.get(snapshotId);
  }

  /**
   * Get all mappings for an action ID (supports multiple snapshots per action)
   * @param actionId The action ID to look up
   * @returns Array of snapshot IDs for this action
   */
  getSnapshotIdsByActionId(actionId: string): string[] {
    const snapshotId = this.actionToSnapshot.get(actionId);
    return snapshotId ? [snapshotId] : [];
  }

  /**
   * Get all action IDs that have mappings
   * @returns Array of action IDs
   */
  getAllActionIds(): string[] {
    return Array.from(this.actionToSnapshot.keys());
  }

  /**
   * Get all snapshot IDs that have mappings
   * @returns Array of snapshot IDs
   */
  getAllSnapshotIds(): string[] {
    return Array.from(this.snapshotToAction.keys());
  }

  /**
   * Get the count of active mappings
   * @returns Number of active mappings
   */
  getMappingCount(): number {
    return this.mappings.size;
  }

  /**
   * Cleanup old or unused mappings
   * @param actionIdsToKeep Optional array of action IDs to keep (keep all if not specified)
   * @returns Number of mappings cleaned up
   */
  cleanup(actionIdsToKeep?: string[]): number {
    try {
      const initialSize = this.mappings.size;

      if (actionIdsToKeep && actionIdsToKeep.length > 0) {
        // Keep only specified action IDs
        const actionIdsSet = new Set(actionIdsToKeep);

        // Remove mappings for action IDs not in keep list
        for (const actionId of this.actionToSnapshot.keys()) {
          if (!actionIdsSet.has(actionId)) {
            const snapshotId = this.actionToSnapshot.get(actionId);
            if (snapshotId) {
              this.actionToSnapshot.delete(actionId);
              this.snapshotToAction.delete(snapshotId);
              this.mappings.delete(snapshotId);
            }
          }
        }
      } else {
        // General cleanup: remove oldest mappings if over limit
        const overflow = this.mappings.size - this.config.maxMappings;
        if (overflow > 0) {
          // Get oldest mappings to remove
          const mappingsArray = Array.from(this.mappings.entries());
          const toRemove = mappingsArray.slice(0, overflow);

          for (const [snapshotId] of toRemove) {
            const actionId = this.snapshotToAction.get(snapshotId);
            if (actionId) {
              this.actionToSnapshot.delete(actionId);
              this.snapshotToAction.delete(snapshotId);
            }
            this.mappings.delete(snapshotId);
          }
        }
      }

      const cleanedCount = initialSize - this.mappings.size;
      if (cleanedCount > 0) {
        this.config.onCleanup(cleanedCount);
      }

      return cleanedCount;
    } catch (error) {
      // Log error but don't throw
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[SnapshotMapper] Cleanup error:', error);
      }
      return 0;
    }
  }

  /**
   * Clear all mappings
   */
  clear(): void {
    this.actionToSnapshot.clear();
    this.snapshotToAction.clear();
    this.mappings.clear();
  }

  /**
   * Check if a mapping exists for the given snapshot ID
   * @param snapshotId The snapshot ID to check
   * @returns True if mapping exists
   */
  hasSnapshotMapping(snapshotId: string): boolean {
    return this.snapshotToAction.has(snapshotId);
  }

  /**
   * Check if a mapping exists for the given action ID
   * @param actionId The action ID to check
   * @returns True if mapping exists
   */
  hasActionMapping(actionId: string): boolean {
    return this.actionToSnapshot.has(actionId);
  }
}

/**
 * Create a new SnapshotMapper instance
 * @param config Configuration options for the mapper
 * @returns New SnapshotMapper instance
 */
export function createSnapshotMapper(
  config: SnapshotMapperConfig = {},
): SnapshotMapper {
  return new SnapshotMapper(config);
}

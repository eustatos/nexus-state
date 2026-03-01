/**
 * History utilities for SimpleTimeTravel
 *
 * @packageDocumentation
 * Provides stack-based history management with navigation capabilities.
 */

// Constants only
export {
  DEFAULT_MAX_SIZE,
  DEFAULT_VALIDATION_LEVEL,
  VALIDATION_RULES,
  COMPACTION_STRATEGIES,
  SORT_ORDERS,
  HISTORY_EVENTS,
  VALIDATION_LEVELS,
  ERROR_CODES,
  COMPACTION_INTERVALS,
  DEFAULT_VALIDATION_MESSAGES,
} from "./types";

/**
 * Check if a position is valid in history
 * @param index Position to check
 * @param totalLength Total length of history
 * @returns True if position is valid
 */
export function isValidHistoryPosition(
  index: number,
  totalLength: number,
): boolean {
  return index >= 0 && index < totalLength;
}

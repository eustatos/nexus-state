/**
 * @deprecated Use @nexus-state/time-travel instead
 * This module is deprecated and will be removed in the next major version.
 * Please migrate to the new time-travel package:
 * 
 * ```ts
 * // Old (deprecated)
 * import { TimeTravelController } from '@nexus-state/core';
 * 
 * // New
 * import { TimeTravelController } from '@nexus-state/time-travel';
 * ```
 */

// Re-export from time-travel package with deprecation warnings
export { TimeTravelController, SimpleTimeTravel } from '@nexus-state/time-travel';

// Deprecation warning helper
export function __deprecatedTimeTravel() {
  console.warn(
    '[DEPRECATION] @nexus-state/core time-travel exports are deprecated. ' +
    'Please use @nexus-state/time-travel instead. ' +
    'See migration guide: https://nexus-state.website.yandexcloud.net/migration'
  );
}

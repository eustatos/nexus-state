import { isSSREnvironment } from "./devtools-plugin";
import { isDevToolsAvailable } from "./isDevToolsAvailable";
import type { DevToolsMode } from "./types";

/**
 * Determine the appropriate DevTools mode based on environment and availability
 * @param forceDisable - Optional flag to force disabled mode
 * @returns DevToolsMode enum value
 */

export function getDevToolsMode(forceDisable?: boolean): DevToolsMode {
  // Check for forced disabled mode
  if (forceDisable) {
    return "disabled";
  }

  // Check for SSR environment
  if (isSSREnvironment()) {
    return "disabled";
  }

  // Check for DevTools extension
  if (isDevToolsAvailable()) {
    return "active";
  }

  // Fall back to fallback mode
  return "fallback";
}

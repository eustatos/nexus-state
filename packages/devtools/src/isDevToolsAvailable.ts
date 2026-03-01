import { isSSREnvironment } from "./devtools-plugin";

/**
 * Check if DevTools extension is available
 * @returns True if DevTools is available
 */

export function isDevToolsAvailable(): boolean {
  if (isSSREnvironment()) {
    return false;
  }
  return !!window.__REDUX_DEVTOOLS_EXTENSION__;
}

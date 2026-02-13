import type { DevToolsConfig } from './types';
import { DevToolsPlugin } from './devtools-plugin';

/**
 * Factory function to create a DevToolsPlugin instance.
 * @param config Optional configuration for the DevTools plugin
 * @returns A configured DevToolsPlugin instance
 * @example
 * // Create a default DevTools plugin
 * const devtools = devTools();
 *
 * // Create a DevTools plugin with custom configuration
 * const devtools = devTools({
 *   name: 'My App',
 *   trace: true,
 *   latency: 100,
 *   maxAge: 50,
 *   showAtomNames: true,
 * });
 */
export function devTools(config: DevToolsConfig = {}): DevToolsPlugin {
  return new DevToolsPlugin(config);
}

export { DevToolsPlugin };
export { SnapshotMapper, createSnapshotMapper } from './snapshot-mapper';
export type {
  DevToolsConfig,
  DevToolsConnection,
  DevToolsMessage,
  EnhancedStore,
  JumpToActionCommand,
  JumpToStateCommand,
  Command,
  CommandHandlerConfig,
  BasicAtom,
  DevToolsMode,
  DevToolsFeatureDetectionResult,
  SnapshotMapperConfig,
  SnapshotMapperResult,
  SnapshotMapping,
  ActionToSnapshotMap,
  SnapshotToActionMap,
} from './types';

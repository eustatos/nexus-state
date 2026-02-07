/**
 * Configuration options for the DevTools plugin.
 */
export type DevToolsConfig = {
  /**
   * The name to display in DevTools for this store instance.
   * @default 'nexus-state'
   */
  name?: string;

  /**
   * Enable stack traces for actions in DevTools.
   * @default false
   */
  trace?: boolean;

  /**
   * Debounce time (in ms) for sending updates to DevTools to prevent performance issues.
   * @default 100
   */
  latency?: number;

  /**
   * Maximum number of actions to keep in DevTools history.
   * @default 50
   */
  maxAge?: number;

  /**
   * Predicate function to determine if an action should be sent to DevTools.
   * Return true to send the action, false to skip it.
   * @param action The action name
   * @param state The current state
   */
  actionSanitizer?: (action: string, state: unknown) => boolean;

  /**
   * Function to sanitize state before sending to DevTools.
   * Useful for removing sensitive data from state.
   * @param state The state to sanitize
   */
  stateSanitizer?: (state: unknown) => unknown;

  /**
   * Enable stack trace capture for debugging.
   * Only works in development mode.
   * @default false
   */
  enableStackTrace?: boolean;

  /**
   * Maximum number of stack frames to capture.
   * @default 10
   */
  traceLimit?: number;

  /**
   * Action naming strategy.
   * @default 'auto'
   */
  actionNaming?:
    | "auto"
    | "custom"
    | ((atom: { id?: { toString(): string } }, value: unknown) => string);

  /**
   * Enable action grouping for related updates.
   * @default true
   */
  enableGrouping?: boolean;

  /**
   * Maximum number of actions in a group.
   * @default 100
   */
  maxGroupSize?: number;
};

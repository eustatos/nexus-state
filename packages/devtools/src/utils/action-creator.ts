/**
 * Action creator utilities for enhanced debugging experience
 * Implements action creator API as per TASK-005
 */

import { ActionMetadata, ActionNamingStrategy } from "./action-naming";
import { CapturedStackTrace } from "./stack-tracer";

export interface Action {
  type: string;
  payload?: unknown;
  metadata?: ActionMetadata;
  stackTrace?: CapturedStackTrace;
  timestamp: number;
}

export interface ActionGroup {
  actions: Action[];
  groupName: string;
  timestamp: number;
}

/**
 * Create a single action with metadata
 * @param name - Action name
 * @param payload - Action payload
 * @param metadata - Action metadata
 * @param stackTrace - Optional stack trace
 * @returns Created action
 */
export function createAction<T = unknown>(
  name: string,
  payload?: T,
  metadata?: ActionMetadata,
  stackTrace?: CapturedStackTrace,
): Action {
  return {
    type: name,
    payload,
    metadata,
    stackTrace,
    timestamp: Date.now(),
  };
}

/**
 * Create a group of related actions
 * @param actions - Array of actions
 * @param groupName - Name for the action group
 * @returns Action group
 */
export function createActionGroup(
  actions: Action[],
  groupName: string,
): ActionGroup {
  return {
    actions,
    groupName,
    timestamp: Date.now(),
  };
}

/**
 * Create action with custom naming strategy
 * @param atom - Atom being updated
 * @param value - New value
 * @param strategy - Naming strategy
 * @param metadata - Action metadata
 * @param stackTrace - Optional stack trace
 * @returns Created action
 */
export function createActionWithNaming<T = unknown>(
  atom: { id?: { toString(): string } },
  value: T,
  strategy: ActionNamingStrategy,
  metadata: ActionMetadata,
  stackTrace?: CapturedStackTrace,
): Action {
  // Generate action name based on strategy
  const actionName =
    typeof strategy === "function"
      ? strategy(atom, value)
      : metadata.customName || `ATOM_UPDATE/${metadata.atomName}`;

  return createAction(actionName, value, metadata, stackTrace);
}

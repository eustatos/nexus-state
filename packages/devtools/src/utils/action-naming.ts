/**
 * Action naming utilities for enhanced debugging experience
 * Implements configurable action naming strategies as per TASK-005
 */

export type ActionNamingStrategy =
  | "auto"
  | "custom"
  | ((atom: { id?: { toString(): string } }, value: unknown) => string);

export interface ActionMetadata {
  atomName: string;
  atomType: string;
  updateType: "direct" | "computed";
  customName?: string;
  timestamp: number;
}

/**
 * Default action naming function
 * @param atomName - Name of the atom being updated
 * @param metadata - Action metadata
 * @returns Formatted action name
 */
export function defaultActionNaming(
  atomName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  metadata: ActionMetadata,
): string {
  return `ATOM_UPDATE/${atomName}`;
}

/**
 * Generate action name based on configured strategy
 * @param strategy - Naming strategy to use
 * @param atom - Atom being updated
 * @param value - New value
 * @param metadata - Action metadata
 * @returns Generated action name
 */
export function generateActionName(
  strategy: ActionNamingStrategy,
  atom: { id?: { toString(): string } },
  value: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  metadata: ActionMetadata,
): string {
  if (typeof strategy === "function") {
    return strategy(atom, value);
  }

  if (strategy === "custom" && metadata.customName) {
    return metadata.customName;
  }

  // Default auto strategy
  return defaultActionNaming(metadata.atomName, metadata);
}

/**
 * Create action metadata object
 * @param atomName - Name of the atom
 * @param atomType - Type of the atom
 * @param updateType - Type of update (direct or computed)
 * @param customName - Optional custom name
 * @returns Action metadata object
 */
export function createActionMetadata(
  atomName: string,
  atomType: string,
  updateType: "direct" | "computed",
  customName?: string,
): ActionMetadata {
  return {
    atomName,
    atomType,
    updateType,
    customName,
    timestamp: Date.now(),
  };
}

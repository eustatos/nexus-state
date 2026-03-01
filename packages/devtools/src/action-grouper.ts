/**
 * Action grouper for batched updates: collect related actions and emit
 * a single DevTools action when the group is closed.
 *
 * @example
 * ```ts
 * const grouper = createActionGrouper({ maxGroupSize: 10 });
 * grouper.startGroup("batch-1");
 * grouper.add(metadata1);
 * grouper.add(metadata2);
 * const result = grouper.endGroup("batch-1");
 * // result.type === "Batch (2 updates)", result.count === 2
 * ```
 */

import type {
  ActionMetadata,
  ActionGroupOptions,
  ActionGroupResult,
} from "./types";

const DEFAULT_FLUSH_AFTER_MS = 100;
const DEFAULT_MAX_GROUP_SIZE = 50;

/**
 * Format a group label for DevTools display.
 */
export type GroupLabelFormatter = (
  count: number,
  atomNames: string[],
) => string;

const defaultGroupLabel: GroupLabelFormatter = (count, atomNames) => {
  if (atomNames.length === 0) return `Batch (${count} updates)`;
  const unique = [...new Set(atomNames)];
  if (unique.length <= 2) return `Batch: ${unique.join(", ")}`;
  return `Batch (${count}): ${unique.slice(0, 2).join(", ")} +${unique.length - 2}`;
};

type ActionGrouperConfig = Required<
  Pick<ActionGroupOptions, "flushAfterMs" | "maxGroupSize">
> & {
  onFlush?: (result: ActionGroupResult) => void;
};

/**
 * ActionGrouper collects actions by groupId and produces a single
 * ActionGroupResult when the group is ended (or auto-flushed).
 */
export class ActionGrouper {
  private groups = new Map<string, ActionMetadata[]>();
  private config: ActionGrouperConfig;
  private groupLabelFormatter: GroupLabelFormatter;
  private flushTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    options: ActionGroupOptions = {},
    groupLabelFormatter?: GroupLabelFormatter,
  ) {
    this.config = {
      flushAfterMs: options.flushAfterMs ?? DEFAULT_FLUSH_AFTER_MS,
      maxGroupSize: options.maxGroupSize ?? DEFAULT_MAX_GROUP_SIZE,
      onFlush: options.onFlush,
    };
    this.groupLabelFormatter = groupLabelFormatter ?? defaultGroupLabel;
  }

  /**
   * Start a group. Actions added with this groupId will be batched until endGroup.
   */
  startGroup(groupId: string): void {
    if (this.groups.has(groupId)) return;
    this.groups.set(groupId, []);

    const timer = setTimeout(() => {
      this.flushTimers.delete(groupId);
      const result = this.flushGroup(groupId);
      if (result && this.config.onFlush) this.config.onFlush(result);
    }, this.config.flushAfterMs);
    this.flushTimers.set(groupId, timer);
  }

  /**
   * Add action metadata. If it has a groupId, it is added to that group.
   */
  add(metadata: ActionMetadata): void {
    const groupId = metadata.groupId;
    if (!groupId) return;

    let list = this.groups.get(groupId);
    if (!list) {
      this.startGroup(groupId);
      list = this.groups.get(groupId)!;
    }
    list.push(metadata);

    if (list.length >= this.config.maxGroupSize) {
      this.clearFlushTimer(groupId);
      const result = this.flushGroup(groupId);
      if (result && this.config.onFlush) this.config.onFlush(result);
    }
  }

  /**
   * End a group and return the combined result, or null if the group was empty.
   */
  endGroup(groupId: string): ActionGroupResult | null {
    this.clearFlushTimer(groupId);
    return this.flushGroup(groupId);
  }

  /**
   * Flush a group by ID. Returns the combined result or null. Removes the group.
   */
  flushGroup(groupId: string): ActionGroupResult | null {
    const list = this.groups.get(groupId);
    this.groups.delete(groupId);
    if (!list || list.length === 0) return null;

    const atomNames = list.map((m) => m.atomName).filter(Boolean);
    const type = this.groupLabelFormatter(list.length, atomNames);
    const first = list[0];
    const metadata: Record<string, unknown> = {
      ...first,
      batchCount: list.length,
      atomNames,
      batchGroupId: groupId,
    };
    return { type, metadata, count: list.length };
  }

  /**
   * Flush all pending groups and return their results.
   */
  flushAll(): ActionGroupResult[] {
    for (const id of this.flushTimers.keys()) {
      this.clearFlushTimer(id);
    }
    const results: ActionGroupResult[] = [];
    for (const groupId of this.groups.keys()) {
      const r = this.flushGroup(groupId);
      if (r) results.push(r);
    }
    return results;
  }

  /**
   * Check if a group has pending actions.
   */
  hasGroup(groupId: string): boolean {
    const list = this.groups.get(groupId);
    return !!list && list.length > 0;
  }

  /**
   * Get pending group IDs (for debugging).
   */
  getPendingGroupIds(): string[] {
    return Array.from(this.groups.keys());
  }

  private clearFlushTimer(groupId: string): void {
    const timer = this.flushTimers.get(groupId);
    if (timer) {
      clearTimeout(timer);
      this.flushTimers.delete(groupId);
    }
  }
}

/**
 * Create an ActionGrouper with optional config and custom label formatter.
 */
export function createActionGrouper(
  options?: ActionGroupOptions,
  groupLabelFormatter?: GroupLabelFormatter,
): ActionGrouper {
  return new ActionGrouper(options, groupLabelFormatter);
}

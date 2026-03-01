/**
 * Action metadata builder with fluent API for DevTools actions.
 * Supports standard fields and type-safe custom metadata.
 *
 * @example
 * ```ts
 * const meta = createActionMetadata()
 *   .type("user/SET_NAME")
 *   .atomName("user")
 *   .stackTrace("at set...")
 *   .set("userId", "u-1")
 *   .build();
 * ```
 */

import type { ActionMetadata, ActionMetadataBase } from "./types";

/**
 * Fluent builder for ActionMetadata with optional type-safe custom fields.
 */
export class ActionMetadataBuilder<T extends Record<string, unknown> = Record<string, unknown>> {
  private data: Partial<ActionMetadataBase> & Record<string, unknown> = {};

  /**
   * Set the action type/name (required for build).
   */
  type(value: string): this {
    this.data.type = value;
    return this;
  }

  /**
   * Set timestamp (defaults to Date.now() at build if not set).
   */
  timestamp(value: number): this {
    this.data.timestamp = value;
    return this;
  }

  /**
   * Set source identifier.
   */
  source(value: string): this {
    this.data.source = value;
    return this;
  }

  /**
   * Set atom display name.
   */
  atomName(value: string): this {
    this.data.atomName = value;
    return this;
  }

  /**
   * Set stack trace string (dev only).
   */
  stackTrace(value: string): this {
    this.data.stackTrace = value;
    return this;
  }

  /**
   * Set group ID for batching related updates.
   */
  groupId(value: string): this {
    this.data.groupId = value;
    return this;
  }

  /**
   * Set a custom metadata field (type-safe when T is provided).
   */
  set<K extends string, V>(key: K, value: V): ActionMetadataBuilder<T & Record<K, V>> {
    this.data[key] = value;
    return this as ActionMetadataBuilder<T & Record<K, V>>;
  }

  /**
   * Merge multiple custom fields at once.
   */
  merge(custom: Record<string, unknown>): this {
    Object.assign(this.data, custom);
    return this;
  }

  /**
   * Build the metadata object. Ensures type and timestamp are set.
   */
  build(): ActionMetadata<T> {
    if (this.data.type === undefined) {
      throw new Error("ActionMetadataBuilder: type is required");
    }
    const built: ActionMetadataBase & Record<string, unknown> = {
      type: this.data.type,
      timestamp: this.data.timestamp ?? Date.now(),
      source: this.data.source ?? "unknown",
      atomName: this.data.atomName ?? "",
      ...this.data,
    };
    return built as ActionMetadata<T>;
  }
}

/**
 * Create a new ActionMetadataBuilder with fluent API.
 */
export function createActionMetadata<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): ActionMetadataBuilder<T> {
  return new ActionMetadataBuilder<T>();
}

/**
 * Create minimal action metadata from required fields (convenience when no builder is needed).
 */
export function createMinimalActionMetadata(
  type: string,
  atomName: string,
  overrides?: Partial<ActionMetadataBase> & Record<string, unknown>,
): ActionMetadata {
  return createActionMetadata()
    .type(type)
    .atomName(atomName)
    .merge(overrides ?? {})
    .build();
}

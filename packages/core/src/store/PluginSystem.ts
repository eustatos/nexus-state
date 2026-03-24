/**
 * PluginSystem - Manages store plugins and hooks
 *
 * Handles plugin registration and hook execution.
 */

import type { Store, Plugin, PluginHooks, Atom, ActionMetadata } from '../types';
import type { AtomContext } from '../reactive';
import { storeLogger as logger } from '../debug';

/**
 * PluginSystem provides plugin management
 */
export class PluginSystem {
  private plugins: Plugin[] = [];
  private hooks: PluginHooks[] = [];

  /**
   * Apply a plugin to the store
   * @param plugin Plugin to apply
   * @param store Store instance
   */
  applyPlugin(plugin: Plugin, store: Store): void {
    this.plugins.push(plugin);

    try {
      const hooks = plugin(store);
      if (hooks && typeof hooks === 'object') {
        this.hooks.push(hooks);
        logger.log('[PluginSystem] Applied plugin with hooks');
      } else {
        logger.log('[PluginSystem] Applied plugin without hooks');
      }
    } catch (error) {
      logger.error('[PluginSystem] Plugin application error:', error);
      throw error;
    }
  }

  /**
   * Execute onSet hooks
   * @param atom Atom being set
   * @param value Value to set
   * @param context Optional operation metadata
   * @returns Processed value
   */
  executeOnSetHooks<T>(atom: Atom<any>, value: T, context?: AtomContext): T {
    let processedValue = value;

    for (const hooks of this.hooks) {
      if (hooks.onSet) {
        const result = hooks.onSet(atom, processedValue, context);
        if (result !== undefined) {
          processedValue = result;
        }
      }
    }

    return processedValue;
  }

  /**
   * Execute afterSet hooks
   * @param atom Atom that was set
   * @param value Final value
   * @param context Optional operation metadata
   */
  executeAfterSetHooks<T>(atom: Atom<any>, value: T, context?: AtomContext): void {
    for (const hooks of this.hooks) {
      if (hooks.afterSet) {
        hooks.afterSet(atom, value, context);
      }
    }
  }

  /**
   * Execute onGet hooks
   * @param atom Atom being read
   * @param value Current value
   * @returns Processed value
   */
  executeOnGetHooks<T>(atom: Atom<any>, value: T): T {
    let processedValue = value;

    for (const hooks of this.hooks) {
      if (hooks.onGet) {
        processedValue = hooks.onGet(atom, processedValue);
      }
    }

    return processedValue;
  }

  /**
   * Get all applied plugins
   * @returns Array of plugins
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  /**
   * Get all hooks
   * @returns Array of hooks
   */
  getHooks(): PluginHooks[] {
    return [...this.hooks];
  }

  /**
   * Clear all plugins and hooks
   */
  clear(): void {
    this.plugins.length = 0;
    this.hooks.length = 0;
  }

  /**
   * Get plugin count
   * @returns Number of plugins
   */
  getPluginCount(): number {
    return this.plugins.length;
  }
}

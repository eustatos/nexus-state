/**
 * DevTools integration — optional, tree-shakeable
 *
 * Import from '@nexus-state/core/devtools' to include DevTools in your bundle.
 * Not included in the minimal core import.
 *
 * @example
 * ```typescript
 * import { createStore } from '@nexus-state/core';
 * import { devtools } from '@nexus-state/core/devtools';
 *
 * const store = createStore({ plugins: [devtools({ name: 'MyApp' })] });
 * ```
 *
 * @packageDocumentation
 */

export { devtools, DevToolsPlugin } from './plugins/devtools';
export type { DevToolsOptions } from './plugins/devtools';

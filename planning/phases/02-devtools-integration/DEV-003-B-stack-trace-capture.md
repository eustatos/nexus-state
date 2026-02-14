# DEV-003-B: Stack Trace Capture (Development Only)

## Objective

Implement stack trace capture for debugging with zero overhead in production. The `stack-tracer` module already exists; this task integrates it with the plugin, adds frame filtering/cleaning, and unifies configuration.

## Requirements

- Stack trace capture in development mode only
- Configurable stack trace depth (`traceLimit`, default 10)
- Stack trace filtering (remove noise: node_modules, library internals)
- Use existing [packages/devtools/src/utils/stack-tracer.ts](packages/devtools/src/utils/stack-tracer.ts) API; no throw/catch in plugin
- Source map support: preserve raw stack so browser/DevTools can resolve source maps (no runtime source-map parsing in this package)
- Zero production impact: capture only when `trace === true` and in development; stack-tracer returns null otherwise

## References

- [TASK-005: Action Naming and Stack Traces](planning/tasks/TASK-005-ACTION-NAMING-AND-STACK-TRACES.md)
- [docs/api/devtools-advanced.md](docs/api/devtools-advanced.md) (config: `trace`, `traceLimit`)

## Files to Modify

1. `packages/devtools/src/utils/stack-tracer.ts` — Add frame filtering and format helper
2. `packages/devtools/src/types.ts` — Add `traceLimit?: number` to DevToolsConfig
3. `packages/devtools/src/devtools-plugin.ts` — Use stack-tracer instead of throw/catch; pass traceLimit
4. `packages/devtools/src/__tests__/stack-tracer.test.ts` — Unit tests (capture, filter, production)
5. Plugin integration test — Assert plugin uses stack-tracer and respects trace/traceLimit
6. `docs/api/devtools-advanced.md` — Align config keys and defaults

## Implementation Steps

1. **Stack-tracer**: Add `filterStackTraceFrames(frames, options?)` to strip noise (e.g. node_modules, nexus-state internals). Add `formatStackTraceForDevTools(captured)` to produce a single string for `metadata.stackTrace`. Optional: allow custom filter in config.
2. **Config**: Add `traceLimit?: number` (default 10) to DevToolsConfig in types.ts. Plugin builds StackTraceConfig from `trace` + `traceLimit` + `NODE_ENV`.
3. **Plugin**: In `enhanceStoreWithMetadata`, when `this.config.trace` is true, call `captureStackTrace(this.config.traceLimit)` (or filtered variant); set `metadata.stackTrace` from formatted result. Remove throw/catch.
4. **Production**: Rely on stack-tracer returning null when `NODE_ENV !== "development"`; plugin only invokes when `config.trace === true`.
5. **Tests**: Unit tests for capture, filtering, production; integration test for plugin with trace true/false and traceLimit.

## Testing

- Stack trace capture: mock Error.stack, assert frame count and content
- Filtering: assert filter removes expected patterns (node_modules, etc.)
- Production: when NODE_ENV !== "development", captureStackTrace returns null
- Integration: plugin with trace: true and traceLimit — metadata includes stack; with trace: false or production — no stack

## Estimated: 1.5–2 hours

## Priority: Medium

## Status: In Progress

# Time-Travel Decision

**Date:** 2026-07-10  
**Decision:** REJECT — will not implement in core

## Rationale

1. **Separate package exists:** `@nexus-state/time-travel` provides time-travel functionality
2. **DevTools integration:** `devtools()` plugin provides time-travel via Redux DevTools Extension
3. **Low user demand:** No GitHub issues or discussions requesting time-travel
4. **Complexity:** Time-travel adds history management, memory overhead, and API surface
5. **Minimal core principle:** Core should be small and focused on state management

## Alternatives

Users who need time-travel can:

1. Use `@nexus-state/time-travel` package:
   ```typescript
   import { TimeTravelController } from '@nexus-state/time-travel';
   const controller = new TimeTravelController(store);
   controller.back();
   controller.forward();
   ```

2. Use `devtools()` plugin with Redux DevTools Extension:
   ```typescript
   import { devtools } from '@nexus-state/core/devtools';
   const store = createStore({ plugins: [devtools()] });
   // Use Redux DevTools UI for time-travel
   ```

3. Implement custom snapshot/restore:
   ```typescript
   const snapshot = store.getState();
   store.setState(snapshot);
   ```

## Future Considerations

If user demand increases, reconsider in a future phase with simplified design:
- `store.snapshot()` / `store.restore(snapshot)` only
- No `TimeTravelManager` class
- No `back()` / `forward()` / `historyLength` API
- Leave advanced features to `@nexus-state/time-travel` package

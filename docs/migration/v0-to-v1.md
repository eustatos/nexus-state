# Migrating from v0.x to v1.0

This guide helps you migrate your existing Nexus State code to v1.0.

## Overview

v1.0 introduces several improvements and breaking changes that provide better performance, improved DevTools integration, and enhanced Time Travel functionality.

## Automatic Migration

Run the migration script (if available):

```bash
npx @nexus-state/migrate
```

## Manual Migration Steps

### 1. Import Changes

```diff
- import { createStore, atom } from 'nexus-state';
+ import { createEnhancedStore, atom } from '@nexus-state/core';
```

### 2. Store Creation

```diff
- const store = createStore();
+ const store = createEnhancedStore([], {
+   enableTimeTravel: true,
+   enableDevTools: true
+ });
```

### 3. Atom Creation

```diff
- const counter = atom(0);
+ const counter = atom(0, 'counter'); // Add names for DevTools
```

### 4. Time Travel API

```diff
- // Old time travel API (if used)
- store.timeTravel.undo();
+ // New API
+ store.undo?.();
```

### 5. DevTools Integration

```diff
- // Old way
- import { devTools } from 'nexus-state';
- const store = createStore([devTools()]);

+ // New way
+ import { createEnhancedStore } from '@nexus-state/core';
+ import { devTools } from '@nexus-state/devtools';
+
+ const store = createEnhancedStore([devTools({
+   name: 'My App',
+   trace: true
+ })], {
+   enableDevTools: true
+ });
```

## Breaking Changes

### Removed APIs

- `store.timeTravel` property (use `store.undo()/redo()` directly)
- `atom.constructor` access (use `atomRegistry`)

### Changed Behavior

- Computed atoms now cache results more aggressively
- DevTools integration is now opt-in via configuration
- Time Travel is now opt-in via configuration
- All atoms must be created with the `atom()` function (no direct object creation)

### New Features

- Built-in Time Travel with undo/redo capabilities
- Improved DevTools integration with better performance
- Enhanced type safety with improved TypeScript definitions
- Better handling of async operations

## Migration Checklist

- [ ] Update imports from `nexus-state` to `@nexus-state/*`
- [ ] Replace `createStore` with `createEnhancedStore`
- [ ] Add names to all atoms for DevTools support
- [ ] Update Time Travel API calls
- [ ] Configure DevTools integration
- [ ] Enable Time Travel if needed
- [ ] Update any custom plugins
- [ ] Test all functionality
- [ ] Update documentation and examples

## Common Issues & Solutions

### Issue: "store.undo is not a function"

**Solution:** Enable time travel when creating store:

```typescript
const store = createEnhancedStore([], { enableTimeTravel: true });
```

### Issue: Atoms not showing in DevTools

**Solution:** Add names to atoms and enable DevTools:

```typescript
const counter = atom(0, "counter");
const store = createEnhancedStore([], { enableDevTools: true });
```

### Issue: Computed atom not updating

**Solution:** Ensure you're using the correct getter syntax:

```typescript
// Wrong
const double = atom((get) => count * 2);

// Correct
const double = atom((get) => get(count) * 2);
```

### Issue: Plugin compatibility

**Solution:** Some plugins may need updates for v1.0. Check plugin documentation for v1.0 compatibility.

## Breaking Changes Details

### Time Travel API Changes

The Time Travel API has been simplified and integrated directly into the store:

**Before:**
```typescript
const store = createStore();
const timeTravel = new TimeTravel(store);
timeTravel.undo();
```

**After:**
```typescript
const store = createEnhancedStore([], { enableTimeTravel: true });
store.undo();
```

### DevTools Integration

DevTools integration is now more flexible and performant:

**Before:**
```typescript
import { devTools } from 'nexus-state';
const store = createStore([devTools()]);
```

**After:**
```typescript
import { devTools } from '@nexus-state/devtools';
const store = createEnhancedStore([devTools({
  name: 'My App',
  trace: true
})], { enableDevTools: true });
```

### Performance Improvements

v1.0 includes several performance improvements:

- Reduced memory usage by 33%
- Faster store creation (14-30% faster)
- Optimized subscription updates
- Better bundle size with tree-shaking

## Need Help?

- [Join our Discord](https://discord.gg/nexus-state)
- [Open an issue](https://github.com/nexus-state/nexus-state/issues)
- [Check FAQs](../community/faq.md)
- [Browse Examples](../examples/index.md)

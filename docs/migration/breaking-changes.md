# Breaking Changes in v1.0

This document details all breaking changes introduced in Nexus State v1.0.

## API Changes

### Enhanced Store Requirement

**Before:** Basic store with optional enhancements
```typescript
const store = createStore();
```

**After:** Enhanced store with required opt-in features
```typescript
const store = createEnhancedStore([], {
  enableTimeTravel: true,     // Optional
  enableDevTools: true        // Optional
});
```

### Time Travel API

**Before:**
```typescript
const store = createStore();
store.timeTravel.undo(); // Separate timeTravel object
store.timeTravel.redo();
```

**After:**
```typescript
const store = createEnhancedStore([], { enableTimeTravel: true });
store.undo(); // Direct methods on store
store.redo();
```

### DevTools Plugin Configuration

**Before:**
```typescript
const devtools = devTools();
store.use(devtools);
```

**After:**
```typescript
const devtools = devTools({
  name: 'My App',
  trace: true,
  maxAge: 50
});
// Add to plugins array during store creation
const store = createEnhancedStore([devtools], { enableDevTools: true });
```

## Configuration Changes

### Store Options

New `createEnhancedStore` options:

- `enableDevTools` (boolean): Enable DevTools integration
- `devToolsName` (string): Custom name for DevTools
- `enableTimeTravel` (boolean): Enable Time Travel
- `maxHistory` (number): Maximum history size (default: 50)
- `autoCapture` (boolean): Auto-capture snapshots (default: true)
- `registryMode` (string): 'global' or 'isolated' (default: 'global')

## Behavioral Changes

### Atom Registration

All atoms are now automatically registered in the global atom registry. This enables better DevTools integration but changes how atoms are tracked.

### Computed Atom Caching

Computed atoms now cache results more aggressively for better performance. If you need to force re-computation, use the `invalidate()` method.

### Subscription Behavior

Subscriptions now batch updates for better performance. If you need immediate updates, use the `withImmediateUpdate` option.

## Migration Path

1. Replace `createStore` with `createEnhancedStore`
2. Add names to all atoms for DevTools support
3. Update Time Travel API calls
4. Configure DevTools integration properly
5. Test all functionality with the new API

## Deprecation Schedule

- **v0.x (current):** Full support with deprecation warnings
- **v1.0 (this release):** Enhanced store recommended, basic store still available but deprecated
- **v2.0 (future):** Enhanced store will be the only option

## Migration Tools

We provide automated migration tools to help with the transition:

```bash
# Install migration tool
npm install -D @nexus-state/migrate

# Run migration
npx @nexus-state/migrate
```

## Need More Help?

See our [Migration Guide](./v0-to-v1.md) for step-by-step instructions.

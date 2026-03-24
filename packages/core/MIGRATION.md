# Migration Guide: TC39 Signals

> **Status:** 📋 Planned for v2.0  
> **Current Version:** v1.x (Store-based)  
> **Target Version:** v2.0 (Signals backend)

---

## 🎯 Overview

This guide describes the migration path from the current Store-based reactivity to the upcoming [TC39 Signals](https://github.com/tc39/proposal-signals) standard.

**Timeline:**
- **v1.x (Current):** Store-based with Signal-Ready Architecture
- **v2.0 (Future):** Signals backend with backward-compatible API

---

## 📋 What's Changing?

### v1.x → v2.0 Breaking Changes

| Feature | v1.x (Current) | v2.0 (Signals) | Impact |
|---------|----------------|----------------|--------|
| **Reactive Backend** | Store-based | TC39 Signals | Internal only |
| **Public API** | `IReactiveValue` | `IReactiveValue` | ✅ No changes |
| **AtomContext** | Optional parameter | Optional parameter | ✅ No changes |
| **Performance** | Baseline | 30-50% faster | ✅ Improvement |
| **Bundle Size** | ~15KB | ~12KB | ✅ Smaller |

### Non-Breaking Changes

The following APIs remain **100% backward compatible**:

```typescript
// ✅ All these continue to work unchanged
store.get(atom)
store.set(atom, value)
store.set(atom, value, { silent: true })
store.subscribe(atom, callback)
reactive.getValue()
reactive.setValue(10)
reactive.setValue(10, { silent: true })
```

---

## 🚀 Migration Steps

### Step 1: Update to v1.x (Now)

Ensure you're using the latest v1.x version with Signal-Ready Architecture:

```bash
npm install @nexus-state/core@latest
```

**Verify Signal-Ready features:**

```typescript
import { atom, createStore } from '@nexus-state/core';
import { createReactiveValue } from '@nexus-state/core/reactive';

// ✅ IReactiveValue abstraction
const store = createStore();
const countAtom = atom(0, 'count');
const reactive = createReactiveValue(store, countAtom);

// ✅ AtomContext support
reactive.setValue(10, { 
  silent: true, 
  source: 'user-action',
  metadata: { userId: 123 }
});

// ✅ Feature flags
import { updateReactiveConfig } from '@nexus-state/core/reactive';
updateReactiveConfig({
  ENABLE_SIGNAL_BACKEND: false, // Currently uses Store
  FALLBACK_TO_STORE: true
});
```

### Step 2: Prepare for v2.0 (Q2 2026)

**Before upgrading to v2.0:**

1. **Use IReactiveValue abstraction** (not direct store access)
   ```typescript
   // ❌ Avoid direct store access in business logic
   store.get(atom);
   store.set(atom, value);
   
   // ✅ Use IReactiveValue
   reactive.getValue();
   reactive.setValue(value);
   ```

2. **Avoid internal APIs**
   ```typescript
   // ❌ Don't use internal classes
   new StoreBasedReactive(store, atom); // Will be removed
   
   // ✅ Use factory function
   createReactiveValue(store, atom); // Stable API
   ```

3. **Test with AtomContext**
   ```typescript
   // ✅ Start using context now
   store.set(atom, value, { silent: true });
   ```

### Step 3: Upgrade to v2.0 (When Available)

```bash
npm install @nexus-state/core@2
```

**Expected changes:**

```typescript
// v1.x code (continues to work)
const store = createStore();
const atom = atom(0);
store.set(atom, 10);

// v2.0 (same API, faster backend)
const store = createStore();
const atom = atom(0);
store.set(atom, 10); // Now uses Signals internally!
```

**Optional: Enable Signals explicitly**

```typescript
import { updateReactiveConfig } from '@nexus-state/core/reactive';

updateReactiveConfig({
  ENABLE_SIGNAL_BACKEND: true, // Enable Signals
  SIGNAL_BACKEND_PERCENTAGE: 100 // 100% of operations
});
```

---

## 📊 Performance Comparison

### Current (v1.x - Store-based)

| Operation | Ops/sec | Mean Time |
|-----------|---------|-----------|
| `get()` | 1,720 | 0.58ms |
| `set()` | 1.9 | 515ms |
| Computed (10 deps) | 1.3 | 751ms |

### Expected (v2.0 - Signals)

| Operation | Ops/sec | Mean Time | Improvement |
|-----------|---------|-----------|-------------|
| `get()` | ~2,900 | ~0.35ms | **40% faster** |
| `set()` | ~3.3 | ~300ms | **42% faster** |
| Computed (10 deps) | ~2.2 | ~450ms | **40% faster** |

---

## 🔧 Feature Flags

### Current Flags (v1.x)

```typescript
import { updateReactiveConfig } from '@nexus-state/core/reactive';

updateReactiveConfig({
  ENABLE_SIGNAL_BACKEND: false, // Use Store backend
  SIGNAL_BACKEND_PERCENTAGE: 0, // 0% Signals
  FALLBACK_TO_STORE: true,      // Fallback to Store if Signals unavailable
  LOG_BACKEND_SELECTION: true   // Log which backend is used
});
```

### Future Flags (v2.0)

```typescript
updateReactiveConfig({
  ENABLE_SIGNAL_BACKEND: true,  // Use Signals backend
  SIGNAL_BACKEND_PERCENTAGE: 100, // 100% Signals
  FALLBACK_TO_STORE: true,      // Fallback for compatibility
  LOG_BACKEND_SELECTION: false
});
```

---

## ⚠️ Breaking Changes (v2.0)

### Removed APIs

The following internal APIs will be removed:

```typescript
// ❌ Removed in v2.0
import { StoreBasedReactive } from '@nexus-state/core/reactive';
const reactive = new StoreBasedReactive(store, atom);

// ✅ Use instead
import { createReactiveValue } from '@nexus-state/core/reactive';
const reactive = createReactiveValue(store, atom);
```

### Changed Behavior

**Silent mode optimization:**

In v2.0, silent mode will be truly silent (no plugin hooks):

```typescript
// v1.x: onSet hooks are called even in silent mode
store.set(atom, value, { silent: true }); 
// → Plugin onSet hooks ARE called

// v2.0: silent mode skips all side effects
store.set(atom, value, { silent: true });
// → Plugin onSet hooks are NOT called
```

**Migration:** If you rely on plugin hooks in silent mode, use normal mode:

```typescript
// v2.0 workaround
store.set(atom, value, { 
  silent: false, // Normal mode
  metadata: { skipNotifications: true } // Custom flag for plugins
});
```

---

## 🧪 Testing Strategy

### Phase 1: Test with v1.x

```typescript
// Your existing tests (no changes needed)
describe('Counter', () => {
  it('should increment', () => {
    const store = createStore();
    const countAtom = atom(0);
    
    store.set(countAtom, 1);
    expect(store.get(countAtom)).toBe(1);
  });
});
```

### Phase 2: Test with Signals (v2.0 beta)

```typescript
// Enable Signals for testing
import { updateReactiveConfig } from '@nexus-state/core/reactive';

beforeAll(() => {
  updateReactiveConfig({
    ENABLE_SIGNAL_BACKEND: true,
    SIGNAL_BACKEND_PERCENTAGE: 100
  });
});

// Run existing tests - should all pass
```

### Phase 3: Performance Testing

```bash
# Run benchmarks with Store (v1.x baseline)
npx vitest bench __benchmarks__/store.bench.ts

# Run benchmarks with Signals (v2.0)
npx vitest bench __benchmarks__/store.bench.ts

# Compare results - expect 30-50% improvement
```

---

## 📚 API Reference

### AtomContext (v1.x → v2.0)

```typescript
interface AtomContext {
  /**
   * Suppress notifications/effects during update
   */
  silent?: boolean;
  
  /**
   * Indicates this is a time-travel operation
   */
  timeTravel?: boolean;
  
  /**
   * Source of the change (for debugging)
   */
  source?: string;
  
  /**
   * Additional custom metadata
   */
  metadata?: Record<string, unknown>;
}
```

### IReactiveValue (Stable API)

```typescript
interface IReactiveValue<T> {
  getValue(): T;
  setValue(value: T, context?: AtomContext): void;
  subscribe(fn: (value: T) => void): () => void;
}
```

### Factory Function (Stable API)

```typescript
function createReactiveValue<T>(
  store: Store,
  atom: Atom<T>
): IReactiveValue<T>;
```

---

## 🔗 Resources

- [TC39 Signals Proposal](https://github.com/tc39/proposal-signals)
- [SR-010 Benchmark Analysis](../../planning/phase-11-signal-ready-architecture/SR-010-benchmark-analysis.md)
- [SR-010 Documentation](../../planning/phase-11-signal-ready-architecture/SR-010-documentation.md)
- [IReactiveValue API Docs](./API.md#IReactiveValue)

---

## ❓ FAQ

### Q: When will v2.0 be released?

**A:** Expected Q2 2026, pending TC39 Signals standard finalization.

### Q: Do I need to rewrite my code?

**A:** No! The public API is 100% backward compatible. Only internal implementation changes.

### Q: Will v1.x be maintained?

**A:** Yes, v1.x will receive security updates for 12 months after v2.0 release.

### Q: Can I use Signals now?

**A:** No, Signals are still a Stage 3 proposal. v1.x uses Store-based reactivity.

### Q: What about bundle size?

**A:** v2.0 with Signals is expected to be ~20% smaller (~12KB vs ~15KB).

### Q: How do I migrate plugins?

**A:** Most plugins work unchanged. If your plugin uses internal APIs, update to use public APIs only.

---

**Last Updated:** 2026-03-24  
**Version:** 1.0 (Draft)

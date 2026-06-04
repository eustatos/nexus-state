# README-001: Core README Rewrite

**Status:** ✅ Completed
**Priority:** 🔴 Critical
**Estimated Time:** 3 hours
**Actual Time:** ~4 hours
**Package:** `@nexus-state/core`
**File:** `packages/core/README.md`

---

## 📋 Objective

Rewrite `packages/core/README.md` to:
1. **Fix all broken examples** (setState, async await misuse)
2. **Highlight unique value propositions** (isolated stores, time-travel per-scope)
3. **Reduce length** from 862 to ~500 lines
4. **Add explicit imports** in all examples
5. **Create clear package boundaries** (what's in core vs ecosystem)

---

## 🔴 Critical Issues to Fix

### Issue 1: Non-existent `setState()` method

**Location:** Lines 185, 408

```typescript
// ❌ BROKEN
const store = useMemo(() => createStore().setState(initialState), [initialState]);
```

**Fix Options:**

**Option A: Add `setState()` method** (Recommended)

```typescript
// StoreImpl.ts
setState(state: Record<string, unknown>): this {
  Object.entries(state).forEach(([key, value]) => {
    const atom = Array.from(this.states.keys())
      .find(a => atomRegistry.getName(a) === key);
    if (atom) this.set(atom, value);
  });
  return this; // Chainable
}
```

**Option B: Fix example without `setState()`**

```typescript
// ✅ WORKING
const store = useMemo(() => {
  const store = createStore();
  Object.entries(initialState).forEach(([atomName, value]) => {
    const atom = atomRegistry.get(atomName);
    if (atom) store.set(atom, value);
  });
  return store;
}, [initialState]);
```

**Decision:** Implement Option A (adds useful API)

---

### Issue 2: Misuse of `await` in SSR

**Location:** Lines 65-73, 177-181, 397-404

```typescript
// ❌ ANTI-PATTERN
store.set(userAtom, await fetchUser(context.params.id));
```

**Problems:**
- No loading/error states
- No caching
- No automatic hydration
- No refetch capabilities

**Fix:** Replace with `@nexus-state/query` teaser

```typescript
// ✅ RECOMMENDED
import { prefetchQuery } from '@nexus-state/query/react';

export async function getServerSideProps(context) {
  await prefetchQuery({
    queryKey: ['user', context.params.id],
    queryFn: () => fetchUser(context.params.id),
  });
  return { props: {} };
}

function Page() {
  const { data: user } = useSuspenseQuery(['user', id], fetchUser);
  return <div>{user.name}</div>;
}
```

**Note:** Keep one simple core-only example, but mark as "basic"

---

### Issue 3: Duplicate SSR Examples

**Location:** Lines 65-73, 177-181, 397-404 (3 times!)

**Fix:** Consolidate into ONE example in "SSR" section

---

## 📐 New Structure

```markdown
# @nexus-state/core

[Badges]
[One-liner value prop]
[Quick Navigation]

---

## 🎯 What Makes Nexus State Unique?

### 1. Framework-Agnostic + Fine-Grained Reactivity
[Problem/Solution format with code]

### 2. Isolated State + Time-Travel Per-Scope
[Problem/Solution format with code]

---

## 📦 Installation

```bash
npm install @nexus-state/core
```

**Optional integrations:**
```bash
npm install @nexus-state/react    # React hooks
npm install @nexus-state/query    # Data fetching (SSR, caching)
npm install @nexus-state/time-travel  # Undo/redo
```

---

## 🚀 Quick Start (60 seconds)

```typescript
import { atom, createStore } from '@nexus-state/core';

const countAtom = atom(0, 'count');
const store = createStore();

console.log(store.get(countAtom)); // 0
store.set(countAtom, 5);
console.log(store.get(countAtom)); // 5
```

---

## 🤔 When to Use Nexus State?

### ✅ Choose Nexus State if you need:

| Use Case | Why Nexus State? |
|----------|------------------|
| Multi-framework app | Share state logic between React, Vue, Svelte |
| SSR (Next.js, Nuxt) | Isolated stores per request, no Provider needed |
| Time-travel debugging | Independent timelines per component |
| Testing | Clean state per test, no mocks |

### ❌ Don't use Nexus State if:

| Use Case | Better Alternative |
|----------|-------------------|
| Simple React app | Jotai (simpler API) |
| Global state only | Zustand (lighter) |
| Redux ecosystem | Redux Toolkit (more plugins) |

---

## 📖 Core Concepts

### Atoms

[Primitive, computed, writable with imports]

### Stores

[createStore, get, set, subscribe with imports]

### Global Atom Registry

[atomRegistry usage with imports]

### Architecture: Atoms vs Stores

[**NEW** Explain key concept: atoms are descriptors, stores hold state]

---

## 🔌 Ecosystem Extensions

**Quick previews** (1-2 examples per package)

### @nexus-state/react

```typescript
import { useAtom } from '@nexus-state/react';

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

📖 **Full docs:** [README](../react/README.md)

---

### @nexus-state/query

```typescript
import { prefetchQuery, useQuery } from '@nexus-state/query/react';

// SSR
await prefetchQuery({ queryKey: 'user', queryFn: fetchUser });

// Client
const { data } = useQuery({ queryKey: 'user', queryFn: fetchUser });
```

📖 **Full docs:** [README](../query/README.md)

---

### @nexus-state/async

```typescript
import { asyncAtom } from '@nexus-state/async';

const [userAtom, fetchUser] = asyncAtom({
  fetchFn: async () => fetch('/api/user').then(r => r.json()),
  initialValue: null,
});
```

📖 **Full docs:** [README](../async/README.md)

---

### @nexus-state/time-travel

```typescript
import { TimeTravelController } from '@nexus-state/time-travel';

const controller = new TimeTravelController(store);
controller.capture('action');
controller.undo();
```

📖 **Full docs:** [README](../time-travel/README.md)

---

## ⚡ Performance

[Benchmarks table - keep current]

---

## 📚 API Reference

[Compact table with signatures]

---

## 🔧 Troubleshooting

[Top 5 issues with solutions]

---

## 📦 Full Ecosystem

| Package | Description |
|---------|-------------|
| [@nexus-state/react](../react/README.md) | React hooks |
| [@nexus-state/query](../query/README.md) | Data fetching & caching |
| ... | ... |

---

## 📄 License

MIT
```

---

## ✅ Acceptance Criteria

### Documentation Quality

- [ ] All examples have explicit imports
- [ ] `setState()` method implemented AND tested
- [ ] SSR examples use `@nexus-state/query` (not raw `await`)
- [ ] Length ≤500 lines
- [ ] Comparison table added (When to Use / When Not to Use)
- [ ] Ecosystem teasers added (react, query, async, time-travel)
- [ ] Clear "What's in core" vs "What's in ecosystem" boundaries
- [ ] Troubleshooting section updated (top 5 issues)
- [ ] **"Architecture: Atoms vs Stores" section added** (explains atoms are descriptors, stores hold state)

### Link Strategy (for npmjs.com compatibility)

- [ ] Links to other packages use **npmjs.com URLs** (not relative paths)
- [ ] Main repository link points to GitHub
- [ ] Documentation link points to external docs (if available)
- [ ] No Mermaid diagrams (not supported on npmjs.com)

**Example:**
```markdown
| Package | npm |
|---------|-----|
| [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) | [Install](https://www.npmjs.com/package/@nexus-state/react) |
```

### Example Testing (Hybrid Approach)

**Priority 1: Critical Examples (Required)**
- [ ] Quick Start example tested in `src/__tests__/readme-examples.test.ts`
- [ ] Unique features tested (isolated stores, time-travel per-scope)
- [ ] Core API patterns tested (atom, createStore, get, set, subscribe)
- [ ] **"Atoms vs Stores" concept tested** (one atom, multiple stores with different values)

**Priority 2: Secondary Examples (Recommended)**
- [ ] SSR examples have comments linking to related tests
- [ ] Ecosystem integration examples reference package tests

**Priority 3: Illustrative Examples (Optional)**
- [ ] Conceptual examples marked as "pattern demonstration"
- [ ] Comparison tables don't require tests

**Test File Structure:**
```typescript
// packages/core/src/__tests__/readme-examples.test.ts
describe('README: Quick Start', () => {
  it('basic example should work', () => {
    // Exact code from README
  });
});

describe('README: Isolated Stores', () => {
  it('SSR example should work', () => {
    // Exact code from README
  });
});

describe('README: Time-Travel', () => {
  it('per-scope timelines should work', () => {
    // Exact code from README
  });
});

describe('README: Architecture (Atoms vs Stores)', () => {
  it('one atom can have different values in different stores', () => {
    // Test key concept: atoms are descriptors, stores hold state
    const userAtom = atom({ name: 'Anonymous' }, 'user');
    
    const store1 = createStore();
    const store2 = createStore();
    
    // Same atom, different values
    store1.set(userAtom, { name: 'Alice' });
    store2.set(userAtom, { name: 'Bob' });
    
    expect(store1.get(userAtom)).toEqual({ name: 'Alice' });
    expect(store2.get(userAtom)).toEqual({ name: 'Bob' });
  });
  
  it('atom value is lazily initialized from atom.read() on first get', () => {
    // Test that store.get() initializes state from atom.read()
    const countAtom = atom(42, 'count');
    const store = createStore();
    
    // No store.set() needed - value comes from atom definition
    expect(store.get(countAtom)).toBe(42);
  });
});
```

### Links & References

- [ ] All links to other READMEs working
- [ ] npmjs.com links verified (open in new tab: `_target: blank`)
- [ ] GitHub repository links point to correct URLs

---

## 📝 Implementation Steps

### Step 1: Fix `setState()` issue (30 min)

**Decision:** Implement `setState()` method in `StoreImpl`

**Files to modify:**
- `packages/core/src/types.ts` - Add to Store interface
- `packages/core/src/store/StoreImpl.ts` - Implement method
- `packages/core/src/store.test.ts` - Add tests

### Step 2: Create README Examples Test File (30 min)

**Create:** `packages/core/src/__tests__/readme-examples.test.ts`

**Test structure:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { atom, createStore } from '../index';
import { atomRegistry } from '../atom-registry';

describe('README: Quick Start', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('basic example should work', () => {
    // Exact code from README Quick Start section
    const countAtom = atom(0, 'count');
    const store = createStore();

    expect(store.get(countAtom)).toBe(0);
    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(5);
  });
});

describe('README: Isolated Stores (SSR)', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('setState for hydration should work', () => {
    const store = createStore();
    const userAtom = atom(null, 'user');
    
    // Test setState() method
    store.setState({ user: { name: 'John' } });
    expect(store.get(userAtom)).toEqual({ name: 'John' });
  });
});

describe('README: Time-Travel Per-Scope', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('independent timelines should work', () => {
    // Note: This test verifies core API works
    // TimeTravelController tests are in time-travel package
    const storeA = createStore();
    const storeB = createStore();
    
    expect(storeA).toBeDefined();
    expect(storeB).toBeDefined();
    // Verify stores are independent
    expect(storeA).not.toBe(storeB);
  });
});
```

**Run tests:**
```bash
pnpm test --filter=@nexus-state/core -- readme-examples
```

### Step 3: Rewrite README sections (2h)

1. Hero section (one-liner, badges)
2. "What Makes Unique" (problem/solution)
3. Quick Start (60 seconds)
4. When to Use (comparison tables)
5. Core Concepts (with imports)
6. **Architecture: Atoms vs Stores** (NEW - key concept)
7. Ecosystem Extensions (teasers with npmjs.com links)
8. API Reference (compact)
9. Troubleshooting (top 5)

**Link Guidelines:**
- ✅ Use: `[@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react)`
- ❌ Avoid: `[@nexus-state/react](../react/README.md)` (doesn't work on npmjs.com)
- ✅ Use: `[Repository](https://github.com/eustatos/nexus-state)`
- ❌ No Mermaid diagrams (use ASCII or link to GitHub)

**"Architecture: Atoms vs Stores" Section Content:**

```markdown
### Architecture: Atoms vs Stores

**Key Concept:** Atoms are descriptors (keys), stores hold actual state.

```
┌─────────────────────────────────────────────────────────┐
│                   atomRegistry                          │
│  (Global registry for DevTools, NOT state storage)      │
│  Map<symbol, atom>                                      │
└─────────────────────────────────────────────────────────┘
                           ↑
                           │ register()
                           │
┌──────────────────────────┼──────────────────────────────┐
│                          │                               │
│  ┌────────────┐          │          ┌────────────┐      │
│  │  Store 1   │          │          │  Store 2   │      │
│  │ states:    │          │          │ states:    │      │
│  │ Map<Atom,  │◄─────────┴─────────►│ Map<Atom,  │      │
│  │ State>     │                     │ State>     │      │
│  │            │                     │            │      │
│  │ userAtom → │ {name:'Alice'}      │ userAtom → │ {name:'Bob'} │
│  └────────────┘                     └────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**What this means:**

1. **Atom is a descriptor** — defines initial value and name, but doesn't store state
2. **Store holds state** — each store has its own state for each atom
3. **One atom, many states** — the same atom can have different values in different stores
4. **Lazy initialization** — state is created on first `get()` or `set()`

```typescript
// Define atom ONCE (anywhere in your code)
const userAtom = atom({ name: 'Anonymous' }, 'user');

// Create multiple stores
const store1 = createStore();
const store2 = createStore();

// Each store has INDEPENDENT state for the same atom
store1.set(userAtom, { name: 'Alice' });
store2.set(userAtom, { name: 'Bob' });

// No interference between stores
console.log(store1.get(userAtom)); // { name: 'Alice' }
console.log(store2.get(userAtom)); // { name: 'Bob' }
```

**Why this matters:**

- ✅ **SSR:** Isolated state per request (no memory leaks)
- ✅ **Testing:** Clean state per test (no mocks needed)
- ✅ **Multi-tenancy:** Different users, different states, same atoms
```

### Step 4: Verify All Examples (30 min)

```bash
# Run README example tests
pnpm test --filter=@nexus-state/core -- readme-examples

# Run all core tests to ensure nothing broke
pnpm test --filter=@nexus-state/core

# Verify README compiles (no syntax errors in code blocks)
cat packages/core/README.md | grep -A 20 '```typescript'
```

### Step 5: Peer Review (15 min)

- Check clarity
- Verify imports
- Test copy-paste
- Verify npmjs.com links work
- Check on npmjs.com preview (publish alpha version)

---

## 📊 Metrics

| Metric | Before | Target | Actual | Status |
|--------|--------|--------|--------|--------|
| **Lines** | 862 | ≤500 | 559 (+61 for form packages) | ⚠️ |
| **Broken examples** | 2 | 0 | 0 | ✅ |
| **Examples with imports** | ~30% | 100% | 100% (15 imports) | ✅ |
| **SSR examples (correct)** | 0/3 | 1/1 | 1/1 | ✅ |
| **Ecosystem teasers** | 0 | 4+ | 13 packages (grouped) | ✅ |
| **README examples tested** | 0% | ≥10 | 10 tests | ✅ |
| **npmjs.com-compatible links** | ~50% | 100% | 100% (22 links) | ✅ |
| **Mermaid diagrams** | 0 | 0 | 0 | ✅ |
| **Total tests** | - | - | 1067 passed | ✅ |

---

## 🔗 Dependencies

- [x] README-002 (React/Vue/Svelte READMEs) - Can be parallel
- [x] README-003 (Query/Async READMEs) - Should be done first for accurate teasers
- [x] ECO-005 (setState implementation) - Required for fix
- [x] **DOCS-001 (Architecture Guide)** - Can be parallel, README references full doc

---

## 📝 Summary of Changes

### Implemented Features

1. **`setState()` method** - Set multiple atoms by name for SSR hydration
2. **`reset()` method** - Reset atom to default value from `atom.read()`
3. **`clear()` method** - Clear all atoms to their default values

### New Documentation

1. **"Architecture: Atoms vs Stores" section** - Explains that atoms are descriptors, stores hold state
2. **ASCII diagram** - Shows relationship between atomRegistry, Store 1, Store 2
3. **Comparison tables** - "When to Use" vs "When Not to Use"
4. **Troubleshooting section** - Top 5 issues with solutions
5. **Ecosystem teasers** - 13 packages grouped by category:
   - Core Packages (core, react, vue, svelte)
   - Data & State (query, async, persist)
   - Forms (form, form-builder-react, form-schema-zod, form-schema-yup)
   - DevTools & Debugging (time-travel, undo-redo, middleware)

### Testing

1. **Created `src/__tests__/readme-examples.test.ts`** - Tests for all critical README examples
2. **Added tests for new methods** - setState, reset, clear in `store.test.ts`
3. **All 1067 tests passing** - Including 10 new README example tests

### Link Strategy

- ✅ All cross-package links use npmjs.com URLs (22 total)
- ✅ Repository link points to GitHub
- ✅ Documentation link points to external docs
- ✅ No Mermaid diagrams (npmjs.com incompatible)

### Related Tasks Created

- **README-004:** Form Packages README Optimization (6 hours, 8 packages)
  - Target: Reduce from 4383 to ~2500 lines
  - Add npmjs.com-compatible links
  - Standardize structure across form packages

---

**Parent:** [Phase 10 README Excellence](./README.md)
**Next:** [README-002: React/Vue/Svelte READMEs](./README-002-react-vue-svelte.md)

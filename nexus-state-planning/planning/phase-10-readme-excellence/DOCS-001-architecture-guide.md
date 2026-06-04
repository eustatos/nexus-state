# DOCS-001: Architecture Guide - Atoms and Stores

**Status:** ⬜ Not Started
**Priority:** 🔴 High
**Estimated Time:** 2 hours
**Package:** `@nexus-state/core`
**File:** `docs/guide/architecture.md` (or `packages/core/docs/architecture.md`)

---

## 📋 Objective

Create a comprehensive architecture guide explaining the fundamental concept of Nexus State:

> **Atoms are descriptors (keys), stores hold actual state.**

This concept is critical for understanding:
- How isolated stores work
- Why SSR doesn't have memory leaks
- How testing works without mocks
- Multi-tenancy patterns

---

## 🎯 Target Audience

1. **New users** who don't understand why `store.set()` is needed after `atom()`
2. **Developers migrating from Jotai/Recoil** (where atoms hold state globally)
3. **SSR implementers** who need to understand per-request isolation
4. **Test writers** who need clean state per test

---

## 📐 Document Structure

```markdown
# Architecture: Atoms and Stores

## Key Concept

**Atoms are descriptors (keys), stores hold actual state.**

This is the fundamental difference between Nexus State and other state management libraries.

---

## Visual Model

[ASCII diagram showing atomRegistry, Store 1, Store 2 with independent states]

---

## Deep Dive

### What is an Atom?

An atom is a **descriptor** that defines:
- Initial value (via `read()` function)
- Optional name (for DevTools)
- Type (primitive, computed, writable)

**An atom does NOT store state.**

```typescript
const userAtom = atom({ name: 'Anonymous' }, 'user');
// userAtom = {
//   id: Symbol('atom'),
//   type: 'primitive',
//   name: 'user',
//   read: () => ({ name: 'Anonymous' })
// }
```

### What is a Store?

A store **holds state** for atoms in a `Map<Atom, AtomState>`.

```typescript
const store = createStore();
// store.stateManager.states = Map {} ← Empty until first get()/set()
```

### How They Work Together

1. **Lazy initialization:** State is created on first `get()` or `set()`
2. **Independent states:** Each store has its own state for each atom
3. **No interference:** Changing state in one store doesn't affect others

---

## Code Examples

### Example 1: Basic Usage

```typescript
const userAtom = atom({ name: 'Anonymous' }, 'user');
const store = createStore();

// No store.set() needed - value initialized from atom.read()
console.log(store.get(userAtom)); // { name: 'Anonymous' }

// store.set() is for OVERRIDING, not initializing
store.set(userAtom, { name: 'Alice' });
console.log(store.get(userAtom)); // { name: 'Alice' }
```

### Example 2: One Atom, Multiple Stores

```typescript
const userAtom = atom({ name: 'Anonymous' }, 'user');

const store1 = createStore();
const store2 = createStore();

// Each store has INDEPENDENT state
store1.set(userAtom, { name: 'Alice' });
store2.set(userAtom, { name: 'Bob' });

console.log(store1.get(userAtom)); // { name: 'Alice' }
console.log(store2.get(userAtom)); // { name: 'Bob' }
// No interference!
```

### Example 3: SSR Pattern

```typescript
// atoms.ts - defined ONCE
export const userAtom = atom(null, 'user');
export const postsAtom = atom([], 'posts');

// pages/[id].tsx - different values per request
export async function getServerSideProps(context) {
  const store = createStore(); // ← Isolated per request
  
  // Override defaults for THIS request
  store.set(userAtom, await fetchUser(context.params.id));
  store.set(postsAtom, await fetchPosts(context.params.id));
  
  return { props: { initialState: store.getState() } };
}
```

### Example 4: Testing Pattern

```typescript
describe('User feature', () => {
  it('should handle login', () => {
    const store = createStore(); // ← Fresh state per test
    store.set(userAtom, { id: 1 });
    // Test in isolation, no side effects
  });

  it('should handle logout', () => {
    const store = createStore(); // ← Another fresh state
    store.set(userAtom, { id: 1 });
    store.set(userAtom, null);
    // No interference from previous test
  });
});
```

---

## Comparison with Other Libraries

| Library | Atom stores state? | Global state? | Isolation |
|---------|-------------------|---------------|-----------|
| **Nexus State** | ❌ No | ❌ No | ✅ Per-store |
| Jotai | ✅ Yes | ✅ Yes | ❌ Global |
| Recoil | ✅ Yes | ✅ Yes | ❌ Global |
| Zustand | N/A | ✅ Yes | ✅ Per-store |
| Redux | N/A | ✅ Yes | ❌ Single store |

---

## Why This Matters

### ✅ SSR: No Memory Leaks

Each request gets a fresh store with isolated state. No global state to leak between users.

### ✅ Testing: No Mocks Needed

Create a fresh store per test. Clean state, no side effects.

### ✅ Multi-tenancy: Same Atoms, Different States

Different users/tenants can have different states using the same atoms.

### ✅ DevTools: Full Visibility

atomRegistry tracks all atoms for DevTools integration.

---

## Common Questions

### Q: Do I need to call `store.set()` after `atom()`?

**A:** No! The value is automatically initialized from `atom.read()` on first `get()`.

```typescript
const countAtom = atom(0, 'count');
const store = createStore();

console.log(store.get(countAtom)); // 0 ← Automatic!
```

### Q: Can I use the same atom in multiple stores?

**A:** Yes! That's the whole point. Each store has independent state.

### Q: How do I "reset" an atom to its default value?

**A:** Use `store.reset(atom)` (future API) or `store.set(atom, atom.read())`.

### Q: What is atomRegistry for?

**A:** DevTools and time-travel. NOT for state storage.

---

## See Also

- [Core API Reference](../api/core.md)
- [SSR Guide](./ssr.md)
- [Testing Guide](./testing.md)
- [DevTools Integration](./devtools.md)
```

---

## ✅ Acceptance Criteria

### Content Quality

- [ ] ASCII diagram included (no Mermaid - npmjs.com compatibility)
- [ ] At least 4 code examples (basic, multi-store, SSR, testing)
- [ ] Comparison table with other libraries
- [ ] FAQ section with common questions
- [ ] Clear explanation of lazy initialization

### Technical Accuracy

- [ ] Explains that atoms are descriptors, not state holders
- [ ] Explains that stores hold state in `Map<Atom, AtomState>`
- [ ] Explains that state is created on first `get()`/`set()`
- [ ] Explains that one atom can have many states (one per store)
- [ ] All code examples tested and working

### Documentation Standards

- [ ] All code examples have explicit imports
- [ ] Links to related docs working
- [ ] npmjs.com-compatible (no Mermaid, absolute URLs)
- [ ] TypeScript types shown where relevant

---

## 📝 Implementation Steps

### Step 1: Create Document (1h)

**Create:** `docs/guide/architecture.md` (or appropriate location)

**Content:**
- Key concept explanation
- ASCII diagram
- Code examples
- Comparison table
- FAQ section

### Step 2: Test All Examples (30 min)

```bash
# Create test file
cat > /tmp/test-architecture-examples.ts << 'EOF'
// Test all examples from the doc
import { atom, createStore } from '@nexus-state/core';

// Example 1: Basic usage
const userAtom = atom({ name: 'Anonymous' }, 'user');
const store = createStore();
console.assert(store.get(userAtom).name === 'Anonymous');

// Example 2: One atom, multiple stores
const store1 = createStore();
const store2 = createStore();
store1.set(userAtom, { name: 'Alice' });
store2.set(userAtom, { name: 'Bob' });
console.assert(store1.get(userAtom).name === 'Alice');
console.assert(store2.get(userAtom).name === 'Bob');

console.log('All examples passed!');
EOF

# Run test
npx ts-node /tmp/test-architecture-examples.ts
```

### Step 3: Add to Documentation Navigation (15 min)

**Update:** `docs/README.md` or `docs/.vitepress/config.ts`

```typescript
{
  text: 'Guide',
  items: [
    { text: 'Getting Started', link: '/guide/getting-started' },
    { text: 'Architecture', link: '/guide/architecture' }, // ← NEW
    { text: 'SSR', link: '/guide/ssr' },
    // ...
  ]
}
```

### Step 4: Link from Core README (15 min)

**Update:** `packages/core/README.md`

```markdown
## 📖 Core Concepts

### Architecture: Atoms vs Stores

Atoms are descriptors (keys), stores hold actual state.

**Full guide:** [Architecture Guide](../../docs/guide/architecture.md)

[Short example showing one atom, multiple stores]
```

---

## 📊 Metrics

| Metric | Target |
|--------|--------|
| **Document length** | 300-500 lines |
| **Code examples** | ≥4 |
| **FAQ questions** | ≥4 |
| **Examples tested** | 100% |
| **Diagrams** | 1+ (ASCII) |

---

## 🔗 Dependencies

- [ ] README-001 (Core README rewrite) - Can reference this doc
- [ ] None - This is standalone documentation

---

## 📌 Related Tasks

- **README-001:** Core README Rewrite (includes short version in README)
- **DOCS-002:** SSR Guide (will reference this architecture)
- **DOCS-003:** Testing Guide (will reference this architecture)

---

**Parent:** [Phase 10 README Excellence](./README.md)
**Next:** [DOCS-002: SSR Guide](./DOCS-002-ssr-guide.md) (if exists)

# README-004: Ecosystem Cross-Links

**Status:** ⬜ Not Started  
**Priority:** 🟢 Medium  
**Estimated Time:** 1 hour  
**Packages:** All `@nexus-state/*` packages

---

## 📋 Objective

Create consistent cross-linking strategy across all README files to:
1. **Guide users** through the ecosystem naturally
2. **Prevent confusion** about package boundaries
3. **Encourage exploration** of related packages
4. **Create unified documentation** experience

---

## 🔗 Cross-Link Strategy

### Link Placement Rules

| Location | Link Type | Format |
|----------|-----------|--------|
| **Top navigation** | Quick links | `[Core](../core/README.md)` |
| **Installation** | Related packages | `npm install @nexus-state/...` |
| **Examples** | Source package | `import { ... } from '@nexus-state/...'` |
| **Teaser sections** | Full docs CTA | `📖 Full docs: [README](../pkg/README.md)` |
| **Bottom navigation** | All ecosystem | Table with all packages |

---

## 📦 Package README Templates

### Core Package (`@nexus-state/core`)

```markdown
## 🔌 Ecosystem Extensions

| Package | Purpose | Example |
|---------|---------|---------|
| **@nexus-state/react** | React hooks | `useAtom(atom, store)` |
| **@nexus-state/query** | Data fetching (SSR, caching) | `useQuery({ queryKey, queryFn })` |
| **@nexus-state/async** | Simple async state | `asyncAtom({ fetchFn })` |
| **@nexus-state/time-travel** | Undo/redo debugging | `controller.undo()` |
| **@nexus-state/persist** | LocalStorage persistence | `persistAtom('key', value)` |
| **@nexus-state/form** | Form management | `createFormAtom(schema)` |
| **@nexus-state/middleware** | Plugin system | `store.applyPlugin(plugin)` |
| **@nexus-state/devtools** | Redux DevTools | `createEnhancedStore()` |
| **@nexus-state/immer** | Immutable updates | `produce(draft => ...)` |
| **@nexus-state/family** | Atom families | `atomFamily(param => atom())` |
| **@nexus-state/web-worker** | Web Worker support | `workerAtom({ fn })` |
| **@nexus-state/cli** | CLI tools | `nexus-state generate` |

📖 **Full ecosystem overview:** [Nexus State Packages](../../README.md)
```

---

### Framework Packages (React/Vue/Svelte)

```markdown
## 🔗 See Also

- **Core:** [@nexus-state/core](../core/README.md) — Atoms, stores, subscriptions
- **Data fetching:** [@nexus-state/query](../query/README.md) — SSR prefetch, caching
- **Async:** [@nexus-state/async](../async/README.md) — Simple loading states
- **Persistence:** [@nexus-state/persist](../persist/README.md) — LocalStorage
- **Forms:** [@nexus-state/form](../form/README.md) — Schema-based forms
- **DevTools:** [@nexus-state/devtools](../devtools/README.md) — Debugging
```

---

### Feature Packages (Query, Async, Form, Persist)

```markdown
## 🔗 See Also

- **Core:** [@nexus-state/core](../core/README.md) — Foundation
- **[Framework] integration:**
  - [@nexus-state/react](../react/README.md)
  - [@nexus-state/vue](../vue/README.md)
  - [@nexus-state/svelte](../svelte/README.md)
```

---

## 📋 Implementation Checklist

### Core README
- [ ] Add ecosystem table at bottom
- [ ] Add teaser examples with links (react, query, async, time-travel)
- [ ] Add "What's in core" vs "What's in ecosystem" section
- [ ] Link to main monorepo README

### Framework READMEs (React/Vue/Svelte)
- [ ] Add "See Also" section with 6+ links
- [ ] Link to core for atom/store concepts
- [ ] Link to query for data fetching
- [ ] Link to persist for persistence

### Feature READMEs (Query/Async/Form/Persist)
- [ ] Add "See Also" section
- [ ] Link to core for foundation
- [ ] Link to framework packages
- [ ] Link to related feature packages

### Utility READMEs (DevTools/Middleware/Immer/etc.)
- [ ] Add "See Also" section
- [ ] Link to core
- [ ] Link to at least one framework package

---

## 🎯 Navigation Patterns

### Pattern 1: Top Navigation

```markdown
# @nexus-state/query

> Data fetching with SSR prefetch, caching, and optimistic updates

[![npm](badge)]()

**Quick Navigation:**
- [Quick Start](#-quick-start)
- [Why Query?](#-why-nexus-state-query)
- [SSR Examples](#-ssr-patterns)
- [API Reference](#-api-reference)
- [Ecosystem](#-ecosystem)
```

### Pattern 2: Installation with Related

```markdown
## 📦 Installation

```bash
npm install @nexus-state/query
```

**For React:**
```bash
npm install @nexus-state/query @nexus-state/react
```

**For full data fetching:**
```bash
npm install @nexus-state/query @nexus-state/react @nexus-state/persist
```
```

### Pattern 3: Example Source Links

```markdown
### SSR Prefetch

```typescript
import { prefetchQuery } from '@nexus-state/query/react';
//              ^^^^^^^^^^^^ From: packages/query/react/prefetch.ts

export async function getServerSideProps() {
  await prefetchQuery({ queryKey: 'user', queryFn: fetchUser });
  return { props: {} };
}
```

📖 **Source:** [`prefetch.ts`](../src/react/prefetch.ts)
```

### Pattern 4: Bottom Ecosystem Table

```markdown
## 📦 Full Ecosystem

| Package | Version | Description |
|---------|---------|-------------|
| [@nexus-state/core](../core/README.md) | [![npm](badge)]() | Core library |
| [@nexus-state/react](../react/README.md) | [![npm](badge)]() | React hooks |
| [@nexus-state/query](../query/README.md) | [![npm](badge)]() | Data fetching |
| ... | ... | ... |

📖 **Overview:** [All Packages](../../README.md)
```

---

## 🧪 Testing Cross-Links

### Manual Testing

```bash
# Check all internal links work
find packages -name "README.md" -exec grep -o '\.\./[^)]*' {} \; | sort -u

# Verify each link
for link in $(find packages -name "README.md" -exec grep -o '\.\./[^)]*' {} \;); do
  if [ ! -f "packages/$link" ]; then
    echo "❌ Broken link: $link"
  fi
done
```

### Automated Testing (Future)

```yaml
# .github/workflows/check-links.yml
name: Check Links
on: [push, pull_request]
jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check README links
        run: |
          npm install -g markdown-link-check
          find packages -name "README.md" -exec markdown-link-check {} \;
```

---

## ✅ Acceptance Criteria

- [ ] All READMEs have "See Also" or "Ecosystem" section
- [ ] All internal links verified working
- [ ] Consistent link format across all packages
- [ ] At least 3 cross-links per README
- [ ] Main monorepo README linked from all packages
- [ ] Navigation tables use same format

---

## 📊 Metrics

| Metric | Target |
|--------|--------|
| **READMEs with ecosystem section** | 100% (15/15) |
| **Average cross-links per README** | ≥5 |
| **Broken internal links** | 0 |
| **Consistent format** | ≥90% |

---

## 🔗 Dependencies

- [ ] README-001 (Core README) - Must be done first
- [ ] README-002 (Framework READMEs) - Can be parallel
- [ ] README-003 (Query/Async READMEs) - Can be parallel

---

**Parent:** [Phase 10 README Excellence](./README.md)  
**Previous:** [README-003: Query/Async READMEs](./README-003-query-async.md)  
**Next:** [README-005: Real-World Examples](./README-005-examples-real-world.md)

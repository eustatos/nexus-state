# 🧠 Technical Specification: `nexus-state`

## 📋 Purpose

Develop a **modern, lightweight, framework-agnostic state manager** based on **atomic architecture**. The goal is to provide a simple yet powerful way to manage state in any JavaScript/TypeScript application.

---

## 🛠️ Technologies

- **Package manager**: `npm`
- **Build**: `Turborepo` (monorepo)
- **Language**: TypeScript (strict mode)
- **Compatibility**: ES2018\+ (for Proxy, async/await support, etc.)
- **Build formats**: ESM / CJS / UMD (bundled in `/dist`)
- **Linting/formatting**: ESLint \+ Prettier
- **Testing**: Vitest \+ Testing Library (if applicable)

---

## 🏗️ Repository Structure

```
nexus-state/
├── apps/
│   ├── demo-react/         # React integration example
│   ├── demo-vue/           # Vue integration example
│   └── demo-vanilla/       # Framework-agnostic usage example
├── packages/
│   ├── core/               # Core: atom, createStore, subscribe
│   ├── react/              # useAtom, useStore
│   ├── vue/                # composables (useAtom, useStore)
│   ├── svelte/             # svelte-store adapter
│   ├── persist/            # Save to localStorage/sessionStorage
│   ├── devtools/           # Redux DevTools integration
│   └── middleware/         # Middleware API
├── docs/                   # Documentation (VitePress)
├── scripts/                # Build, deploy, and other scripts
├── turbo.json              # Turborepo configuration
├── package.json            # Root package.json
└── tsconfig.json           # Shared tsconfig
```

---

## 🧱 Core (`packages/core`)

### Main Functions:

1. **`atom(initialValue)`** — creates an atom with initial value.
2. **`atom(getterFn)`** — creates a computed atom.
3. **`createStore()`** — creates a store instance.
4. **`store.get(atom)`** — gets the value of an atom.
5. **`store.set(atom, updater)`** — sets a new value.
6. **`store.subscribe(atom, callback)`** — subscribes to changes.
7. **`unsubscribe()`** — unsubscribes from changes.

### Example API:

```ts
import { atom, createStore } from '@nexus-state/core';

const countAtom = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2);

const store = createStore();

console.log(store.get(countAtom)); // → 0
store.set(countAtom, 5);
console.log(store.get(doubleAtom)); // → 10
```

---

## 🧩 Adapters

### `packages/react`

- **`useAtom(atom)`** — React hook to subscribe to an atom.
- Supports SSR.
- Optimization via `useSyncExternalStore`.

### `packages/vue`

- **`useAtom(atom)`** — Composable.
- Returns `ref` or `computed`.

### `packages/svelte`

- Returns a Svelte-compatible `readable` or `writable` store.

---

## 🔌 Plugins

### `packages/persist`

- `persist(options)`
- Supports `localStorage`, `sessionStorage`, `custom storage`.
- Optional serialization/deserialization.

### `packages/devtools`

- Integration with Redux DevTools.
- Change logging.

### `packages/middleware`

- Support for middleware functions before/after `set`.

---

## 🧪 Testing

- Unit tests for each package (Vitest).
- Usage examples in `apps/demo-*`.
- Tree-shaking verification.

---

## 🧰 Scripts

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:serve": "vitepress serve docs"
  }
}
```

---

## 🧩 Publishing

- Use **scoped packages**: `@nexus-state/core`, `@nexus-state/react`, `@nexus-state/persist`, etc.
- Automatic publishing via GitHub Actions.
- Support for `npm version` and semantic versioning.

---

## 🧾 Documentation

- **VitePress**.
- Guides:
  - Installation
  - Basics: `atom`, `createStore`
  - Adapters
  - Plugins
  - Integration examples
- API Reference.

---

## 🧩 MVP Features (v0.1.0)

- [ ] `atom(initialValue)` and `atom(getter)`

- [ ] `createStore`, `get`, `set`, `subscribe`

- [ ] React adapter (`useAtom`)

- [ ] Simple `persist` (localStorage)

- [ ] TypeScript types “out of the box”

- [ ] Examples in `apps/`

- [ ] Documentation (basics)

---

## 🎯 USP

> **“The atomic state manager that scales from zero to everything.”**\
> Lightweight yet extensible state manager suitable for both small and large applications.

---
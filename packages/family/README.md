# @nexus-state/family

> Utilities for working with state "families" in Nexus State — dynamic atom collections
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/family)](https://www.npmjs.com/package/@nexus-state/family)
> [![Coverage for family package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=family)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/family
```

**Required:**
```bash
npm install @nexus-state/core
```

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Related:**
  - [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) — Data fetching with caching
  - [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async) — Simple async state

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## Description

`@nexus-state/family` provides utilities for creating and managing dynamic collections of related atoms using **atom families**. It allows you to generate individual atoms based on runtime parameters (e.g., IDs), enabling efficient management of lists, entities, and other dynamic state structures.

### What is `atomFamily`?

`atomFamily` is a pattern for dynamically generating atoms based on parameters. Instead of creating many static atoms (like `user1Atom`, `user2Atom`, etc.), you can create a single factory function that generates atoms as needed.

For example:

```js
const userFamily = atomFamily((userId) => atom({ id: userId, name: "" }));
>
> [![Coverage for family package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=family)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
const user1Atom = userFamily(1); // Creates an atom for user ID 1
const user2Atom = userFamily(2); // Creates an atom for user ID 2
```

Each generated atom is independent, allowing for isolated state management per entity.

### Benefits

- **Dynamic Atom Creation**: Generate atoms on demand based on parameters (e.g., IDs).
- **State Isolation**: Each atom maintains its own state without interfering with others.
- **Efficient Caching**: Reuses atoms for the same parameters.
- **Scalability**: Ideal for managing lists, profiles, caches, and UI elements with individual state.

### Common Use Cases

- Managing lists of entities (e.g., todos, users, posts).
- Per-ID caching strategies.
- UI components with independent states (e.g., collapsible panels, forms).

## Installation

```bash
npm install @nexus-state/family
```

## Usage Example

```js
import { atom } from "@nexus-state/core";
import { atomFamily } from "@nexus-state/family";

// Create an atom family for managing todos
const todoFamily = atomFamily((id) =>
  atom({
    id,
    text: "",
    completed: false,
    createdAt: new Date(),
  }),
);

// Create atoms dynamically
const todo1Atom = todoFamily(1);
const todo2Atom = todoFamily(2);

// Use atoms in your store
store.set(todo1Atom, { id: 1, text: "Buy milk", completed: false });
const todo1 = store.get(todo1Atom);
```

## API

### `atomFamily(createAtom)`

Creates an atom family function.

#### Arguments

- `createAtom`: `(param: any) => Atom<T>` — A function that creates an atom based on the provided parameter.

#### Returns

- `(param: any) => Atom<T>` — A function that returns an atom for a given parameter.

#### Example

```js
const userFamily = atomFamily((userId) => atom({ id: userId, name: "" }));
const userAtom = userFamily("user123");
```

## License

MIT

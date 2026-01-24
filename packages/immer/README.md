# @nexus-state/immer

Immer integration with Nexus State

## Description

The `@nexus-state/immer` package provides utilities for integrating Immer with Nexus State, enabling **immutable state updates with mutable syntax**. It simplifies working with deeply nested objects and arrays by allowing you to write code as if you were mutating data directly, while ensuring that new object references are created safely.

### What is Immer?

Immer allows you to write mutating code that produces immutable updates under the hood. Instead of manually creating new objects using spread operators (`{...prevState, field: newValue}`), you can write code like:

```js
draft.profile.name = "Jane";
draft.posts[0].tags.push("new-tag");
```

And Immer will handle creating new objects immutably.

### Key Features

- **Immer Integration**: Provides `immerAtom` and `setImmer` functions for seamless usage with Nexus State.
- **Simplified Immutability**: Write mutable-style code that produces immutable updates.
- **Deep Nesting Support**: Easy updates to deeply nested state structures.
- **Performance**: Efficient object copying via Proxies and structural sharing.
- **Type-Safe**: Full TypeScript support with proper typing.

## Installation

```bash
npm install @nexus-state/immer
```

## Usage Example

```js
import { createStore } from "@nexus-state/core";
import { immerAtom, setImmer } from "@nexus-state/immer";

// Create a store instance
const store = createStore();

// Create an atom with Immer support
const userAtom = immerAtom(
  {
    profile: {
      name: "John",
      contacts: { email: "john@example.com" },
    },
    posts: [{ id: 1, title: "Hello World" }],
  },
  store,
);

// Update state using Immer-style draft mutations
setImmer(userAtom, (draft) => {
  draft.profile.name = "Jane";
  draft.profile.contacts.email = "jane@example.com";
  draft.posts.push({ id: 2, title: "Second Post" });
});
```

## API

### `immerAtom<T>(initialValue, store)`

Creates an atom that integrates with Immer for immutable updates.

- `initialValue`: The initial state value for the atom
- `store`: The Nexus State store instance to bind the atom to
- Returns: `Atom<T>` — an atom bound to the store

### `setImmer<T>(atom, updater)`

Updates an atom's value using an Immer-style draft function.

- `atom`: The atom to update
- `updater`: A function that receives a draft of the current value and mutates it
- No return value

## Benefits

- **Mutable Syntax, Immutable Results**: Write intuitive code that behaves immutably.
- **No Manual Spreading**: Avoid verbose `{...state, ...newData}` patterns.
- **Nested Updates Made Easy**: Update deeply nested properties without boilerplate.
- **Performance**: Efficient updates with structural sharing.

## License

MIT

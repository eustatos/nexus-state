# Family API

## atom.family(createAtom)

Creates a family of atoms with parameters.

```javascript
import { atom } from '@nexus-state/family';

const userAtomFamily = atom.family((id: string) => 
  atom(async () => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  })
);

const userAtom = userAtomFamily('123');
```

### Usage

```javascript
import { createStore } from '@nexus-state/core';
import { atom } from '@nexus-state/family';

const todoAtomFamily = atom.family((id: string) => 
  atom({
    id,
    text: '',
    completed: false
  })
);

const store = createStore();

// Create atoms for specific parameters
const todo1 = todoAtomFamily('1');
const todo2 = todoAtomFamily('2');

// Each atom is independent
store.set(todo1, { id: '1', text: 'Learn nexus-state', completed: true });
store.set(todo2, { id: '2', text: 'Build an app', completed: false });
```
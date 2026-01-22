# Plugins API

## persist

Persists atom values to storage.

```javascript
import { persist, localStorageStorage } from '@nexus-state/persist';

const store = createStore([
  persist(countAtom, { 
    key: 'count', 
    storage: localStorageStorage 
  })
]);
```

## devTools

Integrates with Redux DevTools.

```javascript
import { devTools } from '@nexus-state/devtools';

const store = createStore([
  devTools({ name: 'My App' })
]);
```

## middleware

Adds middleware to atoms.

```javascript
import { middleware } from '@nexus-state/middleware';

const store = createStore([
  middleware(countAtom, {
    beforeSet: (atom, value) => {
      console.log('Before set:', value);
      return value;
    },
    afterSet: (atom, value) => {
      console.log('After set:', value);
    }
  })
]);
```
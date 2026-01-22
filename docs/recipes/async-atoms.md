# Async Atoms

Handling asynchronous data with Nexus State.

## Basic Async Pattern

```javascript
import { atom, createStore } from '@nexus-state/core';

const fetchData = async () => {
  const response = await fetch('/api/data');
  return response.json();
};

const dataAtom = atom(null);
const loadingAtom = atom(false);
const errorAtom = atom(null);

const store = createStore();

const loadData = async () => {
  store.set(loadingAtom, true);
  store.set(errorAtom, null);
  
  try {
    const data = await fetchData();
    store.set(dataAtom, data);
  } catch (error) {
    store.set(errorAtom, error.message);
  } finally {
    store.set(loadingAtom, false);
  }
};
```

## React Implementation

```jsx
import { useAtom } from '@nexus-state/react';

function DataComponent() {
  const [data] = useAtom(dataAtom);
  const [loading] = useAtom(loadingAtom);
  const [error] = useAtom(errorAtom);
  
  useEffect(() => {
    loadData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```
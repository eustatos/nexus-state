# React API

## useAtom(atom, store)

Hook to use an atom in a React component.

```javascript
import { useAtom } from '@nexus-state/react';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```
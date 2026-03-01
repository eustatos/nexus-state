# Vue API

## useAtom(atom, store)

Composable to use an atom in a Vue component.

```javascript
import { useAtom } from '@nexus-state/vue';

export default {
  setup() {
    const count = useAtom(countAtom);
    
    return { count };
  }
};
```
# Svelte API

## useAtom(atom, store)

Function to use an atom in a Svelte component.

```javascript
import { useAtom } from '@nexus-state/svelte';

let count = useAtom(countAtom);
```
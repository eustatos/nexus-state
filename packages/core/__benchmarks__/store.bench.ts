/**
 * Performance benchmarks for @nexus-state/core
 *
 * Run with: npm run bench
 */

import { describe, bench, expect } from 'vitest';
import { atom, createStore, batch } from '../src/index';

describe('Store Performance', () => {
  bench('create 1000 primitive atoms', () => {
    for (let i = 0; i < 1000; i++) {
      atom(i);
    }
  });

  bench('get primitive atom - 10000 iterations', () => {
    const store = createStore();
    const a = atom(0);

    for (let i = 0; i < 10000; i++) {
      store.get(a);
    }
  });

  bench('set primitive atom - 10000 iterations', () => {
    const store = createStore();
    const a = atom(0);

    for (let i = 0; i < 10000; i++) {
      store.set(a, i);
    }
  });

  bench('computed atom with 1 dependency', () => {
    const store = createStore();
    const a = atom(0);
    const b = atom((get) => get(a) * 2);

    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
      store.get(b);
    }
  });

  bench('computed atom with 5 dependencies', () => {
    const store = createStore();
    const atoms = Array.from({ length: 5 }, (_, i) => atom(i));
    const computed = atom((get) =>
      atoms.reduce((sum, a) => sum + get(a), 0)
    );

    for (let i = 0; i < 1000; i++) {
      atoms.forEach((a) => store.set(a, i));
      store.get(computed);
    }
  });

  bench('computed atom with 10 dependencies', () => {
    const store = createStore();
    const atoms = Array.from({ length: 10 }, (_, i) => atom(i));
    const computed = atom((get) =>
      atoms.reduce((sum, a) => sum + get(a), 0)
    );

    for (let i = 0; i < 1000; i++) {
      atoms.forEach((a) => store.set(a, i));
      store.get(computed);
    }
  });

  bench('subscribe and update - 1000 iterations', () => {
    const store = createStore();
    const a = atom(0);
    let count = 0;

    store.subscribe(a, () => {
      count++;
    });

    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
    }
  });

  bench('1000 subscribers, single update', () => {
    const store = createStore();
    const a = atom(0);

    for (let i = 0; i < 1000; i++) {
      store.subscribe(a, () => {});
    }

    store.set(a, 1);
  });

  bench('100 subscribers, 100 updates', () => {
    const store = createStore();
    const a = atom(0);

    for (let i = 0; i < 100; i++) {
      store.subscribe(a, () => {});
    }

    for (let i = 0; i < 100; i++) {
      store.set(a, i);
    }
  });

  bench('nested computed atoms (chain of 5)', () => {
    const store = createStore();
    const a = atom(0);
    const b = atom((get) => get(a) + 1);
    const c = atom((get) => get(b) + 1);
    const d = atom((get) => get(c) + 1);
    const e = atom((get) => get(d) + 1);

    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
      store.get(e);
    }
  });

  bench('nested computed atoms (chain of 10)', () => {
    const store = createStore();
    const a = atom(0);
    const b = atom((get) => get(a) + 1);
    const c = atom((get) => get(b) + 1);
    const d = atom((get) => get(c) + 1);
    const e = atom((get) => get(d) + 1);
    const f = atom((get) => get(e) + 1);
    const g = atom((get) => get(f) + 1);
    const h = atom((get) => get(g) + 1);
    const i = atom((get) => get(h) + 1);
    const j = atom((get) => get(i) + 1);

    for (let k = 0; k < 1000; k++) {
      store.set(a, k);
      store.get(j);
    }
  });

  bench('diamond dependency pattern', () => {
    const store = createStore();
    const a = atom(0);
    const b = atom((get) => get(a) * 2);
    const c = atom((get) => get(a) * 3);
    const d = atom((get) => get(b) + get(c));

    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
      store.get(d);
    }
  });

  bench('complex dependency graph', () => {
    const store = createStore();
    const a = atom(0);
    const b = atom(0);
    const c = atom((get) => get(a) + get(b));
    const d = atom((get) => get(a) * 2);
    const e = atom((get) => get(b) * 2);
    const f = atom((get) => get(c) + get(d) + get(e));

    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
      store.set(b, i * 2);
      store.get(f);
    }
  });
});

describe('Batching Performance', () => {
  bench('batch: 100 sets, single notification', () => {
    const store = createStore();
    const atoms = Array.from({ length: 100 }, (_, i) => atom(i));
    const subscribers = Array.from({ length: 10 }, () => {
      const counts: Record<string, number> = {};
      return {
        counts,
        callback: (_value: number, name: string) => {
          counts[name] = (counts[name] || 0) + 1;
        },
      };
    });

    atoms.forEach((a, i) => {
      subscribers.forEach((sub) => {
        store.subscribe(a, (v) => sub.callback(v, `atom-${i}`));
      });
    });

    batch(() => {
      atoms.forEach((a, i) => {
        store.set(a, i * 2);
      });
    });
  });

  bench('no batch: 100 sets, multiple notifications', () => {
    const store = createStore();
    const atoms = Array.from({ length: 100 }, (_, i) => atom(i));
    const subscribers = Array.from({ length: 10 }, () => {
      const counts: Record<string, number> = {};
      return {
        counts,
        callback: (_value: number, name: string) => {
          counts[name] = (counts[name] || 0) + 1;
        },
      };
    });

    atoms.forEach((a, i) => {
      subscribers.forEach((sub) => {
        store.subscribe(a, (v) => sub.callback(v, `atom-${i}`));
      });
    });

    // No batching - each set triggers immediately
    atoms.forEach((a, i) => {
      store.set(a, i * 2);
    });
  });

  bench('batch with computed atoms', () => {
    const store = createStore();
    const a = atom(0);
    const b = atom(0);
    const c = atom((get) => get(a) + get(b));

    let notifyCount = 0;
    store.subscribe(c, () => {
      notifyCount++;
    });

    batch(() => {
      store.set(a, 1);
      store.set(b, 2);
    });
  });

  bench('nested batch calls', () => {
    const store = createStore();
    const atoms = Array.from({ length: 50 }, (_, i) => atom(i));

    batch(() => {
      atoms.slice(0, 25).forEach((a, i) => {
        store.set(a, i);
      });

      batch(() => {
        atoms.slice(25, 50).forEach((a, i) => {
          store.set(a, i + 25);
        });
      });
    });
  });
});

describe('Memory Performance', () => {
  bench('create and cleanup 1000 atoms', () => {
    const store = createStore();

    for (let i = 0; i < 1000; i++) {
      const a = atom(i);
      store.get(a);
      // Let GC collect
    }
  });

  bench('subscribe and unsubscribe 1000 times', () => {
    const store = createStore();
    const a = atom(0);

    for (let i = 0; i < 1000; i++) {
      const unsubscribe = store.subscribe(a, () => {});
      unsubscribe();
    }
  });

  bench('dynamic atoms with subscriptions', () => {
    const store = createStore();
    const atoms = Array.from({ length: 100 }, (_, i) => atom(i));

    // Subscribe to all atoms
    atoms.forEach((a) => {
      store.subscribe(a, () => {});
    });

    // Update all atoms
    atoms.forEach((a, i) => {
      store.set(a, i * 2);
    });
  });
});

describe('Writable Atom Performance', () => {
  bench('writable atom with custom write', () => {
    const store = createStore();
    const a = atom(
      () => 0,
      (get, set, update: number | ((prev: number) => number)) => {
        const newValue = typeof update === 'function' ? update(get(a)) : update;
        set(a, newValue * 2); // Double the value
      }
    );

    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
    }
  });

  bench('writable atom with multiple operations', () => {
    const store = createStore();
    const counter = atom(
      () => 0,
      (get, set, action: 'inc' | 'dec' | 'reset') => {
        switch (action) {
          case 'inc':
            set(counter, get(counter) + 1);
            break;
          case 'dec':
            set(counter, get(counter) - 1);
            break;
          case 'reset':
            set(counter, 0);
            break;
        }
      }
    );

    for (let i = 0; i < 1000; i++) {
      store.set(counter, 'inc' as any);
      store.set(counter, 'dec' as any);
      if (i % 100 === 0) {
        store.set(counter, 'reset' as any);
      }
    }
  });
});

describe('Edge Cases', () => {
  bench('rapid set/get cycles', () => {
    const store = createStore();
    const a = atom(0);

    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
      store.get(a);
    }
  });

  bench('concurrent subscriptions to same atom', () => {
    const store = createStore();
    const a = atom(0);

    // Create 100 concurrent subscriptions
    const unsubscribers = Array.from({ length: 100 }, () =>
      store.subscribe(a, () => {})
    );

    // Update atom
    store.set(a, 1);

    // Cleanup
    unsubscribers.forEach((unsub) => unsub());
  });

  bench('atom with function update', () => {
    const store = createStore();
    const a = atom(0);

    for (let i = 0; i < 1000; i++) {
      store.set(a, (prev) => prev + 1);
    }
  });
});

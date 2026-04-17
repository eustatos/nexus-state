# @nexus-state/web-worker

> Nexus State integration with Web Workers — offload heavy computations
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/web-worker)](https://www.npmjs.com/package/@nexus-state/web-worker)
> [![Coverage for web-worker package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=web-worker)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/web-worker
```

**Required:**
```bash
npm install @nexus-state/core
```

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Related:**
  - [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async) — Simple async state
  - [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) — Data fetching with caching

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## Description

The `@nexus-state/web-worker` package provides tools for working with Nexus State in Web Workers.

## Installation

```bash
npm install @nexus-state/web-worker
```

## Key Features

- Offload heavy computations to Web Workers
- Automatic sync of worker state to main thread stores
- Zero-config store tracking with `createWorkerStore()`

## Quick Start

### Main Thread

```javascript
import { workerAtom, createWorkerStore, ensureWorkerTracking } from '@nexus-state/web-worker';

// Create a Web Worker
const worker = new Worker('./my-worker.js');

// Create a worker-managed atom
const [counterAtom, setCounter] = workerAtom({
  worker,
  initialValue: 0,
});

// Create a store that tracks worker atoms
const store = createWorkerStore();

// Or use ensureWorkerTracking with an existing store
// import { createStore } from '@nexus-state/core';
// const store = createStore();
// ensureWorkerTracking(store);

// Subscribe to worker atom changes
store.subscribe(counterAtom, (value) => {
  console.log('Counter updated:', value);
});

// Get current value
console.log(store.get(counterAtom)); // 0
```

### Web Worker (my-worker.js)

```javascript
// In the worker, handle messages from main thread
self.onmessage = (event) => {
  const { type, value } = event.data;

  switch (type) {
    case 'INCREMENT':
      const newValue = value + 1;
      // Send updated value back to main thread
      self.postMessage({ type: 'UPDATE', value: newValue });
      break;

    case 'HEAVY_CALCULATION':
      const result = performHeavyCalculation(value);
      self.postMessage({ type: 'UPDATE', value: result });
      break;
  }
};
```

### Communication Pattern

```javascript
// Main thread: send message to worker
worker.postMessage({ type: 'INCREMENT', value: store.get(counterAtom) });

// The worker processes and sends back UPDATE
// Main thread automatically syncs via workerAtom tracking
```

## License

MIT
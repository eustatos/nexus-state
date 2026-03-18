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

- Moving state logic to Web Workers
- Asynchronous processing of heavy operations
- Communication between main thread and Web Worker

## Usage Example

```javascript
import { createWorkerStore } from '@nexus-state/web-worker';

const workerStore = createWorkerStore({
  calculations: []
});

// Performing heavy computations in Web Worker
workerStore.dispatch({
  type: 'CALCULATE',
  payload: largeDataSet
});

// Subscribing to results
workerStore.subscribe((state) => {
>
> [![Coverage for web-worker package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=web-worker)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
  console.log('Calculation results:', state.calculations);
});
```

## License

MIT
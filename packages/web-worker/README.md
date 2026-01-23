# @nexus-state/web-worker

Nexus State integration with Web Workers

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
  console.log('Calculation results:', state.calculations);
});
```

## License

MIT
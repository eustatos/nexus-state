# @nexus-state/web-worker

[![npm version](https://img.shields.io/npm/v/@nexus-state/web-worker.svg)](https://www.npmjs.com/package/@nexus-state/web-worker)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/web-worker)](https://bundlephobia.com/package/@nexus-state/web-worker)
[![License](https://img.shields.io/npm/l/@nexus-state/web-worker.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 🧵 Offload heavy computations to Web Workers: don't block UI, process data in background

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Why It's Cool

- 🚀 **Non-blocking UI** — computations in separate thread
- ⚡ **Auto Serialization** — data transferred transparently
- 🔄 **Two-way Communication** — main thread ↔ worker
- 🛠 **TypeScript** — message typing
- 📦 **Easy Integration** — works with existing atoms
- 🔥 **Hot Reload** — works with Vite/Webpack

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/web-worker
```

---

## 🚀 Quick Start

### Basic Usage

```javascript
// main.js
import { atom, createStore } from '@nexus-state/core'
import { createWorkerStore } from '@nexus-state/web-worker'

const store = createStore()

// Create worker
const workerStore = createWorkerStore(
  new Worker('./worker.js', { type: 'module' }),
  {
    initialState: {
      result: null,
      isComputing: false
    }
  }
)

// Send data for processing
workerStore.dispatch({
  type: 'COMPUTE',
  payload: largeDataSet
})

// Subscribe to results
const resultAtom = atom(null, 'workerResult')
workerStore.subscribe(resultAtom, (result) => {
  console.log('Result from worker:', result)
})
```

```javascript
// worker.js
import { createWorkerHandler } from '@nexus-state/web-worker'

const handler = createWorkerHandler({
  COMPUTE: async (data) => {
    // Heavy computation
    const result = heavyComputation(data)
    return result
  }
})

self.onmessage = handler
```

---

## 📖 API

### `createWorkerStore(worker, options?)`

Creates a store in Web Worker.

| Parameter | Type | Description |
|-----------|------|-------------|
| `worker` | `Worker` | Web Worker instance |
| `options` | `Object` (optional) | Options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialState` | `Object` | `{}` | Initial state |
| `serializer` | `Function` (optional) | `JSON.stringify` | Custom serialization |
| `deserializer` | `Function` (optional) | `JSON.parse` | Custom deserialization |

**Returns:** WorkerStore with `dispatch`, `subscribe`, `getState` methods

### `createWorkerHandler(handlers)`

Creates message handler in Worker.

| Parameter | Type | Description |
|-----------|------|-------------|
| `handlers` | `Object` | Action handlers `{ TYPE: fn }` |

**Returns:** `onmessage` handler

### `transfer(transferables)`

Specifies Transferable objects for transfer without copying.

---

## 💡 Usage Examples

### Image Processing

```javascript
// main.js
import { createWorkerStore } from '@nexus-state/web-worker'

const imageWorker = createWorkerStore(
  new Worker('./image-worker.js')
)

// Send image for processing
imageWorker.dispatch({
  type: 'APPLY_FILTER',
  payload: { image: imageData, filter: 'blur' }
})

// Get result
imageWorker.subscribe('imageResult', (result) => {
  canvas.getContext('2d').putImageData(result, 0, 0)
})
```

```javascript
// image-worker.js
import { createWorkerHandler } from '@nexus-state/web-worker'

const handler = createWorkerHandler({
  APPLY_FILTER: async ({ image, filter }) => {
    const ctx = new OffscreenCanvas(image.width, image.height).getContext('2d')
    ctx.putImageData(image, 0, 0)
    
    // Apply filter
    switch (filter) {
      case 'blur':
        ctx.filter = 'blur(5px)'
        ctx.drawImage(ctx.canvas, 0, 0)
        break
      case 'grayscale':
        const imageData = ctx.getImageData(0, 0, image.width, image.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          data[i] = data[i + 1] = data[i + 2] = avg
        }
        ctx.putImageData(imageData, 0, 0)
        break
    }
    
    return ctx.getImageData(0, 0, image.width, image.height)
  }
})

self.onmessage = handler
```

### Large File Parsing

```javascript
// main.js
const parserWorker = createWorkerStore(
  new Worker('./parser-worker.js')
)

// Read file
const file = fileInput.files[0]
parserWorker.dispatch({
  type: 'PARSE_CSV',
  payload: { file, encoding: 'utf-8' }
})

// Progress
parserWorker.subscribe('progress', (progress) => {
  progressBar.value = progress
})

// Result
parserWorker.subscribe('parseResult', (result) => {
  console.log('Parsed rows:', result.rows.length)
})
```

```javascript
// parser-worker.js
import { createWorkerHandler } from '@nexus-state/web-worker'

const handler = createWorkerHandler({
  PARSE_CSV: async ({ file }) => {
    const text = await file.text()
    const lines = text.split('\n')
    const rows = []
    
    for (let i = 0; i < lines.length; i++) {
      rows.push(lines[i].split(','))
      
      // Send progress every 1000 lines
      if (i % 1000 === 0) {
        self.postMessage({
          type: 'progress',
          payload: { progress: (i / lines.length) * 100 }
        })
      }
    }
    
    return { rows, count: rows.length }
  }
})

self.onmessage = handler
```

### Cryptographic Computations

```javascript
// main.js
const cryptoWorker = createWorkerStore(
  new Worker('./crypto-worker.js')
)

// Hashing
cryptoWorker.dispatch({
  type: 'HASH',
  payload: { algorithm: 'SHA-256', data: largeString }
})

cryptoWorker.subscribe('hashResult', (hash) => {
  console.log('Hash:', hash)
})
```

```javascript
// crypto-worker.js
import { createWorkerHandler } from '@nexus-state/web-worker'

const handler = createWorkerHandler({
  HASH: async ({ algorithm, data }) => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
})

self.onmessage = handler
```

### Data Search and Filtering

```javascript
// main.js
const searchWorker = createWorkerStore(
  new Worker('./search-worker.js')
)

// Search in large array
searchWorker.dispatch({
  type: 'SEARCH',
  payload: { query: 'react', dataset: largeArray }
})

searchWorker.subscribe('searchResults', (results) => {
  displayResults(results)
})
```

```javascript
// search-worker.js
import { createWorkerHandler } from '@nexus-state/web-worker'

const handler = createWorkerHandler({
  SEARCH: async ({ query, dataset }) => {
    const lowerQuery = query.toLowerCase()
    
    return dataset.filter(item => {
      return item.name.toLowerCase().includes(lowerQuery) ||
             item.description.toLowerCase().includes(lowerQuery)
    })
  }
})

self.onmessage = handler
```

### Video/Audio Processing

```javascript
// main.js
const mediaWorker = createWorkerStore(
  new Worker('./media-worker.js')
)

// Transcoding
mediaWorker.dispatch({
  type: 'TRANSCODE',
  payload: { 
    video: videoBlob,
    format: 'webm',
    quality: 0.8
  },
  transfer: [videoBlob]  // Transfer without copying
})

mediaWorker.subscribe('transcodeProgress', (progress) => {
  console.log(`Progress: ${progress}%`)
})

mediaWorker.subscribe('transcodeResult', (result) => {
  videoElement.src = URL.createObjectURL(result.blob)
})
```

---

## ⚙️ Configuration

### Transferable Objects

```javascript
// Transfer ArrayBuffer without copying
workerStore.dispatch({
  type: 'PROCESS',
  payload: { buffer },
  transfer: [buffer]  // Buffer transferred, not copied
})
```

### Custom Serialization

```javascript
const workerStore = createWorkerStore(
  new Worker('./worker.js'),
  {
    serializer: (data) => {
      // Custom serialization for Map/Set
      return JSON.stringify(data, (key, value) => {
        if (value instanceof Map) {
          return { __type: 'map', entries: [...value.entries()] }
        }
        return value
      })
    },
    deserializer: (data) => {
      return JSON.parse(data, (key, value) => {
        if (value?.__type === 'map') {
          return new Map(value.entries)
        }
        return value
      })
    }
  }
)
```

---

## ⚠️ Troubleshooting

### Problem: Worker not responding

**Cause:** Error in worker or wrong path

**Solution:** Check worker console:

```javascript
const worker = new Worker('./worker.js')
worker.onerror = (error) => {
  console.error('Worker error:', error)
}
```

### Problem: Data not transferred

**Cause:** Objects not serializable

**Solution:** Use Transferable or custom serialization:

```javascript
// ❌ Wrong (Function not serializable)
workerStore.dispatch({
  type: 'PROCESS',
  payload: { callback: () => {} }
})

// ✅ Correct
workerStore.dispatch({
  type: 'PROCESS',
  payload: { data: serializableData }
})
```

### Problem: Slow transfer of large data

**Solution:** Use Transferable:

```javascript
workerStore.dispatch({
  type: 'PROCESS',
  payload: { buffer },
  transfer: [buffer]  // Transferred without copying
})
```

---

## 📚 Documentation

- [Web Workers Guide](https://nexus-state.website.yandexcloud.net/guide/web-worker)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/web-worker)
- [Performance Tips](https://nexus-state.website.yandexcloud.net/guides/worker-performance)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)

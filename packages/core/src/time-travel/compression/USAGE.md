# History Compression Usage Guide

## Overview

History compression reduces memory usage by compressing older snapshots in the time travel history. This is especially useful for long-running applications with frequent state changes.

## Basic Usage

### With No Compression (Default)

```typescript
import { HistoryManager } from '@nexus-state/core';

// No compression - keeps all snapshots
const manager = new HistoryManager(50);
```

### With Time-Based Compression

```typescript
import { HistoryManager, TimeBasedCompression } from '@nexus-state/core';

// Keep recent snapshots at full resolution, compress older ones
const manager = new HistoryManager(50);

const strategy = new TimeBasedCompression({
  keepRecentForMs: 5 * 60 * 1000, // Keep last 5 minutes at full resolution
  keepEvery: 5, // Keep every 5th snapshot for older data
  minSnapshots: 10,
});

manager.setCompressionStrategy(strategy);
```

### With Size-Based Compression

```typescript
import { HistoryManager, SizeBasedCompression } from '@nexus-state/core';

// Compress when history exceeds a certain size
const manager = new HistoryManager(50);

const strategy = new SizeBasedCompression({
  maxSnapshots: 30, // Compress when exceeding 30 snapshots
  keepEvery: 5,
});

manager.setCompressionStrategy(strategy);
```

### With Significance-Based Compression

```typescript
import { HistoryManager, SignificanceBasedCompression } from '@nexus-state/core';

// Keep snapshots with significant changes only
const manager = new HistoryManager(50);

const strategy = new SignificanceBasedCompression({
  minChangeThreshold: 0.3, // At least 30% change to keep snapshot
  maxConsecutiveSimilar: 3, // Keep max 3 consecutive similar snapshots
});

manager.setCompressionStrategy(strategy);
```

## Configuration Options

### TimeBasedCompression

- `keepRecentForMs` - Duration (in ms) to keep snapshots at full resolution (default: 5 minutes)
- `keepEvery` - Keep every Nth snapshot for older data (default: 5)
- `minSnapshots` - Minimum snapshots to keep (default: 10)

### SizeBasedCompression

- `maxSnapshots` - Maximum snapshots before compression (default: 50)
- `keepEvery` - Keep every Nth snapshot when compressing (default: 5)
- `minSnapshots` - Minimum snapshots to keep (default: 10)

### SignificanceBasedCompression

- `minChangeThreshold` - Minimum change ratio to consider snapshot significant (default: 0.3)
- `maxConsecutiveSimilar` - Maximum consecutive similar snapshots to keep (default: 3)
- `minSnapshots` - Minimum snapshots to keep (default: 10)

## Advanced Usage

### Using Compression Factory

```typescript
import { HistoryManager, CompressionFactory } from '@nexus-state/core';

// Create strategy using factory
const strategy = CompressionFactory.create({
  strategy: 'time', // or 'size', 'significance', 'none'
  time: {
    keepRecentForMs: 10 * 60 * 1000,
    keepEvery: 3,
  },
  minSnapshots: 5,
  enabled: true,
});

const manager = new HistoryManager(50);
manager.setCompressionStrategy(strategy);
```

### Checking Compression Statistics

```typescript
const stats = manager.getStats();

console.log('Total snapshots:', stats.totalSnapshots);
console.log('Past count:', stats.pastCount);
console.log('Future count:', stats.futureCount);
console.log('Compression ratio:', stats.compressionMetadata?.compressionRatio);
console.log('Original size:', stats.originalHistorySize);
console.log('Compressed size:', stats.compressedHistorySize);
```

### Disabling Compression

```typescript
import { NoCompressionStrategy } from '@nexus-state/core';

manager.setCompressionStrategy(new NoCompressionStrategy());
// or
manager.setCompressionStrategy(null);
```

## Performance Considerations

- Compression is applied automatically when the configured conditions are met
- The compression strategy can be changed at any time
- Navigation (undo/redo/jumpTo) works seamlessly with compressed history
- Compression metadata is available via `getStats()` for monitoring

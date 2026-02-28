## Task 2: Implement History Compression with Strategy Pattern

**Filename:** `task-002-implement-history-compression.md`

### Context

Currently, `HistoryManager` stores all snapshots in memory without any compression mechanism. For long-running applications or frequent state changes, this can lead to excessive memory usage. Need to implement a configurable compression system that can reduce memory footprint while maintaining usability.

### Requirements

1. **Create Compression Strategy Interface**

```typescript
interface CompressionStrategy {
  name: string;
  shouldCompress(history: Snapshot[], currentIndex: number): boolean;
  compress(history: Snapshot[]): Snapshot[];
  getMetadata(): CompressionMetadata;
}
```

2. **Implement Basic Strategies**
   - `NoCompressionStrategy` - keep all snapshots (default)
   - `TimeBasedCompression` - keep snapshots older than X minutes at lower resolution
   - `SizeBasedCompression` - when history exceeds size, keep every Nth snapshot
   - `SignificanceBasedCompression` - keep snapshots with significant changes

3. **Enhance HistoryManager**
   - Add compression strategy configuration
   - Implement automatic compression trigger on add() when limits reached
   - Preserve navigation capabilities after compression
   - Maintain snapshot IDs for jumpTo() functionality

4. **Add Compression Metadata**
   - Track original vs compressed count
   - Store compression timestamp
   - Mark compressed snapshots in history

5. **Configuration Options**

```typescript
interface CompressionConfig {
  strategy: CompressionStrategy | "time" | "size" | "significance" | "none";
  timeThreshold?: number; // ms for time-based compression
  sizeThreshold?: number; // max snapshots before compression
  keepEvery?: number; // keep every Nth snapshot
  minSnapshots?: number; // minimum snapshots to keep
}
```

### Technical Implementation Details

**TimeBasedCompression Example:**

```typescript
class TimeBasedCompression implements CompressionStrategy {
  constructor(
    private olderThanMs: number,
    private keepEvery: number,
  ) {}

  shouldCompress(history: Snapshot[], currentIndex: number): boolean {
    const oldestRecent = history[currentIndex];
    const snapshotsToCheck = history.slice(0, currentIndex);
    return snapshotsToCheck.some(
      (s) =>
        oldestRecent.metadata.timestamp - s.metadata.timestamp >
        this.olderThanMs,
    );
  }

  compress(history: Snapshot[]): Snapshot[] {
    // Keep all recent snapshots, compress older ones
    const now = Date.now();
    const recent = history.filter(
      (s) => now - s.metadata.timestamp <= this.olderThanMs,
    );
    const old = history.filter(
      (s) => now - s.metadata.timestamp > this.olderThanMs,
    );

    // Keep every Nth old snapshot
    const compressedOld = old.filter(
      (_, index) => index % this.keepEvery === 0,
    );

    return [...recent, ...compressedOld];
  }
}
```

### Testing Requirements

- [ ] Test compression doesn't break undo/redo
- [ ] Verify jumpTo() works with compressed indices
- [ ] Memory usage tests before/after compression
- [ ] Edge cases: empty history, single snapshot, all snapshots compressible
- [ ] Concurrent operations during compression

### Performance Considerations

- Compression should be async if processing many snapshots
- Cache compressed results
- Add metrics for compression effectiveness
- Allow manual trigger via API

### Definition of Done

- [ ] All compression strategies implemented and tested
- [ ] HistoryManager integrated with compression
- [ ] Configuration options working
- [ ] Documentation updated with examples
- [ ] Memory usage improved by at least 50% in long-running scenarios
- [ ] Performance benchmarks showing minimal overhead

### SPR Requirements

- Each strategy in separate file with single responsibility
- Strategy factory for easy configuration
- Clean separation between compression logic and history management
- Comprehensive unit tests for each strategy
- Document public API with examples

---

**Note:** After completing this task, provide memory usage statistics and compression effectiveness metrics.

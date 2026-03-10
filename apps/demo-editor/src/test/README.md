# Performance Testing

Scripts for collecting time-travel performance metrics.

## Quick Start

Open the browser console on the demo app page and run:

```typescript
// Access via global window object
window.timeTravel.measurePerformance().then(console.table)

// Or with formatted output
window.timeTravel.measurePerformance().then(window.timeTravel.printMetrics)
```

## Detailed Usage

### Collect Metrics

```typescript
import { measurePerformance } from './collect-metrics'

const metrics = await measurePerformance()
console.table(metrics)
```

### Formatted Output

```typescript
import { measurePerformance, printMetrics } from './collect-metrics'

const metrics = await measurePerformance()
printMetrics(metrics)
```

### Compare with Targets

```typescript
import { measurePerformance, compareWithTargets } from './collect-metrics'

const metrics = await measurePerformance()
const report = compareWithTargets(metrics)

console.log('Performance Report:')
console.log(`Capture Time: ${report.captureTime.actual.toFixed(2)}ms (target: <${report.captureTime.target}ms) ${report.captureTime.passed ? '✅' : '❌'}`)
console.log(`Restore Time: ${report.restoreTime.actual.toFixed(2)}ms (target: <${report.restoreTime.target}ms) ${report.restoreTime.passed ? '✅' : '❌'}`)
console.log(`Memory: ${report.memory.actual.toFixed(2)}MB (target: <${report.memory.target}MB) ${report.memory.passed ? '✅' : '❌'}`)
```

## Target Values

| Metric | Target | Note |
|--------|--------|------|
| Capture Time | < 50ms | For documents up to 10KB |
| Restore Time | < 100ms | For history up to 100 snapshots |
| Memory | < 50MB | For history with 100 snapshots |

## Testing Conditions

For reproducible results:

1. **Clear history** before testing:
   ```typescript
   import { editorTimeTravel } from '@/store/timeTravel'
   editorTimeTravel.clearHistory()
   ```

2. **Close other tabs** to minimize memory impact

3. **Use Chrome DevTools Performance** for detailed analysis

## API

### `measurePerformance()`

Asynchronously collects performance metrics.

**Returns:**
```typescript
{
  avgCaptureTime: number,    // average capture time (ms)
  avgRestoreTime: number,    // average restore time (ms)
  memoryMB: number           // memory consumption (MB)
}
```

### `printMetrics(metrics)`

Prints metrics to console in readable format.

**Parameters:**
- `metrics` - metrics object from `measurePerformance()`

### `compareWithTargets(metrics)`

Compares metrics against target thresholds.

**Parameters:**
- `metrics` - metrics object from `measurePerformance()`

**Returns:**
```typescript
{
  captureTime: { target: number, actual: number, passed: boolean }
  restoreTime: { target: number, actual: number, passed: boolean }
  memory: { target: number, actual: number, passed: boolean }
}
```

## Browser Console Access

The script exposes a global `window.timeTravel` object for easy console access:

```javascript
// In browser console (no imports needed):
const metrics = await window.timeTravel.measurePerformance()
window.timeTravel.printMetrics(metrics)

// Or compare with targets:
const report = window.timeTravel.compareWithTargets(metrics)
console.log(report)
```

## Integration with Tests

For automatic metric collection in tests:

```typescript
import { describe, it, expect } from 'vitest'
import { measurePerformance } from './collect-metrics'

describe('Performance', () => {
  it('should meet performance targets', async () => {
    const metrics = await measurePerformance()
    expect(metrics.avgCaptureTime).toBeLessThan(50)
    expect(metrics.avgRestoreTime).toBeLessThan(100)
    expect(metrics.memoryMB).toBeLessThan(50)
  })
})
```

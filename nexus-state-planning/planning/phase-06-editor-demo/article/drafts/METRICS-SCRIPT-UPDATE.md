# Performance Metrics Script - Update Report

## Date: March 2026

## Changes Made

### 1. Fixed Browser Console Access

**Problem:** Users couldn't run the script directly from browser console due to ES6 module syntax error:
```
Uncaught SyntaxError: Cannot use import statement outside a module
```

**Solution:** Added global `window.timeTravel` object for easy console access.

---

### 2. Updated `collect-metrics.ts`

**Added:**
```typescript
if (typeof window !== 'undefined') {
  ;(window as any).timeTravel = {
    measurePerformance,
    printMetrics,
    compareWithTargets,
  }
}
```

**Now users can run directly from console:**
```javascript
// No imports needed!
const metrics = await window.timeTravel.measurePerformance()
window.timeTravel.printMetrics(metrics)
```

---

### 3. Updated Documentation to English

**Files updated:**
- `apps/demo-editor/src/test/collect-metrics.ts` - All comments and JSDoc in English
- `apps/demo-editor/src/test/README.md` - Full documentation in English

---

### 4. Updated Article (habr.md)

**Step 15 section updated:**

```bash
# Open browser console (F12) and run:
const metrics = await window.timeTravel.measurePerformance()
window.timeTravel.printMetrics(metrics)

# Or get a detailed report:
const report = window.timeTravel.compareWithTargets(metrics)
console.log('Capture Time:', report.captureTime.actual.toFixed(2) + 'ms', report.captureTime.passed ? '✅' : '❌')
```

---

## Usage Examples

### Quick Test (Browser Console)

```javascript
// 1. Open demo app
// 2. Press F12
// 3. Run:
const metrics = await window.timeTravel.measurePerformance()
window.timeTravel.printMetrics(metrics)
```

**Expected output:**
```
⚡ Performance Metrics
⏱️  Avg Capture Time: 32.45ms
⏱️  Avg Restore Time: 45.67ms
💾 Memory Usage: 28.34MB

Target values:
  Capture Time: < 50ms
  Restore Time: < 100ms
  Memory: < 50MB
```

### Detailed Report (Browser Console)

```javascript
const metrics = await window.timeTravel.measurePerformance()
const report = window.timeTravel.compareWithTargets(metrics)

console.table({
  'Capture Time': { 
    actual: report.captureTime.actual.toFixed(2) + 'ms', 
    target: '<50ms', 
    status: report.captureTime.passed ? '✅' : '❌' 
  },
  'Restore Time': { 
    actual: report.restoreTime.actual.toFixed(2) + 'ms', 
    target: '<100ms', 
    status: report.restoreTime.passed ? '✅' : '❌' 
  },
  Memory: { 
    actual: report.memory.actual.toFixed(2) + 'MB', 
    target: '<50MB', 
    status: report.memory.passed ? '✅' : '❌' 
  },
})
```

### TypeScript Code

```typescript
import { measurePerformance, printMetrics } from './src/test/collect-metrics'

const metrics = await measurePerformance()
printMetrics(metrics)
```

---

## API Reference

### Global Object (Browser Console)

```javascript
window.timeTravel = {
  measurePerformance: async () => Promise<PerformanceMetrics>,
  printMetrics: (metrics) => void,
  compareWithTargets: (metrics) => PerformanceReport
}
```

### TypeScript Exports

```typescript
// collect-metrics.ts
export interface PerformanceMetrics {
  avgCaptureTime: number
  avgRestoreTime: number
  memoryMB: number
}

export async function measurePerformance(): Promise<PerformanceMetrics>
export function printMetrics(metrics: PerformanceMetrics): void
export function compareWithTargets(metrics: PerformanceMetrics): PerformanceReport
```

---

## Target Values

| Metric | Target | Note |
|--------|--------|------|
| Capture Time | < 50ms | For documents up to 10KB |
| Restore Time | < 100ms | For history up to 100 snapshots |
| Memory | < 50MB | For history with 100 snapshots |

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/demo-editor/src/test/collect-metrics.ts` | Added `window.timeTravel` export, English comments |
| `apps/demo-editor/src/test/README.md` | Full rewrite in English |
| `planning/phase-06-editor-demo/article/drafts/habr.md` | Updated Step 15 with new usage examples |

---

## Testing

To verify the script works:

1. **Start demo app:**
   ```bash
   pnpm dev --workspace=demo-editor
   ```

2. **Open browser console (F12)**

3. **Run:**
   ```javascript
   const metrics = await window.timeTravel.measurePerformance()
   console.table(metrics)
   ```

4. **Expected result:**
   ```typescript
   {
     avgCaptureTime: 25.34,    // should be < 50
     avgRestoreTime: 42.67,    // should be < 100
     memoryMB: 28.45           // should be < 50
   }
   ```

---

## Status: ✅ Complete

- [x] Script works from browser console
- [x] All documentation in English
- [x] Article updated with correct usage
- [x] Global `window.timeTravel` object exposed
- [x] JSDoc comments added

import { editorTimeTravel } from '@/store/timeTravel'

export interface PerformanceMetrics {
  avgCaptureTime: number
  avgRestoreTime: number
  memoryMB: number
}

/**
 * Collects time-travel performance metrics.
 *
 * @returns Object with average metric values.
 *
 * @example
 * ```typescript
 * const metrics = await measurePerformance()
 * console.table(metrics)
 * ```
 */
export async function measurePerformance(): Promise<PerformanceMetrics> {
  const results = {
    snapshotCapture: [] as number[],
    snapshotRestore: [] as number[],
    memory: [] as number[],
  }

  // Measure snapshot capture time
  for (let i = 0; i < 10; i++) {
    const start = performance.now()
    editorTimeTravel.capture(`test-${i}`)
    const end = performance.now()
    results.snapshotCapture.push(end - start)
  }

  // Measure snapshot restore time
  const history = editorTimeTravel.getHistory()
  for (let i = 0; i < history.length; i++) {
    const start = performance.now()
    editorTimeTravel.jumpTo(i)
    const end = performance.now()
    results.snapshotRestore.push(end - start)
  }

  // Measure memory consumption
  if (performance.memory) {
    results.memory.push(performance.memory.usedJSHeapSize / 1024 / 1024)
  }

  return {
    avgCaptureTime:
      results.snapshotCapture.reduce((a, b) => a + b) /
      results.snapshotCapture.length,
    avgRestoreTime:
      results.snapshotRestore.reduce((a, b) => a + b) /
      results.snapshotRestore.length,
    memoryMB: results.memory[0] || 0,
  }
}

/**
 * Formats metrics for console output.
 *
 * @param metrics - Metrics object from measurePerformance().
 *
 * @example
 * ```typescript
 * const metrics = await measurePerformance()
 * printMetrics(metrics)
 * ```
 */
export function printMetrics(metrics: PerformanceMetrics): void {
  console.group('⚡ Performance Metrics')
  console.log(`⏱️  Avg Capture Time: ${metrics.avgCaptureTime.toFixed(2)}ms`)
  console.log(`⏱️  Avg Restore Time: ${metrics.avgRestoreTime.toFixed(2)}ms`)
  console.log(`💾 Memory Usage: ${metrics.memoryMB.toFixed(2)}MB`)
  console.log('')
  console.log('Target values:')
  console.log('  Capture Time: < 50ms')
  console.log('  Restore Time: < 100ms')
  console.log('  Memory: < 50MB')
  console.groupEnd()
}

/**
 * Compares metrics against target thresholds.
 *
 * @param metrics - Metrics object from measurePerformance().
 * @returns Object with comparison results.
 *
 * @example
 * ```typescript
 * const metrics = await measurePerformance()
 * const report = compareWithTargets(metrics)
 * console.log(report)
 * ```
 */
export function compareWithTargets(
  metrics: PerformanceMetrics
): {
  captureTime: { target: number; actual: number; passed: boolean }
  restoreTime: { target: number; actual: number; passed: boolean }
  memory: { target: number; actual: number; passed: boolean }
} {
  return {
    captureTime: {
      target: 50,
      actual: metrics.avgCaptureTime,
      passed: metrics.avgCaptureTime < 50,
    },
    restoreTime: {
      target: 100,
      actual: metrics.avgRestoreTime,
      passed: metrics.avgRestoreTime < 100,
    },
    memory: {
      target: 50,
      actual: metrics.memoryMB,
      passed: metrics.memoryMB < 50,
    },
  }
}

/**
 * Global object for browser console access.
 *
 * @example
 * ```javascript
 * // In browser console:
 * window.timeTravel.measurePerformance().then(console.table)
 * window.timeTravel.printMetrics(metrics)
 * ```
 */
if (typeof window !== 'undefined') {
  ;(window as any).timeTravel = {
    measurePerformance,
    printMetrics,
    compareWithTargets,
  }
}

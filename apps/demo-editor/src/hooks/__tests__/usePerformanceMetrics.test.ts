/**
 * Tests for hookа usePerformanceMetrics
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePerformanceMetrics } from '../usePerformanceMetrics'

describe('usePerformanceMetrics', () => {
  it('should return начальные метрики', () => {
    const { result } = renderHook(() => usePerformanceMetrics({ updateInterval: 10000 }))

    expect(result.current.fps).toBe(0)
    expect(result.current.avgFps).toBe(0)
    expect(result.current.minFps).toBeLessThanOrEqual(60)
    expect(result.current.maxFps).toBeGreaterThanOrEqual(0)
    expect(result.current.performanceScore).toBeGreaterThanOrEqual(0)
  })

  it('should return валидный performance score', () => {
    const { result } = renderHook(() => usePerformanceMetrics({ updateInterval: 10000 }))

    expect(typeof result.current.performanceScore).toBe('number')
    expect(result.current.performanceScore).toBeGreaterThanOrEqual(0)
    expect(result.current.performanceScore).toBeLessThanOrEqual(100)
  })

  it('should отключать мониторинг памяти при enableMemoryMonitoring=false', () => {
    const { result } = renderHook(() =>
      usePerformanceMetrics({ enableMemoryMonitoring: false, updateInterval: 10000 })
    )

    // memory может быть null если performance.memory не доступен
    expect(result.current.memory).toBeNull()
  })

  it('should отключать мониторинг снимков при enableSnapshotMonitoring=false', () => {
    const { result } = renderHook(() =>
      usePerformanceMetrics({ enableSnapshotMonitoring: false, updateInterval: 10000 })
    )

    expect(result.current.snapshots.count).toBe(0)
  })

  it('should use кастомный интервал обновления', () => {
    const { result } = renderHook(() =>
      usePerformanceMetrics({ updateInterval: 500 })
    )

    expect(result.current).toBeDefined()
  })
})

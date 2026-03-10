import { useState, useEffect, useCallback, useRef } from 'react'

export interface PerformanceMetrics {
  /** Current FPS */
  fps: number
  /** Average FPS over the last second */
  avgFps: number
  /** Minimum FPS */
  minFps: number
  /** Maximum FPS */
  maxFps: number
  /** Memory usage (MB) */
  memory: MemoryMetrics | null
  /** Snapshot statistics */
  snapshots: SnapshotMetrics
  /** Overall performance score */
  performanceScore: number
}

export interface MemoryMetrics {
  /** Used JS heap size (MB) */
  usedJSHeapSize: number
  /** Total JS heap size (MB) */
  totalJSHeapSize: number
  /** Available JS heap size (MB) */
  jsHeapSizeLimit: number
  /** Usage percentage */
  usagePercent: number
}

export interface SnapshotMetrics {
  /** Number of snapshots in history */
  count: number
  /** Average snapshot size (KB) */
  avgSize: number
  /** Time of last capture (ms) */
  lastCaptureTime: number
  /** Average capture time (ms) */
  avgCaptureTime: number
  /** Total number of captures */
  totalCaptures: number
}

export interface UsePerformanceMetricsOptions {
  /** Metrics update interval (ms) */
  updateInterval?: number
  /** Enable memory monitoring */
  enableMemoryMonitoring?: boolean
  /** Enable snapshot monitoring */
  enableSnapshotMonitoring?: boolean
  /** Number of points for FPS history */
  fpsHistorySize?: number
}

/**
 * Hook for real-time performance monitoring
 *
 * @param options - Monitoring options
 * @returns Object with performance metrics
 */
export function usePerformanceMetrics(
  options: UsePerformanceMetricsOptions = {}
): PerformanceMetrics {
  const {
    updateInterval = 1000,
    enableMemoryMonitoring = true,
    enableSnapshotMonitoring = true,
    fpsHistorySize = 60
  } = options

  const [fps, setFps] = useState(0)
  const [avgFps, setAvgFps] = useState(0)
  const [minFps, setMinFps] = useState(60)
  const [maxFps, setMaxFps] = useState(0)
  const [memory, setMemory] = useState<MemoryMetrics | null>(null)
  const [snapshots, setSnapshots] = useState<SnapshotMetrics>({
    count: 0,
    avgSize: 0,
    lastCaptureTime: 0,
    avgCaptureTime: 0,
    totalCaptures: 0
  })

  const fpsHistoryRef = useRef<number[]>([])
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationFrameRef = useRef<number | null>(null)
  const memoryIntervalRef = useRef<number | null>(null)

  /**
   * Update FPS metrics
   */
  const updateFps = useCallback(() => {
    const now = performance.now()
    const delta = now - lastTimeRef.current
    lastTimeRef.current = now

    frameCountRef.current++

    // Update FPS every second
    if (delta >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / delta)
      frameCountRef.current = 0

      // Add to history
      fpsHistoryRef.current.push(currentFps)
      if (fpsHistoryRef.current.length > fpsHistorySize) {
        fpsHistoryRef.current.shift()
      }

      // Update metrics
      setFps(currentFps)

      const history = fpsHistoryRef.current
      const avg = history.reduce((a, b) => a + b, 0) / history.length
      const min = Math.min(...history)
      const max = Math.max(...history)

      setAvgFps(Math.round(avg))
      setMinFps(min)
      setMaxFps(max)
    }

    animationFrameRef.current = requestAnimationFrame(updateFps)
  }, [fpsHistorySize])

  /**
   * Update memory metrics
   */
  const updateMemory = useCallback(() => {
    // @ts-ignore - performance.memory is not standardized
    if (performance.memory) {
      // @ts-ignore
      const mem = performance.memory
      const usedMB = Math.round(mem.usedJSHeapSize / (1024 * 1024))
      const totalMB = Math.round(mem.totalJSHeapSize / (1024 * 1024))
      const limitMB = Math.round(mem.jsHeapSizeLimit / (1024 * 1024))
      const usagePercent = Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100)

      setMemory({
        usedJSHeapSize: usedMB,
        totalJSHeapSize: totalMB,
        jsHeapSizeLimit: limitMB,
        usagePercent: Math.min(usagePercent, 100)
      })
    }
  }, [])

  /**
   * Update snapshot statistics
   */
  const updateSnapshotMetrics = useCallback(() => {
    // Can integrate with time-travel for statistics here
    // Using stub for demo
    setSnapshots(prev => ({
      ...prev,
      count: prev.count // Will be updated from outside
    }))
  }, [])

  /**
   * Calculate performance score
   */
  const calculatePerformanceScore = useCallback((): number => {
    let score = 100

    // Penalty for low FPS
    if (avgFps < 60) {
      score -= (60 - avgFps) * 0.5
    }

    // Penalty for high memory usage
    if (memory && memory.usagePercent > 80) {
      score -= (memory.usagePercent - 80) * 0.5
    }

    // Penalty for slow snapshots
    if (snapshots.avgCaptureTime > 100) {
      score -= Math.min((snapshots.avgCaptureTime - 100) * 0.1, 20)
    }

    return Math.max(0, Math.round(score))
  }, [avgFps, memory, snapshots.avgCaptureTime])

  // Start FPS monitoring
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateFps)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [updateFps])

  // Start memory monitoring
  useEffect(() => {
    if (enableMemoryMonitoring) {
      updateMemory() // Update immediately
      memoryIntervalRef.current = window.setInterval(updateMemory, updateInterval)
    }

    return () => {
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current)
      }
    }
  }, [enableMemoryMonitoring, updateInterval, updateMemory])

  // Start snapshot monitoring
  useEffect(() => {
    if (enableSnapshotMonitoring) {
      updateSnapshotMetrics()
      const interval = window.setInterval(updateSnapshotMetrics, updateInterval * 2)
      return () => clearInterval(interval)
    }
  }, [enableSnapshotMonitoring, updateInterval, updateSnapshotMetrics])

  // Public method for updating snapshot statistics
  useEffect(() => {
    // Can add external update mechanism
  }, [])

  return {
    fps,
    avgFps,
    minFps,
    maxFps,
    memory,
    snapshots,
    performanceScore: calculatePerformanceScore()
  }
}

/**
 * Export function for updating snapshot metrics from outside
 */
export function updateSnapshotMetrics(
  metrics: Partial<SnapshotMetrics>
): void {
  // This function can be used to update metrics from time-travel
  // Implementation depends on specific integration
}

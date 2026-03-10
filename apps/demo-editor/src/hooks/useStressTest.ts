/**
 * useStressTest - Hook for managing stress tests
 *
 * Provides functionality for:
 * - Turbo Type mode (automatic fast typing)
 * - Snapshot Storm mode (mass snapshot creation)
 * - Stress test statistics tracking
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { editorStore } from '@/store/store'
import { editorTimeTravel } from '@/store/timeTravel'
import { contentAtom } from '@/store/atoms/editor'
import { batcher } from '@nexus-state/core'

export interface StressTestStats {
  // Turbo Type stats
  turboTypeActive: boolean
  turboTypeCharsTyped: number
  turboTypeDuration: number
  turboTypeStartTime: number | null
  
  // Snapshot Storm stats
  snapshotStormActive: boolean
  snapshotsCreated: number
  snapshotStormDuration: number
  snapshotStormStartTime: number | null
  
  // Performance metrics
  avgSnapshotTime: number
  maxSnapshotTime: number
  minSnapshotTime: number
  snapshotTimes: number[]
  
  // Overall stats
  totalOperations: number
  errorsCount: number
}

export interface StressTestConfig {
  // Turbo Type config
  turboTypeSpeed: number  // chars per second
  turboTypeText: string
  
  // Snapshot Storm config
  snapshotStormCount: number
  snapshotStormInterval: number  // ms between snapshots
  
  // Auto-stop config
  autoStopAfterSnapshots?: number
  autoStopAfterSeconds?: number
}

const DEFAULT_CONFIG: StressTestConfig = {
  turboTypeSpeed: 50,  // 50 chars per second
  turboTypeText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. ',
  
  snapshotStormCount: 100,
  snapshotStormInterval: 10,  // 10ms between snapshots
  
  autoStopAfterSnapshots: 500,
  autoStopAfterSeconds: 60
}

const DEFAULT_STATS: StressTestStats = {
  turboTypeActive: false,
  turboTypeCharsTyped: 0,
  turboTypeDuration: 0,
  turboTypeStartTime: null,
  
  snapshotStormActive: false,
  snapshotsCreated: 0,
  snapshotStormDuration: 0,
  snapshotStormStartTime: null,
  
  avgSnapshotTime: 0,
  maxSnapshotTime: 0,
  minSnapshotTime: Infinity,
  snapshotTimes: [],
  
  totalOperations: 0,
  errorsCount: 0
}

export function useStressTest(config: Partial<StressTestConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const [stats, setStats] = useState<StressTestStats>(DEFAULT_STATS)
  
  const turboTypeIntervalRef = useRef<number | null>(null)
  const snapshotStormTimeoutRef = useRef<number | null>(null)
  const autoStopTimeoutRef = useRef<number | null>(null)
  const charIndexRef = useRef(0)
  
  // Track snapshot creation time
  const trackSnapshotTime = useCallback((snapshotTime: number) => {
    setStats(prev => {
      const newTimes = [...prev.snapshotTimes, snapshotTime].slice(-100) // Keep last 100
      const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length
      
      return {
        ...prev,
        snapshotTimes: newTimes,
        avgSnapshotTime: avg,
        maxSnapshotTime: Math.max(prev.maxSnapshotTime, snapshotTime),
        minSnapshotTime: Math.min(prev.minSnapshotTime, snapshotTime)
      }
    })
  }, [])
  
  // Start Turbo Type mode
  const startTurboType = useCallback(() => {
    if (stats.turboTypeActive || stats.snapshotStormActive) return

    const startTime = Date.now()
    charIndexRef.current = 0
    
    setStats(prev => ({
      ...prev,
      turboTypeActive: true,
      turboTypeStartTime: startTime,
      turboTypeCharsTyped: 0
    }))
    
    const charsPerInterval = mergedConfig.turboTypeSpeed / 10 // 10 intervals per second
    const intervalMs = 100
    
    turboTypeIntervalRef.current = window.setInterval(() => {
      try {
        // Type multiple chars per interval for speed
        let newContent = ''
        const currentContent = editorStore.get(contentAtom)
        
        for (let i = 0; i < charsPerInterval; i++) {
          const char = mergedConfig.turboTypeText[charIndexRef.current % mergedConfig.turboTypeText.length]
          newContent += char
          charIndexRef.current++
        }
        
        editorStore.set(contentAtom, currentContent + newContent)
        
        // Capture snapshot every 50 chars
        if (charIndexRef.current % 50 === 0) {
          const snapshotStart = Date.now()
          editorTimeTravel.capture('turbo-type')
          trackSnapshotTime(Date.now() - snapshotStart)
        }
        
        setStats(prev => ({
          ...prev,
          turboTypeCharsTyped: charIndexRef.current,
          turboTypeDuration: Date.now() - startTime,
          totalOperations: prev.totalOperations + 1
        }))
        
        // Auto-stop conditions
        if (mergedConfig.autoStopAfterSnapshots && 
            editorTimeTravel.getHistory().length >= mergedConfig.autoStopAfterSnapshots) {
          stopTurboType()
        }
        
        if (mergedConfig.autoStopAfterSeconds && 
            Date.now() - startTime > mergedConfig.autoStopAfterSeconds * 1000) {
          stopTurboType()
        }
      } catch (error) {
        console.error('[StressTest] Turbo Type error:', error)
        setStats(prev => ({
          ...prev,
          errorsCount: prev.errorsCount + 1
        }))
      }
    }, intervalMs)
  }, [stats.turboTypeActive, mergedConfig, trackSnapshotTime])
  
  // Stop Turbo Type mode
  const stopTurboType = useCallback(() => {
    if (turboTypeIntervalRef.current) {
      clearInterval(turboTypeIntervalRef.current)
      turboTypeIntervalRef.current = null
    }

    // Clear any pending batches from batcher
    // This is critical to restore normal navigation after turbo mode
    if (batcher.getIsBatching()) {
      batcher.endBatch()
    }
    batcher.reset()

    setStats(prev => ({
      ...prev,
      turboTypeActive: false,
      turboTypeDuration: prev.turboTypeStartTime
        ? Date.now() - prev.turboTypeStartTime
        : prev.turboTypeDuration
    }))
  }, [])
  
  // Toggle Turbo Type
  const toggleTurboType = useCallback(() => {
    if (stats.turboTypeActive) {
      stopTurboType()
    } else {
      startTurboType()
    }
  }, [stats.turboTypeActive, startTurboType, stopTurboType])
  
  // Start Snapshot Storm mode
  const startSnapshotStorm = useCallback(() => {
    if (stats.snapshotStormActive || stats.turboTypeActive) return

    const startTime = Date.now()
    let created = 0

    setStats(prev => ({
      ...prev,
      snapshotStormActive: true,
      snapshotStormStartTime: startTime,
      snapshotsCreated: 0
    }))

    const createSnapshot = () => {
      try {
        const snapshotStart = Date.now()

        // Make a small change before each snapshot
        const currentContent = editorStore.get(contentAtom)
        const timestamp = Date.now().toString(36)
        editorStore.set(contentAtom, `${currentContent}\n[Snapshot ${created + 1} @ ${timestamp}]`)

        editorTimeTravel.capture('snapshot-storm')
        const snapshotTime = Date.now() - snapshotStart
        trackSnapshotTime(snapshotTime)

        created++

        setStats(prev => ({
          ...prev,
          snapshotsCreated: created,
          snapshotStormDuration: Date.now() - startTime,
          totalOperations: prev.totalOperations + 1
        }))

        // Continue storm
        if (created < mergedConfig.snapshotStormCount) {
          snapshotStormTimeoutRef.current = window.setTimeout(createSnapshot, mergedConfig.snapshotStormInterval)
        } else {
          stopSnapshotStorm()
        }

        // Auto-stop conditions
        if (mergedConfig.autoStopAfterSnapshots &&
            editorTimeTravel.getHistory().length >= mergedConfig.autoStopAfterSnapshots) {
          stopSnapshotStorm()
        }
      } catch (error) {
        console.error('[StressTest] Snapshot Storm error:', error)
        setStats(prev => ({
          ...prev,
          errorsCount: prev.errorsCount + 1
        }))
        stopSnapshotStorm()
      }
    }

    createSnapshot()
  }, [stats.snapshotStormActive, mergedConfig, trackSnapshotTime])
  
  // Stop Snapshot Storm mode
  const stopSnapshotStorm = useCallback(() => {
    if (snapshotStormTimeoutRef.current) {
      clearTimeout(snapshotStormTimeoutRef.current)
      snapshotStormTimeoutRef.current = null
    }

    // Clear any pending batches from batcher
    // This is critical to restore normal navigation after storm
    if (batcher.getIsBatching()) {
      batcher.endBatch()
    }
    batcher.reset()

    setStats(prev => ({
      ...prev,
      snapshotStormActive: false,
      snapshotStormDuration: prev.snapshotStormStartTime
        ? Date.now() - prev.snapshotStormStartTime
        : prev.snapshotStormDuration
    }))
  }, [])
  
  // Toggle Snapshot Storm
  const toggleSnapshotStorm = useCallback(() => {
    if (stats.snapshotStormActive) {
      stopSnapshotStorm()
    } else {
      startSnapshotStorm()
    }
  }, [stats.snapshotStormActive, startSnapshotStorm, stopSnapshotStorm])
  
  // Stop all stress tests
  const stopAll = useCallback(() => {
    stopTurboType()
    stopSnapshotStorm()
    
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current)
      autoStopTimeoutRef.current = null
    }
  }, [stopTurboType, stopSnapshotStorm])
  
  // Reset statistics
  const resetStats = useCallback(() => {
    stopAll()
    setStats(DEFAULT_STATS)
    charIndexRef.current = 0
  }, [stopAll])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll()
    }
  }, [stopAll])
  
  return {
    // Stats
    stats: {
      ...stats,
      minSnapshotTime: stats.minSnapshotTime === Infinity ? 0 : stats.minSnapshotTime
    },
    
    // Controls
    startTurboType,
    stopTurboType,
    toggleTurboType,
    startSnapshotStorm,
    stopSnapshotStorm,
    toggleSnapshotStorm,
    stopAll,
    resetStats,
    
    // State
    isRunning: stats.turboTypeActive || stats.snapshotStormActive
  }
}

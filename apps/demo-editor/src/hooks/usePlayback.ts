import { useState, useEffect, useCallback, useRef } from 'react'
import { useTimeTravel } from '@/hooks/useTimeTravel'

export interface UsePlaybackOptions {
  /** Default speed (ms between snapshots) */
  defaultSpeed?: number
  /** Minimum speed (ms) */
  minSpeed?: number
  /** Maximum speed (ms) */
  maxSpeed?: number
}

export interface UsePlaybackReturn {
  /** Is playing now */
  isPlaying: boolean
  /** Is paused */
  isPaused: boolean
  /** Loop mode enabled */
  isLooping: boolean
  /** Current speed (ms) */
  speed: number
  /** Playback direction */
  direction: 'forward' | 'backward'
  /** Current position */
  position: number
  /** Total number of snapshots */
  total: number
  /** Progress percentage */
  progress: number
  /** Start playback */
  play: () => void
  /** Pause playback */
  pause: () => void
  /** Resume after pause */
  resume: () => void
  /** Stop and reset to beginning */
  stop: () => void
  /** Toggle play/pause */
  togglePlayPause: () => void
  /** Toggle loop mode */
  toggleLoop: () => void
  /** Set speed */
  setSpeed: (speed: number) => void
  /** Set direction */
  setDirection: (direction: 'forward' | 'backward') => void
  /** Jump to position */
  jumpTo: (index: number) => boolean
}

/**
 * Hook for managing automatic snapshot history playback
 *
 * @param options - Playback options
 * @returns Object with state and control methods
 */
export function usePlayback(
  options: UsePlaybackOptions = {}
): UsePlaybackReturn {
  const {
    defaultSpeed = 1000,
    minSpeed = 200,
    maxSpeed = 3000
  } = options

  const {
    currentPosition,
    snapshotsCount,
    jumpTo: timeTravelJumpTo
  } = useTimeTravel()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [speed, setSpeed] = useState(defaultSpeed)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  const intervalRef = useRef<number | null>(null)
  const positionRef = useRef(currentPosition)

  // Sync ref with currentPosition
  useEffect(() => {
    positionRef.current = currentPosition
  }, [currentPosition])

  /**
   * Jump to position
   */
  const jumpTo = useCallback((index: number): boolean => {
    if (index < 0 || index >= snapshotsCount) {
      return false
    }

    const success = timeTravelJumpTo(index)
    if (success && !isPlaying) {
      positionRef.current = index
    }
    return success
  }, [snapshotsCount, timeTravelJumpTo, isPlaying])

  /**
   * Playback step
   */
  const step = useCallback(() => {
    const currentPos = positionRef.current
    const total = snapshotsCount

    if (total === 0) return

    if (direction === 'forward') {
      if (currentPos >= total - 1) {
        // Reached end
        if (isLooping) {
          jumpTo(0)
          positionRef.current = 0
          return
        } else {
          // Stop playback
          setIsPlaying(false)
          setIsPaused(false)
          return
        }
      }
      const newPos = currentPos + 1
      jumpTo(newPos)
      positionRef.current = newPos
    } else {
      // Reverse direction
      if (currentPos <= 0) {
        if (isLooping) {
          const lastPos = total - 1
          jumpTo(lastPos)
          positionRef.current = lastPos
          return
        } else {
          setIsPlaying(false)
          setIsPaused(false)
          return
        }
      }
      const newPos = currentPos - 1
      jumpTo(newPos)
      positionRef.current = newPos
    }
  }, [direction, isLooping, snapshotsCount, jumpTo])

  /**
   * Start playback
   */
  const play = useCallback(() => {
    if (isPlaying || snapshotsCount === 0) return
    setIsPlaying(true)
    setIsPaused(false)
  }, [isPlaying, snapshotsCount])

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (!isPlaying) return
    setIsPaused(true)
    setIsPlaying(false)
  }, [isPlaying])

  /**
   * Resume after pause
   */
  const resume = useCallback(() => {
    if (!isPaused) return
    setIsPaused(false)
    setIsPlaying(true)
  }, [isPaused])

  /**
   * Stop and reset to beginning
   */
  const stop = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(false)
    jumpTo(0)
  }, [jumpTo])

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else if (isPaused) {
      resume()
    } else {
      play()
    }
  }, [isPlaying, isPaused, play, pause, resume])

  /**
   * Toggle loop mode
   */
  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev)
  }, [])

  /**
   * Set playback speed
   */
  const setPlaybackSpeed = useCallback((newSpeed: number) => {
    const clamped = Math.max(minSpeed, Math.min(maxSpeed, newSpeed))
    setSpeed(clamped)
  }, [minSpeed, maxSpeed])

  /**
   * Set playback direction
   */
  const setPlaybackDirection = useCallback((newDirection: 'forward' | 'backward') => {
    setDirection(newDirection)
  }, [])

  // Playback interval
  useEffect(() => {
    if (isPlaying && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        step()
      }, speed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, isPaused, speed, step])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Calculate progress
  const progress = snapshotsCount > 0
    ? ((positionRef.current + 1) / snapshotsCount) * 100
    : 0

  return {
    isPlaying,
    isPaused,
    isLooping,
    speed,
    direction,
    position: positionRef.current,
    total: snapshotsCount,
    progress,
    play,
    pause,
    resume,
    stop,
    togglePlayPause,
    toggleLoop,
    setSpeed: setPlaybackSpeed,
    setDirection: setPlaybackDirection,
    jumpTo
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTimeTravel } from '@/hooks/useTimeTravel'

export interface UsePlaybackOptions {
  /** Скорость по умолчанию (мс между снимками) */
  defaultSpeed?: number
  /** Минимальная скорость (мс) */
  minSpeed?: number
  /** Максимальная скорость (мс) */
  maxSpeed?: number
}

export interface UsePlaybackReturn {
  /** Проигрывается ли сейчас */
  isPlaying: boolean
  /** Находится ли на паузе */
  isPaused: boolean
  /** Режим зацикливания */
  isLooping: boolean
  /** Текущая скорость (мс) */
  speed: number
  /** Направление воспроизведения */
  direction: 'forward' | 'backward'
  /** Текущая позиция */
  position: number
  /** Общее количество снимков */
  total: number
  /** Процент прогресса */
  progress: number
  /** Начать воспроизведение */
  play: () => void
  /** Поставить на паузу */
  pause: () => void
  /** Возобновить после паузы */
  resume: () => void
  /** Остановить и сбросить к началу */
  stop: () => void
  /** Переключить play/pause */
  togglePlayPause: () => void
  /** Переключить режим loop */
  toggleLoop: () => void
  /** Установить скорость */
  setSpeed: (speed: number) => void
  /** Установить направление */
  setDirection: (direction: 'forward' | 'backward') => void
  /** Перейти к позиции */
  jumpTo: (index: number) => boolean
}

/**
 * Хук для управления автоматическим воспроизведением истории снимков
 *
 * @param options - Опции воспроизведения
 * @returns Объект с состоянием и методами управления
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

  // Синхронизация ref с currentPosition
  useEffect(() => {
    positionRef.current = currentPosition
  }, [currentPosition])

  /**
   * Перейти к позиции
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
   * Шаг воспроизведения
   */
  const step = useCallback(() => {
    const currentPos = positionRef.current
    const total = snapshotsCount

    if (total === 0) return

    if (direction === 'forward') {
      if (currentPos >= total - 1) {
        // Достигли конца
        if (isLooping) {
          jumpTo(0)
          positionRef.current = 0
          return
        } else {
          // Остановить воспроизведение
          setIsPlaying(false)
          setIsPaused(false)
          return
        }
      }
      const newPos = currentPos + 1
      jumpTo(newPos)
      positionRef.current = newPos
    } else {
      // Обратное направление
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
   * Начать воспроизведение
   */
  const play = useCallback(() => {
    if (isPlaying || snapshotsCount === 0) return
    setIsPlaying(true)
    setIsPaused(false)
  }, [isPlaying, snapshotsCount])

  /**
   * Поставить на паузу
   */
  const pause = useCallback(() => {
    if (!isPlaying) return
    setIsPaused(true)
    setIsPlaying(false)
  }, [isPlaying])

  /**
   * Возобновить после паузы
   */
  const resume = useCallback(() => {
    if (!isPaused) return
    setIsPaused(false)
    setIsPlaying(true)
  }, [isPaused])

  /**
   * Остановить и сбросить к началу
   */
  const stop = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(false)
    jumpTo(0)
  }, [jumpTo])

  /**
   * Переключить play/pause
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
   * Переключить режим loop
   */
  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev)
  }, [])

  /**
   * Установить скорость
   */
  const setPlaybackSpeed = useCallback((newSpeed: number) => {
    const clamped = Math.max(minSpeed, Math.min(maxSpeed, newSpeed))
    setSpeed(clamped)
  }, [minSpeed, maxSpeed])

  /**
   * Установить направление
   */
  const setPlaybackDirection = useCallback((newDirection: 'forward' | 'backward') => {
    setDirection(newDirection)
  }, [])

  // Интервал воспроизведения
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

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Вычисляем прогресс
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

import { useState, useEffect, useCallback, useRef } from 'react'

export interface PerformanceMetrics {
  /** Текущий FPS */
  fps: number
  /** Средний FPS за последнюю секунду */
  avgFps: number
  /** Минимальный FPS */
  minFps: number
  /** Максимальный FPS */
  maxFps: number
  /** Потребление памяти (MB) */
  memory: MemoryMetrics | null
  /** Статистика снимков */
  snapshots: SnapshotMetrics
  /** Общая производительность */
  performanceScore: number
}

export interface MemoryMetrics {
  /** Используется памяти (MB) */
  usedJSHeapSize: number
  /** Всего памяти (MB) */
  totalJSHeapSize: number
  /** Доступно памяти (MB) */
  jsHeapSizeLimit: number
  /** Процент использования */
  usagePercent: number
}

export interface SnapshotMetrics {
  /** Количество снимков в истории */
  count: number
  /** Средний размер снимка (KB) */
  avgSize: number
  /** Время последнего захвата (ms) */
  lastCaptureTime: number
  /** Среднее время захвата (ms) */
  avgCaptureTime: number
  /** Общее количество захватов */
  totalCaptures: number
}

export interface UsePerformanceMetricsOptions {
  /** Интервал обновления метрик (ms) */
  updateInterval?: number
  /** Включить мониторинг памяти */
  enableMemoryMonitoring?: boolean
  /** Включить мониторинг снимков */
  enableSnapshotMonitoring?: boolean
  /** Количество точек для истории FPS */
  fpsHistorySize?: number
}

/**
 * Хук для мониторинга производительности в реальном времени
 *
 * @param options - Опции мониторинга
 * @returns Объект с метриками производительности
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
   * Обновить метрики FPS
   */
  const updateFps = useCallback(() => {
    const now = performance.now()
    const delta = now - lastTimeRef.current
    lastTimeRef.current = now

    frameCountRef.current++

    // Обновляем FPS каждую секунду
    if (delta >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / delta)
      frameCountRef.current = 0

      // Добавляем в историю
      fpsHistoryRef.current.push(currentFps)
      if (fpsHistoryRef.current.length > fpsHistorySize) {
        fpsHistoryRef.current.shift()
      }

      // Обновляем метрики
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
   * Обновить метрики памяти
   */
  const updateMemory = useCallback(() => {
    // @ts-ignore - performance.memory не стандартизирован
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
   * Обновить статистику снимков
   */
  const updateSnapshotMetrics = useCallback(() => {
    // Здесь можно интегрироваться с time-travel для получения статистики
    // Для демо используем заглушку
    setSnapshots(prev => ({
      ...prev,
      count: prev.count // Будет обновлено извне
    }))
  }, [])

  /**
   * Вычислить score производительности
   */
  const calculatePerformanceScore = useCallback((): number => {
    let score = 100

    // Штраф за низкий FPS
    if (avgFps < 60) {
      score -= (60 - avgFps) * 0.5
    }

    // Штраф за высокое потребление памяти
    if (memory && memory.usagePercent > 80) {
      score -= (memory.usagePercent - 80) * 0.5
    }

    // Штраф за медленные снимки
    if (snapshots.avgCaptureTime > 100) {
      score -= Math.min((snapshots.avgCaptureTime - 100) * 0.1, 20)
    }

    return Math.max(0, Math.round(score))
  }, [avgFps, memory, snapshots.avgCaptureTime])

  // Запуск мониторинга FPS
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateFps)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [updateFps])

  // Запуск мониторинга памяти
  useEffect(() => {
    if (enableMemoryMonitoring) {
      updateMemory() // Сразу обновить
      memoryIntervalRef.current = window.setInterval(updateMemory, updateInterval)
    }

    return () => {
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current)
      }
    }
  }, [enableMemoryMonitoring, updateInterval, updateMemory])

  // Запуск мониторинга снимков
  useEffect(() => {
    if (enableSnapshotMonitoring) {
      updateSnapshotMetrics()
      const interval = window.setInterval(updateSnapshotMetrics, updateInterval * 2)
      return () => clearInterval(interval)
    }
  }, [enableSnapshotMonitoring, updateInterval, updateSnapshotMetrics])

  // Публичный метод для обновления статистики снимков
  useEffect(() => {
    // Можно добавить external update mechanism
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
 * Экспорт функции для обновления метрик снимков извне
 */
export function updateSnapshotMetrics(
  metrics: Partial<SnapshotMetrics>
): void {
  // Эта функция может быть использована для обновления метрик из time-travel
  // Реализация зависит от конкретной интеграции
}

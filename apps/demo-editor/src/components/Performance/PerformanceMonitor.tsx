import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics'
import { Activity, HardDrive, Clock, Database, TrendingUp, AlertTriangle } from 'lucide-react'
import './PerformanceMonitor.css'

export interface PerformanceMonitorProps {
  /** Класс для кастомизации */
  className?: string
  /** Показывать ли подробные метрики */
  showDetailed?: boolean
  /** Показывать ли графики */
  showCharts?: boolean
  /** Интервал обновления */
  updateInterval?: number
}

/**
 * Компонент монитора производительности
 *
 * @param props - Пропсы компонента
 */
export function PerformanceMonitor({
  className = '',
  showDetailed = true,
  showCharts = true,
  updateInterval = 1000
}: PerformanceMonitorProps) {
  const {
    fps,
    avgFps,
    minFps,
    maxFps,
    memory,
    snapshots,
    performanceScore
  } = usePerformanceMetrics({
    updateInterval,
    enableMemoryMonitoring: true,
    enableSnapshotMonitoring: showDetailed
  })

  const getFpsColor = (value: number): string => {
    if (value >= 55) return 'good'
    if (value >= 30) return 'warning'
    return 'bad'
  }

  const getMemoryColor = (percent: number): string => {
    if (percent < 50) return 'good'
    if (percent < 80) return 'warning'
    return 'bad'
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'good'
    if (score >= 50) return 'warning'
    return 'bad'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Poor'
  }

  return (
    <div className={`performance-monitor ${className}`} data-testid="performance-monitor">
      {/* Header with score */}
      <div className="performance-monitor__header">
        <h3 className="performance-monitor__title">
          <Activity size={20} />
          Performance Monitor
        </h3>
        <div
          className={`performance-monitor__score performance-monitor__score--${getScoreColor(performanceScore)}`}
          data-testid="performance-score"
        >
          <span className="performance-monitor__score-value">{performanceScore}</span>
          <span className="performance-monitor__score-label">{getScoreLabel(performanceScore)}</span>
        </div>
      </div>

      {/* FPS Metrics */}
      <div className="performance-monitor__section" data-testid="performance-fps-section">
        <div className="performance-monitor__section-header">
          <TrendingUp size={16} className="performance-monitor__icon" />
          <span className="performance-monitor__section-title">FPS</span>
        </div>

        <div className="performance-monitor__metrics">
          <div className="performance-monitor__metric performance-monitor__metric--large">
            <span
              className={`performance-monitor__value performance-monitor__value--${getFpsColor(fps)}`}
              data-testid="performance-fps-current"
            >
              {fps}
            </span>
            <span className="performance-monitor__label">Current</span>
          </div>

          {showDetailed && (
            <>
              <div className="performance-monitor__metric">
                <span className="performance-monitor__value" data-testid="performance-fps-avg">
                  {avgFps}
                </span>
                <span className="performance-monitor__label">Avg</span>
              </div>

              <div className="performance-monitor__metric">
                <span className="performance-monitor__value" data-testid="performance-fps-min">
                  {minFps}
                </span>
                <span className="performance-monitor__label">Min</span>
              </div>

              <div className="performance-monitor__metric">
                <span className="performance-monitor__value" data-testid="performance-fps-max">
                  {maxFps}
                </span>
                <span className="performance-monitor__label">Max</span>
              </div>
            </>
          )}
        </div>

        {showCharts && (
          <div className="performance-monitor__chart" data-testid="performance-fps-chart">
            <FpsChart fps={fps} avgFps={avgFps} />
          </div>
        )}
      </div>

      {/* Memory Metrics */}
      {memory && showDetailed && (
        <div className="performance-monitor__section" data-testid="performance-memory-section">
          <div className="performance-monitor__section-header">
            <HardDrive size={16} className="performance-monitor__icon" />
            <span className="performance-monitor__section-title">Memory</span>
          </div>

          <div className="performance-monitor__metrics">
            <div className="performance-monitor__metric performance-monitor__metric--large">
              <span
                className={`performance-monitor__value performance-monitor__value--${getMemoryColor(memory.usagePercent)}`}
                data-testid="performance-memory-used"
              >
                {memory.usedJSHeapSize} MB
              </span>
              <span className="performance-monitor__label">Used</span>
            </div>

            <div className="performance-monitor__metric">
              <span className="performance-monitor__value" data-testid="performance-memory-total">
                {memory.totalJSHeapSize} MB
              </span>
              <span className="performance-monitor__label">Total</span>
            </div>

            <div className="performance-monitor__metric">
              <span className="performance-monitor__value" data-testid="performance-memory-percent">
                {memory.usagePercent}%
              </span>
              <span className="performance-monitor__label">Usage</span>
            </div>
          </div>

          {showCharts && (
            <div className="performance-monitor__chart" data-testid="performance-memory-chart">
              <MemoryBar percent={memory.usagePercent} />
            </div>
          )}

          {memory.usagePercent > 80 && (
            <div className="performance-monitor__warning" data-testid="performance-memory-warning">
              <AlertTriangle size={14} />
              <span>High memory usage detected!</span>
            </div>
          )}
        </div>
      )}

      {/* Snapshot Metrics */}
      {showDetailed && (
        <div className="performance-monitor__section" data-testid="performance-snapshots-section">
          <div className="performance-monitor__section-header">
            <Database size={16} className="performance-monitor__icon" />
            <span className="performance-monitor__section-title">Snapshots</span>
          </div>

          <div className="performance-monitor__metrics">
            <div className="performance-monitor__metric">
              <span className="performance-monitor__value" data-testid="performance-snapshots-count">
                {snapshots.count}
              </span>
              <span className="performance-monitor__label">Count</span>
            </div>

            <div className="performance-monitor__metric">
              <span className="performance-monitor__value" data-testid="performance-snapshots-avg-size">
                {snapshots.avgSize.toFixed(1)} KB
              </span>
              <span className="performance-monitor__label">Avg Size</span>
            </div>

            <div className="performance-monitor__metric">
              <span
                className={`performance-monitor__value performance-monitor__value--${
                  snapshots.lastCaptureTime < 50 ? 'good' : snapshots.lastCaptureTime < 100 ? 'warning' : 'bad'
                }`}
                data-testid="performance-snapshots-capture-time"
              >
                {snapshots.lastCaptureTime.toFixed(0)} ms
              </span>
              <span className="performance-monitor__label">Capture</span>
            </div>

            <div className="performance-monitor__metric">
              <Clock size={14} className="performance-monitor__icon-small" />
              <span className="performance-monitor__value" data-testid="performance-snapshots-total">
                {snapshots.totalCaptures}
              </span>
              <span className="performance-monitor__label">Total</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="performance-monitor__footer">
        <span className="performance-monitor__footer-text">
          Updates every {updateInterval}ms
        </span>
        {performanceScore < 50 && (
          <span className="performance-monitor__footer-warning">
            Performance issues detected
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Компонент графика FPS
 */
function FpsChart({ fps, avgFps }: { fps: number; avgFps: number }) {
  // Генерируем простые бары для визуализации
  const bars = Array.from({ length: 20 }, (_, i) => {
    const height = Math.min(100, (fps / 60) * 100 * (0.5 + Math.random() * 0.5))
    return height
  })

  return (
    <div className="fps-chart" data-testid="fps-chart">
      <div className="fps-chart__bars">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`fps-chart__bar fps-chart__bar--${height > 90 ? 'good' : height > 60 ? 'warning' : 'bad'}`}
            style={{ height: `${height}%` }}
            data-testid={`fps-chart-bar-${i}`}
          />
        ))}
      </div>
      <div className="fps-chart__labels">
        <span>60 FPS</span>
        <span>30 FPS</span>
        <span>0</span>
      </div>
    </div>
  )
}

/**
 * Компонент индикатора памяти
 */
function MemoryBar({ percent }: { percent: number }) {
  return (
    <div className="memory-bar" data-testid="memory-bar">
      <div
        className={`memory-bar__fill memory-bar__fill--${percent > 80 ? 'bad' : percent > 50 ? 'warning' : 'good'}`}
        style={{ width: `${percent}%` }}
        data-testid="memory-bar-fill"
      />
      <span className="memory-bar__label">{percent}%</span>
    </div>
  )
}

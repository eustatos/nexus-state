/**
 * StressTestStats - Detailed statistics display for stress tests
 * 
 * Shows:
 * - Turbo Type statistics
 * - Snapshot Storm statistics
 * - Performance metrics (avg, min, max snapshot time)
 * - Overall statistics
 */

import { Clock, Zap, Activity, AlertCircle, TrendingUp, Timer } from 'lucide-react'
import type { useStressTest } from '@/hooks/useStressTest'
import './StressTestStats.css'

export interface StressTestStatsProps {
  /** Hook return value from useStressTest */
  stressTest: ReturnType<typeof useStressTest>
  /** Custom className */
  className?: string
}

/**
 * Component display статистики стресс-testов
 */
export function StressTestStats({ stressTest, className = '' }: StressTestStatsProps) {
  const { stats } = stressTest

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className={`stress-test-stats ${className}`} data-testid="stress-test-stats">
      {/* Turbo Type Stats */}
      <div className="stress-test-stats__section">
        <div className="stress-test-stats__section-header">
          <Zap size={16} className="stress-test-stats__icon stress-test-stats__icon--turbo" />
          <span className="stress-test-stats__section-title">Turbo Type</span>
        </div>
        <div className="stress-test-stats__grid">
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Status</span>
            <span className={`
              stress-test-stats__stat-value
              ${stats.turboTypeActive ? 'stress-test-stats__stat-value--active' : ''}
            `}>
              {stats.turboTypeActive ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Chars Typed</span>
            <span className="stress-test-stats__stat-value">
              {formatNumber(stats.turboTypeCharsTyped)}
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Duration</span>
            <span className="stress-test-stats__stat-value">
              {formatDuration(stats.turboTypeDuration)}
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Chars/sec</span>
            <span className="stress-test-stats__stat-value">
              {stats.turboTypeDuration > 0 
                ? Math.round((stats.turboTypeCharsTyped / stats.turboTypeDuration) * 1000) 
                : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Snapshot Storm Stats */}
      <div className="stress-test-stats__section">
        <div className="stress-test-stats__section-header">
          <Zap size={16} className="stress-test-stats__icon stress-test-stats__icon--storm" />
          <span className="stress-test-stats__section-title">Snapshot Storm</span>
        </div>
        <div className="stress-test-stats__grid">
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Status</span>
            <span className={`
              stress-test-stats__stat-value
              ${stats.snapshotStormActive ? 'stress-test-stats__stat-value--active' : ''}
            `}>
              {stats.snapshotStormActive ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Snapshots</span>
            <span className="stress-test-stats__stat-value">
              {formatNumber(stats.snapshotsCreated)}
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Duration</span>
            <span className="stress-test-stats__stat-value">
              {formatDuration(stats.snapshotStormDuration)}
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Snaps/sec</span>
            <span className="stress-test-stats__stat-value">
              {stats.snapshotStormDuration > 0 
                ? Math.round((stats.snapshotsCreated / stats.snapshotStormDuration) * 1000) 
                : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="stress-test-stats__section">
        <div className="stress-test-stats__section-header">
          <Activity size={16} className="stress-test-stats__icon stress-test-stats__icon--perf" />
          <span className="stress-test-stats__section-title">Performance</span>
        </div>
        <div className="stress-test-stats__grid stress-test-stats__grid--3">
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">
              <Timer size={12} /> Avg Time
            </span>
            <span className="stress-test-stats__stat-value">
              {stats.avgSnapshotTime.toFixed(2)}ms
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">
              <TrendingUp size={12} /> Min Time
            </span>
            <span className="stress-test-stats__stat-value stress-test-stats__stat-value--success">
              {stats.minSnapshotTime.toFixed(2)}ms
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">
              <TrendingUp size={12} /> Max Time
            </span>
            <span className="stress-test-stats__stat-value stress-test-stats__stat-value--warning">
              {stats.maxSnapshotTime.toFixed(2)}ms
            </span>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="stress-test-stats__section">
        <div className="stress-test-stats__section-header">
          <Clock size={16} className="stress-test-stats__icon" />
          <span className="stress-test-stats__section-title">Overall</span>
        </div>
        <div className="stress-test-stats__grid stress-test-stats__grid--3">
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Total Operations</span>
            <span className="stress-test-stats__stat-value">
              {formatNumber(stats.totalOperations)}
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">
              <AlertCircle size={12} /> Errors
            </span>
            <span className={`
              stress-test-stats__stat-value
              ${stats.errorsCount > 0 ? 'stress-test-stats__stat-value--error' : ''}
            `}>
              {stats.errorsCount}
            </span>
          </div>
          <div className="stress-test-stats__stat">
            <span className="stress-test-stats__stat-label">Success Rate</span>
            <span className="stress-test-stats__stat-value">
              {stats.totalOperations > 0
                ? (((stats.totalOperations - stats.errorsCount) / stats.totalOperations) * 100).toFixed(1)
                : 100}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

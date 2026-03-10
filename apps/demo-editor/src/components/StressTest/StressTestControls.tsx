/**
 * StressTestControls - Controls for stress testing
 * 
 * Provides buttons for:
 * - Turbo Type mode (automatic fast typing)
 * - Snapshot Storm mode (mass snapshot creation)
 * - Stop all tests
 * - Reset statistics
 */

import { Zap, Square, RotateCcw, AlertTriangle } from 'lucide-react'
import type { useStressTest } from '@/hooks/useStressTest'
import './StressTestControls.css'

export interface StressTestControlsProps {
  /** Hook return value from useStressTest */
  stressTest: ReturnType<typeof useStressTest>
  /** Custom className */
  className?: string
}

/**
 * Component управления стресс-testами
 */
export function StressTestControls({ stressTest, className = '' }: StressTestControlsProps) {
  const {
    stats,
    toggleTurboType,
    toggleSnapshotStorm,
    stopAll,
    resetStats,
    isRunning
  } = stressTest

  return (
    <div className={`stress-test-controls ${className}`} data-testid="stress-test-controls">
      <div className="stress-test-controls__header">
        <AlertTriangle size={14} className="stress-test-controls__icon" />
        <span className="stress-test-controls__title">Stress Tests</span>
      </div>

      <div className="stress-test-controls__buttons">
        {/* Turbo Type Button */}
        <button
          className={`
            stress-test-controls__button
            stress-test-controls__button--turbo
            ${stats.turboTypeActive ? 'stress-test-controls__button--active' : ''}
          `}
          onClick={toggleTurboType}
          disabled={stats.snapshotStormActive}
          data-testid="stress-test-turbo-type-button"
          type="button"
        >
          <Zap size={14} />
          <span className="stress-test-controls__button-text">
            {stats.turboTypeActive ? 'Stop' : 'Turbo'}
          </span>
        </button>

        {/* Snapshot Storm Button */}
        <button
          className={`
            stress-test-controls__button
            stress-test-controls__button--storm
            ${stats.snapshotStormActive ? 'stress-test-controls__button--active' : ''}
          `}
          onClick={toggleSnapshotStorm}
          disabled={stats.turboTypeActive}
          data-testid="stress-test-snapshot-storm-button"
          type="button"
        >
          <Zap size={14} />
          <span className="stress-test-controls__button-text">
            {stats.snapshotStormActive ? 'Stop' : 'Storm'}
          </span>
        </button>

        {/* Stop All Button */}
        <button
          className={`
            stress-test-controls__button
            stress-test-controls__button--stop
            ${!isRunning ? 'stress-test-controls__button--disabled' : ''}
          `}
          onClick={stopAll}
          disabled={!isRunning}
          data-testid="stress-test-stop-all-button"
          type="button"
        >
          <Square size={14} />
          <span className="stress-test-controls__button-text">Stop</span>
        </button>

        {/* Reset Stats Button */}
        <button
          className="stress-test-controls__button stress-test-controls__button--reset"
          onClick={resetStats}
          data-testid="stress-test-reset-button"
          type="button"
        >
          <RotateCcw size={14} />
          <span className="stress-test-controls__button-text">Reset</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stress-test-controls__quick-stats">
        <div className="stress-test-controls__stat">
          <span className="stress-test-controls__stat-label">Ops:</span>
          <span className="stress-test-controls__stat-value" data-testid="stress-test-total-ops">
            {stats.totalOperations}
          </span>
        </div>
        <div className="stress-test-controls__stat">
          <span className="stress-test-controls__stat-label">Avg:</span>
          <span className="stress-test-controls__stat-value" data-testid="stress-test-avg-time">
            {stats.avgSnapshotTime.toFixed(1)}ms
          </span>
        </div>
        <div className="stress-test-controls__stat">
          <span className="stress-test-controls__stat-label">Err:</span>
          <span className={`
            stress-test-controls__stat-value
            ${stats.errorsCount > 0 ? 'stress-test-controls__stat-value--error' : ''}
          `} data-testid="stress-test-errors">
            {stats.errorsCount}
          </span>
        </div>
      </div>
    </div>
  )
}

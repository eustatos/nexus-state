import { useSnapshotComparison } from '@/hooks/useSnapshotComparison'
import { InlineDiffView } from './InlineDiffView'
import { SplitDiffView } from './SplitDiffView'
import { UnifiedDiffView } from './UnifiedDiffView'
import { X, GitCompare, ChevronLeft, ChevronRight } from 'lucide-react'
import './SnapshotDiff.css'

export interface SnapshotDiffProps {
  /** Class for customization */
  className?: string
  /** Close handler */
  onClose?: () => void
  /** Show statistics */
  showStats?: boolean
  /** Show mode switch */
  showModeSwitch?: boolean
  /** Show snapshot information */
  showSnapshotInfo?: boolean
}

/**
 * Format date
 */
function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

/**
 * Format character count
 */
function formatChars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K chars`
  }
  return `${count} chars`
}

/**
 * Count characters in snapshot
 */
function countChars(snapshot: any): number {
  if (!snapshot?.state) return 0

  let total = 0
  for (const key of Object.keys(snapshot.state)) {
    const entry = snapshot.state[key]
    if (typeof entry.value === 'string') {
      total += entry.value.length
    } else if (typeof entry.value === 'object' && entry.value !== null) {
      total += JSON.stringify(entry.value).length
    }
  }
  return total
}

/**
 * Component for comparing two snapshots
 *
 * @param props - Component props
 */
export function SnapshotDiff({
  className = '',
  onClose,
  showStats = true,
  showModeSwitch = true,
  showSnapshotInfo = true
}: SnapshotDiffProps) {
  const {
    baseline,
    comparison,
    mode,
    result,
    setMode,
    reset
  } = useSnapshotComparison()

  // If no comparison result, show empty state
  if (!result) {
    return (
      <div className={`snapshot-diff ${className}`} data-testid="snapshot-diff">
        <div className="snapshot-diff__empty">
          <GitCompare size={48} className="snapshot-diff__empty-icon" />
          <h3 className="snapshot-diff__empty-title">No comparison selected</h3>
          <p className="snapshot-diff__empty-text">
            Select two snapshots from the list to compare them
          </p>
          {onClose && (
            <button
              className="snapshot-diff__close-button"
              onClick={onClose}
              type="button"
            >
              <X size={16} />
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`snapshot-diff ${className}`} data-testid="snapshot-diff">
      {/* Header */}
      <div className="snapshot-diff__header">
        {/* Baseline snapshot information */}
        {showSnapshotInfo && baseline && (
          <div className="snapshot-diff__snapshot-info" data-testid="snapshot-diff-baseline">
            <div className="snapshot-diff__snapshot-icon">
              <ChevronLeft size={20} />
            </div>
            <div className="snapshot-diff__snapshot-details">
              <h4 className="snapshot-diff__snapshot-name">
                {baseline.metadata.action || 'Baseline'}
              </h4>
              <span className="snapshot-diff__snapshot-time">
                {formatDateTime(baseline.metadata.timestamp)}
              </span>
              <span className="snapshot-diff__snapshot-chars">
                {formatChars(countChars(baseline))}
              </span>
            </div>
          </div>
        )}

        {/* Mode switch */}
        {showModeSwitch && (
          <div className="snapshot-diff__modes" data-testid="snapshot-diff-modes">
            <button
              className={`snapshot-diff__mode-button ${mode === 'inline' ? 'active' : ''}`}
              onClick={() => setMode('inline')}
              title="Inline view"
              type="button"
              data-testid="diff-mode-inline"
            >
              Inline
            </button>
            <button
              className={`snapshot-diff__mode-button ${mode === 'split' ? 'active' : ''}`}
              onClick={() => setMode('split')}
              title="Split view"
              type="button"
              data-testid="diff-mode-split"
            >
              Split
            </button>
            <button
              className={`snapshot-diff__mode-button ${mode === 'unified' ? 'active' : ''}`}
              onClick={() => setMode('unified')}
              title="Unified view"
              type="button"
              data-testid="diff-mode-unified"
            >
              Unified
            </button>
          </div>
        )}

        {/* Comparison snapshot information */}
        {showSnapshotInfo && comparison && (
          <div className="snapshot-diff__snapshot-info snapshot-diff__snapshot-info--comparison" data-testid="snapshot-diff-comparison">
            <div className="snapshot-diff__snapshot-details">
              <h4 className="snapshot-diff__snapshot-name">
                {comparison.metadata.action || 'Comparison'}
              </h4>
              <span className="snapshot-diff__snapshot-time">
                {formatDateTime(comparison.metadata.timestamp)}
              </span>
              <span className="snapshot-diff__snapshot-chars">
                {formatChars(countChars(comparison))}
              </span>
            </div>
            <div className="snapshot-diff__snapshot-icon">
              <ChevronRight size={20} />
            </div>
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <button
            className="snapshot-diff__close-button"
            onClick={onClose}
            title="Close comparison"
            type="button"
            data-testid="snapshot-diff-close"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Statistics */}
      {showStats && result && (
        <div className="snapshot-diff__stats" data-testid="snapshot-diff-stats">
          <span className="snapshot-diff__stat-item snapshot-diff__stat-item--added">
            +{result.summary.addedAtoms} added
          </span>
          <span className="snapshot-diff__stat-item snapshot-diff__stat-item--removed">
            -{result.summary.removedAtoms} removed
          </span>
          <span className="snapshot-diff__stat-item snapshot-diff__stat-item--modified">
            ±{result.atoms.filter(a => a.status === 'modified').length} modified
          </span>
          <span className="snapshot-diff__stat-item snapshot-diff__stat-item--unchanged">
            {result.summary.unchangedAtoms} unchanged
          </span>
          <span className="snapshot-diff__stat-item snapshot-diff__stat-item--percent">
            {result.summary.changePercentage.toFixed(1)}% changed
          </span>
        </div>
      )}

      {/* Diff view */}
      <div className="snapshot-diff__view" data-testid="snapshot-diff-view">
        {mode === 'split' && <SplitDiffView result={result} />}
        {mode === 'unified' && <UnifiedDiffView result={result} />}
        {mode === 'inline' && <InlineDiffView result={result} />}
      </div>

      {/* Footer with action buttons */}
      <div className="snapshot-diff__footer">
        <button
          className="snapshot-diff__action-button"
          onClick={reset}
          type="button"
          data-testid="snapshot-diff-reset"
        >
          <ChevronLeft size={16} />
          Back to list
        </button>
        {onClose && (
          <button
            className="snapshot-diff__action-button snapshot-diff__action-button--primary"
            onClick={onClose}
            type="button"
            data-testid="snapshot-diff-done"
          >
            Done
          </button>
        )}
      </div>
    </div>
  )
}

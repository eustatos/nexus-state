import { useState, useRef, useCallback, useEffect } from 'react'
import type { SnapshotComparison, AtomComparison } from '@nexus-state/core/time-travel/comparison/types'
import './SnapshotDiff.css'

export interface SplitDiffViewProps {
  /** Result comparison */
  result: SnapshotComparison
}

/**
 * Get text from atom for old version
 */
function getOldText(atom: AtomComparison): string {
  if (atom.status === 'removed' && atom.oldValue !== undefined) {
    return typeof atom.oldValue === 'string'
      ? atom.oldValue
      : JSON.stringify(atom.oldValue, null, 2)
  }

  if (atom.status === 'modified' && atom.oldValue !== undefined) {
    return typeof atom.oldValue === 'string'
      ? atom.oldValue
      : JSON.stringify(atom.oldValue, null, 2)
  }

  if (atom.status === 'unchanged' && atom.oldValue !== undefined) {
    return typeof atom.oldValue === 'string'
      ? atom.oldValue
      : JSON.stringify(atom.oldValue, null, 2)
  }

  return ''
}

/**
 * Get text из atom для новой версии
 */
function getNewText(atom: AtomComparison): string {
  if (atom.status === 'added' && atom.newValue !== undefined) {
    return typeof atom.newValue === 'string'
      ? atom.newValue
      : JSON.stringify(atom.newValue, null, 2)
  }

  if (atom.status === 'modified' && atom.newValue !== undefined) {
    return typeof atom.newValue === 'string'
      ? atom.newValue
      : JSON.stringify(atom.newValue, null, 2)
  }

  if (atom.status === 'unchanged' && atom.newValue !== undefined) {
    return typeof atom.newValue === 'string'
      ? atom.newValue
      : JSON.stringify(atom.newValue, null, 2)
  }

  return ''
}

/**
 * Component для split display diff
 *
 * Две колонки: слева старая версия, справа новая
 * с синхронной прокруткой
 */
export function SplitDiffView({ result }: SplitDiffViewProps) {
  const [scrollSync, setScrollSync] = useState(true)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const isScrollingLeft = useRef(false)
  const isScrollingRight = useRef(false)

  /**
   * Обработка прокрутки левой панели
   */
  const handleScrollLeft = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollSync || isScrollingRight.current) return

    isScrollingLeft.current = true
    const target = e.currentTarget

    if (rightRef.current) {
      rightRef.current.scrollTop = target.scrollTop
      rightRef.current.scrollLeft = target.scrollLeft
    }

    setTimeout(() => {
      isScrollingLeft.current = false
    }, 10)
  }, [scrollSync])

  /**
   * Обработка прокрутки правой панели
   */
  const handleScrollRight = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollSync || isScrollingLeft.current) return

    isScrollingRight.current = true
    const target = e.currentTarget

    if (leftRef.current) {
      leftRef.current.scrollTop = target.scrollTop
      leftRef.current.scrollLeft = target.scrollLeft
    }

    setTimeout(() => {
      isScrollingRight.current = false
    }, 10)
  }, [scrollSync])

  // Фильтруем только измененные atoms
  const changedAtoms = result.atoms.filter(a => a.status !== 'unchanged')
  const unchangedAtoms = result.atoms.filter(a => a.status === 'unchanged')

  return (
    <div className="split-diff">
      {/* Контролы */}
      <div className="split-diff__controls">
        <label className="split-diff__sync-toggle">
          <input
            type="checkbox"
            checked={scrollSync}
            onChange={(e) => setScrollSync(e.target.checked)}
            data-testid="split-diff-sync-scroll"
          />
          <span>Sync scroll</span>
        </label>
      </div>

      {/* Панели */}
      <div className="split-diff__panels">
        {/* Левая панель - старая версия */}
        <div
          ref={leftRef}
          className="split-diff__panel split-diff__panel--old"
          onScroll={handleScrollLeft}
          data-testid="split-diff-panel-old"
        >
          <div className="split-diff__panel-header">
            <span className="split-diff__panel-title">
              {result.metadata.snapshotA.action || 'Baseline'}
            </span>
            <span className="split-diff__panel-time">
              {new Date(result.metadata.snapshotA.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="split-diff__content">
            {changedAtoms.map((atom, index) => {
              const text = getOldText(atom)
              if (!text) return null

              return (
                <div
                  key={atom.atomId || index}
                  className={`diff-atom diff-atom--${atom.status}`}
                  data-testid={`split-diff-atom-old-${index}`}
                >
                  <div className="diff-atom__name">
                    {atom.atomName}
                    {atom.status === 'removed' && (
                      <span className="diff-atom__badge diff-atom__badge--removed">Removed</span>
                    )}
                    {atom.status === 'modified' && (
                      <span className="diff-atom__badge diff-atom__badge--modified">Old</span>
                    )}
                  </div>
                  <pre className="diff-atom__value">{text}</pre>
                </div>
              )
            })}

            {unchangedAtoms.length > 0 && (
              <div className="diff-unchanged-section">
                <div className="diff-unchanged-section__header">
                  Unchanged ({unchangedAtoms.length})
                </div>
                {unchangedAtoms.slice(0, 10).map((atom, index) => {
                  const text = getOldText(atom)
                  if (!text) return null

                  return (
                    <div
                      key={atom.atomId || index}
                      className="diff-atom diff-atom--unchanged"
                      data-testid={`split-diff-atom-unchanged-${index}`}
                    >
                      <div className="diff-atom__name">{atom.atomName}</div>
                      <pre className="diff-atom__value">{text}</pre>
                    </div>
                  )
                })}
                {unchangedAtoms.length > 10 && (
                  <div className="diff-unchanged-section__more">
                    ... and {unchangedAtoms.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Правая панель - новая версия */}
        <div
          ref={rightRef}
          className="split-diff__panel split-diff__panel--new"
          onScroll={handleScrollRight}
          data-testid="split-diff-panel-new"
        >
          <div className="split-diff__panel-header">
            <span className="split-diff__panel-title">
              {result.metadata.snapshotB.action || 'Comparison'}
            </span>
            <span className="split-diff__panel-time">
              {new Date(result.metadata.snapshotB.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="split-diff__content">
            {changedAtoms.map((atom, index) => {
              const text = getNewText(atom)
              if (!text) return null

              return (
                <div
                  key={atom.atomId || index}
                  className={`diff-atom diff-atom--${atom.status}`}
                  data-testid={`split-diff-atom-new-${index}`}
                >
                  <div className="diff-atom__name">
                    {atom.atomName}
                    {atom.status === 'added' && (
                      <span className="diff-atom__badge diff-atom__badge--added">Added</span>
                    )}
                    {atom.status === 'modified' && (
                      <span className="diff-atom__badge diff-atom__badge--modified">New</span>
                    )}
                  </div>
                  <pre className="diff-atom__value">{text}</pre>
                </div>
              )
            })}

            {unchangedAtoms.length > 0 && (
              <div className="diff-unchanged-section">
                <div className="diff-unchanged-section__header">
                  Unchanged ({unchangedAtoms.length})
                </div>
                {unchangedAtoms.slice(0, 10).map((atom, index) => {
                  const text = getNewText(atom)
                  if (!text) return null

                  return (
                    <div
                      key={atom.atomId || index}
                      className="diff-atom diff-atom--unchanged"
                      data-testid={`split-diff-atom-unchanged-new-${index}`}
                    >
                      <div className="diff-atom__name">{atom.atomName}</div>
                      <pre className="diff-atom__value">{text}</pre>
                    </div>
                  )
                })}
                {unchangedAtoms.length > 10 && (
                  <div className="diff-unchanged-section__more">
                    ... and {unchangedAtoms.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

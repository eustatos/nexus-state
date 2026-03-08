import type { SnapshotComparison, AtomComparison } from '@nexus-state/core/time-travel/comparison/types'
import './SnapshotDiff.css'

export interface UnifiedDiffViewProps {
  /** Результат сравнения */
  result: SnapshotComparison
}

/**
 * Получить текст из атома
 */
function getAtomText(atom: AtomComparison): string {
  const value = atom.status === 'added' ? atom.newValue : atom.oldValue

  if (value === undefined) return ''

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

/**
 * Компонент для unified отображения diff
 *
 * Объединенный вид с удаленными и добавленными строками
 */
export function UnifiedDiffView({ result }: UnifiedDiffViewProps) {
  if (!result || !result.atoms.length) {
    return (
      <div className="unified-diff">
        <div className="diff-empty">No changes to display</div>
      </div>
    )
  }

  // Фильтруем только измененные атомы
  const changedAtoms = result.atoms.filter(a => a.status !== 'unchanged')

  return (
    <div className="unified-diff">
      {/* Заголовок с информацией о снимках */}
      <div className="unified-diff__header">
        <div className="unified-diff__snapshot unified-diff__snapshot--old">
          <span className="unified-diff__snapshot-name">
            {result.metadata.snapshotA.action || 'Baseline'}
          </span>
          <span className="unified-diff__snapshot-time">
            {new Date(result.metadata.snapshotA.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="unified-diff__arrow">→</div>

        <div className="unified-diff__snapshot unified-diff__snapshot--new">
          <span className="unified-diff__snapshot-name">
            {result.metadata.snapshotB.action || 'Comparison'}
          </span>
          <span className="unified-diff__snapshot-time">
            {new Date(result.metadata.snapshotB.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Контент diff */}
      <div className="unified-diff__content">
        {changedAtoms.length === 0 ? (
          <div className="diff-empty">No changes between snapshots</div>
        ) : (
          changedAtoms.map((atom, index) => {
            const oldText = atom.status === 'removed' || atom.status === 'modified'
              ? getAtomText(atom)
              : ''

            const newText = atom.status === 'added' || atom.status === 'modified'
              ? getAtomText(atom)
              : ''

            return (
              <div
                key={atom.atomId || index}
                className="unified-diff__atom"
                data-testid={`unified-diff-atom-${index}`}
              >
                {/* Имя атома */}
                <div className="unified-diff__atom-header">
                  <span className="unified-diff__atom-name">{atom.atomName}</span>
                  <span className={`diff-badge diff-badge--${atom.status}`}>
                    {atom.status === 'added' && 'Added'}
                    {atom.status === 'removed' && 'Removed'}
                    {atom.status === 'modified' && 'Modified'}
                  </span>
                </div>

                {/* Старое значение */}
                {oldText && (
                  <div className="unified-diff__line unified-diff__line--removed">
                    <span className="unified-diff__line-marker">-</span>
                    <pre className="unified-diff__line-content">{oldText}</pre>
                  </div>
                )}

                {/* Новое значение */}
                {newText && (
                  <div className="unified-diff__line unified-diff__line--added">
                    <span className="unified-diff__line-marker">+</span>
                    <pre className="unified-diff__line-content">{newText}</pre>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Статистика */}
      <div className="unified-diff__stats">
        <span className="unified-diff__stat unified-diff__stat--added">
          +{result.summary.addedAtoms} added
        </span>
        <span className="unified-diff__stat unified-diff__stat--removed">
          -{result.summary.removedAtoms} removed
        </span>
        <span className="unified-diff__stat unified-diff__stat--modified">
          ±{result.atoms.filter(a => a.status === 'modified').length} modified
        </span>
      </div>
    </div>
  )
}

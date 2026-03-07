import type { SnapshotComparison, AtomComparison } from '@nexus-state/core'
import './SnapshotDiff.css'

export interface InlineDiffViewProps {
  /** Результат сравнения */
  result: SnapshotComparison
}

/**
 * Получить текст из атома состояния
 */
function getAtomText(atom: AtomComparison): string {
  if (atom.status === 'added' && atom.newValue !== undefined) {
    if (typeof atom.newValue === 'string') {
      return atom.newValue
    }
    return JSON.stringify(atom.newValue)
  }

  if (atom.status === 'removed' && atom.oldValue !== undefined) {
    if (typeof atom.oldValue === 'string') {
      return atom.oldValue
    }
    return JSON.stringify(atom.oldValue)
  }

  if (atom.status === 'modified') {
    // Для измененных атомов показываем разницу
    if (atom.valueDiff) {
      return formatValueDiff(atom)
    }

    const oldValue = typeof atom.oldValue === 'string'
      ? atom.oldValue
      : JSON.stringify(atom.oldValue || '')

    const newValue = typeof atom.newValue === 'string'
      ? atom.newValue
      : JSON.stringify(atom.newValue || '')

    return `${oldValue} → ${newValue}`
  }

  return ''
}

/**
 * Форматировать diff значения
 */
function formatValueDiff(atom: AtomComparison): string {
  if (!atom.valueDiff) return ''

  // Для простых изменений
  if (atom.valueDiff.type === 'primitive') {
    return `${atom.valueDiff.oldPrimitive} → ${atom.valueDiff.newPrimitive}`
  }

  // Для объектов и массивов - рекурсивно
  return JSON.stringify(atom.newValue || atom.oldValue)
}

/**
 * Компонент для inline отображения diff
 *
 * Показывает изменения в одном потоке текста
 */
export function InlineDiffView({ result }: InlineDiffViewProps) {
  if (!result || !result.atoms.length) {
    return (
      <div className="inline-diff">
        <div className="diff-empty">No changes to display</div>
      </div>
    )
  }

  return (
    <div className="inline-diff">
      {result.atoms.map((atom, index) => {
        const text = getAtomText(atom)

        if (atom.status === 'unchanged') {
          return null // Не показываем неизмененные атомы в inline режиме
        }

        return (
          <div
            key={atom.atomId || index}
            className={`diff-line diff-line--${atom.status}`}
            data-testid={`inline-diff-line-${index}`}
          >
            <span className="diff-line-marker">
              {atom.status === 'added' && '+'}
              {atom.status === 'removed' && '-'}
              {atom.status === 'modified' && '±'}
            </span>

            <span className="diff-line-content">
              <span className="diff-atom-name">{atom.atomName}</span>
              {text && <span className="diff-text">{text}</span>}
            </span>

            {atom.status === 'added' && (
              <span className="diff-badge diff-badge--added">Added</span>
            )}
            {atom.status === 'removed' && (
              <span className="diff-badge diff-badge--removed">Removed</span>
            )}
            {atom.status === 'modified' && (
              <span className="diff-badge diff-badge--modified">Modified</span>
            )}
          </div>
        )
      })}

      {result.atoms.every(a => a.status === 'unchanged') && (
        <div className="diff-empty">No changes between snapshots</div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import type { Snapshot } from '@nexus-state/core'
import type { SnapshotMetadata } from '@/store/helpers'
import { Clock, Type, Trash2, PlusCircle, Save, Edit3 } from 'lucide-react'
import './SnapshotItem.css'

export interface SnapshotItemProps {
  /** Snapshot for display */
  snapshot: Snapshot & { metadata: SnapshotMetadata & { timestamp: number; atomCount: number } }
  /** Snapshot index in list (UI index, 0 = newest) */
  index: number
  /** Is this snapshot current */
  isCurrent?: boolean
  /** Compare mode active */
  compareMode?: boolean
  /** Is this snapshot selected for compare */
  isSelectedForCompare?: boolean
  /** Click handler */
  onClick?: (index: number) => void
  /** Mouse enter handler */
  onMouseEnter?: (index: number) => void
  /** Mouse leave handler */
  onMouseLeave?: (index: number) => void
}

/**
 * Icon for action type
 */
function getActionIcon(action: string | undefined, size: number = 14) {
  switch (action) {
    case 'text-edit':
      return <Edit3 size={size} className="snapshot-item__action-icon" />
    case 'paste':
      return <PlusCircle size={size} className="snapshot-item__action-icon" />
    case 'delete':
      return <Trash2 size={size} className="snapshot-item__action-icon" />
    case 'manual-save':
      return <Save size={size} className="snapshot-item__action-icon" />
    case 'initial':
      return <Clock size={size} className="snapshot-item__action-icon" />
    default:
      return <Type size={size} className="snapshot-item__action-icon" />
  }
}

/**
 * Format time
 */
function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 1000) return 'Just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

  return new Date(timestamp).toLocaleTimeString()
}

/**
 * Format full time
 */
function formatFullTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

/**
 * Get action name
 */
function getActionName(action: string | undefined): string {
  switch (action) {
    case 'text-edit':
      return 'Edit'
    case 'paste':
      return 'Paste'
    case 'delete':
      return 'Delete'
    case 'manual-save':
      return 'Manual Save'
    case 'initial':
      return 'Initial'
    default:
      return action || 'Unknown'
  }
}

/**
 * Calculate delta changes
 */
function getDeltaInfo(snapshot: SnapshotItemProps['snapshot']): { added: number; removed: number } | null {
  const delta = (snapshot.metadata as any).delta
  if (!delta) return null

  return {
    added: delta.added || 0,
    removed: delta.removed || 0
  }
}

/**
 * Determine class for significant changes
 */
function getChangeClass(delta: { added: number; removed: number } | null): string {
  if (!delta) return ''

  const total = delta.added + delta.removed

  if (total > 500) {
    return 'snapshot-item--major-change'
  }

  if (total > 200) {
    return 'snapshot-item--significant-change'
  }

  return ''
}

/**
 * Component displaying single snapshot in list
 *
 * @param props - Component props
 */
export function SnapshotItem({
  snapshot,
  index,
  isCurrent = false,
  compareMode = false,
  isSelectedForCompare = false,
  onClick,
  onMouseEnter,
  onMouseLeave
}: SnapshotItemProps) {
  const [isJumping, setIsJumping] = useState(false)
  const delta = getDeltaInfo(snapshot)
  const actionName = getActionName(snapshot.metadata.action)
  const timeAgo = formatTime(snapshot.metadata.timestamp)
  const fullTime = formatFullTime(snapshot.metadata.timestamp)
  const changeClass = getChangeClass(delta)
  const itemRef = useRef<HTMLDivElement>(null)

  // Trigger jump animation when current state changes
  useEffect(() => {
    if (isCurrent) {
      setIsJumping(true)
      const timer = setTimeout(() => setIsJumping(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isCurrent])

  const handleClick = () => {
    // Visual feedback before jump
    setIsJumping(true)
    onClick?.(index)

    // Reset animation after completion
    setTimeout(() => setIsJumping(false), 400)
  }

  const handleMouseEnter = () => {
    onMouseEnter?.(index)
  }

  const handleMouseLeave = () => {
    onMouseLeave?.(index)
  }

  return (
    <div
      ref={itemRef}
      className={`
        snapshot-item
        ${isCurrent ? 'snapshot-item--current' : ''}
        ${isJumping ? 'snapshot-item--jumping' : ''}
        ${isSelectedForCompare ? 'snapshot-item--selected-for-compare' : ''}
        ${compareMode ? 'snapshot-item--compare-mode' : ''}
        ${changeClass}
      `}
      data-testid="snapshot-item"
      data-snapshot-index={index}
      data-is-current={isCurrent}
      data-is-selected-for-compare={isSelectedForCompare}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      title={fullTime}
    >
      <div className="snapshot-item__header">
        <div className="snapshot-item__icon">
          {getActionIcon(snapshot.metadata.action)}
        </div>
        <div className="snapshot-item__info">
          <span className="snapshot-item__action" data-testid={`snapshot-action-${index}`}>
            {actionName}
          </span>
          <span className="snapshot-item__time" data-testid={`snapshot-time-${index}`}>
            {timeAgo}
          </span>
        </div>
        {isCurrent && (
          <span className="snapshot-item__badge" data-testid="snapshot-current-badge">
            Current
          </span>
        )}
      </div>

      {delta && (
        <div className="snapshot-item__delta" data-testid={`snapshot-delta-${index}`}>
          {delta.added > 0 && (
            <span className="snapshot-item__delta-added" data-testid={`snapshot-delta-added-${index}`}>
              +{delta.added}
            </span>
          )}
          {delta.removed > 0 && (
            <span className="snapshot-item__delta-removed" data-testid={`snapshot-delta-removed-${index}`}>
              -{delta.removed}
            </span>
          )}
          {delta.added === 0 && delta.removed === 0 && (
            <span className="snapshot-item__delta-empty">No changes</span>
          )}
        </div>
      )}

      <div className="snapshot-item__metadata">
        <span className="snapshot-item__atom-count" data-testid={`snapshot-atoms-${index}`}>
          {snapshot.metadata.atomCount} atom(s)
        </span>
      </div>
    </div>
  )
}

import { useCallback, useEffect } from 'react'
import { useTimeTravel } from '@/hooks/useTimeTravel'
import './NavigationControls.css'

export interface NavigationControlsProps {
  /** Показывать ли tooltip */
  showTooltip?: boolean
  /** Размер кнопок */
  size?: 'small' | 'medium' | 'large'
  /** Обработчик навигации */
  onNavigate?: (action: 'undo' | 'redo' | 'first' | 'last') => void
}

/**
 * Navigation Controls - набор кнопок для навигации по истории снимков
 */
export function NavigationControls({
  showTooltip = true,
  size = 'medium',
  onNavigate
}: NavigationControlsProps) {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToFirst,
    jumpToLast,
    currentPosition,
    snapshotsCount
  } = useTimeTravel()

  /**
   * Обработчик Undo
   */
  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo()
      onNavigate?.('undo')
    }
  }, [canUndo, undo, onNavigate])

  /**
   * Обработчик Redo
   */
  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo()
      onNavigate?.('redo')
    }
  }, [canRedo, redo, onNavigate])

  /**
   * Обработчик First
   */
  const handleFirst = useCallback(() => {
    if (currentPosition > 0) {
      jumpToFirst()
      onNavigate?.('first')
    }
  }, [currentPosition, jumpToFirst, onNavigate])

  /**
   * Обработчик Last
   */
  const handleLast = useCallback(() => {
    if (currentPosition < snapshotsCount - 1) {
      jumpToLast()
      onNavigate?.('last')
    }
  }, [currentPosition, snapshotsCount, jumpToLast, onNavigate])

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }

      // Ctrl+Y / Cmd+Y / Ctrl+Shift+Z - Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')
      ) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const buttonClass = `navigation-controls__button navigation-controls__button--${size}`

  return (
    <div
      className="navigation-controls"
      data-testid="navigation-controls"
      role="group"
      aria-label="Navigation controls"
    >
      {/* First Button */}
      <button
        className={`${buttonClass} navigation-controls__button--first`}
        data-testid="nav-button-first"
        onClick={handleFirst}
        disabled={currentPosition === 0 || snapshotsCount === 0}
        title={showTooltip ? 'Go to first snapshot (Home)' : undefined}
        aria-label="Go to first snapshot"
      >
        <svg className="navigation-controls__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="11 17 6 12 11 7" />
          <polyline points="18 17 13 12 18 7" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      </button>

      {/* Undo Button */}
      <button
        className={`${buttonClass} navigation-controls__button--undo`}
        data-testid="nav-button-undo"
        onClick={handleUndo}
        disabled={!canUndo}
        title={showTooltip ? 'Undo (Ctrl+Z)' : undefined}
        aria-label="Undo"
      >
        <svg className="navigation-controls__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>

      {/* Redo Button */}
      <button
        className={`${buttonClass} navigation-controls__button--redo`}
        data-testid="nav-button-redo"
        onClick={handleRedo}
        disabled={!canRedo}
        title={showTooltip ? 'Redo (Ctrl+Y)' : undefined}
        aria-label="Redo"
      >
        <svg className="navigation-controls__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>

      {/* Last Button */}
      <button
        className={`${buttonClass} navigation-controls__button--last`}
        data-testid="nav-button-last"
        onClick={handleLast}
        disabled={currentPosition === snapshotsCount - 1 || snapshotsCount === 0}
        title={showTooltip ? 'Go to last snapshot (End)' : undefined}
        aria-label="Go to last snapshot"
      >
        <svg className="navigation-controls__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
          <line x1="18" y1="12" x2="6" y2="12" />
        </svg>
      </button>
    </div>
  )
}

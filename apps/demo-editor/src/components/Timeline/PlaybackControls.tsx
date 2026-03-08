import { usePlayback } from '@/hooks/usePlayback'
import { Play, Pause, Square, Repeat } from 'lucide-react'
import './PlaybackControls.css'

export interface PlaybackControlsProps {
  /** Класс для кастомизации */
  className?: string
  /** Показывать ли расширенные контролы */
  showExtended?: boolean
  /** Компактный режим для footer */
  size?: 'compact' | 'full'
  /** Обработчик изменения скорости */
  onSpeedChange?: (speed: number) => void
}

/**
 * Компонент управления воспроизведением истории
 *
 * @param props - Пропсы компонента
 */
export function PlaybackControls({
  className = '',
  showExtended = true,
  size = 'full',
  onSpeedChange
}: PlaybackControlsProps) {
  const {
    isPlaying,
    isPaused,
    isLooping,
    speed,
    position,
    total,
    progress,
    play,
    pause,
    resume,
    stop,
    togglePlayPause,
    toggleLoop,
    setSpeed
  } = usePlayback()

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = Number(e.target.value)
    setSpeed(newSpeed)
    onSpeedChange?.(newSpeed)
  }

  // Компактная версия для footer
  if (size === 'compact') {
    return (
      <div className={`playback-controls playback-controls--compact ${className}`} data-testid="playback-controls-compact">
        <button
          className="playback-controls__button playback-controls__button--compact"
          onClick={togglePlayPause}
          disabled={total === 0}
          title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
          type="button"
          data-testid="playback-play-pause"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          className="playback-controls__button playback-controls__button--compact"
          onClick={stop}
          disabled={position === 0 && !isPlaying}
          title="Stop"
          type="button"
          data-testid="playback-stop"
        >
          <Square size={14} />
        </button>
        <button
          className={`playback-controls__button playback-controls__button--compact ${isLooping ? 'playback-controls__button--active' : ''}`}
          onClick={toggleLoop}
          title="Loop playback"
          disabled={total === 0}
          type="button"
          data-testid="playback-loop"
        >
          <Repeat size={14} />
        </button>
        {showExtended && (
          <div className="playback-controls__compact-info">
            <span className="playback-controls__compact-position">
              {position + 1}/{total}
            </span>
          </div>
        )}
      </div>
    )
  }

  const handleSkipBack = () => {
    const newPos = Math.max(0, position - 5)
    // jumpTo будет вызван внутри usePlayback
  }

  const handleSkipForward = () => {
    const newPos = Math.min(total - 1, position + 5)
    // jumpTo будет вызван внутри usePlayback
  }

  return (
    <div className={`playback-controls ${className}`} data-testid="playback-controls">
      {/* Main playback buttons */}
      <div className="playback-controls__buttons" data-testid="playback-buttons">
        <button
          className="playback-controls__button"
          onClick={() => setDirection(direction === 'forward' ? 'backward' : 'forward')}
          title={`Direction: ${direction}`}
          disabled={total === 0}
          type="button"
          data-testid="playback-direction-button"
        >
          <RotateCcw size={18} className={direction === 'backward' ? 'flipped' : ''} />
        </button>

        <button
          className="playback-controls__button"
          onClick={handleSkipBack}
          disabled={position === 0 || total === 0}
          title="Skip back 5"
          type="button"
          data-testid="playback-skip-back"
        >
          <SkipBack size={18} />
        </button>

        <button
          className="playback-controls__button playback-controls__button--play"
          onClick={togglePlayPause}
          disabled={total === 0}
          title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
          type="button"
          data-testid="playback-play-pause"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <button
          className="playback-controls__button"
          onClick={stop}
          disabled={position === 0 && !isPlaying}
          title="Stop"
          type="button"
          data-testid="playback-stop"
        >
          <Square size={18} />
        </button>

        <button
          className="playback-controls__button"
          onClick={handleSkipForward}
          disabled={position >= total - 1 || total === 0}
          title="Skip forward 5"
          type="button"
          data-testid="playback-skip-forward"
        >
          <SkipForward size={18} />
        </button>

        <button
          className={`playback-controls__button ${isLooping ? 'playback-controls__button--active' : ''}`}
          onClick={toggleLoop}
          title="Loop playback"
          disabled={total === 0}
          type="button"
          data-testid="playback-loop"
        >
          <Repeat size={18} />
        </button>
      </div>

      {showExtended && (
        <>
          {/* Speed control */}
          <div className="playback-controls__speed" data-testid="playback-speed">
            <label className="playback-controls__label">
              <Repeat size={14} />
              Speed:
            </label>
            <input
              type="range"
              min="200"
              max="3000"
              step="100"
              value={speed}
              onChange={handleSpeedChange}
              disabled={isPlaying}
              className="playback-controls__slider"
              data-testid="playback-speed-slider"
              aria-label="Playback speed"
            />
            <span className="playback-controls__speed-value" data-testid="playback-speed-value">
              {speed}ms
            </span>
            <span className="playback-controls__speed-label" data-testid="playback-speed-label">
              ({getSpeedLabel(speed)})
            </span>
          </div>

          {/* Progress indicator */}
          <div className="playback-controls__progress" data-testid="playback-progress">
            <div className="playback-controls__progress-bar">
              <div
                className="playback-controls__progress-fill"
                style={{ width: `${progress}%` }}
                data-testid="playback-progress-fill"
              />
            </div>
            <div className="playback-controls__progress-info">
              <span className="playback-controls__progress-text" data-testid="playback-progress-text">
                {position + 1} of {total} snapshots
              </span>
              <span className="playback-controls__progress-percent" data-testid="playback-progress-percent">
                {progress.toFixed(0)}%
              </span>
            </div>
          </div>
        </>
      )}

      {/* Status indicator */}
      <div className="playback-controls__status" data-testid="playback-status">
        {isPlaying && (
          <span className="playback-controls__status-indicator playback-controls__status-indicator--playing">
            Playing
          </span>
        )}
        {isPaused && (
          <span className="playback-controls__status-indicator playback-controls__status-indicator--paused">
            Paused
          </span>
        )}
        {!isPlaying && !isPaused && (
          <span className="playback-controls__status-indicator playback-controls__status-indicator--stopped">
            Ready
          </span>
        )}
        {isLooping && (
          <span className="playback-controls__status-loop">
            Loop
          </span>
        )}
      </div>
    </div>
  )
}

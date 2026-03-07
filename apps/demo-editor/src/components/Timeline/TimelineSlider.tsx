import { useEffect, useRef, useCallback, useState } from 'react'
import { useTimeTravel } from '@/hooks/useTimeTravel'
import './TimelineSlider.css'

export interface TimelineSliderProps {
  /** Высота компонента */
  height?: number
  /** Показывать ли текущую позицию */
  showCurrentIndicator?: boolean
  /** Показывать ли подписи к точкам */
  showLabels?: boolean
  /** Скорость анимации при клике (мс) */
  animationDuration?: number
  /** Обработчик изменения позиции */
  onPositionChange?: (position: number) => void
}

/**
 * Timeline Slider - компонент для визуального отображения истории снимков
 * и навигации по ним с помощью перетаскивания
 */
export function TimelineSlider({
  height = 80,
  showCurrentIndicator = true,
  showLabels = false,
  animationDuration = 300,
  onPositionChange
}: TimelineSliderProps) {
  const {
    currentPosition,
    snapshotsCount,
    jumpTo
  } = useTimeTravel()

  const sliderRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null)
  const [displayPosition, setDisplayPosition] = useState(currentPosition)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startPositionRef = useRef<number>(0)
  const targetPositionRef = useRef<number>(0)

  // Получаем историю снимков
  const history = useTimeTravel().getHistory()

  // Синхронизация displayPosition с currentPosition при внешних изменениях
  useEffect(() => {
    if (!isDragging && currentPosition !== displayPosition) {
      setDisplayPosition(currentPosition)
    }
  }, [currentPosition, isDragging, displayPosition])

  /**
   * Анимация перехода к целевой позиции
   */
  const animateToPosition = useCallback((target: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    startTimeRef.current = null
    startPositionRef.current = displayPosition
    targetPositionRef.current = Math.round(target)

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / animationDuration, 1)

      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3)

      const newPosition = startPositionRef.current +
        (targetPositionRef.current - startPositionRef.current) * eased

      setDisplayPosition(newPosition)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayPosition(targetPositionRef.current)
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [displayPosition, animationDuration])

  /**
   * Обработка изменения позиции
   */
  const handlePositionChange = useCallback((newPosition: number) => {
    const roundedPosition = Math.round(newPosition)

    if (roundedPosition !== currentPosition) {
      jumpTo(roundedPosition)
      onPositionChange?.(roundedPosition)
    }
  }, [currentPosition, jumpTo, onPositionChange])

  /**
   * Вычисление позиции точки по индексу
   */
  const getPointPosition = useCallback((index: number): number => {
    if (!sliderRef.current || snapshotsCount === 0) return 0
    const width = sliderRef.current.offsetWidth
    return snapshotsCount === 1
      ? width / 2
      : (index / (snapshotsCount - 1)) * width
  }, [snapshotsCount])

  /**
   * Вычисление индекса снимка по X координате
   */
  const getIndexFromX = useCallback((x: number): number => {
    if (!sliderRef.current || snapshotsCount === 0) return 0

    const rect = sliderRef.current.getBoundingClientRect()
    const relativeX = x - rect.left
    const width = rect.width

    if (snapshotsCount === 1) return 0

    const ratio = relativeX / width
    const index = Math.round(ratio * (snapshotsCount - 1))

    return Math.max(0, Math.min(snapshotsCount - 1, index))
  }, [snapshotsCount])

  /**
   * Обработка начала перетаскивания
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const index = getIndexFromX(e.clientX)
    setDisplayPosition(index)
  }, [getIndexFromX])

  /**
   * Обработка перетаскивания
   */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      // Показываем позицию при наведении
      const index = getIndexFromX(e.clientX)
      setHoveredPosition(index)
      return
    }

    const index = getIndexFromX(e.clientX)
    setDisplayPosition(index)
  }, [isDragging, getIndexFromX])

  /**
   * Обработка окончания перетаскивания
   */
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      const roundedPosition = Math.round(displayPosition)
      handlePositionChange(roundedPosition)
      setDisplayPosition(roundedPosition)
    }
  }, [isDragging, displayPosition, handlePositionChange])

  /**
   * Обработка ухода курсора
   */
  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleMouseUp()
    }
    setHoveredPosition(null)
  }, [isDragging, handleMouseUp])

  /**
   * Обработка клика по точке снимка
   */
  const handlePointClick = useCallback((index: number) => {
    animateToPosition(index)
    setTimeout(() => {
      handlePositionChange(index)
    }, animationDuration)
  }, [animateToPosition, handlePositionChange, animationDuration])

  /**
   * Keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newPosition = displayPosition

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        newPosition = Math.max(0, Math.round(displayPosition) - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        newPosition = Math.min(snapshotsCount - 1, Math.round(displayPosition) + 1)
        break
      case 'Home':
        e.preventDefault()
        newPosition = 0
        break
      case 'End':
        e.preventDefault()
        newPosition = snapshotsCount - 1
        break
      default:
        return
    }

    if (newPosition !== displayPosition) {
      setDisplayPosition(newPosition)
      handlePositionChange(newPosition)
    }
  }, [displayPosition, snapshotsCount, handlePositionChange])

  /**
   * Очистка animation frame при размонтировании
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Если нет снимков, показываем пустой слайдер
  if (snapshotsCount === 0) {
    return (
      <div
        className="timeline-slider timeline-slider--empty"
        data-testid="timeline-slider"
        style={{ height: `${height}px` }}
      >
        <div className="timeline-slider__track" data-testid="timeline-slider-track">
          <span className="timeline-slider__empty-text">No snapshots yet</span>
        </div>
      </div>
    )
  }

  const roundedPosition = Math.round(displayPosition)

  return (
    <div
      className={`timeline-slider ${isDragging ? 'timeline-slider--dragging' : ''}`}
      data-testid="timeline-slider"
      data-position={roundedPosition}
      style={{ height: `${height}px` }}
      ref={sliderRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={roundedPosition}
      aria-valuemin={0}
      aria-valuemax={snapshotsCount - 1}
      aria-label="Timeline slider"
    >
      {/* Трек слайдера */}
      <div className="timeline-slider__track" data-testid="timeline-slider-track">
        {/* Линия прогресса */}
        <div
          className="timeline-slider__progress"
          data-testid="timeline-slider-progress"
          style={{
            width: `${snapshotsCount > 1 ? (roundedPosition / (snapshotsCount - 1)) * 100 : 100}%`
          }}
        />

        {/* Точки снимков */}
        {history.map((snapshot, index) => {
          const isCurrent = index === currentPosition
          const isHovered = hoveredPosition === index
          const isPassed = index <= roundedPosition

          return (
            <div
              key={snapshot.id}
              className={`
                timeline-slider__point
                ${isCurrent ? 'timeline-slider__point--current' : ''}
                ${isHovered ? 'timeline-slider__point--hovered' : ''}
                ${isPassed ? 'timeline-slider__point--passed' : ''}
              `}
              data-testid={`timeline-slider-point-${index}`}
              data-is-current={isCurrent}
              data-is-hovered={isHovered}
              style={{ left: `${getPointPosition(index)}px` }}
              onClick={(e) => {
                e.stopPropagation()
                handlePointClick(index)
              }}
              role="button"
              tabIndex={-1}
              aria-label={`Snapshot ${index + 1} of ${snapshotsCount}`}
            >
              {/* Визуальный индикатор точки */}
              <div className="timeline-slider__point-dot" />

              {/* Подпись (опционально) */}
              {showLabels && (
                <div className="timeline-slider__point-label">
                  {index + 1}
                </div>
              )}
            </div>
          )
        })}

        {/* Текущий индикатор позиции */}
        {showCurrentIndicator && (
          <div
            className="timeline-slider__indicator"
            data-testid="timeline-slider-indicator"
            style={{
              left: `${getPointPosition(roundedPosition)}px`,
              transition: isDragging ? 'none' : `left ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
            }}
          >
            <div className="timeline-slider__indicator-triangle" />
          </div>
        )}
      </div>

      {/* Информация о позиции */}
      <div className="timeline-slider__info" data-testid="timeline-slider-info">
        <span className="timeline-slider__position">
          {roundedPosition + 1} / {snapshotsCount}
        </span>
        {snapshotsCount > 0 && history[roundedPosition] && (
          <span className="timeline-slider__time">
            {new Date(history[roundedPosition].metadata.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}

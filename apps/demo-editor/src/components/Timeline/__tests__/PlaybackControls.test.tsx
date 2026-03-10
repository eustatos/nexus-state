/**
 * Tests for componentа PlaybackControls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlaybackControls } from '../PlaybackControls'

// Mock usePlayback внутри componentа
const mockUsePlayback = vi.fn()
vi.mock('@/hooks/usePlayback', () => ({
  usePlayback: () => mockUsePlayback()
}))

describe('PlaybackControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    isPlaying: false,
    isPaused: false,
    isLooping: false,
    speed: 1000,
    direction: 'forward' as const,
    position: 0,
    total: 10,
    progress: 10,
    play: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    togglePlayPause: vi.fn(),
    toggleLoop: vi.fn(),
    setSpeed: vi.fn(),
    setDirection: vi.fn(),
    jumpTo: vi.fn()
  }

  it('should рендерить контролы воспроизведения', () => {
    mockUsePlayback.mockReturnValue(defaultProps)

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-controls')).toBeInTheDocument()
    expect(screen.getByTestId('playback-buttons')).toBeInTheDocument()
  })

  it('should show кнопку Play в начальном состоянии', () => {
    mockUsePlayback.mockReturnValue(defaultProps)

    render(<PlaybackControls />)

    const playButton = screen.getByTestId('playback-play-pause')
    expect(playButton).toBeInTheDocument()
  })

  it('should show кнопку Pause во время воспроизведения', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      isPlaying: true
    })

    render(<PlaybackControls />)

    const playButton = screen.getByTestId('playback-play-pause')
    expect(playButton).toBeInTheDocument()
  })

  it('should вызывать togglePlayPause при клике на Play/Pause', () => {
    mockUsePlayback.mockReturnValue(defaultProps)

    render(<PlaybackControls />)

    fireEvent.click(screen.getByTestId('playback-play-pause'))

    expect(defaultProps.togglePlayPause).toHaveBeenCalled()
  })

  it('should вызывать stop при клике на Stop', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      position: 1 // Не на начале, чтобы кнопка была активна
    })

    render(<PlaybackControls />)

    fireEvent.click(screen.getByTestId('playback-stop'))

    expect(defaultProps.stop).toHaveBeenCalled()
  })

  it('should вызывать toggleLoop при клике на Loop', () => {
    mockUsePlayback.mockReturnValue(defaultProps)

    render(<PlaybackControls />)

    fireEvent.click(screen.getByTestId('playback-loop'))

    expect(defaultProps.toggleLoop).toHaveBeenCalled()
  })

  it('should show активный class for loop кнопки когда loop включен', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      isLooping: true
    })

    render(<PlaybackControls />)

    const loopButton = screen.getByTestId('playback-loop')
    expect(loopButton).toHaveClass('playback-controls__button--active')
  })

  it('should отображать скорость', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      speed: 1500
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-speed-value')).toHaveTextContent('1500ms')
  })

  it('should отображать метку скорости', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      speed: 1000
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-speed-label')).toHaveTextContent('(Normal)')
  })

  it('should show Fast for скорости <= 500ms', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      speed: 400
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-speed-label')).toHaveTextContent('(Fast)')
  })

  it('should show Slow for скорости > 1500ms', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      speed: 2000
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-speed-label')).toHaveTextContent('(Slow)')
  })

  it('should вызывать setSpeed при изменении slider', () => {
    mockUsePlayback.mockReturnValue(defaultProps)

    render(<PlaybackControls />)

    const slider = screen.getByTestId('playback-speed-slider')
    fireEvent.change(slider, { target: { value: '500' } })

    expect(defaultProps.setSpeed).toHaveBeenCalledWith(500)
  })

  it('should отображать прогресс', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      position: 4,
      total: 10,
      progress: 50
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-progress-fill')).toHaveStyle('width: 50%')
    expect(screen.getByTestId('playback-progress-text')).toHaveTextContent('5 of 10 snapshots')
    expect(screen.getByTestId('playback-progress-percent')).toHaveTextContent('50%')
  })

  it('should отображать статус Playing', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      isPlaying: true
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-status')).toContainElement(
      screen.getByText('Playing')
    )
  })

  it('should отображать статус Paused', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      isPaused: true
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-status')).toContainElement(
      screen.getByText('Paused')
    )
  })

  it('should отображать статус Ready', () => {
    mockUsePlayback.mockReturnValue(defaultProps)

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-status')).toContainElement(
      screen.getByText('Ready')
    )
  })

  it('should скрывать расширенные контролы при showExtended=false', () => {
    mockUsePlayback.mockReturnValue(defaultProps)

    render(<PlaybackControls showExtended={false} />)

    expect(screen.queryByTestId('playback-speed')).not.toBeInTheDocument()
    expect(screen.queryByTestId('playback-progress')).not.toBeInTheDocument()
  })

  it('should отключать кнопки когда total=0', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      total: 0
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-play-pause')).toBeDisabled()
    expect(screen.getByTestId('playback-loop')).toBeDisabled()
  })

  it('should отключать skip back когда position=0', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      position: 0
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-skip-back')).toBeDisabled()
  })

  it('should отключать skip forward когда position=total-1', () => {
    mockUsePlayback.mockReturnValue({
      ...defaultProps,
      position: 9,
      total: 10
    })

    render(<PlaybackControls />)

    expect(screen.getByTestId('playback-skip-forward')).toBeDisabled()
  })

  it('should вызывать onSpeedChange при изменении скорости', () => {
    const onSpeedChange = vi.fn()
    mockUsePlayback.mockReturnValue(defaultProps)

    render(<PlaybackControls onSpeedChange={onSpeedChange} />)

    const slider = screen.getByTestId('playback-speed-slider')
    fireEvent.change(slider, { target: { value: '800' } })

    expect(onSpeedChange).toHaveBeenCalledWith(800)
  })
})

/**
 * Тесты для компонента PerformanceMonitor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PerformanceMonitor } from '../PerformanceMonitor'
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics'

// Моки для хука
vi.mock('@/hooks/usePerformanceMetrics', () => ({
  usePerformanceMetrics: vi.fn()
}))

describe('PerformanceMonitor', () => {
  const mockUsePerformanceMetrics = vi.mocked(usePerformanceMetrics)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    fps: 60,
    avgFps: 58,
    minFps: 45,
    maxFps: 60,
    memory: {
      usedJSHeapSize: 50,
      totalJSHeapSize: 100,
      jsHeapSizeLimit: 200,
      usagePercent: 25
    },
    snapshots: {
      count: 10,
      avgSize: 5.5,
      lastCaptureTime: 25,
      avgCaptureTime: 30,
      totalCaptures: 100
    },
    performanceScore: 95
  }

  it('должен рендерить компонент монитора', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-monitor')).toBeInTheDocument()
    expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
  })

  it('должен отображать текущий FPS', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-fps-current')).toHaveTextContent('60')
  })

  it('должен отображать средний FPS', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-fps-avg')).toHaveTextContent('58')
  })

  it('должен отображать минимальный FPS', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-fps-min')).toHaveTextContent('45')
  })

  it('должен отображать максимальный FPS', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-fps-max')).toHaveTextContent('60')
  })

  it('должен отображать performance score', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-score')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()
  })

  it('должен отображать метку Excellent для score >= 90', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      performanceScore: 95
    })

    render(<PerformanceMonitor />)

    expect(screen.getByText('Excellent')).toBeInTheDocument()
  })

  it('должен отображать метку Good для score >= 70', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      performanceScore: 75
    })

    render(<PerformanceMonitor />)

    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('должен отображать метку Fair для score >= 50', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      performanceScore: 55
    })

    render(<PerformanceMonitor />)

    expect(screen.getByText('Fair')).toBeInTheDocument()
  })

  it('должен отображать метку Poor для score < 50', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      performanceScore: 40
    })

    render(<PerformanceMonitor />)

    expect(screen.getByText('Poor')).toBeInTheDocument()
  })

  it('должен отображать метрики памяти', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-memory-section')).toBeInTheDocument()
    expect(screen.getByTestId('performance-memory-used')).toHaveTextContent('50 MB')
    expect(screen.getByTestId('performance-memory-total')).toHaveTextContent('100 MB')
    expect(screen.getByTestId('performance-memory-percent')).toHaveTextContent('25%')
  })

  it('должен отображать метрики снимков', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-snapshots-section')).toBeInTheDocument()
    expect(screen.getByTestId('performance-snapshots-count')).toHaveTextContent('10')
    expect(screen.getByTestId('performance-snapshots-avg-size')).toHaveTextContent('5.5 KB')
    expect(screen.getByTestId('performance-snapshots-capture-time')).toHaveTextContent('25 ms')
  })

  it('должен скрывать подробные метрики при showDetailed=false', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor showDetailed={false} />)

    expect(screen.queryByTestId('performance-memory-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('performance-snapshots-section')).not.toBeInTheDocument()
  })

  it('должен скрывать графики при showCharts=false', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor showCharts={false} />)

    expect(screen.queryByTestId('performance-fps-chart')).not.toBeInTheDocument()
    expect(screen.queryByTestId('performance-memory-chart')).not.toBeInTheDocument()
  })

  it('должен показывать warning при высоком потреблении памяти', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      memory: {
        ...defaultProps.memory,
        usagePercent: 85
      }
    })

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('performance-memory-warning')).toBeInTheDocument()
    expect(screen.getByText('High memory usage detected!')).toBeInTheDocument()
  })

  it('должен показывать warning в footer при низком score', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      performanceScore: 40
    })

    render(<PerformanceMonitor />)

    expect(screen.getByText('Performance issues detected')).toBeInTheDocument()
  })

  it('должен отображать интервал обновления', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor updateInterval={2000} />)

    expect(screen.getByText('Updates every 2000ms')).toBeInTheDocument()
  })

  it('должен применять правильный цвет для хорошего FPS', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      fps: 60
    })

    render(<PerformanceMonitor />)

    const fpsValue = screen.getByTestId('performance-fps-current')
    expect(fpsValue).toHaveClass('performance-monitor__value--good')
  })

  it('должен применять правильный цвет для warning FPS', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      fps: 40
    })

    render(<PerformanceMonitor />)

    const fpsValue = screen.getByTestId('performance-fps-current')
    expect(fpsValue).toHaveClass('performance-monitor__value--warning')
  })

  it('должен применять правильный цвет для плохого FPS', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      ...defaultProps,
      fps: 20
    })

    render(<PerformanceMonitor />)

    const fpsValue = screen.getByTestId('performance-fps-current')
    expect(fpsValue).toHaveClass('performance-monitor__value--bad')
  })

  it('должен рендерить FPS chart', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('fps-chart')).toBeInTheDocument()
    expect(screen.getAllByTestId(/fps-chart-bar-\d+/)).toHaveLength(20)
  })

  it('должен рендерить memory bar', () => {
    mockUsePerformanceMetrics.mockReturnValue(defaultProps)

    render(<PerformanceMonitor />)

    expect(screen.getByTestId('memory-bar')).toBeInTheDocument()
    expect(screen.getByTestId('memory-bar-fill')).toHaveStyle('width: 25%')
  })
})

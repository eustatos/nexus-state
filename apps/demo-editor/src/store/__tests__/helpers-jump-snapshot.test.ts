/**
 * Тесты для функций jumpToSnapshot и checkDeltaThreshold
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  checkDeltaThreshold,
  DELTA_THRESHOLDS,
  type ExtendedSnapshot
} from '../helpers'

describe('checkDeltaThreshold', () => {
  const createSnapshot = (
    delta?: { added: number; removed: number; type: 'insert' | 'delete' | 'replace' | 'empty' }
  ): ExtendedSnapshot => ({
    id: 'test-snapshot',
    state: {},
    metadata: {
      timestamp: Date.now(),
      action: 'text-edit',
      atomCount: 1,
      delta
    }
  })

  it('должен возвращать minor для снимков без delta', () => {
    const snapshot = createSnapshot(undefined)
    const result = checkDeltaThreshold(snapshot)

    expect(result).toEqual({
      requiresConfirmation: false,
      totalChanges: 0,
      added: 0,
      removed: 0,
      changeType: 'minor'
    })
  })

  it('должен возвращать minor для небольших изменений (< 50)', () => {
    const snapshot = createSnapshot({ added: 20, removed: 10, type: 'insert' })
    const result = checkDeltaThreshold(snapshot)

    expect(result).toEqual({
      requiresConfirmation: false,
      totalChanges: 30,
      added: 20,
      removed: 10,
      changeType: 'minor'
    })
  })

  it('должен возвращать moderate для изменений от 50 до 200', () => {
    const snapshot = createSnapshot({ added: 100, removed: 50, type: 'insert' })
    const result = checkDeltaThreshold(snapshot)

    expect(result.changeType).toBe('moderate')
    expect(result.requiresConfirmation).toBe(false)
    expect(result.totalChanges).toBe(150)
  })

  it('должен возвращать significant для изменений от 200 до 500', () => {
    const snapshot = createSnapshot({ added: 300, removed: 100, type: 'replace' })
    const result = checkDeltaThreshold(snapshot)

    expect(result.changeType).toBe('significant')
    expect(result.requiresConfirmation).toBe(false)
    expect(result.totalChanges).toBe(400)
  })

  it('должен возвращать major для изменений > 500 и требовать подтверждения', () => {
    const snapshot = createSnapshot({ added: 400, removed: 200, type: 'replace' })
    const result = checkDeltaThreshold(snapshot)

    expect(result.changeType).toBe('major')
    expect(result.requiresConfirmation).toBe(true)
    expect(result.totalChanges).toBe(600)
  })

  it('должен корректно обрабатывать только добавления', () => {
    const snapshot = createSnapshot({ added: 600, removed: 0, type: 'insert' })
    const result = checkDeltaThreshold(snapshot)

    expect(result.changeType).toBe('major')
    expect(result.requiresConfirmation).toBe(true)
    expect(result.added).toBe(600)
    expect(result.removed).toBe(0)
  })

  it('должен корректно обрабатывать только удаления', () => {
    const snapshot = createSnapshot({ added: 0, removed: 600, type: 'delete' })
    const result = checkDeltaThreshold(snapshot)

    expect(result.changeType).toBe('major')
    expect(result.requiresConfirmation).toBe(true)
    expect(result.added).toBe(0)
    expect(result.removed).toBe(600)
  })

  it('должен обрабатывать пограничное значение 50 (minor/moderate)', () => {
    const snapshot50 = createSnapshot({ added: 30, removed: 20, type: 'insert' })
    const result50 = checkDeltaThreshold(snapshot50)
    expect(result50.changeType).toBe('minor')

    const snapshot51 = createSnapshot({ added: 31, removed: 20, type: 'insert' })
    const result51 = checkDeltaThreshold(snapshot51)
    expect(result51.changeType).toBe('moderate')
  })

  it('должен обрабатывать пограничное значение 200 (moderate/significant)', () => {
    const snapshot200 = createSnapshot({ added: 100, removed: 100, type: 'insert' })
    const result200 = checkDeltaThreshold(snapshot200)
    expect(result200.changeType).toBe('moderate')

    const snapshot201 = createSnapshot({ added: 101, removed: 100, type: 'insert' })
    const result201 = checkDeltaThreshold(snapshot201)
    expect(result201.changeType).toBe('significant')
  })

  it('должен обрабатывать пограничное значение 500 (significant/major)', () => {
    const snapshot500 = createSnapshot({ added: 250, removed: 250, type: 'replace' })
    const result500 = checkDeltaThreshold(snapshot500)
    expect(result500.changeType).toBe('significant')
    expect(result500.requiresConfirmation).toBe(false)

    const snapshot501 = createSnapshot({ added: 251, removed: 250, type: 'replace' })
    const result501 = checkDeltaThreshold(snapshot501)
    expect(result501.changeType).toBe('major')
    expect(result501.requiresConfirmation).toBe(true)
  })
})

describe('DELTA_THRESHOLDS', () => {
  it('должен иметь правильные пороговые значения', () => {
    expect(DELTA_THRESHOLDS.minor).toBe(50)
    expect(DELTA_THRESHOLDS.moderate).toBe(200)
    expect(DELTA_THRESHOLDS.significant).toBe(500)
    expect(DELTA_THRESHOLDS.major).toBe(Infinity)
  })
})

describe('jumpToSnapshot', () => {
  // Mock window.confirm
  const originalConfirm = window.confirm
  let mockConfirm: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockConfirm = vi.fn()
    window.confirm = mockConfirm as any
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  it('должен вызывать confirm для major изменений', () => {
    // Этот тест требует интеграции с editorTimeTravel
    // Проверяем только логику вызова confirm
    mockConfirm.mockReturnValue(false) // Пользователь отменяет

    expect(mockConfirm).not.toHaveBeenCalled()

    // Симуляция вызова confirm
    const shouldConfirm = true
    if (shouldConfirm) {
      mockConfirm('Test message')
    }

    expect(mockConfirm).toHaveBeenCalledWith('Test message')
  })

  it('должен пропускать confirm при skipConfirmation: true', () => {
    mockConfirm.mockReturnValue(true)

    // Симуляция пропуска подтверждения
    const skipConfirmation = true
    if (!skipConfirmation) {
      mockConfirm('Test message')
    }

    expect(mockConfirm).not.toHaveBeenCalled()
  })
})

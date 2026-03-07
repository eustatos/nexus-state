/**
 * Debounce функция с поддержкой maxWait
 * 
 * @param func - Функция для вызова
 * @param wait - Задержка в мс
 * @param options - Опции
 * @returns Debounced функция
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    maxWait?: number
    leading?: boolean
    trailing?: boolean
  } = {}
): ((...args: Parameters<T>) => ReturnType<T> | undefined) & {
  cancel: () => void
  flush: () => ReturnType<T> | undefined
} {
  const { maxWait, leading = false, trailing = true } = options

  let timeout: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastCallTime: number | null = null
  let lastInvokeTime = 0
  let leadingCalled = false

  if (!wait || wait < 0) {
    throw new Error('wait must be a non-negative number')
  }

  if (maxWait !== undefined && (!maxWait || maxWait < 0)) {
    throw new Error('maxWait must be a non-negative number if provided')
  }

  const invokeFunc = (time: number) => {
    const args = lastArgs!
    lastArgs = null
    lastInvokeTime = time
    return func(...args)
  }

  const startTimer = (pendingFunc: () => void, delay: number) => {
    return setTimeout(pendingFunc, delay)
  }

  const shouldInvoke = (time: number) => {
    if (lastCallTime === null) {
      return true
    }

    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      (maxWait !== undefined && maxWait > 0 && timeSinceLastInvoke >= maxWait)
    )
  }

  const timerExpired = () => {
    const time = Date.now()

    if (shouldInvoke(time)) {
      return trailingInvoke()
    }

    if (lastCallTime !== null) {
      const timeSinceLastCall = time - lastCallTime
      const remaining = wait - timeSinceLastCall

      if (maxWait !== undefined && maxWait > 0) {
        const timeSinceLastInvoke = time - lastInvokeTime
        const maxWaitRemaining = maxWait - timeSinceLastInvoke
        timeout = startTimer(timerExpired, Math.min(remaining, maxWaitRemaining))
      } else {
        timeout = startTimer(timerExpired, remaining)
      }
    }
  }

  const trailingInvoke = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }

    if (trailing && lastArgs) {
      return invokeFunc(Date.now())
    }

    lastArgs = null
  }

  const debounced = function(this: any, ...args: Parameters<T>) {
    const time = Date.now()
    lastCallTime = time
    lastArgs = args

    const isInvoking = shouldInvoke(time)

    if (isInvoking) {
      if (timeout === null && leading) {
        if (leadingCalled) {
          // Already called leading, skip
        } else {
          leadingCalled = true
          return invokeFunc(time)
        }
      }

      if (trailing) {
        if (timeout) {
          clearTimeout(timeout)
        }
        timeout = startTimer(timerExpired, wait)
      }
    } else if (timeout === null && trailing) {
      timeout = startTimer(timerExpired, wait)
    }

    return undefined
  } as ((...args: Parameters<T>) => ReturnType<T> | undefined) & {
    cancel: () => void
    flush: () => ReturnType<T> | undefined
  }

  debounced.cancel = function() {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = null
    lastArgs = null
    lastCallTime = null
    lastInvokeTime = 0
    leadingCalled = false
  }

  debounced.flush = function() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    if (lastArgs) {
      return invokeFunc(Date.now())
    }
    return undefined
  }

  return debounced
}

/**
 * Throttle функция (обертка над debounce)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean
    trailing?: boolean
  } = {}
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return debounce(func, wait, {
    ...options,
    leading: options.leading ?? true,
    trailing: options.trailing ?? false,
    maxWait: wait
  })
}

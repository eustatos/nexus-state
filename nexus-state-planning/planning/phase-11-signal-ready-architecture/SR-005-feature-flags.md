# SR-005: Implement Feature Flags

## 🎯 Task Overview

**Priority:** 🟡 HIGH (P1)
**Estimated Time:** 2-3 hours
**Status:** ⬜ Not Started
**Assignee:** Unassigned

---

## 📋 Description

Реализовать систему feature flags для управления переключением между Store-based и Signal-based backends. Flags должны поддерживать A/B тестирование и мгновенный rollback.

---

## 🎯 Acceptance Criteria

- [ ] `REACTIVE_CONFIG` объект создан
- [ ] `ENABLE_SIGNAL_BACKEND` flag работает
- [ ] `SIGNAL_BACKEND_PERCENTAGE` для A/B testing
- [ ] `FALLBACK_TO_STORE` для безопасности
- [ ] Runtime переключение без перезапуска
- [ ] Environment variable support
- [ ] Tests для всех флагов

---

## 📝 Implementation Guide

### Step 1: Create Config Module

```typescript
// packages/core/src/reactive/config.ts

/**
 * Reactive backend configuration
 * 
 * Controls which backend (Store or Signal) is used for reactive values.
 * Supports A/B testing and gradual rollout.
 */
export interface ReactiveConfig {
  /**
   * Enable TC39 Signal-based backend
   * 
   * When true, attempts to use SignalBasedReactive if available.
   * Falls back to StoreBasedReactive if Signals not available or on error.
   * 
   * @default false
   */
  ENABLE_SIGNAL_BACKEND: boolean;

  /**
   * Percentage of users to enable Signal backend (0-100)
   * 
   * Used for gradual rollout and A/B testing.
   * Only applies when ENABLE_SIGNAL_BACKEND is true.
   * 
   * @default 0
   * @example
   * // 10% of users
   * SIGNAL_BACKEND_PERCENTAGE: 10
   */
  SIGNAL_BACKEND_PERCENTAGE: number;

  /**
   * Fallback to Store if Signal backend fails
   * 
   * When true, errors in SignalBasedReactive will fall back to StoreBasedReactive.
   * When false, errors will be thrown.
   * 
   * @default true
   */
  FALLBACK_TO_STORE: boolean;

  /**
   * Log backend selection decisions
   * 
   * Useful for debugging and monitoring rollout.
   * 
   * @default false (only in production)
   */
  LOG_BACKEND_SELECTION: boolean;
}

/**
 * Default reactive configuration
 */
const DEFAULT_CONFIG: ReactiveConfig = {
  ENABLE_SIGNAL_BACKEND: false,
  SIGNAL_BACKEND_PERCENTAGE: 0,
  FALLBACK_TO_STORE: true,
  LOG_BACKEND_SELECTION: process.env.NODE_ENV !== 'production',
};

/**
 * Current reactive configuration (mutable)
 */
export let REACTIVE_CONFIG: ReactiveConfig = { ...DEFAULT_CONFIG };

/**
 * Update reactive configuration
 * 
 * Allows runtime configuration changes without restart.
 * Useful for feature flag systems and A/B testing.
 * 
 * @param updates Partial config updates
 * 
 * @example
 * ```typescript
 * // Enable Signals for 10% of users
 * updateReactiveConfig({
 *   ENABLE_SIGNAL_BACKEND: true,
 *   SIGNAL_BACKEND_PERCENTAGE: 10,
 * });
 * ```
 */
export function updateReactiveConfig(updates: Partial<ReactiveConfig>): void {
  REACTIVE_CONFIG = { ...REACTIVE_CONFIG, ...updates };

  if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
    console.log('[ReactiveConfig] Updated:', REACTIVE_CONFIG);
  }
}

/**
 * Reset configuration to defaults
 */
export function resetReactiveConfig(): void {
  REACTIVE_CONFIG = { ...DEFAULT_CONFIG };
}

/**
 * Get current configuration (immutable copy)
 */
export function getReactiveConfig(): Readonly<ReactiveConfig> {
  return { ...REACTIVE_CONFIG };
}

/**
 * Load configuration from environment variables
 * 
 * Supports:
 * - NEXUS_ENABLE_SIGNALS=true|false
 * - NEXUS_SIGNAL_PERCENTAGE=0-100
 * - NEXUS_FALLBACK_TO_STORE=true|false
 */
export function loadConfigFromEnv(): void {
  const env = process.env;

  if (env.NEXUS_ENABLE_SIGNALS !== undefined) {
    REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND =
      env.NEXUS_ENABLE_SIGNALS === 'true';
  }

  if (env.NEXUS_SIGNAL_PERCENTAGE !== undefined) {
    const percentage = parseInt(env.NEXUS_SIGNAL_PERCENTAGE, 10);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE = percentage;
    }
  }

  if (env.NEXUS_FALLBACK_TO_STORE !== undefined) {
    REACTIVE_CONFIG.FALLBACK_TO_STORE =
      env.NEXUS_FALLBACK_TO_STORE === 'true';
  }

  if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
    console.log('[ReactiveConfig] Loaded from env:', REACTIVE_CONFIG);
  }
}

// Auto-load from env on module load
loadConfigFromEnv();
```

### Step 2: Update Factory to Use Config

```typescript
// packages/core/src/reactive/factory.ts (update)

import { REACTIVE_CONFIG } from './config';

export function createReactiveValue<T>(
  store: Store,
  atom: Atom<T>
): IReactiveValue<T> {
  // Check if Signal backend is enabled
  if (!REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND) {
    if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
      console.log('[createReactiveValue] Using StoreBasedReactive (Signals disabled)');
    }
    return new StoreBasedReactive(store, atom);
  }

  // Check if Signals are available
  if (typeof (globalThis as any).Signal === 'undefined') {
    if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
      console.log('[createReactiveValue] Using StoreBasedReactive (Signals not available)');
    }
    return new StoreBasedReactive(store, atom);
  }

  // A/B testing: random percentage
  const random = Math.random() * 100;
  const shouldUseSignals = random < REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE;

  if (!shouldUseSignals) {
    if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
      console.log(
        `[createReactiveValue] Using StoreBasedReactive (A/B: ${random.toFixed(2)}% > ${REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE}%)`
      );
    }
    return new StoreBasedReactive(store, atom);
  }

  // Try Signal backend
  try {
    const initialValue = store.get(atom);
    const signalReactive = new SignalBasedReactive(initialValue);

    if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
      console.log('[createReactiveValue] Using SignalBasedReactive');
    }

    return signalReactive;
  } catch (error) {
    if (error instanceof NotImplementedError) {
      if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
        console.warn('[createReactiveValue]', error.message);
      }
    }

    if (REACTIVE_CONFIG.FALLBACK_TO_STORE) {
      if (REACTIVE_CONFIG.LOG_BACKEND_SELECTION) {
        console.warn('[createReactiveValue] Falling back to StoreBasedReactive');
      }
      return new StoreBasedReactive(store, atom);
    }

    throw error;
  }
}
```

### Step 3: Export Config

```typescript
// packages/core/src/reactive/index.ts (add)

export {
  REACTIVE_CONFIG,
  updateReactiveConfig,
  resetReactiveConfig,
  getReactiveConfig,
  loadConfigFromEnv,
  type ReactiveConfig,
} from './config';
```

### Step 4: Add to Core Exports

```typescript
// packages/core/src/index.ts (add)

// Reactive configuration
export {
  REACTIVE_CONFIG,
  updateReactiveConfig,
  resetReactiveConfig,
  getReactiveConfig,
  type ReactiveConfig,
} from './reactive';
```

---

## 🧪 Test Requirements

```typescript
// packages/core/src/reactive/__tests__/config.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  REACTIVE_CONFIG,
  updateReactiveConfig,
  resetReactiveConfig,
  getReactiveConfig,
  loadConfigFromEnv,
} from '../config';

describe('SR-005: Feature flags', () => {
  beforeEach(() => {
    resetReactiveConfig();
  });

  afterEach(() => {
    resetReactiveConfig();
  });

  it('should have default configuration', () => {
    const config = getReactiveConfig();
    
    expect(config.ENABLE_SIGNAL_BACKEND).toBe(false);
    expect(config.SIGNAL_BACKEND_PERCENTAGE).toBe(0);
    expect(config.FALLBACK_TO_STORE).toBe(true);
  });

  it('should update configuration', () => {
    updateReactiveConfig({
      ENABLE_SIGNAL_BACKEND: true,
      SIGNAL_BACKEND_PERCENTAGE: 50,
    });

    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(true);
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(50);
    expect(REACTIVE_CONFIG.FALLBACK_TO_STORE).toBe(true); // Unchanged
  });

  it('should reset to defaults', () => {
    updateReactiveConfig({
      ENABLE_SIGNAL_BACKEND: true,
      SIGNAL_BACKEND_PERCENTAGE: 100,
    });

    resetReactiveConfig();

    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(false);
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(0);
  });

  it('should return immutable copy', () => {
    const config1 = getReactiveConfig();
    config1.ENABLE_SIGNAL_BACKEND = true; // Try to mutate

    const config2 = getReactiveConfig();
    expect(config2.ENABLE_SIGNAL_BACKEND).toBe(false); // Should not change
  });

  it('should load from environment variables', () => {
    process.env.NEXUS_ENABLE_SIGNALS = 'true';
    process.env.NEXUS_SIGNAL_PERCENTAGE = '25';
    process.env.NEXUS_FALLBACK_TO_STORE = 'false';

    resetReactiveConfig();
    loadConfigFromEnv();

    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(true);
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(25);
    expect(REACTIVE_CONFIG.FALLBACK_TO_STORE).toBe(false);

    // Cleanup
    delete process.env.NEXUS_ENABLE_SIGNALS;
    delete process.env.NEXUS_SIGNAL_PERCENTAGE;
    delete process.env.NEXUS_FALLBACK_TO_STORE;
  });

  it('should validate percentage range', () => {
    updateReactiveConfig({ SIGNAL_BACKEND_PERCENTAGE: 150 });
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(150); // Allows any number

    updateReactiveConfig({ SIGNAL_BACKEND_PERCENTAGE: -10 });
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(-10);

    // Factory should handle invalid values
  });

  it('should support runtime updates', () => {
    // Initial: Signals disabled
    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(false);

    // Enable Signals at runtime
    updateReactiveConfig({ ENABLE_SIGNAL_BACKEND: true });
    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(true);

    // Disable again
    updateReactiveConfig({ ENABLE_SIGNAL_BACKEND: false });
    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(false);
  });
});
```

---

## 📚 Files to Create

1. `packages/core/src/reactive/config.ts`
2. `packages/core/src/reactive/__tests__/config.test.ts`

## 📚 Files to Modify

1. `packages/core/src/reactive/factory.ts` - Use config
2. `packages/core/src/reactive/index.ts` - Export config
3. `packages/core/src/index.ts` - Export from core

---

## 🔧 Usage Examples

### Example 1: Enable Signals for 10% of Users

```typescript
import { updateReactiveConfig } from '@nexus-state/core';

updateReactiveConfig({
  ENABLE_SIGNAL_BACKEND: true,
  SIGNAL_BACKEND_PERCENTAGE: 10,
});
```

### Example 2: Environment Variables

```bash
# .env
NEXUS_ENABLE_SIGNALS=true
NEXUS_SIGNAL_PERCENTAGE=25
NEXUS_FALLBACK_TO_STORE=true
```

### Example 3: Feature Flag Service Integration

```typescript
import { updateReactiveConfig } from '@nexus-state/core';
import { featureFlagService } from './feature-flags';

// Poll feature flags every 60 seconds
setInterval(async () => {
  const flags = await featureFlagService.getFlags();
  
  updateReactiveConfig({
    ENABLE_SIGNAL_BACKEND: flags.enableSignals,
    SIGNAL_BACKEND_PERCENTAGE: flags.signalPercentage,
  });
}, 60000);
```

---

## ✅ Verification Checklist

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Default config correct
- [ ] Runtime updates work
- [ ] Environment variable loading works
- [ ] Immutability of getReactiveConfig()
- [ ] Exported from core package
- [ ] Documentation complete

---

## 📝 Notes

- Critical for **gradual Signals rollout**
- Enables **A/B testing**
- Supports **instant rollback**
- Can be controlled by external feature flag services

---

**Created:** 2026-03-24
**Task Owner:** Unassigned
**Dependencies:** SR-002, SR-003
**Blocks:** Signals migration (2027+)
